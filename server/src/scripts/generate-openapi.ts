import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { setupApp } from '../setup-app';

const outputPath = resolve(process.cwd(), 'openapi.json');

async function generateOpenApi() {
  process.env.SKIP_DB_CONNECT = 'true';
  process.env.JWT_ACCESS_SECRET ??= 'dev-access-secret-change-me';
  process.env.JWT_REFRESH_SECRET ??= 'dev-refresh-secret-change-me';

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const document = setupApp(app);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(document, null, 2), 'utf-8');
  } finally {
    await app.close();
  }
}

generateOpenApi().catch((error: unknown) => {
  console.error('OpenAPI generation failed:', error);
  process.exit(1);
});
