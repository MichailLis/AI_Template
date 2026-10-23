import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { AdminGuard } from '../common/authz/admin.guard';
import { AnalysisPromptsService } from './analysis-prompts.service';
import { AdminPromptModelsResponseDto } from './dto/admin-prompt-models-response.dto';
import { AdminPromptResponseDto } from './dto/admin-prompt-response.dto';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import {
  AnalysisPromptListResponseDto,
  AnalysisPromptResponseDto,
  AnalysisPromptVersionResponseDto,
  CreateAnalysisPromptDto,
  PromptSimulationRequestDto,
  PromptSimulationResponseDto,
  PromptTestQuestionsResponseDto,
  UpdateAnalysisPromptVersionDto,
} from './dto/analysis-prompt.dto';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { AuditHistoryResponseDto } from '../audit/dto/audit-history.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard, AdminGuard)
@Controller('admin/prompts')
export class AnalysisPromptsController {
  constructor(private readonly analysisPromptsService: AnalysisPromptsService) {}

  @Get()
  @ApiOperation({ summary: 'List analysis prompts and versions' })
  @ApiResponse({ status: HttpStatus.OK, type: AnalysisPromptListResponseDto })
  listPrompts() {
    return this.analysisPromptsService.listPrompts();
  }

  @Get('test-questions')
  @ApiOperation({ summary: 'List test questions for prompt simulation' })
  @ApiResponse({ status: HttpStatus.OK, type: PromptTestQuestionsResponseDto })
  listTestQuestions() {
    return this.analysisPromptsService.listTestQuestions();
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available AI provider models' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPromptModelsResponseDto })
  getPromptModels() {
    return this.analysisPromptsService.getPromptModels();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate response from prompt via the AI provider' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPromptResponseDto })
  generatePrompt(@Body() dto: GeneratePromptDto) {
    return this.analysisPromptsService.generatePrompt(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create analysis prompt draft' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AnalysisPromptResponseDto })
  createPrompt(@GetCurrentUserId() userId: number, @Body() dto: CreateAnalysisPromptDto) {
    return this.analysisPromptsService.createPrompt(userId, dto);
  }

  @Patch(':promptId')
  @ApiOperation({ summary: 'Update analysis prompt and create next draft version' })
  @ApiParam({ name: 'promptId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AnalysisPromptResponseDto })
  updatePrompt(
    @GetCurrentUserId() userId: number,
    @Param('promptId', ParseIntPipe) promptId: number,
    @Body() dto: UpdateAnalysisPromptVersionDto,
  ) {
    return this.analysisPromptsService.updatePrompt(userId, promptId, dto);
  }

  @Delete(':promptId')
  @ApiOperation({ summary: 'Archive analysis prompt' })
  @ApiParam({ name: 'promptId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AnalysisPromptResponseDto })
  deletePrompt(
    @GetCurrentUserId() userId: number,
    @Param('promptId', ParseIntPipe) promptId: number,
  ) {
    return this.analysisPromptsService.deletePrompt(userId, promptId);
  }

  @Get(':promptId/history')
  @ApiOperation({ summary: 'List recorded changes of an analysis prompt' })
  @ApiParam({ name: 'promptId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AuditHistoryResponseDto })
  getPromptHistory(@Param('promptId', ParseIntPipe) promptId: number) {
    return this.analysisPromptsService.getPromptHistory(promptId);
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
  simulatePrompt(@Body() dto: PromptSimulationRequestDto) {
    return this.analysisPromptsService.simulatePrompt(dto);
  }
}
