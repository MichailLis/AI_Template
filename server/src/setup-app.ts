import type { INestApplication } from '@nestjs/common';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

export const setupApp = (app: INestApplication) => {
  app.useGlobalFilters(new AllExceptionsFilter());
  const swaggerDocument = setupSwagger(app);
  app.enableCors({
    credentials: true,
    origin: true,
  });
  return swaggerDocument;
};
