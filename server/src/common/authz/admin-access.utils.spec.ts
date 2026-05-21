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
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });

    await expect(
      ensureAdminAccess(prismaMock as unknown as PrismaService, 7),
    ).resolves.toBeUndefined();

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true, role: true },
    });
  });

  it('rejects non-admin users', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'USER' });

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
    const adminUser = { id: 7, role: 'ADMIN' as const, email: 'admin@example.com' };

    expect(assertAdminUser(adminUser)).toBe(adminUser);
  });

  it('rejects non-admin users from assertion checks', () => {
    expect(() => assertAdminUser({ id: 7, role: 'USER' })).toThrow(ForbiddenException);
    expect(() => assertAdminUser(null)).toThrow(ForbiddenException);
  });
});
