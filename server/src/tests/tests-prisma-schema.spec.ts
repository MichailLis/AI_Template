import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Prisma analysis prompt schema', () => {
  const schema = readFileSync(join(__dirname, '../../prisma/schema.prisma'), 'utf8');

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

  it('enforces unique order values for ordered test child collections', () => {
    expect(schema).toContain('@@unique([versionId, order])');
    expect(schema.match(/@@unique\(\[questionId, order\]\)/g)).toHaveLength(2);
  });
});
