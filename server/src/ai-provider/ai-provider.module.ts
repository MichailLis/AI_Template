import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AiProviderConfigService } from './ai-provider-config.service';
import { AiProviderClientService } from './ai-provider.client';
import { AiUsageService } from './ai-usage.service';

@Module({
  imports: [AuditModule],
  providers: [AiProviderConfigService, AiProviderClientService, AiUsageService],
  exports: [AiProviderConfigService, AiProviderClientService, AiUsageService],
})
export class AiProviderModule {}
