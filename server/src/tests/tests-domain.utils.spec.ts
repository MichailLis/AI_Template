import { BadRequestException } from '@nestjs/common';

import { prepareQuestionPayload, validateDraftForPublish } from './tests-domain.utils';

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
});
