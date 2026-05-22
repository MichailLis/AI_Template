import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const composePath = join(rootDir, 'docker-compose.yml');
const serverDockerfilePath = join(rootDir, 'server', 'Dockerfile');
const clientDockerfilePath = join(rootDir, 'client', 'Dockerfile');
const clientViteConfigPath = join(rootDir, 'client', 'vite.config.ts');
const serverPackagePath = join(rootDir, 'server', 'package.json');
const schematicsAssetCopyScriptPath = join(
  rootDir,
  'server',
  'scripts',
  'copy-schematics-assets.mjs',
);
const runtimeApiBaseUrlPath = join(
  rootDir,
  'client',
  'src',
  'shared',
  'api',
  'runtime-api-base-url.ts',
);
const envExamplePaths = ['.env.example', join('server', '.env.example'), '.env.deploy.example'];
const runtimeDocPaths = [
  'AI_GUIDE.md',
  join('docs', 'server-admin-deploy.md'),
  join('docs', 'deployment-dockerhub.md'),
];

const composeSource = readFileSync(composePath, 'utf8');
const serverDockerfile = readFileSync(serverDockerfilePath, 'utf8');
const clientDockerfile = readFileSync(clientDockerfilePath, 'utf8');
const clientViteConfigSource = readFileSync(clientViteConfigPath, 'utf8');
const serverPackage = JSON.parse(readFileSync(serverPackagePath, 'utf8'));
const runtimeApiBaseUrlSource = readFileSync(runtimeApiBaseUrlPath, 'utf8');
const legacyDevJwtValue = ['secret', '123'].join('');
const openRouterKeyPrefix = ['sk', 'or'].join('-');
const setupAppPath = join(rootDir, 'server', 'src', 'setup-app.ts');
const setupAppSource = readFileSync(setupAppPath, 'utf8');
const deployComposePath = join(rootDir, 'docker-compose.deploy.yml');
const deployComposeSource = readFileSync(deployComposePath, 'utf8');
const runtimeEnvNames = [
  'CORS_ALLOWED_ORIGINS',
  'OPENROUTER_DEFAULT_MODEL',
  'OPENROUTER_HTTP_REFERER',
  'OPENROUTER_APP_NAME',
  'OPENROUTER_TIMEOUT_MS',
  'OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS',
  'OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES',
];
const requiredRuntimeApiDiscoveryMarkers = [
  '/api-json',
  '/auth/signin',
  '/admin/tests/public-links',
  '/tests/public/links/{code}',
];

const failures = [];

const fail = (message) => {
  failures.push(message);
};

const commandToText = (command) => {
  if (Array.isArray(command)) {
    return command.join(' ');
  }

  if (typeof command === 'string') {
    return command;
  }

  return '';
};

let composeConfig;

