import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { createSwaggerDocument } from '../swagger';

const outputPath = resolve(process.cwd(), 'openapi.json');

async function generateOpenApi() {
  process.env.SKIP_DB_CONNECT = 'true';

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const document = createSwaggerDocument(app);
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
