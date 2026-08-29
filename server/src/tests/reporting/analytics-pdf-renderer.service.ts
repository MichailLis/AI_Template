import { Injectable } from '@nestjs/common';

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import pdfMake from 'pdfmake';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

import type { AdminTestAnalyticsSummaryDto } from '../dto/tests-analytics.dto';

const requireFromHere = createRequire(__filename);

const toDisplayValue = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '—' : String(value);

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

@Injectable()
export class TestsAnalyticsPdfRendererService {
  private fontsConfigured = false;

  async render(summary: AdminTestAnalyticsSummaryDto): Promise<Buffer> {
    this.configureFonts();
    const definition = this.buildDefinition(summary);
    return pdfMake.createPdf(definition).getBuffer();
  }

  private buildDefinition(summary: AdminTestAnalyticsSummaryDto): TDocumentDefinitions {
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
      ...summary.profiles.map((item) => [item.label, item.count, `${item.share}%`]),
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