try {
  const composeConfigRaw = execFileSync('docker', ['compose', 'config', '--format', 'json'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  composeConfig = JSON.parse(composeConfigRaw);
} catch (error) {
  fail(
    `docker compose config --format json failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

const services = composeConfig?.services ?? {};
const backend = services.backend;
const frontend = services.frontend;
const expectedServices = ['postgres', 'adminer', 'backend', 'frontend'];
const serverBuildSchematicsScript = serverPackage.scripts?.['build:schematics'] ?? '';

if (!backend) {
  fail('docker-compose.yml must define backend service');
}

if (!frontend) {
  fail('docker-compose.yml must define frontend service');
}

const actualServiceNames = Object.keys(services);
for (const serviceName of expectedServices) {
  if (!actualServiceNames.includes(serviceName)) {
    fail(`docker-compose.yml must define ${serviceName} service`);
  }
}

for (const serviceName of actualServiceNames) {
  if (!expectedServices.includes(serviceName)) {
    fail(`docker-compose.yml must not define unexpected service ${serviceName}`);
  }
}

if (/env_file:\s*(?:\r?\n\s*-\s*)?\.\/server\/\.env/.test(composeSource)) {
  fail('backend service must not depend on ./server/.env through env_file');
}

if (new RegExp(`${legacyDevJwtValue}|${openRouterKeyPrefix}-`, 'i').test(composeSource)) {
  fail('docker-compose.yml must not contain hardcoded runtime secrets');
}

if (/origin:\s*true/.test(setupAppSource)) {
  fail('server/src/setup-app.ts must not enable credentialed CORS for every origin');
}

if (!setupAppSource.includes('CORS_ALLOWED_ORIGINS')) {
  fail('server/src/setup-app.ts must read CORS_ALLOWED_ORIGINS');
}

for (const marker of [
  'is required outside local development',
  'Non-local runtime configuration contains unsafe placeholder values',
  'dev-access-secret-change-me',
  'dev-refresh-secret-change-me',
]) {
  if (!setupAppSource.includes(marker)) {
    fail(`server/src/setup-app.ts must enforce runtime guard marker: ${marker}`);
  }
}

if (backend) {
  const backendCommand = commandToText(backend.command);

  if (!backendCommand.includes('npm ci')) {
    fail('backend compose command must use npm ci');
  }

  if (backendCommand.includes('npm install')) {
    fail('backend compose command must not use npm install');
  }

  if (!backend.healthcheck) {
    fail('backend service must define a healthcheck');
  }
}

if (frontend) {
  const frontendCommand = commandToText(frontend.command);
  const frontendEnvironment = frontend.environment ?? {};
  const backendDependency = frontend.depends_on?.backend;

  if (!frontendCommand.includes('npm ci')) {
    fail('frontend compose command must use npm ci');
  }

  if (frontendCommand.includes('npm install')) {
    fail('frontend compose command must not use npm install');
  }

  if ('VITE_PUBLIC_API_BASE_URL' in frontendEnvironment) {
    fail('frontend compose environment must not use VITE_PUBLIC_API_BASE_URL');
  }

  if (!('VITE_API_URL' in frontendEnvironment)) {
    fail('frontend compose environment must expose VITE_API_URL');
  }

  if (!frontend.healthcheck) {
    fail('frontend service must define a healthcheck');
  }

  if (backendDependency?.condition !== 'service_healthy') {
    fail('frontend must depend on backend with condition service_healthy');
  }
}

for (const [label, dockerfile] of [
  ['server/Dockerfile', serverDockerfile],
  ['client/Dockerfile', clientDockerfile],
]) {
  if (!dockerfile.includes('npm ci')) {
    fail(`${label} must use npm ci`);
  }

  if (dockerfile.includes('npm install')) {
    fail(`${label} must not use npm install`);
  }
}

if (!serverBuildSchematicsScript) {
  fail('server package must define build:schematics script');
}

if (/powershell|Copy-Item/i.test(serverBuildSchematicsScript)) {
  fail('server build:schematics must not depend on PowerShell/Copy-Item');
}

if (!serverBuildSchematicsScript.includes('node scripts/copy-schematics-assets.mjs')) {
  fail('server build:schematics must copy schematics assets through a Node script');
}

if (!existsSync(schematicsAssetCopyScriptPath)) {
  fail('server/scripts/copy-schematics-assets.mjs must exist');
}

if (clientViteConfigSource.includes('VITE_PUBLIC_API_BASE_URL')) {
  fail('client/vite.config.ts must not read legacy VITE_PUBLIC_API_BASE_URL');
}

if (!clientViteConfigSource.includes('VITE_API_URL')) {
  fail('client/vite.config.ts must read VITE_API_URL');
}

for (const envExamplePath of envExamplePaths) {
  const envExample = readFileSync(join(rootDir, envExamplePath), 'utf8');
  const openRouterKeyMatch = envExample.match(/^OPENROUTER_API_KEY=(.*)$/m);
  const openRouterKeyValue = openRouterKeyMatch?.[1]?.trim() ?? '';

  if (openRouterKeyValue) {
    fail(`${envExamplePath} must leave OPENROUTER_API_KEY empty`);
  }

  if (new RegExp(`${legacyDevJwtValue}|${openRouterKeyPrefix}-`, 'i').test(envExample)) {
    fail(`${envExamplePath} must not contain real-looking runtime secrets`);
  }

  for (const runtimeEnvName of runtimeEnvNames) {
    if (!new RegExp(`^${runtimeEnvName}=`, 'm').test(envExample)) {
      fail(`${envExamplePath} must document ${runtimeEnvName}`);
    }
  }
}

for (const runtimeEnvName of runtimeEnvNames) {
  if (!new RegExp(`${runtimeEnvName}:\\s*\\$\\{${runtimeEnvName}`).test(composeSource)) {
    fail(`docker-compose.yml backend environment must expose ${runtimeEnvName}`);
  }

  if (!new RegExp(`${runtimeEnvName}:\\s*\\$\\{${runtimeEnvName}`).test(deployComposeSource)) {
    fail(`docker-compose.deploy.yml backend environment must expose ${runtimeEnvName}`);
  }
}

for (const runtimeDocPath of runtimeDocPaths) {
  const runtimeDoc = readFileSync(join(rootDir, runtimeDocPath), 'utf8');

  for (const runtimeEnvName of runtimeEnvNames) {
    if (!runtimeDoc.includes(runtimeEnvName)) {
      fail(`${runtimeDocPath} must document ${runtimeEnvName}`);
    }
  }
}

for (const marker of requiredRuntimeApiDiscoveryMarkers) {
  if (!runtimeApiBaseUrlSource.includes(marker)) {
    fail(`runtime API discovery must validate required marker ${marker}`);
  }
}

if (failures.length > 0) {
  console.error('Runtime config verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Runtime config verification passed.');
