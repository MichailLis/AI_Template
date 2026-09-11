import { ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';
import { assertAdminUser, ensureAdminAccess } from './admin-access.utils';

describe('ensureAdminAccess', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
  });

  it('allows admin users', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN', deactivatedAt: null });

    await expect(
      ensureAdminAccess(prismaMock as unknown as PrismaService, 7),
    ).resolves.toBeUndefined();

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true, role: true, deactivatedAt: true },
    });
  });

  it('rejects deactivated admins', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      role: 'ADMIN',
      deactivatedAt: new Date('2026-09-01T00:00:00.000Z'),
    });

    await expect(
      ensureAdminAccess(prismaMock as unknown as PrismaService, 7),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-admin users', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'USER', deactivatedAt: null });

    await expect(
      ensureAdminAccess(prismaMock as unknown as PrismaService, 7),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing users', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      ensureAdminAccess(prismaMock as unknown as PrismaService, 7),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns an existing admin user from assertion checks', () => {
    const adminUser = {
      id: 7,
      role: 'ADMIN' as const,
      email: 'admin@example.com',
      deactivatedAt: null,
    };

    expect(assertAdminUser(adminUser)).toBe(adminUser);
  });

  it('rejects non-admin and deactivated users from assertion checks', () => {
    expect(() => assertAdminUser({ id: 7, role: 'USER', deactivatedAt: null })).toThrow(
      ForbiddenException,
    );
    expect(() => assertAdminUser({ id: 7, role: 'ADMIN', deactivatedAt: new Date() })).toThrow(
      ForbiddenException,
    );
    expect(() => assertAdminUser(null)).toThrow(ForbiddenException);
  });
});
