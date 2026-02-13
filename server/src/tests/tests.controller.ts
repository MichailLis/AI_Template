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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import {
  CreateTestsTopicDto,
  PublishTestsTopicResponseDto,
  TestsTopicDetailResponseDto,
  TestsTopicListResponseDto,
  UpdateTestsTopicDraftDto,
  UpsertTestsQuestionDto,
} from './dto/tests.dto';
import { TestsService } from './tests.service';

@ApiTags('tests')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @ApiOperation({
    summary: 'List test topics with draft and published snapshots',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicListResponseDto })
  listTopics(@GetCurrentUserId() userId: number) {
    return this.testsService.listTopics(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create test topic with initial draft version' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createTopic(
    @GetCurrentUserId() userId: number,
    @Body() dto: CreateTestsTopicDto,
  ) {
    return this.testsService.createTopic(userId, dto);
  }

  @Get(':topicId/draft')
  @ApiOperation({ summary: 'Get active draft topic detail' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  getTopicDraft(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.testsService.getTopicDraft(userId, topicId);
  }

  @Patch(':topicId/draft')
  @ApiOperation({ summary: 'Update active draft topic metadata' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  updateTopicDraft(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: UpdateTestsTopicDraftDto,
  ) {
    return this.testsService.updateTopicDraft(userId, topicId, dto);
  }

  @Post(':topicId/draft/questions')
  @ApiOperation({ summary: 'Create question in active draft' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createQuestion(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: UpsertTestsQuestionDto,
  ) {
    return this.testsService.createQuestion(userId, topicId, dto);
  }

  @Patch(':topicId/draft/questions/:questionId')
  @ApiOperation({ summary: 'Update draft question' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  updateQuestion(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpsertTestsQuestionDto,
  ) {
    return this.testsService.updateQuestion(userId, topicId, questionId, dto);
  }

  @Delete(':topicId/draft/questions/:questionId')
  @ApiOperation({ summary: 'Delete draft question' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  deleteQuestion(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.testsService.deleteQuestion(userId, topicId, questionId);
  }

  @Post(':topicId/publish')
  @ApiOperation({
    summary: 'Publish active draft and create next draft version',
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublishTestsTopicResponseDto })
  publishTopic(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.testsService.publishTopic(userId, topicId);
  }
}
