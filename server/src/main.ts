import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupApp } from './setup-app';

const DEFAULT_PORT = 3000;
const HOST = '0.0.0.0';

const parsePort = (value: string | undefined) => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Invalid PORT value: "${value}". Expected integer in range 1-65535.`);
  }

  return parsedPort;
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const port = parsePort(process.env.PORT);

  await app.listen(port, HOST);
  logger.log(`Server started on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
