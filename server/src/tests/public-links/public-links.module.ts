import { Module } from '@nestjs/common';

import { AppSettingsModule } from '../../app-settings/app-settings.module';
import { AuditModule } from '../../audit/audit.module';
import { TestsAdminEducationOrganizationsController } from '../public-links/admin-education-organizations.controller';
import { TestsAdminPublicLinksController } from '../public-links/admin-public-links.controller';
import { TestsEducationOrganizationService } from '../public-links/education-organization.service';
import { TestsPublicLinkService } from '../public-links/public-link.service';

@Module({
  imports: [AppSettingsModule, AuditModule],
  controllers: [TestsAdminPublicLinksController, TestsAdminEducationOrganizationsController],
  providers: [TestsPublicLinkService, TestsEducationOrganizationService],
  exports: [TestsPublicLinkService, TestsEducationOrganizationService],
})
export class TestsPublicLinksModule {}
