import { differsOnlyByLineEndings } from './changed-scopes.mjs';

/**
 * Pure logic behind `npm run audit:explain`.
 *
 * `audit:all` asks the live advisory registry, so it can turn red on a tree nobody touched:
 * a vulnerability published this morning fails a build whose lock file has not moved in weeks.
 * This module answers the question that follows — "which of these findings did my change bring,
 * and which arrived from outside?" — by diffing two `npm audit --json` reports and by comparing
 * lock files byte for byte.
 *
 * Nothing here performs I/O or spawns a process. The driver (`scripts/audit-explain.mjs`) owns
 * git, npm and the filesystem; this file only transforms strings and buffers, so the tests run
 * offline against fixtures.
 */

/** Severity names as npm emits them, ordered worst first. */
export const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low', 'info'];

const severityRank = (severity) => {
  const index = SEVERITY_ORDER.indexOf(severity);

  return index === -1 ? SEVERITY_ORDER.length : index;
};

/**
 * Raised whenever a report cannot be trusted to describe a completed audit.
 *
 * This repository already carries tools that answer "no errors found" when the underlying
 * command never ran, and `CLAUDE.md` names them one by one. The rule for this module is the
 * opposite: an audit that did not produce a well-formed report is a failure, never a clean
 * result, so every doubtful input raises instead of degrading to an empty finding set.
 */
export class AuditReportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuditReportError';
  }
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Turns npm's failure envelope into one readable line.
 *
 * The envelope is not the shape the name suggests. A registry that refuses the connection makes
 * npm print `{"message": "request to ... failed, reason: connect ECONNREFUSED", "error": {"summary":
 * "", "detail": ""}}` — the only sentence worth reading sits at the top level, and `error` carries
 * two empty strings. Reading `error` alone would report the failure as `{"summary":"","detail":""}`,
 * which tells the reader nothing about a broken network. So the top-level `message` is consulted
 * first and the nested fields fill in behind it.
 */
const describeNpmError = (report) => {
  if (!isPlainObject(report)) {
    return String(report);
  }

  const error = isPlainObject(report.error) ? report.error : {};
  const parts = [report.message, error.code, error.summary, error.detail]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim());

  if (parts.length > 0) {
    return [...new Set(parts)].join(': ');
  }

  return typeof report.error === 'string' ? report.error : JSON.stringify(report.error);
};

/**
 * Parses the stdout of `npm audit --json` and refuses anything that is not a complete report.
 *
 * `label` names the audit in the error message ("server current", "server base at ca06225"), so
 * a failure says which of the two runs broke without the caller re-wrapping the error.
 */
export const parseAuditReport = ({ label, source }) => {
  const where = label ? ` (${label})` : '';

  if (typeof source !== 'string' || source.trim() === '') {
    throw new AuditReportError(
      `npm audit${where} produced no output; treating this as a failed audit, not as zero vulnerabilities.`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new AuditReportError(`npm audit${where} did not return JSON: ${error.message}`);
  }

  if (!isPlainObject(parsed)) {
    throw new AuditReportError(
      `npm audit${where} returned ${Array.isArray(parsed) ? 'an array' : typeof parsed}, not an audit report object.`,
    );
  }

  // npm reports registry and network failures as a JSON object carrying `error` and no report.
  if ('error' in parsed) {
    throw new AuditReportError(`npm audit${where} failed: ${describeNpmError(parsed)}`);
  }

  if (!('auditReportVersion' in parsed)) {
    throw new AuditReportError(
      `npm audit${where} returned JSON without "auditReportVersion"; this is not an audit report.`,
    );
  }

  if (!isPlainObject(parsed.vulnerabilities)) {
    throw new AuditReportError(
      `npm audit${where} returned a report without a "vulnerabilities" object.`,
    );
  }

  if (!isPlainObject(parsed.metadata) || !isPlainObject(parsed.metadata.vulnerabilities)) {
    throw new AuditReportError(
      `npm audit${where} returned a report without "metadata.vulnerabilities" counters.`,
    );
  }

  return parsed;
};

const GHSA_PATTERN = /(GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4})/i;

