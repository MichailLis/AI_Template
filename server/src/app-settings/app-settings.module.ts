import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PrivacyPolicyController } from './privacy-policy.controller';
import { PrivacyPolicySettingsService } from './privacy-policy-settings.service';
import { ProfessionAtlasClientService } from './profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from './profession-atlas-settings.service';
import { PublicRateLimitSettingsService } from './public-rate-limit-settings.service';

/**
 * Системные настройки: политика данных, адрес Атласа профессий, лимиты публичного контура.
 * Интеграционный модуль: ровно один экземпляр каждого сервиса на приложение, чтобы кэш настроек не
 * разъехался между админкой и публичным контуром (#167). Потребители импортируют модуль, а не
 * вписывают сервисы в свои `providers`.
 */
@Module({
  imports: [AuditModule],
  controllers: [PrivacyPolicyController],
  providers: [
    PrivacyPolicySettingsService,
    ProfessionAtlasSettingsService,
    ProfessionAtlasClientService,
    PublicRateLimitSettingsService,
  ],
  exports: [
    PrivacyPolicySettingsService,
    ProfessionAtlasSettingsService,
    ProfessionAtlasClientService,
    PublicRateLimitSettingsService,
  ],
})
export class AppSettingsModule {}
