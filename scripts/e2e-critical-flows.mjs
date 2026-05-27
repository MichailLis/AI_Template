#!/usr/bin/env node
import { createServer } from 'node:net';

import { chromium } from 'playwright';

import { spawnNpm, spawnSyncNpm } from './lib/npm-runner.mjs';
import { getProcessTreeSpawnOptions, stopProcessTree } from './lib/process-tree.mjs';

const previewHost = '127.0.0.1';
let previewPort = '';
let targetUrl = '';
const mockApiOrigin = 'http://mock.api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findAvailablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.on('error', reject);
    server.listen(0, previewHost, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate a preview port'));
        return;
      }

      server.close(() => {
        resolve(String(address.port));
      });
    });
  });

const mockTopicList = {
  topics: [
    {
      id: 1,
      slug: 'javascript-basics',
      draftVersionNumber: 1,
      draftTitle: 'JavaScript Basics',
      draftQuestionCount: 1,
      publishedVersionNumber: null,
      publishedTitle: null,
      updatedAt: '2026-05-12T10:00:00Z',
      archivedAt: null,
    },
  ],
};

const mockLinkAccess = {
  shortCode: 'SMOKE',
  title: 'Smoke Public Test',
  description: 'Critical public test smoke scenario',
  educationOrganization: null,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  questionCount: 1,
  maxAttemptsPerStudent: 3,
  timeLimitMinutes: null,
  allowResume: true,
  startsAt: null,
  endsAt: null,
  consentVersion: 'v1',
  consentText: 'Smoke consent text',
};

const mockAuthResponse = {
  accessToken: 'mock-access-token',
  user: {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
  },
};

const mockSession = {
  sessionToken: 'session-smoke',
  shortCode: 'SMOKE',
  attemptNumber: 1,
  status: 'IN_PROGRESS',
  startedAt: '2026-05-12T10:00:00Z',
  expiresAt: null,
  finishedAt: null,
  timeLimitMinutes: null,
  questions: [
    {
      id: 1,
      type: 'OPEN_TEXT',
      title: 'Describe your learning experience',
      description: null,
      required: true,
      order: 1,
      settings: null,
      options: [],
      sliderBands: [],
    },
  ],
  answers: [],
};

const waitForClient = async (url, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('<div id="root"></div>')) {
          return;
        }
      }
    } catch {
      // Retry until timeout.
    }

    await sleep(500);
  }

  throw new Error(`Client preview did not become ready: ${url}`);
};

const buildClient = () => {
  const buildArgs = ['run', 'build', '--prefix', 'client'];
  const buildProcess = spawnSyncNpm(buildArgs, {
    stdio: 'inherit',
  });

  if (buildProcess.error) {
    throw buildProcess.error;
  }

  if (buildProcess.status !== 0) {
    throw new Error('Client build failed');
  }
};

const startPreview = () => {
  const previewArgs = [
    'run',
    'preview',
    '--prefix',
    'client',
    '--',
    '--host',
    previewHost,
    '--port',
    previewPort,
    '--strictPort',
  ];
  const preview = spawnNpm(
    previewArgs,
    getProcessTreeSpawnOptions({
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );

  let logs = '';
  preview.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  preview.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });

  return { preview, getLogs: () => logs };
};

const fulfillJson = async (route, body, status = 200) => {
  await route.fulfill({
    status,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Origin': targetUrl,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

const fulfillCorsPreflight = async (route) => {
  await route.fulfill({
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Origin': targetUrl,
    },
  });
};

const isMockedApiRequest = (url) =>
  url.origin === mockApiOrigin ||
  (url.origin === targetUrl && url.pathname.startsWith('/api/')) ||
  (url.hostname === 'localhost' && url.port === '3000') ||
  (url.hostname === '127.0.0.1' && url.port === '3000');

const getApiPath = (url) =>
  url.pathname.startsWith('/api/') ? url.pathname.slice(4) : url.pathname;

const setupApiMocks = async (context, unhandledApiRequests) => {
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === '/__api-base-url') {
      await fulfillJson(route, { baseUrl: mockApiOrigin });
      return;
    }

    if (!isMockedApiRequest(url)) {
      await route.continue();
      return;
    }

    const apiPath = getApiPath(url);

    if (method === 'OPTIONS') {
      await fulfillCorsPreflight(route);
      return;
    }

    if (method === 'POST' && apiPath === '/auth/signin') {
      await fulfillJson(route, mockAuthResponse);
      return;
    }

    if (method === 'GET' && apiPath === '/admin/tests') {
      await fulfillJson(route, mockTopicList);
      return;
    }

    if (method === 'GET' && apiPath === '/tests/public/links/SMOKE') {
      await fulfillJson(route, mockLinkAccess);
      return;
    }

    if (method === 'POST' && apiPath === '/tests/public/links/SMOKE/start') {
      await fulfillJson(route, { session: mockSession }, 201);
      return;
    }

    if (method === 'GET' && apiPath === '/tests/public/sessions/session-smoke') {
      await fulfillJson(route, { session: mockSession });
      return;
    }

    unhandledApiRequests.push(`${method} ${apiPath}${url.search}`);
    await fulfillJson(route, { success: false, error: { message: 'Unhandled smoke mock' } }, 404);
  });
};

const watchPageHealth = (page, browserErrors) => {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    browserErrors.push(error.message);
  });
};

const createContext = async (browser, { authenticated = false } = {}) => {
  const context = await browser.newContext();

  if (authenticated) {
    await context.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: { id: 1, email: 'admin@example.com', name: 'Admin User' },
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
      window.localStorage.setItem('accessToken', 'mock-access-token');
    });
  }

  return context;
};

