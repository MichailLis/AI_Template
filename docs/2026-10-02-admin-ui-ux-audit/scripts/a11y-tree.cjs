// Screen-reader proxy: the accessibility tree Chromium hands to assistive technology, per route.
// Reports the heading outline, landmarks, controls without a name and the live regions.
// It is not a substitute for listening with NVDA or VoiceOver.
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, ROUTES, login, settle, slug } = require('./lib.cjs');

(async () => {
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const browser = await chromium.launch();
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' })
  ).newPage();
  await login(page);
  const cdp = await page.context().newCDPSession(page);
  const out = [];
  for (const route of ROUTES.slice(1)) {
    await page.goto(`${BASE}${route}`);
    await settle(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const live = nodes.filter((n) => !n.ignored);
    const role = (n) => n.role?.value || '';
    const name = (n) => (n.name?.value || '').trim();
    const level = (n) => n.properties?.find((p) => p.name === 'level')?.value.value;
    const headings = live
      .filter((n) => role(n) === 'heading')
      .map((n) => `h${level(n)} ${name(n)}`);
    const landmarks = live
      .filter((n) =>
        ['main', 'navigation', 'banner', 'complementary', 'contentinfo', 'region'].includes(
          role(n),
        ),
      )
      .map((n) => `${role(n)}${name(n) ? `:${name(n)}` : ''}`);
    const controls = [
      'button',
      'link',
      'textbox',
      'combobox',
      'checkbox',
      'radio',
      'switch',
      'tab',
      'slider',
      'spinbutton',
      'menuitem',
    ];
    const unnamed = live.filter((n) => controls.includes(role(n)) && !name(n)).map((n) => role(n));
    const liveRegions = live
      .filter((n) => n.properties?.some((p) => p.name === 'live' && p.value.value !== 'off'))
      .map((n) => `${role(n)}:${name(n) || '(без имени)'}`);
    const line = `${route}\n  headings: ${JSON.stringify(headings)}\n  landmarks: ${JSON.stringify(landmarks)}\n  unnamed controls: ${JSON.stringify(unnamed)}\n  live regions: ${JSON.stringify(liveRegions)}`;
    out.push(line);
    console.log(line);
    fs.writeFileSync(
      path.join(OUT, 'data', `ax_${slug(route)}.json`),
      JSON.stringify(
        nodes.filter((n) => !n.ignored).map((n) => ({ role: role(n), name: name(n) })),
        null,
        1,
      ),
    );
  }
  fs.writeFileSync(path.join(OUT, 'data', 'a11y-tree.log'), out.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
