import { Injectable } from '@nestjs/common';

import ExcelJS from 'exceljs';

import {
  getReportAttemptStatusLabel,
  getReportLlmStatusLabel,
  getReportValueLabel,
} from '../reporting/analytics-report-labels';

export interface AttemptExportRow {
  attemptId: number;
  attemptNumber: number;
  status: string;
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: string | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  llmStatus: string | null;
  analysisResultKind: string;
  resultSummary: { primaryDirectionLabel: string | null; profileTitle: string | null } | null;
}

/**
 * Подписи совпадают с таблицей прохождений в админке (`analysis-result-kind-labels.ts`): файл
 * сверяют с экраном. Gate `paired-rules` сверяет только скалярные константы, поэтому при правке
 * подписей на клиенте эту карту нужно обновить вручную.
 */
const exportAnalysisKindLabels: Record<string, string> = {
  AI: 'ИИ-анализ готов',
  ALGORITHM_AI_PENDING: 'Алгоритм готов, ИИ считается',
  ALGORITHM_ONLY: 'Только алгоритм, ИИ не отработал',
  STUB: 'Заглушка, промпт не подключен',
  PENDING: 'В очереди',
  FAILED: 'Ошибка анализа',
  MISSING: 'Нет анализа',
};

const COLUMNS: ReadonlyArray<{ header: string; width: number }> = [
  { header: 'ID попытки', width: 12 },
  { header: 'Попытка №', width: 11 },
  { header: 'Статус', width: 14 },
  { header: 'Имя', width: 26 },
  { header: 'Инициалы', width: 11 },
  { header: 'Учебное заведение', width: 30 },
  { header: 'Группа / класс', width: 16 },
  { header: 'Пол', width: 11 },
  { header: 'Возраст', width: 9 },
  { header: 'Город', width: 20 },
  { header: 'Образование', width: 22 },
  { header: 'Начало', width: 18 },
  { header: 'Завершение', width: 18 },
  { header: 'Время, сек', width: 12 },
  { header: 'Время', width: 14 },
  { header: 'Ведущее направление', width: 30 },
  { header: 'Профиль', width: 30 },
  { header: 'Анализ', width: 30 },
  { header: 'ИИ', width: 18 },
];

const DATE_TIME_FORMAT = 'dd.mm.yyyy hh:mm';
const START_COLUMN = 12;
const FINISH_COLUMN = 13;

const toText = (value: string | null | undefined) => value ?? '';

export const formatExportDuration = (seconds: number | null): string => {
  if (seconds === null) {
    return '';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, '0')} мин`;
  }

  if (minutes > 0) {
    return `${minutes} мин ${String(rest).padStart(2, '0')} с`;
  }

  return `${rest} с`;
};

/**
 * Значения, которые Excel может принять за формулу, получают апостроф-префикс: имя и город вводит
 * сам студент на публичной странице, а ячейка вида `=HYPERLINK(...)` в файле администратора была
 * бы исполнимой.
 */
export const neutralizeFormula = (value: string): string =>
  /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;

const toInitials = (row: AttemptExportRow) =>
  row.studentLastInitial && row.studentMiddleInitial
    ? `${row.studentLastInitial}.${row.studentMiddleInitial}.`
    : '';

const toRowValues = (row: AttemptExportRow): Array<string | number | Date> => [
  row.attemptId,
  row.attemptNumber,
  getReportAttemptStatusLabel(row.status),
  neutralizeFormula(toText(row.studentName)),
  toInitials(row),
  neutralizeFormula(toText(row.educationOrganization)),
  neutralizeFormula(toText(row.groupOrClass)),
  row.studentGender ? getReportValueLabel(row.studentGender) : '',
  row.studentAge ?? '',
  neutralizeFormula(toText(row.studentResidence)),
  row.studentEducationLevel ? getReportValueLabel(row.studentEducationLevel) : '',
  new Date(row.startedAt),
  row.finishedAt ? new Date(row.finishedAt) : '',
  row.durationSeconds ?? '',
  formatExportDuration(row.durationSeconds),
  toText(row.resultSummary?.primaryDirectionLabel),
  toText(row.resultSummary?.profileTitle),
  exportAnalysisKindLabels[row.analysisResultKind] ?? row.analysisResultKind,
  row.llmStatus ? getReportLlmStatusLabel(row.llmStatus) : '',
];

@Injectable()
export class TestsAttemptsExportService {
  async toExcel(rows: AttemptExportRow[], title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'AI Template';
    workbook.lastModifiedBy = 'AI Template';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.title = title;

    const sheet = workbook.addWorksheet('Прохождения');
    sheet.columns = COLUMNS.map((column, index) => ({
      key: `column${index}`,
      width: column.width,
    }));

    const header = sheet.addRow(COLUMNS.map((column) => column.header));
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      cell.alignment = { vertical: 'middle' };
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    for (const row of rows) {
      const added = sheet.addRow(toRowValues(row));
      added.getCell(START_COLUMN).numFmt = DATE_TIME_FORMAT;
      added.getCell(FINISH_COLUMN).numFmt = DATE_TIME_FORMAT;
    }

    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }
}
