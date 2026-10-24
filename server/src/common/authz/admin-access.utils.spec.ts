import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import type { PrismaService } from '../../prisma.service';
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
      select: { id: true, role: true, deactivatedAt: true, sessionsRevokedAt: true },
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

  it.each([
    ['issued before the revocation', 1_000, 401],
    ['issued in the revocation second', 2_000, 200],
    ['issued after the revocation', 2_001, 200],
  ])('token %s (iat %i)', async (_label, iat, status) => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      role: 'ADMIN',
      deactivatedAt: null,
      sessionsRevokedAt: new Date(2_000_500),
    });

    const result = ensureAdminAccess(prismaMock as unknown as PrismaService, 7, iat);

    if (status === 401) await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    else await expect(result).resolves.toBeUndefined();
  });

  it('ignores sessionsRevokedAt when there is no token', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      role: 'ADMIN',
      deactivatedAt: null,
      sessionsRevokedAt: new Date(),
    });

    await expect(
      ensureAdminAccess(prismaMock as unknown as PrismaService, 7),
    ).resolves.toBeUndefined();
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
