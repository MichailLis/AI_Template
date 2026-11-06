import { parseProfOrientationV3PlusEnrichment } from './enrichment';
import {
  sanitizeMethodologyText,
  toStudentEnrichment,
  type PublicProfOrientationEnrichment,
} from './enrichment-text';

const getValidEnrichment = (summary: string): PublicProfOrientationEnrichment => ({
  professorSummary: null,
  summary,
  professionNotes: [],
  firstSteps: ['Собрать небольшой прототип и обсудить результат с наставником.'],
  learningPlan: ['Разобрать основы проектирования и добавить практику каждую неделю.'],
  nextMiniProject: 'Собрать макет полезного технического устройства.',
});

// Три первых теста перенесены из клиента (sanitizeProfOrientationEnrichment) без изменений ожиданий.
describe('toStudentEnrichment', () => {
  it('removes closed repeated internal choice markers', () => {
    const parsed = toStudentEnrichment(
      getValidEnrichment('Подходит инженерный маршрут (Q1_A1, Q2_A1, Q3_A1) сохранен'),
    );
    expect(parsed?.summary).toBe('Подходит инженерный маршрут сохранен');
  });

  it('keeps long LLM-controlled choice noise out of student-facing text', () => {
    const longInternalChoiceNoise = Array.from(
      { length: 1500 },
      (_, index) => `Q${index + 1}_A1`,
    ).join(', ');

    const parsed = toStudentEnrichment(
      getValidEnrichment(
        `Подходит инженерный маршрут (${longInternalChoiceNoise}, важный вывод сохранен`,
      ),
    );
    expect(parsed?.summary).toBe('Подходит инженерный маршрут важный вывод сохранен');
  });

  it('keeps regular words that start with the readable choice token', () => {
    const parsed = toStudentEnrichment(
      getValidEnrichment('Важно учитывать (выбор, выборка профессий показывает контекст).'),
    );
    expect(parsed?.summary).toBe('Важно учитывать (выбор, выборка профессий показывает контекст).');
  });

  it('returns null when nothing usable is left, and drops a too short professor summary', () => {
    expect(toStudentEnrichment(null)).toBeNull();
    expect(toStudentEnrichment({ ...getValidEnrichment('Текст'), firstSteps: [] })).toBeNull();
    expect(
      toStudentEnrichment({ ...getValidEnrichment('Текст'), professorSummary: 'Коротко' })
        ?.professorSummary,
    ).toBeNull();
  });
});

describe('sanitizeMethodologyText', () => {
  it.each([
    ['Баллы A1 и S_A1, R_HANDS', 'Баллы направление и шкала интереса, шкала готовности'],
    ['gap 26.7, consistencyIndex 1', 'отрыв по баллам, выборы были устойчивыми'],
    ['mixed_profile по topDirections', 'смешанный профиль по близкие направления'],
  ])('replaces technical codes in %s', (input, expected) => {
    expect(sanitizeMethodologyText(input)).toBe(expected);
  });
});

describe('parseProfOrientationV3PlusEnrichment: clean text goes to storage', () => {
  it('cleans the six student-facing fields before the length checks', () => {
    const result = parseProfOrientationV3PlusEnrichment({
      professorSummary: `Тебе близко направление A1: ${'интерес к практике '.repeat(5)}`,
      summary: 'Выборы (Q1_A1, Q2_A1, Q3_A1) говорят о технике.',
      confidenceComment: 'Комментарий',
      methodSignals: ['первый', 'второй'],
      firstSteps: ['Попробовать S_A1 на практике', 'Q1_A1', 'Собрать модель'],
      learningPlan: ['основы черчения', 'R_CODE_MATH и логика'],
      professionNotes: ['Инженер: gap 12.5'],
      nextMiniProject: 'Мини-проект по A1',
      cautions: [],
    });

    expect(result.professorSummary).toContain('направление');
    expect(result.professorSummary).not.toMatch(/\bA1\b/);
    expect(result.summary).toBe('Выборы говорят о технике.');
    expect(result.firstSteps).toEqual([
      'Попробовать шкала интереса на практике',
      'выбор',
      'Собрать модель',
    ]);
    expect(result.learningPlan).toEqual(['основы черчения', 'шкала готовности и логика']);
    expect(result.professionNotes).toEqual(['Инженер: отрыв по баллам']);
    expect(result.nextMiniProject).toBe('Мини-проект по ведущему направлению');
  });
});
