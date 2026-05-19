import {
  Body,
  Controller,
  Delete,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import {
  CreateTestsTopicFromAiDto,
  CreateTestsTopicDto,
  DeleteTestsTopicResponseDto,
  PublishTestsTopicResponseDto,
  ReorderTestsQuestionsDto,
  TestsTopicListQueryDto,
  TestsTopicDetailResponseDto,
  TestsTopicListResponseDto,
  UpdateTestsTopicArchiveStatusResponseDto,
  UpdateTestsTopicDraftDto,
  UpsertTestsQuestionDto,
} from './dto/tests.dto';
import { TestsService } from './tests.service';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @ApiOperation({
    summary: 'List test topics with draft and published snapshots',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicListResponseDto })
  listTopics(@GetCurrentUserId() userId: number, @Query() query: TestsTopicListQueryDto) {
    return this.testsService.listTopics(userId, query.archived);
  }

  @Post(':topicId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive test topic' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateTestsTopicArchiveStatusResponseDto })
  archiveTopic(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.testsService.archiveTopic(userId, topicId);
  }

  @Post(':topicId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore archived test topic' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateTestsTopicArchiveStatusResponseDto })
  restoreTopic(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.testsService.restoreTopic(userId, topicId);
  }

  @Post()
  @ApiOperation({ summary: 'Create test topic with initial draft version' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createTopic(@GetCurrentUserId() userId: number, @Body() dto: CreateTestsTopicDto) {
    return this.testsService.createTopic(userId, dto);
  }

  @Post('ai/create')
  @ApiOperation({
    summary: 'Create test topic with generated questions in one transaction',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createTopicFromAi(@GetCurrentUserId() userId: number, @Body() dto: CreateTestsTopicFromAiDto) {
    return this.testsService.createTopicFromAi(userId, dto);
  }

  @Post('methodologies/prof-orientation-v3-plus/import')
  @ApiOperation({
    summary: 'Import built-in prof-orientation v3+ methodology as Polus test draft',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  importProfOrientationV3Plus(@GetCurrentUserId() userId: number) {
    return this.testsService.importProfOrientationV3Plus(userId);
  }

  @Delete(':topicId')
  @ApiOperation({
    summary: 'Delete test topic with all versions and questions',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteTestsTopicResponseDto })
  deleteTopic(@GetCurrentUserId() userId: number, @Param('topicId', ParseIntPipe) topicId: number) {
    return this.testsService.deleteTopic(userId, topicId);
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

  @Patch(':topicId/draft/questions/reorder')
  @ApiOperation({ summary: 'Reorder questions in active draft' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  reorderQuestions(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: ReorderTestsQuestionsDto,
  ) {
    return this.testsService.reorderQuestions(userId, topicId, dto);
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
  @HttpCode(HttpStatus.OK)
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
