import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum([
  'ReadUncommitted',
  'ReadCommitted',
  'RepeatableRead',
  'Serializable',
]);

export const UserScalarFieldEnumSchema = z.enum([
  'id',
  'email',
  'name',
  'password',
  'hashedRefreshToken',
  'role',
  'createdAt',
  'updatedAt',
]);

export const BookmarkScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'url',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const SnippetScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'content',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const NewsScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'content',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const SortOrderSchema = z.enum(['asc', 'desc']);

export const QueryModeSchema = z.enum(['default', 'insensitive']);

export const NullsOrderSchema = z.enum(['first', 'last']);

export const RoleSchema = z.enum(['USER', 'ADMIN']);

export type RoleType = `${z.infer<typeof RoleSchema>}`;

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: RoleSchema,
  id: z.number().int(),
  email: z.string(),
  name: z.string().nullable(),
  password: z.string(),
  hashedRefreshToken: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

/////////////////////////////////////////
// BOOKMARK SCHEMA
/////////////////////////////////////////

export const BookmarkSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  url: z.string(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;

/////////////////////////////////////////
// SNIPPET SCHEMA
/////////////////////////////////////////

export const SnippetSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Snippet = z.infer<typeof SnippetSchema>;

/////////////////////////////////////////
// NEWS SCHEMA
/////////////////////////////////////////

export const NewsSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type News = z.infer<typeof NewsSchema>;

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z
  .object({
    bookmarks: z
      .union([z.boolean(), z.lazy(() => BookmarkFindManyArgsSchema)])
      .optional(),
    news: z
      .union([z.boolean(), z.lazy(() => NewsFindManyArgsSchema)])
      .optional(),
    snippets: z
      .union([z.boolean(), z.lazy(() => SnippetFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => UserCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z
  .object({
    select: z.lazy(() => UserSelectSchema).optional(),
    include: z.lazy(() => UserIncludeSchema).optional(),
  })
  .strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> =
  z
    .object({
      bookmarks: z.boolean().optional(),
      news: z.boolean().optional(),
      snippets: z.boolean().optional(),
    })
    .strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z
  .object({
    id: z.boolean().optional(),
    email: z.boolean().optional(),
    name: z.boolean().optional(),
    password: z.boolean().optional(),
    hashedRefreshToken: z.boolean().optional(),
    role: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    bookmarks: z
      .union([z.boolean(), z.lazy(() => BookmarkFindManyArgsSchema)])
      .optional(),
    news: z
      .union([z.boolean(), z.lazy(() => NewsFindManyArgsSchema)])
      .optional(),
    snippets: z
      .union([z.boolean(), z.lazy(() => SnippetFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => UserCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// BOOKMARK
//------------------------------------------------------

export const BookmarkIncludeSchema: z.ZodType<Prisma.BookmarkInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const BookmarkArgsSchema: z.ZodType<Prisma.BookmarkDefaultArgs> = z
  .object({
    select: z.lazy(() => BookmarkSelectSchema).optional(),
    include: z.lazy(() => BookmarkIncludeSchema).optional(),
  })
  .strict();

export const BookmarkSelectSchema: z.ZodType<Prisma.BookmarkSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    url: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

// SNIPPET
//------------------------------------------------------

export const SnippetIncludeSchema: z.ZodType<Prisma.SnippetInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const SnippetArgsSchema: z.ZodType<Prisma.SnippetDefaultArgs> = z
  .object({
    select: z.lazy(() => SnippetSelectSchema).optional(),
    include: z.lazy(() => SnippetIncludeSchema).optional(),
  })
  .strict();

export const SnippetSelectSchema: z.ZodType<Prisma.SnippetSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    content: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

// NEWS
//------------------------------------------------------

export const NewsIncludeSchema: z.ZodType<Prisma.NewsInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const NewsArgsSchema: z.ZodType<Prisma.NewsDefaultArgs> = z
  .object({
    select: z.lazy(() => NewsSelectSchema).optional(),
    include: z.lazy(() => NewsIncludeSchema).optional(),
  })
  .strict();

export const NewsSelectSchema: z.ZodType<Prisma.NewsSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    content: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => UserWhereInputSchema),
        z.lazy(() => UserWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => UserWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => UserWhereInputSchema),
        z.lazy(() => UserWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    email: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    name: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    password: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    hashedRefreshToken: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    role: z
      .union([z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema)])
      .optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    bookmarks: z.lazy(() => BookmarkListRelationFilterSchema).optional(),
    news: z.lazy(() => NewsListRelationFilterSchema).optional(),
    snippets: z.lazy(() => SnippetListRelationFilterSchema).optional(),
  });

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    email: z.lazy(() => SortOrderSchema).optional(),
    name: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    password: z.lazy(() => SortOrderSchema).optional(),
    hashedRefreshToken: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkOrderByRelationAggregateInputSchema)
      .optional(),
    news: z.lazy(() => NewsOrderByRelationAggregateInputSchema).optional(),
    snippets: z
      .lazy(() => SnippetOrderByRelationAggregateInputSchema)
      .optional(),
  });

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.number().int(),
        email: z.string(),
      }),
      z.object({
        id: z.number().int(),
      }),
      z.object({
        email: z.string(),
      }),
    ])
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        email: z.string().optional(),
        AND: z
          .union([
            z.lazy(() => UserWhereInputSchema),
            z.lazy(() => UserWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => UserWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => UserWhereInputSchema),
            z.lazy(() => UserWhereInputSchema).array(),
          ])
          .optional(),
        name: z
          .union([z.lazy(() => StringNullableFilterSchema), z.string()])
          .optional()
          .nullable(),
        password: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        hashedRefreshToken: z
          .union([z.lazy(() => StringNullableFilterSchema), z.string()])
          .optional()
          .nullable(),
        role: z
          .union([z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema)])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        bookmarks: z.lazy(() => BookmarkListRelationFilterSchema).optional(),
        news: z.lazy(() => NewsListRelationFilterSchema).optional(),
        snippets: z.lazy(() => SnippetListRelationFilterSchema).optional(),
      }),
    );

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    email: z.lazy(() => SortOrderSchema).optional(),
    name: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    password: z.lazy(() => SortOrderSchema).optional(),
    hashedRefreshToken: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => UserAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => UserSumOrderByAggregateInputSchema).optional(),
  });

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => UserScalarWhereWithAggregatesInputSchema),
        z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => UserScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => UserScalarWhereWithAggregatesInputSchema),
        z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    email: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    name: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => EnumRoleWithAggregatesFilterSchema),
        z.lazy(() => RoleSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
  });

