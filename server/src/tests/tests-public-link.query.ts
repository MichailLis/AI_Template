import type { Prisma } from '@prisma/client';

export const publicLinkAdminInclude = {
  topicVersion: {
    select: {
      id: true,
      topicId: true,
      title: true,
    },
  },
} as const satisfies Prisma.TestPublicLinkInclude;

export const publicLinkAccessInclude = {
  topicVersion: {
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
      questions: {
        orderBy: {
          order: 'asc',
        },
        include: {
          options: {
            orderBy: {
              order: 'asc',
            },
          },
          sliderBands: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
    },
  },
} as const satisfies Prisma.TestPublicLinkInclude;

export type PublicLinkWithTopicVersion = Prisma.TestPublicLinkGetPayload<{
  include: typeof publicLinkAccessInclude;
}>;

export type PublicLinkAdminRecord = Prisma.TestPublicLinkGetPayload<{
  include: typeof publicLinkAdminInclude;
}>;
