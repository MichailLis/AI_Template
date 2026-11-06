#!/usr/bin/env node
// Smoke of the production topology (#136): browser -> nginx (/api rewrite) -> backend -> Postgres,
// with NO mocks. Expects the stack from docker-compose.deploy.yml to be up already (see the
// "Prod stack smoke" job in .github/workflows/ci.yml and docs/deployment-dockerhub.md):
//   docker compose -p ai_template_ci -f docker-compose.deploy.yml --env-file ci/prod-stack.env up -d --wait
// Each check below guards one release that went wrong; the issue is named next to it.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { chromium } from 'playwright';

import { fillPublicEntryForm } from './lib/e2e-public-result-flows.mjs';

const envFile = 'ci/prod-stack.env';
const composeArgs = [
  'compose',
  '-p',
  'ai_template_ci',
  '-f',
  'docker-compose.deploy.yml',
  '--env-file',
  envFile,
];

const readEnv = (name) =>
  readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find((line) => line.startsWith(`${name}=`))
    ?.slice(name.length + 1);

const baseUrl = `http://localhost:${readEnv('APP_HTTP_PORT')}`;
const adminEmail = readEnv('BOOTSTRAP_ADMIN_EMAIL');
const adminPassword = readEnv('BOOTSTRAP_ADMIN_PASSWORD');

