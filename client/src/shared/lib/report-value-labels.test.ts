import { describe, expect, it } from 'vitest';

import {
  getConfidenceLevelLabel,
  getQuestionTypeLabel,
  getReportValueLabel,
  getVersionStatusLabel,
} from './report-value-labels';

/**
 * Находка аудита UX-06: в админке стояли сырые PUBLISHED, SINGLE_CHOICE, MALE и broad. Словарь
 * переводит известные значения, а незнакомое показывает как есть, чтобы новое значение сервера
 * не превратилось в пустую ячейку.
 */
describe('report value labels', () => {
  it('names version statuses and question types', () => {
    expect(getVersionStatusLabel('PUBLISHED')).toBe('Опубликована');
    expect(getVersionStatusLabel('DRAFT')).toBe('Черновик');
    expect(getVersionStatusLabel('ARCHIVED')).toBe('В архиве');
    expect(getQuestionTypeLabel('MULTI_CHOICE')).toBe('Несколько вариантов');
    expect(getQuestionTypeLabel('SLIDER')).toBe('Слайдер');
  });

  it('names confidence levels of the v3+ result', () => {
    expect(getConfidenceLevelLabel('high')).toBe('Высокая');
    expect(getConfidenceLevelLabel('broad')).toBe('Широкий профиль');
  });

  it('translates demographic values and keeps free text such as a residence', () => {
    expect(getReportValueLabel('MALE')).toBe('Мужской');
    expect(getReportValueLabel('HIGHER')).toBe('Высшее');
    expect(getReportValueLabel('Казань')).toBe('Казань');
  });

  it('shows an unknown value as it is', () => {
    expect(getVersionStatusLabel('SCHEDULED')).toBe('SCHEDULED');
    expect(getConfidenceLevelLabel('extreme')).toBe('extreme');
  });
});
