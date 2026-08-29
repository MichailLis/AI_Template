import { Module } from '@nestjs/common';

import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { TestsAdminEducationOrganizationsController } from '../public-links/admin-education-organizations.controller';
import { TestsAdminPublicLinksController } from '../public-links/admin-public-links.controller';
import { TestsEducationOrganizationService } from '../public-links/education-organization.service';
import { TestsPublicLinkService } from '../public-links/public-link.service';

@Module({
  controllers: [TestsAdminPublicLinksController, TestsAdminEducationOrganizationsController],
  providers: [
    TestsPublicLinkService,
    TestsEducationOrganizationService,
    PrivacyPolicySettingsService,
  ],
  exports: [TestsPublicLinkService, TestsEducationOrganizationService],
})
export class TestsPublicLinksModule {}
