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

  it('enforces unique order values for ordered test child collections', () => {
    expect(schema).toContain('@@unique([versionId, order])');
    expect(schema.match(/@@unique\(\[questionId, order\]\)/g)).toHaveLength(2);
  });
});
