import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { parsePort } from './config/env';
import { setupApp } from './setup-app';

const HOST = '0.0.0.0';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  // SIGTERM/SIGINT run OnModuleDestroy: Prisma closes its pool, the backup and recovery timers stop.
  app.enableShutdownHooks();

  const port = parsePort(app.get(ConfigService).get<string>('PORT'));

  await app.listen(port, HOST);
  logger.log(`Server started on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
