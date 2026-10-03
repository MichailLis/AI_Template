// Successful saves on the local stand: create, edit, deactivate and archive entities named
// "UI-аудит <run>", and record what the admin sees after each step (toast, dialog, focus, list).
// It changes data. Run only against the local docker stand; cleanup.sql removes what it creates.
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, login, settle } = require('./lib.cjs');

const RUN = process.env.AUDIT_RUN || new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const TAG = `UI-аудит ${RUN}`;
const EMAIL = `ui-audit-${RUN}@example.com`;
const lines = [];
const note = (s) => {
  lines.push(s);
  console.log(s);
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  await login(page);

  const toasts = [];
  await page.exposeFunction('__toast', (t) => toasts.push(t));
  await page.addInitScript(() => {
    new MutationObserver(() => {
      document.querySelectorAll('[data-sonner-toast]').forEach((n) => {
        if (!n.dataset.seen) {
          n.dataset.seen = '1';
          window.__toast(n.textContent.trim());
        }
      });
    }).observe(document, { childList: true, subtree: true });
  });
  const writes = [];
  page.on('response', (r) => {
    const m = r.request().method();
    if (m !== 'GET' && ['xhr', 'fetch'].includes(r.request().resourceType()))
      writes.push(`${r.status()} ${m} ${new URL(r.url()).pathname}`);
  });

  const state = async () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return {
        focus:
          el && el !== document.body
            ? `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 40)}`
            : 'body',
        dialog:
          document.querySelector('[role=dialog] h2, [role=alertdialog] h2')?.textContent || null,
      };
    });
  const step = async (name, fn) => {
    const before = { toasts: toasts.length, writes: writes.length };
    try {
      await fn();
      await page.waitForTimeout(1200);
      note(
        `OK ${name}: writes=${JSON.stringify(writes.slice(before.writes))} toasts=${JSON.stringify(toasts.slice(before.toasts))} ${JSON.stringify(await state())}`,
      );
    } catch (e) {
      note(
        `FAIL ${name}: ${e.message.split('\n')[0]} writes=${JSON.stringify(writes.slice(before.writes))}`,
      );
    }
    await page.screenshot({ path: path.join(OUT, 'shots', `write_${name}.png`) });
  };
  const dialog = () => page.locator('[role=dialog], [role=alertdialog]').last();

  // --- Users ---
  await page.goto(`${BASE}/admin/users`);
  await settle(page);
  await step('user_create', async () => {
    await page.getByRole('button', { name: 'Добавить пользователя' }).click();
    await dialog().getByLabel(/Email/).fill(EMAIL);
    await dialog().getByLabel('Имя').fill(TAG);
    await dialog().getByRole('button', { name: 'Создать пользователя' }).click();
  });
  await step('user_credentials_close', async () => {
    note(
      `  credentials dialog text: ${(await dialog().innerText()).replace(/\s+/g, ' ').slice(0, 300)}`,
    );
    await page.keyboard.press('Escape');
  });
  await step('user_edit', async () => {
    await page.getByRole('button', { name: `Действия для ${EMAIL}` }).click();
    await page.getByRole('button', { name: 'Изменить данные' }).click();
    await dialog().getByLabel('Имя').fill(`${TAG} изменен`);
    await dialog()
      .getByRole('button', { name: /Сохранить/ })
      .click();
  });
  await step('user_deactivate', async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: `Действия для ${EMAIL}` }).click();
    await page.getByRole('button', { name: 'Отключить доступ' }).click();
    await page.waitForTimeout(500);
    if (await page.locator('[role=alertdialog]').count())
      await dialog()
        .getByRole('button', { name: /Отключить/ })
        .click();
  });

  // --- Education organization ---
  await page.goto(`${BASE}/admin/public-links/organizations`);
  await settle(page);
  await step('org_create', async () => {
    await page.getByRole('button', { name: 'Добавить заведение' }).click();
    await dialog()
      .getByLabel(/Название/)
      .first()
      .fill(`${TAG} заведение`);
    await dialog().getByRole('button', { name: 'Создать заведение' }).click();
  });
  await step('org_deactivate', async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: `Редактировать ${TAG} заведение` }).click();
    await dialog().getByLabel('Заведение активно').uncheck();
    await dialog()
      .getByRole('button', { name: /Сохранить/ })
      .click();
  });

  // --- Test, question, archive ---
  await page.goto(`${BASE}/admin/tests`);
  await settle(page);
  await step('test_create', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await dialog()
      .getByLabel(/Название теста/)
      .fill(`${TAG} тест`);
    await dialog().getByRole('button', { name: 'Создать тест' }).click();
    await settle(page);
    note(`  after create url=${page.url()}`);
  });
  await step('question_add', async () => {
    if (!/\/admin\/tests\/\d+/.test(page.url())) {
      await page
        .getByRole('button', { name: new RegExp(`${TAG} тест`) })
        .first()
        .click();
      await settle(page);
    }
    await page.getByRole('button', { name: 'Добавить вопрос' }).click();
    await dialog().getByLabel('Тип').selectOption({ index: 0 });
    await dialog().getByLabel('Заголовок').fill(`${TAG}: вопрос`);
    const optionText = dialog().getByLabel('Текст варианта 1');
    if (await optionText.count()) {
      await optionText.fill('Вариант А');
      await dialog().getByLabel('Текст варианта 2').fill('Вариант Б');
    }
    await dialog()
      .getByRole('button', { name: /Добавить вопрос|Сохранить|Создать/ })
      .last()
      .click();
  });
  await step('question_delete', async () => {
    await page
      .getByRole('button', { name: /Удалить/ })
      .first()
      .click();
    await dialog()
      .getByRole('button', { name: /Удалить/ })
      .last()
      .click();
  });
  await step('test_archive', async () => {
    await page.goto(`${BASE}/admin/tests`);
    await settle(page);
    // Ближайший предок названия, в котором есть кнопка «Действия», — строка именно этого теста.
    // Раньше фильтр по `main div` захватывал весь список, и `.last()` архивировал чужой тест.
    await page
      .getByText(`${TAG} тест`, { exact: true })
      .locator('xpath=ancestor::*[.//button[@aria-label="Действия"]][1]')
      .getByRole('button', { name: 'Действия' })
      .click();
    await page.getByRole('button', { name: 'Архивировать' }).click();
    await page.waitForTimeout(500);
    if (await page.locator('[role=alertdialog]').count())
      await dialog()
        .getByRole('button', { name: /Архивировать/ })
        .click();
  });

  // --- Public link wizard ---
  await page.goto(`${BASE}/admin/public-links`);
  await settle(page);
  await step('link_create', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await dialog().getByRole('button', { name: 'Далее' }).click();
    await dialog().getByRole('button', { name: 'Далее' }).click();
    await dialog()
      .getByRole('button', { name: /Создать ссылку/ })
      .click();
    await page.waitForTimeout(1500);
    note(
      `  after create dialog: ${(
        await dialog()
          .innerText()
          .catch(() => '')
      )
        .replace(/\s+/g, ' ')
        .slice(0, 300)}`,
    );
  });
  await step('link_archive', async () => {
    await page.keyboard.press('Escape');
    await settle(page);
    const code = (
      await page
        .locator('main')
        .getByRole('button', { name: /^[A-Z0-9]{4,}$/ })
        .allTextContents()
    ).find((c) => !['COLLEGE1', 'DEMO2026'].includes(c));
    note(`  new link code=${code}`);
    fs.writeFileSync(path.join(OUT, 'data', 'created-link.txt'), code || '');
    const actions = page.getByRole('button', { name: 'Действия публичной ссылки' });
    const codes = await page
      .locator('main')
      .getByRole('button', { name: /^[A-Z0-9]{4,}$/ })
      .allTextContents();
    await actions.nth(codes.indexOf(code)).click();
    await page.getByRole('button', { name: 'Архивировать' }).click();
    await page.waitForTimeout(500);
    if (await page.locator('[role=alertdialog]').count())
      await dialog()
        .getByRole('button', { name: /Архивировать/ })
        .click();
  });

  // --- Settings: save the Atlas form unchanged ---
  await page.goto(`${BASE}/admin/settings`);
  await settle(page);
  await page.getByRole('tab', { name: 'Атлас профессий' }).click();
  await settle(page);
  await step('settings_atlas_save', () =>
    page.getByRole('button', { name: 'Сохранить настройки' }).click(),
  );

  // --- Readable answers in the attempt dialog (D18 fix) ---
  await page.goto(`${BASE}/admin/analytics?tab=attempts`);
  await settle(page);
  const select = page.getByLabel('Публичная ссылка');
  await select.selectOption({
    label: await select.locator('option', { hasText: 'DEMO2026' }).first().textContent(),
  });
  await settle(page);
  await step('attempt_answers_readable', async () => {
    await page.getByRole('button', { name: 'Ответы' }).first().click();
    await page.waitForTimeout(800);
    note(`  answers dialog: ${(await dialog().innerText()).replace(/\s+/g, ' ').slice(0, 700)}`);
  });

  fs.writeFileSync(path.join(OUT, 'data', 'verify-writes.log'), lines.join('\n'));
  note(`TAG=${TAG} EMAIL=${EMAIL}`);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
