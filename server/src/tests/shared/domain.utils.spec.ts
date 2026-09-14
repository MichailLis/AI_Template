import { BadRequestException } from '@nestjs/common';

import { prepareQuestionPayload, validateDraftForPublish } from '../shared/domain.utils';

describe('tests domain utils', () => {
  it('rejects slider bands with equal min and max values on question upsert', () => {
    expect(() =>
      prepareQuestionPayload({
        type: 'SLIDER',
        title: 'Slider question',
        required: true,
        settings: { min: 0, max: 10, step: 1 },
        sliderBands: [{ minValue: 0, maxValue: 0, label: 'Zero range', weight: 0 }],
      }),
    ).toThrow(BadRequestException);
  });

  /**
   * ait-rcw.30: промпт, подключенный только к черновику, разрешено удалить. Если потом черновик
   * опубликовать, фоновый анализ продолжит работать на «удаленном» промпте, поэтому публикация
   * такого черновика запрещена.
   */
  it('rejects a draft whose analysis prompt has been deleted', () => {
    const validQuestion = {
      type: 'SINGLE_CHOICE' as const,
      title: 'Что вам ближе?',
      order: 1,
      settings: null,
      options: [{ id: 1 }, { id: 2 }],
      sliderBands: [],
    };

    expect(() =>
      validateDraftForPublish({
        questions: [validQuestion],
        analysisPromptVersion: {
          analysisPrompt: { title: 'Профориентация', archivedAt: new Date('2026-09-12T00:00:00Z') },
        },
      }),
    ).toThrow(
      'Промпт анализа «Профориентация» удален. Подключите другой промпт перед публикацией.',
    );

    expect(() =>
      validateDraftForPublish({
        questions: [validQuestion],
        analysisPromptVersion: { analysisPrompt: { title: 'Профориентация', archivedAt: null } },
      }),
    ).not.toThrow();
  });

  it('rejects slider bands with equal min and max values before publish', () => {
    expect(() =>
      validateDraftForPublish({
        questions: [
          {
            type: 'SLIDER',
            title: 'Slider question',
            order: 1,
            settings: { min: 0, max: 10, step: 1 },
            options: [],
            sliderBands: [{ minValue: 0, maxValue: 0 }],
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects overlapping slider bands on question upsert', () => {
    expect(() =>
      prepareQuestionPayload({
        type: 'SLIDER',
        title: 'Overlapping slider',
        required: true,
        settings: { min: 0, max: 10, step: 1 },
        sliderBands: [
          { minValue: 0, maxValue: 5, label: 'Низко', weight: 3 },
          { minValue: 3, maxValue: 10, label: 'Высоко', weight: 1 },
        ],
      }),
    ).toThrow('Slider bands must not overlap: [0..5] and [3..10]');
  });

  it('rejects overlapping slider bands before publish', () => {
    expect(() =>
      validateDraftForPublish({
        questions: [
          {
            type: 'SLIDER',
            title: 'Overlapping slider',
            order: 1,
            settings: { min: 0, max: 10, step: 1 },
            options: [],
            sliderBands: [
              { minValue: 0, maxValue: 5 },
              { minValue: 3, maxValue: 10 },
            ],
          },
        ],
      }),
    ).toThrow(
      'Slider question "Overlapping slider" has overlapping score ranges: [0..5] and [3..10]',
    );
  });
});
