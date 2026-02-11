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

export const CalculationScalarFieldEnumSchema = z.enum([
  'id',
  'expression',
  'result',
  'userId',
  'createdAt',
]);

export const NoteScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'content',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const TaskScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'done',
  'userId',
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
// CALCULATION SCHEMA
/////////////////////////////////////////

export const CalculationSchema = z.object({
  id: z.number().int(),
  expression: z.string(),
  result: z.string(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
});

export type Calculation = z.infer<typeof CalculationSchema>;

/////////////////////////////////////////
// NOTE SCHEMA
/////////////////////////////////////////

export const NoteSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Note = z.infer<typeof NoteSchema>;

/////////////////////////////////////////
// TASK SCHEMA
/////////////////////////////////////////

export const TaskSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  done: z.boolean(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Task = z.infer<typeof TaskSchema>;

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
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z
  .object({
    calculations: z
      .union([z.boolean(), z.lazy(() => CalculationFindManyArgsSchema)])
      .optional(),
    notes: z
      .union([z.boolean(), z.lazy(() => NoteFindManyArgsSchema)])
      .optional(),
    tasks: z
      .union([z.boolean(), z.lazy(() => TaskFindManyArgsSchema)])
      .optional(),
    bookmarks: z
      .union([z.boolean(), z.lazy(() => BookmarkFindManyArgsSchema)])
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
      calculations: z.boolean().optional(),
      notes: z.boolean().optional(),
      tasks: z.boolean().optional(),
      bookmarks: z.boolean().optional(),
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
    calculations: z
      .union([z.boolean(), z.lazy(() => CalculationFindManyArgsSchema)])
      .optional(),
    notes: z
      .union([z.boolean(), z.lazy(() => NoteFindManyArgsSchema)])
      .optional(),
    tasks: z
      .union([z.boolean(), z.lazy(() => TaskFindManyArgsSchema)])
      .optional(),
    bookmarks: z
      .union([z.boolean(), z.lazy(() => BookmarkFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => UserCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// CALCULATION
//------------------------------------------------------

export const CalculationIncludeSchema: z.ZodType<Prisma.CalculationInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const CalculationArgsSchema: z.ZodType<Prisma.CalculationDefaultArgs> = z
  .object({
    select: z.lazy(() => CalculationSelectSchema).optional(),
    include: z.lazy(() => CalculationIncludeSchema).optional(),
  })
  .strict();

export const CalculationSelectSchema: z.ZodType<Prisma.CalculationSelect> = z
  .object({
    id: z.boolean().optional(),
    expression: z.boolean().optional(),
    result: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

// NOTE
//------------------------------------------------------

export const NoteIncludeSchema: z.ZodType<Prisma.NoteInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const NoteArgsSchema: z.ZodType<Prisma.NoteDefaultArgs> = z
  .object({
    select: z.lazy(() => NoteSelectSchema).optional(),
    include: z.lazy(() => NoteIncludeSchema).optional(),
  })
  .strict();

export const NoteSelectSchema: z.ZodType<Prisma.NoteSelect> = z
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

// TASK
//------------------------------------------------------

export const TaskIncludeSchema: z.ZodType<Prisma.TaskInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const TaskArgsSchema: z.ZodType<Prisma.TaskDefaultArgs> = z
  .object({
    select: z.lazy(() => TaskSelectSchema).optional(),
    include: z.lazy(() => TaskIncludeSchema).optional(),
  })
  .strict();

export const TaskSelectSchema: z.ZodType<Prisma.TaskSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    done: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
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
    calculations: z.lazy(() => CalculationListRelationFilterSchema).optional(),
    notes: z.lazy(() => NoteListRelationFilterSchema).optional(),
    tasks: z.lazy(() => TaskListRelationFilterSchema).optional(),
    bookmarks: z.lazy(() => BookmarkListRelationFilterSchema).optional(),
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
    calculations: z
      .lazy(() => CalculationOrderByRelationAggregateInputSchema)
      .optional(),
    notes: z.lazy(() => NoteOrderByRelationAggregateInputSchema).optional(),
    tasks: z.lazy(() => TaskOrderByRelationAggregateInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkOrderByRelationAggregateInputSchema)
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
        calculations: z
          .lazy(() => CalculationListRelationFilterSchema)
          .optional(),
        notes: z.lazy(() => NoteListRelationFilterSchema).optional(),
        tasks: z.lazy(() => TaskListRelationFilterSchema).optional(),
        bookmarks: z.lazy(() => BookmarkListRelationFilterSchema).optional(),
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

export const CalculationWhereInputSchema: z.ZodType<Prisma.CalculationWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => CalculationWhereInputSchema),
        z.lazy(() => CalculationWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CalculationWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CalculationWhereInputSchema),
        z.lazy(() => CalculationWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    expression: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    result: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  });

export const CalculationOrderByWithRelationInputSchema: z.ZodType<Prisma.CalculationOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    expression: z.lazy(() => SortOrderSchema).optional(),
    result: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const CalculationWhereUniqueInputSchema: z.ZodType<Prisma.CalculationWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => CalculationWhereInputSchema),
            z.lazy(() => CalculationWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => CalculationWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => CalculationWhereInputSchema),
            z.lazy(() => CalculationWhereInputSchema).array(),
          ])
          .optional(),
        expression: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        result: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        userId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        createdAt: z
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

export const CalculationOrderByWithAggregationInputSchema: z.ZodType<Prisma.CalculationOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    expression: z.lazy(() => SortOrderSchema).optional(),
    result: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => CalculationCountOrderByAggregateInputSchema)
      .optional(),
    _avg: z.lazy(() => CalculationAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => CalculationMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => CalculationMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => CalculationSumOrderByAggregateInputSchema).optional(),
  });

export const CalculationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CalculationScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => CalculationScalarWhereWithAggregatesInputSchema),
        z.lazy(() => CalculationScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CalculationScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CalculationScalarWhereWithAggregatesInputSchema),
        z.lazy(() => CalculationScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    expression: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    result: z
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
  });

