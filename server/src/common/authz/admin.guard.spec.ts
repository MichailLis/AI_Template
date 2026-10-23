import { ForbiddenException, type ExecutionContext } from '@nestjs/common';

import { AdminBackupsController } from '../../admin/admin-backups.controller';
import { AdminSettingsController } from '../../admin/admin-settings.controller';
import { AdminController } from '../../admin/admin.controller';
import { AnalysisPromptsController } from '../../analysis-prompts/analysis-prompts.controller';
import { TestsAdminAttemptsController } from '../../tests/attempts/admin-attempts.controller';
import { TestsAdminEducationOrganizationsController } from '../../tests/public-links/admin-education-organizations.controller';
import { TestsAdminPublicLinksController } from '../../tests/public-links/admin-public-links.controller';
import { TestsAdminAnalyticsController } from '../../tests/reporting/admin-analytics.controller';
import { TestsController } from '../../tests/topics/topics.controller';
import type { PrismaService } from '../../prisma.service';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const findUnique = jest.fn();
  const guard = new AdminGuard({ user: { findUnique } } as unknown as PrismaService);
  const contextFor = (user: unknown) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

  beforeEach(() => findUnique.mockReset());

  it('lets an active admin through', async () => {
    findUnique.mockResolvedValue({ id: 7, role: 'ADMIN', deactivatedAt: null });

    await expect(guard.canActivate(contextFor({ sub: 7 }))).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 } }));
  });

  it.each([
    ['a non-admin', { id: 7, role: 'USER', deactivatedAt: null }],
    ['a deactivated admin', { id: 7, role: 'ADMIN', deactivatedAt: new Date() }],
    ['a user that no longer exists', null],
  ])('rejects %s with 403', async (_label, row) => {
    findUnique.mockResolvedValue(row);

    await expect(guard.canActivate(contextFor({ sub: 7 }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each([
    AdminController,
    AdminSettingsController,
    AdminBackupsController,
    AnalysisPromptsController,
    TestsAdminAttemptsController,
    TestsAdminEducationOrganizationsController,
    TestsAdminPublicLinksController,
    TestsAdminAnalyticsController,
    TestsController,
  ])('is applied to %p', (controller) => {
    expect(Reflect.getMetadata('__guards__', controller)).toContain(AdminGuard);
  });
});
