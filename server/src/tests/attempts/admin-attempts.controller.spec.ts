import { TestsAdminAttemptsController } from '../attempts/admin-attempts.controller';
import type { TestsAdminAttemptService } from '../attempts/admin-attempt.service';

describe('TestsAdminAttemptsController', () => {
  let controller: TestsAdminAttemptsController;
  let serviceMock: {
    listAttemptsForLink: jest.Mock;
    listAttemptsForExport: jest.Mock;
    getAttemptDetail: jest.Mock;
  };
  let exportMock: { toExcel: jest.Mock };

  beforeEach(() => {
    serviceMock = {
      listAttemptsForLink: jest.fn(),
      listAttemptsForExport: jest.fn(),
      getAttemptDetail: jest.fn(),
    };
    exportMock = { toExcel: jest.fn() };

    controller = new TestsAdminAttemptsController(
      serviceMock as unknown as TestsAdminAttemptService,
      exportMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listPublicLinkAttempts delegates to service', async () => {
    const response = { attempts: [] };
    const query = { page: 2, limit: 10 };
    serviceMock.listAttemptsForLink.mockResolvedValue(response);

    await expect(controller.listPublicLinkAttempts(7, 13, query)).resolves.toEqual(response);
    expect(serviceMock.listAttemptsForLink).toHaveBeenCalledWith(7, 13, query);
  });

  it('exportPublicLinkAttempts passes the table filters to the service and returns the file', async () => {
    const query = { page: 1, limit: 10, search: 'лицей', status: 'COMPLETED' as const };
    const setHeader = jest.fn();
    serviceMock.listAttemptsForExport.mockResolvedValue({ shortCode: 'ABC123', attempts: [] });
    exportMock.toExcel.mockResolvedValue(Buffer.from('xlsx'));

    const file = await controller.exportPublicLinkAttempts(7, 13, query, {
      setHeader,
    } as unknown as Parameters<typeof controller.exportPublicLinkAttempts>[3]);

    expect(serviceMock.listAttemptsForExport).toHaveBeenCalledWith(7, 13, query);
    expect(exportMock.toExcel).toHaveBeenCalledWith([], 'ABC123');
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringMatching(/^attachment; filename="attempts-ABC123-\d{4}-\d{2}-\d{2}\.xlsx"$/),
    );
    expect(file).toBeDefined();
  });

  it('getAttemptDetail delegates to service', async () => {
    const response = { attemptId: 33 };
    serviceMock.getAttemptDetail.mockResolvedValue(response);

    await expect(controller.getAttemptDetail(7, 33)).resolves.toEqual(response);
    expect(serviceMock.getAttemptDetail).toHaveBeenCalledWith(7, 33);
  });
});
