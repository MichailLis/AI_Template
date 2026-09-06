import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  advisoryIdOf,
  AuditReportError,
  compareLockfiles,
  diffAuditReports,
  diffFindings,
  extractFindings,
  findingKey,
  formatFinding,
  lockfilesEquivalent,
  parseAuditReport,
  SEVERITY_ORDER,
  summarizeBySeverity,
} from './audit-diff.mjs';

/**
 * The fixtures below reproduce shapes this repository actually produced, not invented ones.
 *
 * `serverBaseReport` is `npm audit --package-lock-only --json` over `server/` at commit ca06225,
 * trimmed to the fields the module reads; `cleanReport` is the same command on the current tree.
 * `registryFailure` is verbatim what npm prints when the registry refuses the connection — the
 * sentence describing the failure sits in the top-level `message` while `error` holds two empty
 * strings, which is the trap the parser has to survive.
 *
 * Nothing here touches the network: the module under test is pure, and these tests keep it that
 * way so a broken registry cannot turn `npm run test:scripts` red.
 */

const advisory = ({ name, title, url, severity, source, range }) => ({
  source,
  name,
  dependency: name,
  title,
  url,
  severity,
  range,
});

const serverBaseReport = {
  auditReportVersion: 2,
  vulnerabilities: {
    browserslist: {
      name: 'browserslist',
      severity: 'high',
      isDirect: false,
      via: [
        advisory({
          name: 'browserslist',
          title: 'Browserslist: Unbounded memory growth (no cache eviction)',
          url: 'https://github.com/advisories/GHSA-c83g-rgw3-j3cx',
          severity: 'high',
          source: 1153171,
          range: '<4.26.3',
        }),
      ],
      range: '<4.26.3',
    },
    mysql2: {
      name: 'mysql2',
      severity: 'high',
      isDirect: false,
      via: [
        advisory({
          name: 'mysql2',
          title: 'MySQL2: Auth Plugin Downgrade to mysql_clear_password',
          url: 'https://github.com/advisories/GHSA-3f6p-5ww8-9rcr',
          severity: 'high',
          source: 1153173,
          range: '<3.22.0',
        }),
      ],
      range: '<3.22.0',
    },
    prisma: {
      name: 'prisma',
      severity: 'moderate',
      isDirect: true,
      via: ['mysql2'],
      range: '5.0.0 - 6.19.0',
    },
    qs: {
      name: 'qs',
      severity: 'moderate',
      isDirect: false,
      via: [
        advisory({
          name: 'qs',
          title: 'qs array-limit bypass via bracket-key comma parsing',
          url: 'https://github.com/advisories/GHSA-x5fp-wj9c-mxmx',
          severity: 'moderate',
          source: 1158506,
          range: '<6.14.1',
        }),
      ],
      range: '<6.14.1',
    },
  },
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 2, high: 2, critical: 0, total: 4 },
    dependencies: { prod: 300, dev: 500, optional: 40, peer: 0, peerOptional: 0, total: 800 },
  },
};

const cleanReport = {
  auditReportVersion: 2,
  vulnerabilities: {},
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
    dependencies: { prod: 300, dev: 500, optional: 40, peer: 0, peerOptional: 0, total: 800 },
  },
};

const registryFailure = {
  message:
    'request to http://127.0.0.1:9/-/npm/v1/security/advisories/bulk failed, ' +
    'reason: connect ECONNREFUSED 127.0.0.1:9',
  error: { summary: '', detail: '' },
};

const asSource = (value) => JSON.stringify(value, null, 2);

const mysql2WithTwoAdvisories = {
  ...cleanReport,
  vulnerabilities: {
    mysql2: {
      name: 'mysql2',
      severity: 'high',
      range: '<3.22.0',
      via: [
        advisory({
          name: 'mysql2',
          title: 'Auth plugin downgrade',
          url: 'https://github.com/advisories/GHSA-3f6p-5ww8-9rcr',
          severity: 'high',
          source: 1153173,
          range: '<3.22.0',
        }),
        advisory({
          name: 'mysql2',
          title: 'Prototype pollution',
          url: 'https://github.com/advisories/GHSA-pw6n-x7fj-8h4v',
          severity: 'high',
          source: 1099999,
          range: '<3.9.8',
        }),
      ],
    },
  },
};

