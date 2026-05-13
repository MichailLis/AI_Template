import { Body, Controller, Get, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import {
  AdminProfessionAtlasSettingsResponseDto,
  AdminOpenRouterSettingsResponseDto,
  UpdateOpenRouterApiKeyDto,
  UpdateProfessionAtlasUrlDto,
} from './dto/admin-settings.dto';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(
    private readonly openRouterApiKeyService: OpenRouterApiKeyService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
  ) {}

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

  @Get('profession-atlas')
  @ApiOperation({ summary: 'Get profession atlas settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProfessionAtlasSettingsResponseDto })
  getProfessionAtlasSettings(@GetCurrentUserId() userId: number) {
    return this.professionAtlasSettingsService.getProfessionAtlasSettings(userId);
  }

  @Patch('profession-atlas')
  @ApiOperation({ summary: 'Update profession atlas URL' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProfessionAtlasSettingsResponseDto })
  updateProfessionAtlasUrl(
    @GetCurrentUserId() userId: number,
    @Body() dto: UpdateProfessionAtlasUrlDto,
  ) {
    return this.professionAtlasSettingsService.updateProfessionAtlasUrl(userId, dto.url);
  }
}
