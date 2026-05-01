import { TestsAdminAttemptService } from './tests-admin-attempt.service';
import { TestsAttemptService } from './tests-attempt.service';
import { TestsPublicSessionService } from './tests-public-session.service';

import type {
  PublicSessionSaveAnswersRequestDto,
  PublicSessionStartRequestDto,
} from './dto/tests-public.dto';

describe('TestsAttemptService', () => {
  let service: TestsAttemptService;
  let publicSessionServiceMock: {
    startSessionByCode: jest.Mock;
    getSessionByToken: jest.Mock;
    saveAnswers: jest.Mock;
    finishSession: jest.Mock;
    getSessionResult: jest.Mock;
  };
  let adminAttemptServiceMock: {
    listAttemptsForLink: jest.Mock;
    getAttemptDetail: jest.Mock;
  };

  beforeEach(() => {
    publicSessionServiceMock = {
      startSessionByCode: jest.fn(),
      getSessionByToken: jest.fn(),
      saveAnswers: jest.fn(),
      finishSession: jest.fn(),
      getSessionResult: jest.fn(),
    };

    adminAttemptServiceMock = {
      listAttemptsForLink: jest.fn(),
      getAttemptDetail: jest.fn(),
    };

    service = new TestsAttemptService(
      publicSessionServiceMock as unknown as TestsPublicSessionService,
      adminAttemptServiceMock as unknown as TestsAdminAttemptService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('startSessionByCode delegates to public session service', async () => {
    const dto: PublicSessionStartRequestDto = {
      studentName: 'Иван',
      studentLastInitial: 'И',
      studentMiddleInitial: 'О',
      educationOrganization: 'Лицей 42',
      groupOrClass: 'ИС-21',
      consentAccepted: true,
    };
    const response = {
      session: {
        sessionToken: 'session-token',
      },
    };

    publicSessionServiceMock.startSessionByCode.mockResolvedValue(response);

    await expect(service.startSessionByCode('ABC123', dto)).resolves.toEqual(response);
    expect(publicSessionServiceMock.startSessionByCode).toHaveBeenCalledWith('ABC123', dto);
  });

  it('getSessionByToken delegates to public session service', async () => {
    const response = {
      session: {
        sessionToken: 'session-token',
      },
    };

    publicSessionServiceMock.getSessionByToken.mockResolvedValue(response);

    await expect(service.getSessionByToken('session-token')).resolves.toEqual(response);
    expect(publicSessionServiceMock.getSessionByToken).toHaveBeenCalledWith('session-token');
  });

  it('saveAnswers delegates to public session service', async () => {
    const dto: PublicSessionSaveAnswersRequestDto = {
      answers: [{ questionId: 1, answerPayload: { value: 'A' } }],
    };
    const response = { status: 'IN_PROGRESS' };

    publicSessionServiceMock.saveAnswers.mockResolvedValue(response);

    await expect(service.saveAnswers('session-token', dto)).resolves.toEqual(response);
    expect(publicSessionServiceMock.saveAnswers).toHaveBeenCalledWith('session-token', dto);
  });

  it('finishSession delegates to public session service', async () => {
    const response = { status: 'COMPLETED' };

    publicSessionServiceMock.finishSession.mockResolvedValue(response);

    await expect(service.finishSession('session-token')).resolves.toEqual(response);
    expect(publicSessionServiceMock.finishSession).toHaveBeenCalledWith('session-token');
  });

  it('getSessionResult delegates to public session service', async () => {
    const response = { status: 'COMPLETED' };

    publicSessionServiceMock.getSessionResult.mockResolvedValue(response);

    await expect(service.getSessionResult('session-token')).resolves.toEqual(response);
    expect(publicSessionServiceMock.getSessionResult).toHaveBeenCalledWith('session-token');
  });

  it('listAttemptsForLink delegates to admin attempt service', async () => {
    const response = { attempts: [] };
    const query = { page: 2, limit: 10 };

    adminAttemptServiceMock.listAttemptsForLink.mockResolvedValue(response);

    await expect(service.listAttemptsForLink(7, 11, query)).resolves.toEqual(response);
    expect(adminAttemptServiceMock.listAttemptsForLink).toHaveBeenCalledWith(7, 11, query);
  });

  it('getAttemptDetail delegates to admin attempt service', async () => {
    const response = { attemptId: 21 };

    adminAttemptServiceMock.getAttemptDetail.mockResolvedValue(response);

    await expect(service.getAttemptDetail(7, 21)).resolves.toEqual(response);
    expect(adminAttemptServiceMock.getAttemptDetail).toHaveBeenCalledWith(7, 21);
  });
});
