import { Body, Controller, Get, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { ProfOrientationAtlasService } from '../tests/prof-orientation-v3-plus/atlas';
import { AiProviderConfigService } from '../ai-provider/ai-provider-config.service';
import { AiProviderClientService, type AiProviderHealth } from '../ai-provider/ai-provider.client';
import {
  AdminAiProviderSettingsResponseDto,
  AdminPrivacyPolicySettingsResponseDto,
  AdminProfessionAtlasSettingsResponseDto,
  ProfessionAtlasCoverageResponseDto,
  UpdateAiProviderDto,
  UpdatePrivacyPolicyDto,
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
    private readonly aiProviderConfig: AiProviderConfigService,
    private readonly aiProviderClient: AiProviderClientService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
    private readonly privacyPolicySettingsService: PrivacyPolicySettingsService,
    private readonly profOrientationAtlasService: ProfOrientationAtlasService,
  ) {}

  /**
   * Настройки несут результат живой проверки связи, как настройки атласа несут `coverage`: бейдж
   * в шапке должен отвечать на вопрос «работает ли», а не «задан ли ключ».
   */
  @Get('ai-provider')
  @ApiOperation({ summary: 'Get AI provider settings with a live connection check' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminAiProviderSettingsResponseDto })
  async getAiProviderSettings(@GetCurrentUserId() userId: number) {
    const settings = await this.aiProviderConfig.getAiProviderSettings(userId);

    const health: AiProviderHealth = settings.aiProvider.isConfigured
      ? await this.aiProviderClient.checkHealth(await this.aiProviderConfig.getConnection())
      : { status: 'not_configured', checkedAt: new Date().toISOString() };

    return {
      aiProvider: {
        ...settings.aiProvider,
        health,
      },
    };
  }

  @Patch('ai-provider')
  @ApiOperation({ summary: 'Update AI provider settings (provider, base URL, API key, model)' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminAiProviderSettingsResponseDto })
  async updateAiProviderSettings(
    @GetCurrentUserId() userId: number,
    @Body() dto: UpdateAiProviderDto,
  ) {
    await this.aiProviderConfig.updateAiProviderSettings(userId, dto);

    return this.getAiProviderSettings(userId);
  }

  @Get('profession-atlas')
  @ApiOperation({ summary: 'Get profession atlas settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProfessionAtlasSettingsResponseDto })
  async getProfessionAtlasSettings(@GetCurrentUserId() userId: number) {
    const settings = await this.professionAtlasSettingsService.getProfessionAtlasSettings(userId);
    const coverage = await this.profOrientationAtlasService.buildCoverageReport();

    return {
      professionAtlas: {
        ...settings.professionAtlas,
        coverage,
      },
    };
  }

  @Patch('profession-atlas')
  @ApiOperation({ summary: 'Update profession atlas URL' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminProfessionAtlasSettingsResponseDto })
  updateProfessionAtlasUrl(
    @GetCurrentUserId() userId: number,
    @Body() dto: UpdateProfessionAtlasUrlDto,
  ) {
    return this.professionAtlasSettingsService.updateProfessionAtlasUrl(userId, dto);
  }

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get privacy policy settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPrivacyPolicySettingsResponseDto })
  getPrivacyPolicySettings(@GetCurrentUserId() userId: number) {
    return this.privacyPolicySettingsService.getAdminPrivacyPolicy(userId);
  }

  @Patch('privacy-policy')
  @ApiOperation({ summary: 'Update privacy policy settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPrivacyPolicySettingsResponseDto })
  updatePrivacyPolicy(@GetCurrentUserId() userId: number, @Body() dto: UpdatePrivacyPolicyDto) {
    return this.privacyPolicySettingsService.updatePrivacyPolicy(userId, dto);
  }

  @Get('profession-atlas/coverage')
  @ApiOperation({ summary: 'Check profession atlas coverage for prof-orientation professions' })
  @ApiResponse({ status: HttpStatus.OK, type: ProfessionAtlasCoverageResponseDto })
  async getProfessionAtlasCoverage(@GetCurrentUserId() userId: number) {
    await this.professionAtlasSettingsService.getProfessionAtlasSettings(userId);

    return this.profOrientationAtlasService.buildCoverageReport();
  }
}
