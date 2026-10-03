// Checks for ait-688 and ait-9os in the live app. The analytics part is read-only; the focus part
// CHANGES DATA on the local stand: it creates a user and a test named "UI-аудит <run>" and deletes
// questions of that test. Remove the created rows afterwards (see the report, section 10).
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
const active = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return 'body';
    return `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 45)}`;
  });

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const browser = await chromium.launch();
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' })
  ).newPage();
  await login(page);
  const dialog = () => page.locator('[role=dialog], [role=alertdialog]').last();

  // --- ait-688: default link on the attempts tab, and no request for the empty link first ---
  const attemptRequests = [];
  page.on('request', (r) => {
    const m = new URL(r.url()).pathname.match(/public-links\/(\d+)\/attempts$/);
    // limit=1 — запросы счетчиков попыток для списка ссылок; остальные — сама таблица.
    if (m && new URL(r.url()).searchParams.get('limit') !== '1') attemptRequests.push(m[1]);
  });
  await page.goto(`${BASE}/admin/analytics?tab=attempts`);
  await settle(page);
  const selected = await page
    .getByLabel('Публичная ссылка')
    .locator('option:checked')
    .textContent();
  note(
    `ait-688 default link: "${selected}" table requests for links: ${JSON.stringify(attemptRequests)}`,
  );
  await page.screenshot({ path: path.join(OUT, 'shots', 'focus_analytics_default_link.png') });

  // --- ait-9os 1: one-time password dialog after creating a user ---
  await page.goto(`${BASE}/admin/users`);
  await settle(page);
  await page.getByRole('button', { name: 'Добавить пользователя' }).focus();
  await page.keyboard.press('Enter');
  await dialog().getByLabel(/Email/).fill(EMAIL);
  await dialog().getByLabel('Имя').fill(TAG);
  await dialog().getByRole('button', { name: 'Создать пользователя' }).click();
  await page.waitForTimeout(1500);
  note(`  password dialog: "${await dialog().locator('h2').textContent()}"`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  note(`ait-9os user created -> focus after closing the password dialog: ${await active(page)}`);

  // --- ait-9os 3: creating a test opens the editor with focus on "Добавить вопрос" ---
  await page.goto(`${BASE}/admin/tests`);
  await settle(page);
  await page.getByRole('button', { name: 'Создать', exact: true }).focus();
  await page.keyboard.press('Enter');
  await dialog()
    .getByLabel(/Название теста/)
    .fill(`${TAG} тест`);
  await dialog().getByRole('button', { name: 'Создать тест' }).click();
  await settle(page);
  await page.waitForTimeout(800);
  note(`ait-9os test created -> url=${page.url()} focus: ${await active(page)}`);
  await page.screenshot({ path: path.join(OUT, 'shots', 'focus_after_test_create.png') });

  // --- ait-9os 2: deleting questions (middle, last, only) ---
  for (const title of ['Вопрос 1', 'Вопрос 2', 'Вопрос 3']) {
    await page.getByRole('button', { name: 'Добавить вопрос' }).click();
    await dialog().getByLabel('Заголовок').fill(`${TAG}: ${title}`);
    const option = dialog().getByLabel('Текст варианта 1');
    if (await option.count()) {
      await option.fill('А');
      await dialog().getByLabel('Текст варианта 2').fill('Б');
    }
    await dialog()
      .getByRole('button', { name: /Добавить вопрос|Сохранить/ })
      .last()
      .click();
    await page.waitForTimeout(1200);
  }
  const deleteQuestion = async (index, label) => {
    const deleteButtons = page.getByRole('button', { name: /^Удалить$/ });
    await deleteButtons.nth(index).focus();
    await page.keyboard.press('Enter');
    await dialog().getByRole('button', { name: 'Удалить вопрос' }).click();
    await page.waitForTimeout(2000);
    const focusedQuestion = await page.evaluate(() => {
      const el = document.activeElement;
      const card = el?.closest('[draggable]');
      return card ? card.querySelector('p')?.textContent?.trim() : null;
    });
    note(`ait-9os delete ${label} -> focus: ${await active(page)} in card "${focusedQuestion}"`);
  };
  await deleteQuestion(1, 'middle question (2 of 3)');
  await deleteQuestion(1, 'last question (2 of 2)');
  await deleteQuestion(0, 'only question');

  // Cancel keeps focus on the delete button of the same question.
  await page.getByRole('button', { name: 'Добавить вопрос' }).click();
  await dialog().getByLabel('Заголовок').fill(`${TAG}: Вопрос 4`);
  const option = dialog().getByLabel('Текст варианта 1');
  if (await option.count()) {
    await option.fill('А');
    await dialog().getByLabel('Текст варианта 2').fill('Б');
  }
  await dialog()
    .getByRole('button', { name: /Добавить вопрос|Сохранить/ })
    .last()
    .click();
  await page.waitForTimeout(1200);
  await page
    .getByRole('button', { name: /^Удалить$/ })
    .first()
    .focus();
  await page.keyboard.press('Enter');
  await dialog().getByRole('button', { name: 'Отмена' }).click();
  await page.waitForTimeout(800);
  note(`ait-9os cancel delete -> focus: ${await active(page)}`);

  note(`TAG=${TAG} EMAIL=${EMAIL} topicUrl=${page.url()}`);
  fs.writeFileSync(path.join(OUT, 'data', 'verify-focus.log'), lines.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
