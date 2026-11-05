import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env';
import { PrismaModule } from './prisma.module';
import { AdminModule } from './admin/admin.module';
import { TestsModule } from './tests/tests.module';
import { AnalysisPromptsModule } from './analysis-prompts/analysis-prompts.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    AnalysisPromptsModule,
    TestsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    // Does nothing for a handler without @ZodSerializerDto, so controllers opt in one by one.
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
