import { stripComments } from './invariant-rules.mjs';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isIdentifier = (name) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);

/**
 * Builds a regex pattern matching declaration statements for a given symbol name.
 * Supported declaration types:
 * - export const X / const X = / let X / var X
 * - export function X / function X / async function X / export default function X
 * - export class X / class X / export abstract class X / abstract class X / export default class X
 * - export interface X / interface X
 * - export type X = / type X = / type X<T> =
 * - export enum X / enum X / const enum X
 */
export const buildDeclPattern = (symbolName) => {
  const s = escapeRegex(symbolName);
  return new RegExp(
    `^\\s*(export\\s+(?:default\\s+)?)?(?:declare\\s+)?(?:` +
      `(?:const|let|var)\\s+${s}\\b` +
      `|(?:async\\s+)?function(?:\\s*\\*|\\s+)\\s*${s}\\b` +
      `|(?:abstract\\s+)?class\\s+${s}\\b` +
      `|interface\\s+${s}\\b` +
      `|type\\s+${s}\\s*(?:<|=|;)` +
      `|(?:const\\s+)?enum\\s+${s}\\b` +
      `)`,
  );
};

const GENERATED_PREFIXES = ['client/src/shared/api/generated/', 'client/src/shared/api/model/'];

export const isGeneratedFile = (fileOrPath) => {
  if (!fileOrPath) return false;
  if (typeof fileOrPath === 'object' && typeof fileOrPath.isGenerated === 'boolean') {
    return fileOrPath.isGenerated;
  }
  const path = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath.relativePath;
  if (!path) return false;
  const norm = path.replace(/\\/g, '/');
  return GENERATED_PREFIXES.some((prefix) => norm.startsWith(prefix));
};

/**
 * Pure logic without I/O: analyzes a collection of files for a given symbol name.
 *
 * @param {Array<{ relativePath: string, source: string }>} files
 * @param {string} symbolName
 * @returns {object} Declarations, references, imports, exports, statistics, and verdict.
 */
export const indexSymbol = (files, symbolName) => {
  const sym = symbolName.trim();
  const validId = isIdentifier(sym);
  const refRegex = new RegExp(validId ? `\\b${escapeRegex(sym)}\\b` : escapeRegex(sym), 'g');
  const declPattern = validId ? buildDeclPattern(sym) : null;

  const declarations = [];
  const references = [];
  const referencesByFile = {};
  let generatedReferencesCount = 0;
  const imports = [];
  const exports = [];
  const filesWithOccurrences = new Set();

  for (const file of files) {
    const { relativePath, source } = file;
    const isGenerated = isGeneratedFile(file);
    const stripped = stripComments(source);
    const sourceLines = source.split(/\r?\n/);
    const strippedLines = stripped.split(/\r?\n/);

    // Check if this file exports the symbol via a separate export statement:
    // e.g. export { sym } (without "from") or export default sym;
    let fileHasSeparateExport = false;
    if (validId && !isGenerated) {
      const separateExportRegex = new RegExp(
        `\\bexport\\s*\\{[^}]*\\b${escapeRegex(sym)}\\b[^}]*\\}(?!\\s*from\\b)|\\bexport\\s+default\\s+${escapeRegex(sym)}\\b`,
      );
      fileHasSeparateExport = separateExportRegex.test(stripped);
    }

    // Extract multiline imports for this symbol
    if (validId) {
      const importStatementRegex = /\bimport\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]/gs;
      let m;
      while ((m = importStatementRegex.exec(stripped)) !== null) {
        const clause = m[1];
        const fromPath = m[2];
        const idRegex = new RegExp(`\\b${escapeRegex(sym)}\\b`);
        if (idRegex.test(clause)) {
          const before = source.slice(0, m.index);
          const lineNum = before.split(/\r?\n/).length;
          imports.push({
            relativePath,
            line: lineNum,
            from: fromPath,
            clause: clause.trim(),
            text: sourceLines[lineNum - 1]?.trim() || clause.trim(),
          });
        }
      }

      // Extract exports / re-exports (skip in generated files)
      if (!isGenerated) {
        const exportStatementRegex = /\bexport\s+\{([^}]+)\}(?:\s+from\s+['"]([^'"]+)['"])?/gs;
        while ((m = exportStatementRegex.exec(stripped)) !== null) {
          const clause = m[1];
          const fromPath = m[2];
          const idRegex = new RegExp(`\\b${escapeRegex(sym)}\\b`);
          if (idRegex.test(clause)) {
            const before = source.slice(0, m.index);
            const lineNum = before.split(/\r?\n/).length;
            exports.push({
              relativePath,
              line: lineNum,
              from: fromPath || null,
              isReexport: Boolean(fromPath),
              clause: clause.trim(),
              text: sourceLines[lineNum - 1]?.trim() || clause.trim(),
            });
          }
        }
      }
    }

    // Scan lines for references and declarations
    sourceLines.forEach((rawLine, idx) => {
      const lineNum = idx + 1;
      const trimmed = rawLine.trim();

      // References (checked on unstripped source to include string literals, comments, tests)
      const matches = [...rawLine.matchAll(refRegex)];
      if (matches.length > 0) {
        filesWithOccurrences.add(relativePath);
        if (isGenerated) {
          generatedReferencesCount += matches.length;
        } else {
          if (!referencesByFile[relativePath]) {
            referencesByFile[relativePath] = [];
          }
        }
        for (const match of matches) {
          const ref = {
            relativePath,
            line: lineNum,
            column: (match.index ?? 0) + 1,
            text: trimmed,
            isGenerated,
          };
          references.push(ref);
          if (!isGenerated) {
            referencesByFile[relativePath].push(ref);
          }
        }
      }

      // Declarations (checked on stripped source to avoid comments/strings)
      // Declarations (checked on stripped source; NEVER in generated files)
      if (declPattern && !isGenerated) {
        const strippedLine = strippedLines[idx] ?? '';
        const declMatch = strippedLine.match(declPattern);
        if (declMatch) {
          const isExported = Boolean(declMatch[1]) || fileHasSeparateExport;
          declarations.push({
            relativePath,
            line: lineNum,
            column: declMatch.index ? declMatch.index + 1 : 1,
            isExported,
            text: trimmed,
          });
        }
      }
    });
  }

  // Deduplicate and sort declarations
  declarations.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line);

  const declarationsCount = declarations.length;
  const referencesCount = references.length;
  const filesCount = filesWithOccurrences.size;

  let verdict = 'zero_declarations';
  if (declarationsCount === 1) {
    verdict = 'one_declaration';
  } else if (declarationsCount > 1) {
    verdict = 'multiple_declarations';
  }

  const hasClient = declarations.some((d) => d.relativePath.startsWith('client/'));
  const hasServer = declarations.some((d) => d.relativePath.startsWith('server/'));
  const hasClientServerDrift = declarationsCount > 1 && hasClient && hasServer;

  // Candidate for unused export:
  // Exactly 1 declaration, exported, but 0 imports in OTHER scanned files
  let isCandidateUnusedExport = false;
  if (declarationsCount === 1 && declarations[0].isExported) {
    const declFile = declarations[0].relativePath;
    const externalImports = imports.filter((imp) => imp.relativePath !== declFile);
    isCandidateUnusedExport = externalImports.length === 0 && generatedReferencesCount === 0;
  }
  return {
    symbol: sym,
    isIdentifier: validId,
    declarations,
    declarationsCount,
    references,
    referencesCount,
    referencesByFile,
    filesCount,
    generatedReferencesCount,
    imports,
    exports,
    verdict,
    hasClientServerDrift,
    isCandidateUnusedExport,
  };
};