export const BookmarkWhereInputSchema: z.ZodType<Prisma.BookmarkWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => BookmarkWhereInputSchema),
        z.lazy(() => BookmarkWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => BookmarkWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => BookmarkWhereInputSchema),
        z.lazy(() => BookmarkWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    url: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  });

export const BookmarkOrderByWithRelationInputSchema: z.ZodType<Prisma.BookmarkOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    url: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const BookmarkWhereUniqueInputSchema: z.ZodType<Prisma.BookmarkWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => BookmarkWhereInputSchema),
            z.lazy(() => BookmarkWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => BookmarkWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => BookmarkWhereInputSchema),
            z.lazy(() => BookmarkWhereInputSchema).array(),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        url: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
        userId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        user: z
          .union([
            z.lazy(() => UserScalarRelationFilterSchema),
            z.lazy(() => UserWhereInputSchema),
          ])
          .optional(),
      }),
    );

export const BookmarkOrderByWithAggregationInputSchema: z.ZodType<Prisma.BookmarkOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    url: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => BookmarkCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => BookmarkAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => BookmarkMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => BookmarkMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => BookmarkSumOrderByAggregateInputSchema).optional(),
  });

export const BookmarkScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BookmarkScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => BookmarkScalarWhereWithAggregatesInputSchema),
        z.lazy(() => BookmarkScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => BookmarkScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => BookmarkScalarWhereWithAggregatesInputSchema),
        z.lazy(() => BookmarkScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    title: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    url: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    userId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    createdAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
  });

export const SnippetWhereInputSchema: z.ZodType<Prisma.SnippetWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => SnippetWhereInputSchema),
        z.lazy(() => SnippetWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => SnippetWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => SnippetWhereInputSchema),
        z.lazy(() => SnippetWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  });

export const SnippetOrderByWithRelationInputSchema: z.ZodType<Prisma.SnippetOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const SnippetWhereUniqueInputSchema: z.ZodType<Prisma.SnippetWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => SnippetWhereInputSchema),
            z.lazy(() => SnippetWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => SnippetWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => SnippetWhereInputSchema),
            z.lazy(() => SnippetWhereInputSchema).array(),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        content: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        userId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        user: z
          .union([
            z.lazy(() => UserScalarRelationFilterSchema),
            z.lazy(() => UserWhereInputSchema),
          ])
          .optional(),
      }),
    );

export const SnippetOrderByWithAggregationInputSchema: z.ZodType<Prisma.SnippetOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => SnippetCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => SnippetAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => SnippetMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => SnippetMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => SnippetSumOrderByAggregateInputSchema).optional(),
  });

export const SnippetScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SnippetScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => SnippetScalarWhereWithAggregatesInputSchema),
        z.lazy(() => SnippetScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => SnippetScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => SnippetScalarWhereWithAggregatesInputSchema),
        z.lazy(() => SnippetScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    title: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    content: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    userId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    createdAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
  });

export const NewsWhereInputSchema: z.ZodType<Prisma.NewsWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => NewsWhereInputSchema),
        z.lazy(() => NewsWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => NewsWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => NewsWhereInputSchema),
        z.lazy(() => NewsWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  });

export const NewsOrderByWithRelationInputSchema: z.ZodType<Prisma.NewsOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const NewsWhereUniqueInputSchema: z.ZodType<Prisma.NewsWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => NewsWhereInputSchema),
            z.lazy(() => NewsWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => NewsWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => NewsWhereInputSchema),
            z.lazy(() => NewsWhereInputSchema).array(),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        content: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        userId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        user: z
          .union([
            z.lazy(() => UserScalarRelationFilterSchema),
            z.lazy(() => UserWhereInputSchema),
          ])
          .optional(),
      }),
    );

export const NewsOrderByWithAggregationInputSchema: z.ZodType<Prisma.NewsOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => NewsCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => NewsAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => NewsMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => NewsMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => NewsSumOrderByAggregateInputSchema).optional(),
  });

