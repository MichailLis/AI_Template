import { BadRequestException } from '@nestjs/common';

import { createPublicSessionHarness } from './tests-public-session.spec-harness';

import {
  createAccessibleLinkFixture,
  createPublicSessionDemographicStartDto,
  createPublicSessionEducationDemographicStartDto,
  createPublicSessionStartDto,
  createPublicSessionStateResponse,
} from './tests.spec-fixtures';

import type { PublicSessionHarness } from './tests-public-session.spec-harness';

describe('TestsPublicSessionService start', () => {
  let harness: PublicSessionHarness;
  let service: PublicSessionHarness['service'];
  let updateManyMock: PublicSessionHarness['updateManyMock'];
  let findManyMock: PublicSessionHarness['findManyMock'];
  let createAttemptMock: PublicSessionHarness['createAttemptMock'];
  let getAccessiblePublicLinkByCodeMock: PublicSessionHarness['getAccessiblePublicLinkByCodeMock'];
  let getActivePolicySnapshotMock: PublicSessionHarness['getActivePolicySnapshotMock'];
  let transactionMock: PublicSessionHarness['transactionMock'];
  let txMock: PublicSessionHarness['txMock'];

  beforeEach(() => {
    harness = createPublicSessionHarness();
    ({
      service,
      updateManyMock,
      findManyMock,
      createAttemptMock,
      getAccessiblePublicLinkByCodeMock,
      getActivePolicySnapshotMock,
      transactionMock,
      txMock,
    } = harness);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  it('startSessionByCode rejects invalid group format in STRICT mode', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        educationOrganization: {
          id: 42,
          name: 'Лицей 42',
          logoUrl: null,
          groupValidationMode: 'STRICT',
          groupValidationPattern: '^\\d{2}[A-Z]$',
          groupValidationHint: 'Неверный формат группы',
        },
      }),
    );

    const startPromise = service.startSessionByCode(
      'ABC123',
      createPublicSessionStartDto({ groupOrClass: 'ИС-21' }),
    );

    await expect(startPromise).rejects.toThrow(BadRequestException);
    await expect(startPromise).rejects.toThrow('Неверный формат группы');
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('startSessionByCode uses organization from link and creates new attempt', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        educationOrganization: {
          id: 42,
          name: 'Лицей 42',
          logoUrl: null,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationHint: null,
        },
      }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-new' });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-new'));

    const result = await service.startSessionByCode(
      'ABC123',
      createPublicSessionStartDto({ educationOrganization: '' }),
    );

    expect(createAttemptMock).toHaveBeenCalled();
    const createCall = createAttemptMock.mock.calls[0]?.[0];
    expect(createCall?.data.educationOrganization).toBe('Лицей 42');
    expect(createCall?.data.groupOrClass).toBe('ИС-21');
    expect(createCall?.data.policyVersionSnapshot).toBe('2026-07-09');
    expect(createCall?.data.policyPublishedAtSnapshot).toEqual(
      new Date('2026-07-09T00:00:00.000Z'),
    );
    expect(getActivePolicySnapshotMock).toHaveBeenCalledWith();
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-new');
    expect(result.session.sessionToken).toBe('resume-new');
  });

  it('startSessionByCode creates a DEMOGRAPHIC attempt with profile data and attempt number 1', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        entryProfileMode: 'DEMOGRAPHIC',
        educationOrganization: null,
        allowResume: true,
        maxAttemptsPerStudent: 1,
      }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-demo' });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-demo'));

    const result = await service.startSessionByCode(
      'DEMO2026',
      createPublicSessionDemographicStartDto({
        gender: 'MALE',
        age: 18,
        residence: '  Казань  ',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );

    const createCall = createAttemptMock.mock.calls[0]?.[0];

    expect(updateManyMock).toHaveBeenCalled();
    expect(findManyMock).toHaveBeenCalled();
    expect(createCall?.data).toMatchObject({
      publicLinkId: 100,
      topicVersionId: 200,
      attemptNumber: 1,
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      studentGender: 'MALE',
      studentAge: 18,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_SPECIAL',
    });
    expect(createCall?.data.studentKeyHash).toEqual(expect.any(String));
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-demo');
    expect(result.session.sessionToken).toBe('resume-demo');
  });

  it('does not resume DEMOGRAPHIC sessions from matching profiles', async () => {
    const link = createAccessibleLinkFixture({ entryProfileMode: 'DEMOGRAPHIC' });
    link.allowResume = true;
    link.maxAttemptsPerStudent = 1;
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(link);
    findManyMock.mockResolvedValue([
      {
        id: 1,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        resumeToken: 'another-participant-token',
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]);

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('another-participant-token'));

    await expect(
      service.startSessionByCode('DEMO2026', createPublicSessionDemographicStartDto()),
    ).rejects.toThrow('Attempts limit reached for this test link');
    expect(getSessionByTokenSpy).not.toHaveBeenCalled();
  });

  it('startSessionByCode builds a stable DEMOGRAPHIC key from normalized profile and link', async () => {
    getAccessiblePublicLinkByCodeMock
      .mockResolvedValueOnce(
        createAccessibleLinkFixture({
          id: 100,
          entryProfileMode: 'DEMOGRAPHIC',
          educationOrganization: null,
          maxAttemptsPerStudent: 3,
        }),
      )
      .mockResolvedValueOnce(
        createAccessibleLinkFixture({
          id: 100,
          entryProfileMode: 'DEMOGRAPHIC',
          educationOrganization: null,
          maxAttemptsPerStudent: 3,
        }),
      )
      .mockResolvedValueOnce(
        createAccessibleLinkFixture({
          id: 101,
          entryProfileMode: 'DEMOGRAPHIC',
          educationOrganization: null,
          maxAttemptsPerStudent: 3,
        }),
      );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock
      .mockResolvedValueOnce({ resumeToken: 'resume-demo-1' })
      .mockResolvedValueOnce({ resumeToken: 'resume-demo-2' })
      .mockResolvedValueOnce({ resumeToken: 'resume-demo-3' });

    jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValueOnce(createPublicSessionStateResponse('resume-demo-1'))
      .mockResolvedValueOnce(createPublicSessionStateResponse('resume-demo-2'))
      .mockResolvedValueOnce(createPublicSessionStateResponse('resume-demo-3'));

    await service.startSessionByCode(
      'DEMO2026',
      createPublicSessionDemographicStartDto({
        gender: 'MALE',
        age: 18,
        residence: '  КаЗаНь   Центр  ',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );
    await service.startSessionByCode(
      'DEMO2026',
      createPublicSessionDemographicStartDto({
        gender: 'MALE',
        age: 18,
        residence: 'казань центр',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );
    await service.startSessionByCode(
      'DEMO2027',
      createPublicSessionDemographicStartDto({
        gender: 'MALE',
        age: 18,
        residence: 'казань центр',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );

    const firstKey = createAttemptMock.mock.calls[0]?.[0].data.studentKeyHash;
    const secondKey = createAttemptMock.mock.calls[1]?.[0].data.studentKeyHash;
    const anotherLinkKey = createAttemptMock.mock.calls[2]?.[0].data.studentKeyHash;

    expect(firstKey).toEqual(expect.any(String));
    expect(firstKey).toBe(secondKey);
    expect(firstKey).not.toBe(anotherLinkKey);
  });

  it('startSessionByCode rejects incomplete DEMOGRAPHIC profile data', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        entryProfileMode: 'DEMOGRAPHIC',
        educationOrganization: null,
        maxAttemptsPerStudent: 1,
      }),
    );

    await expect(
      service.startSessionByCode(
        'DEMO2026',
        createPublicSessionDemographicStartDto({ age: undefined }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(createAttemptMock).not.toHaveBeenCalled();
  });

  it('startSessionByCode creates an EDUCATION_DEMOGRAPHIC attempt with both profile blocks', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
        allowResume: true,
        maxAttemptsPerStudent: 3,
        educationOrganization: {
          id: 42,
          name: 'Лицей 42',
          logoUrl: null,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationHint: null,
        },
      }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-hybrid' });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-hybrid'));

    const result = await service.startSessionByCode(
      'HYBRID2026',
      createPublicSessionEducationDemographicStartDto({
        educationOrganization: '',
        gender: 'MALE',
        age: 18,
        residence: '  Казань  ',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );

    const createCall = createAttemptMock.mock.calls[0]?.[0];

    expect(updateManyMock).toHaveBeenCalled();
    expect(findManyMock).toHaveBeenCalled();
    expect(createCall?.data).toMatchObject({
      publicLinkId: 100,
      topicVersionId: 200,
      attemptNumber: 1,
      studentName: 'Иван',
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: 'Лицей 42',
      groupOrClass: 'ИС-21',
      studentGender: 'MALE',
      studentAge: 18,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_SPECIAL',
    });
    expect(createCall?.data.studentKeyHash).toEqual(expect.any(String));
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-hybrid');
    expect(result.session.sessionToken).toBe('resume-hybrid');
  });

  it('startSessionByCode returns resumable session when allowResume is enabled', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({ allowResume: true }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([
      {
        id: 1,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        resumeToken: 'resume-existing',
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]);

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-existing'));

    const result = await service.startSessionByCode('ABC123', createPublicSessionStartDto());

    expect(createAttemptMock).not.toHaveBeenCalled();
    expect(txMock.testStudentAttempt.update).not.toHaveBeenCalled();
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-existing');
    expect(result.session.sessionToken).toBe('resume-existing');
  });

  it('startSessionByCode retries allocation after an attempt number race', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({ allowResume: true }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 10,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        resumeToken: 'resume-existing',
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]);
    createAttemptMock.mockRejectedValueOnce({
      code: 'P2002',
      meta: {
        target: ['publicLinkId', 'studentKeyHash', 'attemptNumber'],
      },
    });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-existing'));

    const result = await service.startSessionByCode('ABC123', createPublicSessionStartDto());

    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(createAttemptMock).toHaveBeenCalledTimes(1);
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-existing');
    expect(result.session.sessionToken).toBe('resume-existing');
  });

  it('startSessionByCode handles concurrent starts for the same student key', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({ allowResume: true }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });

    let releaseInitialReads!: () => void;
    const initialReadsReleased = new Promise<void>((resolve) => {
      releaseInitialReads = resolve;
    });
    let findManyCallCount = 0;
    findManyMock.mockImplementation(async () => {
      findManyCallCount += 1;

      if (findManyCallCount <= 2) {
        if (findManyCallCount === 2) {
          releaseInitialReads();
        }

        await initialReadsReleased;
        return [];
      }

      return [
        {
          id: 10,
          attemptNumber: 1,
          status: 'IN_PROGRESS',
          resumeToken: 'resume-new',
          expiresAt: new Date(Date.now() + 60_000),
        },
      ];
    });

    let createCallCount = 0;
    createAttemptMock.mockImplementation(() => {
      createCallCount += 1;

      if (createCallCount === 1) {
        return Promise.resolve({ resumeToken: 'resume-new' });
      }

      const attemptNumberRaceError = Object.assign(new Error('Attempt number race'), {
        code: 'P2002',
        meta: {
          target: ['publicLinkId', 'studentKeyHash', 'attemptNumber'],
        },
      });

      return Promise.reject(attemptNumberRaceError);
    });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-new'));

    const results = await Promise.all([
      service.startSessionByCode('ABC123', createPublicSessionStartDto()),
      service.startSessionByCode('ABC123', createPublicSessionStartDto()),
    ]);

    expect(transactionMock).toHaveBeenCalledTimes(3);
    expect(createAttemptMock).toHaveBeenCalledTimes(2);
    expect(findManyMock).toHaveBeenCalledTimes(3);
    expect(getSessionByTokenSpy).toHaveBeenCalledTimes(2);
    expect(results.map((result) => result.session.sessionToken)).toEqual([
      'resume-new',
      'resume-new',
    ]);
  });
});
