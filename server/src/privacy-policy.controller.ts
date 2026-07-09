import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PrivacyPolicySettingsService } from './app-settings/privacy-policy-settings.service';
import { ApiPublicErrorResponses } from './common/decorators/api-error-responses.decorator';
import { PublicPrivacyPolicyResponseDto } from './tests/dto/tests-public.dto';

@ApiTags('privacy-policy')
@ApiPublicErrorResponses()
@Controller('privacy-policy')
export class PrivacyPolicyController {
  constructor(private readonly privacyPolicySettingsService: PrivacyPolicySettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public privacy policy' })
  @ApiResponse({ status: 200, type: PublicPrivacyPolicyResponseDto })
  getPrivacyPolicy() {
    return this.privacyPolicySettingsService.getPublicPrivacyPolicy();
  }
}
