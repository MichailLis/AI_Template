import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicTestAnalysisProcessingScreen } from './public-test-analysis-processing-screen';

describe('PublicTestAnalysisProcessingScreen', () => {
  it('renders readable Russian analysis processing steps', () => {
    const expectedSteps = [
      'Готовим ответы к анализу',
      'Выделяем ключевые закономерности',
      'Собираем выводы о сильных сторонах',
      'Подбираем направления развития',
      'Профессор формулирует понятное пояснение',
    ];

    const { container } = render(<PublicTestAnalysisProcessingScreen startedAt={null} />);

    for (const step of expectedSteps) {
      expect(container.textContent).toContain(step);
    }
  });
});
