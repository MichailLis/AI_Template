import { parseProfOrientationV3PlusEnrichment } from './prof-orientation-v3-plus.enrichment';

const baseEnrichment = {
  professorSummary:
    'Тебе ближе 3D-моделирование: идеи хочется превращать в понятные цифровые модели.',
  summary:
    'Профиль 3D-моделирования означает, что участнику ближе перевод идеи в точную цифровую модель.',
  confidenceComment:
    'Высокая уверенность связана с устойчивыми выборами и достаточной готовностью.',
  methodSignals: [
    'В большинстве вопросов выбран вариант, связанный с 3D-моделированием.',
    'Интерес к направлению A1 выше остальных интересов.',
  ],
  firstSteps: ['Смоделировать простой корпус устройства.', 'Сделать сборку из деталей.'],
  learningPlan: ['основы черчения', 'CAD/САПР'],
  professionNotes: ['Инженер-конструктор связан с разработкой деталей и сборок.'],
  nextMiniProject: 'Смоделируй корпус небольшого устройства и подготовь чертеж.',
  cautions: [],
};

describe('parseProfOrientationV3PlusEnrichment', () => {
  it('normalizes an unusably short professor summary to the methodology summary', () => {
    const parsed = parseProfOrientationV3PlusEnrichment({
      ...baseEnrichment,
      professorSummary: ':',
    });

    expect(parsed.professorSummary).toBe(baseEnrichment.summary);
  });

  it('allows empty profession notes for broad or low-definition profiles', () => {
    const parsed = parseProfOrientationV3PlusEnrichment({
      ...baseEnrichment,
      professionNotes: [],
    });

    expect(parsed.professionNotes).toEqual([]);
  });

  it('keeps expanded professor summary within the display limit', () => {
    const parsed = parseProfOrientationV3PlusEnrichment({
      ...baseEnrichment,
      professorSummary: 'Развернутое пояснение профессора. '.repeat(20),
    });

    expect(parsed.professorSummary.length).toBeLessThanOrEqual(420);
  });
});
