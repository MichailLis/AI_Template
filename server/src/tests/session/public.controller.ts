import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  PublicLinkAccessResponseDto,
  PublicSessionFinishResponseDto,
  PublicSessionGetResponseDto,
  PublicSessionResultResponseDto,
  PublicSessionSaveAnswersRequestDto,
  PublicSessionSaveAnswersResponseDto,
  PublicSessionStartRequestDto,
  PublicSessionStartResponseDto,
} from '../dto/tests-public.dto';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import { TestsPublicSessionService } from '../session/public-session.service';
import { ApiPublicErrorResponses } from '../../common/decorators/api-error-responses.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PublicRateLimitGuard } from './public-rate-limit.guard';

// Every response goes through its DTO schema (ZodSerializerDto): fields the schema does not declare
// are dropped and a response that does not match it is a 500, not a leak (invariant 6, #167).
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
  @ZodSerializerDto(PublicLinkAccessResponseDto)
  getLinkAccess(@Param('code') code: string) {
    return this.testsPublicLinkService.getPublicLinkAccessByCode(code);
  }

  @Post('links/:code/start')
  @UseGuards(PublicRateLimitGuard)
  @ApiOperation({ summary: 'Start or resume public test session' })
  @ApiResponse({ status: 201, type: PublicSessionStartResponseDto })
  @ZodSerializerDto(PublicSessionStartResponseDto)
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, type: ErrorResponseDto })
  startSession(@Param('code') code: string, @Body() dto: PublicSessionStartRequestDto) {
    return this.testsPublicSessionService.startSessionByCode(code, dto);
  }

  @Get('sessions/:sessionToken')
  @ApiOperation({ summary: 'Get public test session state by token' })
  @ApiResponse({ status: 200, type: PublicSessionGetResponseDto })
  @ZodSerializerDto(PublicSessionGetResponseDto)
  getSession(@Param('sessionToken') sessionToken: string) {
    return this.testsPublicSessionService.getSessionByToken(sessionToken);
  }

  @Put('sessions/:sessionToken/answers')
  @ApiOperation({ summary: 'Save public test session answers' })
  @ApiResponse({ status: 200, type: PublicSessionSaveAnswersResponseDto })
  @ZodSerializerDto(PublicSessionSaveAnswersResponseDto)
  saveAnswers(
    @Param('sessionToken') sessionToken: string,
    @Body() dto: PublicSessionSaveAnswersRequestDto,
  ) {
    return this.testsPublicSessionService.saveAnswers(sessionToken, dto);
  }

  @Post('sessions/:sessionToken/finish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PublicRateLimitGuard)
  @ApiOperation({ summary: 'Finish public test session and compute analysis' })
  @ApiResponse({ status: 200, type: PublicSessionFinishResponseDto })
  @ZodSerializerDto(PublicSessionFinishResponseDto)
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, type: ErrorResponseDto })
  finishSession(@Param('sessionToken') sessionToken: string) {
    return this.testsPublicSessionService.finishSession(sessionToken);
  }

  @Get('sessions/:sessionToken/result')
  @ApiOperation({ summary: 'Get public test session analysis result' })
  @ApiResponse({ status: 200, type: PublicSessionResultResponseDto })
  @ZodSerializerDto(PublicSessionResultResponseDto)
  getSessionResult(@Param('sessionToken') sessionToken: string) {
    return this.testsPublicSessionService.getSessionResult(sessionToken);
  }
}
