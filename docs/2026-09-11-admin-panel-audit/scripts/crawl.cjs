// Pass 1 map: log in as admin and capture every admin route (screenshot + visible text).
const path = require('path');
const fs = require('fs');
const { chromium } = require(
  path.join('C:/Users/admin/Documents/WebAI/AI_Template/node_modules/playwright'),
);

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'shots');
const routes = (
  process.argv[2] ||
  '/admin/tests,/admin/users,/admin/prompts,/admin/public-links,/admin/public-links/organizations,/admin/analytics,/admin/settings'
).split(',');
const width = Number(process.argv[3] || 1440);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const apiLog = [];
  page.on('response', (r) => {
    const u = r.url();
    if (u.includes(':3000') || u.includes('/api/'))
      apiLog.push(`${r.status()} ${r.request().method()} ${u}`);
  });
  await page.goto(`${BASE}/login`);
  await page.fill('input[type=email], input[name=email]', 'admin@admin.admin');
  await page.fill('input[type=password]', 'admin123456');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  for (const r of routes) {
    await page.goto(`${BASE}${r}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    const name = `${width}${r.replace(/[/?=&:]+/g, '_')}`;
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    const text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(OUT, `${name}.txt`), `URL: ${page.url()}\n\n${text}`);
    console.log('captured', r, '->', page.url());
  }
  fs.writeFileSync(path.join(OUT, `api-${width}.log`), apiLog.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