export const NewsScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NewsScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => NewsScalarWhereWithAggregatesInputSchema),
        z.lazy(() => NewsScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => NewsScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => NewsScalarWhereWithAggregatesInputSchema),
        z.lazy(() => NewsScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    title: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    content: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    userId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    createdAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterSchema),
        z.coerce.date(),
      ])
      .optional(),
  });

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
      .optional(),
    news: z.lazy(() => NewsCreateNestedManyWithoutUserInputSchema).optional(),
    snippets: z
      .lazy(() => SnippetCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    news: z
      .lazy(() => NewsUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> =
  z.strictObject({
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    news: z.lazy(() => NewsUpdateManyWithoutUserNestedInputSchema).optional(),
    snippets: z
      .lazy(() => SnippetUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    news: z
      .lazy(() => NewsUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> =
  z.strictObject({
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const BookmarkCreateInputSchema: z.ZodType<Prisma.BookmarkCreateInput> =
  z.strictObject({
    title: z.string(),
    url: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutBookmarksInputSchema),
  });

export const BookmarkUncheckedCreateInputSchema: z.ZodType<Prisma.BookmarkUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    url: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const BookmarkUpdateInputSchema: z.ZodType<Prisma.BookmarkUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    user: z
      .lazy(() => UserUpdateOneRequiredWithoutBookmarksNestedInputSchema)
      .optional(),
  });

export const BookmarkUncheckedUpdateInputSchema: z.ZodType<Prisma.BookmarkUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    userId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const BookmarkCreateManyInputSchema: z.ZodType<Prisma.BookmarkCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    url: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const BookmarkUpdateManyMutationInputSchema: z.ZodType<Prisma.BookmarkUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const BookmarkUncheckedUpdateManyInputSchema: z.ZodType<Prisma.BookmarkUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    userId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const SnippetCreateInputSchema: z.ZodType<Prisma.SnippetCreateInput> =
  z.strictObject({
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutSnippetsInputSchema),
  });

export const SnippetUncheckedCreateInputSchema: z.ZodType<Prisma.SnippetUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const SnippetUpdateInputSchema: z.ZodType<Prisma.SnippetUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    user: z
      .lazy(() => UserUpdateOneRequiredWithoutSnippetsNestedInputSchema)
      .optional(),
  });

export const SnippetUncheckedUpdateInputSchema: z.ZodType<Prisma.SnippetUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    userId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const SnippetCreateManyInputSchema: z.ZodType<Prisma.SnippetCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const SnippetUpdateManyMutationInputSchema: z.ZodType<Prisma.SnippetUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const SnippetUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SnippetUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    userId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NewsCreateInputSchema: z.ZodType<Prisma.NewsCreateInput> =
  z.strictObject({
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutNewsInputSchema),
  });

export const NewsUncheckedCreateInputSchema: z.ZodType<Prisma.NewsUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NewsUpdateInputSchema: z.ZodType<Prisma.NewsUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    user: z
      .lazy(() => UserUpdateOneRequiredWithoutNewsNestedInputSchema)
      .optional(),
  });

export const NewsUncheckedUpdateInputSchema: z.ZodType<Prisma.NewsUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    userId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NewsCreateManyInputSchema: z.ZodType<Prisma.NewsCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NewsUpdateManyMutationInputSchema: z.ZodType<Prisma.NewsUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NewsUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NewsUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    userId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([z.number(), z.lazy(() => NestedIntFilterSchema)]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> =
  z.strictObject({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringFilterSchema)])
      .optional(),
  });

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> =
  z.strictObject({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringNullableFilterSchema)])
      .optional()
      .nullable(),
  });

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> =
  z.strictObject({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleFilterSchema),
      ])
      .optional(),
  });

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> =
  z.strictObject({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
      .union([z.coerce.date(), z.lazy(() => NestedDateTimeFilterSchema)])
      .optional(),
  });

export const BookmarkListRelationFilterSchema: z.ZodType<Prisma.BookmarkListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => BookmarkWhereInputSchema).optional(),
    some: z.lazy(() => BookmarkWhereInputSchema).optional(),
    none: z.lazy(() => BookmarkWhereInputSchema).optional(),
  });

export const NewsListRelationFilterSchema: z.ZodType<Prisma.NewsListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => NewsWhereInputSchema).optional(),
    some: z.lazy(() => NewsWhereInputSchema).optional(),
    none: z.lazy(() => NewsWhereInputSchema).optional(),
  });

export const SnippetListRelationFilterSchema: z.ZodType<Prisma.SnippetListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => SnippetWhereInputSchema).optional(),
    some: z.lazy(() => SnippetWhereInputSchema).optional(),
    none: z.lazy(() => SnippetWhereInputSchema).optional(),
  });

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> =
  z.strictObject({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
  });

export const BookmarkOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BookmarkOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const NewsOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NewsOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const SnippetOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SnippetOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    email: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    password: z.lazy(() => SortOrderSchema).optional(),
    hashedRefreshToken: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const UserAvgOrderByAggregateInputSchema: z.ZodType<Prisma.UserAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
  });

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    email: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    password: z.lazy(() => SortOrderSchema).optional(),
    hashedRefreshToken: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    email: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    password: z.lazy(() => SortOrderSchema).optional(),
    hashedRefreshToken: z.lazy(() => SortOrderSchema).optional(),
    role: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const UserSumOrderByAggregateInputSchema: z.ZodType<Prisma.UserSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
  });

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> =
  z.strictObject({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedIntWithAggregatesFilterSchema)])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
    _sum: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedIntFilterSchema).optional(),
    _max: z.lazy(() => NestedIntFilterSchema).optional(),
  });

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> =
  z.strictObject({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringWithAggregatesFilterSchema)])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedStringFilterSchema).optional(),
    _max: z.lazy(() => NestedStringFilterSchema).optional(),
  });

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> =
  z.strictObject({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
      .union([
        z.string(),
        z.lazy(() => NestedStringNullableWithAggregatesFilterSchema),
      ])
      .optional()
      .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  });

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> =
  z.strictObject({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  });

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> =
  z.strictObject({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
      .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeWithAggregatesFilterSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
    _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  });

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> =
  z.strictObject({
    is: z.lazy(() => UserWhereInputSchema).optional(),
    isNot: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const BookmarkCountOrderByAggregateInputSchema: z.ZodType<Prisma.BookmarkCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    url: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const BookmarkAvgOrderByAggregateInputSchema: z.ZodType<Prisma.BookmarkAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const BookmarkMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BookmarkMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    url: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const BookmarkMinOrderByAggregateInputSchema: z.ZodType<Prisma.BookmarkMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    url: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const BookmarkSumOrderByAggregateInputSchema: z.ZodType<Prisma.BookmarkSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const SnippetCountOrderByAggregateInputSchema: z.ZodType<Prisma.SnippetCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const SnippetAvgOrderByAggregateInputSchema: z.ZodType<Prisma.SnippetAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const SnippetMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SnippetMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const SnippetMinOrderByAggregateInputSchema: z.ZodType<Prisma.SnippetMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const SnippetSumOrderByAggregateInputSchema: z.ZodType<Prisma.SnippetSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const NewsCountOrderByAggregateInputSchema: z.ZodType<Prisma.NewsCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const NewsAvgOrderByAggregateInputSchema: z.ZodType<Prisma.NewsAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const NewsMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NewsMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const NewsMinOrderByAggregateInputSchema: z.ZodType<Prisma.NewsMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const NewsSumOrderByAggregateInputSchema: z.ZodType<Prisma.NewsSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const BookmarkCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.BookmarkCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => BookmarkCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateWithoutUserInputSchema).array(),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => BookmarkCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const NewsCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.NewsCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NewsCreateWithoutUserInputSchema),
        z.lazy(() => NewsCreateWithoutUserInputSchema).array(),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NewsCreateManyUserInputEnvelopeSchema).optional(),
    connect: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const SnippetCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SnippetCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => SnippetCreateWithoutUserInputSchema),
        z.lazy(() => SnippetCreateWithoutUserInputSchema).array(),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => SnippetCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const BookmarkUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => BookmarkCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateWithoutUserInputSchema).array(),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => BookmarkCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const NewsUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.NewsUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NewsCreateWithoutUserInputSchema),
        z.lazy(() => NewsCreateWithoutUserInputSchema).array(),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NewsCreateManyUserInputEnvelopeSchema).optional(),
    connect: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const SnippetUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SnippetUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => SnippetCreateWithoutUserInputSchema),
        z.lazy(() => SnippetCreateWithoutUserInputSchema).array(),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => SnippetCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.string().optional(),
  });

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.string().optional().nullable(),
  });

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.lazy(() => RoleSchema).optional(),
  });

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.coerce.date().optional(),
  });

