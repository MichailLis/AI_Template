import {
  Body,
  Controller,
  Delete,
  Get,
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
  ReorderTestsQuestionsDto,
  PublishTestsTopicResponseDto,
  TestsTopicDetailResponseDto,
  TestsTopicListResponseDto,
  UpdateTestsTopicDraftDto,
  UpsertTestsQuestionDto,
} from './dto/tests.dto';
import {
  AdminCreateEducationOrganizationDto,
  AdminCreatePublicLinkDto,
  AdminDeletePublicLinkResponseDto,
  AdminEducationOrganizationDto,
  AdminEducationOrganizationsListResponseDto,
  AdminUpdateEducationOrganizationDto,
  AdminPublicAttemptDetailResponseDto,
  AdminPublicAttemptsListResponseDto,
  AdminPublicLinkDto,
  AdminPublicLinksListResponseDto,
  AdminUpdatePublicLinkDto,
} from './dto/tests-links.dto';
import { TestsAttemptService } from './tests-attempt.service';
import { TestsPublicLinkService } from './tests-public-link.service';
import { TestsService } from './tests.service';

@ApiTags('tests')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    private readonly testsPublicLinkService: TestsPublicLinkService,
    private readonly testsAttemptService: TestsAttemptService,
  ) {}

  @Post('public-links')
  @ApiOperation({ summary: 'Create short public link for published test version' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminPublicLinkDto })
  createPublicLink(@GetCurrentUserId() userId: number, @Body() dto: AdminCreatePublicLinkDto) {
    return this.testsPublicLinkService.createPublicLink(userId, dto);
  }

  @Get('education-organizations')
  @ApiOperation({ summary: 'List educational organizations for link binding' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminEducationOrganizationsListResponseDto })
  listEducationOrganizations(@GetCurrentUserId() userId: number) {
    return this.testsPublicLinkService.listEducationOrganizations(userId);
  }

  @Post('education-organizations')
  @ApiOperation({ summary: 'Create educational organization for link binding' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminEducationOrganizationDto })
  createEducationOrganization(
    @GetCurrentUserId() userId: number,
    @Body() dto: AdminCreateEducationOrganizationDto,
  ) {
    return this.testsPublicLinkService.createEducationOrganization(userId, dto);
  }

  @Patch('education-organizations/:organizationId')
  @ApiOperation({ summary: 'Update educational organization validation settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminEducationOrganizationDto })
  updateEducationOrganization(
    @GetCurrentUserId() userId: number,
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() dto: AdminUpdateEducationOrganizationDto,
  ) {
    return this.testsPublicLinkService.updateEducationOrganization(userId, organizationId, dto);
  }

  @Get('public-links')
  @ApiOperation({ summary: 'List short public links for tests' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinksListResponseDto })
  listPublicLinks(@GetCurrentUserId() userId: number) {
    return this.testsPublicLinkService.listPublicLinks(userId);
  }

  @Get('public-links/archived')
  @ApiOperation({ summary: 'List archived public links for tests' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinksListResponseDto })
  listArchivedPublicLinks(@GetCurrentUserId() userId: number) {
    return this.testsPublicLinkService.listArchivedPublicLinks(userId);
  }

  @Patch('public-links/:linkId')
  @ApiOperation({ summary: 'Update short public link settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinkDto })
  updatePublicLink(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
    @Body() dto: AdminUpdatePublicLinkDto,
  ) {
    return this.testsPublicLinkService.updatePublicLink(userId, linkId, dto);
  }

  @Post('public-links/:linkId/regenerate')
  @ApiOperation({ summary: 'Regenerate short code for public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinkDto })
  regeneratePublicLinkShortCode(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsPublicLinkService.regeneratePublicLinkShortCode(userId, linkId);
  }

  @Delete('public-links/:linkId')
  @ApiOperation({ summary: 'Archive public link (disable access and hide from default list)' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDeletePublicLinkResponseDto })
  deletePublicLink(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsPublicLinkService.deletePublicLink(userId, linkId);
  }

  @Post('public-links/:linkId/restore')
  @ApiOperation({ summary: 'Restore archived public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinkDto })
  restorePublicLink(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsPublicLinkService.restorePublicLink(userId, linkId);
  }

  @Get('public-links/:linkId/attempts')
  @ApiOperation({ summary: 'List student attempts by public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicAttemptsListResponseDto })
  listPublicLinkAttempts(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsAttemptService.listAttemptsForLink(userId, linkId);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get student attempt details with answers and analysis' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicAttemptDetailResponseDto })
  getAttemptDetail(
    @GetCurrentUserId() userId: number,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    return this.testsAttemptService.getAttemptDetail(userId, attemptId);
  }

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
