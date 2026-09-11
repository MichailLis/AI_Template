import { ForbiddenException } from '@nestjs/common';
import type { Role } from '@prisma/client';

import { PrismaService } from '../../prisma.service';

type AdminAccessUser = {
  role: Role;
  // Required, not optional: a select that forgets the column must fail to compile instead of
  // letting a deactivated admin through on a still-valid access token.
  deactivatedAt: Date | null;
};

export const assertAdminUser = <TUser extends AdminAccessUser>(
  user: TUser | null | undefined,
): TUser => {
  if (!user || user.role !== 'ADMIN' || user.deactivatedAt !== null) {
    throw new ForbiddenException('Admin area only');
  }

  return user;
};

export const ensureAdminAccess = async (prisma: PrismaService, userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deactivatedAt: true },
  });

  assertAdminUser(user);
};
