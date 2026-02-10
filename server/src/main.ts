import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Регистрация глобальных фильтров и интерцепторов
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()    .setTitle('Fullstack Project API')
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