/**
 * Identity of a single advisory inside one package.
 *
 * A package routinely carries several advisories at once — `mysql2` held two in this
 * repository's own history — so matching on the package name alone would collapse them into one
 * finding and hide the case where a change fixes one and leaves the other. The GHSA identifier
 * from the advisory URL is preferred because it survives registry-side renumbering; npm's
 * numeric `source` is the fallback, and the title the last resort.
 */
export const advisoryIdOf = (via) => {
  if (typeof via === 'string') {
    return `via:${via}`;
  }

  if (!isPlainObject(via)) {
    return 'unspecified';
  }

  const url = typeof via.url === 'string' ? via.url : '';
  const ghsa = GHSA_PATTERN.exec(url);
  if (ghsa) {
    // GitHub publishes these as an upper-case `GHSA-` prefix over a lower-case body, and the id
    // is printed for a human to paste back into an advisory URL. Canonicalising to that form
    // makes two spellings of one advisory compare equal without mangling the identifier on
    // screen, which a blanket toUpperCase() would do.
    return `GHSA-${ghsa[1].slice('GHSA-'.length).toLowerCase()}`;
  }

  if (url) {
    return url;
  }

  if (via.source !== undefined && via.source !== null) {
    return `npm:${via.source}`;
  }

  if (typeof via.title === 'string' && via.title.trim()) {
    return `title:${via.title.trim()}`;
  }

  return 'unspecified';
};

/** Stable key used to match a finding across two reports. */
export const findingKey = ({ packageName, advisoryId }) => `${packageName}|${advisoryId}`;

const makeFinding = ({ packageName, severity, advisoryId, title, url, range }) => ({
  packageName,
  severity,
  advisoryId,
  title,
  url,
  range,
  key: findingKey({ packageName, advisoryId }),
});

const compareFindings = (a, b) =>
  severityRank(a.severity) - severityRank(b.severity) ||
  a.packageName.localeCompare(b.packageName) ||
  a.advisoryId.localeCompare(b.advisoryId);

/**
 * Flattens `report.vulnerabilities` into one finding per (package, advisory) pair.
 *
 * npm's `via` array mixes two kinds of entry: advisory objects, and bare package-name strings
 * that mean "this package is vulnerable only because a dependency of it is". Both become
 * findings — the second kind keyed as `via:<name>` — so a transitive exposure that a change
 * introduces or removes is reported rather than silently dropped.
 */
export const extractFindings = (report) => {
  if (!isPlainObject(report) || !isPlainObject(report.vulnerabilities)) {
    throw new AuditReportError('Cannot extract findings from a report without "vulnerabilities".');
  }

  const byKey = new Map();

  for (const [packageName, entry] of Object.entries(report.vulnerabilities)) {
    if (!isPlainObject(entry)) {
      continue;
    }

    const entrySeverity = typeof entry.severity === 'string' ? entry.severity : 'unknown';
    const entryRange = typeof entry.range === 'string' ? entry.range : '';
    const viaList = Array.isArray(entry.via) ? entry.via : [];

    if (viaList.length === 0) {
      const finding = makeFinding({
        packageName,
        severity: entrySeverity,
        advisoryId: 'unspecified',
        title: '',
        url: '',
        range: entryRange,
      });
      byKey.set(finding.key, finding);
      continue;
    }

    for (const via of viaList) {
      if (typeof via !== 'string' && !isPlainObject(via)) {
        continue;
      }

      const isTransitive = typeof via === 'string';
      const finding = makeFinding({
        packageName,
        severity: isTransitive
          ? entrySeverity
          : typeof via.severity === 'string'
            ? via.severity
            : entrySeverity,
        advisoryId: advisoryIdOf(via),
        title: isTransitive
          ? `vulnerable through ${via}`
          : typeof via.title === 'string'
            ? via.title
            : '',
        url: isTransitive ? '' : typeof via.url === 'string' ? via.url : '',
        range: isTransitive ? entryRange : typeof via.range === 'string' ? via.range : entryRange,
      });

      byKey.set(finding.key, finding);
    }
  }

  return [...byKey.values()].sort(compareFindings);
};

