export type BrandingPreviewState = 'start' | 'question' | 'result';

export const brandingPreviewStates: Array<{
  id: BrandingPreviewState;
  label: string;
}> = [
  { id: 'start', label: 'Старт' },
  { id: 'question', label: 'Вопрос' },
  { id: 'result', label: 'Результат' },
];

export const brandingPreviewQuestion = {
  title: 'Какой тип задач вам ближе?',
  options: ['Исследовать и сравнивать варианты', 'Собирать прототипы', 'Объяснять идеи команде'],
};
