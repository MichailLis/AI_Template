import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const apiMutatorPath = join(root, 'client', 'src', 'shared', 'api', 'api.ts');
const interceptorsPath = join(root, 'client', 'src', 'shared', 'api', 'interceptors.ts');
const appPath = join(root, 'client', 'src', 'app', 'App.tsx');
const generatedAuthPath = join(
  root,
  'client',
  'src',
  'shared',
  'api',
  'generated',
  'auth',
  'auth.ts',
);

const [apiMutatorSource, interceptorsSource, appSource, generatedAuthSource] = await Promise.all([
  readFile(apiMutatorPath, 'utf-8'),
  readFile(interceptorsPath, 'utf-8'),
  readFile(appPath, 'utf-8'),
  readFile(generatedAuthPath, 'utf-8'),
]);

const stripComments = (source) => {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
};

const apiMutatorCode = stripComments(apiMutatorSource);

const errors = [];

const forbiddenInMutator = [
  { pattern: /\bwindow\b/, reason: 'browser global `window`' },
  { pattern: /\bdocument\b/, reason: 'browser global `document`' },
  { pattern: /\blocalStorage\b/, reason: '`localStorage` access' },
  { pattern: /\bsessionStorage\b/, reason: '`sessionStorage` access' },
  { pattern: /\bsafeStorage\b/, reason: '`safeStorage` usage' },
  { pattern: /\bimport\.meta\b/, reason: '`import.meta` usage' },
  { pattern: /\.interceptors\./, reason: 'interceptor configuration' },
  { pattern: /setupInterceptors/, reason: '`setupInterceptors` reference' },
  { pattern: /useAuthStore/, reason: '`useAuthStore` reference' },
];

for (const rule of forbiddenInMutator) {
  if (rule.pattern.test(apiMutatorCode)) {
    errors.push(
      `client/src/shared/api/api.ts must not include ${rule.reason}; keep mutator Node-safe for Orval.`,
    );
  }
}

if (!/axios\.create\(/.test(apiMutatorSource)) {
  errors.push('client/src/shared/api/api.ts must create an Axios instance via axios.create(...).');
}

if (!/export\s+const\s+customInstance\s*=/.test(apiMutatorSource)) {
  errors.push('client/src/shared/api/api.ts must export `customInstance` for Orval mutator.');
}

if (!/export\s+const\s+configureApiBaseUrl\s*=/.test(apiMutatorSource)) {
  errors.push(
    'client/src/shared/api/api.ts must export `configureApiBaseUrl` for runtime base URL setup.',
  );
}

if (
  !/export\s+type\s+ErrorType\s*<\s*Error\s*>\s*=\s*AxiosError\s*<\s*Error\s*>\s*;/.test(
    apiMutatorSource,
  )
) {
  errors.push(
    'client/src/shared/api/api.ts must export `ErrorType<Error> = AxiosError<Error>` so Orval React Query errors match Axios runtime rejections.',
  );
}

if (!/export\s+default\s+api\s*;/.test(apiMutatorSource)) {
  errors.push('client/src/shared/api/api.ts must default export the Axios instance as `api`.');
}

if (!/export\s+const\s+setupInterceptors\s*=/.test(interceptorsSource)) {
  errors.push('client/src/shared/api/interceptors.ts must export `setupInterceptors`.');
}

if (!/configureApiBaseUrl\(import\.meta\.env\.VITE_API_URL\)/.test(appSource)) {
  errors.push(
    'client/src/app/App.tsx must call configureApiBaseUrl(import.meta.env.VITE_API_URL).',
  );
}

if (!/setupInterceptors\(api\)/.test(appSource)) {
  errors.push('client/src/app/App.tsx must call setupInterceptors(api).');
}

if (!/ErrorType\s*<\s*ErrorResponseDto\s*>/.test(generatedAuthSource)) {
  errors.push(
    'client/src/shared/api/generated/auth/auth.ts must type generated React Query errors as ErrorType<ErrorResponseDto>.',
  );
}

if (errors.length > 0) {
  console.error('API mutator architecture verification failed.');
  for (const [index, error] of errors.entries()) {
    console.error(`${index + 1}. ${error}`);
  }
  process.exit(1);
}

console.log('API mutator architecture verification passed.');
