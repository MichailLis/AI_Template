import { Injectable } from '@nestjs/common';

import ExcelJS from 'exceljs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import pdfMake from 'pdfmake';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

import type { AdminTestAnalyticsSummaryDto } from './dto/tests-analytics.dto';

type MetricSection = Array<{ label: string; value: string | number }>;

type DemographyRow = [string, string, string];

const requireFromHere = createRequire(__filename);

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

const getPdfMakeFontPath = (candidate: string) =>
  path.join(
    path.dirname(requireFromHere.resolve('pdfmake/package.json')),
    'fonts',
    'Roboto',
    candidate,
  );

const getFontSource = (candidate: string) => {
  const fontPath = getPdfMakeFontPath(candidate);
  return fs.existsSync(fontPath) ? fs.realpathSync(fontPath) : undefined;
};

const getRealPath = (filePath: string) => fs.realpathSync(path.resolve(filePath));

const getPdfFonts = (): TFontDictionary => {
  const normal = getFontSource('Roboto-Regular.ttf');
  const bold = getFontSource('Roboto-Medium.ttf');
  const italics = getFontSource('Roboto-Italic.ttf');
  const bolditalics = getFontSource('Roboto-MediumItalic.ttf');

  if (!normal || !bold || !italics || !bolditalics) {
    throw new Error('Unable to resolve Roboto fonts from pdfmake package');
  }

  return {
    Roboto: {
      normal,
      bold,
      italics,
      bolditalics,
    },
  };
};

const toDemographyRows = (
  section: string,
  rows: Array<{ label: string; count: number; share: number }>,
): Array<DemographyRow> =>
  rows.map((row) => [section, `${row.label}: ${row.count}`, `${row.share}%`]);

@Injectable()
export class TestsAnalyticsExportService {
  private fontsConfigured = false;

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
    this.configureFonts();
    const definition = this.buildPdfDefinition(summary);
    return pdfMake.createPdf(definition).getBuffer();
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
    ]);

    addHeaderRow(sheet, [
      'Attempt ID',
      'Публичная ссылка',
      'Код',
      'Начало',
      'Завершение',
      'Статус',
      'Анализ',
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
      ]);
    }
  }

  private buildPdfDefinition(summary: AdminTestAnalyticsSummaryDto): TDocumentDefinitions {
    const directionRows = [
      ['ID', 'Название', 'Кол-во', 'Доля, %'],
      ...summary.directions.map((item) => [item.id, item.label, item.count, `${item.share}%`]),
    ];

    const pairRows = [
      ['Основная', 'Вспомогательная', 'Пара', 'Кол-во', 'Доля, %'],
      ...summary.directionPairs.map((item) => [
        item.primaryDirectionId,
        item.secondaryDirectionId,
        item.label,
        item.count,
        `${item.share}%`,
      ]),
    ];

    const profileRows = [
      ['Профиль', 'Кол-во', 'Доля, %'],
      ...summary.profiles.map((item) => [item.profileType, item.count, `${item.share}%`]),
    ];

    const publicLinksRows = [
      ['ID', 'Код', 'Тема', 'Попытки', 'Завершено', 'Анализ'],
      ...summary.publicLinks.map((item) => [
        item.publicLinkId,
        item.shortCode,
        item.title,
        item.attemptsTotal,
        item.attemptsCompleted,
        item.analysisReady,
      ]),
    ];

    const groupsRows = [
      ['Организация', 'Группа', 'Попытки', 'Завершено', 'Доля'],
      ...summary.groups.map((item) => [
        toDisplayValue(item.educationOrganization),
        toDisplayValue(item.groupOrClass),
        item.attemptsTotal,
        item.attemptsCompleted,
        `${item.share}%`,
      ]),
    ];

    const confidenceRows = [
      ['Ключ', 'Значение'],
      ['Gap', `${summary.confidence.gap.value}% (${summary.confidence.gap.total})`],
      [
        'Consistency Index',
        `${summary.confidence.consistencyIndex.value}% (${summary.confidence.consistencyIndex.total})`,
      ],
      [
        'Readiness Top',
        `${summary.confidence.readinessTop.value}% (${summary.confidence.readinessTop.total})`,
      ],
    ];

    const filters = [
      `scope: ${summary.filters.scope}`,
      `publicLinkId: ${toDisplayValue(summary.filters.publicLinkId)}`,
      `linkStatus: ${summary.filters.linkStatus}`,
      `dateFrom: ${toDisplayValue(summary.filters.dateFrom)}`,
      `dateTo: ${toDisplayValue(summary.filters.dateTo)}`,
    ];

    const coverageBody = [
      ['Метрика', 'Значение'],
      ['Публичные ссылки', summary.coverage.publicLinks],
      ['Попыток всего', summary.coverage.attemptsTotal],
      ['Попыток завершено', summary.coverage.attemptsCompleted],
      ['Анализ готов', summary.coverage.analysisReady],
      ['Анализ в процессе', summary.coverage.analysisPending],
      ['Ошибка анализа', summary.coverage.analysisFailed],
      ['Не оценено', summary.coverage.analysisMissing],
      ['Готовых v3', summary.coverage.v3Results],
    ];

    return {
      info: {
        title: summary.topic.title,
        subject: 'Сводный аналитический отчет',
        creator: 'AI Template',
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
      styles: {
        title: { fontSize: 18, bold: true },
        subtitle: { fontSize: 13, bold: true, margin: [0, 12, 0, 5] },
        small: { fontSize: 9, color: '#666666' },
      },
      content: [
        { text: summary.topic.title, style: 'title' },
        { text: `Сформировано: ${summary.topic.generatedAt}`, style: 'small' },
        { text: 'Параметры отчета', style: 'subtitle' },
        { ul: filters, style: 'small' },
        { text: 'Покрытие', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: coverageBody,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Направления', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: directionRows,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Пары направлений', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto'],
            body: pairRows,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Профили', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: profileRows,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Уверенность', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: confidenceRows,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Публичные ссылки', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
            body: publicLinksRows,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Группы', style: 'subtitle' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto', 'auto', 'auto'],
            body: groupsRows,
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'Методология', style: 'subtitle' },
        {
          text: 'Отчет сформирован на основе агрегированных данных по результатам диагностического анализа методики prof-orientation-v3-plus.',
          style: 'small',
        },
      ],
      pageMargins: [36, 36, 36, 36],
      pageSize: 'A4',
    };
  }

  private configureFonts(): void {
    if (this.fontsConfigured) {
      return;
    }

    const fonts = getPdfFonts();
    const allowedFontPaths = new Set(
      Object.values(fonts.Roboto).map((filePath) => getRealPath(String(filePath))),
    );

    pdfMake.setFonts(fonts);
    pdfMake.setUrlAccessPolicy(() => false);
    pdfMake.setLocalAccessPolicy((filePath) => allowedFontPaths.has(getRealPath(filePath)));
    this.fontsConfigured = true;
  }
}
