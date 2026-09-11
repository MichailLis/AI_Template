import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma.service';
import { TEMPORARY_PASSWORD_LENGTH } from './admin-password.utils';
import { AdminService } from './admin.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

const ADMIN_ID = 1;
const TARGET_ID = 2;
const MISSING_ID = 999;

const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  id: TARGET_ID,
  email: 'user@example.com',
  name: 'User',
  role: 'USER' as const,
  deactivatedAt: null as Date | null,
  lastLoginAt: null as Date | null,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-02T00:00:00.000Z'),
  ...overrides,
});

describe('AdminService user management', () => {
  let service: AdminService;
  let prismaMock: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let actingAdmin: { id: number; role: 'ADMIN'; deactivatedAt: Date | null };
  let targetDeactivatedAt: Date | null;

  beforeEach(() => {
    actingAdmin = { id: ADMIN_ID, role: 'ADMIN', deactivatedAt: null };
    targetDeactivatedAt = null;
    prismaMock = {
      user: {
        // Every mutation looks up the acting admin first and the target user second.
        findUnique: jest.fn(({ where }: { where: { id: number } }) => {
          if (where.id === ADMIN_ID) return Promise.resolve(actingAdmin);
          if (where.id === MISSING_ID) return Promise.resolve(null);
          return Promise.resolve({ id: where.id, deactivatedAt: targetDeactivatedAt });
        }),
        create: jest.fn().mockResolvedValue(createUserRecord()),
        update: jest.fn().mockResolvedValue(createUserRecord()),
      },
    };
    jest.mocked(argon2.hash).mockReset().mockResolvedValue('hashed-password');

    service = new AdminService(prismaMock as unknown as PrismaService);
  });

  it('createUser generates a password when none is supplied and returns it once', async () => {
    const result = await service.createUser(ADMIN_ID, {
      email: 'new@example.com',
      role: 'USER',
    });

    expect(result.generatedPassword).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
    expect(argon2.hash).toHaveBeenCalledWith(result.generatedPassword);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: 'new@example.com', name: null, role: 'USER', password: 'hashed-password' },
      }),
    );
    expect(result.user).toEqual({
      id: TARGET_ID,
      email: 'user@example.com',
      name: 'User',
      role: 'USER',
      deactivatedAt: null,
      lastLoginAt: null,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z',
    });
  });

  it('createUser keeps an admin-supplied password and does not echo it', async () => {
    const result = await service.createUser(ADMIN_ID, {
      email: 'new@example.com',
      name: 'New User',
      role: 'ADMIN',
      password: 'Supplied123',
    });

    expect(result.generatedPassword).toBeNull();
    expect(argon2.hash).toHaveBeenCalledWith('Supplied123');
  });

  it('createUser reports a taken email as a conflict', async () => {
    prismaMock.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createUser(ADMIN_ID, { email: 'taken@example.com', role: 'USER' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses every mutation to a deactivated admin', async () => {
    actingAdmin.deactivatedAt = new Date('2026-09-01T00:00:00.000Z');

    await expect(
      service.createUser(ADMIN_ID, { email: 'new@example.com', role: 'USER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('updateUser reports a missing user as not found', async () => {
    await expect(
      service.updateUser(ADMIN_ID, MISSING_ID, { name: 'Nobody' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('updateUser reports a taken email as a conflict', async () => {
    prismaMock.user.update.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.updateUser(ADMIN_ID, TARGET_ID, { email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('resetUserPassword stores the new hash and ends existing sessions', async () => {
    const result = await service.resetUserPassword(ADMIN_ID, TARGET_ID, {});

    expect(result.generatedPassword).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TARGET_ID },
        data: { password: 'hashed-password', hashedRefreshToken: null },
      }),
    );
  });

  it('updateUserStatus refuses to let an admin deactivate themselves', async () => {
    await expect(
      service.updateUserStatus(ADMIN_ID, ADMIN_ID, { status: 'DEACTIVATED' }),
    ).rejects.toThrow('Admin cannot deactivate own account');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('updateUserStatus deactivation ends sessions and keeps the original timestamp', async () => {
    targetDeactivatedAt = new Date('2026-08-01T00:00:00.000Z');

    await service.updateUserStatus(ADMIN_ID, TARGET_ID, { status: 'DEACTIVATED' });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deactivatedAt: targetDeactivatedAt, hashedRefreshToken: null },
      }),
    );
  });

  it('updateUserStatus activation only clears the deactivation mark', async () => {
    prismaMock.user.update.mockResolvedValue(
      createUserRecord({ lastLoginAt: new Date('2026-09-03T00:00:00.000Z') }),
    );

    const result = await service.updateUserStatus(ADMIN_ID, TARGET_ID, { status: 'ACTIVE' });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { deactivatedAt: null } }),
    );
    expect(result.lastLoginAt).toBe('2026-09-03T00:00:00.000Z');
  });

  it('revokeUserSessions clears the refresh token hash', async () => {
    await service.revokeUserSessions(ADMIN_ID, TARGET_ID);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TARGET_ID },
        data: { hashedRefreshToken: null },
      }),
    );
  });
});
