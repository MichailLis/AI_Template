import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { z } from 'zod';

import { isLocalRuntime, resolveCorsAllowedOrigins, type EnvReader } from './config/env';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

const JSON_BODY_LIMIT = '1mb';

/**
 * Переменные уже проверены схемой окружения (`validateEnv` в `ConfigModule.forRoot`): здесь они
 * только читаются, а CORS-источники вычисляются до остальной настройки, чтобы неверный список
 * остановил запуск раньше, чем приложение начнет слушать порт.
 */
export const setupApp = (app: INestApplication) => {
  const config = app.get(ConfigService);
  const read: EnvReader = (name) => config.get<string>(name);
  const corsAllowedOrigins = resolveCorsAllowedOrigins(read);

  // Подробности VALIDATION_ERROR видит админ в форме: по-русски, а не «Too big: expected …» (#148).
  z.config(z.locales.ru());

  // Express default is 100kb; the settings prompt alone may be 160 000 chars (up to ~960kb escaped).
  (app as NestExpressApplication).useBodyParser('json', { limit: JSON_BODY_LIMIT });
  // Один прокси (nginx) перед бэкендом: req.ip берётся из X-Forwarded-For, иначе у всех учеников
  // был бы адрес nginx и лимит start/finish (#124) отсекал бы школу целиком.
  (app as NestExpressApplication).set('trust proxy', 1);
  app.useGlobalFilters(new AllExceptionsFilter());
  // Swagger UI and /api-json map every admin endpoint, so they stay local; gen:api still gets the document.
  const swaggerDocument = setupSwagger(app, { publish: isLocalRuntime(read) });
  app.enableCors({
    credentials: true,
    origin: corsAllowedOrigins,
  });
  return swaggerDocument;
};
