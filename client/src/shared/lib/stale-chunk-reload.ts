import { safeStorage } from './storage';

const reloadAtKey = 'stale-chunk-reload-at';
const reloadCooldownMs = 60_000;

/**
 * После деплоя хэшированные чанки старой сборки исчезают, и lazy-импорт падает белым экраном.
 * Один раз перезагружаем страницу за минуту: свежий index.html укажет на новые чанки,
 * а если чанк недоступен по другой причине, цикла перезагрузок не будет.
 */
export const handleStalePreloadError = (
  event: Event,
  nowMs = Date.now(),
  reload = () => window.location.reload(),
) => {
  const lastReloadAtMs = Number(safeStorage.getItem(reloadAtKey) ?? Number.NEGATIVE_INFINITY);

  if (nowMs - lastReloadAtMs < reloadCooldownMs) {
    return;
  }

  event.preventDefault();
  safeStorage.setItem(reloadAtKey, String(nowMs));
  reload();
};

export const installStaleChunkReload = () => {
  window.addEventListener('vite:preloadError', handleStalePreloadError);
};
