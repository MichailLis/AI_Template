import { constants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const readFromRoot = async (relativePath) =>
  readFile(join(root, relativePath), 'utf-8');

const existsFromRoot = async (relativePath) => {
  try {
    await access(join(root, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const ensureIncludes = (errors, source, needle, context) => {
  if (!source.includes(needle)) {
    errors.push(`${context}: expected to include "${needle}"`);
  }
};

const verify = async () => {
  const errors = [];

  const manifestRaw = await readFromRoot('template/features.manifest.json');
  const manifest = JSON.parse(manifestRaw);

  const appModule = await readFromRoot('server/src/app.module.ts');
  const appRoutes = await readFromRoot('client/src/app/App.tsx');
  const dashboardExists = await existsFromRoot('client/src/pages/dashboard.tsx');
  const dashboard = dashboardExists ? await readFromRoot('client/src/pages/dashboard.tsx') : '';
  const schemas = await readFromRoot('client/src/shared/api/schemas.ts');
  const prismaSchema = await readFromRoot('server/prisma/schema.prisma');

  const authModule = manifest.auth?.requiredBackendModule;
  if (authModule) {
    ensureIncludes(errors, appModule, authModule, 'server/src/app.module.ts');
  }

  const authRoutes = manifest.auth?.requiredRoutes ?? [];
  for (const route of authRoutes) {
    ensureIncludes(errors, appRoutes, `path="${route}"`, 'client/src/app/App.tsx');
  }

  const openApiExists = await existsFromRoot('server/openapi.json');
  const openApiDoc = openApiExists
    ? JSON.parse(await readFromRoot('server/openapi.json'))
    : null;

  for (const feature of manifest.features ?? []) {
    const featurePrefix = `feature:${feature.name}`;

    ensureIncludes(errors, appModule, feature.backendModule, 'server/src/app.module.ts');
    ensureIncludes(errors, appRoutes, `path="${feature.route}"`, 'client/src/app/App.tsx');
    if (!dashboardExists) {
      errors.push('client/src/pages/dashboard.tsx is missing but features are declared in manifest');
    } else {
      ensureIncludes(errors, dashboard, `to="${feature.route}"`, 'client/src/pages/dashboard.tsx');
    }
    ensureIncludes(
      errors,
      schemas,
      `export const ${feature.schema}`,
      'client/src/shared/api/schemas.ts',
    );
    ensureIncludes(
      errors,
      prismaSchema,
      `model ${feature.prismaModel}`,
      'server/prisma/schema.prisma',
    );

    for (const filePath of feature.backendFiles ?? []) {
      if (!(await existsFromRoot(filePath))) {
        errors.push(`${featurePrefix}: missing backend file ${filePath}`);
      }
    }

    for (const filePath of feature.frontendFiles ?? []) {
      if (!(await existsFromRoot(filePath))) {
        errors.push(`${featurePrefix}: missing frontend file ${filePath}`);
      }
    }

    if (feature.generatedApiFile && !(await existsFromRoot(feature.generatedApiFile))) {
      errors.push(`${featurePrefix}: missing generated API file ${feature.generatedApiFile}`);
    }

    if (openApiDoc && !openApiDoc.paths?.[feature.route]) {
      errors.push(`${featurePrefix}: route ${feature.route} missing in server/openapi.json`);
    }
  }

  if (errors.length > 0) {
    console.error('Architecture verification failed.');
    for (const [index, error] of errors.entries()) {
      console.error(`${index + 1}. ${error}`);
    }
    process.exit(1);
  }

  console.log(`Architecture verification passed (${manifest.features?.length ?? 0} features).`);
};

verify().catch((error) => {
  console.error('Architecture verification crashed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