export const NoteWhereInputSchema: z.ZodType<Prisma.NoteWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => NoteWhereInputSchema),
        z.lazy(() => NoteWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => NoteWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => NoteWhereInputSchema),
        z.lazy(() => NoteWhereInputSchema).array(),
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

export const NoteOrderByWithRelationInputSchema: z.ZodType<Prisma.NoteOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const NoteWhereUniqueInputSchema: z.ZodType<Prisma.NoteWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => NoteWhereInputSchema),
            z.lazy(() => NoteWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => NoteWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => NoteWhereInputSchema),
            z.lazy(() => NoteWhereInputSchema).array(),
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

export const NoteOrderByWithAggregationInputSchema: z.ZodType<Prisma.NoteOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => NoteCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => NoteAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => NoteMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => NoteMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => NoteSumOrderByAggregateInputSchema).optional(),
  });

export const NoteScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NoteScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => NoteScalarWhereWithAggregatesInputSchema),
        z.lazy(() => NoteScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => NoteScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => NoteScalarWhereWithAggregatesInputSchema),
        z.lazy(() => NoteScalarWhereWithAggregatesInputSchema).array(),
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

export const TaskWhereInputSchema: z.ZodType<Prisma.TaskWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TaskWhereInputSchema),
        z.lazy(() => TaskWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TaskWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TaskWhereInputSchema),
        z.lazy(() => TaskWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    done: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
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

export const TaskOrderByWithRelationInputSchema: z.ZodType<Prisma.TaskOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    done: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const TaskWhereUniqueInputSchema: z.ZodType<Prisma.TaskWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => TaskWhereInputSchema),
            z.lazy(() => TaskWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => TaskWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => TaskWhereInputSchema),
            z.lazy(() => TaskWhereInputSchema).array(),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        done: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
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

export const TaskOrderByWithAggregationInputSchema: z.ZodType<Prisma.TaskOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    done: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => TaskCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => TaskAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => TaskMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => TaskMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => TaskSumOrderByAggregateInputSchema).optional(),
  });

export const TaskScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TaskScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TaskScalarWhereWithAggregatesInputSchema),
        z.lazy(() => TaskScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TaskScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TaskScalarWhereWithAggregatesInputSchema),
        z.lazy(() => TaskScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    title: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    done: z
      .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
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

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    calculations: z
      .lazy(() => CalculationCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
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
    calculations: z
      .lazy(() => CalculationUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
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
    calculations: z
      .lazy(() => CalculationUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
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
    calculations: z
      .lazy(() => CalculationUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
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

export const CalculationCreateInputSchema: z.ZodType<Prisma.CalculationCreateInput> =
  z.strictObject({
    expression: z.string(),
    result: z.string(),
    createdAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutCalculationsInputSchema),
  });

export const CalculationUncheckedCreateInputSchema: z.ZodType<Prisma.CalculationUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    expression: z.string(),
    result: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
  });

export const CalculationUpdateInputSchema: z.ZodType<Prisma.CalculationUpdateInput> =
  z.strictObject({
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    user: z
      .lazy(() => UserUpdateOneRequiredWithoutCalculationsNestedInputSchema)
      .optional(),
  });

export const CalculationUncheckedUpdateInputSchema: z.ZodType<Prisma.CalculationUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
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
  });

export const CalculationCreateManyInputSchema: z.ZodType<Prisma.CalculationCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    expression: z.string(),
    result: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
  });

export const CalculationUpdateManyMutationInputSchema: z.ZodType<Prisma.CalculationUpdateManyMutationInput> =
  z.strictObject({
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const CalculationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CalculationUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
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
  });

export const NoteCreateInputSchema: z.ZodType<Prisma.NoteCreateInput> =
  z.strictObject({
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutNotesInputSchema),
  });

