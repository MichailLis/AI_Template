import { ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

export const ensureTestsAdminAccess = async (prisma: PrismaService, userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new ForbiddenException('Admin area only');
  }
};
