import { describeAnswer, mapAttemptListItem } from './attempt.mapper';
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

/** Находка UI-аудита 2026-10-02 (H01): в «Ответах студента» был виден только сырой JSON. */
describe('describeAnswer', () => {
  const question = {
    options: [
      { label: 'Исследовать и разбираться', value: 'research' },
      { label: 'Работать в команде', value: 'team' },
      { label: 'Выступать публично', value: 'speaking' },
    ],
    sliderBands: [
      { minValue: 1, maxValue: 3, label: 'Некомфортно' },
      { minValue: 4, maxValue: 5, label: 'Комфортно' },
    ],
  };

  it('replaces an option code with the label the student saw', () => {
    expect(describeAnswer('research', question)).toBe('Исследовать и разбираться');
  });

  it('lists every chosen option of a multiple choice by label', () => {
    expect(describeAnswer(['team', 'speaking'], question)).toBe(
      'Работать в команде, Выступать публично',
    );
  });

  it('keeps free text as typed', () => {
    expect(describeAnswer('Собираю роботов', { options: [], sliderBands: [] })).toBe(
      'Собираю роботов',
    );
  });

  it('puts the slider band next to the number', () => {
    expect(describeAnswer(1, question)).toBe('1 — Некомфортно');
    expect(describeAnswer(7, question)).toBe('7');
  });

  it('falls back to the code when the option no longer exists', () => {
    expect(describeAnswer('removed', question)).toBe('removed');
  });

  it('returns null for an empty or unknown answer', () => {
    expect(describeAnswer('  ', question)).toBeNull();
    expect(describeAnswer([], question)).toBeNull();
    expect(describeAnswer({ unexpected: true }, question)).toBeNull();
  });
});
