import { resolve } from 'node:path';

import { extractFindings, formatFinding, parseAuditReport } from './lib/audit-diff.mjs';
import { spawnSyncNpm } from './lib/npm-runner.mjs';

/**
 * Server half of `npm run audit:all`: `npm --prefix server audit`, minus the advisories below.
 *
 * Everything else still fails the gate. Transitive entries (`via:<package>`) are not listed: they
 * exist only because an advisory object is reported somewhere else, and that one is checked.
 */
const ALLOWED_ADVISORIES = new Map([
  // shortcut: deepmerge <=4.3.1 has no patched release (4.3.1 is latest), reached through
  // nestjs-zod, jest and @nestjs/cli; remove this entry when a deepmerge newer than 4.3.1 ships.
  ['deepmerge|GHSA-gcqx-w48m-w2h4', 'no fixed release'],
]);

const result = spawnSyncNpm(['audit', '--json'], {
  cwd: resolve(import.meta.dirname, '..', 'server'),
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});

if (result.error) {
  console.error(`npm audit (server) did not start: ${result.error.message}`);
  process.exit(1);
}

const blocking = extractFindings(
  parseAuditReport({ label: 'server', source: result.stdout }),
).filter(
  (finding) => !finding.advisoryId.startsWith('via:') && !ALLOWED_ADVISORIES.has(finding.key),
);

if (blocking.length > 0) {
  console.error('npm audit (server) found vulnerabilities:');
  for (const finding of blocking) {
    console.error(`  ${formatFinding(finding)}`);
  }
  process.exit(1);
}

console.log('npm audit (server): no vulnerabilities beyond the allowed advisories.');
