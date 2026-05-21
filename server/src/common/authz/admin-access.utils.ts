import { ForbiddenException } from '@nestjs/common';
import type { Role } from '@prisma/client';

import { PrismaService } from '../../prisma.service';

type AdminAccessUser = {
  role: Role;
};

export const assertAdminUser = <TUser extends AdminAccessUser>(
  user: TUser | null | undefined,
): TUser => {
  if (!user || user.role !== 'ADMIN') {
    throw new ForbiddenException('Admin area only');
  }

  return user;
};

export const ensureAdminAccess = async (prisma: PrismaService, userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  assertAdminUser(user);
};
