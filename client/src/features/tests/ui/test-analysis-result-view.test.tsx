import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestAnalysisResultView } from './test-analysis-result-view';

describe('TestAnalysisResultView', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Находка аудита UX-01: у заглушки статус записи тоже `READY`, поэтому карточка показывала
   * зелёное «Анализ готов», а рядом — сырой JSON и английский текст про заглушку.
   */
  it('names a stub honestly instead of showing a green ready badge', () => {
    render(
      <TestAnalysisResultView
        analysis={{
          status: 'READY',
          providerMode: 'STUB',
          resultKind: 'STUB',
          summary: { mode: 'stub', note: 'LLM analysis is not enabled yet.' },
          rawText: 'Stub analysis is ready. LLM integration will be added in the next iteration.',
        }}
      />,
    );

    expect(screen.getByText('Заглушка, промпт не подключен')).toBeInTheDocument();
    expect(screen.queryByText('Анализ готов')).not.toBeInTheDocument();
  });

  it('hides the raw payload of a contentless analysis behind a collapsed technical block', () => {
    render(
      <TestAnalysisResultView
        analysis={{
          status: 'READY',
          providerMode: 'STUB',
          resultKind: 'STUB',
          summary: { mode: 'stub', note: 'LLM analysis is not enabled yet.' },
          rawText: 'Stub analysis is ready. LLM integration will be added in the next iteration.',
        }}
      />,
    );

    const technicalBlock = screen.getByText('Технические данные').closest('details');
    expect(technicalBlock).not.toBeNull();
    expect(technicalBlock?.open).toBe(false);
    expect(technicalBlock?.textContent).toContain('"mode": "stub"');
    expect(technicalBlock?.textContent).toContain('LLM integration will be added');

    expect(screen.queryByText('Структурированные данные анализа')).not.toBeInTheDocument();
    expect(screen.queryByText('Текст анализа')).not.toBeInTheDocument();
  });

  it('explains in plain words what a contentless ready analysis means', () => {
    render(
      <TestAnalysisResultView
        analysis={{
          status: 'READY',
          providerMode: 'STUB',
          resultKind: 'STUB',
          summary: { mode: 'stub' },
          rawText: null,
        }}
      />,
    );

    expect(
      screen.getByText(
        'Содержательного анализа нет: к версии теста не подключен промпт, участник увидел только заглушку.',
      ),
    ).toBeInTheDocument();
  });

  /**
   * У настоящего ИИ-анализа сводка может не пройти разбор, но текст в `rawText` всё равно является
   * содержанием, и прятать его под «Технические данные» нельзя.
   */
  it('keeps the text of a real AI analysis visible and adds no technical block', () => {
    render(
      <TestAnalysisResultView
        analysis={{
          status: 'READY',
          providerMode: 'LLM',
          resultKind: 'AI',
          summary: { introduction: 'Вы уверенно работаете с данными.' },
          rawText: 'Вы уверенно работаете с данными.',
        }}
      />,
    );

    expect(screen.getByText('ИИ-анализ готов')).toBeInTheDocument();
    expect(screen.getByText('Текст анализа')).toBeInTheDocument();
    expect(screen.getByText('Вы уверенно работаете с данными.')).toBeInTheDocument();
    expect(screen.queryByText('Технические данные')).not.toBeInTheDocument();
  });
});
