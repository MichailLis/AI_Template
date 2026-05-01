import type {
  AnalysisProcessingStep,
  PublicTestAnalysisReportViewModel,
} from './public-test-analysis.types';

export const analysisProcessingSteps: AnalysisProcessingStep[] = [
  { id: 'init', text: 'Инициализируем модуль интерпретации ответов...' },
  { id: 'normalize', text: 'Нормализуем и валидируем данные сессии...' },
  { id: 'patterns', text: 'Выявляем устойчивые поведенческие паттерны...' },
  { id: 'match', text: 'Сопоставляем профиль с карьерными траекториями...' },
  { id: 'report', text: 'Формируем персональный итоговый отчет...' },
];

export const mockAnalysisReport: PublicTestAnalysisReportViewModel = {
  archetypeTitle: 'Стратегический исследователь',
  archetypeDescription:
    'Вы совмещаете аналитический подход, структурность и интерес к практическому результату. Такой профиль хорошо чувствует себя в ролях на стыке данных, продукта и коммуникации.',
  completionRate: 88,
  answeredQuestionsCount: 22,
  totalQuestionsCount: 25,
  note: 'Черновая визуализация отчета. Модель данных подготовлена для замены на реальный структурированный summary.',
  narrative:
    'Вы склонны к системному мышлению и взвешенным решениям. При этом у вас выражена способность переводить сложные выводы в понятные шаги и практические действия.',
  professions: [
    {
      rank: 1,
      title: 'Product Analyst',
      matchScore: 92,
      salary: '120 000 - 220 000 руб.',
      growth: '+18% спроса',
      description:
        'Роль для специалистов, которые умеют находить закономерности в данных и влиять на продуктовые решения.',
    },
    {
      rank: 2,
      title: 'UX Researcher',
      matchScore: 87,
      salary: '110 000 - 200 000 руб.',
      growth: '+16% спроса',
      description:
        'Подходит при интересе к поведению пользователей, гипотезам и исследовательскому циклу.',
    },
    {
      rank: 3,
      title: 'Project Coordinator',
      matchScore: 81,
      salary: '90 000 - 170 000 руб.',
      growth: '+14% спроса',
      description:
        'Хороший вектор для сильной организационной компоненты и работы с межфункциональными командами.',
    },
  ],
  traitScores: [
    { key: 'analytical', label: 'Аналитика', value: 86, maxValue: 100 },
    { key: 'communication', label: 'Коммуникация', value: 74, maxValue: 100 },
    { key: 'leadership', label: 'Лидерство', value: 68, maxValue: 100 },
    { key: 'adaptability', label: 'Адаптивность', value: 79, maxValue: 100 },
    { key: 'focus', label: 'Концентрация', value: 82, maxValue: 100 },
  ],
  actionPlan: [
    {
      id: 'step-1',
      title: 'Уточнить целевое направление',
      description: 'Выберите 1-2 роли для фокуса и зафиксируйте критерии выбора вакансий.',
      timeframe: '1-2 недели',
    },
    {
      id: 'step-2',
      title: 'Закрыть ключевой skill-gap',
      description: 'Добавьте один прикладной проект в портфолио с измеримым результатом.',
      timeframe: '1-2 месяца',
    },
    {
      id: 'step-3',
      title: 'Проверить гипотезу на рынке',
      description: 'Проведите 5-7 интервью и откликов по выбранному треку.',
      timeframe: '2-3 месяца',
    },
  ],
  hasMockContent: true,
};