const compose = (...args) => {
  const result = spawnSync('docker', [...composeArgs, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  }
  return result.stdout + result.stderr;
};

const check = (condition, message) => {
  if (!condition) throw new Error(message);
};

// #130: the default proxy_read_timeout (60 s) cut paid LLM calls and backup transfers with a 504.
// Checked on the config nginx actually loaded, not on the file in the repo.
const MIN_READ_TIMEOUT_SECONDS = 300;
const slowLocations = [
  '/api/admin/prompts/',
  '/api/admin/backups/download/',
  '/api/admin/backups/import',
];

const checkNginxConfig = () => {
  compose('exec', '-T', 'frontend', 'nginx', '-t');

  const dump = compose('exec', '-T', 'frontend', 'nginx', '-T').replaceAll('\r', '');
  const blocks = [...dump.matchAll(/^\s*location\s+([^{]+?)\s*\{([^{}]*)\}/gm)];
  for (const path of slowLocations) {
    const block = blocks.find(([, header]) => header.includes(path));
    check(block, `nginx has no location for ${path}`);
    const seconds = /proxy_read_timeout\s+(\d+)(s|m)?\s*;/.exec(block[2]);
    const value = seconds ? Number(seconds[1]) * (seconds[2] === 'm' ? 60 : 1) : 60;
    check(
      value >= MIN_READ_TIMEOUT_SECONDS,
      `${path}: proxy_read_timeout is ${value}s, expected at least ${MIN_READ_TIMEOUT_SECONDS}s (#130)`,
    );
  }
  console.log('✓ nginx -t, proxy_read_timeout of the slow /api locations (#130)');
};

const api = async (path, { token, method = 'GET', body } = {}) => {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  check(response.ok, `${method} /api${path} -> ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
};

const createPublicLink = async (token, suffix) => {
  const { topicId } = await api('/admin/tests', {
    token,
    method: 'POST',
    body: {
      title: `Prod stack smoke ${suffix}`,
      slug: `prod-stack-smoke-${suffix}`,
      description: 'CI',
    },
  });
  await api(`/admin/tests/${topicId}/draft/questions`, {
    token,
    method: 'POST',
    body: { type: 'OPEN_TEXT', title: 'Что вам интересно?', description: null, required: true },
  });
  await api(`/admin/tests/${topicId}/publish`, { token, method: 'POST' });
  const draft = await api(`/admin/tests/${topicId}/draft`, { token });
  const shortCode = `CI${suffix}`.toUpperCase();
  await api('/admin/tests/public-links', {
    token,
    method: 'POST',
    body: {
      publishedVersionId: draft.published.id,
      shortCode,
      maxAttemptsPerStudent: 3,
      timeLimitMinutes: null,
      allowResume: true,
      consentVersion: 'v1',
      consentText: 'Согласие для CI-проверки.',
    },
  });
  return shortCode;
};

const runBrowserScenario = async () => {
  // E2E_BROWSER_CHANNEL=chrome runs the installed Chrome locally; CI uses the Playwright Chromium.
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || undefined });
  const context = await browser.newContext({ locale: 'ru-RU' });
  const page = await context.newPage();
  const secrets = {};

  try {
    // Admin sign-in through the form. NODE_ENV=production sets Secure on the refresh cookie;
    // Chromium treats http://localhost as a secure context and keeps it.
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Пароль').fill(adminPassword);
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✓ admin signs in through the form');

    // #118: the cookie must be scoped to /api/auth/refresh (nginx proxy_cookie_path), otherwise the
    // browser never sends it and the session dies 15 minutes after sign-in.
    const refreshCookie = (await context.cookies()).find((c) => c.name === 'refreshToken');
    check(refreshCookie, 'No refreshToken cookie after sign-in');
    check(
      refreshCookie.path === '/api/auth/refresh' && refreshCookie.secure && refreshCookie.httpOnly,
      `refreshToken cookie: path=${refreshCookie.path} secure=${refreshCookie.secure} httpOnly=${refreshCookie.httpOnly}`,
    );
    secrets.refreshToken = refreshCookie.value;
    const refreshStatus = await page.evaluate(
      async () =>
        (await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })).status,
    );
    check(refreshStatus === 200, `POST /api/auth/refresh from the page -> ${refreshStatus} (#118)`);
    console.log('✓ POST /api/auth/refresh from the page -> 200 (#118)');

    const adminToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    check(adminToken, 'No accessToken in localStorage after sign-in');
    secrets.accessToken = adminToken;

    // Student path against the real backend: link -> form -> question -> finish -> result screen.
    const shortCode = await createPublicLink(adminToken, Date.now().toString(36));
    await page.goto(`${baseUrl}/t/${shortCode}`);
    await fillPublicEntryForm(page);
    await page.getByRole('button', { name: /Начать тестирование/ }).click();
    await page.waitForURL(`**/t/${shortCode}/session/*`, { timeout: 15000 });
    secrets.sessionToken = page.url().split('/session/')[1];
    await page.getByPlaceholder('Введите ответ').fill('Собираю роботов');
    await page.getByRole('button', { name: /Завершить тест/ }).click();
    await page.waitForURL(`**/t/${shortCode}/result/*`, { timeout: 15000 });
    // Without an LLM the analysis is a stub and the page says the test is finished, no analysis text.
    await page
      .getByText(/Тестирование завершено|Результат теста/)
      .first()
      .waitFor({ timeout: 15000 });
    // A reload makes nginx itself serve /t/<code>/result/<token>, the URL form that must be masked.
    await page.reload();
    await page
      .getByText(/Тестирование завершено|Результат теста/)
      .first()
      .waitFor({ timeout: 15000 });
    console.log('✓ student reaches the result screen through nginx');
  } finally {
    await browser.close();
  }
  return secrets;
};

// #151: session and result URLs are bearer links; nginx masks them in the access log. The log is
// also read for the tokens the scenario handled (JWTs, refresh token, session token).
const checkAccessLog = (secrets) => {
  const log = compose('logs', '--no-log-prefix', 'frontend');
  check(
    log.includes('/api/tests/public/sessions/***') && log.includes('/result/***'),
    'access log has no masked session/result lines: nothing to check, or the log format changed',
  );
  for (const [name, value] of Object.entries(secrets)) {
    check(value && !log.includes(value), `nginx log contains the ${name} in plain text (#151)`);
  }
  console.log('✓ nginx access log keeps session/result tokens masked (#151)');
};

try {
  checkNginxConfig();
  checkAccessLog(await runBrowserScenario());
  console.log('Prod stack smoke passed');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