export const BookmarkUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.BookmarkUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => BookmarkCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateWithoutUserInputSchema).array(),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => BookmarkUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => BookmarkUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => BookmarkCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => BookmarkUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => BookmarkUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => BookmarkUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => BookmarkUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => BookmarkScalarWhereInputSchema),
        z.lazy(() => BookmarkScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const NewsUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.NewsUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NewsCreateWithoutUserInputSchema),
        z.lazy(() => NewsCreateWithoutUserInputSchema).array(),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => NewsUpsertWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NewsUpsertWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NewsCreateManyUserInputEnvelopeSchema).optional(),
    set: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => NewsUpdateWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NewsUpdateWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => NewsUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => NewsUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => NewsScalarWhereInputSchema),
        z.lazy(() => NewsScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const SnippetUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SnippetUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => SnippetCreateWithoutUserInputSchema),
        z.lazy(() => SnippetCreateWithoutUserInputSchema).array(),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => SnippetUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => SnippetUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => SnippetCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => SnippetUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => SnippetUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => SnippetUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => SnippetUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => SnippetScalarWhereInputSchema),
        z.lazy(() => SnippetScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.number().optional(),
    increment: z.number().optional(),
    decrement: z.number().optional(),
    multiply: z.number().optional(),
    divide: z.number().optional(),
  });

export const BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.BookmarkUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => BookmarkCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateWithoutUserInputSchema).array(),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => BookmarkCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => BookmarkUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => BookmarkUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => BookmarkCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => BookmarkWhereUniqueInputSchema),
        z.lazy(() => BookmarkWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => BookmarkUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => BookmarkUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => BookmarkUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => BookmarkUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => BookmarkScalarWhereInputSchema),
        z.lazy(() => BookmarkScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const NewsUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.NewsUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NewsCreateWithoutUserInputSchema),
        z.lazy(() => NewsCreateWithoutUserInputSchema).array(),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NewsCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => NewsUpsertWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NewsUpsertWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NewsCreateManyUserInputEnvelopeSchema).optional(),
    set: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => NewsWhereUniqueInputSchema),
        z.lazy(() => NewsWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => NewsUpdateWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NewsUpdateWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => NewsUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => NewsUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => NewsScalarWhereInputSchema),
        z.lazy(() => NewsScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const SnippetUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SnippetUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => SnippetCreateWithoutUserInputSchema),
        z.lazy(() => SnippetCreateWithoutUserInputSchema).array(),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => SnippetCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => SnippetUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => SnippetUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => SnippetCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => SnippetWhereUniqueInputSchema),
        z.lazy(() => SnippetWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => SnippetUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => SnippetUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => SnippetUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => SnippetUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => SnippetScalarWhereInputSchema),
        z.lazy(() => SnippetScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutBookmarksInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutBookmarksInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutBookmarksInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutBookmarksInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutBookmarksInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutBookmarksNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutBookmarksNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutBookmarksInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutBookmarksInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutBookmarksInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutBookmarksInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutBookmarksInputSchema),
        z.lazy(() => UserUpdateWithoutBookmarksInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutBookmarksInputSchema),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutSnippetsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSnippetsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutSnippetsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutSnippetsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutSnippetsInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutSnippetsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSnippetsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutSnippetsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutSnippetsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutSnippetsInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutSnippetsInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutSnippetsInputSchema),
        z.lazy(() => UserUpdateWithoutSnippetsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutSnippetsInputSchema),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutNewsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutNewsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutNewsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutNewsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutNewsInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutNewsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutNewsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutNewsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutNewsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutNewsInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutNewsInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutNewsInputSchema),
        z.lazy(() => UserUpdateWithoutNewsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutNewsInputSchema),
      ])
      .optional(),
  });

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> =
  z.strictObject({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z.union([z.number(), z.lazy(() => NestedIntFilterSchema)]).optional(),
  });

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> =
  z.strictObject({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringFilterSchema)])
      .optional(),
  });

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> =
  z.strictObject({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringNullableFilterSchema)])
      .optional()
      .nullable(),
  });

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> =
  z.strictObject({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleFilterSchema),
      ])
      .optional(),
  });

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> =
  z.strictObject({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
      .union([z.coerce.date(), z.lazy(() => NestedDateTimeFilterSchema)])
      .optional(),
  });

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> =
  z.strictObject({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedIntWithAggregatesFilterSchema)])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
    _sum: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedIntFilterSchema).optional(),
    _max: z.lazy(() => NestedIntFilterSchema).optional(),
  });

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> =
  z.strictObject({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedFloatFilterSchema)])
      .optional(),
  });

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> =
  z.strictObject({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringWithAggregatesFilterSchema)])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedStringFilterSchema).optional(),
    _max: z.lazy(() => NestedStringFilterSchema).optional(),
  });

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> =
  z.strictObject({
    equals: z.string().optional().nullable(),
    in: z.string().array().optional().nullable(),
    notIn: z.string().array().optional().nullable(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
      .union([
        z.string(),
        z.lazy(() => NestedStringNullableWithAggregatesFilterSchema),
      ])
      .optional()
      .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  });

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> =
  z.strictObject({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedIntNullableFilterSchema)])
      .optional()
      .nullable(),
  });

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> =
  z.strictObject({
    equals: z.lazy(() => RoleSchema).optional(),
    in: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => RoleSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  });

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> =
  z.strictObject({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
      .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeWithAggregatesFilterSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
    _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  });

