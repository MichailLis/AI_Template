import { constants } from 'node:fs';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';

const root = process.cwd();

const isNotFoundError = (error) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';

const readFromRoot = async (relativePath) =>
  readFile(join(root, relativePath), 'utf-8');

const readDirFromRoot = async (relativePath, withFileTypes = false) => {
  try {
    return await readdir(join(root, relativePath), { withFileTypes });
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
};

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

const collectMatches = (source, regex, groupIndex = 1) =>
  Array.from(source.matchAll(regex), (match) => match[groupIndex]);

const unique = (items) => Array.from(new Set(items));

const toRouteSegment = (route) => route.replace(/^\/+/, '').split('/')[0];

const hasToken = (source, token) => new RegExp(`\\b${token}\\b`).test(source);

const toPosixPath = (value) => value.replace(/\\/g, '/');

const collectClientSourceFiles = async (relativePath) => {
  const entries = await readDirFromRoot(relativePath, true);
  const files = [];

  for (const entry of entries) {
    const nextPath = `${relativePath}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await collectClientSourceFiles(nextPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(toPosixPath(nextPath));
    }
  }

  return files;
};

const collectImportSpecifiers = (source) => {
  const matches = [];

  const staticImportRegex = /import\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g;
  const exportFromRegex = /export\s+[\s\S]*?from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

  matches.push(...collectMatches(source, staticImportRegex));
  matches.push(...collectMatches(source, exportFromRegex));
  matches.push(...collectMatches(source, dynamicImportRegex));

  return unique(matches);
};

const resolveImportTargetPath = (fromFilePath, importSpecifier) => {
  if (importSpecifier.startsWith('@/')) {
    return toPosixPath(`client/src/${importSpecifier.slice(2)}`);
  }

  if (importSpecifier.startsWith('.')) {
    const baseDir = toPosixPath(dirname(fromFilePath));
    return toPosixPath(posix.normalize(posix.join(baseDir, importSpecifier)));
  }

  return null;
};

const getLayerInfo = (clientPath, layers) => {
  const normalized = toPosixPath(clientPath);
  const prefix = 'client/src/';

  if (!normalized.startsWith(prefix)) {
    return null;
  }

  const rest = normalized.slice(prefix.length);
  const parts = rest.split('/').filter(Boolean);
  const [layer, slice = null] = parts;

  if (!layer || !layers.includes(layer)) {
    return null;
  }

  return {
    layer,
    slice,
    parts,
    path: normalized,
  };
};

const hasPrefixMatch = (value, prefixes) =>
  prefixes.some((prefix) => value.startsWith(prefix));

const hasLayerBypass = (fromLayer, toLayer, rules) =>
  rules.some((rule) => rule.from === fromLayer && rule.to === toLayer);

const hasDeepImportBypass = (specifier, rules) =>
  rules.some((rule) => specifier.startsWith(rule.prefix));

const verifyFsdRules = async (errors) => {
  const fsdRulesPath = 'template/fsd.rules.json';

  if (!(await existsFromRoot(fsdRulesPath))) {
    errors.push(`${fsdRulesPath}: missing strict FSD rules file`);
    return;
  }

  const fsdRules = JSON.parse(await readFromRoot(fsdRulesPath));
  const fsdMode = fsdRules.mode ?? 'strict';

  const layers = fsdRules.layers ?? [];
  const allowedImports = fsdRules.allowedImports ?? {};
  const publicApi = fsdRules.publicApi ?? { enforce: false, layers: [] };
  const ignorePrefixes = (fsdRules.ignorePrefixes ?? []).map(toPosixPath);
  const transitionLayerBypass =
    fsdMode === 'transition'
      ? fsdRules.transition?.allowLayerBypass ?? []
      : [];
  const transitionDeepImportBypass =
    fsdMode === 'transition'
      ? fsdRules.transition?.allowDeepImports ?? []
      : [];

  const clientFiles = await collectClientSourceFiles('client/src');

  for (const filePath of clientFiles) {
    if (hasPrefixMatch(filePath, ignorePrefixes)) {
      continue;
    }

    const sourceInfo = getLayerInfo(filePath, layers);
    if (!sourceInfo) {
      continue;
    }

    const source = await readFromRoot(filePath);
    const importSpecifiers = collectImportSpecifiers(source);

    for (const importSpecifier of importSpecifiers) {
      const targetPath = resolveImportTargetPath(filePath, importSpecifier);

      if (!targetPath || hasPrefixMatch(targetPath, ignorePrefixes)) {
        continue;
      }

      const targetInfo = getLayerInfo(targetPath, layers);
      if (!targetInfo) {
        continue;
      }

      const sameSlice =
        sourceInfo.layer === targetInfo.layer &&
        sourceInfo.slice !== null &&
        sourceInfo.slice === targetInfo.slice;

      if (sameSlice) {
        continue;
      }

      const allowedLayers = new Set([
        sourceInfo.layer,
        ...(allowedImports[sourceInfo.layer] ?? []),
      ]);

      if (
        !allowedLayers.has(targetInfo.layer) &&
        !hasLayerBypass(sourceInfo.layer, targetInfo.layer, transitionLayerBypass)
      ) {
        errors.push(
          `FSD layer violation: ${filePath} imports ${importSpecifier} (${sourceInfo.layer} -> ${targetInfo.layer})`,
        );
      }

      if (
        publicApi.enforce &&
        (publicApi.layers ?? []).includes(targetInfo.layer) &&
        targetInfo.parts.length > 2 &&
        !hasDeepImportBypass(importSpecifier, transitionDeepImportBypass)
      ) {
        errors.push(
          `FSD public API violation: ${filePath} imports deep path ${importSpecifier}; use @/${targetInfo.layer}/${targetInfo.slice}`,
        );
      }
    }
  }
};

const verify = async () => {
  const errors = [];

  const manifestRaw = await readFromRoot('template/features.manifest.json');
  const manifest = JSON.parse(manifestRaw);
  const features = manifest.features ?? [];

  const appModule = await readFromRoot('server/src/app.module.ts');
  const appRoutes = await readFromRoot('client/src/app/App.tsx');
  const dashboardExists = await existsFromRoot('client/src/pages/dashboard.tsx');
  const dashboard = dashboardExists ? await readFromRoot('client/src/pages/dashboard.tsx') : '';
  const schemas = await readFromRoot('client/src/shared/api/schemas.ts');
  const prismaSchema = await readFromRoot('server/prisma/schema.prisma');

  const authModule = manifest.auth?.requiredBackendModule;
  const authRoutes = manifest.auth?.requiredRoutes ?? [];
  const featureRoutes = features.map((feature) => feature.route);
  const featureModules = features.map((feature) => feature.backendModule);

  if (authModule) {
    ensureIncludes(errors, appModule, authModule, 'server/src/app.module.ts');
  }

  for (const route of authRoutes) {
    ensureIncludes(errors, appRoutes, `path="${route}"`, 'client/src/app/App.tsx');
  }

  const declaredRoutePaths = unique(collectMatches(appRoutes, /path="([^"]+)"/g));

  if (!declaredRoutePaths.includes('/')) {
    errors.push('client/src/app/App.tsx: expected to include a root route path="/"');
  }

  const isAllowedRoute = (route) => {
    if (route === '/' || route === '*') {
      return true;
    }

    if (authRoutes.includes(route) || featureRoutes.includes(route)) {
      return true;
    }

    return featureRoutes.some((featureRoute) => route.startsWith(`${featureRoute}/`));
  };

  for (const route of declaredRoutePaths) {
    if (!isAllowedRoute(route)) {
      errors.push(
        `client/src/app/App.tsx: unexpected route path="${route}" not declared by auth or features manifest`,
      );
    }
  }

  const localModuleImports = unique(
    collectMatches(appModule, /import\s+\{\s*([A-Za-z0-9_]+Module)\s*\}\s+from\s+'\.\/[^']+'/g),
  );
  const expectedLocalModules = new Set(['PrismaModule', authModule, ...featureModules].filter(Boolean));

  for (const moduleName of expectedLocalModules) {
    if (!localModuleImports.includes(moduleName)) {
      errors.push(`server/src/app.module.ts: missing local module import ${moduleName}`);
    }
  }

  for (const importedModule of localModuleImports) {
    if (!expectedLocalModules.has(importedModule)) {
      errors.push(
        `server/src/app.module.ts: unexpected local module import ${importedModule} (not declared in manifest)`,
      );
    }
  }

  const importsSection = appModule.match(/imports:\s*\[([\s\S]*?)\],\s*controllers:/)?.[1] ?? '';

  for (const moduleName of expectedLocalModules) {
    if (!hasToken(importsSection, moduleName)) {
      errors.push(`server/src/app.module.ts: missing ${moduleName} in AppModule imports array`);
    }
  }

  const openApiExists = await existsFromRoot('server/openapi.json');
  const openApiDoc = openApiExists
    ? JSON.parse(await readFromRoot('server/openapi.json'))
    : null;

  const allowedBackendModuleFiles = new Set([
    'server/src/auth/auth.module.ts',
    ...features
      .flatMap((feature) => feature.backendFiles ?? [])
      .filter((filePath) => filePath.endsWith('.module.ts')),
  ]);
  const serverSrcEntries = await readDirFromRoot('server/src', true);

  for (const entry of serverSrcEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const moduleFilePath = `server/src/${entry.name}/${entry.name}.module.ts`;
    if ((await existsFromRoot(moduleFilePath)) && !allowedBackendModuleFiles.has(moduleFilePath)) {
      errors.push(`${moduleFilePath}: stale backend module directory is not declared in manifest`);
    }
  }

  const featureDirEntries = await readDirFromRoot('client/src/features', true);
  const allowedFeatureDirs = new Set(['auth', ...features.map((feature) => feature.name)]);

  for (const entry of featureDirEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const nestedEntries = await readDirFromRoot(`client/src/features/${entry.name}`);
    if (nestedEntries.length > 0 && !allowedFeatureDirs.has(entry.name)) {
      errors.push(
        `client/src/features/${entry.name}: stale feature directory not declared in manifest`,
      );
    }
  }

  const pageDirEntries = await readDirFromRoot('client/src/pages', true);
  const allowedPageDirs = new Set(featureRoutes.map(toRouteSegment).filter(Boolean));

  for (const entry of pageDirEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const nestedEntries = await readDirFromRoot(`client/src/pages/${entry.name}`);
    if (nestedEntries.length > 0 && !allowedPageDirs.has(entry.name)) {
      errors.push(
        `client/src/pages/${entry.name}: stale page directory not declared in manifest routes`,
      );
    }
  }

  const generatedDirEntries = await readDirFromRoot('client/src/shared/api/generated', true);
  const allowedGeneratedDirs = new Set(['app', 'auth', ...features.map((feature) => feature.name)]);

  for (const entry of generatedDirEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (!allowedGeneratedDirs.has(entry.name)) {
      errors.push(
        `client/src/shared/api/generated/${entry.name}: stale generated API directory not declared in manifest`,
      );
    }
  }

  for (const feature of features) {
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

  await verifyFsdRules(errors);

  if (errors.length > 0) {
    console.error('Architecture verification failed.');
    for (const [index, error] of errors.entries()) {
      console.error(`${index + 1}. ${error}`);
    }
    process.exit(1);
  }

  console.log(`Architecture verification passed (${features.length} features).`);
};

verify().catch((error) => {
  console.error('Architecture verification crashed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
