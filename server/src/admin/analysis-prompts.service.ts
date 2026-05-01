import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { PrismaService } from '../prisma.service';
import { TestAnalysisResultJsonSchema } from '../tests/dto/tests-analysis.dto';
import { ensureAdminAccess } from './admin-access.utils';
import { generateOpenRouterPrompt } from './openrouter.client';

import type {
  AnalysisPromptListResponseDto,
  AnalysisPromptResponseDto,
  AnalysisPromptVersionResponseDto,
  CreateAnalysisPromptDto,
  PromptSimulationRequestDto,
  PromptSimulationResponseDto,
  PromptTestQuestionsResponseDto,
  UpdateAnalysisPromptVersionDto,
} from './dto/analysis-prompt.dto';

const analysisPromptInclude = {
  versions: {
    orderBy: {
      versionNumber: 'desc',
    },
  },
} satisfies Prisma.AnalysisPromptInclude;

type AnalysisPromptRecord = Prisma.AnalysisPromptGetPayload<{
  include: typeof analysisPromptInclude;
}>;

type AnalysisPromptVersionRecord = Prisma.AnalysisPromptVersionGetPayload<Record<string, never>>;

const syntheticAnswersJsonSchema = {
  name: 'student_test_answers',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['answers'],
    properties: {
      answers: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['questionId', 'answer'],
          properties: {
            questionId: {
              type: 'number',
            },
            answer: {
              type: 'string',
              minLength: 1,
            },
          },
        },
      },
    },
  },
} as const;

const parseJsonOutput = (output: string): unknown => {
  try {
    return JSON.parse(output);
  } catch {
    return output;
  }
};

