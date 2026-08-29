import type { Prisma } from '@prisma/client';

export const attemptWithSessionInclude = {
  publicLink: true,
  topicVersion: {
    include: {
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
  answers: {
    orderBy: {
      updatedAt: 'desc',
    },
  },
  analysis: true,
} as const satisfies Prisma.TestStudentAttemptInclude;

export type AttemptWithSessionData = Prisma.TestStudentAttemptGetPayload<{
  include: typeof attemptWithSessionInclude;
}>;