export const NoteUncheckedCreateInputSchema: z.ZodType<Prisma.NoteUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NoteUpdateInputSchema: z.ZodType<Prisma.NoteUpdateInput> =
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
      .lazy(() => UserUpdateOneRequiredWithoutNotesNestedInputSchema)
      .optional(),
  });

export const NoteUncheckedUpdateInputSchema: z.ZodType<Prisma.NoteUncheckedUpdateInput> =
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

export const NoteCreateManyInputSchema: z.ZodType<Prisma.NoteCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NoteUpdateManyMutationInputSchema: z.ZodType<Prisma.NoteUpdateManyMutationInput> =
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

export const NoteUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NoteUncheckedUpdateManyInput> =
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

export const TaskCreateInputSchema: z.ZodType<Prisma.TaskCreateInput> =
  z.strictObject({
    title: z.string(),
    done: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutTasksInputSchema),
  });

export const TaskUncheckedCreateInputSchema: z.ZodType<Prisma.TaskUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    done: z.boolean().optional(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskUpdateInputSchema: z.ZodType<Prisma.TaskUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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
      .lazy(() => UserUpdateOneRequiredWithoutTasksNestedInputSchema)
      .optional(),
  });

export const TaskUncheckedUpdateInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateInput> =
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
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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

export const TaskCreateManyInputSchema: z.ZodType<Prisma.TaskCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    done: z.boolean().optional(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskUpdateManyMutationInputSchema: z.ZodType<Prisma.TaskUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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

export const TaskUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateManyInput> =
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
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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

export const CalculationListRelationFilterSchema: z.ZodType<Prisma.CalculationListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => CalculationWhereInputSchema).optional(),
    some: z.lazy(() => CalculationWhereInputSchema).optional(),
    none: z.lazy(() => CalculationWhereInputSchema).optional(),
  });

export const NoteListRelationFilterSchema: z.ZodType<Prisma.NoteListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => NoteWhereInputSchema).optional(),
    some: z.lazy(() => NoteWhereInputSchema).optional(),
    none: z.lazy(() => NoteWhereInputSchema).optional(),
  });

export const TaskListRelationFilterSchema: z.ZodType<Prisma.TaskListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => TaskWhereInputSchema).optional(),
    some: z.lazy(() => TaskWhereInputSchema).optional(),
    none: z.lazy(() => TaskWhereInputSchema).optional(),
  });

export const BookmarkListRelationFilterSchema: z.ZodType<Prisma.BookmarkListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => BookmarkWhereInputSchema).optional(),
    some: z.lazy(() => BookmarkWhereInputSchema).optional(),
    none: z.lazy(() => BookmarkWhereInputSchema).optional(),
  });

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> =
  z.strictObject({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
  });

export const CalculationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CalculationOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const NoteOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NoteOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const TaskOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TaskOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const BookmarkOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BookmarkOrderByRelationAggregateInput> =
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

export const CalculationCountOrderByAggregateInputSchema: z.ZodType<Prisma.CalculationCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    expression: z.lazy(() => SortOrderSchema).optional(),
    result: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const CalculationAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CalculationAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const CalculationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CalculationMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    expression: z.lazy(() => SortOrderSchema).optional(),
    result: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const CalculationMinOrderByAggregateInputSchema: z.ZodType<Prisma.CalculationMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    expression: z.lazy(() => SortOrderSchema).optional(),
    result: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const CalculationSumOrderByAggregateInputSchema: z.ZodType<Prisma.CalculationSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const NoteCountOrderByAggregateInputSchema: z.ZodType<Prisma.NoteCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const NoteAvgOrderByAggregateInputSchema: z.ZodType<Prisma.NoteAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const NoteMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NoteMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const NoteMinOrderByAggregateInputSchema: z.ZodType<Prisma.NoteMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const NoteSumOrderByAggregateInputSchema: z.ZodType<Prisma.NoteSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)]).optional(),
});

export const TaskCountOrderByAggregateInputSchema: z.ZodType<Prisma.TaskCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    done: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TaskAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TaskAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const TaskMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TaskMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    done: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TaskMinOrderByAggregateInputSchema: z.ZodType<Prisma.TaskMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    done: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TaskSumOrderByAggregateInputSchema: z.ZodType<Prisma.TaskSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> =
  z.strictObject({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolWithAggregatesFilterSchema)])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedBoolFilterSchema).optional(),
    _max: z.lazy(() => NestedBoolFilterSchema).optional(),
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

export const CalculationCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CalculationCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CalculationCreateWithoutUserInputSchema),
        z.lazy(() => CalculationCreateWithoutUserInputSchema).array(),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CalculationCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const NoteCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.NoteCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NoteCreateWithoutUserInputSchema),
        z.lazy(() => NoteCreateWithoutUserInputSchema).array(),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NoteCreateManyUserInputEnvelopeSchema).optional(),
    connect: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TaskCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.TaskCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TaskCreateWithoutUserInputSchema),
        z.lazy(() => TaskCreateWithoutUserInputSchema).array(),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => TaskCreateManyUserInputEnvelopeSchema).optional(),
    connect: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
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