describe('parseAuditReport', () => {
  it('accepts a complete report', () => {
    const parsed = parseAuditReport({ label: 'server current', source: asSource(cleanReport) });

    assert.equal(parsed.auditReportVersion, 2);
    assert.equal(parsed.metadata.vulnerabilities.total, 0);
  });

  it('rejects empty output rather than reporting zero vulnerabilities', () => {
    for (const source of ['', '   \n  ', undefined, null, 7]) {
      assert.throws(
        () => parseAuditReport({ label: 'root', source }),
        (error) => error instanceof AuditReportError && /produced no output/.test(error.message),
        `expected ${JSON.stringify(source)} to be rejected`,
      );
    }
  });

  it('rejects output that is not JSON', () => {
    assert.throws(
      () => parseAuditReport({ label: 'client', source: 'npm error code E401\nUnauthorized' }),
      (error) => error instanceof AuditReportError && /did not return JSON/.test(error.message),
    );
  });

  it('rejects JSON that is not an object', () => {
    assert.throws(
      () => parseAuditReport({ label: 'client', source: '[]' }),
      (error) => error instanceof AuditReportError && /an array/.test(error.message),
    );
  });

  it('surfaces the top-level message when the registry is unreachable', () => {
    assert.throws(
      () =>
        parseAuditReport({ label: 'server base at ca06225', source: asSource(registryFailure) }),
      (error) =>
        error instanceof AuditReportError &&
        error.message.includes('server base at ca06225') &&
        error.message.includes('ECONNREFUSED') &&
        // The nested empty summary/detail must not be what the reader is shown instead.
        !error.message.includes('"summary"'),
    );
  });

  it('falls back to the nested error fields when there is no top-level message', () => {
    assert.throws(
      () =>
        parseAuditReport({
          label: 'root',
          source: asSource({ error: { code: 'E401', summary: 'Unauthorized', detail: 'token' } }),
        }),
      (error) =>
        error instanceof AuditReportError && /E401: Unauthorized: token/.test(error.message),
    );
  });

  it('rejects JSON that carries no auditReportVersion', () => {
    assert.throws(
      () => parseAuditReport({ label: 'root', source: '{"vulnerabilities":{}}' }),
      (error) => error instanceof AuditReportError && /auditReportVersion/.test(error.message),
    );
  });

  it('rejects a report without a vulnerabilities object', () => {
    assert.throws(
      () =>
        parseAuditReport({
          label: 'root',
          source: asSource({ auditReportVersion: 2, metadata: cleanReport.metadata }),
        }),
      (error) =>
        error instanceof AuditReportError && /"vulnerabilities" object/.test(error.message),
    );
  });

  it('rejects a report without metadata counters', () => {
    assert.throws(
      () =>
        parseAuditReport({
          label: 'root',
          source: asSource({ auditReportVersion: 2, vulnerabilities: {} }),
        }),
      (error) =>
        error instanceof AuditReportError && /metadata\.vulnerabilities/.test(error.message),
    );
  });

  it('names the audit in the message so a caller need not re-wrap the error', () => {
    assert.throws(
      () => parseAuditReport({ label: 'client base at origin/main', source: '' }),
      (error) => error.message.includes('(client base at origin/main)'),
    );
  });
});

