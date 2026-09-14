import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

import { collectAuditChanges } from '../audit/audit-changes';
import { AuditService } from '../audit/audit.service';
import { assertAdminUser } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { generateTemporaryPassword } from './admin-password.utils';
import type { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateUserRoleDto } from './dto/update-user-role.dto';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto';

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  deactivatedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof ADMIN_USER_SELECT }>;

const isUniqueConstraintViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';

/** Статус аккаунта в журнале: в базе это отметка времени, а человеку нужен статус. */
const toAccountStatus = (deactivatedAt: Date | null) => (deactivatedAt ? 'DEACTIVATED' : 'ACTIVE');

const USER_AUDIT_FIELDS = ['email', 'name', 'role'] as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async getCurrentAdminUser(userId: number) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        deactivatedAt: true,
      },
    });

    return assertAdminUser(currentUser);
  }

  private async assertUserExists(userId: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, deactivatedAt: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return existingUser;
  }

  private toAdminUserResponse(user: AdminUserRecord) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async resolvePassword(password: string | undefined) {
    const generatedPassword = password === undefined ? generateTemporaryPassword() : null;

    return {
      hashedPassword: await argon2.hash(password ?? generatedPassword!),
      generatedPassword,
    };
  }

  async getOverview(userId: number) {
    const currentUser = await this.getCurrentAdminUser(userId);

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
          label: 'Пользователи',
          hint: 'Создание аккаунтов, роли, сброс пароля и отключение доступа.',
          path: '/admin/users',
        },
      ],
    };
  }

  async getUsers(userId: number, query: AdminUsersQueryDto) {
    await this.getCurrentAdminUser(userId);

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

    if (query.status) {
      where.deactivatedAt = query.status === 'ACTIVE' ? null : { not: null };
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
      select: ADMIN_USER_SELECT,
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

  async updateUserRole(adminId: number, targetUserId: number, dto: UpdateUserRoleDto) {
    await this.getCurrentAdminUser(adminId);

    if (adminId === targetUserId && dto.role !== 'ADMIN') {
      throw new ForbiddenException('Admin cannot revoke own admin role');
    }

    const existingUser = await this.assertUserExists(targetUserId);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { role: dto.role },
        select: ADMIN_USER_SELECT,
      });

      const changes = collectAuditChanges(existingUser, user, { fields: ['role'] });

      if (changes.length > 0) {
        await this.auditService.record(
          {
            entityType: 'USER',
            entityId: targetUserId,
            action: 'USER_ROLE_CHANGED',
            actorUserId: adminId,
            changes,
          },
          tx,
        );
      }

      return user;
    });

    return this.toAdminUserResponse(updatedUser);
  }

  async getUserHistory(adminId: number, targetUserId: number) {
    await this.getCurrentAdminUser(adminId);
    await this.assertUserExists(targetUserId);

    return { events: await this.auditService.listForEntity('USER', targetUserId) };
  }

  async createUser(adminId: number, dto: CreateUserDto) {
    await this.getCurrentAdminUser(adminId);

    const { hashedPassword, generatedPassword } = await this.resolvePassword(dto.password);

    try {
      const createdUser = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            name: dto.name ?? null,
            role: dto.role,
            password: hashedPassword,
          },
          select: ADMIN_USER_SELECT,
        });

        await this.auditService.record(
          {
            entityType: 'USER',
            entityId: user.id,
            action: 'USER_CREATED',
            actorUserId: adminId,
            changes: collectAuditChanges({}, user, { fields: USER_AUDIT_FIELDS }),
          },
          tx,
        );

        return user;
      });

      return { user: this.toAdminUserResponse(createdUser), generatedPassword };
    } catch (error: unknown) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async updateUser(adminId: number, targetUserId: number, dto: UpdateUserDto) {
    await this.getCurrentAdminUser(adminId);
    const existingUser = await this.assertUserExists(targetUserId);

    try {
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: targetUserId },
          data: { email: dto.email, name: dto.name },
          select: ADMIN_USER_SELECT,
        });

        const changes = collectAuditChanges(existingUser, user, {
          fields: ['email', 'name'],
        });

        if (changes.length > 0) {
          await this.auditService.record(
            {
              entityType: 'USER',
              entityId: targetUserId,
              action: 'USER_UPDATED',
              actorUserId: adminId,
              changes,
            },
            tx,
          );
        }

        return user;
      });

      return this.toAdminUserResponse(updatedUser);
    } catch (error: unknown) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async resetUserPassword(adminId: number, targetUserId: number, dto: ResetUserPasswordDto) {
    await this.getCurrentAdminUser(adminId);
    await this.assertUserExists(targetUserId);

    const { hashedPassword, generatedPassword } = await this.resolvePassword(dto.password);

    // A new password ends every existing session: the old refresh token stops working.
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { password: hashedPassword, hashedRefreshToken: null },
        select: ADMIN_USER_SELECT,
      });

      // Пароль в журнал не попадает ни в каком виде: событие фиксирует только факт сброса.
      await this.auditService.record(
        {
          entityType: 'USER',
          entityId: targetUserId,
          action: 'USER_PASSWORD_RESET',
          actorUserId: adminId,
        },
        tx,
      );

      return user;
    });

    return { user: this.toAdminUserResponse(updatedUser), generatedPassword };
  }

  async updateUserStatus(adminId: number, targetUserId: number, dto: UpdateUserStatusDto) {
    await this.getCurrentAdminUser(adminId);

    // An admin reaching this line is active, so while they cannot switch themselves off there is
    // always at least one active admin left — no separate "last admin" check is needed.
    if (adminId === targetUserId && dto.status === 'DEACTIVATED') {
      throw new ForbiddenException('Admin cannot deactivate own account');
    }

    const existingUser = await this.assertUserExists(targetUserId);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data:
          dto.status === 'DEACTIVATED'
            ? { deactivatedAt: existingUser.deactivatedAt ?? new Date(), hashedRefreshToken: null }
            : { deactivatedAt: null },
        select: ADMIN_USER_SELECT,
      });

      const changes = collectAuditChanges(
        { status: toAccountStatus(existingUser.deactivatedAt) },
        { status: toAccountStatus(user.deactivatedAt) },
        { fields: ['status'] },
      );

      if (changes.length > 0) {
        await this.auditService.record(
          {
            entityType: 'USER',
            entityId: targetUserId,
            action: 'USER_STATUS_CHANGED',
            actorUserId: adminId,
            changes,
          },
          tx,
        );
      }

      return user;
    });

    return this.toAdminUserResponse(updatedUser);
  }

  async revokeUserSessions(adminId: number, targetUserId: number) {
    await this.getCurrentAdminUser(adminId);
    await this.assertUserExists(targetUserId);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { hashedRefreshToken: null },
        select: ADMIN_USER_SELECT,
      });

      await this.auditService.record(
        {
          entityType: 'USER',
          entityId: targetUserId,
          action: 'USER_SESSIONS_REVOKED',
          actorUserId: adminId,
        },
        tx,
      );

      return user;
    });

    return this.toAdminUserResponse(updatedUser);
  }
}