export const CalculationUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CalculationUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CalculationCreateWithoutUserInputSchema),
        z.lazy(() => CalculationCreateWithoutUserInputSchema).array(),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CalculationCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const NoteUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.NoteUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NoteCreateWithoutUserInputSchema),
        z.lazy(() => NoteCreateWithoutUserInputSchema).array(),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NoteCreateManyUserInputEnvelopeSchema).optional(),
    connect: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TaskUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.TaskUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TaskCreateWithoutUserInputSchema),
        z.lazy(() => TaskCreateWithoutUserInputSchema).array(),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => TaskCreateManyUserInputEnvelopeSchema).optional(),
    connect: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
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

export const CalculationUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CalculationUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CalculationCreateWithoutUserInputSchema),
        z.lazy(() => CalculationCreateWithoutUserInputSchema).array(),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => CalculationUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CalculationUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CalculationCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => CalculationUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CalculationUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => CalculationUpdateManyWithWhereWithoutUserInputSchema),
        z
          .lazy(() => CalculationUpdateManyWithWhereWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => CalculationScalarWhereInputSchema),
        z.lazy(() => CalculationScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const NoteUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.NoteUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NoteCreateWithoutUserInputSchema),
        z.lazy(() => NoteCreateWithoutUserInputSchema).array(),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => NoteUpsertWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NoteUpsertWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NoteCreateManyUserInputEnvelopeSchema).optional(),
    set: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => NoteUpdateWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NoteUpdateWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => NoteUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => NoteUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => NoteScalarWhereInputSchema),
        z.lazy(() => NoteScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TaskUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.TaskUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TaskCreateWithoutUserInputSchema),
        z.lazy(() => TaskCreateWithoutUserInputSchema).array(),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => TaskUpsertWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => TaskUpsertWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => TaskCreateManyUserInputEnvelopeSchema).optional(),
    set: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => TaskUpdateWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => TaskUpdateWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => TaskUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => TaskUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TaskScalarWhereInputSchema),
        z.lazy(() => TaskScalarWhereInputSchema).array(),
      ])
      .optional(),
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

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.number().optional(),
    increment: z.number().optional(),
    decrement: z.number().optional(),
    multiply: z.number().optional(),
    divide: z.number().optional(),
  });

export const CalculationUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CalculationUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CalculationCreateWithoutUserInputSchema),
        z.lazy(() => CalculationCreateWithoutUserInputSchema).array(),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CalculationCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => CalculationUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CalculationUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CalculationCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => CalculationWhereUniqueInputSchema),
        z.lazy(() => CalculationWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => CalculationUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CalculationUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => CalculationUpdateManyWithWhereWithoutUserInputSchema),
        z
          .lazy(() => CalculationUpdateManyWithWhereWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => CalculationScalarWhereInputSchema),
        z.lazy(() => CalculationScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const NoteUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.NoteUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => NoteCreateWithoutUserInputSchema),
        z.lazy(() => NoteCreateWithoutUserInputSchema).array(),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => NoteCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => NoteUpsertWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NoteUpsertWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => NoteCreateManyUserInputEnvelopeSchema).optional(),
    set: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => NoteWhereUniqueInputSchema),
        z.lazy(() => NoteWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => NoteUpdateWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => NoteUpdateWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => NoteUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => NoteUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => NoteScalarWhereInputSchema),
        z.lazy(() => NoteScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TaskUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TaskCreateWithoutUserInputSchema),
        z.lazy(() => TaskCreateWithoutUserInputSchema).array(),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => TaskCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => TaskUpsertWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => TaskUpsertWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z.lazy(() => TaskCreateManyUserInputEnvelopeSchema).optional(),
    set: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TaskWhereUniqueInputSchema),
        z.lazy(() => TaskWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => TaskUpdateWithWhereUniqueWithoutUserInputSchema),
        z.lazy(() => TaskUpdateWithWhereUniqueWithoutUserInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => TaskUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => TaskUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TaskScalarWhereInputSchema),
        z.lazy(() => TaskScalarWhereInputSchema).array(),
      ])
      .optional(),
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

export const UserCreateNestedOneWithoutCalculationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCalculationsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutCalculationsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutCalculationsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutCalculationsInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutCalculationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCalculationsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutCalculationsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutCalculationsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutCalculationsInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutCalculationsInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutCalculationsInputSchema),
        z.lazy(() => UserUpdateWithoutCalculationsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutCalculationsInputSchema),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutNotesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutNotesInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutNotesInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutNotesInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutNotesInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutNotesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutNotesNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutNotesInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutNotesInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutNotesInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutNotesInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutNotesInputSchema),
        z.lazy(() => UserUpdateWithoutNotesInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutNotesInputSchema),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutTasksInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutTasksInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutTasksInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutTasksInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutTasksInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.boolean().optional(),
  });

