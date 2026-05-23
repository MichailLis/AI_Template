import { constants } from 'node:fs';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';

import { getRouteManifestErrors, isAllowedManifestRoute } from './lib/manifest-route-ownership.mjs';

const root = process.cwd();

const isNotFoundError = (error) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';

const readFromRoot = async (relativePath) => readFile(join(root, relativePath), 'utf-8');

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

const httpMethods = new Set(['delete', 'get', 'head', 'options', 'patch', 'post', 'put']);

const toPosixPath = (value) => value.replace(/\\/g, '/');

const normalizeManifestPath = (value) => toPosixPath(value).replace(/\/+$/, '');

const asArray = (value) => (Array.isArray(value) ? value : []);

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const broadOwnedRoots = new Set([
  'client/src',
  'client/src/features',
  'client/src/pages',
  'client/src/pages/admin',
  'client/src/widgets',
  'server/src',
]);

const validateOwnedRoot = async (errors, featurePrefix, scope, ownedRoot) => {
  if (typeof ownedRoot !== 'string' || ownedRoot.trim().length === 0) {
    errors.push(`${featurePrefix}: ${scope} owned root must be a non-empty string`);
    return;
  }

  const normalizedRoot = normalizeManifestPath(ownedRoot);

  if (normalizedRoot.includes('*')) {
    errors.push(`${featurePrefix}: ${scope} owned root ${ownedRoot} must not use globs`);
    return;
  }

  if (broadOwnedRoots.has(normalizedRoot)) {
    errors.push(`${featurePrefix}: ${scope} owned root ${ownedRoot} is too broad`);
    return;
  }

  if (!(await existsFromRoot(normalizedRoot))) {
    errors.push(`${featurePrefix}: missing ${scope} owned root ${ownedRoot}`);
  }
};

const getFeatureVerification = (errors, feature, featurePrefix) => {
  if (feature.verification === undefined) {
    return {};
  }

  if (!isObject(feature.verification)) {
    errors.push(`${featurePrefix}: verification must be an object`);
    return {};
  }

  return feature.verification;
};

const verifyOwnedRoots = async (errors, feature, featurePrefix) => {
  if (feature.ownedRoots !== undefined && !isObject(feature.ownedRoots)) {
    errors.push(`${featurePrefix}: ownedRoots must be an object with backend/frontend arrays`);
    return;
  }

  const verification = getFeatureVerification(errors, feature, featurePrefix);
  const ownedRoots = feature.ownedRoots ?? {};

  if (ownedRoots.backend !== undefined && !Array.isArray(ownedRoots.backend)) {
    errors.push(`${featurePrefix}: ownedRoots.backend must be an array`);
  }

  if (ownedRoots.frontend !== undefined && !Array.isArray(ownedRoots.frontend)) {
    errors.push(`${featurePrefix}: ownedRoots.frontend must be an array`);
  }

  const backendOwnedRoots = asArray(ownedRoots.backend);
  const frontendOwnedRoots = asArray(ownedRoots.frontend);

  if (verification.requireOwnedRoots === true) {
    if (backendOwnedRoots.length === 0) {
      errors.push(`${featurePrefix}: expected backend ownedRoots`);
    }

    if (frontendOwnedRoots.length === 0) {
      errors.push(`${featurePrefix}: expected frontend ownedRoots`);
    }
  }

  for (const ownedRoot of backendOwnedRoots) {
    await validateOwnedRoot(errors, featurePrefix, 'backend', ownedRoot);
  }

  for (const ownedRoot of frontendOwnedRoots) {
    await validateOwnedRoot(errors, featurePrefix, 'frontend', ownedRoot);
  }
};

const schemaReferencesErrorResponseDto = (schema) => {
  if (!isObject(schema)) {
    return false;
  }

  if (schema.$ref === '#/components/schemas/ErrorResponseDto') {
    return true;
  }

  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (
      Array.isArray(schema[key]) &&
      schema[key].some((nestedSchema) => schemaReferencesErrorResponseDto(nestedSchema))
    ) {
      return true;
    }
  }

  return schemaReferencesErrorResponseDto(schema.items);
};

const hasErrorResponseDto = (operation, status) => {
  const content = operation.responses?.[status]?.content ?? {};

  return Object.values(content).some((mediaType) =>
    schemaReferencesErrorResponseDto(mediaType?.schema),
  );
};

