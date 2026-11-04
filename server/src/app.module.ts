import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { AdminModule } from './admin/admin.module';
import { TestsModule } from './tests/tests.module';
import { AnalysisPromptsModule } from './analysis-prompts/analysis-prompts.module';
import { AuditService } from './audit/audit.service';
import { HealthController } from './health.controller';
import { PrivacyPolicyController } from './privacy-policy.controller';
import { PrivacyPolicySettingsService } from './app-settings/privacy-policy-settings.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    AnalysisPromptsModule,
    TestsModule,
  ],
  controllers: [HealthController, PrivacyPolicyController],
  providers: [
    PrivacyPolicySettingsService,
    // AppModule imports only feature modules (verify:architecture), so the audit trail that
    // PrivacyPolicySettingsService writes to is provided here directly.
    AuditService,
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
