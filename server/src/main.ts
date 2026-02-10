import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Fullstack Project API')
    .setDescription('The API documentation for our base project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Очистка документа для корректной работы со Swagger UI
  const cleanedDocument = cleanupOpenApiDoc(document);
  
  SwaggerModule.setup('api', app, cleanedDocument);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