describe('advisoryIdOf', () => {
  it('prefers the GHSA identifier from the advisory URL', () => {
    assert.equal(
      advisoryIdOf({ url: 'https://github.com/advisories/GHSA-3f6p-5ww8-9rcr', source: 1153173 }),
      'GHSA-3f6p-5ww8-9rcr',
    );
  });

  it('canonicalises the GHSA identifier so two spellings of one advisory match', () => {
    // The id is printed for a human to paste into an advisory URL, so canonical means GitHub's
    // own form — upper-case prefix, lower-case body — not simply upper case throughout.
    for (const url of [
      'https://github.com/advisories/ghsa-3f6p-5ww8-9rcr',
      'https://github.com/advisories/GHSA-3F6P-5WW8-9RCR',
      'https://github.com/advisories/GHSA-3f6p-5ww8-9rcr',
    ]) {
      assert.equal(advisoryIdOf({ url }), 'GHSA-3f6p-5ww8-9rcr');
    }
  });

  it('falls back to the URL, then the npm source id, then the title', () => {
    assert.equal(
      advisoryIdOf({ url: 'https://example.test/advisory/1' }),
      'https://example.test/advisory/1',
    );
    assert.equal(advisoryIdOf({ source: 1158506 }), 'npm:1158506');
    assert.equal(advisoryIdOf({ title: 'Prototype pollution' }), 'title:Prototype pollution');
  });

  it('marks a bare package-name via as a transitive exposure', () => {
    assert.equal(advisoryIdOf('mysql2'), 'via:mysql2');
  });

  it('never throws on junk', () => {
    assert.equal(advisoryIdOf(null), 'unspecified');
    assert.equal(advisoryIdOf(42), 'unspecified');
    assert.equal(advisoryIdOf({}), 'unspecified');
  });
});

describe('extractFindings', () => {
  it('produces one finding per package and advisory pair', () => {
    const findings = extractFindings(serverBaseReport);

    assert.deepEqual(
      findings.map((finding) => finding.key),
      [
        'browserslist|GHSA-c83g-rgw3-j3cx',
        'mysql2|GHSA-3f6p-5ww8-9rcr',
        'prisma|via:mysql2',
        'qs|GHSA-x5fp-wj9c-mxmx',
      ],
    );
  });

  it('keeps two advisories on one package apart', () => {
    const findings = extractFindings(mysql2WithTwoAdvisories);

    assert.equal(findings.length, 2, 'matching on the package name alone would collapse these');
    assert.deepEqual(findings.map((finding) => finding.advisoryId).sort(), [
      'GHSA-3f6p-5ww8-9rcr',
      'GHSA-pw6n-x7fj-8h4v',
    ]);
  });

  it('records a transitive exposure whose via entry is a bare package name', () => {
    const [transitive] = extractFindings(serverBaseReport).filter(
      (finding) => finding.packageName === 'prisma',
    );

    assert.equal(transitive.advisoryId, 'via:mysql2');
    assert.equal(transitive.severity, 'moderate', 'severity comes from the entry, not the string');
    assert.equal(transitive.title, 'vulnerable through mysql2');
    assert.equal(transitive.range, '5.0.0 - 6.19.0');
  });

  it('keeps an entry whose via list is empty instead of dropping it', () => {
    const findings = extractFindings({
      ...cleanReport,
      vulnerabilities: { lodash: { name: 'lodash', severity: 'low', via: [], range: '<4.17.21' } },
    });

    assert.deepEqual(
      findings.map((finding) => finding.key),
      ['lodash|unspecified'],
    );
  });

  it('orders findings worst severity first, then by package name', () => {
    const findings = extractFindings(serverBaseReport);
    const ranks = findings.map((finding) => SEVERITY_ORDER.indexOf(finding.severity));

    assert.deepEqual(
      [...ranks].sort((a, b) => a - b),
      ranks,
    );
    assert.deepEqual(
      findings.map((finding) => finding.packageName),
      ['browserslist', 'mysql2', 'prisma', 'qs'],
    );
  });

  it('returns nothing for a clean report and refuses a malformed one', () => {
    assert.deepEqual(extractFindings(cleanReport), []);
    assert.throws(() => extractFindings({ auditReportVersion: 2 }), AuditReportError);
    assert.throws(() => extractFindings(null), AuditReportError);
  });
});

