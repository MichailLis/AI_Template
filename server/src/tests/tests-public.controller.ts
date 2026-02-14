import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  PublicLinkAccessResponseDto,
  PublicSessionFinishResponseDto,
  PublicSessionGetResponseDto,
  PublicSessionResultResponseDto,
  PublicSessionSaveAnswersRequestDto,
  PublicSessionSaveAnswersResponseDto,
  PublicSessionStartRequestDto,
  PublicSessionStartResponseDto,
} from './dto/tests-public.dto';
import { TestsAttemptService } from './tests-attempt.service';
import { TestsPublicLinkService } from './tests-public-link.service';

@ApiTags('tests-public')
@Controller('tests/public')
export class TestsPublicController {
  constructor(
    private readonly testsPublicLinkService: TestsPublicLinkService,
    private readonly testsAttemptService: TestsAttemptService,
  ) {}

  @Get('links/:code')
  @ApiOperation({ summary: 'Get public test link metadata' })
  @ApiResponse({ status: 200, type: PublicLinkAccessResponseDto })
  getLinkAccess(@Param('code') code: string) {
    return this.testsPublicLinkService.getPublicLinkAccessByCode(code);
  }

  @Post('links/:code/start')
  @ApiOperation({ summary: 'Start or resume public test session' })
  @ApiResponse({ status: 201, type: PublicSessionStartResponseDto })
  startSession(@Param('code') code: string, @Body() dto: PublicSessionStartRequestDto) {
    return this.testsAttemptService.startSessionByCode(code, dto);
  }

  @Get('sessions/:sessionToken')
  @ApiOperation({ summary: 'Get public test session state by token' })
  @ApiResponse({ status: 200, type: PublicSessionGetResponseDto })
  getSession(@Param('sessionToken') sessionToken: string) {
    return this.testsAttemptService.getSessionByToken(sessionToken);
  }

  @Put('sessions/:sessionToken/answers')
  @ApiOperation({ summary: 'Save public test session answers' })
  @ApiResponse({ status: 200, type: PublicSessionSaveAnswersResponseDto })
  saveAnswers(
    @Param('sessionToken') sessionToken: string,
    @Body() dto: PublicSessionSaveAnswersRequestDto,
  ) {
    return this.testsAttemptService.saveAnswers(sessionToken, dto);
  }

  @Post('sessions/:sessionToken/finish')
  @ApiOperation({ summary: 'Finish public test session and compute analysis' })
  @ApiResponse({ status: 200, type: PublicSessionFinishResponseDto })
  finishSession(@Param('sessionToken') sessionToken: string) {
    return this.testsAttemptService.finishSession(sessionToken);
  }

  @Get('sessions/:sessionToken/result')
  @ApiOperation({ summary: 'Get public test session analysis result' })
  @ApiResponse({ status: 200, type: PublicSessionResultResponseDto })
  getSessionResult(@Param('sessionToken') sessionToken: string) {
    return this.testsAttemptService.getSessionResult(sessionToken);
  }
}
