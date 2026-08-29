import type { AnalysisProcessingStep } from './public-test-analysis.types';

/** Copy shown to the student while the analysis is being produced. */
export const analysisProcessingSteps: AnalysisProcessingStep[] = [
  { id: 'prepare', text: 'Готовим ответы к анализу' },
  { id: 'patterns', text: 'Выделяем ключевые закономерности' },
  { id: 'strengths', text: 'Собираем выводы о сильных сторонах' },
  { id: 'directions', text: 'Подбираем направления развития' },
  { id: 'report', text: 'Профессор формулирует понятное пояснение' },
];
