import { describe, expect, it } from 'vitest';

import {
  getAnalysisResultKindLabel,
  getAnalysisResultKindTone,
} from './analysis-result-kind-labels';

describe('getAnalysisResultKindLabel', () => {
  it('names the source of the result instead of the bare record status', () => {
    expect(getAnalysisResultKindLabel('AI')).toBe('ИИ-анализ готов');
    expect(getAnalysisResultKindLabel('ALGORITHM_AI_PENDING')).toBe('Алгоритм готов, ИИ считается');
    expect(getAnalysisResultKindLabel('ALGORITHM_ONLY')).toBe('Только алгоритм, ИИ не отработал');
    expect(getAnalysisResultKindLabel('STUB')).toBe('Заглушка, промпт не подключен');
  });

  it('keeps the plain lifecycle states readable too', () => {
    expect(getAnalysisResultKindLabel('PENDING')).toBe('В очереди');
    expect(getAnalysisResultKindLabel('FAILED')).toBe('Ошибка анализа');
    expect(getAnalysisResultKindLabel('MISSING')).toBe('Нет анализа');
  });

  it('shows an unknown value as it came rather than hiding it behind a dash', () => {
    expect(getAnalysisResultKindLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
    expect(getAnalysisResultKindLabel(null)).toBe('Нет анализа');
  });
});

describe('getAnalysisResultKindTone', () => {
  it('reserves the success tone for a result that really has AI content', () => {
    expect(getAnalysisResultKindTone('AI')).toBe('success');
  });

  it('never paints a stub or a missing AI phase as success', () => {
    expect(getAnalysisResultKindTone('STUB')).toBe('warning');
    expect(getAnalysisResultKindTone('ALGORITHM_ONLY')).toBe('warning');
    expect(getAnalysisResultKindTone('ALGORITHM_AI_PENDING')).toBe('neutral');
    expect(getAnalysisResultKindTone('PENDING')).toBe('neutral');
    expect(getAnalysisResultKindTone('MISSING')).toBe('neutral');
    expect(getAnalysisResultKindTone('FAILED')).toBe('danger');
  });
});
