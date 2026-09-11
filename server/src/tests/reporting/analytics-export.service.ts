import { Injectable } from '@nestjs/common';

import ExcelJS from 'exceljs';

import type { AdminTestAnalyticsSummaryDto } from '../dto/tests-analytics.dto';
import { TestsAnalyticsPdfRendererService } from '../reporting/analytics-pdf-renderer.service';

type MetricSection = Array<{ label: string; value: string | number }>;

type DemographyRow = [string, string, string];

const COVER_SHEET = {
  name: 'Сводка',
  columns: [
    { header: 'Параметр', width: 40 },
    { header: 'Значение', width: 50 },
    { header: 'Комментарий', width: 35 },
  ],
};

const toDisplayValue = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '—' : String(value);

const addHeaderRow = (sheet: ExcelJS.Worksheet, values: string[]) => {
  const row = sheet.addRow(values);
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    };
    cell.alignment = { vertical: 'middle' };
  });
};

const addSection = (sheet: ExcelJS.Worksheet, title: string) => {
  const row = sheet.addRow([title]);
  row.font = { bold: true, size: 12 };
};

const addMetricRows = (sheet: ExcelJS.Worksheet, rows: MetricSection) => {
  for (const item of rows) {
    sheet.addRow([item.label, item.value, '']);
  }
};

const createSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  columns: ReadonlyArray<{ header: string; width: number }>,
) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map((item, index) => ({
    key: `column${index}`,
    width: item.width,
  }));
  return sheet;
};

const toCoverageRows = (summary: AdminTestAnalyticsSummaryDto): MetricSection => [
  { label: 'Публичные ссылки', value: summary.coverage.publicLinks },
  { label: 'Попыток всего', value: summary.coverage.attemptsTotal },
  { label: 'Попыток завершено', value: summary.coverage.attemptsCompleted },
  { label: 'Анализ готов', value: summary.coverage.analysisReady },
  { label: 'Анализ в обработке', value: summary.coverage.analysisPending },
  { label: 'Ошибка анализа', value: summary.coverage.analysisFailed },
  { label: 'Не оценено', value: summary.coverage.analysisMissing },
  { label: 'Готовых v3 результатов', value: summary.coverage.v3Results },
];

const toFilterRows = (summary: AdminTestAnalyticsSummaryDto): MetricSection => [
  { label: 'scope', value: summary.filters.scope },
  { label: 'publicLinkId', value: toDisplayValue(summary.filters.publicLinkId) },
  { label: 'linkStatus', value: summary.filters.linkStatus },
  { label: 'dateFrom', value: toDisplayValue(summary.filters.dateFrom) },
  { label: 'dateTo', value: toDisplayValue(summary.filters.dateTo) },
];

const toDemographyRows = (
  section: string,
  rows: Array<{ label: string; count: number; share: number }>,
): Array<DemographyRow> =>
  rows.map((row) => [section, `${row.label}: ${row.count}`, `${row.share}%`]);

@Injectable()
export class TestsAnalyticsExportService {
  constructor(private readonly pdfRenderer: TestsAnalyticsPdfRendererService) {}

  async toExcel(summary: AdminTestAnalyticsSummaryDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'AI Template';
    workbook.lastModifiedBy = 'AI Template';
    workbook.created = new Date();
    workbook.modified = new Date();

    this.writeSummarySheet(workbook, summary);
    this.writeDirectionsSheet(workbook, summary);
    this.writeDirectionPairsSheet(workbook, summary);
    this.writePublicLinksSheet(workbook, summary);
    this.writeGroupsSheet(workbook, summary);
    this.writeDemographySheet(workbook, summary);
    this.writeAttemptsSheet(workbook, summary);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  async toPdf(summary: AdminTestAnalyticsSummaryDto): Promise<Buffer> {
    return this.pdfRenderer.render(summary);
  }

  private writeSummarySheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, COVER_SHEET.name, COVER_SHEET.columns);

    addSection(sheet, 'Сводка');
    sheet.addRow([]);
    addHeaderRow(sheet, ['Ключевая информация', 'Значение', 'Комментарий']);
    addMetricRows(sheet, [
      { label: 'Тема', value: summary.topic.title },
      { label: 'Слаг', value: summary.topic.slug },
      { label: 'Количество вопросов', value: summary.topic.questionCount },
      { label: 'Сформировано', value: summary.topic.generatedAt },
    ]);

    sheet.addRow([]);
    addSection(sheet, 'Покрытие');
    addHeaderRow(sheet, ['Метрика', 'Значение', 'Комментарий']);
    addMetricRows(sheet, toCoverageRows(summary));