const verifyErrorResponseDto = (errors, featurePrefix, operationContext, operation, status) => {
  if (!hasErrorResponseDto(operation, status)) {
    errors.push(`${featurePrefix}: ${operationContext} must document ${status} ErrorResponseDto`);
  }
};

const verifyOpenApiOperations = (errors, openApiDoc, feature, featurePrefix) => {
  const verification = getFeatureVerification(errors, feature, featurePrefix);

  if (feature.openApiOperations !== undefined && !Array.isArray(feature.openApiOperations)) {
    errors.push(`${featurePrefix}: openApiOperations must be an array`);
    return;
  }

  const openApiOperations = asArray(feature.openApiOperations);

  if (verification.requireOpenApiOperations === true && openApiOperations.length === 0) {
    errors.push(`${featurePrefix}: expected openApiOperations`);
    return;
  }

  if (openApiOperations.length === 0) {
    return;
  }

  if (!openApiDoc) {
    errors.push(`${featurePrefix}: server/openapi.json is required for openApiOperations`);
    return;
  }

  for (const [index, expectedOperation] of openApiOperations.entries()) {
    if (!isObject(expectedOperation)) {
      errors.push(`${featurePrefix}: openApiOperations[${index}] must be an object`);
      continue;
    }

    const operationPath = expectedOperation.path;

    if (typeof operationPath !== 'string' || operationPath.length === 0) {
      errors.push(`${featurePrefix}: openApiOperations entries need a path`);
      continue;
    }

    if (!Array.isArray(expectedOperation.methods) || expectedOperation.methods.length === 0) {
      errors.push(`${featurePrefix}: ${operationPath} must declare at least one method`);
      continue;
    }

    const methods = [];
    for (const method of expectedOperation.methods) {
      if (typeof method !== 'string' || method.length === 0) {
        errors.push(`${featurePrefix}: ${operationPath} methods must be non-empty strings`);
        continue;
      }

      methods.push(method.toLowerCase());
    }

    if (
      expectedOperation.errorStatuses !== undefined &&
      !Array.isArray(expectedOperation.errorStatuses)
    ) {
      errors.push(`${featurePrefix}: ${operationPath} errorStatuses must be an array`);
      continue;
    }

    const pathItem = openApiDoc.paths?.[operationPath];

    if (!pathItem) {
      errors.push(`${featurePrefix}: OpenAPI path ${operationPath} is missing`);
      continue;
    }

    for (const method of methods) {
      const operation = pathItem[method];
      const operationContext = `${method.toUpperCase()} ${operationPath}`;

      if (!operation) {
        errors.push(`${featurePrefix}: ${operationContext} is missing in server/openapi.json`);
        continue;
      }

      if (expectedOperation.protected === true) {
        verifyErrorResponseDto(errors, featurePrefix, operationContext, operation, '401');
      }

      for (const status of asArray(expectedOperation.errorStatuses).map(String)) {
        verifyErrorResponseDto(errors, featurePrefix, operationContext, operation, status);
      }
    }
  }
};

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

const hasPrefixMatch = (value, prefixes) => prefixes.some((prefix) => value.startsWith(prefix));

