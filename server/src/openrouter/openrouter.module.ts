import { Module } from '@nestjs/common';

import { OpenRouterApiKeyService } from './openrouter-api-key.service';

@Module({
  providers: [OpenRouterApiKeyService],
  exports: [OpenRouterApiKeyService],
})
export class OpenRouterModule {}
