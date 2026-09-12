// Re-check two LIKELY candidates with longer waits; read-only.
const path = require('path');
const fs = require('fs');
const { chromium } = require(
  path.join('C:/Users/admin/Documents/WebAI/AI_Template/node_modules/playwright'),
);

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'shots', 'recheck');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 } })
  ).newPage();
  const calls = [];
  page.on('response', (r) => {
    if (r.url().includes(':3000')) calls.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  await page.goto(`${BASE}/login`);
  await page.fill('input[type=email], input[name=email]', 'admin@admin.admin');
  await page.fill('input[type=password]', 'admin123456');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  await page.goto(`${BASE}/admin/tests`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Сгенерировать с ИИ/ }).click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(OUT, 'ai-generator-after-8s.png'), fullPage: true });
  const dlg = await page.getByRole('dialog').innerText();
  fs.writeFileSync(path.join(OUT, 'ai-generator-after-8s.txt'), dlg);
  console.log(
    'AI dialog models line:',
    (dlg.match(/Показано[^\n]*/) || [''])[0],
    '|',
    (dlg.match(/Всего в каталоге[^\n]*/) || [''])[0],
  );
  await page.keyboard.press('Escape');

  // Prompt options offered to a test: topic 1007 settings.
  await page.goto(`${BASE}/admin/tests/1007/settings`);
  await page.waitForLoadState('networkidle');
  const opts = await page.locator('select').first().locator('option').allInnerTexts();
  console.log('prompt select options:', JSON.stringify(opts));
  fs.writeFileSync(path.join(OUT, 'api.log'), calls.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
