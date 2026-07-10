import { Module } from '@nestjs/common';

import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { TestsAdminEducationOrganizationsController } from './tests-admin-education-organizations.controller';
import { TestsAdminPublicLinksController } from './tests-admin-public-links.controller';
import { TestsEducationOrganizationService } from './tests-education-organization.service';
import { TestsPublicLinkService } from './tests-public-link.service';

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
