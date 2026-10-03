// Pass 3: targeted re-checks of candidates from passes 1–2. Writes are aborted as in states.cjs.
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
  page.screenshot({ path: path.join(OUT, 'shots', `check_${name}.png`), ...opts });

const active = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  return `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent.trim() || el.getAttribute('placeholder') || '').slice(0, 40)}`;
};

async function newPage(browser, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  await login(page);
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url())) return route.abort();
    return route.continue();
  });
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch();

  // 1. Users action menu: which items are actually visible and hittable, per row and viewport.
  for (const [w, h] of [
    [1440, 900],
    [375, 812],
  ]) {
    const { ctx, page } = await newPage(browser, w, h);
    await page.goto(`${BASE}/admin/users`);
    await settle(page);
    const triggers = page.getByRole('button', { name: /^Действия для / });
    const count = await triggers.count();
    for (let i = 0; i < count; i += 1) {
      await triggers.nth(i).click();
      await page.waitForTimeout(300);
      const result = await page.evaluate((index) => {
        const trigger = [...document.querySelectorAll('button[aria-label^="Действия для "]')][
          index
        ];
        // После правки меню — Popover в портале (role=dialog), а не absolute-блок внутри ячейки.
        const menu = document.querySelector(
          '[data-radix-popper-content-wrapper] [role=dialog][data-state=open]',
        );
        if (!menu) return { error: 'no menu' };
        const items = [...menu.querySelectorAll('button')].map((b) => {
          const r = b.getBoundingClientRect();
          const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return {
            text: b.textContent.trim(),
            y: Math.round(r.y),
            // Отключенный пункт имеет pointer-events: none, под ним лежит само меню: это не обрезание.
            hittable: !!top && (top === b || b.contains(top) || (b.disabled && menu.contains(top))),
          };
        });
        let clipper = null;
        for (let n = trigger.parentElement; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.overflow !== 'visible' || cs.overflowY !== 'visible') {
            const r = n.getBoundingClientRect();
            clipper = {
              cls: String(n.className).slice(0, 70),
              overflow: `${cs.overflowX}/${cs.overflowY}`,
              bottom: Math.round(r.bottom),
              scrollable: n.scrollHeight > n.clientHeight,
            };
            break;
          }
        }
        return {
          row: trigger.getAttribute('aria-label'),
          expanded: trigger.getAttribute('aria-expanded'),
          menuBottom: Math.round(menu.getBoundingClientRect().bottom),
          clipper,
          hidden: items.filter((i) => !i.hittable).map((i) => i.text),
          visible: items.filter((i) => i.hittable).map((i) => i.text),
        };
      }, i);
      note(`users_menu ${w}px row${i}: ${JSON.stringify(result)}`);
      if (i === 0)
        note(
          `users_menu ${w}px: roleMenuItems=${await page.getByRole('button', { name: /Сбросить пароль/ }).count()}`,
        );
      await shot(page, `users_menu_${w}_row${i}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      const openAfterEsc = await page.evaluate(
        () =>
          !!document.querySelector(
            '[data-radix-popper-content-wrapper] [role=dialog][data-state=open]',
          ),
      );
      if (i === 0) note(`users_menu ${w}px: stillOpenAfterEscape=${openAfterEsc}`);
      if (openAfterEsc) {
        await triggers.nth(i).click();
        await page.waitForTimeout(200);
      }
    }
    await ctx.close();
  }

  const { ctx, page } = await newPage(browser, 1440, 900);

  // 2. Focus return after closing an overlay that was opened from the keyboard.
  const focusReturn = async (route, name, locate) => {
    await page.goto(`${BASE}${route}`);
    await settle(page);
    const trigger = locate();
    await trigger.focus();
    const before = await page.evaluate(active);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const opened = await page.locator('[role=dialog],[role=alertdialog]').count();
    const inside = await page.evaluate(active);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const after = await page.evaluate(active);
    note(
      `focus_return ${name}: trigger="${before}" opened=${opened} focusInside="${inside}" afterEscape="${after}" returned=${after === before}`,
    );
  };
  await focusReturn('/admin/tests', 'tests_create', () =>
    page.getByRole('button', { name: 'Создать', exact: true }),
  );
  await focusReturn('/admin/tests', 'tests_ai', () =>
    page.getByRole('button', { name: 'Сгенерировать с ИИ' }),
  );
  await focusReturn('/admin/tests', 'tests_import', () =>
    page.getByRole('button', { name: 'Импорт v3+' }),
  );
  await focusReturn('/admin/tests', 'tests_row_menu', () =>
    page.getByRole('button', { name: 'Действия' }).first(),
  );
  await focusReturn('/admin/public-links', 'links_create', () =>
    page.getByRole('button', { name: 'Создать', exact: true }),
  );
  await focusReturn('/admin/public-links', 'links_qr', () =>
    page.getByRole('button', { name: /QR-код для DEMO2026/ }),
  );
  await focusReturn('/admin/public-links/organizations', 'orgs_add', () =>
    page.getByRole('button', { name: 'Добавить заведение' }),
  );
  await focusReturn('/admin/public-links/organizations', 'orgs_edit', () =>
    page.getByRole('button', { name: /Редактировать Демо лицей/ }),
  );
  await focusReturn('/admin/users', 'users_add', () =>
    page.getByRole('button', { name: 'Добавить пользователя' }),
  );
  await focusReturn('/admin/prompts', 'prompts_history', () =>
    page.getByRole('button', { name: /История промпта Профориентация/ }),
  );
  await focusReturn('/admin/prompts', 'prompts_delete', () =>
    page.getByRole('button', { name: /Удалить промпт archive-e2e/ }).first(),
  );

  // 3. Attempts table: are the clickable rows reachable and operable from the keyboard?
  await page.goto(`${BASE}/admin/analytics?tab=attempts`);
  await settle(page);
  await page.getByLabel('Публичная ссылка').selectOption({
    label: await page
      .getByLabel('Публичная ссылка')
      .locator('option', { hasText: 'DEMO2026' })
      .first()
      .textContent(),
  });
  await settle(page);
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('main tbody tr')].slice(0, 3).map((tr) => ({
      tabindex: tr.getAttribute('tabindex'),
      role: tr.getAttribute('role'),
      cursor: getComputedStyle(tr).cursor,
      innerFocusable: tr.querySelectorAll('a,button,[tabindex]').length,
      text: tr.textContent.trim().slice(0, 60),
    })),
  );
  note(`attempt_rows: ${JSON.stringify(rows)}`);
  await shot(page, 'analytics_attempts_demo2026', { fullPage: true });
  const stops = [];
  for (let i = 0; i < 45; i += 1) {
    await page.keyboard.press('Tab');
    const a = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el !== document.body
        ? `${el.tagName.toLowerCase()}${el.closest('tbody') ? '@tbody' : ''}:${(el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 25)}`
        : 'body';
    });
    if (a === 'body') break;
    stops.push(a);
  }
  note(
    `attempt_rows tab stops in tbody: ${JSON.stringify(stops.filter((s) => s.includes('@tbody')))} (total stops ${stops.length})`,
  );
  // D03: путь с клавиатуры — кнопка «Анализ» в первой строке, Enter открывает диалог анализа.
  await page.keyboard.press('Escape');
  const analysisButton = page
    .locator('main tbody tr')
    .first()
    .getByRole('button', { name: 'Анализ', exact: true });
  await analysisButton.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  note(
    `attempt_rows keyboard Enter on Анализ opens dialog: ${await page.locator('[role=dialog]').count()} title="${await page
      .locator('[role=dialog] h2')
      .first()
      .textContent()
      .catch(() => '')}"`,
  );
  await shot(page, 'analytics_attempt_analysis_keyboard');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  note(`attempt_rows focus after closing analysis: ${await page.evaluate(active)}`);
  if (rows.length) {
    await page.locator('main tbody tr').first().click();
    await page.waitForTimeout(800);
    note(`attempt_rows mouse click opens dialog: ${await page.locator('[role=dialog]').count()}`);
    await shot(page, 'analytics_attempt_detail');
    await page.keyboard.press('Escape');
  }

  // 4. Toolbar overflow: the width range where the page gets a horizontal scrollbar.
  for (const route of ['/admin/tests', '/admin/public-links', '/admin/users', '/admin/prompts']) {
    const bad = [];
    for (let w = 768; w <= 1280; w += 32) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}${route}`);
      await settle(page);
      const d = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      if (d[0] > d[1] + 1) bad.push(`${w}:${d[0]}`);
    }
    note(`overflow_range ${route}: ${JSON.stringify(bad)}`);
  }

  // 5. Sidebar on a short viewport (e.g. 1600x900 at 200% zoom = 800x450 CSS px).
  for (const [w, h] of [
    [800, 450],
    [1024, 480],
    [960, 540],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${BASE}/admin/tests`);
    await settle(page);
    const nav = await page.evaluate(() => {
      const navEl = document.querySelector('aside nav');
      const cs = getComputedStyle(navEl);
      const box = navEl.getBoundingClientRect();
      return {
        overflowY: cs.overflowY,
        clientHeight: navEl.clientHeight,
        scrollHeight: navEl.scrollHeight,
        cut: [...navEl.querySelectorAll('a')]
          .filter((a) => a.getBoundingClientRect().bottom > Math.min(box.bottom, innerHeight) + 1)
          .map((a) => a.textContent.trim()),
      };
    });
    note(`sidebar ${w}x${h}: ${JSON.stringify(nav)}`);
    if (nav.cut.length) await shot(page, `sidebar_${w}x${h}`);
  }

  // 6. 320 px reflow on prompts: what sticks out.
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`${BASE}/admin/prompts`);
  await settle(page);
  const button = page.getByRole('button', { name: 'Сгенерировать тестовые ответы ИИ' });
  await button.scrollIntoViewIfNeeded();
  note(
    `reflow_320 prompts: ${JSON.stringify(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]))} button=${JSON.stringify(await button.boundingBox())}`,
  );
  await shot(page, 'prompts_320_generate_button');

  // 7. Text spacing (SC 1.4.12) applied to the main list pages.
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of ['/admin/tests', '/admin/users', '/admin/analytics']) {
    await page.goto(`${BASE}${route}`);
    await settle(page);
    await page.addStyleTag({
      content:
        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
    });
    await page.waitForTimeout(400);
    const cut = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((el) => el.offsetParent && el.children.length === 0 && el.textContent.trim())
        .filter((el) => {
          const cs = getComputedStyle(el);
          const p = el.parentElement;
          const pcs = getComputedStyle(p);
          const selfCut =
            cs.overflow !== 'visible' &&
            (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
          const parentCut =
            pcs.overflow !== 'visible' &&
            (p.scrollWidth > p.clientWidth + 1 || p.scrollHeight > p.clientHeight + 1);
          return selfCut || parentCut;
        })
        .slice(0, 12)
        .map((el) => el.textContent.trim().slice(0, 45)),
    );
    const doc = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    note(`text_spacing ${route}: doc=${doc.join('/')} cut=${JSON.stringify(cut)}`);
    await shot(page, `text_spacing_${route.split('/').pop()}`);
  }

  // 8. Accessible names as the browser computes them for the placeholder-only prompt variables.
  await page.goto(`${BASE}/admin/prompts`);
  await settle(page);
  const aria = await page.locator('main').ariaSnapshot();
  const lines = aria
    .split('\n')
    .filter((l) => /textbox|slider|checkbox|combobox|spinbutton/.test(l));
  note(`prompts form controls (aria snapshot):\n${lines.join('\n')}`);

  await ctx.close();
  fs.writeFileSync(path.join(OUT, 'data', 'checks.log'), log.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
