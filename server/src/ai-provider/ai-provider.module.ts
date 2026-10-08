import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AiProviderConfigService } from './ai-provider-config.service';
import { AiProviderClientService } from './ai-provider.client';

@Module({
  imports: [AuditModule],
  providers: [AiProviderConfigService, AiProviderClientService],
  exports: [AiProviderConfigService, AiProviderClientService],
})
export class AiProviderModule {}
