import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkStack, validateStackDeclaration } from './lib/stack-check.mjs';

const rootDir = process.cwd();

const readJson = (relativePath) => {
  try {
    return JSON.parse(readFileSync(join(rootDir, relativePath), 'utf8'));
  } catch {
    return null;
  }
};

const fail = (errors) => {
  console.error('Stack verification failed.');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
};

const declaration = readJson('template/stack.json');

if (declaration === null) {
  fail(['template/stack.json is missing or is not valid JSON']);
}

const declarationErrors = validateStackDeclaration(declaration);

if (declarationErrors.length > 0) {
  fail(declarationErrors);
}

const manifests = Object.fromEntries(
  [...new Set(declaration.packages.map((entry) => entry.manifest))].map((manifest) => [
    manifest,
    readJson(manifest),
  ]),
);

const errors = checkStack(declaration, manifests);

if (errors.length > 0) {
  fail(errors);
}

console.log(`Stack verification passed (${declaration.packages.length} packages).`);
