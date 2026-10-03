// Pass 4: deeper screens (question editor, test settings, link wizard, branding builder, attempt
// detail) and whether each overlay fits the viewport or scrolls. Writes are aborted.
// usage: node deep.cjs [width=1440] [height=900]
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, login, settle, measure } = require('./lib.cjs');

const width = Number(process.argv[2] || 1440);
const height = Number(process.argv[3] || 900);
const tag = `${width}x${height}`;
const lines = [];
const note = (s) => {
  lines.push(s);
  console.log(s);
};

const fit = () => {
  const overlays = [...document.querySelectorAll('[role=dialog],[role=alertdialog]')];
  const el = overlays[overlays.length - 1];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  // The nearest scrollable box inside the overlay, if the overlay itself does not scroll.
  const scrollers = [el, ...el.querySelectorAll('*')].filter((n) => {
    const s = getComputedStyle(n);
    return /(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1;
  });
  const buttons = [...el.querySelectorAll('button')].filter((b) => b.offsetParent);
  const offscreen = buttons
    .filter((b) => {
      const br = b.getBoundingClientRect();
      return (
        br.bottom > innerHeight + 1 || br.top < -1 || br.right > innerWidth + 1 || br.left < -1
      );
    })
    .map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 30));
  return {
    title: (el.querySelector('h2')?.textContent || '').trim().slice(0, 40),
    rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    viewport: [innerWidth, innerHeight],
    exceedsViewport: r.bottom > innerHeight + 1 || r.top < -1,
    overflowY: cs.overflowY,
    innerScrollers: scrollers.length,
    buttonsOutsideViewport: offscreen,
  };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  await login(page);
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url())) return route.abort();
    return route.continue();
  });

  const snap = async (name) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'shots', `deep_${tag}_${name}.png`) });
    const f = await page.evaluate(fit);
    note(`${tag} ${name}: ${JSON.stringify(f)}`);
    const data = await page.evaluate(measure, f ? '[role=dialog],[role=alertdialog]' : null);
    fs.writeFileSync(
      path.join(OUT, 'data', `deep_${tag}_${name}.json`),
      JSON.stringify(data, null, 2),
    );
  };
  const step = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      note(`!! ${tag} ${name}: ${e.message.split('\n')[0]}`);
    }
    await page.keyboard.press('Escape').catch(() => {});
  };

  await step('tests_create', async () => {
    await page.goto(`${BASE}/admin/tests`);
    await settle(page);
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await snap('tests_create');
    const submit = page.getByRole('dialog').getByRole('button', { name: 'Создать тест' });
    note(
      `${tag} tests_create: submitDisabledWhenEmpty=${await submit.isDisabled()} describedBy=${await submit.getAttribute('aria-describedby')}`,
    );
  });
  await step('tests_ai', async () => {
    await page.goto(`${BASE}/admin/tests`);
    await settle(page);
    await page.getByRole('button', { name: 'Сгенерировать с ИИ' }).click();
    await snap('tests_ai');
    const gen = page.getByRole('dialog').getByRole('button', { name: 'Сгенерировать вопросы' });
    note(`${tag} tests_ai: generateDisabled=${await gen.isDisabled()}`);
  });
  await step('question_editor', async () => {
    await page.goto(`${BASE}/admin/tests/43`);
    await settle(page);
    await page
      .getByRole('button', { name: /Изменить/ })
      .nth(1)
      .click();
    await snap('question_editor');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Добавить вопрос' }).click();
    await snap('question_add');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page
      .getByRole('button', { name: /Удалить/ })
      .first()
      .click();
    await snap('question_delete');
  });
  await step('test_settings', async () => {
    await page.goto(`${BASE}/admin/tests/43`);
    await settle(page);
    await page.getByRole('button', { name: 'Настройки теста' }).click();
    await settle(page);
    note(`${tag} test_settings url=${page.url()}`);
    await page.screenshot({
      path: path.join(OUT, 'shots', `deep_${tag}_test_settings.png`),
      fullPage: true,
    });
    const data = await page.evaluate(measure, null);
    fs.writeFileSync(
      path.join(OUT, 'data', `deep_${tag}_test_settings.json`),
      JSON.stringify(data, null, 2),
    );
  });
  await step('links_wizard', async () => {
    await page.goto(`${BASE}/admin/public-links`);
    await settle(page);
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByRole('dialog').getByRole('button', { name: 'Далее' }).click();
    await snap('links_wizard_step2');
    await page.getByRole('dialog').getByRole('button', { name: 'Далее' }).click();
    await snap('links_wizard_step3');
  });
  await step('links_branding', async () => {
    await page.goto(`${BASE}/admin/public-links`);
    await settle(page);
    await page.getByRole('button', { name: 'Действия публичной ссылки' }).last().click();
    await page.getByRole('button', { name: 'Оформление страницы' }).click();
    await snap('links_branding');
  });
  await step('links_history', async () => {
    await page.goto(`${BASE}/admin/public-links`);
    await settle(page);
    await page.getByRole('button', { name: 'Действия публичной ссылки' }).last().click();
    await page.getByRole('button', { name: 'История изменений' }).click();
    await snap('links_history');
  });
  await step('attempt_detail', async () => {
    await page.goto(`${BASE}/admin/analytics?tab=attempts`);
    await settle(page);
    const select = page.getByLabel('Публичная ссылка');
    await select.selectOption({
      label: await select.locator('option', { hasText: 'DEMO2026' }).first().textContent(),
    });
    await settle(page);
    await page.getByRole('button', { name: 'Ответы' }).first().click();
    await snap('attempt_detail');
  });
  await step('users_edit', async () => {
    await page.goto(`${BASE}/admin/users`);
    await settle(page);
    await page.getByRole('button', { name: 'Действия для teacher@example.com' }).click();
    await page.getByRole('button', { name: 'Изменить данные' }).click();
    await snap('users_edit');
  });
  await step('users_reset', async () => {
    await page.goto(`${BASE}/admin/users`);
    await settle(page);
    await page.getByRole('button', { name: 'Действия для teacher@example.com' }).click();
    await page.getByRole('button', { name: 'Сбросить пароль' }).click();
    await snap('users_reset');
  });
  await step('prompts_history', async () => {
    await page.goto(`${BASE}/admin/prompts`);
    await settle(page);
    await page.getByRole('button', { name: /История промпта Профориентация/ }).click();
    await snap('prompts_history');
  });
  await step('orgs_edit', async () => {
    await page.goto(`${BASE}/admin/public-links/organizations`);
    await settle(page);
    await page.getByRole('button', { name: /Редактировать Демо лицей/ }).click();
    await snap('orgs_edit');
  });

  fs.writeFileSync(path.join(OUT, 'data', `deep_${tag}.log`), lines.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
