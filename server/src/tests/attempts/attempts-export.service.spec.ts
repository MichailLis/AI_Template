import ExcelJS from 'exceljs';

import { ATTEMPTS_EXPORT_LIMIT } from './admin-attempt.service';
import {
  formatExportDuration,
  TestsAttemptsExportService,
  type AttemptExportRow,
} from './attempts-export.service';

const buildRow = (overrides: Partial<AttemptExportRow> = {}): AttemptExportRow => ({
  attemptId: 361,
  attemptNumber: 1,
  status: 'COMPLETED',
  studentName: 'Анна Тестова',
  studentLastInitial: 'Т',
  studentMiddleInitial: 'А',
  educationOrganization: 'Школа 1',
  groupOrClass: '10А',
  studentGender: 'FEMALE',
  studentAge: 16,
  studentResidence: 'Москва',
  studentEducationLevel: 'SECONDARY_GENERAL',
  startedAt: '2026-10-08T03:57:00.000Z',
  finishedAt: '2026-10-08T04:04:06.000Z',
  durationSeconds: 426,
  llmStatus: 'ready',
  analysisResultKind: 'AI',
  resultSummary: { primaryDirectionLabel: '3D-моделирование', profileTitle: 'Широкий профиль' },
  ...overrides,
});

const readSheet = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.getWorksheet('Прохождения');

  if (!sheet) {
    throw new Error('sheet is missing');
  }

  return sheet;
};

describe('formatExportDuration', () => {
  it('writes seconds, minutes and hours', () => {
    expect(formatExportDuration(45)).toBe('45 с');
    expect(formatExportDuration(426)).toBe('7 мин 06 с');
    expect(formatExportDuration(3720)).toBe('1 ч 02 мин');
    expect(formatExportDuration(null)).toBe('');
  });
});

describe('TestsAttemptsExportService', () => {
  const service = new TestsAttemptsExportService();

  it('writes a header, one row per attempt and readable labels', async () => {
    const sheet = await readSheet(await service.toExcel([buildRow()], 'ABC123'));

    expect(sheet.rowCount).toBe(2);
    expect(sheet.getRow(1).getCell(3).value).toBe('Статус');

    const row = sheet.getRow(2);
    expect(row.getCell(1).value).toBe(361);
    expect(row.getCell(3).value).toBe('Пройдено');
    expect(row.getCell(4).value).toBe('Анна Тестова');
    expect(row.getCell(5).value).toBe('Т.А.');
    expect(row.getCell(8).value).toBe('Женский');
    expect(row.getCell(14).value).toBe(426);
    expect(row.getCell(15).value).toBe('7 мин 06 с');
    expect(row.getCell(16).value).toBe('3D-моделирование');
    expect(row.getCell(18).value).toBe('ИИ-анализ готов');
    expect(row.getCell(19).value).toBe('ИИ готов');
  });

  it('writes start and finish in the client time zone', async () => {
    const sheet = await readSheet(await service.toExcel([buildRow()], 'ABC123', 'Europe/Moscow'));
    const row = sheet.getRow(2);

    // 03:57 UTC — это 06:57 в Москве; Excel показывает записанные часы как есть
    expect((row.getCell(12).value as Date).toISOString()).toBe('2026-10-08T06:57:00.000Z');
    expect((row.getCell(13).value as Date).toISOString()).toBe('2026-10-08T07:04:06.000Z');
  });

  it('leaves the finish, time and result empty for an open attempt', async () => {
    const sheet = await readSheet(
      await service.toExcel(
        [
          buildRow({
            status: 'IN_PROGRESS',
            finishedAt: null,
            durationSeconds: null,
            llmStatus: null,
            analysisResultKind: 'MISSING',
            resultSummary: null,
          }),
        ],
        'ABC123',
      ),
    );
    const row = sheet.getRow(2);

    expect(row.getCell(3).value).toBe('В процессе');
    expect(row.getCell(13).value ?? '').toBe('');
    expect(row.getCell(14).value ?? '').toBe('');
    expect(row.getCell(16).value ?? '').toBe('');
    expect(row.getCell(18).value).toBe('Нет анализа');
  });

  it('adds the cut-off note below the table only when the export was truncated', async () => {
    const note = `Выгружены первые ${ATTEMPTS_EXPORT_LIMIT} прохождений. Сузьте фильтр, чтобы выгрузить остальные.`;
    const full = await readSheet(await service.toExcel([buildRow()], 'ABC123'));
    const cut = await readSheet(await service.toExcel([buildRow()], 'ABC123', undefined, true));

    expect(full.rowCount).toBe(2);
    expect(cut.rowCount).toBe(4);
    expect(cut.getRow(2).getCell(1).value).toBe(361);
    expect(cut.getRow(4).getCell(1).value).toBe(note);
    expect(cut.getRow(4).font?.bold).toBe(true);
  });

  it('keeps a formula-like student name as plain text', async () => {
    const sheet = await readSheet(
      await service.toExcel([buildRow({ studentName: '=1+1' })], 'ABC123'),
    );

    const cell = sheet.getRow(2).getCell(4);

    expect(cell.type).toBe(ExcelJS.ValueType.String);
    expect(cell.value).toBe('=1+1');
  });
});
