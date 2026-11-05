import { INestApplication } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { AdminSettingsController } from '../src/admin/admin-settings.controller';
import { AppSettingsModule } from '../src/app-settings/app-settings.module';
import { PrivacyPolicyController } from '../src/app-settings/privacy-policy.controller';
import { PrivacyPolicySettingsService } from '../src/app-settings/privacy-policy-settings.service';
import { ProfessionAtlasClientService } from '../src/app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../src/app-settings/profession-atlas-settings.service';
import { PublicRateLimitSettingsService } from '../src/app-settings/public-rate-limit-settings.service';
import { AuditService } from '../src/audit/audit.service';
import { TestsAnalysisService } from '../src/tests/analysis/analysis.service';
import { TestsPublicLinkService } from '../src/tests/public-links/public-link.service';
import { TestsPublicAttemptAllocationService } from '../src/tests/session/attempt-allocation.service';
import { ProfOrientationAtlasService } from '../src/tests/prof-orientation-v3-plus/atlas';
import { PrismaService } from '../src/prisma.service';

type Constructor = abstract new (...args: never[]) => unknown;

/**
 * Nest creates one instance of a provider per module that lists it in `providers`. A service in
 * two modules is two instances, and the first cache added to it would diverge between the admin
 * area and the public area (#167). The container is what Nest really built, so a new duplicate is
 * caught here without editing this file.
 */
const listDeclaringModules = (container: ModulesContainer) => {
  const declaredIn = new Map<Constructor, string[]>();

  for (const module of container.values()) {
    for (const [token, wrapper] of module.providers) {
      // Providers declared by value or factory (APP_PIPE, ...) and the module's own class are not
      // services; ModuleRef and the like are added by Nest itself to every module.
      if (typeof token !== 'function' || wrapper.metatype !== token || token === module.metatype) {
        continue;
      }
      if (token.name === 'ModuleRef' || token.name === 'Reflector') {
        continue;
      }
      declaredIn.set(token as Constructor, [
        ...(declaredIn.get(token as Constructor) ?? []),
        module.name,
      ]);
    }
  }

  return declaredIn;
};

describe('Provider instances (e2e)', () => {
  let app: INestApplication;
  let previousSkipDbConnect: string | undefined;

  beforeAll(async () => {
    previousSkipDbConnect = process.env.SKIP_DB_CONNECT;
    process.env.SKIP_DB_CONNECT = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (previousSkipDbConnect === undefined) {
      delete process.env.SKIP_DB_CONNECT;
      return;
    }

    process.env.SKIP_DB_CONNECT = previousSkipDbConnect;
  });

  it('declares every service in exactly one module', () => {
    const duplicates = [...listDeclaringModules(app.get(ModulesContainer))]
      .filter(([, modules]) => modules.length > 1)
      .map(([service, modules]) => `${service.name}: ${modules.join(', ')}`);

    expect(duplicates).toEqual([]);
  });

  it.each(
    [
      PrivacyPolicySettingsService,
      ProfessionAtlasSettingsService,
      ProfessionAtlasClientService,
      PublicRateLimitSettingsService,
    ].map((service) => [service.name, service] as const),
  )('keeps %s only in AppSettingsModule', (_name, service) => {
    expect(listDeclaringModules(app.get(ModulesContainer)).get(service)).toEqual([
      AppSettingsModule.name,
    ]);
  });

  it('shares the audit trail and the atlas service between admin and public modules', () => {
    const declaredIn = listDeclaringModules(app.get(ModulesContainer));

    expect(declaredIn.get(AuditService)).toEqual(['AuditModule']);
    expect(declaredIn.get(ProfOrientationAtlasService)).toEqual(['ProfOrientationAtlasModule']);
    expect(declaredIn.get(PrismaService)).toEqual(['PrismaModule']);
  });

  it('injects the same settings and atlas instances into the admin and public consumers', () => {
    const injected = (consumer: unknown, field: string) =>
      (consumer as Record<string, unknown>)[field];
    const get = <T>(token: abstract new (...args: never[]) => T) =>
      app.get(token, { strict: false });

    const privacyPolicy = injected(get(AdminSettingsController), 'privacyPolicySettingsService');
    expect(privacyPolicy).toBeInstanceOf(PrivacyPolicySettingsService);
    expect(injected(get(TestsPublicLinkService), 'privacyPolicySettingsService')).toBe(
      privacyPolicy,
    );
    expect(injected(get(TestsPublicAttemptAllocationService), 'privacyPolicySettingsService')).toBe(
      privacyPolicy,
    );
    expect(injected(get(PrivacyPolicyController), 'privacyPolicySettingsService')).toBe(
      privacyPolicy,
    );

    const atlas = injected(get(AdminSettingsController), 'profOrientationAtlasService');
    expect(atlas).toBeInstanceOf(ProfOrientationAtlasService);
    expect(injected(get(TestsAnalysisService), 'profOrientationAtlas')).toBe(atlas);
  });
});
