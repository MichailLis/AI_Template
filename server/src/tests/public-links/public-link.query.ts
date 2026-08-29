import type { Prisma } from '@prisma/client';

export const publicLinkAdminInclude = {
  educationOrganization: {
    select: {
      id: true,
      name: true,
      fullName: true,
      shortName: true,
      privacyPolicyUrl: true,
      consentDocumentUrl: true,
      logoUrl: true,
      isActive: true,
      groupValidationMode: true,
      groupValidationPattern: true,
      groupValidationExample: true,
      groupValidationHint: true,
    },
  },
  topicVersion: {
    select: {
      id: true,
      topicId: true,
      title: true,
    },
  },
} as const satisfies Prisma.TestPublicLinkInclude;

export const publicLinkAccessInclude = {
  educationOrganization: {
    select: {
      id: true,
      name: true,
      fullName: true,
      shortName: true,
      privacyPolicyUrl: true,
      consentDocumentUrl: true,
      logoUrl: true,
      isActive: true,
      groupValidationMode: true,
      groupValidationPattern: true,
      groupValidationExample: true,
      groupValidationHint: true,
    },
  },
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
