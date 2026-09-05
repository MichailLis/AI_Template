import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  checkClientStorageDiscipline,
  checkControllerSwagger,
  checkDtoNoZodDate,
  checkErrorResponseDto,
  checkPublicDtoSafety,
  checkReactQueryStateMirroring,
  checkSetupAppErrorFilter,
  isClientStorageException,
  isPublicDtoFile,
  parseControllerHandlers,
} from './lib/invariant-rules.mjs';

const root = process.cwd();
const toPosix = (path) => path.replace(/\\/g, '/');

const collectFiles = async (dir, filter) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, filter)));
    } else if (entry.isFile() && filter(entry.name, fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
};

const errors = [];

// 1. INV-4a: Controller Swagger Completeness
const controllerFiles = await collectFiles(join(root, 'server', 'src'), (name) =>
  name.endsWith('.controller.ts'),
);

let handlerCount = 0;

for (const absolutePath of controllerFiles) {
  const relativePath = toPosix(absolutePath.slice(root.length + 1));
  const source = await readFile(absolutePath, 'utf-8');
  const handlers = parseControllerHandlers(source, relativePath);
  handlerCount += handlers.length;
  errors.push(...checkControllerSwagger({ relativePath, source }));
}

if (handlerCount < 58) {
  errors.push(
    `Controller parser found only ${handlerCount} HTTP handlers; expected at least 58. Parser may be degraded.`,
  );
}

// 2. INV-4b: No z.date() in DTOs & INV-6: Public DTO Safety
const dtoFiles = await collectFiles(join(root, 'server', 'src'), (name) =>
  name.endsWith('.dto.ts'),
);

for (const absolutePath of dtoFiles) {
  const relativePath = toPosix(absolutePath.slice(root.length + 1));
  const source = await readFile(absolutePath, 'utf-8');

  errors.push(...checkDtoNoZodDate({ relativePath, source }));

  if (isPublicDtoFile(relativePath)) {
    errors.push(...checkPublicDtoSafety({ relativePath, source }));
  }
}

// 3. INV-2: Client Storage Discipline & INV-3: React Query State Mirroring
const clientFiles = await collectFiles(
  join(root, 'client', 'src'),
  (name) => name.endsWith('.ts') || name.endsWith('.tsx'),
);

for (const absolutePath of clientFiles) {
  const relativePath = toPosix(absolutePath.slice(root.length + 1));
  const source = await readFile(absolutePath, 'utf-8');

  if (!isClientStorageException(relativePath)) {
    errors.push(...checkClientStorageDiscipline({ relativePath, source }));
  }

  if (!relativePath.startsWith('client/src/shared/api/generated/')) {
    errors.push(...checkReactQueryStateMirroring({ relativePath, source }));
  }
}

// 4. INV-5: Unified Error Shape
const setupAppRel = 'server/src/setup-app.ts';
const setupAppSource = await readFile(join(root, setupAppRel), 'utf-8');
errors.push(...checkSetupAppErrorFilter({ relativePath: setupAppRel, source: setupAppSource }));

const errorDtoRel = 'server/src/common/dto/error-response.dto.ts';
const errorDtoSource = await readFile(join(root, errorDtoRel), 'utf-8');
errors.push(...checkErrorResponseDto({ relativePath: errorDtoRel, source: errorDtoSource }));

// Results output
if (errors.length > 0) {
  console.error('Invariants verification failed:');
  errors.forEach((error, index) => {
    console.error(`${index + 1}. ${error}`);
  });
  process.exit(1);
}

console.log(`Verified ${handlerCount} HTTP handlers across controllers.`);
console.log('Invariants verification passed.');