const assertNoBrowserErrors = (browserErrors) => {
  if (browserErrors.length > 0) {
    throw new Error(`Browser emitted errors:\n${browserErrors.join('\n')}`);
  }
};

const assertNoUnhandledApiRequests = (unhandledApiRequests) => {
  if (unhandledApiRequests.length > 0) {
    throw new Error(`Unhandled API requests:\n${unhandledApiRequests.join('\n')}`);
  }
};

const runLoginAndProtectedRouteSmoke = async (browser) => {
  const unhandledApiRequests = [];
  const browserErrors = [];
  const context = await createContext(browser);
  await setupApiMocks(context, unhandledApiRequests);
  const page = await context.newPage();
  watchPageHealth(page, browserErrors);

  try {
    await page.goto(`${targetUrl}/login`);
    await page.getByLabel('Email').waitFor({ timeout: 10000 });
    await page.getByLabel('Пароль').waitFor({ timeout: 10000 });

    await page.goto(`${targetUrl}/admin/tests`);
    await page.waitForURL('**/login', { timeout: 10000 });

    assertNoBrowserErrors(browserErrors);
    assertNoUnhandledApiRequests(unhandledApiRequests);
  } finally {
    await context.close();
  }
};

const runAuthenticatedAdminTestsSmoke = async (browser) => {
  const unhandledApiRequests = [];
  const browserErrors = [];
  const context = await createContext(browser, { authenticated: true });
  await setupApiMocks(context, unhandledApiRequests);
  const page = await context.newPage();
  watchPageHealth(page, browserErrors);

  try {
    await page.goto(`${targetUrl}/admin/tests`);
    await page
      .getByText('JavaScript Basics')
      .waitFor({ timeout: 10000 })
      .catch(async (error) => {
        const bodyText = (await page.textContent('body')) ?? '';
        throw new Error(
          [
            error instanceof Error ? error.message : String(error),
            `Current URL: ${page.url()}`,
            `Visible text: ${bodyText.slice(0, 1000)}`,
            `Browser errors: ${browserErrors.join(' | ') || 'none'}`,
            `Unhandled API requests: ${unhandledApiRequests.join(' | ') || 'none'}`,
          ].join('\n'),
        );
      });

    assertNoBrowserErrors(browserErrors);
    assertNoUnhandledApiRequests(unhandledApiRequests);
  } finally {
    await context.close();
  }
};

const runPublicSessionSmoke = async (browser) => {
  const unhandledApiRequests = [];
  const browserErrors = [];
  const context = await createContext(browser);
  await setupApiMocks(context, unhandledApiRequests);
  const page = await context.newPage();
  watchPageHealth(page, browserErrors);

  try {
    await page.goto(`${targetUrl}/t/SMOKE`);
    await page.getByText('Smoke Public Test').waitFor({ timeout: 10000 });
    await page.getByLabel('Имя').fill('Иван');
    await page.getByLabel('Фамилия (1-я буква)').fill('И');
    await page.getByLabel('Отчество (1-я буква)').fill('О');
    await page.getByLabel('Учебное заведение').fill('Школа');
    await page.getByLabel('Группа / класс').fill('СМ-1');
    await page.getByRole('button', { name: /Начать тестирование/ }).click();

    await page
      .waitForURL('**/t/SMOKE/session/session-smoke', { timeout: 10000 })
      .catch(async (error) => {
        const bodyText = (await page.textContent('body')) ?? '';
        const inputState = await page.evaluate(() =>
          Array.from(document.querySelectorAll('input')).map((input) => ({
            id: input.id,
            validationMessage: input.validationMessage,
            valid: input.checkValidity(),
            value: input.value,
          })),
        );
        throw new Error(
          [
            error instanceof Error ? error.message : String(error),
            `Current URL: ${page.url()}`,
            `Visible text: ${bodyText.slice(0, 1000)}`,
            `Input state: ${JSON.stringify(inputState)}`,
            `Browser errors: ${browserErrors.join(' | ') || 'none'}`,
            `Unhandled API requests: ${unhandledApiRequests.join(' | ') || 'none'}`,
          ].join('\n'),
        );
      });
    await page.getByText('Describe your learning experience').waitFor({ timeout: 10000 });

    assertNoBrowserErrors(browserErrors);
    assertNoUnhandledApiRequests(unhandledApiRequests);
  } finally {
    await context.close();
  }
};

const main = async () => {
  let previewProcess = null;
  let getPreviewLogs = () => '';

  try {
    buildClient();
    previewPort = await findAvailablePort();
    targetUrl = `http://${previewHost}:${previewPort}`;
    const { preview, getLogs } = startPreview();
    previewProcess = preview;
    getPreviewLogs = getLogs;
    await waitForClient(targetUrl, 30000);

    const browser = await chromium.launch({ headless: true });
    try {
      await runLoginAndProtectedRouteSmoke(browser);
      console.log('✓ /login and unauthenticated /admin/tests redirect smoke passed');

      await runAuthenticatedAdminTestsSmoke(browser);
      console.log('✓ authenticated /admin/tests smoke passed');

      await runPublicSessionSmoke(browser);
      console.log('✓ /t/:code -> /t/:code/session/:sessionToken smoke passed');
    } finally {
      await browser.close();
    }

    console.log('Critical frontend e2e smoke passed.');
  } catch (error) {
    console.error('Critical frontend e2e smoke failed.');
    console.error(error instanceof Error ? error.message : String(error));
    const logs = getPreviewLogs();
    if (logs) {
      console.error('\n--- Preview logs ---');
      console.error(logs);
      console.error('--- End preview logs ---');
    }
    process.exit(1);
  } finally {
    if (previewProcess) {
      await stopProcessTree(previewProcess);
    }
  }
};

await main();
