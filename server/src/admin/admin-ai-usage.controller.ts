import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AiUsageService } from '../ai-provider/ai-usage.service';
import { AtGuard } from '../auth/guards';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { AdminGuard } from '../common/authz/admin.guard';
import { AdminAiUsageQueryDto, AdminAiUsageSummaryResponseDto } from './dto/admin-ai-usage.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard, AdminGuard)
@Controller('admin/ai-usage')
export class AdminAiUsageController {
  constructor(private readonly aiUsage: AiUsageService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'AI provider usage since a given moment: calls, tokens and cost by purpose and model',
  })
  @ApiResponse({ status: HttpStatus.OK, type: AdminAiUsageSummaryResponseDto })
  async getSummary(@Query() query: AdminAiUsageQueryDto) {
    const from = new Date(query.from);
    const to = new Date();

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      ...(await this.aiUsage.summarize(from, to)),
    };
  }
}
