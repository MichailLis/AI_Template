import type { Prisma } from '@prisma/client';

import type { AdminPublicAttemptsListQueryDto } from '../dto/tests-links.dto';

type AttemptListQuery = Pick<
  AdminPublicAttemptsListQueryDto,
  'search' | 'status' | 'sortBy' | 'sortOrder'
>;

/**
 * Статус в списке считается из нескольких полей (см. `toAttemptStatus`): попытка с `finishedAt`
 * завершена, а попытка в процессе с истёкшим `expiresAt` просрочена, хотя в БД у неё оба раза
 * `IN_PROGRESS`. Фильтр по статусу обязан повторять это правило, иначе он разойдётся с бейджем в
 * таблице.
 */
const buildStatusWhere = (
  status: NonNullable<AttemptListQuery['status']>,
  now: Date,
): Prisma.TestStudentAttemptWhereInput => {
  const openAttempt = { status: 'IN_PROGRESS' as const, finishedAt: null };

  switch (status) {
    case 'COMPLETED':
      return {
        OR: [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS', finishedAt: { not: null } }],
      };
    case 'EXPIRED':
      return {
        OR: [{ status: 'EXPIRED' }, { ...openAttempt, expiresAt: { lt: now } }],
      };
    case 'ABANDONED':
      return { status: 'ABANDONED' };
    case 'IN_PROGRESS':
      return {
        ...openAttempt,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      };
  }
};

export const buildAttemptListWhere = (
  linkId: number,
  query: AttemptListQuery,
  now: Date = new Date(),
): Prisma.TestStudentAttemptWhereInput => {
  const conditions: Prisma.TestStudentAttemptWhereInput[] = [];
  const search = query.search?.trim();

  if (search) {
    conditions.push({
      OR: [
        { studentName: { contains: search, mode: 'insensitive' } },
        { educationOrganization: { contains: search, mode: 'insensitive' } },
        { groupOrClass: { contains: search, mode: 'insensitive' } },
        { studentResidence: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.status) {
    conditions.push(buildStatusWhere(query.status, now));
  }

  return conditions.length > 0
    ? { publicLinkId: linkId, AND: conditions }
    : { publicLinkId: linkId };
};

export const buildAttemptListOrderBy = (
  query: AttemptListQuery,
): Prisma.TestStudentAttemptOrderByWithRelationInput[] => {
  const sortOrder = query.sortOrder ?? 'desc';
  const sortBy = query.sortBy ?? 'startedAt';

  if (sortBy === 'studentName') {
    return [{ studentName: { sort: sortOrder, nulls: 'last' } }, { startedAt: 'desc' }];
  }

  if (sortBy === 'finishedAt') {
    return [{ finishedAt: { sort: sortOrder, nulls: 'last' } }, { startedAt: 'desc' }];
  }

  // `id` разводит попытки с одинаковым временем начала, чтобы страницы не «плавали».
  return [{ [sortBy]: sortOrder }, { id: sortOrder }];
};
