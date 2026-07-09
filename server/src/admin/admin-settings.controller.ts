import { Body, Controller, Get, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { ProfOrientationAtlasService } from '../tests/prof-orientation-v3-plus.atlas';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import {
  AdminPrivacyPolicySettingsResponseDto,
  AdminProfessionAtlasSettingsResponseDto,
  AdminOpenRouterSettingsResponseDto,
  ProfessionAtlasCoverageResponseDto,
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
    private readonly openRouterApiKeyService: OpenRouterApiKeyService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
    private readonly privacyPolicySettingsService: PrivacyPolicySettingsService,
    private readonly profOrientationAtlasService: ProfOrientationAtlasService,
  ) {}

  @Get('openrouter')
  @ApiOperation({ summary: 'Get OpenRouter settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOpenRouterSettingsResponseDto })
  getOpenRouterSettings(@GetCurrentUserId() userId: number) {
    return this.openRouterApiKeyService.getOpenRouterSettings(userId);
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
