import { TestAnalysisResultJsonSchema, TestAnalysisResultSchema } from './tests-analysis.dto';

describe('TestAnalysisResultSchema', () => {
  const validAnalysisResult = {
    introduction:
      'По результатам теста виден устойчивый интерес к практическим задачам и постепенному развитию профессиональных навыков.',
    skillsLevel: {
      title: 'Текущий уровень базовых навыков',
      summary: 'Базовые навыки выражены неравномерно.',
      items: [
        {
          name: 'Коммуникация',
          level: 'medium',
          score: 67,
          description: 'Уверенно объясняет решения, но теряется в спорных ситуациях.',
        },
      ],
    },
    thinkingType: {
      title: 'Тип мышления',
      type: 'Аналитико-практический',
      description: 'Сначала ищет структуру, затем проверяет ее на практике.',
      strengths: ['структурность', 'проверка гипотез'],
    },
    personalityTraits: {
      title: 'Личностные особенности',
      traits: [
        {
          name: 'Самостоятельность',
          description: 'Готов брать ответственность за участок работы.',
          careerImpact: 'Подходит для ролей с высокой автономией.',
        },
      ],
    },
    careerDevelopment: {
      summary: 'Стоит развивать практические проекты и портфолио.',
      recommendedDirections: ['аналитика данных', 'продуктовая разработка'],
      developmentRecommendations: ['вести дневник решений', 'тренировать публичную защиту'],
      professionalNextSteps: ['собрать мини-проект', 'получить обратную связь наставника'],
    },
  };

  it('accepts the fixed formatted student analysis structure', () => {
    const result = TestAnalysisResultSchema.parse(validAnalysisResult);

    expect(result.introduction).toContain('практическим задачам');
    expect(result.skillsLevel.items[0]?.level).toBe('medium');
    expect(result.careerDevelopment.recommendedDirections).toContain('аналитика данных');
  });

  it('rejects analysis without an introduction', () => {
    const analysisWithoutIntroduction: Record<string, unknown> = { ...validAnalysisResult };
    delete analysisWithoutIntroduction.introduction;

    expect(() => TestAnalysisResultSchema.parse(analysisWithoutIntroduction)).toThrow();
  });

  it('rejects unknown skill levels', () => {
    expect(() =>
      TestAnalysisResultSchema.parse({
        ...validAnalysisResult,
        skillsLevel: {
          ...validAnalysisResult.skillsLevel,
          items: [
            {
              ...validAnalysisResult.skillsLevel.items[0],
              level: 'excellent',
            },
          ],
        },
      }),
    ).toThrow();
  });

  it('rejects overlong noisy trait lists', () => {
    expect(() =>
      TestAnalysisResultSchema.parse({
        ...validAnalysisResult,
        personalityTraits: {
          ...validAnalysisResult.personalityTraits,
          traits: Array.from({ length: 7 }, (_, index) => ({
            name: `Черта ${index + 1}`,
            description: 'Короткое описание текущего учебного проявления.',
            careerImpact: 'Влияет на выбор инженерных задач.',
          })),
        },
      }),
    ).toThrow();
  });

  it('exposes a strict OpenRouter json schema for structured outputs', () => {
    expect(TestAnalysisResultJsonSchema.name).toBe('student_test_analysis');
    expect(TestAnalysisResultJsonSchema.strict).toBe(true);
    expect(TestAnalysisResultJsonSchema.schema.required).toEqual([
      'introduction',
      'skillsLevel',
      'thinkingType',
      'personalityTraits',
      'careerDevelopment',
    ]);
    expect(
      TestAnalysisResultJsonSchema.schema.properties.personalityTraits.properties.traits.maxItems,
    ).toBe(6);
    expect(
      TestAnalysisResultJsonSchema.schema.properties.careerDevelopment.properties
        .professionalNextSteps.maxItems,
    ).toBe(3);
  });
});
