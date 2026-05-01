import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { AnalysisPromptsService } from './analysis-prompts.service';
import {
  AnalysisPromptListResponseDto,
  AnalysisPromptResponseDto,
  AnalysisPromptVersionResponseDto,
  CreateAnalysisPromptDto,
  PromptSimulationRequestDto,
  PromptSimulationResponseDto,
  PromptTestQuestionsResponseDto,
} from './dto/analysis-prompt.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('admin/prompts')
export class AnalysisPromptsController {
  constructor(private readonly analysisPromptsService: AnalysisPromptsService) {}

  @Get()
  @ApiOperation({ summary: 'List analysis prompts and versions' })
  @ApiResponse({ status: HttpStatus.OK, type: AnalysisPromptListResponseDto })
  listPrompts(@GetCurrentUserId() userId: number) {
    return this.analysisPromptsService.listPrompts(userId);
  }

  @Get('test-questions')
  @ApiOperation({ summary: 'List test questions for prompt simulation' })
  @ApiResponse({ status: HttpStatus.OK, type: PromptTestQuestionsResponseDto })
  listTestQuestions(@GetCurrentUserId() userId: number) {
    return this.analysisPromptsService.listTestQuestions(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create analysis prompt draft' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AnalysisPromptResponseDto })
  createPrompt(@GetCurrentUserId() userId: number, @Body() dto: CreateAnalysisPromptDto) {
    return this.analysisPromptsService.createPrompt(userId, dto);
  }

  @Post('versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish analysis prompt version' })
  @ApiParam({ name: 'versionId', type: Number })
  @ApiResponse({ status: HttpStatus.CREATED, type: AnalysisPromptVersionResponseDto })
  publishVersion(
    @GetCurrentUserId() userId: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.analysisPromptsService.publishVersion(userId, versionId);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate analysis prompt with selected test questions' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PromptSimulationResponseDto })
  simulatePrompt(@GetCurrentUserId() userId: number, @Body() dto: PromptSimulationRequestDto) {
    return this.analysisPromptsService.simulatePrompt(userId, dto);
  }
}
