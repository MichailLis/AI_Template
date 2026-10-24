import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Role } from '@prisma/client';

import type { PrismaService } from '../../prisma.service';

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

/**
 * `tokenIat` (seconds) is the access token's issue time. A token issued before the last session
 * revocation is rejected; iat is whole seconds, so the boundary rounds down and a token issued in
 * the same second as the revocation still passes (as in `AccessTokenStrategy`).
 */
export const ensureAdminAccess = async (
  prisma: PrismaService,
  userId: number,
  tokenIat?: number,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deactivatedAt: true, sessionsRevokedAt: true },
  });

  const admin = assertAdminUser(user);

  if (
    tokenIat !== undefined &&
    admin.sessionsRevokedAt &&
    tokenIat < Math.floor(admin.sessionsRevokedAt.getTime() / 1000)
  ) {
    throw new UnauthorizedException('Session expired');
  }
};
