import { useEffect } from 'react';

import { DARK_THEME_CLASS, resolveTheme, useThemeStore } from '@/shared/lib/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Вешает класс `dark` на <html>, пока компонент смонтирован. Диалоги и выпадающие списки Radix
 * рендерятся в портал у `body`, поэтому класс должен стоять выше корня админки. Размонтирование
 * (выход в публичные страницы /t/*) снимает класс: публичная часть остаётся светлой.
 */
export const useDocumentTheme = () => {
  const preference = useThemeStore((state) => state.preference);

  useEffect(() => {
    const root = document.documentElement;
    const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;

    const apply = () => {
      const theme = resolveTheme(preference, media?.matches ?? false);
      root.classList.toggle(DARK_THEME_CLASS, theme === 'dark');
    };

    apply();
    if (preference === 'system') {
      media?.addEventListener('change', apply);
    }

    return () => {
      media?.removeEventListener('change', apply);
      root.classList.remove(DARK_THEME_CLASS);
    };
  }, [preference]);
};
