import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const client = join(root, 'client');
const scripts = JSON.parse(readFileSync(join(client, 'package.json'), 'utf8')).scripts;
const isTest = (file) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);

const readProject = (path) => {
  const config = ts.readConfigFile(path, ts.sys.readFile);
  assert.equal(config.error, undefined, `cannot read ${path}`);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(path));
  assert.deepEqual(parsed.errors, [], `invalid compiler config ${path}`);
  return parsed;
};

const buildProjects = (script) => {
  const command = script.split('&&')[0].trim();
  assert.match(command, /^tsc -b(?:\s+[\w./-]+)*$/, 'build must typecheck before bundling');
  const paths = command.split(/\s+/).slice(2);
  const visit = (path) => {
    const project = readProject(path);
    return [
      project,
      ...(project.projectReferences ?? []).flatMap((reference) =>
        visit(
          reference.path.endsWith('.json') ? reference.path : join(reference.path, 'tsconfig.json'),
        ),
      ),
    ];
  };
  return (paths.length ? paths : ['tsconfig.json']).flatMap((path) => visit(join(client, path)));
};

const dockerfile = readFileSync(join(client, 'Dockerfile'), 'utf8');
const dockerScript = dockerfile.match(/^RUN npm run ([\w:-]+)\s*$/m)?.[1];
assert.ok(dockerScript, 'Docker build must select a client npm build command');
const productionProjects = buildProjects(scripts[dockerScript]);
const normalProjects = buildProjects(scripts.build);
const productionFiles = productionProjects.flatMap((project) => project.fileNames);
const normalFiles = normalProjects.flatMap((project) => project.fileNames);

describe('client Docker compiler boundary', () => {
  it('excludes source tests whose repository fixtures are outside the client context', () => {
    assert.equal(productionFiles.find(isTest), undefined);
  });

  it('compiles every runtime source and Vite config with the normal strict options', () => {
    for (const file of normalFiles.filter((path) => !isTest(path))) {
      assert.ok(productionFiles.includes(file), `production build omitted ${file}`);
    }
    for (const production of productionProjects.filter((project) => project.fileNames.length)) {
      const normal = normalProjects.find((project) =>
        project.fileNames.includes(production.fileNames[0]),
      );
      assert.ok(normal, 'production project must correspond to a normal compiler project');
      const { tsBuildInfoFile: productionCache, ...productionOptions } = production.options;
      const { tsBuildInfoFile: normalCache, ...normalOptions } = normal.options;
      assert.deepEqual(productionOptions, normalOptions);
      if (production.fileNames.length !== normal.fileNames.length) {
        assert.notEqual(productionCache, normalCache, 'production must not reuse full app cache');
      }
    }
  });

  it('keeps every source test in the normal host and CI compiler build', () => {
    const tests = ts.sys.readDirectory(join(client, 'src'), ['.ts', '.tsx']).filter(isTest);
    assert.ok(tests.length > 0, 'source test discovery must not be empty');
    for (const file of tests) {
      assert.ok(normalFiles.includes(file), `normal build omitted ${file}`);
    }
    const vectorTests = tests.filter((file) =>
      readFileSync(file, 'utf8').includes('template/paired-rules.vectors.json'),
    );
    assert.equal(vectorTests.length, 4, 'all four shared-vector consumers stay covered');
  });
});