export const UserUpdateOneRequiredWithoutTasksNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutTasksNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutTasksInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutTasksInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutTasksInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutTasksInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutTasksInputSchema),
        z.lazy(() => UserUpdateWithoutTasksInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutTasksInputSchema),
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

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> =
  z.strictObject({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
      .optional(),
  });

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> =
  z.strictObject({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolWithAggregatesFilterSchema)])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedBoolFilterSchema).optional(),
    _max: z.lazy(() => NestedBoolFilterSchema).optional(),
  });

export const CalculationCreateWithoutUserInputSchema: z.ZodType<Prisma.CalculationCreateWithoutUserInput> =
  z.strictObject({
    expression: z.string(),
    result: z.string(),
    createdAt: z.coerce.date().optional(),
  });

export const CalculationUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.CalculationUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    expression: z.string(),
    result: z.string(),
    createdAt: z.coerce.date().optional(),
  });

export const CalculationCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.CalculationCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CalculationWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => CalculationCreateWithoutUserInputSchema),
      z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const CalculationCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.CalculationCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => CalculationCreateManyUserInputSchema),
      z.lazy(() => CalculationCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const NoteCreateWithoutUserInputSchema: z.ZodType<Prisma.NoteCreateWithoutUserInput> =
  z.strictObject({
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NoteUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.NoteUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const NoteCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.NoteCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NoteWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => NoteCreateWithoutUserInputSchema),
      z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const NoteCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.NoteCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => NoteCreateManyUserInputSchema),
      z.lazy(() => NoteCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TaskCreateWithoutUserInputSchema: z.ZodType<Prisma.TaskCreateWithoutUserInput> =
  z.strictObject({
    title: z.string(),
    done: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.TaskUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    done: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.TaskCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => TaskWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TaskCreateWithoutUserInputSchema),
      z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const TaskCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.TaskCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TaskCreateManyUserInputSchema),
      z.lazy(() => TaskCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
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

export const CalculationUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CalculationUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CalculationWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => CalculationUpdateWithoutUserInputSchema),
      z.lazy(() => CalculationUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => CalculationCreateWithoutUserInputSchema),
      z.lazy(() => CalculationUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const CalculationUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CalculationUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CalculationWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => CalculationUpdateWithoutUserInputSchema),
      z.lazy(() => CalculationUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const CalculationUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.CalculationUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CalculationScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => CalculationUpdateManyMutationInputSchema),
      z.lazy(() => CalculationUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const CalculationScalarWhereInputSchema: z.ZodType<Prisma.CalculationScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => CalculationScalarWhereInputSchema),
        z.lazy(() => CalculationScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CalculationScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CalculationScalarWhereInputSchema),
        z.lazy(() => CalculationScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    expression: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    result: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const NoteUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.NoteUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NoteWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => NoteUpdateWithoutUserInputSchema),
      z.lazy(() => NoteUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => NoteCreateWithoutUserInputSchema),
      z.lazy(() => NoteUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const NoteUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.NoteUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NoteWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => NoteUpdateWithoutUserInputSchema),
      z.lazy(() => NoteUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const NoteUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.NoteUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => NoteScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => NoteUpdateManyMutationInputSchema),
      z.lazy(() => NoteUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const NoteScalarWhereInputSchema: z.ZodType<Prisma.NoteScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => NoteScalarWhereInputSchema),
        z.lazy(() => NoteScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => NoteScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => NoteScalarWhereInputSchema),
        z.lazy(() => NoteScalarWhereInputSchema).array(),
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

export const TaskUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.TaskUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => TaskWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TaskUpdateWithoutUserInputSchema),
      z.lazy(() => TaskUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TaskCreateWithoutUserInputSchema),
      z.lazy(() => TaskUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const TaskUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.TaskUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => TaskWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TaskUpdateWithoutUserInputSchema),
      z.lazy(() => TaskUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const TaskUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.TaskUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => TaskScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TaskUpdateManyMutationInputSchema),
      z.lazy(() => TaskUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const TaskScalarWhereInputSchema: z.ZodType<Prisma.TaskScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TaskScalarWhereInputSchema),
        z.lazy(() => TaskScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TaskScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TaskScalarWhereInputSchema),
        z.lazy(() => TaskScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    done: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
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

export const UserCreateWithoutCalculationsInputSchema: z.ZodType<Prisma.UserCreateWithoutCalculationsInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutCalculationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCalculationsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutCalculationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCalculationsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutCalculationsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutCalculationsInputSchema),
    ]),
  });

export const UserUpsertWithoutCalculationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutCalculationsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutCalculationsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutCalculationsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutCalculationsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutCalculationsInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutCalculationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCalculationsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutCalculationsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutCalculationsInputSchema),
    ]),
  });

export const UserUpdateWithoutCalculationsInputSchema: z.ZodType<Prisma.UserUpdateWithoutCalculationsInput> =
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
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutCalculationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCalculationsInput> =
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
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateWithoutNotesInputSchema: z.ZodType<Prisma.UserCreateWithoutNotesInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    calculations: z
      .lazy(() => CalculationCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutNotesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutNotesInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    calculations: z
      .lazy(() => CalculationUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutNotesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutNotesInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutNotesInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutNotesInputSchema),
    ]),
  });