    sheet.addRow([]);
    addSection(sheet, 'Фильтры');
    addHeaderRow(sheet, ['Параметр', 'Значение', 'Комментарий']);
    addMetricRows(sheet, toFilterRows(summary));
  }

  private writeDirectionsSheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, 'Направления', [
      { header: 'ID', width: 20 },
      { header: 'Название', width: 45 },
      { header: 'Кол-во', width: 12 },
      { header: 'Доля, %', width: 12 },
    ]);

    addHeaderRow(sheet, ['ID', 'Название', 'Кол-во', 'Доля, %']);
    for (const row of summary.directions) {
      sheet.addRow([row.id, row.label, row.count, row.share]);
    }
  }

  private writeDirectionPairsSheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, 'Пары направлений', [
      { header: 'ID 1', width: 20 },
      { header: 'ID 2', width: 20 },
      { header: 'Пара', width: 60 },
      { header: 'Кол-во', width: 12 },
      { header: 'Доля, %', width: 12 },
    ]);

    addHeaderRow(sheet, ['ID 1', 'ID 2', 'Пара', 'Кол-во', 'Доля, %']);
    for (const row of summary.directionPairs) {
      sheet.addRow([
        row.primaryDirectionId,
        row.secondaryDirectionId,
        row.label,
        row.count,
        row.share,
      ]);
    }
  }

  private writePublicLinksSheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, 'Публичные ссылки', [
      { header: 'ID', width: 10 },
      { header: 'Код', width: 14 },
      { header: 'Тема', width: 42 },
      { header: 'Архив', width: 10 },
      { header: 'Попытки', width: 10 },
      { header: 'Завершено', width: 12 },
      { header: 'Анализ готов', width: 12 },
      { header: 'Доля, %', width: 10 },
    ]);

    addHeaderRow(sheet, [
      'ID',
      'Код',
      'Тема',
      'Архив',
      'Попытки',
      'Завершено',
      'Анализ готов',
      'Доля, %',
    ]);
    for (const row of summary.publicLinks) {
      sheet.addRow([
        row.publicLinkId,
        row.shortCode,
        row.title,
        toDisplayValue(row.archivedAt),
        row.attemptsTotal,
        row.attemptsCompleted,
        row.analysisReady,
        row.share,
      ]);
    }
  }

  private writeGroupsSheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, 'Группы', [
      { header: 'Организация', width: 38 },
      { header: 'Группа', width: 30 },
      { header: 'Попытки', width: 10 },
      { header: 'Завершено', width: 10 },
      { header: 'Доля, %', width: 10 },
    ]);

    addHeaderRow(sheet, ['Организация', 'Группа', 'Попытки', 'Завершено', 'Доля, %']);
    for (const row of summary.groups) {
      sheet.addRow([
        toDisplayValue(row.educationOrganization),
        toDisplayValue(row.groupOrClass),
        row.attemptsTotal,
        row.attemptsCompleted,
        row.share,
      ]);
    }
  }

  private writeDemographySheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, 'Демография', [
      { header: 'Раздел', width: 30 },
      { header: 'Значение', width: 38 },
      { header: 'Доля, %', width: 12 },
    ]);

    addHeaderRow(sheet, ['Раздел', 'Значение', 'Доля, %']);
    const rows: Array<DemographyRow> = [
      ...toDemographyRows('Пол', summary.demographics.gender),
      ...toDemographyRows('Возраст', summary.demographics.ageRange),
      ...toDemographyRows('Место жительства', summary.demographics.residence),
      ...toDemographyRows('Образование', summary.demographics.educationLevel),
    ];

    for (const row of rows) {
      sheet.addRow(row);
    }

    if (rows.length === 0) {
      sheet.addRow(['Нет данных', '', '']);
    }
  }

  private writeAttemptsSheet(
    workbook: ExcelJS.Workbook,
    summary: AdminTestAnalyticsSummaryDto,
  ): void {
    const sheet = createSheet(workbook, 'Прохождения', [
      { header: 'Attempt ID', width: 12 },
      { header: 'Публичная ссылка', width: 20 },
      { header: 'Код', width: 12 },
      { header: 'Начало', width: 28 },
      { header: 'Завершение', width: 28 },
      { header: 'Статус', width: 14 },
      { header: 'Анализ', width: 12 },
      { header: 'Статус ИИ', width: 14 },
    ]);

    addHeaderRow(sheet, [
      'Attempt ID',
      'Публичная ссылка',
      'Код',
      'Начало',
      'Завершение',
      'Статус',
      'Анализ',
      'Статус ИИ',
    ]);

    for (const row of summary.attempts) {
      sheet.addRow([
        row.attemptId,
        row.publicLinkId,
        row.shortCode,
        row.startedAt,
        toDisplayValue(row.finishedAt),
        row.status,
        toDisplayValue(row.analysisStatus),
        toDisplayValue(row.llmStatus),
      ]);
    }
  }
}
