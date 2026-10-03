// Pass 1: every admin route at four viewports — full-page screenshot plus raw measurements.
// usage: node crawl.cjs [widths=1440,768,375,320]
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, ROUTES, login, settle, slug, measure } = require('./lib.cjs');

const VIEWPORTS = { 1440: 900, 1024: 768, 768: 1024, 375: 812, 320: 640 };
const widths = (process.argv[2] || '1440,768,375,320').split(',').map(Number);

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const browser = await chromium.launch();
  console.log('chromium', browser.version());

  for (const width of widths) {
    const ctx = await browser.newContext({
      viewport: { width, height: VIEWPORTS[width] || 900 },
      locale: 'ru-RU',
    });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)));
    await login(page);

    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`);
      await settle(page);
      const name = `${width}_${slug(route)}`;
      await page.screenshot({ path: path.join(OUT, 'shots', `${name}.png`), fullPage: true });
      const data = await page.evaluate(measure);
      data.requested = route;
      data.consoleErrors = consoleErrors.splice(0);
      fs.writeFileSync(path.join(OUT, 'data', `${name}.json`), JSON.stringify(data, null, 2));
      const failing = data.contrast.filter(
        (c) => !c.disabled && c.ratio < (c.large ? 3 : 4.5),
      ).length;
      const small = data.targets.filter((t) => t.w < 24 || t.h < 24).length;
      console.log(
        `${name} -> ${data.url} | h:${data.headings.length} targets:${data.targets.length} small:${small} lowContrastGroups:${failing} overflowX:${data.scroll.docWidth > data.scroll.clientWidth + 1}`,
      );
    }
    await ctx.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
