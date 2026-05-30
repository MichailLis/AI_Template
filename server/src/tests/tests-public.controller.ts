import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
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
import { TestsPublicLinkService } from './tests-public-link.service';
import { TestsPublicSessionService } from './tests-public-session.service';
import { ApiPublicErrorResponses } from '../common/decorators/api-error-responses.decorator';

@ApiTags('tests-public')
@ApiPublicErrorResponses()
@Controller('tests/public')
export class TestsPublicController {
  constructor(
    private readonly testsPublicLinkService: TestsPublicLinkService,
    private readonly testsPublicSessionService: TestsPublicSessionService,
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
    return this.testsPublicSessionService.startSessionByCode(code, dto);
  }

  @Get('sessions/:sessionToken')
  @ApiOperation({ summary: 'Get public test session state by token' })
  @ApiResponse({ status: 200, type: PublicSessionGetResponseDto })
  getSession(@Param('sessionToken') sessionToken: string) {
    return this.testsPublicSessionService.getSessionByToken(sessionToken);
  }

  @Put('sessions/:sessionToken/answers')
  @ApiOperation({ summary: 'Save public test session answers' })
  @ApiResponse({ status: 200, type: PublicSessionSaveAnswersResponseDto })
  saveAnswers(
    @Param('sessionToken') sessionToken: string,
    @Body() dto: PublicSessionSaveAnswersRequestDto,
  ) {
    return this.testsPublicSessionService.saveAnswers(sessionToken, dto);
  }

  @Post('sessions/:sessionToken/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finish public test session and compute analysis' })
  @ApiResponse({ status: 200, type: PublicSessionFinishResponseDto })
  finishSession(@Param('sessionToken') sessionToken: string) {
    return this.testsPublicSessionService.finishSession(sessionToken);
  }

  @Get('sessions/:sessionToken/result')
  @ApiOperation({ summary: 'Get public test session analysis result' })
  @ApiResponse({ status: 200, type: PublicSessionResultResponseDto })
  getSessionResult(@Param('sessionToken') sessionToken: string) {
    return this.testsPublicSessionService.getSessionResult(sessionToken);
  }
}
