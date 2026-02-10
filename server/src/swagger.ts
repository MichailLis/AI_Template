import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

const swaggerConfig = new DocumentBuilder()
  .setTitle('Fullstack Project API')
  .setDescription('The API documentation for our base project')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const createSwaggerDocument = (app: INestApplication) => {
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  return cleanupOpenApiDoc(document);
};

export const setupSwagger = (app: INestApplication) => {
  const document = createSwaggerDocument(app);
  SwaggerModule.setup('api', app, document);
  return document;
};
