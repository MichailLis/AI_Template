import { getAnalysisResultKind } from './analysis-result-kind';
import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from '../prof-orientation-v3-plus/types';

const profOrientationSummary = (llmStatus?: string) => ({
  resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
  ...(llmStatus === undefined ? {} : { llm: { status: llmStatus } }),
});

describe('getAnalysisResultKind', () => {
  it('reports a missing analysis when the attempt has none', () => {
    expect(getAnalysisResultKind(null)).toBe('MISSING');
    expect(getAnalysisResultKind(undefined)).toBe('MISSING');
  });

  it('reports the stub as a stub, not as a ready analysis', () => {
    expect(
      getAnalysisResultKind({
        providerMode: 'STUB',
        status: 'READY',
        summary: { mode: 'stub' },
      }),
    ).toBe('STUB');
  });

  it('reports a finished plain LLM analysis as AI content', () => {
    expect(
      getAnalysisResultKind({
        providerMode: 'LLM',
        status: 'READY',
        summary: { introduction: 'Текст' },
      }),
    ).toBe('AI');
  });

  it('reports an algorithmic analysis without an attached prompt as algorithm only', () => {
    expect(
      getAnalysisResultKind({
        providerMode: 'ALGORITHM',
        status: 'READY',
        summary: profOrientationSummary('not_requested'),
      }),
    ).toBe('ALGORITHM_ONLY');
  });

  /**
   * Инвариант проекта: у prof-orientation запись становится READY после алгоритмической фазы,
   * поэтому READY сам по себе ничего не говорит про ИИ — источником истины является llmStatus.
   */
  it('reads llmStatus rather than status for a two-phase prof-orientation analysis', () => {
    expect(
      getAnalysisResultKind({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: profOrientationSummary('ready'),
      }),
    ).toBe('AI');

    expect(
      getAnalysisResultKind({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: profOrientationSummary('pending'),
      }),
    ).toBe('ALGORITHM_AI_PENDING');

    expect(
      getAnalysisResultKind({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: profOrientationSummary('failed'),
      }),
    ).toBe('ALGORITHM_ONLY');

    expect(
      getAnalysisResultKind({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: profOrientationSummary(),
      }),
    ).toBe('ALGORITHM_ONLY');
  });

  it('treats a two-phase analysis with an unreadable summary as algorithm only', () => {
    expect(
      getAnalysisResultKind({
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: null,
      }),
    ).toBe('ALGORITHM_ONLY');
  });

  it('errs towards no-AI rather than AI for an unrecognised provider mode', () => {
    expect(
      getAnalysisResultKind({
        providerMode: 'SOMETHING_NEW',
        status: 'READY',
        summary: { introduction: 'Текст' },
      }),
    ).toBe('ALGORITHM_ONLY');
  });

  it('keeps pending and failed analyses out of every content bucket', () => {
    expect(getAnalysisResultKind({ providerMode: 'LLM', status: 'PENDING', summary: null })).toBe(
      'PENDING',
    );
    expect(getAnalysisResultKind({ providerMode: 'LLM', status: 'FAILED', summary: null })).toBe(
      'FAILED',
    );
  });
});
