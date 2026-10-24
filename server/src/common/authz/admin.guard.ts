import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { PrismaService } from '../../prisma.service';
import { ensureAdminAccess } from './admin-access.utils';

/**
 * Admin routes are closed here, once per controller, so a new service method cannot forget the
 * check. Runs after `AtGuard`, which puts the token payload on `request.user`. The role is read
 * from the database on every request: a deactivated admin still holds a valid access token, and
 * so does one whose sessions were revoked (`sessionsRevokedAt` vs the token's `iat`). Non-admin
 * routes only check the global epoch in `AccessTokenStrategy`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const { sub, iat } = request.user as { sub: number; iat?: number };

    await ensureAdminAccess(this.prisma, sub, iat);

    return true;
  }
}
