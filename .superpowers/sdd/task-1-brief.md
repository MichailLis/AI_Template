### Task 1: Lock schema and DTO contracts

**Files:**

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260710000000_add_personal_data_processing_modes/migration.sql`
- Modify: `server/src/tests/dto/tests-links.dto.ts`
- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Test: `server/src/tests/dto/tests-links.dto.spec.ts`
- Test: `server/src/tests/dto/tests-public.dto.spec.ts`
- Test: `server/src/tests/tests-prisma-schema.spec.ts`

**Interfaces:**

- Produces enum `PersonalDataProcessingMode` and nullable organization/link/attempt fields.
- Produces `PersonalDataSchema` used by public access responses and generated client types.

**Exact schema requirements:**

- `PersonalDataProcessingMode { PUBLIC, ON_BEHALF_OF_EDUCATION_ORGANIZATION }`.
- `EducationOrganization`: nullable `fullName`, `shortName`, `inn`, `ogrn`, `legalAddress`, `email`, `phone`, `privacyPolicyUrl`, `consentDocumentUrl`, `logoUrl`.
- `TestPublicLink`: mode default PUBLIC plus nullable `operatorFullNameSnapshot`, `operatorShortNameSnapshot`, `operatorPrivacyPolicyUrlSnapshot`, `operatorConsentDocumentUrlSnapshot`.
- `TestStudentAttempt`: nullable `operatorEducationOrganizationId` FK to EducationOrganization with `onDelete: SetNull`, plus the same nullable operator snapshot fields and an index on the FK.
- Migration must preserve old rows, default/backfill old links to PUBLIC, and backfill PUBLIC link operator snapshots with full name `АНО «Центр развития компьютерного спорта и цифровых технологий»`, short name NULL, policy URL `/privacy`, consent URL NULL. Historical attempts stay nullable.
- `PersonalDataSchema` in the public DTO contains `processingMode`, `operatorFullName`, nullable `operatorShortName`, `privacyPolicyUrl`, nullable `consentDocumentUrl`, nullable `logoUrl`.
- Admin link create/update schemas expose the mode. Create defaults to PUBLIC. DTO-level validation requires `educationOrganizationId` only for ON_BEHALF_OF_EDUCATION_ORGANIZATION; PUBLIC may still carry an optional organization ID for participant-profile locking.
- Organization URL fields must validate URLs when non-null; no uniqueness requirement for INN/OGRN.

**TDD:**

1. Write failing DTO/schema tests first and run them.
2. Confirm expected failure is missing enum/fields/personalData contract.
3. Implement minimal schema, migration, and Zod contracts.
4. Run `npm run prisma:generate`, `npm run verify:prisma-migrations`, and targeted Jest tests.

**Global constraints:** existing-feature-change owned by tests; main branch; no Organization table, new roles, new feature, new dependencies, generated client edits, or unrelated cleanup. Preserve group validation and old public links.