describe('findingKey and formatFinding', () => {
  it('keys a finding on package and advisory together', () => {
    assert.equal(
      findingKey({ packageName: 'mysql2', advisoryId: 'GHSA-3f6p-5ww8-9rcr' }),
      'mysql2|GHSA-3f6p-5ww8-9rcr',
    );
  });

  it('renders a finding on one scannable line', () => {
    const [finding] = extractFindings(serverBaseReport);

    assert.equal(
      formatFinding(finding),
      'high     browserslist GHSA-c83g-rgw3-j3cx — ' +
        'Browserslist: Unbounded memory growth (no cache eviction)',
    );
  });

  it('omits the title separator when npm gave no title', () => {
    assert.equal(
      formatFinding({
        severity: 'low',
        packageName: 'lodash',
        advisoryId: 'unspecified',
        title: '',
      }),
      'low      lodash unspecified',
    );
  });
});

describe('diffFindings', () => {
  const base = extractFindings(serverBaseReport);
  const carriedOver = base.filter((finding) => finding.packageName === 'qs');
  const brandNew = extractFindings({
    ...cleanReport,
    vulnerabilities: {
      tar: {
        name: 'tar',
        severity: 'critical',
        range: '<6.2.1',
        via: [
          advisory({
            name: 'tar',
            title: 'Arbitrary file write',
            url: 'https://github.com/advisories/GHSA-f5x3-32g6-xq36',
            severity: 'critical',
            source: 1096000,
            range: '<6.2.1',
          }),
        ],
      },
    },
  });

  it('splits findings into introduced, pre-existing and resolved', () => {
    const groups = diffFindings({ base, current: [...brandNew, ...carriedOver] });

    assert.deepEqual(
      groups.introduced.map((finding) => finding.key),
      ['tar|GHSA-f5x3-32g6-xq36'],
    );
    assert.deepEqual(
      groups.preexisting.map((finding) => finding.key),
      ['qs|GHSA-x5fp-wj9c-mxmx'],
    );
    assert.deepEqual(
      groups.resolved.map((finding) => finding.key),
      ['browserslist|GHSA-c83g-rgw3-j3cx', 'mysql2|GHSA-3f6p-5ww8-9rcr', 'prisma|via:mysql2'],
    );
  });

  it('reports every base finding as resolved when the current tree is clean', () => {
    const groups = diffFindings({ base, current: [] });

    assert.equal(groups.introduced.length, 0);
    assert.equal(groups.preexisting.length, 0);
    assert.equal(groups.resolved.length, base.length);
  });

  it('reports every current finding as introduced when the base was clean', () => {
    const groups = diffFindings({ base: [], current: base });

    assert.equal(groups.introduced.length, base.length);
    assert.equal(groups.resolved.length, 0);
  });

  it('treats both sides as empty when called with no arguments', () => {
    assert.deepEqual(diffFindings({}), { introduced: [], preexisting: [], resolved: [] });
  });

  it('does not confuse two advisories that share a package name', () => {
    const [first, second] = extractFindings(mysql2WithTwoAdvisories);
    const groups = diffFindings({ base: [first], current: [second] });

    assert.deepEqual(
      groups.introduced.map((finding) => finding.advisoryId),
      [second.advisoryId],
    );
    assert.deepEqual(
      groups.resolved.map((finding) => finding.advisoryId),
      [first.advisoryId],
    );
    assert.equal(groups.preexisting.length, 0);
  });
});