/**
 * Splits two finding sets into the three groups the tool exists to report.
 *
 * `introduced` is the only group that argues against merging; `preexisting` and `resolved` both
 * describe findings the change did not create.
 */
export const diffFindings = ({ base = [], current = [] }) => {
  const baseKeys = new Set(base.map((finding) => finding.key));
  const currentKeys = new Set(current.map((finding) => finding.key));

  return {
    introduced: current.filter((finding) => !baseKeys.has(finding.key)).sort(compareFindings),
    preexisting: current.filter((finding) => baseKeys.has(finding.key)).sort(compareFindings),
    resolved: base.filter((finding) => !currentKeys.has(finding.key)).sort(compareFindings),
  };
};

/** Parses both reports and diffs them in one step. Throws if either report is not trustworthy. */
export const diffAuditReports = ({ baseSource, currentSource, baseLabel, currentLabel }) => {
  const baseReport = parseAuditReport({ label: baseLabel, source: baseSource });
  const currentReport = parseAuditReport({ label: currentLabel, source: currentSource });

  const base = extractFindings(baseReport);
  const current = extractFindings(currentReport);

  return { base, baseReport, current, currentReport, ...diffFindings({ base, current }) };
};

/**
 * Counts findings per severity, plus a total, using npm's own severity vocabulary.
 *
 * `total` counts every finding, including one whose severity npm did not name; the membership
 * test runs against `SEVERITY_ORDER` rather than against the summary object so that a finding
 * reported with the literal severity `total` cannot increment the total twice.
 */
export const summarizeBySeverity = (findings) => {
  const summary = Object.fromEntries(SEVERITY_ORDER.map((severity) => [severity, 0]));
  summary.total = 0;

  for (const finding of findings) {
    if (SEVERITY_ORDER.includes(finding.severity)) {
      summary[finding.severity] += 1;
    }
    summary.total += 1;
  }

  return summary;
};

const toBuffer = (value) => (Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8'));

/**
 * Compares two lock files byte for byte.
 *
 * An identical lock file means an identical dependency tree, which means every finding came from
 * the registry rather than from the change — the cheap answer this tool is built around, because
 * it needs no second audit.
 *
 * `lineEndingsOnly` exists for Windows checkouts: with `core.autocrlf=true` the working copy of a
 * lock file can carry CRLF while the blob `git show` returns carries LF. That is the same tree,
 * and reporting it as a change would send every run down the expensive path for nothing.
 */
export const compareLockfiles = ({ base, current }) => {
  if (base === null || base === undefined) {
    throw new AuditReportError('Cannot compare lock files: base content is missing.');
  }

  if (current === null || current === undefined) {
    throw new AuditReportError('Cannot compare lock files: current content is missing.');
  }

  const baseBuffer = toBuffer(base);
  const currentBuffer = toBuffer(current);
  const identical = Buffer.compare(baseBuffer, currentBuffer) === 0;

  return {
    identical,
    lineEndingsOnly:
      !identical &&
      differsOnlyByLineEndings(baseBuffer.toString('utf8'), currentBuffer.toString('utf8')),
    baseBytes: baseBuffer.length,
    currentBytes: currentBuffer.length,
  };
};

/** True when the two lock files describe the same dependency tree. */
export const lockfilesEquivalent = (comparison) =>
  comparison.identical || comparison.lineEndingsOnly;

/** One human-readable line per finding, aligned enough to scan a list of them. */
export const formatFinding = (finding) => {
  const severity = `${finding.severity}`.padEnd(8);
  const advisory = finding.advisoryId ? ` ${finding.advisoryId}` : '';
  const title = finding.title ? ` — ${finding.title}` : '';

  return `${severity} ${finding.packageName}${advisory}${title}`;
};
