// Pass 3b: focus return re-check with a long wait, and browser-computed names on the prompts form.
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, login, settle } = require('./lib.cjs');
const lines = [];
const note = (s) => {
  lines.push(s);
  console.log(s);
};
const active = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  return `${el.tagName.toLowerCase()}:${(el.getAttribute('aria-label') || el.textContent.trim() || '').slice(0, 40)}`;
};
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  await login(page);
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url())) return route.abort();
    return route.continue();
  });
  for (const [route, name, how] of [
    ['/admin/tests', 'Создать', 'Escape'],
    ['/admin/tests', 'Создать', 'Отмена'],
    ['/admin/users', 'Добавить пользователя', 'Escape'],
    ['/admin/users', 'Добавить пользователя', 'Отмена'],
  ]) {
    await page.goto(`${BASE}${route}`);
    await settle(page);
    const trigger = page.getByRole('button', { name, exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    if (how === 'Escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: how, exact: true }).click();
    await page.waitForTimeout(2000);
    const after = await page.evaluate(active);
    const triggerConnected = await trigger.count();
    await page.keyboard.press('Tab');
    const next = await page.evaluate(active);
    note(
      `focus_return2 ${route} "${name}" close=${how}: after2s="${after}" triggerInDom=${triggerConnected} nextTab="${next}"`,
    );
  }
  await page.goto(`${BASE}/admin/prompts`);
  await settle(page);
  const aria = await page.locator('main').ariaSnapshot();
  fs.writeFileSync(path.join(OUT, 'data', 'prompts_aria_snapshot.yml'), aria);
  note(
    'prompts controls:\n' +
      aria
        .split('\n')
        .filter((l) => /textbox|slider|checkbox|combobox|spinbutton/.test(l))
        .join('\n'),
  );
  for (const route of ['/admin/tests', '/admin/users', '/admin/analytics']) {
    await page.goto(`${BASE}${route}`);
    await settle(page);
    const snap = await page.locator('main').ariaSnapshot();
    fs.writeFileSync(path.join(OUT, 'data', `aria_${route.split('/').pop()}.yml`), snap);
  }
  fs.appendFileSync(path.join(OUT, 'data', 'checks.log'), '\n' + lines.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
