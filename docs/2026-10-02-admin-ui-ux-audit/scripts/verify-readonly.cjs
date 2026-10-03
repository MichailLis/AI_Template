// Closes the read-only "Not Tested" items: browser zoom 200 % (as CSS viewport at DPR 2),
// focus behind the sticky header at that zoom, hypotheses H01–H03, and server/network errors
// simulated by intercepting the API. Writes are aborted, so data is not changed.
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, ROUTES, login, settle, slug } = require('./lib.cjs');

const lines = [];
const note = (s) => {
  lines.push(s);
  console.log(s);
};
const shot = (page, name, opts = {}) =>
  page.screenshot({ path: path.join(OUT, 'shots', `verify_${name}.png`), ...opts });

async function open(browser, { width, height, dpr = 1 }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    locale: 'ru-RU',
  });
  const page = await ctx.newPage();
  await login(page);
  return { ctx, page };
}

/** Blocks every write except login, so nothing below can change data. */
async function readOnly(page) {
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url())) return route.abort();
    return route.fallback();
  });
}

const focusState = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const r = el.getBoundingClientRect();
  const header = document.querySelector('header');
  const hb = header ? header.getBoundingClientRect() : null;
  const top = document.elementFromPoint(r.x + r.width / 2, Math.max(0, r.y + r.height / 2));
  const covered = top && !(el === top || el.contains(top) || top.contains(el));
  return {
    name: (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 30),
    inHeader: !!el.closest('header'),
    fullyUnderHeader: !!hb && !el.closest('header') && r.bottom <= hb.bottom + 0.5,
    covered: !!covered && !el.closest('header'),
  };
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const browser = await chromium.launch();

  // --- 200 % zoom: a W×H screen at 200 % lays out as W/2 × H/2 CSS px. ---
  for (const [w, h] of [
    [1280, 720],
    [1366, 768],
    [1600, 900],
    [1920, 1080],
  ]) {
    const vw = Math.round(w / 2);
    const vh = Math.round(h / 2);
    const { ctx, page } = await open(browser, { width: vw, height: vh, dpr: 2 });
    await readOnly(page);
    for (const route of ROUTES.slice(1)) {
      await page.goto(`${BASE}${route}`);
      await settle(page);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const header = document.querySelector('header');
        const nav = document.querySelector('aside nav');
        const navVisible = nav && nav.offsetParent !== null;
        return {
          overflowX: doc.scrollWidth > doc.clientWidth + 1,
          headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
          navScrollable:
            navVisible && nav.scrollHeight > nav.clientHeight
              ? getComputedStyle(nav).overflowY
              : 'n/a',
        };
      });
      // Tab through the page and count stops hidden behind the sticky header.
      let stops = 0;
      const hidden = [];
      for (let i = 0; i < 60; i += 1) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(focusState);
        if (!f) break;
        stops += 1;
        if (f.fullyUnderHeader || f.covered) hidden.push(f.name);
      }
      note(
        `zoom200 ${w}x${h} (${vw}x${vh}) ${route}: overflowX=${m.overflowX} header=${m.headerHeight}px (${Math.round((m.headerHeight / vh) * 100)}% of height) nav=${m.navScrollable} tabStops=${stops} hiddenByHeader=${JSON.stringify(hidden)}`,
      );
      if (route === '/admin/users' || route === '/admin/tests')
        await shot(page, `zoom200_${w}x${h}_${slug(route)}`);
    }
    await ctx.close();
  }

  const { ctx, page } = await open(browser, { width: 1440, height: 900 });
  await readOnly(page);

  // --- H01: does "Ответы студента" show the answers themselves? ---
  await page.goto(`${BASE}/admin/analytics?tab=attempts`);
  await settle(page);
  const select = page.getByLabel('Публичная ссылка');
  await select.selectOption({
    label: await select.locator('option', { hasText: 'DEMO2026' }).first().textContent(),
  });
  await settle(page);
  await page.getByRole('button', { name: 'Ответы' }).first().click();
  await page.waitForTimeout(800);
  const dialog = page.getByRole('dialog');
  const collapsed = await dialog.innerText();
  await shot(page, 'H01_answers_collapsed');
  const details = dialog.locator('details');
  const detailsCount = await details.count();
  for (let i = 0; i < detailsCount; i += 1) await details.nth(i).locator('summary').click();
  await page.waitForTimeout(300);
  const expanded = await dialog.innerText();
  await shot(page, 'H01_answers_expanded');
  note(
    `H01: details=${detailsCount}\n--- collapsed ---\n${collapsed.slice(0, 900)}\n--- expanded (first 1500) ---\n${expanded.slice(0, 1500)}`,
  );
  await page.keyboard.press('Escape');

  // --- H03: which link does the attempts tab pick by default, and why? ---
  await page.goto(`${BASE}/admin/analytics?tab=attempts`);
  await settle(page);
  const options = await page
    .getByLabel('Публичная ссылка')
    .locator('option')
    .evaluateAll((o) => o.map((x) => `${x.selected ? '*' : ' '} ${x.textContent.trim()}`));
  note(`H03 options:\n${options.join('\n')}`);

  // --- Server and network errors, simulated per endpoint. ---
  const failWith = async (pattern, status, method) => {
    await page.unroute('**/*');
    await page.route('**/*', (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const isApi = ['xhr', 'fetch'].includes(req.resourceType());
      if (isApi && pattern.test(url.pathname) && (!method || req.method() === method)) {
        if (status === 'network') return route.abort();
        return route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: `HTTP_${status}`, message: `Тестовая ошибка ${status} от сервера` },
          }),
        });
      }
      if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url()))
        return route.abort();
      return route.fallback();
    });
  };
  const visibleErrorText = () =>
    page.evaluate(() => {
      const live = [...document.querySelectorAll('[aria-live], [role=alert], [role=status]')]
        .map((n) => n.textContent.trim())
        .filter(Boolean);
      const main = document.querySelector('main')?.innerText || '';
      const errorLines = main
        .split('\n')
        .filter((l) => /ошиб|не удалось|недоступ|повтор|сервер/i.test(l))
        .slice(0, 5);
      return { live: live.map((t) => t.slice(0, 120)), inPage: errorLines };
    });

  // Lists that fail to load.
  for (const [route, api, status] of [
    ['/admin/users', /^\/admin\/users$/, 500],
    ['/admin/tests', /^\/admin\/tests$/, 500],
    ['/admin/public-links', /^\/admin\/tests\/public-links$/, 500],
    ['/admin/public-links/organizations', /^\/admin\/tests\/education-organizations$/, 500],
    ['/admin/analytics', /analytics\/summary$/, 500],
    ['/admin/users', /^\/admin\/users$/, 'network'],
  ]) {
    await failWith(api, status, 'GET');
    await page.goto(`${BASE}${route}`);
    await settle(page);
    await page.waitForTimeout(2500);
    const retry = await page
      .getByRole('button', { name: /Повторить|Обновить|Попробовать/ })
      .count();
    note(
      `error_list ${route} ${status}: ${JSON.stringify(await visibleErrorText())} retryButtons=${retry}`,
    );
    await shot(page, `error_list_${slug(route)}_${status}`);
  }

  // Forms whose submit fails: is the input kept, is the error shown, can the user retry?
  const formCase = async (name, route, openForm, fill, submitName, api, status) => {
    await failWith(api, status, 'POST');
    await page.goto(`${BASE}${route}`);
    await settle(page);
    await openForm();
    await page.waitForTimeout(500);
    await fill();
    const submit = page.getByRole('dialog').getByRole('button', { name: submitName });
    await submit.click();
    await page.waitForTimeout(1500);
    const stillOpen = await page.getByRole('dialog').count();
    const kept = stillOpen
      ? await page
          .getByRole('dialog')
          .locator('input:not([type=hidden]):not([type=checkbox]):not([type=radio])')
          .evaluateAll((els) => els.map((e) => e.value).filter(Boolean))
      : [];
    const submitEnabled = stillOpen ? !(await submit.isDisabled()) : null;
    note(
      `error_form ${name} ${status}: dialogOpen=${!!stillOpen} keptValues=${JSON.stringify(kept)} submitEnabled=${submitEnabled} messages=${JSON.stringify(await visibleErrorText())}`,
    );
    await shot(page, `error_form_${name}_${status}`);
    await page.keyboard.press('Escape');
  };
  for (const status of [500, 409, 'network']) {
    await formCase(
      'users_add',
      '/admin/users',
      () => page.getByRole('button', { name: 'Добавить пользователя' }).click(),
      async () => {
        await page.getByRole('dialog').getByLabel(/Email/).fill('ui-audit@example.com');
        await page.getByRole('dialog').getByLabel('Имя').fill('UI-аудит');
      },
      'Создать пользователя',
      /^\/admin\/users$/,
      status,
    );
  }
  await formCase(
    'orgs_add',
    '/admin/public-links/organizations',
    () => page.getByRole('button', { name: 'Добавить заведение' }).click(),
    () =>
      page
        .getByRole('dialog')
        .getByLabel(/Название/)
        .fill('UI-аудит заведение'),
    'Создать заведение',
    /education-organizations$/,
    500,
  );
  await formCase(
    'tests_create',
    '/admin/tests',
    () => page.getByRole('button', { name: 'Создать', exact: true }).click(),
    () =>
      page
        .getByRole('dialog')
        .getByLabel(/Название теста/)
        .fill('UI-аудит тест'),
    'Создать тест',
    /^\/admin\/tests$/,
    500,
  );

  // Settings save with an error (the form is filled already; nothing is changed).
  await failWith(/settings\/profession-atlas$/, 500);
  await page.goto(`${BASE}/admin/settings`);
  await settle(page);
  await page.getByRole('tab', { name: 'Атлас профессий' }).click();
  await settle(page);
  await page.getByRole('button', { name: 'Сохранить настройки' }).click();
  await page.waitForTimeout(1500);
  note(`error_form settings_atlas 500: ${JSON.stringify(await visibleErrorText())}`);
  await shot(page, 'error_form_settings_atlas_500');

  await ctx.close();

  // --- H02: the student start page in the default theme. ---
  const pub = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU' });
  const p2 = await pub.newPage();
  await p2.goto(`${BASE}/t/DEMO2026`);
  await settle(p2);
  const buttons = await p2.evaluate(() =>
    [...document.querySelectorAll('button, a')]
      .filter((b) => b.offsetParent && b.textContent.trim())
      .map((b) => {
        const cs = getComputedStyle(b);
        return `${b.textContent.trim().slice(0, 30)} | color=${cs.color} bg=${cs.backgroundColor} bgImage=${cs.backgroundImage.slice(0, 80)} font=${cs.fontSize}/${cs.fontWeight}`;
      }),
  );
  note(`H02 /t/DEMO2026 buttons:\n${buttons.join('\n')}`);
  await p2.screenshot({ path: path.join(OUT, 'shots', 'verify_H02_public_start.png') });
  await pub.close();

  fs.writeFileSync(path.join(OUT, 'data', 'verify-readonly.log'), lines.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