describe('diffAuditReports', () => {
  it('parses both reports and reports the security fixes as resolved', () => {
    const result = diffAuditReports({
      baseLabel: 'server base at ca06225',
      baseSource: asSource(serverBaseReport),
      currentLabel: 'server current',
      currentSource: asSource(cleanReport),
    });

    assert.equal(result.base.length, 4);
    assert.equal(result.current.length, 0);
    assert.equal(result.introduced.length, 0);
    assert.equal(result.preexisting.length, 0);
    assert.deepEqual(
      result.resolved.map((finding) => finding.packageName),
      ['browserslist', 'mysql2', 'prisma', 'qs'],
    );
    assert.equal(result.currentReport.metadata.vulnerabilities.total, 0);
  });

  it('fails loudly when the base audit broke, instead of calling the base empty', () => {
    assert.throws(
      () =>
        diffAuditReports({
          baseLabel: 'server base at ca06225',
          baseSource: asSource(registryFailure),
          currentLabel: 'server current',
          currentSource: asSource(cleanReport),
        }),
      (error) => error instanceof AuditReportError && /server base at ca06225/.test(error.message),
    );
  });

  it('fails loudly when the current audit broke', () => {
    assert.throws(
      () =>
        diffAuditReports({
          baseLabel: 'server base at ca06225',
          baseSource: asSource(serverBaseReport),
          currentLabel: 'server current',
          currentSource: '',
        }),
      (error) => error instanceof AuditReportError && /server current/.test(error.message),
    );
  });
});

describe('summarizeBySeverity', () => {
  it('counts each severity and the total', () => {
    assert.deepEqual(summarizeBySeverity(extractFindings(serverBaseReport)), {
      critical: 0,
      high: 2,
      moderate: 2,
      low: 0,
      info: 0,
      total: 4,
    });
  });

  it('counts a severity npm did not name in the total only', () => {
    const summary = summarizeBySeverity([{ severity: 'unknown' }, { severity: 'low' }]);

    assert.equal(summary.total, 2);
    assert.equal(summary.low, 1);
    assert.equal(summary.critical, 0);
  });

  it('does not let a finding named "total" inflate the total twice', () => {
    assert.equal(summarizeBySeverity([{ severity: 'total' }]).total, 1);
  });

  it('returns zeroes for an empty set', () => {
    assert.deepEqual(summarizeBySeverity([]), {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
      total: 0,
    });
  });
});

describe('compareLockfiles', () => {
  const lock = '{\n  "name": "server",\n  "lockfileVersion": 3\n}\n';

  it('reports byte-identical lock files as identical', () => {
    const comparison = compareLockfiles({ base: Buffer.from(lock), current: Buffer.from(lock) });

    assert.equal(comparison.identical, true);
    assert.equal(comparison.lineEndingsOnly, false);
    assert.equal(comparison.baseBytes, comparison.currentBytes);
    assert.equal(lockfilesEquivalent(comparison), true);
  });

  it('treats a CRLF working copy of an LF blob as the same dependency tree', () => {
    const comparison = compareLockfiles({
      base: Buffer.from(lock),
      current: Buffer.from(lock.replace(/\n/g, '\r\n')),
    });

    assert.equal(comparison.identical, false);
    assert.equal(comparison.lineEndingsOnly, true);
    assert.equal(lockfilesEquivalent(comparison), true);
  });

  it('reports a real content change as a difference', () => {
    const comparison = compareLockfiles({
      base: Buffer.from(lock),
      current: Buffer.from(lock.replace('"lockfileVersion": 3', '"lockfileVersion": 2')),
    });

    assert.equal(comparison.identical, false);
    assert.equal(comparison.lineEndingsOnly, false);
    assert.equal(lockfilesEquivalent(comparison), false);
  });

  it('accepts strings as well as buffers and counts bytes, not characters', () => {
    const comparison = compareLockfiles({ base: lock, current: lock });

    assert.equal(comparison.identical, true);
    assert.equal(comparison.baseBytes, Buffer.byteLength(lock, 'utf8'));
  });

  it('refuses a missing side rather than calling it equal or empty', () => {
    assert.throws(() => compareLockfiles({ base: null, current: lock }), AuditReportError);
    assert.throws(() => compareLockfiles({ base: lock, current: undefined }), AuditReportError);
  });
});