const hasPathPrefixMatch = (value, prefixes) =>
  prefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`));

const collectFeatureFrontendOwnedRoots = (features) =>
  unique(
    features.flatMap((feature) => asArray(feature.ownedRoots?.frontend).map(normalizeManifestPath)),
  );

const verifyWidgetInventory = async (errors, features) => {
  const widgetEntries = await readDirFromRoot('client/src/widgets', true);
  const declaredWidgetRoots = new Set(
    collectFeatureFrontendOwnedRoots(features).filter((ownedRoot) =>
      /^client\/src\/widgets\/[^/]+$/.test(ownedRoot),
    ),
  );

  for (const entry of widgetEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const widgetRoot = `client/src/widgets/${entry.name}`;
    const nestedEntries = await readDirFromRoot(widgetRoot);

    if (nestedEntries.length > 0 && !declaredWidgetRoots.has(widgetRoot)) {
      errors.push(
        `${widgetRoot}: widget directory is not declared in manifest ownedRoots.frontend`,
      );
    }
  }
};

const getOpenApiInventoryPrefixes = (errors, feature, featurePrefix) => {
  const verification = getFeatureVerification(errors, feature, featurePrefix);

  if (verification.requireOpenApiOperations !== true) {
    return [];
  }

  if (
    feature.openApiInventoryPrefixes !== undefined &&
    !Array.isArray(feature.openApiInventoryPrefixes)
  ) {
    errors.push(`${featurePrefix}: openApiInventoryPrefixes must be an array`);
    return [];
  }

  const configuredPrefixes = asArray(feature.openApiInventoryPrefixes);
  const prefixes = configuredPrefixes.length > 0 ? configuredPrefixes : [feature.route];

  return prefixes
    .filter((prefix) => {
      if (typeof prefix !== 'string' || prefix.trim().length === 0) {
        errors.push(`${featurePrefix}: openApiInventoryPrefixes entries must be non-empty strings`);
        return false;
      }

      return true;
    })
    .map((prefix) => prefix.replace(/\/+$/, ''));
};

const verifyOpenApiInventoryCoverage = (errors, openApiDoc, features) => {
  const inventoryPrefixes = unique(
    features.flatMap((feature) =>
      getOpenApiInventoryPrefixes(errors, feature, `feature:${feature.name}`),
    ),
  );

  if (inventoryPrefixes.length === 0) {
    return;
  }

  if (!openApiDoc) {
    errors.push(
      'template/features.manifest.json: server/openapi.json is required for OpenAPI inventory coverage',
    );
    return;
  }

  const declaredOperations = new Map();

  for (const feature of features) {
    for (const expectedOperation of asArray(feature.openApiOperations)) {
      if (!isObject(expectedOperation) || typeof expectedOperation.path !== 'string') {
        continue;
      }

      const methods = declaredOperations.get(expectedOperation.path) ?? new Set();

      for (const method of asArray(expectedOperation.methods)) {
        methods.add(String(method).toLowerCase());
      }

      declaredOperations.set(expectedOperation.path, methods);
    }
  }

  for (const [operationPath, pathItem] of Object.entries(openApiDoc.paths ?? {})) {
    if (!hasPathPrefixMatch(operationPath, inventoryPrefixes) || !isObject(pathItem)) {
      continue;
    }

    for (const method of Object.keys(pathItem)) {
      const normalizedMethod = method.toLowerCase();

      if (!httpMethods.has(normalizedMethod)) {
        continue;
      }

      if (!declaredOperations.get(operationPath)?.has(normalizedMethod)) {
        errors.push(
          `OpenAPI inventory violation: ${normalizedMethod.toUpperCase()} ${operationPath} is not declared in template/features.manifest.json openApiOperations`,
        );
      }
    }
  }
};

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
    fsdMode === 'transition' ? (fsdRules.transition?.allowLayerBypass ?? []) : [];
  const transitionDeepImportBypass =
    fsdMode === 'transition' ? (fsdRules.transition?.allowDeepImports ?? []) : [];

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

      const allowedLayers = new Set(allowedImports[sourceInfo.layer] ?? []);

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
  const manifestFeatures = manifest.features ?? [];
  const manifestIntegrationModules = manifest.integrationModules ?? [];
  const features = [];
  const integrationModules = [];

  if (!Array.isArray(manifestFeatures)) {
    errors.push('template/features.manifest.json: features must be an array');
  } else {
    for (const [index, feature] of manifestFeatures.entries()) {
      if (!isObject(feature)) {
        errors.push(`template/features.manifest.json: features[${index}] must be an object`);
        continue;
      }

      features.push(feature);
    }
  }

  if (!Array.isArray(manifestIntegrationModules)) {
    errors.push('template/features.manifest.json: integrationModules must be an array');
  } else {
    for (const [index, integrationModule] of manifestIntegrationModules.entries()) {
      if (!isObject(integrationModule)) {
        errors.push(
          `template/features.manifest.json: integrationModules[${index}] must be an object`,
        );
        continue;
      }

      integrationModules.push(integrationModule);
    }
  }

  const appModule = await readFromRoot('server/src/app.module.ts');
  const appRoutes = await readFromRoot('client/src/app/App.tsx');
  const dashboardExists = await existsFromRoot('client/src/pages/dashboard.tsx');
  const dashboard = dashboardExists ? await readFromRoot('client/src/pages/dashboard.tsx') : '';
  const schemas = await readFromRoot('client/src/shared/api/schemas.ts');
  const prismaSchema = await readFromRoot('server/prisma/schema.prisma');

  const authModule = manifest.auth?.requiredBackendModule;
  const authRoutes = manifest.auth?.requiredRoutes ?? [];
  const publicRoutes = manifest.publicRoutes ?? [];
  const generatedApiDirs = manifest.generatedApiDirs ?? [];
  const featureRoutes = features.map((feature) => feature.route);
  const featureModules = features.map((feature) => feature.backendModule);

  if (authModule) {
    ensureIncludes(errors, appModule, authModule, 'server/src/app.module.ts');
  }

  for (const route of authRoutes) {
    ensureIncludes(errors, appRoutes, `path="${route}"`, 'client/src/app/App.tsx');
  }

  for (const route of publicRoutes) {
    ensureIncludes(errors, appRoutes, `path="${route}"`, 'client/src/app/App.tsx');
  }

  const declaredRoutePaths = unique(collectMatches(appRoutes, /path="([^"]+)"/g));

  if (!declaredRoutePaths.includes('/')) {
    errors.push('client/src/app/App.tsx: expected to include a root route path="/"');
  }

  errors.push(...getRouteManifestErrors(features));

  const isAllowedRoute = (route) =>
    isAllowedManifestRoute(route, {
      authRoutes,
      publicRoutes,
      features,
    });

  for (const route of declaredRoutePaths) {
    if (!isAllowedRoute(route)) {
      errors.push(
        `client/src/app/App.tsx: unexpected route path="${route}" not declared by auth, publicRoutes, or features manifest`,
      );
    }
  }

  const localModuleImports = unique(
    collectMatches(appModule, /import\s+\{\s*([A-Za-z0-9_]+Module)\s*\}\s+from\s+'\.\/[^']+'/g),
  );
  const expectedLocalModules = new Set(
    ['PrismaModule', authModule, ...featureModules].filter(Boolean),
  );

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
  const openApiDoc = openApiExists ? JSON.parse(await readFromRoot('server/openapi.json')) : null;

  for (const integrationModule of integrationModules) {
    const integrationPrefix = `integration:${integrationModule.name ?? '<unknown>'}`;

    if (typeof integrationModule.name !== 'string' || integrationModule.name.trim().length === 0) {
      errors.push(`${integrationPrefix}: name must be a non-empty string`);
    }

    if (
      typeof integrationModule.backendModule !== 'string' ||
      integrationModule.backendModule.trim().length === 0
    ) {
      errors.push(`${integrationPrefix}: backendModule must be a non-empty string`);
    }

    if (integrationModule.ownedRoots !== undefined && !isObject(integrationModule.ownedRoots)) {
      errors.push(`${integrationPrefix}: ownedRoots must be an object with backend array`);
    }

    const backendOwnedRoots = asArray(integrationModule.ownedRoots?.backend);
    if (backendOwnedRoots.length === 0) {
      errors.push(`${integrationPrefix}: expected backend ownedRoots`);
    }

    for (const ownedRoot of backendOwnedRoots) {
      await validateOwnedRoot(errors, integrationPrefix, 'backend', ownedRoot);
    }

    if (
      integrationModule.backendFiles !== undefined &&
      !Array.isArray(integrationModule.backendFiles)
    ) {
      errors.push(`${integrationPrefix}: backendFiles must be an array`);
    }

    for (const filePath of asArray(integrationModule.backendFiles)) {
      if (!(await existsFromRoot(filePath))) {
        errors.push(`${integrationPrefix}: missing backend file ${filePath}`);
      }
    }
  }

  const integrationBackendFiles = integrationModules.flatMap(
    (integrationModule) => integrationModule.backendFiles ?? [],
  );

  const allowedBackendModuleFiles = new Set([
    'server/src/auth/auth.module.ts',
    ...features
      .flatMap((feature) => feature.backendFiles ?? [])
      .filter((filePath) => filePath.endsWith('.module.ts')),
    ...integrationBackendFiles.filter((filePath) => filePath.endsWith('.module.ts')),
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
  const allowedPageDirs = new Set(
    [...featureRoutes, ...publicRoutes].map(toRouteSegment).filter(Boolean),
  );

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
  const allowedGeneratedDirs = new Set([
    'app',
    'auth',
    ...features.map((feature) => feature.name),
    ...generatedApiDirs,
  ]);

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

    await verifyOwnedRoots(errors, feature, featurePrefix);
    verifyOpenApiOperations(errors, openApiDoc, feature, featurePrefix);

    ensureIncludes(errors, appModule, feature.backendModule, 'server/src/app.module.ts');
    ensureIncludes(errors, appRoutes, `path="${feature.route}"`, 'client/src/app/App.tsx');
    if (!dashboardExists) {
      errors.push(
        'client/src/pages/dashboard.tsx is missing but features are declared in manifest',
      );
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

  await verifyWidgetInventory(errors, features);
  verifyOpenApiInventoryCoverage(errors, openApiDoc, features);
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
