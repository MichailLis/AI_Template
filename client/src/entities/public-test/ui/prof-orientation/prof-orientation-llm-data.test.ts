import { describe, expect, it } from 'vitest';

import pairedRulesVectors from '../../../../../../template/paired-rules.vectors.json';

import {
  getProfOrientationLlmStatus,
  sanitizeProfOrientationEnrichment,
} from './prof-orientation-llm-data';

import type { PublicProfOrientationEnrichment } from '@/shared/api/model';

const getValidEnrichment = (summary: string): PublicProfOrientationEnrichment => ({
  professorSummary: null,
  summary,
  professionNotes: [],
  firstSteps: ['Собрать небольшой прототип и обсудить результат с наставником.'],
  learningPlan: ['Разобрать основы проектирования и добавить практику каждую неделю.'],
  nextMiniProject: 'Собрать макет полезного технического устройства.',
});

describe('sanitizeProfOrientationEnrichment', () => {
  it('removes closed repeated internal choice markers', () => {
    const parsed = sanitizeProfOrientationEnrichment(
      getValidEnrichment('Подходит инженерный маршрут (Q1_A1, Q2_A1, Q3_A1) сохранен'),
    );
    expect(parsed?.summary).toBe('Подходит инженерный маршрут сохранен');
  });

  it('keeps long LLM-controlled choice noise out of student-facing text', () => {
    const longInternalChoiceNoise = Array.from(
      { length: 1500 },
      (_, index) => `Q${index + 1}_A1`,
    ).join(', ');

    const parsed = sanitizeProfOrientationEnrichment(
      getValidEnrichment(
        `Подходит инженерный маршрут (${longInternalChoiceNoise}, важный вывод сохранен`,
      ),
    );
    expect(parsed?.summary).toBe('Подходит инженерный маршрут важный вывод сохранен');
  });

  it('keeps regular words that start with the readable choice token', () => {
    const parsed = sanitizeProfOrientationEnrichment(
      getValidEnrichment('Важно учитывать (выбор, выборка профессий показывает контекст).'),
    );
    expect(parsed?.summary).toBe('Важно учитывать (выбор, выборка профессий показывает контекст).');
  });
});

describe('getProfOrientationLlmStatus', () => {
  it.each(pairedRulesVectors.vectors.getProfOrientationLlmStatus)(
    'satisfies shared vector: $description',
    ({ input, expected }) => {
      expect(getProfOrientationLlmStatus(input)).toBe(expected);
    },
  );
});
