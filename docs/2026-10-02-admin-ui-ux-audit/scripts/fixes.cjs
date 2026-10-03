// Точечные проверки правок D01-D13 в браузере: состояния и скриншоты «после». Записи блокируются.
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, login, settle } = require('./lib.cjs');

const log = [];
const note = (...parts) => {
  const line = parts.join(' ');
  log.push(line);
  console.log(line);
};
const shot = (page, name, opts = {}) =>
  page.screenshot({ path: path.join(OUT, 'shots', `fix_${name}.png`), ...opts });
const active = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  return `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 40)}`;
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  await login(page);
  let blockedWrites = 0;
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url())) {
      blockedWrites += 1;
      return route.abort();
    }
    return route.continue();
  });

  // D01: меню пользователя у нижней строки, закрытие по Escape, aria-expanded.
  await page.goto(`${BASE}/admin/users`);
  await settle(page);
  const triggers = page.getByRole('button', { name: /^Действия для / });
  const last = triggers.nth((await triggers.count()) - 1);
  await last.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  note(
    `D01 expanded=${await last.getAttribute('aria-expanded')} items=${await page.locator('[data-radix-popper-content-wrapper] [role=dialog] button').count()}`,
  );
  await shot(page, 'D01_users_menu_last_row_1440');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  note(
    `D01 afterEscape expanded=${await last.getAttribute('aria-expanded')} focus="${await page.evaluate(active)}"`,
  );

  // D02 + D13: окно «Создать тест».
  await page.goto(`${BASE}/admin/tests`);
  await settle(page);
  const create = page.getByRole('button', { name: 'Создать', exact: true });
  await create.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const submit = page.getByRole('button', { name: 'Создать тест' });
  note(`D13 submit disabled=${await submit.isDisabled()}`);
  await submit.click();
  await page.waitForTimeout(300);
  const input = page.locator('#new-topic-title');
  note(
    `D13 aria-invalid=${await input.getAttribute('aria-invalid')} describedby=${!!(await input.getAttribute('aria-describedby'))} error="${await page
      .locator('[role=dialog] p.text-destructive')
      .textContent()
      .catch(() => '')}" focus="${await page.evaluate(active)}" writes=${blockedWrites}`,
  );
  await shot(page, 'D13_tests_create_empty_title_1440');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  note(`D02 focus after Escape="${await page.evaluate(active)}"`);
  await shot(page, 'D02_focus_returned_to_create_1440');

  // D09: фильтр заведений — сегментированный переключатель.
  await page.goto(`${BASE}/admin/public-links/organizations`);
  await settle(page);
  const tabInfo = async () =>
    page.evaluate(() =>
      [
        ...document.querySelectorAll('[role=tablist][aria-label="Фильтр заведений"] [role=tab]'),
      ].map((t) => ({
        text: t.textContent.trim(),
        selected: t.getAttribute('aria-selected'),
        bg: getComputedStyle(t).backgroundColor,
        shadow: getComputedStyle(t).boxShadow !== 'none',
      })),
    );
  note(`D09 tabs before: ${JSON.stringify(await tabInfo())}`);
  await shot(page, 'D09_organizations_filter_1440');
  await page.getByRole('tab', { name: 'Требуют заполнения' }).click();
  await settle(page);
  note(`D09 tabs after click: ${JSON.stringify(await tabInfo())}`);
  await shot(page, 'D09_organizations_filter_needs_data_1440');
  await page.locator('[role=tab][aria-selected=true]').press('ArrowLeft');
  await page.waitForTimeout(500);
  note(
    `D09 after ArrowLeft: ${JSON.stringify((await tabInfo()).map((t) => `${t.text}=${t.selected}`))}`,
  );

  // D11: шапка колонок у переменных промпта.
  await page.goto(`${BASE}/admin/prompts`);
  await settle(page);
  const header = page.getByText('Ключ', { exact: true });
  note(
    `D11 header columns visible=${await header.isVisible()} / ${await page.getByText('Значение', { exact: true }).first().isVisible()}`,
  );
  await header.scrollIntoViewIfNeeded();
  await shot(page, 'D11_prompt_variables_1440');

  // D12: боковое меню на 800x450 прокручивается до «Настройки».
  await page.setViewportSize({ width: 800, height: 450 });
  await page.goto(`${BASE}/admin/tests`);
  await settle(page);
  await shot(page, 'D12_sidebar_800x450_top');
  const settings = page.locator('aside nav a', { hasText: 'Настройки' });
  await page.evaluate(() => {
    const nav = document.querySelector('aside nav');
    nav.scrollTop = nav.scrollHeight;
  });
  await page.waitForTimeout(200);
  const inView = await settings.evaluate((a) => {
    const r = a.getBoundingClientRect();
    const nav = document.querySelector('aside nav').getBoundingClientRect();
    return r.top >= nav.top - 1 && r.bottom <= Math.min(nav.bottom, innerHeight) + 1;
  });
  note(`D12 Настройки visible after scrolling nav=${inView}`);
  await shot(page, 'D12_sidebar_800x450_scrolled');

  // D08: панель кнопок на 768 и 896.
  for (const w of [768, 896]) {
    for (const route of ['/admin/tests', '/admin/public-links']) {
      await page.setViewportSize({ width: w, height: 1024 });
      await page.goto(`${BASE}${route}`);
      await settle(page);
      const d = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      note(`D08 ${route} ${w}px doc=${d.join('/')}`);
      await shot(page, `D08_${route.split('/').pop()}_${w}`);
    }
  }

  // D10: 320 px, промпты.
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`${BASE}/admin/prompts`);
  await settle(page);
  const btn = page.getByRole('button', { name: 'Сгенерировать тестовые ответы ИИ' });
  await btn.scrollIntoViewIfNeeded();
  note(
    `D10 doc=${await page.evaluate(() => document.documentElement.scrollWidth)}/320 button=${JSON.stringify(await btn.boundingBox())}`,
  );
  await shot(page, 'D10_prompts_320_generate_button');

  // D06/D07: заголовки и title на всех маршрутах.
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of [
    '/admin/tests',
    '/admin/public-links',
    '/admin/public-links/organizations',
    '/admin/analytics',
    '/admin/users',
    '/admin/prompts',
    '/admin/settings',
    '/admin/tests/43',
  ]) {
    await page.goto(`${BASE}${route}`);
    await settle(page);
    const info = await page.evaluate(() => ({
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      h2: document.querySelectorAll('h2').length,
      main: document.querySelectorAll('main').length,
    }));
    note(`D06/D07 ${route}: ${JSON.stringify(info)}`);
  }

  note(`blocked writes total=${blockedWrites}`);
  await ctx.close();
  fs.writeFileSync(path.join(OUT, 'data', 'fixes.log'), log.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
