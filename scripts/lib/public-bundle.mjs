/**
 * Граница «что скачивает ученик» (#162): страницы /t/* и всё, что браузер грузит вместе с ними
 * (entry-чанк и статические импорты), не должны тянуть админский код. Ленивые импорты не в счёт —
 * они грузятся только по требованию.
 */
export const PUBLIC_PAGE_PREFIX = 'src/pages/t/';

export const FORBIDDEN_PUBLIC_MODULE_PREFIXES = [
  'src/shared/api/generated/admin/',
  'src/shared/api/generated/tests/',
  'src/features/',
  'src/widgets/admin-',
  'src/pages/admin/',
  'src/pages/login',
];

/** Абсолютный путь модуля из Rollup → `src/...` или `node_modules/...` относительно клиента. */
export const toClientModulePath = (moduleId) => {
  const posix = moduleId.replaceAll('\\', '/').replace(/\?.*$/, '');
  const nodeModules = posix.lastIndexOf('/node_modules/');
  if (nodeModules !== -1) return posix.slice(nodeModules + 1);
  const src = posix.indexOf('/client/src/');
  return src === -1 ? posix : posix.slice(src + '/client/'.length);
};

const staticClosure = (start, byFileName) => {
  const seen = new Map();
  const stack = [start];
  while (stack.length > 0) {
    const chunk = stack.pop();
    if (!chunk || seen.has(chunk.fileName)) continue;
    seen.set(chunk.fileName, chunk);
    for (const imported of chunk.imports ?? []) stack.push(byFileName.get(imported));
  }
  return [...seen.values()];
};

/**
 * @param {Array<{fileName: string, isEntry?: boolean, facadeModuleId?: string | null,
 *   imports?: string[], moduleIds?: string[]}>} chunks
 */
export const findPublicBundleLeaks = (chunks, forbidden = FORBIDDEN_PUBLIC_MODULE_PREFIXES) => {
  const byFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const entries = chunks.filter((chunk) => chunk.isEntry);
  const pages = chunks.filter((chunk) =>
    toClientModulePath(chunk.facadeModuleId ?? '').startsWith(PUBLIC_PAGE_PREFIX),
  );

  return pages.map((page) => {
    const closure = new Set(
      [page, ...entries].flatMap((start) => staticClosure(start, byFileName)),
    );
    const modules = [...closure].flatMap((chunk) =>
      (chunk.moduleIds ?? []).map(toClientModulePath),
    );
    return {
      page: toClientModulePath(page.facadeModuleId),
      chunkCount: closure.size,
      leaks: [...new Set(modules.filter((path) => forbidden.some((p) => path.startsWith(p))))],
    };
  });
};
