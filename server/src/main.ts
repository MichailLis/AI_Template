import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:net';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

const DEFAULT_PORT = 3000;
const HOST = '0.0.0.0';
const MAX_FALLBACK_PORT_ATTEMPTS = 20;

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

const isAddressInUseError = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'EADDRINUSE';

const isPortAvailable = (port: number) =>
  new Promise<boolean>((resolve, reject) => {
    const server = createServer();
    server.unref();

    server.once('error', (error) => {
      if (isAddressInUseError(error)) {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, HOST);
  });

const resolveListenPort = async (requestedPort: number, allowFallback: boolean) => {
  if (!allowFallback) {
    const available = await isPortAvailable(requestedPort);
    if (!available) {
      throw new Error(
        `PORT=${requestedPort} is already in use. Stop the conflicting process or set a different PORT.`,
      );
    }

    return requestedPort;
  }

  for (let offset = 0; offset < MAX_FALLBACK_PORT_ATTEMPTS; offset += 1) {
    const candidatePort = requestedPort + offset;
    if (await isPortAvailable(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error(
    `No free port found in range ${requestedPort}-${requestedPort + MAX_FALLBACK_PORT_ATTEMPTS - 1}.`,
  );
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);
  app.enableCors();

  const requestedPort = parsePort(process.env.PORT);
  const hasExplicitPort = Boolean(process.env.PORT?.trim());
  const listenPort = await resolveListenPort(requestedPort, !hasExplicitPort);

  if (listenPort !== requestedPort) {
    logger.warn(
      `Port ${requestedPort} is busy. Starting server on ${listenPort}. Set PORT explicitly to avoid fallback.`,
    );
  }

  await app.listen(listenPort, HOST);
  logger.log(`Server started on http://localhost:${listenPort}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
