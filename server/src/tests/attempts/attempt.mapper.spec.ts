import { mapAttemptListItem } from './attempt.mapper';
import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from '../prof-orientation-v3-plus/types';

const createAttempt = (analysis: unknown) =>
  ({
    id: 191,
    status: 'COMPLETED',
    attemptNumber: 1,
    studentName: 'Иван',
    studentLastInitial: 'И',
    studentMiddleInitial: 'И',
    educationOrganization: 'Лицей',
    groupOrClass: '11Б',
    studentGender: null,
    studentAge: null,
    studentResidence: null,
    studentEducationLevel: null,
    startedAt: new Date('2026-09-11T10:00:00.000Z'),
    finishedAt: new Date('2026-09-11T10:10:00.000Z'),
    expiresAt: null,
    analysis,
  }) as unknown as Parameters<typeof mapAttemptListItem>[0];

const toAttemptStatus = () => 'COMPLETED';

describe('mapAttemptListItem analysis result kind', () => {
  it('marks a stub analysis as a stub instead of a ready result', () => {
    const result = mapAttemptListItem(
      createAttempt({ providerMode: 'STUB', status: 'READY', summary: { mode: 'stub' } }),
      toAttemptStatus,
    );

    expect(result).toMatchObject({
      analysisStatus: 'READY',
      analysisResultKind: 'STUB',
    });
  });

  it('marks a two-phase analysis whose LLM phase failed as algorithm only', () => {
    const result = mapAttemptListItem(
      createAttempt({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: {
          resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
          llm: { status: 'failed' },
        },
      }),
      toAttemptStatus,
    );

    expect(result).toMatchObject({
      analysisStatus: 'READY',
      llmStatus: 'failed',
      analysisResultKind: 'ALGORITHM_ONLY',
    });
  });

  it('marks a finished AI analysis as AI content', () => {
    const result = mapAttemptListItem(
      createAttempt({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: {
          resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
          llm: { status: 'ready' },
        },
      }),
      toAttemptStatus,
    );

    expect(result).toMatchObject({ analysisResultKind: 'AI' });
  });

  it('marks an attempt without an analysis record as missing', () => {
    const result = mapAttemptListItem(createAttempt(null), toAttemptStatus);

    expect(result).toMatchObject({
      analysisStatus: null,
      analysisResultKind: 'MISSING',
    });
  });
});
