import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

describe('Prisma analysis prompt schema', () => {
  const schema = readFileSync(join(__dirname, '../../prisma/schema.prisma'), 'utf8');
  const migrationsDir = join(__dirname, '../../prisma/migrations');
  const migrationSql = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readFileSync(join(migrationsDir, entry.name, 'migration.sql'), 'utf8'))
    .join('\n');

  it('declares versioned analysis prompt models', () => {
    expect(schema).toContain('model AnalysisPrompt');
    expect(schema).toContain('model AnalysisPromptVersion');
    expect(schema).toContain('enum AnalysisPromptVersionStatus');
  });

  it('connects prompt versions to test versions and stored student analyses', () => {
    expect(schema).toContain('analysisPromptVersionId Int?');
    expect(schema).toContain('promptVersionId Int?');
  });

  it('declares prof-orientation scoring metadata and algorithm provider modes', () => {
    expect(schema).toContain('enum TestScoringKind');
    expect(schema).toContain('PROF_ORIENTATION_V3_PLUS');
    expect(schema).toMatch(/scoringKind\s+TestScoringKind\s+@default\(DEFAULT\)/);
    expect(schema).toMatch(/scoringConfig\s+Json\?/);
    expect(schema).toContain('ALGORITHM');
    expect(schema).toContain('ALGORITHM_LLM');
  });

  it('keeps deploy migrations aligned with prof-orientation and public-template schema', () => {
    expect(migrationSql).toContain('CREATE TYPE "TestScoringKind"');
    expect(migrationSql).toContain('CREATE TYPE "TestPublicTemplate"');
    expect(migrationSql).toContain(
      'ALTER TYPE "TestStudentAnalysisProviderMode" ADD VALUE \'ALGORITHM\'',
    );
    expect(migrationSql).toContain(
      'ALTER TYPE "TestStudentAnalysisProviderMode" ADD VALUE \'ALGORITHM_LLM\'',
    );
    expect(migrationSql).toContain(
      '"publicTemplate" "TestPublicTemplate" NOT NULL DEFAULT \'STANDARD\'',
    );
    expect(schema).toMatch(/publicBranding\s+Json\?/);
    expect(migrationSql).toContain('ADD COLUMN "publicBranding" JSONB');
    expect(migrationSql).toContain('"scoringConfig" JSONB');
    expect(migrationSql).toContain('"scoringKind" "TestScoringKind" NOT NULL DEFAULT \'DEFAULT\'');
  });

  it('enforces unique order values for ordered test child collections', () => {
    expect(schema).toContain('@@unique([versionId, order])');
    expect(schema.match(/@@unique\(\[questionId, order\]\)/g)).toHaveLength(2);
  });

  it('indexes public-link attempts by start time for stats queries', () => {
    expect(schema).toContain('@@index([publicLinkId, startedAt])');
    expect(migrationSql).toContain(
      'CREATE INDEX "test_student_attempts_publicLinkId_startedAt_idx"',
    );
  });

  it('enforces case-insensitive uniqueness for identity fields at the database boundary', () => {
    expect(schema).toContain('extensions = [citext]');
    expect(schema).toMatch(/email\s+String\s+@unique\s+@db\.Citext/);
    expect(schema).toMatch(/name\s+String\s+@unique\s+@db\.Citext/);
    expect(migrationSql).toContain('CREATE EXTENSION IF NOT EXISTS citext');
    expect(migrationSql).toContain('ALTER TABLE "users" ALTER COLUMN "email" TYPE public.CITEXT');
    expect(migrationSql).toContain(
      'ALTER TABLE "education_organizations" ALTER COLUMN "name" TYPE public.CITEXT',
    );
  });
});
