import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { AdminModule } from './admin/admin.module';
import { TestsModule } from './tests/tests.module';
import { AnalysisPromptsModule } from './analysis-prompts/analysis-prompts.module';
import { AuditService } from './audit/audit.service';
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
  controllers: [PrivacyPolicyController],
  providers: [
    PrivacyPolicySettingsService,
    // AppModule imports only feature modules (verify:architecture), so the audit trail that
    // PrivacyPolicySettingsService writes to is provided here directly.
    AuditService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
