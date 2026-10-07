import { Module } from '@nestjs/common';

import { AiProviderConfigService } from './ai-provider-config.service';
import { AiProviderClientService } from './ai-provider.client';

@Module({
  providers: [AiProviderConfigService, AiProviderClientService],
  exports: [AiProviderConfigService, AiProviderClientService],
})
export class AiProviderModule {}
