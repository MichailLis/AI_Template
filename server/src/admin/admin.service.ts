import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type { GeneratePromptDto } from './dto/generate-prompt.dto';
import type { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import type { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async ensureAdminAccess(userId: number) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
      },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admin area only');
    }

    return currentUser;
  }

  private toAdminUserResponse(user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toNumberOrNull(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toPromptModelResponse(rawModel: unknown) {
    if (typeof rawModel !== 'object' || rawModel === null) {
      return null;
    }

    const modelRecord = rawModel as Record<string, unknown>;
    const rawId = modelRecord.id;

    if (typeof rawId !== 'string' || rawId.trim().length === 0) {
      return null;
    }

    const id = rawId.trim();
    const name =
      typeof modelRecord.name === 'string' && modelRecord.name.trim().length > 0
        ? modelRecord.name.trim()
        : id;
    const provider = id.includes('/') ? id.split('/')[0] : 'unknown';

    const pricingRecord =
      typeof modelRecord.pricing === 'object' && modelRecord.pricing !== null
        ? (modelRecord.pricing as Record<string, unknown>)
        : null;

    const promptPrice = pricingRecord
      ? this.toNumberOrNull(pricingRecord.prompt)
      : null;
    const completionPrice = pricingRecord
      ? this.toNumberOrNull(pricingRecord.completion)
      : null;
    const contextLength = this.toNumberOrNull(modelRecord.context_length);
    const isFree =
      id.endsWith(':free') ||
      (promptPrice !== null &&
        completionPrice !== null &&
        promptPrice === 0 &&
        completionPrice === 0);

    return {
      id,
      label: name === id ? id : `${name} (${id})`,
      provider,
      isFree,
      contextLength,
      promptPrice,
      completionPrice,
    };
  }

  private parseOpenRouterModels(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      return [];
    }

    const payloadRecord = payload as Record<string, unknown>;

    if (!Array.isArray(payloadRecord.data)) {
      return [];
    }

    const uniqueModels = new Map<
      string,
      ReturnType<typeof this.toPromptModelResponse>
    >();

    for (const model of payloadRecord.data) {
      const parsedModel = this.toPromptModelResponse(model);

      if (parsedModel && !uniqueModels.has(parsedModel.id)) {
        uniqueModels.set(parsedModel.id, parsedModel);
      }
    }

    return Array.from(uniqueModels.values())
      .filter((model): model is NonNullable<typeof model> => model !== null)
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  private extractOpenRouterErrorMessage(payload: unknown) {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('error' in payload)
    ) {
      return 'OpenRouter request failed';
    }

    const errorValue = payload.error;

    if (
      typeof errorValue !== 'object' ||
      errorValue === null ||
      !('message' in errorValue)
    ) {
      return 'OpenRouter request failed';
    }

    return String(errorValue.message);
  }

  async getOverview(userId: number) {
    const currentUser = await this.ensureAdminAccess(userId);

    const [totalUsers, totalAdmins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      title: 'Консоль администратора',
      subtitle: `Вы вошли как ${currentUser.name ?? currentUser.email}`,
      cards: [
        {
          id: 'users-total',
          label: 'Всего пользователей',
          value: totalUsers,
          trend: 'Актуальная метрика системы',
        },
        {
          id: 'admins-total',
          label: 'Администраторы',
          value: totalAdmins,
          trend: 'Базовый контроль ролевого доступа',
        },
      ],
      shortcuts: [
        {
          id: 'health-check',
          label: 'Проверки состояния',
          hint: 'Используйте этот блок для системных проверок и smoke-тестов.',
          path: '/admin',
        },
        {
          id: 'user-audit',
          label: 'Аудит пользователей',
          hint: 'Подключите здесь действия по управлению пользователями на следующей итерации.',
          path: '/admin/users',
        },
      ],
    };
  }

  async getUsers(userId: number, query: AdminUsersQueryDto) {
    await this.ensureAdminAccess(userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const role = query.role;
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const total = await this.prisma.user.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;
    const orderBy: Prisma.UserOrderByWithRelationInput[] = [
      sortBy === 'createdAt'
        ? { createdAt: sortOrder }
        : { updatedAt: sortOrder },
      { id: 'asc' },
    ];

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    return {
      page: currentPage,
      limit,
      total,
      totalPages,
      users: users.map((user) => this.toAdminUserResponse(user)),
    };
  }

  async getPromptModels(userId: number) {
    await this.ensureAdminAccess(userId);

    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENROUTER_API_KEY is not configured on server',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer':
            this.config.get<string>('OPENROUTER_HTTP_REFERER') ??
            'http://localhost:5173',
          'X-Title':
            this.config.get<string>('OPENROUTER_APP_NAME') ??
            'AI Template Admin',
        },
        signal: controller.signal,
      });

      const payload: unknown = await response
        .json()
        .catch(async () => ({ message: await response.text() }));

      if (!response.ok) {
        const errorMessage = this.extractOpenRouterErrorMessage(payload);

        throw new BadGatewayException(errorMessage);
      }

      const models = this.parseOpenRouterModels(payload);

      if (models.length === 0) {
        throw new BadGatewayException(
          'OpenRouter returned empty model catalog',
        );
      }

      const configuredDefaultModel = this.config.get<string>(
        'OPENROUTER_DEFAULT_MODEL',
      );
      const firstFreeModelId = models.find((model) => model.isFree)?.id;
      const defaultModel = models.some(
        (model) => model.id === configuredDefaultModel,
      )
        ? configuredDefaultModel
        : (firstFreeModelId ?? models[0].id);

      return {
        defaultModel,
        models,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadGatewayException(
          'OpenRouter model catalog request timeout',
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generatePrompt(userId: number, dto: GeneratePromptDto) {
    await this.ensureAdminAccess(userId);

    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENROUTER_API_KEY is not configured on server',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    const responseFormat = dto.responseFormat ?? 'text';

    const openRouterRequestBody: {
      model: string;
      temperature: number;
      messages: Array<{ role: 'user'; content: string }>;
      response_format?: { type: 'json_object' };
    } = {
      model: dto.model,
      temperature: dto.temperature ?? 0.7,
      messages: [{ role: 'user', content: dto.prompt }],
    };

    if (responseFormat === 'json') {
      openRouterRequestBody.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer':
              this.config.get<string>('OPENROUTER_HTTP_REFERER') ??
              'http://localhost:5173',
            'X-Title':
              this.config.get<string>('OPENROUTER_APP_NAME') ??
              'AI Template Admin',
          },
          body: JSON.stringify(openRouterRequestBody),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorPayload: unknown = await response
          .json()
          .catch(async () => ({ message: await response.text() }));

        const errorMessage = this.extractOpenRouterErrorMessage(errorPayload);

        throw new BadGatewayException(errorMessage);
      }

      const payload = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?:
              | string
              | Array<{
                  text?: string;
                }>;
          };
        }>;
      };

      const rawContent = payload.choices?.[0]?.message?.content;
      const output =
        typeof rawContent === 'string'
          ? rawContent
          : Array.isArray(rawContent)
            ? rawContent
                .map((chunk) => chunk.text ?? '')
                .join('')
                .trim()
            : '';

      if (!output) {
        throw new BadGatewayException('OpenRouter returned an empty response');
      }

      const formattedOutput =
        responseFormat === 'json'
          ? (() => {
              try {
                return JSON.stringify(JSON.parse(output), null, 2);
              } catch {
                return output;
              }
            })()
          : output;

      return {
        model: dto.model,
        output: formattedOutput,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadGatewayException('OpenRouter request timeout');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async updateUserRole(
    adminId: number,
    targetUserId: number,
    dto: UpdateUserRoleDto,
  ) {
    await this.ensureAdminAccess(adminId);

    if (adminId === targetUserId && dto.role !== 'ADMIN') {
      throw new ForbiddenException('Admin cannot revoke own admin role');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toAdminUserResponse(updatedUser);
  }
}