export const findSymbol = indexSymbol;

/**
 * Formats the indexSymbol analysis result into standard terminal output.
 *
 * @param {object} result Result from indexSymbol
 * @returns {string}
 */
export const formatSymbolReport = (result) => {
  const {
    symbol,
    isIdentifier: validId,
    declarations,
    declarationsCount,
    referencesCount,
    referencesByFile,
    generatedReferencesCount = 0,
    filesCount,
    verdict,
    hasClientServerDrift,
    isCandidateUnusedExport,
  } = result;

  const lines = [];

  const declWord = declarationsCount === 1 ? 'declaration' : 'declarations';
  const refWord = referencesCount === 1 ? 'reference' : 'references';
  const filesWord = filesCount === 1 ? 'file' : 'files';

  if (declarationsCount > 0 || referencesCount > 0) {
    lines.push(
      `${symbol} — ${declarationsCount} ${declWord}, ${referencesCount} ${refWord} in ${filesCount} ${filesWord}`,
    );
  } else {
    lines.push(`${symbol} — 0 declarations, 0 references`);
  }
  lines.push('');

  if (declarationsCount > 0) {
    lines.push('DECLARATIONS');
    const locs = declarations.map((d) => `${d.relativePath}:${d.line}`);
    const maxLocLen = Math.max(...locs.map((l) => l.length));
    declarations.forEach((d, idx) => {
      const loc = locs[idx].padEnd(maxLocLen);
      const status = d.isExported ? 'exported' : 'local';
      lines.push(`  ${loc}  ${status}`);
    });
    lines.push('');
  }

  if (verdict === 'one_declaration') {
    if (isCandidateUnusedExport) {
      lines.push('NOTICE   Exported with no imports in other scanned files — candidate for');
      lines.push(
        '         unused export (may be used externally, via index re-exports, or by generated code).',
      );
      lines.push('');
    }

    lines.push('REFERENCES');
    const sortedFiles = Object.keys(referencesByFile).sort();
    for (const file of sortedFiles) {
      const refs = referencesByFile[file];
      const lineNums = [...new Set(refs.map((r) => r.line))].sort((a, b) => a - b);
      lines.push(`  ${file}:${lineNums.join(', ')}`);
    }
    if (generatedReferencesCount > 0) {
      const genRefWord = generatedReferencesCount === 1 ? 'reference' : 'references';
      lines.push(`  +${generatedReferencesCount} ${genRefWord} in the generated API client`);
    }
    lines.push('');

    if (!isCandidateUnusedExport) {
      lines.push(
        'NEXT     Single declaration found — question resolved here. Further tools not needed.',
      );
    }
  } else if (verdict === 'multiple_declarations') {
    if (hasClientServerDrift) {
      lines.push(
        'WARNING  Declared in both client/ and server/. These are two implementations of one',
      );
      lines.push('         rule and have drifted before. The server copy is the authority.');
      lines.push('');
      lines.push(
        'NEXT     Name is ambiguous — rg cannot tell you which tree owns which call site.',
      );
      lines.push('         Use Serena find_referencing_symbols scoped to one file.');
    } else {
      lines.push(`NEXT     Name is ambiguous (${declarationsCount} declarations).`);
      lines.push('         Use Serena find_referencing_symbols scoped to one file.');
    }
  } else {
    // zero_declarations
    if (!validId || referencesCount > 0) {
      lines.push('VERDICT  Not a code symbol (found as string, config key, or UI text).');
      lines.push('');
      lines.push(
        'NEXT     Use plain rg — strings and config values are not tracked in symbol graphs.',
      );
    } else {
      lines.push('VERDICT  Symbol or text not found anywhere in scanned files.');
      lines.push('');
      lines.push('NEXT     Check spelling or search outside scanned directories with rg.');
    }
  }

  return lines.join('\n');
};
