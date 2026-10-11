import { buildAttemptListOrderBy, buildAttemptListWhere } from './attempt-list-query';

const now = new Date('2026-10-11T12:00:00.000Z');

describe('buildAttemptListWhere', () => {
  it('keeps the plain link filter when no search or status is given', () => {
    expect(buildAttemptListWhere(13, {}, now)).toEqual({ publicLinkId: 13 });
    expect(buildAttemptListWhere(13, { search: '   ' }, now)).toEqual({ publicLinkId: 13 });
  });

  it('searches the student and education fields case-insensitively', () => {
    const where = buildAttemptListWhere(13, { search: ' лицей ' }, now);

    expect(where).toEqual({
      publicLinkId: 13,
      AND: [
        {
          OR: [
            { studentName: { contains: 'лицей', mode: 'insensitive' } },
            { educationOrganization: { contains: 'лицей', mode: 'insensitive' } },
            { groupOrClass: { contains: 'лицей', mode: 'insensitive' } },
            { studentResidence: { contains: 'лицей', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('treats an open attempt past its deadline as expired, like the status badge does', () => {
    expect(buildAttemptListWhere(13, { status: 'EXPIRED' }, now).AND).toEqual([
      {
        OR: [
          { status: 'EXPIRED' },
          { status: 'IN_PROGRESS', finishedAt: null, expiresAt: { lt: now } },
        ],
      },
    ]);
    expect(buildAttemptListWhere(13, { status: 'IN_PROGRESS' }, now).AND).toEqual([
      {
        status: 'IN_PROGRESS',
        finishedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    ]);
  });

  it('counts an attempt with finishedAt as completed even if its status lags behind', () => {
    expect(buildAttemptListWhere(13, { status: 'COMPLETED' }, now).AND).toEqual([
      { OR: [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS', finishedAt: { not: null } }] },
    ]);
  });
});

describe('buildAttemptListOrderBy', () => {
  it('defaults to newest first, as before', () => {
    expect(buildAttemptListOrderBy({})).toEqual([{ startedAt: 'desc' }, { id: 'desc' }]);
  });

  it('puts missing names and finish dates last in either direction', () => {
    expect(buildAttemptListOrderBy({ sortBy: 'studentName', sortOrder: 'asc' })[0]).toEqual({
      studentName: { sort: 'asc', nulls: 'last' },
    });
    expect(buildAttemptListOrderBy({ sortBy: 'finishedAt' })[0]).toEqual({
      finishedAt: { sort: 'desc', nulls: 'last' },
    });
  });

  it('sorts by attempt number with the id as a tie-breaker', () => {
    expect(buildAttemptListOrderBy({ sortBy: 'attemptNumber', sortOrder: 'asc' })).toEqual([
      { attemptNumber: 'asc' },
      { id: 'asc' },
    ]);
  });
});