@Injectable()
export class AnalysisPromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly openRouterApiKeyService: OpenRouterApiKeyService,
  ) {}

  private toVersionResponse(version: AnalysisPromptVersionRecord) {
    return {
      id: version.id,
      promptId: version.promptId,
      versionNumber: version.versionNumber,
      status: version.status,
      model: version.model,
      temperature: version.temperature,
      prompt: version.prompt,
      publishedAt: version.publishedAt ? version.publishedAt.toISOString() : null,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    };
  }

  private toPromptResponse(prompt: AnalysisPromptRecord) {
    return {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
      versions: prompt.versions.map((version) => this.toVersionResponse(version)),
    };
  }

  private async getEditablePrompt(promptId: number) {
    const prompt = await this.prisma.analysisPrompt.findUnique({
      where: { id: promptId },
      include: analysisPromptInclude,
    });

    if (!prompt || prompt.archivedAt) {
      throw new NotFoundException('Analysis prompt not found');
    }

    if (!prompt.versions[0]) {
      throw new BadRequestException('Analysis prompt has no versions');
    }

    return prompt;
  }

  private buildSyntheticAnswersPrompt(questions: Array<Record<string, unknown>>) {
    return [
      'Сгенерируй правдоподобные тестовые ответы одного студента на выбранные вопросы.',
      'Ответы нужны только для проверки промпта анализа в админке.',
      'Верни строго JSON по заданной схеме, без пояснений.',
      '',
      JSON.stringify({ questions }, null, 2),
    ].join('\n');
  }

  private buildAnalysisPrompt(
    prompt: string,
    questions: Array<Record<string, unknown>>,
    syntheticAnswers: unknown,
  ) {
    return [
      prompt.trim(),
      '',
      'Контекст тестовой симуляции:',
      JSON.stringify(
        {
          questions,
          answers: syntheticAnswers,
        },
        null,
        2,
      ),
    ].join('\n');
  }

  async listPrompts(userId: number): Promise<AnalysisPromptListResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const prompts = await this.prisma.analysisPrompt.findMany({
      where: { archivedAt: null },
      include: analysisPromptInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return {
      prompts: prompts.map((prompt) => this.toPromptResponse(prompt)),
    };
  }

  async listTestQuestions(userId: number): Promise<PromptTestQuestionsResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const testVersions = await this.prisma.testTopicVersion.findMany({
      where: {
        status: {
          in: ['DRAFT', 'PUBLISHED'],
        },
        questions: {
          some: {},
        },
      },
      include: {
        topic: {
          select: {
            slug: true,
          },
        },
        questions: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return {
      tests: testVersions.map((testVersion) => ({
        id: testVersion.id,
        topicId: testVersion.topicId,
        topicSlug: testVersion.topic.slug,
        title: testVersion.title,
        description: testVersion.description,
        versionNumber: testVersion.versionNumber,
        versionStatus: testVersion.status,
        questionCount: testVersion.questions.length,
        questions: testVersion.questions.map((question) => ({
          id: question.id,
          type: question.type,
          title: question.title,
          description: question.description,
        })),
      })),
    };
  }

  async createPrompt(
    userId: number,
    dto: CreateAnalysisPromptDto,
  ): Promise<AnalysisPromptResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const prompt = await this.prisma.analysisPrompt.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        versions: {
          create: {
            versionNumber: 1,
            status: 'DRAFT',
            model: dto.model.trim(),
            temperature: dto.temperature ?? 0.2,
            prompt: dto.prompt.trim(),
            outputSchema: TestAnalysisResultJsonSchema as unknown as Prisma.InputJsonValue,
          },
        },
      },
      include: analysisPromptInclude,
    });

    return {
      prompt: this.toPromptResponse(prompt),
    };
  }

  async updatePrompt(
    userId: number,
    promptId: number,
    dto: UpdateAnalysisPromptVersionDto,
  ): Promise<AnalysisPromptResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const existingPrompt = await this.getEditablePrompt(promptId);
    const latestVersion = existingPrompt.versions[0];

    const prompt = await this.prisma.analysisPrompt.update({
      where: { id: promptId },
      data: {
        title: dto.title === undefined ? existingPrompt.title : dto.title.trim(),
        description:
          dto.description === undefined
            ? existingPrompt.description
            : dto.description?.trim() || null,
        versions: {
          create: {
            versionNumber: latestVersion.versionNumber + 1,
            status: 'DRAFT',
            model: dto.model?.trim() ?? latestVersion.model,
            temperature: dto.temperature ?? latestVersion.temperature,
            prompt: dto.prompt?.trim() ?? latestVersion.prompt,
            outputSchema: TestAnalysisResultJsonSchema as unknown as Prisma.InputJsonValue,
          },
        },
      },
      include: analysisPromptInclude,
    });

    return {
      prompt: this.toPromptResponse(prompt),
    };
  }

  async deletePrompt(userId: number, promptId: number): Promise<AnalysisPromptResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    await this.getEditablePrompt(promptId);

    const prompt = await this.prisma.analysisPrompt.update({
      where: { id: promptId },
      data: {
        archivedAt: new Date(),
      },
      include: analysisPromptInclude,
    });

    return {
      prompt: this.toPromptResponse(prompt),
    };
  }

  async publishVersion(
    userId: number,
    versionId: number,
  ): Promise<AnalysisPromptVersionResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const existingVersion = await this.prisma.analysisPromptVersion.findUnique({
      where: { id: versionId },
      select: { id: true },
    });

    if (!existingVersion) {
      throw new NotFoundException('Analysis prompt version not found');
    }

    const version = await this.prisma.analysisPromptVersion.update({
      where: { id: versionId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    return {
      version: this.toVersionResponse(version),
    };
  }

  async simulatePrompt(
    userId: number,
    dto: PromptSimulationRequestDto,
  ): Promise<PromptSimulationResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();
    const uniqueQuestionIds = Array.from(new Set(dto.questionIds));
    const questions = await this.prisma.testQuestion.findMany({
      where: { id: { in: uniqueQuestionIds } },
      orderBy: [{ versionId: 'asc' }, { order: 'asc' }],
      include: {
        options: { orderBy: { order: 'asc' } },
        sliderBands: { orderBy: { order: 'asc' } },
      },
    });

    if (questions.length !== uniqueQuestionIds.length) {
      throw new BadRequestException('Some selected test questions were not found');
    }

    const questionPayloads = questions.map((question) => ({
      id: question.id,
      type: question.type,
      title: question.title,
      description: question.description,
      required: question.required,
      order: question.order,
      settings: question.settings,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value,
        order: option.order,
      })),
      sliderBands: question.sliderBands.map((band) => ({
        id: band.id,
        minValue: band.minValue,
        maxValue: band.maxValue,
        label: band.label,
        order: band.order,
      })),
    }));

    const syntheticAnswers =
      dto.generateAnswers === false
        ? null
        : parseJsonOutput(
            (
              await generateOpenRouterPrompt(this.config, apiKey, {
                model: dto.model,
                prompt: this.buildSyntheticAnswersPrompt(questionPayloads),
                temperature: 0.2,
                responseFormat: 'json',
                responseSchema: syntheticAnswersJsonSchema,
                requireParameters: true,
                useResponseHealing: true,
              })
            ).output,
          );

    const analysisResponse = await generateOpenRouterPrompt(this.config, apiKey, {
      model: dto.model,
      prompt: this.buildAnalysisPrompt(dto.prompt, questionPayloads, syntheticAnswers),
      temperature: dto.temperature ?? 0.2,
      responseFormat: 'json',
      responseSchema: TestAnalysisResultJsonSchema,
      requireParameters: true,
      useResponseHealing: true,
    });

    return {
      model: analysisResponse.model,
      output: analysisResponse.output,
      syntheticAnswers,
      questionCount: questions.length,
    };
  }
}