export const BookmarkCreateWithoutUserInputSchema: z.ZodType<Prisma.BookmarkCreateWithoutUserInput> =
  z.strictObject({
    title: z.string(),
    url: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const BookmarkUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    url: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const BookmarkCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.BookmarkCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => BookmarkWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => BookmarkCreateWithoutUserInputSchema),
      z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const BookmarkCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.BookmarkCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => BookmarkCreateManyUserInputSchema),
      z.lazy(() => BookmarkCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const NewsCreateWithoutUserInputSchema: z.ZodType<Prisma.NewsCreateWithoutUserInput> =
  z.strictObject({
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NewsUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.NewsUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NewsCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.NewsCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NewsWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => NewsCreateWithoutUserInputSchema),
      z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const NewsCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.NewsCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => NewsCreateManyUserInputSchema),
      z.lazy(() => NewsCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const SnippetCreateWithoutUserInputSchema: z.ZodType<Prisma.SnippetCreateWithoutUserInput> =
  z.strictObject({
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const SnippetUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SnippetUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const SnippetCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SnippetCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => SnippetWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => SnippetCreateWithoutUserInputSchema),
      z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const SnippetCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SnippetCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => SnippetCreateManyUserInputSchema),
      z.lazy(() => SnippetCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const BookmarkUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => BookmarkWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => BookmarkUpdateWithoutUserInputSchema),
      z.lazy(() => BookmarkUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => BookmarkCreateWithoutUserInputSchema),
      z.lazy(() => BookmarkUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const BookmarkUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => BookmarkWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => BookmarkUpdateWithoutUserInputSchema),
      z.lazy(() => BookmarkUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const BookmarkUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => BookmarkScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => BookmarkUpdateManyMutationInputSchema),
      z.lazy(() => BookmarkUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const BookmarkScalarWhereInputSchema: z.ZodType<Prisma.BookmarkScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => BookmarkScalarWhereInputSchema),
        z.lazy(() => BookmarkScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => BookmarkScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => BookmarkScalarWhereInputSchema),
        z.lazy(() => BookmarkScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    url: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const NewsUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.NewsUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NewsWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => NewsUpdateWithoutUserInputSchema),
      z.lazy(() => NewsUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => NewsCreateWithoutUserInputSchema),
      z.lazy(() => NewsUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const NewsUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.NewsUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NewsWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => NewsUpdateWithoutUserInputSchema),
      z.lazy(() => NewsUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const NewsUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.NewsUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NewsScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => NewsUpdateManyMutationInputSchema),
      z.lazy(() => NewsUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const NewsScalarWhereInputSchema: z.ZodType<Prisma.NewsScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => NewsScalarWhereInputSchema),
        z.lazy(() => NewsScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => NewsScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => NewsScalarWhereInputSchema),
        z.lazy(() => NewsScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const SnippetUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SnippetUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => SnippetWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => SnippetUpdateWithoutUserInputSchema),
      z.lazy(() => SnippetUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => SnippetCreateWithoutUserInputSchema),
      z.lazy(() => SnippetUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const SnippetUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SnippetUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => SnippetWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => SnippetUpdateWithoutUserInputSchema),
      z.lazy(() => SnippetUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const SnippetUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SnippetUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => SnippetScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => SnippetUpdateManyMutationInputSchema),
      z.lazy(() => SnippetUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const SnippetScalarWhereInputSchema: z.ZodType<Prisma.SnippetScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => SnippetScalarWhereInputSchema),
        z.lazy(() => SnippetScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => SnippetScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => SnippetScalarWhereInputSchema),
        z.lazy(() => SnippetScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const UserCreateWithoutBookmarksInputSchema: z.ZodType<Prisma.UserCreateWithoutBookmarksInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    news: z.lazy(() => NewsCreateNestedManyWithoutUserInputSchema).optional(),
    snippets: z
      .lazy(() => SnippetCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutBookmarksInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutBookmarksInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    news: z
      .lazy(() => NewsUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutBookmarksInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutBookmarksInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutBookmarksInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutBookmarksInputSchema),
    ]),
  });

export const UserUpsertWithoutBookmarksInputSchema: z.ZodType<Prisma.UserUpsertWithoutBookmarksInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutBookmarksInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutBookmarksInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutBookmarksInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutBookmarksInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutBookmarksInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutBookmarksInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutBookmarksInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutBookmarksInputSchema),
    ]),
  });

export const UserUpdateWithoutBookmarksInputSchema: z.ZodType<Prisma.UserUpdateWithoutBookmarksInput> =
  z.strictObject({
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    news: z.lazy(() => NewsUpdateManyWithoutUserNestedInputSchema).optional(),
    snippets: z
      .lazy(() => SnippetUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutBookmarksInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutBookmarksInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    news: z
      .lazy(() => NewsUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateWithoutSnippetsInputSchema: z.ZodType<Prisma.UserCreateWithoutSnippetsInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
      .optional(),
    news: z.lazy(() => NewsCreateNestedManyWithoutUserInputSchema).optional(),
  });

export const UserUncheckedCreateWithoutSnippetsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSnippetsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    news: z
      .lazy(() => NewsUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutSnippetsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSnippetsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutSnippetsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutSnippetsInputSchema),
    ]),
  });

export const UserUpsertWithoutSnippetsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSnippetsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutSnippetsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutSnippetsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutSnippetsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutSnippetsInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutSnippetsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSnippetsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutSnippetsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutSnippetsInputSchema),
    ]),
  });

export const UserUpdateWithoutSnippetsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSnippetsInput> =
  z.strictObject({
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    news: z.lazy(() => NewsUpdateManyWithoutUserNestedInputSchema).optional(),
  });

export const UserUncheckedUpdateWithoutSnippetsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSnippetsInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    news: z
      .lazy(() => NewsUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateWithoutNewsInputSchema: z.ZodType<Prisma.UserCreateWithoutNewsInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutNewsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutNewsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutNewsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutNewsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutNewsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutNewsInputSchema),
    ]),
  });

export const UserUpsertWithoutNewsInputSchema: z.ZodType<Prisma.UserUpsertWithoutNewsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutNewsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutNewsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutNewsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutNewsInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutNewsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutNewsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutNewsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutNewsInputSchema),
    ]),
  });

export const UserUpdateWithoutNewsInputSchema: z.ZodType<Prisma.UserUpdateWithoutNewsInput> =
  z.strictObject({
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutNewsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutNewsInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    password: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    hashedRefreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    role: z
      .union([
        z.lazy(() => RoleSchema),
        z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    snippets: z
      .lazy(() => SnippetUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const BookmarkCreateManyUserInputSchema: z.ZodType<Prisma.BookmarkCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    url: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NewsCreateManyUserInputSchema: z.ZodType<Prisma.NewsCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const SnippetCreateManyUserInputSchema: z.ZodType<Prisma.SnippetCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const BookmarkUpdateWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUpdateWithoutUserInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const BookmarkUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUncheckedUpdateWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const BookmarkUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.BookmarkUncheckedUpdateManyWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    url: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NewsUpdateWithoutUserInputSchema: z.ZodType<Prisma.NewsUpdateWithoutUserInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NewsUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.NewsUncheckedUpdateWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NewsUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.NewsUncheckedUpdateManyWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const SnippetUpdateWithoutUserInputSchema: z.ZodType<Prisma.SnippetUpdateWithoutUserInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const SnippetUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SnippetUncheckedUpdateWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const SnippetUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SnippetUncheckedUpdateManyWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> =
  z
    .object({
      select: UserSelectSchema.optional(),
      include: UserIncludeSchema.optional(),
      where: UserWhereInputSchema.optional(),
      orderBy: z
        .union([
          UserOrderByWithRelationInputSchema.array(),
          UserOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: UserWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array()])
        .optional(),
    })
    .strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithAggregationInputSchema.array(),
        UserOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: UserScalarFieldEnumSchema.array(),
    having: UserScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> =
  z
    .object({
      select: UserSelectSchema.optional(),
      include: UserIncludeSchema.optional(),
      where: UserWhereUniqueInputSchema,
    })
    .strict();

export const BookmarkFindFirstArgsSchema: z.ZodType<Prisma.BookmarkFindFirstArgs> =
  z
    .object({
      select: BookmarkSelectSchema.optional(),
      include: BookmarkIncludeSchema.optional(),
      where: BookmarkWhereInputSchema.optional(),
      orderBy: z
        .union([
          BookmarkOrderByWithRelationInputSchema.array(),
          BookmarkOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: BookmarkWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          BookmarkScalarFieldEnumSchema,
          BookmarkScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const BookmarkFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BookmarkFindFirstOrThrowArgs> =
  z
    .object({
      select: BookmarkSelectSchema.optional(),
      include: BookmarkIncludeSchema.optional(),
      where: BookmarkWhereInputSchema.optional(),
      orderBy: z
        .union([
          BookmarkOrderByWithRelationInputSchema.array(),
          BookmarkOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: BookmarkWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          BookmarkScalarFieldEnumSchema,
          BookmarkScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const BookmarkFindManyArgsSchema: z.ZodType<Prisma.BookmarkFindManyArgs> =
  z
    .object({
      select: BookmarkSelectSchema.optional(),
      include: BookmarkIncludeSchema.optional(),
      where: BookmarkWhereInputSchema.optional(),
      orderBy: z
        .union([
          BookmarkOrderByWithRelationInputSchema.array(),
          BookmarkOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: BookmarkWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          BookmarkScalarFieldEnumSchema,
          BookmarkScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const BookmarkAggregateArgsSchema: z.ZodType<Prisma.BookmarkAggregateArgs> =
  z
    .object({
      where: BookmarkWhereInputSchema.optional(),
      orderBy: z
        .union([
          BookmarkOrderByWithRelationInputSchema.array(),
          BookmarkOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: BookmarkWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const BookmarkGroupByArgsSchema: z.ZodType<Prisma.BookmarkGroupByArgs> =
  z
    .object({
      where: BookmarkWhereInputSchema.optional(),
      orderBy: z
        .union([
          BookmarkOrderByWithAggregationInputSchema.array(),
          BookmarkOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: BookmarkScalarFieldEnumSchema.array(),
      having: BookmarkScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const BookmarkFindUniqueArgsSchema: z.ZodType<Prisma.BookmarkFindUniqueArgs> =
  z
    .object({
      select: BookmarkSelectSchema.optional(),
      include: BookmarkIncludeSchema.optional(),
      where: BookmarkWhereUniqueInputSchema,
    })
    .strict();

export const BookmarkFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BookmarkFindUniqueOrThrowArgs> =
  z
    .object({
      select: BookmarkSelectSchema.optional(),
      include: BookmarkIncludeSchema.optional(),
      where: BookmarkWhereUniqueInputSchema,
    })
    .strict();

export const SnippetFindFirstArgsSchema: z.ZodType<Prisma.SnippetFindFirstArgs> =
  z
    .object({
      select: SnippetSelectSchema.optional(),
      include: SnippetIncludeSchema.optional(),
      where: SnippetWhereInputSchema.optional(),
      orderBy: z
        .union([
          SnippetOrderByWithRelationInputSchema.array(),
          SnippetOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: SnippetWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          SnippetScalarFieldEnumSchema,
          SnippetScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const SnippetFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SnippetFindFirstOrThrowArgs> =
  z
    .object({
      select: SnippetSelectSchema.optional(),
      include: SnippetIncludeSchema.optional(),
      where: SnippetWhereInputSchema.optional(),
      orderBy: z
        .union([
          SnippetOrderByWithRelationInputSchema.array(),
          SnippetOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: SnippetWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          SnippetScalarFieldEnumSchema,
          SnippetScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const SnippetFindManyArgsSchema: z.ZodType<Prisma.SnippetFindManyArgs> =
  z
    .object({
      select: SnippetSelectSchema.optional(),
      include: SnippetIncludeSchema.optional(),
      where: SnippetWhereInputSchema.optional(),
      orderBy: z
        .union([
          SnippetOrderByWithRelationInputSchema.array(),
          SnippetOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: SnippetWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          SnippetScalarFieldEnumSchema,
          SnippetScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const SnippetAggregateArgsSchema: z.ZodType<Prisma.SnippetAggregateArgs> =
  z
    .object({
      where: SnippetWhereInputSchema.optional(),
      orderBy: z
        .union([
          SnippetOrderByWithRelationInputSchema.array(),
          SnippetOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: SnippetWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const SnippetGroupByArgsSchema: z.ZodType<Prisma.SnippetGroupByArgs> = z
  .object({
    where: SnippetWhereInputSchema.optional(),
    orderBy: z
      .union([
        SnippetOrderByWithAggregationInputSchema.array(),
        SnippetOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: SnippetScalarFieldEnumSchema.array(),
    having: SnippetScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const SnippetFindUniqueArgsSchema: z.ZodType<Prisma.SnippetFindUniqueArgs> =
  z
    .object({
      select: SnippetSelectSchema.optional(),
      include: SnippetIncludeSchema.optional(),
      where: SnippetWhereUniqueInputSchema,
    })
    .strict();

export const SnippetFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SnippetFindUniqueOrThrowArgs> =
  z
    .object({
      select: SnippetSelectSchema.optional(),
      include: SnippetIncludeSchema.optional(),
      where: SnippetWhereUniqueInputSchema,
    })
    .strict();

export const NewsFindFirstArgsSchema: z.ZodType<Prisma.NewsFindFirstArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    where: NewsWhereInputSchema.optional(),
    orderBy: z
      .union([
        NewsOrderByWithRelationInputSchema.array(),
        NewsOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: NewsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([NewsScalarFieldEnumSchema, NewsScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const NewsFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NewsFindFirstOrThrowArgs> =
  z
    .object({
      select: NewsSelectSchema.optional(),
      include: NewsIncludeSchema.optional(),
      where: NewsWhereInputSchema.optional(),
      orderBy: z
        .union([
          NewsOrderByWithRelationInputSchema.array(),
          NewsOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: NewsWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([NewsScalarFieldEnumSchema, NewsScalarFieldEnumSchema.array()])
        .optional(),
    })
    .strict();

export const NewsFindManyArgsSchema: z.ZodType<Prisma.NewsFindManyArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    where: NewsWhereInputSchema.optional(),
    orderBy: z
      .union([
        NewsOrderByWithRelationInputSchema.array(),
        NewsOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: NewsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([NewsScalarFieldEnumSchema, NewsScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const NewsAggregateArgsSchema: z.ZodType<Prisma.NewsAggregateArgs> = z
  .object({
    where: NewsWhereInputSchema.optional(),
    orderBy: z
      .union([
        NewsOrderByWithRelationInputSchema.array(),
        NewsOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: NewsWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const NewsGroupByArgsSchema: z.ZodType<Prisma.NewsGroupByArgs> = z
  .object({
    where: NewsWhereInputSchema.optional(),
    orderBy: z
      .union([
        NewsOrderByWithAggregationInputSchema.array(),
        NewsOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: NewsScalarFieldEnumSchema.array(),
    having: NewsScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const NewsFindUniqueArgsSchema: z.ZodType<Prisma.NewsFindUniqueArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    where: NewsWhereUniqueInputSchema,
  })
  .strict();

export const NewsFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NewsFindUniqueOrThrowArgs> =
  z
    .object({
      select: NewsSelectSchema.optional(),
      include: NewsIncludeSchema.optional(),
      where: NewsWhereUniqueInputSchema,
    })
    .strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    data: z.union([UserCreateInputSchema, UserUncheckedCreateInputSchema]),
  })
  .strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    where: UserWhereUniqueInputSchema,
    create: z.union([UserCreateInputSchema, UserUncheckedCreateInputSchema]),
    update: z.union([UserUpdateInputSchema, UserUncheckedUpdateInputSchema]),
  })
  .strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z
  .object({
    data: z.union([
      UserCreateManyInputSchema,
      UserCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        UserCreateManyInputSchema,
        UserCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    include: UserIncludeSchema.optional(),
    data: z.union([UserUpdateInputSchema, UserUncheckedUpdateInputSchema]),
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z
  .object({
    data: z.union([
      UserUpdateManyMutationInputSchema,
      UserUncheckedUpdateManyInputSchema,
    ]),
    where: UserWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        UserUpdateManyMutationInputSchema,
        UserUncheckedUpdateManyInputSchema,
      ]),
      where: UserWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z
  .object({
    where: UserWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const BookmarkCreateArgsSchema: z.ZodType<Prisma.BookmarkCreateArgs> = z
  .object({
    select: BookmarkSelectSchema.optional(),
    include: BookmarkIncludeSchema.optional(),
    data: z.union([
      BookmarkCreateInputSchema,
      BookmarkUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const BookmarkUpsertArgsSchema: z.ZodType<Prisma.BookmarkUpsertArgs> = z
  .object({
    select: BookmarkSelectSchema.optional(),
    include: BookmarkIncludeSchema.optional(),
    where: BookmarkWhereUniqueInputSchema,
    create: z.union([
      BookmarkCreateInputSchema,
      BookmarkUncheckedCreateInputSchema,
    ]),
    update: z.union([
      BookmarkUpdateInputSchema,
      BookmarkUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const BookmarkCreateManyArgsSchema: z.ZodType<Prisma.BookmarkCreateManyArgs> =
  z
    .object({
      data: z.union([
        BookmarkCreateManyInputSchema,
        BookmarkCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const BookmarkCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BookmarkCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        BookmarkCreateManyInputSchema,
        BookmarkCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const BookmarkDeleteArgsSchema: z.ZodType<Prisma.BookmarkDeleteArgs> = z
  .object({
    select: BookmarkSelectSchema.optional(),
    include: BookmarkIncludeSchema.optional(),
    where: BookmarkWhereUniqueInputSchema,
  })
  .strict();

export const BookmarkUpdateArgsSchema: z.ZodType<Prisma.BookmarkUpdateArgs> = z
  .object({
    select: BookmarkSelectSchema.optional(),
    include: BookmarkIncludeSchema.optional(),
    data: z.union([
      BookmarkUpdateInputSchema,
      BookmarkUncheckedUpdateInputSchema,
    ]),
    where: BookmarkWhereUniqueInputSchema,
  })
  .strict();

export const BookmarkUpdateManyArgsSchema: z.ZodType<Prisma.BookmarkUpdateManyArgs> =
  z
    .object({
      data: z.union([
        BookmarkUpdateManyMutationInputSchema,
        BookmarkUncheckedUpdateManyInputSchema,
      ]),
      where: BookmarkWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const BookmarkUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.BookmarkUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        BookmarkUpdateManyMutationInputSchema,
        BookmarkUncheckedUpdateManyInputSchema,
      ]),
      where: BookmarkWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const BookmarkDeleteManyArgsSchema: z.ZodType<Prisma.BookmarkDeleteManyArgs> =
  z
    .object({
      where: BookmarkWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const SnippetCreateArgsSchema: z.ZodType<Prisma.SnippetCreateArgs> = z
  .object({
    select: SnippetSelectSchema.optional(),
    include: SnippetIncludeSchema.optional(),
    data: z.union([
      SnippetCreateInputSchema,
      SnippetUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const SnippetUpsertArgsSchema: z.ZodType<Prisma.SnippetUpsertArgs> = z
  .object({
    select: SnippetSelectSchema.optional(),
    include: SnippetIncludeSchema.optional(),
    where: SnippetWhereUniqueInputSchema,
    create: z.union([
      SnippetCreateInputSchema,
      SnippetUncheckedCreateInputSchema,
    ]),
    update: z.union([
      SnippetUpdateInputSchema,
      SnippetUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const SnippetCreateManyArgsSchema: z.ZodType<Prisma.SnippetCreateManyArgs> =
  z
    .object({
      data: z.union([
        SnippetCreateManyInputSchema,
        SnippetCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const SnippetCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SnippetCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        SnippetCreateManyInputSchema,
        SnippetCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const SnippetDeleteArgsSchema: z.ZodType<Prisma.SnippetDeleteArgs> = z
  .object({
    select: SnippetSelectSchema.optional(),
    include: SnippetIncludeSchema.optional(),
    where: SnippetWhereUniqueInputSchema,
  })
  .strict();

export const SnippetUpdateArgsSchema: z.ZodType<Prisma.SnippetUpdateArgs> = z
  .object({
    select: SnippetSelectSchema.optional(),
    include: SnippetIncludeSchema.optional(),
    data: z.union([
      SnippetUpdateInputSchema,
      SnippetUncheckedUpdateInputSchema,
    ]),
    where: SnippetWhereUniqueInputSchema,
  })
  .strict();

export const SnippetUpdateManyArgsSchema: z.ZodType<Prisma.SnippetUpdateManyArgs> =
  z
    .object({
      data: z.union([
        SnippetUpdateManyMutationInputSchema,
        SnippetUncheckedUpdateManyInputSchema,
      ]),
      where: SnippetWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const SnippetUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SnippetUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        SnippetUpdateManyMutationInputSchema,
        SnippetUncheckedUpdateManyInputSchema,
      ]),
      where: SnippetWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const SnippetDeleteManyArgsSchema: z.ZodType<Prisma.SnippetDeleteManyArgs> =
  z
    .object({
      where: SnippetWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const NewsCreateArgsSchema: z.ZodType<Prisma.NewsCreateArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    data: z.union([NewsCreateInputSchema, NewsUncheckedCreateInputSchema]),
  })
  .strict();

export const NewsUpsertArgsSchema: z.ZodType<Prisma.NewsUpsertArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    where: NewsWhereUniqueInputSchema,
    create: z.union([NewsCreateInputSchema, NewsUncheckedCreateInputSchema]),
    update: z.union([NewsUpdateInputSchema, NewsUncheckedUpdateInputSchema]),
  })
  .strict();

export const NewsCreateManyArgsSchema: z.ZodType<Prisma.NewsCreateManyArgs> = z
  .object({
    data: z.union([
      NewsCreateManyInputSchema,
      NewsCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const NewsCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NewsCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NewsCreateManyInputSchema,
        NewsCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NewsDeleteArgsSchema: z.ZodType<Prisma.NewsDeleteArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    where: NewsWhereUniqueInputSchema,
  })
  .strict();

export const NewsUpdateArgsSchema: z.ZodType<Prisma.NewsUpdateArgs> = z
  .object({
    select: NewsSelectSchema.optional(),
    include: NewsIncludeSchema.optional(),
    data: z.union([NewsUpdateInputSchema, NewsUncheckedUpdateInputSchema]),
    where: NewsWhereUniqueInputSchema,
  })
  .strict();

export const NewsUpdateManyArgsSchema: z.ZodType<Prisma.NewsUpdateManyArgs> = z
  .object({
    data: z.union([
      NewsUpdateManyMutationInputSchema,
      NewsUncheckedUpdateManyInputSchema,
    ]),
    where: NewsWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const NewsUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.NewsUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NewsUpdateManyMutationInputSchema,
        NewsUncheckedUpdateManyInputSchema,
      ]),
      where: NewsWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const NewsDeleteManyArgsSchema: z.ZodType<Prisma.NewsDeleteManyArgs> = z
  .object({
    where: NewsWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();