export const UserUpsertWithoutNotesInputSchema: z.ZodType<Prisma.UserUpsertWithoutNotesInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutNotesInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutNotesInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutNotesInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutNotesInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutNotesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutNotesInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutNotesInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutNotesInputSchema),
    ]),
  });

export const UserUpdateWithoutNotesInputSchema: z.ZodType<Prisma.UserUpdateWithoutNotesInput> =
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
    calculations: z
      .lazy(() => CalculationUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutNotesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutNotesInput> =
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
    calculations: z
      .lazy(() => CalculationUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateWithoutTasksInputSchema: z.ZodType<Prisma.UserCreateWithoutTasksInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    calculations: z
      .lazy(() => CalculationCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutTasksInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutTasksInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    calculations: z
      .lazy(() => CalculationUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutTasksInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutTasksInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutTasksInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutTasksInputSchema),
    ]),
  });

export const UserUpsertWithoutTasksInputSchema: z.ZodType<Prisma.UserUpsertWithoutTasksInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutTasksInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutTasksInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutTasksInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutTasksInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutTasksInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutTasksInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutTasksInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutTasksInputSchema),
    ]),
  });

export const UserUpdateWithoutTasksInputSchema: z.ZodType<Prisma.UserUpdateWithoutTasksInput> =
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
    calculations: z
      .lazy(() => CalculationUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    bookmarks: z
      .lazy(() => BookmarkUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutTasksInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutTasksInput> =
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
    calculations: z
      .lazy(() => CalculationUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    bookmarks: z
      .lazy(() => BookmarkUncheckedUpdateManyWithoutUserNestedInputSchema)
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
    calculations: z
      .lazy(() => CalculationCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
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
    calculations: z
      .lazy(() => CalculationUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
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
    calculations: z
      .lazy(() => CalculationUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
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
    calculations: z
      .lazy(() => CalculationUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const CalculationCreateManyUserInputSchema: z.ZodType<Prisma.CalculationCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    expression: z.string(),
    result: z.string(),
    createdAt: z.coerce.date().optional(),
  });

export const NoteCreateManyUserInputSchema: z.ZodType<Prisma.NoteCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskCreateManyUserInputSchema: z.ZodType<Prisma.TaskCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    done: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const BookmarkCreateManyUserInputSchema: z.ZodType<Prisma.BookmarkCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    url: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const CalculationUpdateWithoutUserInputSchema: z.ZodType<Prisma.CalculationUpdateWithoutUserInput> =
  z.strictObject({
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const CalculationUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.CalculationUncheckedUpdateWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const CalculationUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.CalculationUncheckedUpdateManyWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    expression: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    result: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const NoteUpdateWithoutUserInputSchema: z.ZodType<Prisma.NoteUpdateWithoutUserInput> =
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

export const NoteUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.NoteUncheckedUpdateWithoutUserInput> =
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

export const NoteUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.NoteUncheckedUpdateManyWithoutUserInput> =
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

export const TaskUpdateWithoutUserInputSchema: z.ZodType<Prisma.TaskUpdateWithoutUserInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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

export const TaskUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateWithoutUserInput> =
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
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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

export const TaskUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateManyWithoutUserInput> =
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
    done: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
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

export const CalculationFindFirstArgsSchema: z.ZodType<Prisma.CalculationFindFirstArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereInputSchema.optional(),
      orderBy: z
        .union([
          CalculationOrderByWithRelationInputSchema.array(),
          CalculationOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CalculationWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          CalculationScalarFieldEnumSchema,
          CalculationScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const CalculationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CalculationFindFirstOrThrowArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereInputSchema.optional(),
      orderBy: z
        .union([
          CalculationOrderByWithRelationInputSchema.array(),
          CalculationOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CalculationWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          CalculationScalarFieldEnumSchema,
          CalculationScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const CalculationFindManyArgsSchema: z.ZodType<Prisma.CalculationFindManyArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereInputSchema.optional(),
      orderBy: z
        .union([
          CalculationOrderByWithRelationInputSchema.array(),
          CalculationOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CalculationWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          CalculationScalarFieldEnumSchema,
          CalculationScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const CalculationAggregateArgsSchema: z.ZodType<Prisma.CalculationAggregateArgs> =
  z
    .object({
      where: CalculationWhereInputSchema.optional(),
      orderBy: z
        .union([
          CalculationOrderByWithRelationInputSchema.array(),
          CalculationOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CalculationWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const CalculationGroupByArgsSchema: z.ZodType<Prisma.CalculationGroupByArgs> =
  z
    .object({
      where: CalculationWhereInputSchema.optional(),
      orderBy: z
        .union([
          CalculationOrderByWithAggregationInputSchema.array(),
          CalculationOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: CalculationScalarFieldEnumSchema.array(),
      having: CalculationScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const CalculationFindUniqueArgsSchema: z.ZodType<Prisma.CalculationFindUniqueArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereUniqueInputSchema,
    })
    .strict();

export const CalculationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CalculationFindUniqueOrThrowArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereUniqueInputSchema,
    })
    .strict();

export const NoteFindFirstArgsSchema: z.ZodType<Prisma.NoteFindFirstArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    where: NoteWhereInputSchema.optional(),
    orderBy: z
      .union([
        NoteOrderByWithRelationInputSchema.array(),
        NoteOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: NoteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([NoteScalarFieldEnumSchema, NoteScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const NoteFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NoteFindFirstOrThrowArgs> =
  z
    .object({
      select: NoteSelectSchema.optional(),
      include: NoteIncludeSchema.optional(),
      where: NoteWhereInputSchema.optional(),
      orderBy: z
        .union([
          NoteOrderByWithRelationInputSchema.array(),
          NoteOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: NoteWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([NoteScalarFieldEnumSchema, NoteScalarFieldEnumSchema.array()])
        .optional(),
    })
    .strict();

export const NoteFindManyArgsSchema: z.ZodType<Prisma.NoteFindManyArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    where: NoteWhereInputSchema.optional(),
    orderBy: z
      .union([
        NoteOrderByWithRelationInputSchema.array(),
        NoteOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: NoteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([NoteScalarFieldEnumSchema, NoteScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const NoteAggregateArgsSchema: z.ZodType<Prisma.NoteAggregateArgs> = z
  .object({
    where: NoteWhereInputSchema.optional(),
    orderBy: z
      .union([
        NoteOrderByWithRelationInputSchema.array(),
        NoteOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: NoteWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const NoteGroupByArgsSchema: z.ZodType<Prisma.NoteGroupByArgs> = z
  .object({
    where: NoteWhereInputSchema.optional(),
    orderBy: z
      .union([
        NoteOrderByWithAggregationInputSchema.array(),
        NoteOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: NoteScalarFieldEnumSchema.array(),
    having: NoteScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const NoteFindUniqueArgsSchema: z.ZodType<Prisma.NoteFindUniqueArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    where: NoteWhereUniqueInputSchema,
  })
  .strict();

export const NoteFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NoteFindUniqueOrThrowArgs> =
  z
    .object({
      select: NoteSelectSchema.optional(),
      include: NoteIncludeSchema.optional(),
      where: NoteWhereUniqueInputSchema,
    })
    .strict();

export const TaskFindFirstArgsSchema: z.ZodType<Prisma.TaskFindFirstArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([TaskScalarFieldEnumSchema, TaskScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const TaskFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TaskFindFirstOrThrowArgs> =
  z
    .object({
      select: TaskSelectSchema.optional(),
      include: TaskIncludeSchema.optional(),
      where: TaskWhereInputSchema.optional(),
      orderBy: z
        .union([
          TaskOrderByWithRelationInputSchema.array(),
          TaskOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TaskWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([TaskScalarFieldEnumSchema, TaskScalarFieldEnumSchema.array()])
        .optional(),
    })
    .strict();

export const TaskFindManyArgsSchema: z.ZodType<Prisma.TaskFindManyArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([TaskScalarFieldEnumSchema, TaskScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const TaskAggregateArgsSchema: z.ZodType<Prisma.TaskAggregateArgs> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const TaskGroupByArgsSchema: z.ZodType<Prisma.TaskGroupByArgs> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithAggregationInputSchema.array(),
        TaskOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: TaskScalarFieldEnumSchema.array(),
    having: TaskScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const TaskFindUniqueArgsSchema: z.ZodType<Prisma.TaskFindUniqueArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const TaskFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TaskFindUniqueOrThrowArgs> =
  z
    .object({
      select: TaskSelectSchema.optional(),
      include: TaskIncludeSchema.optional(),
      where: TaskWhereUniqueInputSchema,
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

export const CalculationCreateArgsSchema: z.ZodType<Prisma.CalculationCreateArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      data: z.union([
        CalculationCreateInputSchema,
        CalculationUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const CalculationUpsertArgsSchema: z.ZodType<Prisma.CalculationUpsertArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereUniqueInputSchema,
      create: z.union([
        CalculationCreateInputSchema,
        CalculationUncheckedCreateInputSchema,
      ]),
      update: z.union([
        CalculationUpdateInputSchema,
        CalculationUncheckedUpdateInputSchema,
      ]),
    })
    .strict();

export const CalculationCreateManyArgsSchema: z.ZodType<Prisma.CalculationCreateManyArgs> =
  z
    .object({
      data: z.union([
        CalculationCreateManyInputSchema,
        CalculationCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const CalculationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CalculationCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        CalculationCreateManyInputSchema,
        CalculationCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const CalculationDeleteArgsSchema: z.ZodType<Prisma.CalculationDeleteArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      where: CalculationWhereUniqueInputSchema,
    })
    .strict();

export const CalculationUpdateArgsSchema: z.ZodType<Prisma.CalculationUpdateArgs> =
  z
    .object({
      select: CalculationSelectSchema.optional(),
      include: CalculationIncludeSchema.optional(),
      data: z.union([
        CalculationUpdateInputSchema,
        CalculationUncheckedUpdateInputSchema,
      ]),
      where: CalculationWhereUniqueInputSchema,
    })
    .strict();

export const CalculationUpdateManyArgsSchema: z.ZodType<Prisma.CalculationUpdateManyArgs> =
  z
    .object({
      data: z.union([
        CalculationUpdateManyMutationInputSchema,
        CalculationUncheckedUpdateManyInputSchema,
      ]),
      where: CalculationWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const CalculationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CalculationUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        CalculationUpdateManyMutationInputSchema,
        CalculationUncheckedUpdateManyInputSchema,
      ]),
      where: CalculationWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const CalculationDeleteManyArgsSchema: z.ZodType<Prisma.CalculationDeleteManyArgs> =
  z
    .object({
      where: CalculationWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const NoteCreateArgsSchema: z.ZodType<Prisma.NoteCreateArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    data: z.union([NoteCreateInputSchema, NoteUncheckedCreateInputSchema]),
  })
  .strict();

export const NoteUpsertArgsSchema: z.ZodType<Prisma.NoteUpsertArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    where: NoteWhereUniqueInputSchema,
    create: z.union([NoteCreateInputSchema, NoteUncheckedCreateInputSchema]),
    update: z.union([NoteUpdateInputSchema, NoteUncheckedUpdateInputSchema]),
  })
  .strict();

export const NoteCreateManyArgsSchema: z.ZodType<Prisma.NoteCreateManyArgs> = z
  .object({
    data: z.union([
      NoteCreateManyInputSchema,
      NoteCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const NoteCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NoteCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NoteCreateManyInputSchema,
        NoteCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const NoteDeleteArgsSchema: z.ZodType<Prisma.NoteDeleteArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    where: NoteWhereUniqueInputSchema,
  })
  .strict();

export const NoteUpdateArgsSchema: z.ZodType<Prisma.NoteUpdateArgs> = z
  .object({
    select: NoteSelectSchema.optional(),
    include: NoteIncludeSchema.optional(),
    data: z.union([NoteUpdateInputSchema, NoteUncheckedUpdateInputSchema]),
    where: NoteWhereUniqueInputSchema,
  })
  .strict();

export const NoteUpdateManyArgsSchema: z.ZodType<Prisma.NoteUpdateManyArgs> = z
  .object({
    data: z.union([
      NoteUpdateManyMutationInputSchema,
      NoteUncheckedUpdateManyInputSchema,
    ]),
    where: NoteWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const NoteUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.NoteUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        NoteUpdateManyMutationInputSchema,
        NoteUncheckedUpdateManyInputSchema,
      ]),
      where: NoteWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const NoteDeleteManyArgsSchema: z.ZodType<Prisma.NoteDeleteManyArgs> = z
  .object({
    where: NoteWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const TaskCreateArgsSchema: z.ZodType<Prisma.TaskCreateArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    data: z.union([TaskCreateInputSchema, TaskUncheckedCreateInputSchema]),
  })
  .strict();

export const TaskUpsertArgsSchema: z.ZodType<Prisma.TaskUpsertArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    where: TaskWhereUniqueInputSchema,
    create: z.union([TaskCreateInputSchema, TaskUncheckedCreateInputSchema]),
    update: z.union([TaskUpdateInputSchema, TaskUncheckedUpdateInputSchema]),
  })
  .strict();

export const TaskCreateManyArgsSchema: z.ZodType<Prisma.TaskCreateManyArgs> = z
  .object({
    data: z.union([
      TaskCreateManyInputSchema,
      TaskCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const TaskCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TaskCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TaskCreateManyInputSchema,
        TaskCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TaskDeleteArgsSchema: z.ZodType<Prisma.TaskDeleteArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const TaskUpdateArgsSchema: z.ZodType<Prisma.TaskUpdateArgs> = z
  .object({
    select: TaskSelectSchema.optional(),
    include: TaskIncludeSchema.optional(),
    data: z.union([TaskUpdateInputSchema, TaskUncheckedUpdateInputSchema]),
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const TaskUpdateManyArgsSchema: z.ZodType<Prisma.TaskUpdateManyArgs> = z
  .object({
    data: z.union([
      TaskUpdateManyMutationInputSchema,
      TaskUncheckedUpdateManyInputSchema,
    ]),
    where: TaskWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const TaskUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TaskUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TaskUpdateManyMutationInputSchema,
        TaskUncheckedUpdateManyInputSchema,
      ]),
      where: TaskWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TaskDeleteManyArgsSchema: z.ZodType<Prisma.TaskDeleteManyArgs> = z
  .object({
    where: TaskWhereInputSchema.optional(),
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
