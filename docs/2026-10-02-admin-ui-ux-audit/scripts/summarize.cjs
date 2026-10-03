// Prints a compact summary of data/*.json produced by crawl.cjs / states.cjs.
const fs = require('fs');
const path = require('path');
const dir = path.join(process.env.AUDIT_OUT || require('./lib.cjs').OUT, 'data');
const filter = process.argv[2] || '';
for (const f of fs
  .readdirSync(dir)
  .filter((n) => n.endsWith('.json') && n.includes(filter))
  .sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (!d.contrast) continue;
  console.log(
    `\n=== ${f} -> ${d.url} title="${d.title}" lang=${d.lang} doc=${d.scroll.docWidth}/${d.scroll.clientWidth}`,
  );
  console.log('headings:', JSON.stringify(d.headings));
  console.log('landmarks:', JSON.stringify(d.landmarks), 'fontSizes:', JSON.stringify(d.fontSizes));
  for (const c of d.contrast.filter((c) => c.ratio < (c.large ? 3 : 4.5)))
    console.log(
      `  LOW ${c.ratio} ${c.fg} on ${c.bg} ${c.size}px/${c.weight}${c.large ? ' large' : ''}${c.disabled ? ' DISABLED' : ''}${c.bgUncertain ? ' bg?' : ''} x${c.count} ${JSON.stringify(c.samples)}`,
    );
  for (const t of d.targets.filter((t) => t.w < 24 || t.h < 24))
    console.log(
      `  SMALL ${t.w}x${t.h} <${t.tag} ${t.type}${t.role}> "${t.name}" inline=${t.inline} viol=${JSON.stringify(t.spacingViolations)}`,
    );
  for (const t of d.targets.filter((t) => !t.name))
    console.log(
      `  NONAME <${t.tag} ${t.type}${t.role}> ph="${t.placeholder}" at ${t.x},${t.y} ${t.w}x${t.h}`,
    );
  for (const t of d.targets.filter(
    (t) => ['input', 'select', 'textarea'].includes(t.tag) && !t.hasVisibleLabel,
  ))
    console.log(`  NOLABEL <${t.tag} ${t.type}> name="${t.name}" ph="${t.placeholder}"`);
  if (d.overflowing.length) console.log('  OVERFLOW', d.overflowing.slice(0, 6));
  if (d.clipped.length) console.log('  CLIPPED', d.clipped);
  if (d.consoleErrors && d.consoleErrors.length) console.log('  CONSOLE', d.consoleErrors);
}
