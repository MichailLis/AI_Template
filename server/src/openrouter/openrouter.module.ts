import { Module } from '@nestjs/common';

import { OpenRouterApiKeyService } from './openrouter-api-key.service';
import { OpenRouterClientService } from './openrouter.client';

@Module({
  providers: [OpenRouterApiKeyService, OpenRouterClientService],
  exports: [OpenRouterApiKeyService, OpenRouterClientService],
})
export class OpenRouterModule {}
