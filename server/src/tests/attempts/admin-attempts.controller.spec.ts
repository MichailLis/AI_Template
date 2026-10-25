import { TestsAdminAttemptsController } from '../attempts/admin-attempts.controller';
import type { TestsAdminAttemptService } from '../attempts/admin-attempt.service';
import type { AuditService } from '../../audit/audit.service';

describe('TestsAdminAttemptsController', () => {
  let controller: TestsAdminAttemptsController;
  let serviceMock: {
    listAttemptsForLink: jest.Mock;
    listAttemptsForExport: jest.Mock;
    getAttemptDetail: jest.Mock;
  };
  let exportMock: { toExcel: jest.Mock };
  let auditMock: { record: jest.Mock };

  beforeEach(() => {
    serviceMock = {
      listAttemptsForLink: jest.fn(),
      listAttemptsForExport: jest.fn(),
      getAttemptDetail: jest.fn(),
    };
    exportMock = { toExcel: jest.fn() };
    auditMock = { record: jest.fn().mockResolvedValue(undefined) };

    controller = new TestsAdminAttemptsController(
      serviceMock as unknown as TestsAdminAttemptService,
      exportMock,
      auditMock as unknown as AuditService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listPublicLinkAttempts delegates to service', async () => {
    const response = { attempts: [] };
    const query = { page: 2, limit: 10 };
    serviceMock.listAttemptsForLink.mockResolvedValue(response);

    await expect(controller.listPublicLinkAttempts(13, query)).resolves.toEqual(response);
    expect(serviceMock.listAttemptsForLink).toHaveBeenCalledWith(13, query);
  });

  it('exportPublicLinkAttempts passes the table filters to the service and returns the file', async () => {
    const query = {
      page: 1,
      limit: 10,
      search: 'лицей',
      status: 'COMPLETED' as const,
      timeZone: 'Asia/Novosibirsk',
    };
    const setHeader = jest.fn();
    serviceMock.listAttemptsForExport.mockResolvedValue({
      shortCode: 'ABC123',
      truncated: true,
      attempts: [],
    });
    exportMock.toExcel.mockResolvedValue(Buffer.from('xlsx'));

    const file = await controller.exportPublicLinkAttempts(5, 13, query, {
      setHeader,
    } as unknown as Parameters<typeof controller.exportPublicLinkAttempts>[3]);

    expect(serviceMock.listAttemptsForExport).toHaveBeenCalledWith(13, query);
    expect(exportMock.toExcel).toHaveBeenCalledWith([], 'ABC123', 'Asia/Novosibirsk', true);
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringMatching(/^attachment; filename="attempts-ABC123-\d{4}-\d{2}-\d{2}\.xlsx"$/),
    );
    expect(file).toBeDefined();
    expect(auditMock.record).toHaveBeenCalledWith({
      entityType: 'PUBLIC_LINK',
      entityId: 13,
      action: 'ATTEMPTS_EXPORTED',
      actorUserId: 5,
      changes: [{ field: 'rows', before: null, after: '0' }],
    });
  });

  it('getAttemptDetail delegates to service', async () => {
    const response = { attemptId: 33 };
    serviceMock.getAttemptDetail.mockResolvedValue(response);

    await expect(controller.getAttemptDetail(33)).resolves.toEqual(response);
    expect(serviceMock.getAttemptDetail).toHaveBeenCalledWith(33);
  });
});
