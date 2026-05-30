import { TestsAdminAttemptsController } from './tests-admin-attempts.controller';
import { TestsAdminAttemptService } from './tests-admin-attempt.service';

describe('TestsAdminAttemptsController', () => {
  let controller: TestsAdminAttemptsController;
  let serviceMock: {
    listAttemptsForLink: jest.Mock;
    getAttemptDetail: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      listAttemptsForLink: jest.fn(),
      getAttemptDetail: jest.fn(),
    };

    controller = new TestsAdminAttemptsController(
      serviceMock as unknown as TestsAdminAttemptService,
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

  it('getAttemptDetail delegates to service', async () => {
    const response = { attemptId: 33 };
    serviceMock.getAttemptDetail.mockResolvedValue(response);

    await expect(controller.getAttemptDetail(7, 33)).resolves.toEqual(response);
    expect(serviceMock.getAttemptDetail).toHaveBeenCalledWith(7, 33);
  });
});
