import { buildApiUrl } from '@/shared/api/api';

/** Файл отдает сервер по одноразовой ссылке: браузер качает его сам, не держа весь дамп в памяти. */
export const startBrowserDownload = (path: string) => {
  const link = document.createElement('a');

  link.href = buildApiUrl(path);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
};
