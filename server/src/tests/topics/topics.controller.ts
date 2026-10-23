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

import { AtGuard } from '../../auth/guards';
import { AdminGuard } from '../../common/authz/admin.guard';
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
} from '../dto/tests.dto';
import { TestsService } from '../topics/topics.service';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard, AdminGuard)
@Controller('admin/tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @ApiOperation({
    summary: 'List test topics with draft and published snapshots',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicListResponseDto })
  listTopics(@Query() query: TestsTopicListQueryDto) {
    return this.testsService.listTopics(query.archived);
  }

  @Post(':topicId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive test topic' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateTestsTopicArchiveStatusResponseDto })
  archiveTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.testsService.archiveTopic(topicId);
  }

  @Post(':topicId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore archived test topic' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateTestsTopicArchiveStatusResponseDto })
  restoreTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.testsService.restoreTopic(topicId);
  }

  @Post()
  @ApiOperation({ summary: 'Create test topic with initial draft version' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createTopic(@Body() dto: CreateTestsTopicDto) {
    return this.testsService.createTopic(dto);
  }

  @Post('ai/create')
  @ApiOperation({
    summary: 'Create test topic with generated questions in one transaction',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createTopicFromAi(@Body() dto: CreateTestsTopicFromAiDto) {
    return this.testsService.createTopicFromAi(dto);
  }

  @Post('methodologies/prof-orientation-v3-plus/import')
  @ApiOperation({
    summary: 'Import built-in prof-orientation v3+ methodology as Polus test draft',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  importProfOrientationV3Plus() {
    return this.testsService.importProfOrientationV3Plus();
  }

  @Delete(':topicId')
  @ApiOperation({
    summary: 'Delete test topic with all versions and questions',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteTestsTopicResponseDto })
  deleteTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.testsService.deleteTopic(topicId);
  }

  @Get(':topicId/draft')
  @ApiOperation({ summary: 'Get active draft topic detail' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  getTopicDraft(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.testsService.getTopicDraft(topicId);
  }

  @Patch(':topicId/draft')
  @ApiOperation({ summary: 'Update active draft topic metadata' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  updateTopicDraft(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: UpdateTestsTopicDraftDto,
  ) {
    return this.testsService.updateTopicDraft(topicId, dto);
  }

  @Post(':topicId/draft/questions')
  @ApiOperation({ summary: 'Create question in active draft' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestsTopicDetailResponseDto,
  })
  createQuestion(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: UpsertTestsQuestionDto,
  ) {
    return this.testsService.createQuestion(topicId, dto);
  }

  @Patch(':topicId/draft/questions/reorder')
  @ApiOperation({ summary: 'Reorder questions in active draft' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  reorderQuestions(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: ReorderTestsQuestionsDto,
  ) {
    return this.testsService.reorderQuestions(topicId, dto);
  }

  @Patch(':topicId/draft/questions/:questionId')
  @ApiOperation({ summary: 'Update draft question' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  updateQuestion(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpsertTestsQuestionDto,
  ) {
    return this.testsService.updateQuestion(topicId, questionId, dto);
  }

  @Delete(':topicId/draft/questions/:questionId')
  @ApiOperation({ summary: 'Delete draft question' })
  @ApiResponse({ status: HttpStatus.OK, type: TestsTopicDetailResponseDto })
  deleteQuestion(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.testsService.deleteQuestion(topicId, questionId);
  }

  @Post(':topicId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish active draft and create next draft version',
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublishTestsTopicResponseDto })
  publishTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.testsService.publishTopic(topicId);
  }
}
