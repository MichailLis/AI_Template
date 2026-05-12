import { Body, Controller, Get, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import {
  AdminOpenRouterSettingsResponseDto,
  UpdateOpenRouterApiKeyDto,
} from './dto/admin-settings.dto';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly openRouterApiKeyService: OpenRouterApiKeyService) {}

  @Get('openrouter')
  @ApiOperation({ summary: 'Get OpenRouter settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOpenRouterSettingsResponseDto })
  getOpenRouterSettings(@GetCurrentUserId() userId: number) {
    return this.openRouterApiKeyService.getOpenRouterSettings(userId);
  }

  @Patch('openrouter/api-key')
  @ApiOperation({ summary: 'Update OpenRouter API key' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOpenRouterSettingsResponseDto })
  updateOpenRouterApiKey(
    @GetCurrentUserId() userId: number,
    @Body() dto: UpdateOpenRouterApiKeyDto,
  ) {
    return this.openRouterApiKeyService.updateOpenRouterApiKey(userId, dto.apiKey);
  }
}
