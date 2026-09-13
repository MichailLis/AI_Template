import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = 'C:/Users/admin/Documents/WebAI/AI_Template/outputs/vladivostok-budget-019f7707';
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add('Бюджет поездки');
sheet.showGridLines = false;

sheet.getRange('A1:F1').merge();
sheet.getRange('A1').values = [['Бюджет поездки во Владивосток и обратно']];
sheet.getRange('A2:F2').merge();
sheet.getRange('A2').values = [['Стартовая смета: билеты и жильё. Жёлтые ячейки можно дополнять.']];

sheet.getRange('A4').values = [['Расходы без залога']];
sheet.getRange('B4').formulas = [['=SUM(E9:E24)']];
sheet.getRange('C4').values = [['Денежный отток']];
sheet.getRange('D4').formulas = [['=SUM(C9:C24)']];
sheet.getRange('A5').values = [['Возвратный залог']];
sheet.getRange('B5').formulas = [['=SUM(D9:D24)']];
sheet.getRange('C5').values = [['Транспорт']];
sheet.getRange('D5').formulas = [['=SUM(E9:E14)']];
sheet.getRange('E4').values = [['Жильё без залога']];
sheet.getRange('F4').formulas = [['=SUM(E15:E16)']];
sheet.getRange('E5').values = [['Разница']];
sheet.getRange('F5').formulas = [['=D4-B4']];

sheet.getRange('A8:F8').values = [
  ['Категория', 'Статья', 'Сумма, ₽', 'Вернётся, ₽', 'Итоговый расход, ₽', 'Примечание'],
];

sheet.getRange('A9:D16').values = [
  ['Поезд', 'Билет 1', 10780.8, 0],
  ['Поезд', 'Билет 2', 10780.8, 0],
  ['Поезд', 'Билет 3', 10780.8, 0],
  ['Поезд', 'Билет 4', 7999.6, 0],
  ['Самолёт', 'Перелёт 1', 73358, 0],
  ['Самолёт', 'Перелёт 2', 74718, 0],
  ['Жильё', 'Проживание', 36000, 0],
  ['Жильё', 'Возвратный залог', 5000, 5000],
];
sheet.getRange('F9:F16').values = [
  ['Куплено'],
  ['Куплено'],
  ['Куплено'],
  ['Куплено'],
  ['Указанная сумма'],
  ['Указанная сумма'],
  ['Указанная сумма'],
  ['Не считается расходом после возврата'],
];

sheet.getRange('E9').formulas = [['=C9-D9']];
sheet.getRange('E9:E24').fillDown();

sheet.getRange('A25:D25').values = [['ИТОГО', null, null, null]];
sheet.getRange('C25').formulas = [['=SUM(C9:C24)']];
sheet.getRange('D25').formulas = [['=SUM(D9:D24)']];
sheet.getRange('E25').formulas = [['=SUM(E9:E24)']];
sheet.getRange('F25').values = [
  ['Залог включён в денежный отток, но исключён из итогового расхода'],
];

sheet.getRange('A1:F1').format = {
  fill: '#12304A',
  font: { bold: true, color: '#FFFFFF', size: 18 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
};
sheet.getRange('A1:F1').format.rowHeight = 34;
sheet.getRange('A2:F2').format = {
  fill: '#EAF1F6',
  font: { color: '#3E5568', italic: true, size: 10 },
  verticalAlignment: 'center',
};
sheet.getRange('A2:F2').format.rowHeight = 26;

sheet.getRange('A4:F5').format = {
  fill: '#F3F7FA',
  borders: { preset: 'outside', style: 'thin', color: '#AFC0CC' },
  verticalAlignment: 'center',
};
sheet.getRange('A4:F5').format.rowHeight = 28;
sheet.getRange('A4:A5').format.font = { bold: true, color: '#26465E' };
sheet.getRange('C4:C5').format.font = { bold: true, color: '#26465E' };
sheet.getRange('E4:E5').format.font = { bold: true, color: '#26465E' };
sheet.getRange('B4:B5').format = {
  fill: '#DDF3E4',
  font: { bold: true, color: '#14532D', size: 12 },
};
sheet.getRange('D4:D5').format = {
  fill: '#DDECF7',
  font: { bold: true, color: '#123B56', size: 12 },
};
sheet.getRange('F4:F5').format = {
  fill: '#FFF3CF',
  font: { bold: true, color: '#694C00', size: 12 },
};

sheet.getRange('A8:F8').format = {
  fill: '#1F5A7A',
  font: { bold: true, color: '#FFFFFF' },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  wrapText: true,
  borders: { preset: 'outside', style: 'thin', color: '#18445C' },
};
sheet.getRange('A8:F8').format.rowHeight = 30;

sheet.getRange('A9:F24').format = {
  borders: { insideHorizontal: { style: 'thin', color: '#DCE5EA' } },
  verticalAlignment: 'center',
};
sheet.getRange('A9:D24').format.fill = '#FFF9DF';
sheet.getRange('E9:E24').format.fill = '#F0F5F8';
sheet.getRange('F9:F24').format.fill = '#FFFFFF';
sheet.getRange('A9:F24').format.rowHeight = 23;
sheet.getRange('F9:F25').format.wrapText = true;

sheet.getRange('A25:F25').format = {
  fill: '#12304A',
  font: { bold: true, color: '#FFFFFF' },
  borders: { preset: 'doubleBottom', style: 'medium', color: '#12304A' },
  verticalAlignment: 'center',
};
sheet.getRange('A25:F25').format.rowHeight = 30;

sheet.getRange('B4:B5').format.numberFormat = '#,##0.00 "₽"';
sheet.getRange('D4:D5').format.numberFormat = '#,##0.00 "₽"';
sheet.getRange('F4:F5').format.numberFormat = '#,##0.00 "₽"';
sheet.getRange('C9:E25').format.numberFormat = '#,##0.00 "₽"';
sheet.getRange('C9:E25').format.horizontalAlignment = 'right';

sheet.getRange('A1:F25').format.font.name = 'Aptos';
sheet.getRange('A:A').format.columnWidth = 15;
sheet.getRange('B:B').format.columnWidth = 24;
sheet.getRange('C:E').format.columnWidth = 18;
sheet.getRange('F:F').format.columnWidth = 42;
sheet.freezePanes.freezeRows(8);

const check = await workbook.inspect({
  kind: 'table',
  range: 'Бюджет поездки!A1:F25',
  include: 'values,formulas',
  tableMaxRows: 30,
  tableMaxCols: 8,
});
console.log('INSPECT\n' + check.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
});
console.log('ERRORS\n' + errors.ndjson);

const preview = await workbook.render({
  sheetName: 'Бюджет поездки',
  range: 'A1:F25',
  scale: 1.5,
  format: 'png',
});
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/budget_vladivostok.xlsx`);

console.log(`OUTPUT ${outputDir}/budget_vladivostok.xlsx`);
