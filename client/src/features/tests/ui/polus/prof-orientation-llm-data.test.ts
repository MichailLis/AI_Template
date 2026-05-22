import { describe, expect, it } from 'vitest';

import { parseProfOrientationMethodologyEnrichment } from './prof-orientation-llm-data';

const getValidEnrichment = (summary: string) => ({
  summary,
  confidenceComment: 'Методика уверенно показывает устойчивый интерес к инженерным задачам.',
  methodSignals: ['Есть интерес к проектированию и техническим решениям.'],
  firstSteps: ['Собрать небольшой прототип и обсудить результат с наставником.'],
  learningPlan: ['Разобрать основы проектирования и добавить практику каждую неделю.'],
  nextMiniProject: 'Собрать макет полезного технического устройства.',
});

describe('parseProfOrientationMethodologyEnrichment', () => {
  it('removes closed repeated internal choice markers', () => {
    const parsed = parseProfOrientationMethodologyEnrichment(
      getValidEnrichment('Подходит инженерный маршрут (Q1_A1, Q2_A1, Q3_A1) сохранен'),
    );

    expect(parsed?.summary).toBe('Подходит инженерный маршрут сохранен');
  });

  it('keeps long LLM-controlled choice noise out of student-facing text', () => {
    const longInternalChoiceNoise = Array.from(
      { length: 1500 },
      (_, index) => `Q${index + 1}_A1`,
    ).join(', ');

    const parsed = parseProfOrientationMethodologyEnrichment(
      getValidEnrichment(
        `Подходит инженерный маршрут (${longInternalChoiceNoise}, важный вывод сохранен`,
      ),
    );

    expect(parsed?.summary).toBe('Подходит инженерный маршрут важный вывод сохранен');
  });

  it('keeps regular words that start with the readable choice token', () => {
    const parsed = parseProfOrientationMethodologyEnrichment(
      getValidEnrichment('Важно учитывать (выбор, выборка профессий показывает контекст).'),
    );

    expect(parsed?.summary).toBe('Важно учитывать (выбор, выборка профессий показывает контекст).');
  });
});
