import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { verifyPairedRules } from './lib/paired-rules.mjs';

const rootDir = process.cwd();
const toPosix = (p) => p.replace(/\\/g, '/');

const registryPath = join(rootDir, 'template', 'paired-rules.json');
const vectorsPath = join(rootDir, 'template', 'paired-rules.vectors.json');

const collectFiles = (dir) => {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      const relPath = toPosix(relative(rootDir, fullPath));
      if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) {
        results.push({
          fullPath,
          relativePath: relPath,
          source: readFileSync(fullPath, 'utf8'),
        });
      }
    }
  }

  return results;
};

const run = () => {
  if (!existsSync(registryPath)) {
    console.error(`Missing registry file: ${registryPath}`);
    process.exit(1);
  }

  let registry;
  try {
    registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${registryPath}: ${err.message}`);
    process.exit(1);
  }

  let vectorsDoc = null;
  if (existsSync(vectorsPath)) {
    try {
      vectorsDoc = JSON.parse(readFileSync(vectorsPath, 'utf8'));
    } catch (err) {
      console.error(`Failed to parse ${vectorsPath}: ${err.message}`);
      process.exit(1);
    }
  }

  const clientFiles = collectFiles(join(rootDir, 'client', 'src'));
  const serverFiles = collectFiles(join(rootDir, 'server', 'src'));

  const fileExists = (relPath) => existsSync(resolve(rootDir, relPath));
  const readContent = (relPath) => readFileSync(resolve(rootDir, relPath), 'utf8');

  const result = verifyPairedRules({
    registry,
    vectorsDoc,
    clientFiles,
    serverFiles,
    readContent,
    fileExists,
  });

  if (!result.ok) {
    console.error('Paired rules verification failed:');
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const { stats } = result;
  console.log(
    `Verified ${stats.totalRules} rules in registry (${stats.behaviourCount} behaviour, ` +
      `${stats.constantCount} constants, ${stats.unrelatedCount} unrelated).`,
  );
  console.log(
    `Scanned ${stats.commonSymbolsCount} top-level symbols shared between client and server — all accounted for.`,
  );
  console.log('Paired rules verification passed.');
};

run();
