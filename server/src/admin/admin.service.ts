import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import type { GeneratePromptDto } from './dto/generate-prompt.dto';
import type { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import type { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { fetchOpenRouterModels, generateOpenRouterPrompt } from './openrouter.client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly openRouterApiKeyService: OpenRouterApiKeyService,
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
      sortBy === 'createdAt' ? { createdAt: sortOrder } : { updatedAt: sortOrder },
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

    const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();

    return fetchOpenRouterModels(this.config, apiKey);
  }

  async generatePrompt(userId: number, dto: GeneratePromptDto) {
    await this.ensureAdminAccess(userId);

    const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();

    return generateOpenRouterPrompt(this.config, apiKey, dto);
  }

  async updateUserRole(adminId: number, targetUserId: number, dto: UpdateUserRoleDto) {
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
