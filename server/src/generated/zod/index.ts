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

export const CategoryScalarFieldEnumSchema = z.enum([
  'id',
  'name',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const TaskScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'completed',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const NoteScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'content',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const ProjectScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'description',
  'userId',
  'createdAt',
  'updatedAt',
]);

export const PostScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'content',
  'published',
  'authorId',
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
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Category = z.infer<typeof CategorySchema>;

/////////////////////////////////////////
// TASK SCHEMA
/////////////////////////////////////////

export const TaskSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  completed: z.boolean(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Task = z.infer<typeof TaskSchema>;

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
// PROJECT SCHEMA
/////////////////////////////////////////

export const ProjectSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  userId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string().nullable(),
  published: z.boolean(),
  authorId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Post = z.infer<typeof PostSchema>;

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z
  .object({
    posts: z
      .union([z.boolean(), z.lazy(() => PostFindManyArgsSchema)])
      .optional(),
    projects: z
      .union([z.boolean(), z.lazy(() => ProjectFindManyArgsSchema)])
      .optional(),
    notes: z
      .union([z.boolean(), z.lazy(() => NoteFindManyArgsSchema)])
      .optional(),
    tasks: z
      .union([z.boolean(), z.lazy(() => TaskFindManyArgsSchema)])
      .optional(),
    categories: z
      .union([z.boolean(), z.lazy(() => CategoryFindManyArgsSchema)])
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
      posts: z.boolean().optional(),
      projects: z.boolean().optional(),
      notes: z.boolean().optional(),
      tasks: z.boolean().optional(),
      categories: z.boolean().optional(),
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
    posts: z
      .union([z.boolean(), z.lazy(() => PostFindManyArgsSchema)])
      .optional(),
    projects: z
      .union([z.boolean(), z.lazy(() => ProjectFindManyArgsSchema)])
      .optional(),
    notes: z
      .union([z.boolean(), z.lazy(() => NoteFindManyArgsSchema)])
      .optional(),
    tasks: z
      .union([z.boolean(), z.lazy(() => TaskFindManyArgsSchema)])
      .optional(),
    categories: z
      .union([z.boolean(), z.lazy(() => CategoryFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => UserCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// CATEGORY
//------------------------------------------------------

export const CategoryIncludeSchema: z.ZodType<Prisma.CategoryInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const CategoryArgsSchema: z.ZodType<Prisma.CategoryDefaultArgs> = z
  .object({
    select: z.lazy(() => CategorySelectSchema).optional(),
    include: z.lazy(() => CategoryIncludeSchema).optional(),
  })
  .strict();

export const CategorySelectSchema: z.ZodType<Prisma.CategorySelect> = z
  .object({
    id: z.boolean().optional(),
    name: z.boolean().optional(),
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
    completed: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
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

// PROJECT
//------------------------------------------------------

export const ProjectIncludeSchema: z.ZodType<Prisma.ProjectInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const ProjectArgsSchema: z.ZodType<Prisma.ProjectDefaultArgs> = z
  .object({
    select: z.lazy(() => ProjectSelectSchema).optional(),
    include: z.lazy(() => ProjectIncludeSchema).optional(),
  })
  .strict();

export const ProjectSelectSchema: z.ZodType<Prisma.ProjectSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    description: z.boolean().optional(),
    userId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

// POST
//------------------------------------------------------

export const PostIncludeSchema: z.ZodType<Prisma.PostInclude> = z
  .object({
    author: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const PostArgsSchema: z.ZodType<Prisma.PostDefaultArgs> = z
  .object({
    select: z.lazy(() => PostSelectSchema).optional(),
    include: z.lazy(() => PostIncludeSchema).optional(),
  })
  .strict();

export const PostSelectSchema: z.ZodType<Prisma.PostSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    content: z.boolean().optional(),
    published: z.boolean().optional(),
    authorId: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    author: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
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
    posts: z.lazy(() => PostListRelationFilterSchema).optional(),
    projects: z.lazy(() => ProjectListRelationFilterSchema).optional(),
    notes: z.lazy(() => NoteListRelationFilterSchema).optional(),
    tasks: z.lazy(() => TaskListRelationFilterSchema).optional(),
    categories: z.lazy(() => CategoryListRelationFilterSchema).optional(),
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
    posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
    projects: z
      .lazy(() => ProjectOrderByRelationAggregateInputSchema)
      .optional(),
    notes: z.lazy(() => NoteOrderByRelationAggregateInputSchema).optional(),
    tasks: z.lazy(() => TaskOrderByRelationAggregateInputSchema).optional(),
    categories: z
      .lazy(() => CategoryOrderByRelationAggregateInputSchema)
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
        posts: z.lazy(() => PostListRelationFilterSchema).optional(),
        projects: z.lazy(() => ProjectListRelationFilterSchema).optional(),
        notes: z.lazy(() => NoteListRelationFilterSchema).optional(),
        tasks: z.lazy(() => TaskListRelationFilterSchema).optional(),
        categories: z.lazy(() => CategoryListRelationFilterSchema).optional(),
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

export const CategoryWhereInputSchema: z.ZodType<Prisma.CategoryWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => CategoryWhereInputSchema),
        z.lazy(() => CategoryWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CategoryWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CategoryWhereInputSchema),
        z.lazy(() => CategoryWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
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

export const CategoryOrderByWithRelationInputSchema: z.ZodType<Prisma.CategoryOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const CategoryWhereUniqueInputSchema: z.ZodType<Prisma.CategoryWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => CategoryWhereInputSchema),
            z.lazy(() => CategoryWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => CategoryWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => CategoryWhereInputSchema),
            z.lazy(() => CategoryWhereInputSchema).array(),
          ])
          .optional(),
        name: z
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

export const CategoryOrderByWithAggregationInputSchema: z.ZodType<Prisma.CategoryOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => CategoryCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => CategoryAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => CategoryMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => CategoryMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => CategorySumOrderByAggregateInputSchema).optional(),
  });

export const CategoryScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CategoryScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema),
        z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CategoryScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema),
        z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    name: z
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
    completed: z
      .union([z.lazy(() => BoolFilterSchema), z.boolean()])
      .optional(),
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
    completed: z.lazy(() => SortOrderSchema).optional(),
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
        completed: z
          .union([z.lazy(() => BoolFilterSchema), z.boolean()])
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

export const TaskOrderByWithAggregationInputSchema: z.ZodType<Prisma.TaskOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    completed: z.lazy(() => SortOrderSchema).optional(),
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
    completed: z
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

export const ProjectWhereInputSchema: z.ZodType<Prisma.ProjectWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => ProjectWhereInputSchema),
        z.lazy(() => ProjectWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => ProjectWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => ProjectWhereInputSchema),
        z.lazy(() => ProjectWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
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

export const ProjectOrderByWithRelationInputSchema: z.ZodType<Prisma.ProjectOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const ProjectWhereUniqueInputSchema: z.ZodType<Prisma.ProjectWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => ProjectWhereInputSchema),
            z.lazy(() => ProjectWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => ProjectWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => ProjectWhereInputSchema),
            z.lazy(() => ProjectWhereInputSchema).array(),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        description: z
          .union([z.lazy(() => StringNullableFilterSchema), z.string()])
          .optional()
          .nullable(),
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

export const ProjectOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProjectOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => ProjectCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => ProjectAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => ProjectMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => ProjectMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => ProjectSumOrderByAggregateInputSchema).optional(),
  });

export const ProjectScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ProjectScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => ProjectScalarWhereWithAggregatesInputSchema),
        z.lazy(() => ProjectScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => ProjectScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => ProjectScalarWhereWithAggregatesInputSchema),
        z.lazy(() => ProjectScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    title: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    description: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
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

export const PostWhereInputSchema: z.ZodType<Prisma.PostWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => PostWhereInputSchema),
        z.lazy(() => PostWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => PostWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => PostWhereInputSchema),
        z.lazy(() => PostWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    published: z
      .union([z.lazy(() => BoolFilterSchema), z.boolean()])
      .optional(),
    authorId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    author: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  });

export const PostOrderByWithRelationInputSchema: z.ZodType<Prisma.PostOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    published: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    author: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  });

export const PostWhereUniqueInputSchema: z.ZodType<Prisma.PostWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => PostWhereInputSchema),
            z.lazy(() => PostWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => PostWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => PostWhereInputSchema),
            z.lazy(() => PostWhereInputSchema).array(),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        content: z
          .union([z.lazy(() => StringNullableFilterSchema), z.string()])
          .optional()
          .nullable(),
        published: z
          .union([z.lazy(() => BoolFilterSchema), z.boolean()])
          .optional(),
        authorId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        author: z
          .union([
            z.lazy(() => UserScalarRelationFilterSchema),
            z.lazy(() => UserWhereInputSchema),
          ])
          .optional(),
      }),
    );

export const PostOrderByWithAggregationInputSchema: z.ZodType<Prisma.PostOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    published: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => PostCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => PostAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => PostMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => PostMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => PostSumOrderByAggregateInputSchema).optional(),
  });

export const PostScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PostScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema),
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => PostScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema),
        z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    title: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    content: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
    published: z
      .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
      .optional(),
    authorId: z
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
    posts: z
      .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    categories: z
      .lazy(() => CategoryCreateNestedManyWithoutUserInputSchema)
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
    posts: z
      .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema)
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
    posts: z
      .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    categories: z
      .lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema)
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
    posts: z
      .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema)
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

export const CategoryCreateInputSchema: z.ZodType<Prisma.CategoryCreateInput> =
  z.strictObject({
    name: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  });

export const CategoryUncheckedCreateInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    name: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const CategoryUpdateInputSchema: z.ZodType<Prisma.CategoryUpdateInput> =
  z.strictObject({
    name: z
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
      .lazy(() => UserUpdateOneRequiredWithoutCategoriesNestedInputSchema)
      .optional(),
  });

export const CategoryUncheckedUpdateInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    name: z
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

export const CategoryCreateManyInputSchema: z.ZodType<Prisma.CategoryCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    name: z.string(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const CategoryUpdateManyMutationInputSchema: z.ZodType<Prisma.CategoryUpdateManyMutationInput> =
  z.strictObject({
    name: z
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

export const CategoryUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    name: z
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
    completed: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutTasksInputSchema),
  });

export const TaskUncheckedCreateInputSchema: z.ZodType<Prisma.TaskUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    completed: z.boolean().optional(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskUpdateInputSchema: z.ZodType<Prisma.TaskUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    completed: z
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
    completed: z
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
    completed: z.boolean().optional(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskUpdateManyMutationInputSchema: z.ZodType<Prisma.TaskUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    completed: z
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
    completed: z
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

export const ProjectCreateInputSchema: z.ZodType<Prisma.ProjectCreateInput> =
  z.strictObject({
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutProjectsInputSchema),
  });

export const ProjectUncheckedCreateInputSchema: z.ZodType<Prisma.ProjectUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const ProjectUpdateInputSchema: z.ZodType<Prisma.ProjectUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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
      .lazy(() => UserUpdateOneRequiredWithoutProjectsNestedInputSchema)
      .optional(),
  });

export const ProjectUncheckedUpdateInputSchema: z.ZodType<Prisma.ProjectUncheckedUpdateInput> =
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
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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

export const ProjectCreateManyInputSchema: z.ZodType<Prisma.ProjectCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    userId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const ProjectUpdateManyMutationInputSchema: z.ZodType<Prisma.ProjectUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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

export const ProjectUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ProjectUncheckedUpdateManyInput> =
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
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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

export const PostCreateInputSchema: z.ZodType<Prisma.PostCreateInput> =
  z.strictObject({
    title: z.string(),
    content: z.string().optional().nullable(),
    published: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    author: z.lazy(() => UserCreateNestedOneWithoutPostsInputSchema),
  });

export const PostUncheckedCreateInputSchema: z.ZodType<Prisma.PostUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string().optional().nullable(),
    published: z.boolean().optional(),
    authorId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const PostUpdateInputSchema: z.ZodType<Prisma.PostUpdateInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
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
    author: z
      .lazy(() => UserUpdateOneRequiredWithoutPostsNestedInputSchema)
      .optional(),
  });

export const PostUncheckedUpdateInputSchema: z.ZodType<Prisma.PostUncheckedUpdateInput> =
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
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    authorId: z
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

export const PostCreateManyInputSchema: z.ZodType<Prisma.PostCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string().optional().nullable(),
    published: z.boolean().optional(),
    authorId: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const PostUpdateManyMutationInputSchema: z.ZodType<Prisma.PostUpdateManyMutationInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
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

export const PostUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyInput> =
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
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    authorId: z
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

export const PostListRelationFilterSchema: z.ZodType<Prisma.PostListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => PostWhereInputSchema).optional(),
    some: z.lazy(() => PostWhereInputSchema).optional(),
    none: z.lazy(() => PostWhereInputSchema).optional(),
  });

export const ProjectListRelationFilterSchema: z.ZodType<Prisma.ProjectListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => ProjectWhereInputSchema).optional(),
    some: z.lazy(() => ProjectWhereInputSchema).optional(),
    none: z.lazy(() => ProjectWhereInputSchema).optional(),
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

export const CategoryListRelationFilterSchema: z.ZodType<Prisma.CategoryListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => CategoryWhereInputSchema).optional(),
    some: z.lazy(() => CategoryWhereInputSchema).optional(),
    none: z.lazy(() => CategoryWhereInputSchema).optional(),
  });

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> =
  z.strictObject({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
  });

export const PostOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PostOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const ProjectOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ProjectOrderByRelationAggregateInput> =
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

export const CategoryOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CategoryOrderByRelationAggregateInput> =
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

export const CategoryCountOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const CategoryAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const CategoryMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const CategoryMinOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const CategorySumOrderByAggregateInputSchema: z.ZodType<Prisma.CategorySumOrderByAggregateInput> =
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
    completed: z.lazy(() => SortOrderSchema).optional(),
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
    completed: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TaskMinOrderByAggregateInputSchema: z.ZodType<Prisma.TaskMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    completed: z.lazy(() => SortOrderSchema).optional(),
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

export const ProjectCountOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const ProjectAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const ProjectMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const ProjectMinOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const ProjectSumOrderByAggregateInputSchema: z.ZodType<Prisma.ProjectSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
  });

export const PostCountOrderByAggregateInputSchema: z.ZodType<Prisma.PostCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    published: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const PostAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PostAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
  });

export const PostMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PostMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    published: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const PostMinOrderByAggregateInputSchema: z.ZodType<Prisma.PostMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    content: z.lazy(() => SortOrderSchema).optional(),
    published: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const PostSumOrderByAggregateInputSchema: z.ZodType<Prisma.PostSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    authorId: z.lazy(() => SortOrderSchema).optional(),
  });

export const PostCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutAuthorInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const ProjectCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.ProjectCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => ProjectCreateWithoutUserInputSchema),
        z.lazy(() => ProjectCreateWithoutUserInputSchema).array(),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => ProjectCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
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

export const CategoryCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CategoryCreateWithoutUserInputSchema),
        z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CategoryCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const PostUncheckedCreateNestedManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutAuthorInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const ProjectUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.ProjectUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => ProjectCreateWithoutUserInputSchema),
        z.lazy(() => ProjectCreateWithoutUserInputSchema).array(),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => ProjectCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
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

export const CategoryUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateNestedManyWithoutUserInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CategoryCreateWithoutUserInputSchema),
        z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CategoryCreateManyUserInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
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

export const PostUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutAuthorNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema),
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const ProjectUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.ProjectUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => ProjectCreateWithoutUserInputSchema),
        z.lazy(() => ProjectCreateWithoutUserInputSchema).array(),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => ProjectUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => ProjectUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => ProjectCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => ProjectUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => ProjectUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => ProjectUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => ProjectUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => ProjectScalarWhereInputSchema),
        z.lazy(() => ProjectScalarWhereInputSchema).array(),
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

export const CategoryUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CategoryCreateWithoutUserInputSchema),
        z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CategoryCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => CategoryScalarWhereInputSchema),
        z.lazy(() => CategoryScalarWhereInputSchema).array(),
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

export const PostUncheckedUpdateManyWithoutAuthorNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutAuthorNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => PostCreateWithoutAuthorInputSchema),
        z.lazy(() => PostCreateWithoutAuthorInputSchema).array(),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
        z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema),
        z.lazy(() => PostCreateOrConnectWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema),
        z.lazy(() => PostUpsertWithWhereUniqueWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => PostCreateManyAuthorInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => PostWhereUniqueInputSchema),
        z.lazy(() => PostWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema),
        z.lazy(() => PostUpdateWithWhereUniqueWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema),
        z.lazy(() => PostUpdateManyWithWhereWithoutAuthorInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const ProjectUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.ProjectUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => ProjectCreateWithoutUserInputSchema),
        z.lazy(() => ProjectCreateWithoutUserInputSchema).array(),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => ProjectCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => ProjectUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => ProjectUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => ProjectCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => ProjectWhereUniqueInputSchema),
        z.lazy(() => ProjectWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => ProjectUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => ProjectUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => ProjectUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => ProjectUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => ProjectScalarWhereInputSchema),
        z.lazy(() => ProjectScalarWhereInputSchema).array(),
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

export const CategoryUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutUserNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => CategoryCreateWithoutUserInputSchema),
        z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),
        z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),
        z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => CategoryCreateManyUserInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => CategoryWhereUniqueInputSchema),
        z.lazy(() => CategoryWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema),
        z
          .lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema),
        z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema).array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => CategoryScalarWhereInputSchema),
        z.lazy(() => CategoryScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCategoriesInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutCategoriesInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutCategoriesInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutCategoriesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCategoriesNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutCategoriesInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutCategoriesInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutCategoriesInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutCategoriesInputSchema),
        z.lazy(() => UserUpdateWithoutCategoriesInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema),
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

export const UserCreateNestedOneWithoutProjectsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutProjectsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutProjectsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutProjectsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutProjectsInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutProjectsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutProjectsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutProjectsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutProjectsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutProjectsInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutProjectsInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutProjectsInputSchema),
        z.lazy(() => UserUpdateWithoutProjectsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutProjectsInputSchema),
      ])
      .optional(),
  });

export const UserCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutPostsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutPostsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutPostsInputSchema)
      .optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  });

export const UserUpdateOneRequiredWithoutPostsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutPostsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => UserCreateWithoutPostsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => UserCreateOrConnectWithoutPostsInputSchema)
      .optional(),
    upsert: z.lazy(() => UserUpsertWithoutPostsInputSchema).optional(),
    connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => UserUpdateToOneWithWhereWithoutPostsInputSchema),
        z.lazy(() => UserUpdateWithoutPostsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutPostsInputSchema),
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

export const PostCreateWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateWithoutAuthorInput> =
  z.strictObject({
    title: z.string(),
    content: z.string().optional().nullable(),
    published: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const PostUncheckedCreateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutAuthorInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string().optional().nullable(),
    published: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const PostCreateOrConnectWithoutAuthorInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutAuthorInput> =
  z.strictObject({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => PostCreateWithoutAuthorInputSchema),
      z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
    ]),
  });

export const PostCreateManyAuthorInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyAuthorInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => PostCreateManyAuthorInputSchema),
      z.lazy(() => PostCreateManyAuthorInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const ProjectCreateWithoutUserInputSchema: z.ZodType<Prisma.ProjectCreateWithoutUserInput> =
  z.strictObject({
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const ProjectUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.ProjectUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const ProjectCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.ProjectCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => ProjectWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => ProjectCreateWithoutUserInputSchema),
      z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const ProjectCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.ProjectCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => ProjectCreateManyUserInputSchema),
      z.lazy(() => ProjectCreateManyUserInputSchema).array(),
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
    completed: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TaskUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.TaskUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    completed: z.boolean().optional(),
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

export const CategoryCreateWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateWithoutUserInput> =
  z.strictObject({
    name: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const CategoryUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    name: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const CategoryCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CategoryWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => CategoryCreateWithoutUserInputSchema),
      z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const CategoryCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.CategoryCreateManyUserInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => CategoryCreateManyUserInputSchema),
      z.lazy(() => CategoryCreateManyUserInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const PostUpsertWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput> =
  z.strictObject({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => PostUpdateWithoutAuthorInputSchema),
      z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema),
    ]),
    create: z.union([
      z.lazy(() => PostCreateWithoutAuthorInputSchema),
      z.lazy(() => PostUncheckedCreateWithoutAuthorInputSchema),
    ]),
  });

export const PostUpdateWithWhereUniqueWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput> =
  z.strictObject({
    where: z.lazy(() => PostWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => PostUpdateWithoutAuthorInputSchema),
      z.lazy(() => PostUncheckedUpdateWithoutAuthorInputSchema),
    ]),
  });

export const PostUpdateManyWithWhereWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutAuthorInput> =
  z.strictObject({
    where: z.lazy(() => PostScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => PostUpdateManyMutationInputSchema),
      z.lazy(() => PostUncheckedUpdateManyWithoutAuthorInputSchema),
    ]),
  });

export const PostScalarWhereInputSchema: z.ZodType<Prisma.PostScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => PostScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => PostScalarWhereInputSchema),
        z.lazy(() => PostScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    content: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    published: z
      .union([z.lazy(() => BoolFilterSchema), z.boolean()])
      .optional(),
    authorId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const ProjectUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.ProjectUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => ProjectWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => ProjectUpdateWithoutUserInputSchema),
      z.lazy(() => ProjectUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => ProjectCreateWithoutUserInputSchema),
      z.lazy(() => ProjectUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const ProjectUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.ProjectUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => ProjectWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => ProjectUpdateWithoutUserInputSchema),
      z.lazy(() => ProjectUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const ProjectUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.ProjectUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => ProjectScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => ProjectUpdateManyMutationInputSchema),
      z.lazy(() => ProjectUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const ProjectScalarWhereInputSchema: z.ZodType<Prisma.ProjectScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => ProjectScalarWhereInputSchema),
        z.lazy(() => ProjectScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => ProjectScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => ProjectScalarWhereInputSchema),
        z.lazy(() => ProjectScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
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
    completed: z
      .union([z.lazy(() => BoolFilterSchema), z.boolean()])
      .optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const CategoryUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CategoryWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => CategoryUpdateWithoutUserInputSchema),
      z.lazy(() => CategoryUncheckedUpdateWithoutUserInputSchema),
    ]),
    create: z.union([
      z.lazy(() => CategoryCreateWithoutUserInputSchema),
      z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),
    ]),
  });

export const CategoryUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CategoryWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => CategoryUpdateWithoutUserInputSchema),
      z.lazy(() => CategoryUncheckedUpdateWithoutUserInputSchema),
    ]),
  });

export const CategoryUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutUserInput> =
  z.strictObject({
    where: z.lazy(() => CategoryScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => CategoryUpdateManyMutationInputSchema),
      z.lazy(() => CategoryUncheckedUpdateManyWithoutUserInputSchema),
    ]),
  });

export const CategoryScalarWhereInputSchema: z.ZodType<Prisma.CategoryScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => CategoryScalarWhereInputSchema),
        z.lazy(() => CategoryScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CategoryScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CategoryScalarWhereInputSchema),
        z.lazy(() => CategoryScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const UserCreateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateWithoutCategoriesInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    posts: z
      .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
  });

export const UserUncheckedCreateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCategoriesInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    posts: z
      .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCategoriesInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutCategoriesInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema),
    ]),
  });

export const UserUpsertWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpsertWithoutCategoriesInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutCategoriesInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutCategoriesInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCategoriesInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutCategoriesInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema),
    ]),
  });

export const UserUpdateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpdateWithoutCategoriesInput> =
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
    posts: z
      .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
  });

export const UserUncheckedUpdateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCategoriesInput> =
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
    posts: z
      .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
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
    posts: z
      .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    categories: z
      .lazy(() => CategoryCreateNestedManyWithoutUserInputSchema)
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
    posts: z
      .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema)
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
    posts: z
      .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    categories: z
      .lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema)
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
    posts: z
      .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema)
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
    posts: z
      .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    categories: z
      .lazy(() => CategoryCreateNestedManyWithoutUserInputSchema)
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
    posts: z
      .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema)
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
    posts: z
      .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    categories: z
      .lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema)
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
    posts: z
      .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    projects: z
      .lazy(() => ProjectUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateWithoutProjectsInputSchema: z.ZodType<Prisma.UserCreateWithoutProjectsInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    posts: z
      .lazy(() => PostCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    categories: z
      .lazy(() => CategoryCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutProjectsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutProjectsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    posts: z
      .lazy(() => PostUncheckedCreateNestedManyWithoutAuthorInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutProjectsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutProjectsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutProjectsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutProjectsInputSchema),
    ]),
  });

export const UserUpsertWithoutProjectsInputSchema: z.ZodType<Prisma.UserUpsertWithoutProjectsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutProjectsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutProjectsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutProjectsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutProjectsInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutProjectsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutProjectsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutProjectsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutProjectsInputSchema),
    ]),
  });

export const UserUpdateWithoutProjectsInputSchema: z.ZodType<Prisma.UserUpdateWithoutProjectsInput> =
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
    posts: z
      .lazy(() => PostUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    categories: z
      .lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutProjectsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutProjectsInput> =
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
    posts: z
      .lazy(() => PostUncheckedUpdateManyWithoutAuthorNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserCreateWithoutPostsInputSchema: z.ZodType<Prisma.UserCreateWithoutPostsInput> =
  z.strictObject({
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    projects: z
      .lazy(() => ProjectCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z.lazy(() => NoteCreateNestedManyWithoutUserInputSchema).optional(),
    tasks: z.lazy(() => TaskCreateNestedManyWithoutUserInputSchema).optional(),
    categories: z
      .lazy(() => CategoryCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutPostsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    password: z.string(),
    hashedRefreshToken: z.string().optional().nullable(),
    role: z.lazy(() => RoleSchema).optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    projects: z
      .lazy(() => ProjectUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema)
      .optional(),
  });

export const UserCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutPostsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => UserCreateWithoutPostsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema),
    ]),
  });

export const UserUpsertWithoutPostsInputSchema: z.ZodType<Prisma.UserUpsertWithoutPostsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => UserUpdateWithoutPostsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutPostsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => UserCreateWithoutPostsInputSchema),
      z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema),
    ]),
    where: z.lazy(() => UserWhereInputSchema).optional(),
  });

export const UserUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutPostsInput> =
  z.strictObject({
    where: z.lazy(() => UserWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => UserUpdateWithoutPostsInputSchema),
      z.lazy(() => UserUncheckedUpdateWithoutPostsInputSchema),
    ]),
  });

export const UserUpdateWithoutPostsInputSchema: z.ZodType<Prisma.UserUpdateWithoutPostsInput> =
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
    projects: z
      .lazy(() => ProjectUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z.lazy(() => NoteUpdateManyWithoutUserNestedInputSchema).optional(),
    tasks: z.lazy(() => TaskUpdateManyWithoutUserNestedInputSchema).optional(),
    categories: z
      .lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const UserUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutPostsInput> =
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
    projects: z
      .lazy(() => ProjectUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    notes: z
      .lazy(() => NoteUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    tasks: z
      .lazy(() => TaskUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    categories: z
      .lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  });

export const PostCreateManyAuthorInputSchema: z.ZodType<Prisma.PostCreateManyAuthorInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    content: z.string().optional().nullable(),
    published: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const ProjectCreateManyUserInputSchema: z.ZodType<Prisma.ProjectCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
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
    completed: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const CategoryCreateManyUserInputSchema: z.ZodType<Prisma.CategoryCreateManyUserInput> =
  z.strictObject({
    id: z.number().int().optional(),
    name: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const PostUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUpdateWithoutAuthorInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    content: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
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

export const PostUncheckedUpdateWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutAuthorInput> =
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
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
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

export const PostUncheckedUpdateManyWithoutAuthorInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutAuthorInput> =
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
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    published: z
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

export const ProjectUpdateWithoutUserInputSchema: z.ZodType<Prisma.ProjectUpdateWithoutUserInput> =
  z.strictObject({
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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

export const ProjectUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.ProjectUncheckedUpdateWithoutUserInput> =
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
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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

export const ProjectUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.ProjectUncheckedUpdateManyWithoutUserInput> =
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
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
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
    completed: z
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
    completed: z
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
    completed: z
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

export const CategoryUpdateWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutUserInput> =
  z.strictObject({
    name: z
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

export const CategoryUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    name: z
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

export const CategoryUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutUserInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    name: z
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

export const CategoryFindFirstArgsSchema: z.ZodType<Prisma.CategoryFindFirstArgs> =
  z
    .object({
      select: CategorySelectSchema.optional(),
      include: CategoryIncludeSchema.optional(),
      where: CategoryWhereInputSchema.optional(),
      orderBy: z
        .union([
          CategoryOrderByWithRelationInputSchema.array(),
          CategoryOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CategoryWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          CategoryScalarFieldEnumSchema,
          CategoryScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const CategoryFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CategoryFindFirstOrThrowArgs> =
  z
    .object({
      select: CategorySelectSchema.optional(),
      include: CategoryIncludeSchema.optional(),
      where: CategoryWhereInputSchema.optional(),
      orderBy: z
        .union([
          CategoryOrderByWithRelationInputSchema.array(),
          CategoryOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CategoryWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          CategoryScalarFieldEnumSchema,
          CategoryScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const CategoryFindManyArgsSchema: z.ZodType<Prisma.CategoryFindManyArgs> =
  z
    .object({
      select: CategorySelectSchema.optional(),
      include: CategoryIncludeSchema.optional(),
      where: CategoryWhereInputSchema.optional(),
      orderBy: z
        .union([
          CategoryOrderByWithRelationInputSchema.array(),
          CategoryOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CategoryWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          CategoryScalarFieldEnumSchema,
          CategoryScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const CategoryAggregateArgsSchema: z.ZodType<Prisma.CategoryAggregateArgs> =
  z
    .object({
      where: CategoryWhereInputSchema.optional(),
      orderBy: z
        .union([
          CategoryOrderByWithRelationInputSchema.array(),
          CategoryOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: CategoryWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const CategoryGroupByArgsSchema: z.ZodType<Prisma.CategoryGroupByArgs> =
  z
    .object({
      where: CategoryWhereInputSchema.optional(),
      orderBy: z
        .union([
          CategoryOrderByWithAggregationInputSchema.array(),
          CategoryOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: CategoryScalarFieldEnumSchema.array(),
      having: CategoryScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const CategoryFindUniqueArgsSchema: z.ZodType<Prisma.CategoryFindUniqueArgs> =
  z
    .object({
      select: CategorySelectSchema.optional(),
      include: CategoryIncludeSchema.optional(),
      where: CategoryWhereUniqueInputSchema,
    })
    .strict();

export const CategoryFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CategoryFindUniqueOrThrowArgs> =
  z
    .object({
      select: CategorySelectSchema.optional(),
      include: CategoryIncludeSchema.optional(),
      where: CategoryWhereUniqueInputSchema,
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

export const ProjectFindFirstArgsSchema: z.ZodType<Prisma.ProjectFindFirstArgs> =
  z
    .object({
      select: ProjectSelectSchema.optional(),
      include: ProjectIncludeSchema.optional(),
      where: ProjectWhereInputSchema.optional(),
      orderBy: z
        .union([
          ProjectOrderByWithRelationInputSchema.array(),
          ProjectOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: ProjectWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          ProjectScalarFieldEnumSchema,
          ProjectScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const ProjectFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ProjectFindFirstOrThrowArgs> =
  z
    .object({
      select: ProjectSelectSchema.optional(),
      include: ProjectIncludeSchema.optional(),
      where: ProjectWhereInputSchema.optional(),
      orderBy: z
        .union([
          ProjectOrderByWithRelationInputSchema.array(),
          ProjectOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: ProjectWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          ProjectScalarFieldEnumSchema,
          ProjectScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const ProjectFindManyArgsSchema: z.ZodType<Prisma.ProjectFindManyArgs> =
  z
    .object({
      select: ProjectSelectSchema.optional(),
      include: ProjectIncludeSchema.optional(),
      where: ProjectWhereInputSchema.optional(),
      orderBy: z
        .union([
          ProjectOrderByWithRelationInputSchema.array(),
          ProjectOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: ProjectWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          ProjectScalarFieldEnumSchema,
          ProjectScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const ProjectAggregateArgsSchema: z.ZodType<Prisma.ProjectAggregateArgs> =
  z
    .object({
      where: ProjectWhereInputSchema.optional(),
      orderBy: z
        .union([
          ProjectOrderByWithRelationInputSchema.array(),
          ProjectOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: ProjectWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const ProjectGroupByArgsSchema: z.ZodType<Prisma.ProjectGroupByArgs> = z
  .object({
    where: ProjectWhereInputSchema.optional(),
    orderBy: z
      .union([
        ProjectOrderByWithAggregationInputSchema.array(),
        ProjectOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: ProjectScalarFieldEnumSchema.array(),
    having: ProjectScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const ProjectFindUniqueArgsSchema: z.ZodType<Prisma.ProjectFindUniqueArgs> =
  z
    .object({
      select: ProjectSelectSchema.optional(),
      include: ProjectIncludeSchema.optional(),
      where: ProjectWhereUniqueInputSchema,
    })
    .strict();

export const ProjectFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ProjectFindUniqueOrThrowArgs> =
  z
    .object({
      select: ProjectSelectSchema.optional(),
      include: ProjectIncludeSchema.optional(),
      where: ProjectWhereUniqueInputSchema,
    })
    .strict();

export const PostFindFirstArgsSchema: z.ZodType<Prisma.PostFindFirstArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereInputSchema.optional(),
    orderBy: z
      .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const PostFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PostFindFirstOrThrowArgs> =
  z
    .object({
      select: PostSelectSchema.optional(),
      include: PostIncludeSchema.optional(),
      where: PostWhereInputSchema.optional(),
      orderBy: z
        .union([
          PostOrderByWithRelationInputSchema.array(),
          PostOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: PostWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array()])
        .optional(),
    })
    .strict();

export const PostFindManyArgsSchema: z.ZodType<Prisma.PostFindManyArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereInputSchema.optional(),
    orderBy: z
      .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([PostScalarFieldEnumSchema, PostScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const PostAggregateArgsSchema: z.ZodType<Prisma.PostAggregateArgs> = z
  .object({
    where: PostWhereInputSchema.optional(),
    orderBy: z
      .union([
        PostOrderByWithRelationInputSchema.array(),
        PostOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PostWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const PostGroupByArgsSchema: z.ZodType<Prisma.PostGroupByArgs> = z
  .object({
    where: PostWhereInputSchema.optional(),
    orderBy: z
      .union([
        PostOrderByWithAggregationInputSchema.array(),
        PostOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: PostScalarFieldEnumSchema.array(),
    having: PostScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const PostFindUniqueArgsSchema: z.ZodType<Prisma.PostFindUniqueArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
  })
  .strict();

export const PostFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PostFindUniqueOrThrowArgs> =
  z
    .object({
      select: PostSelectSchema.optional(),
      include: PostIncludeSchema.optional(),
      where: PostWhereUniqueInputSchema,
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

export const CategoryCreateArgsSchema: z.ZodType<Prisma.CategoryCreateArgs> = z
  .object({
    select: CategorySelectSchema.optional(),
    include: CategoryIncludeSchema.optional(),
    data: z.union([
      CategoryCreateInputSchema,
      CategoryUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const CategoryUpsertArgsSchema: z.ZodType<Prisma.CategoryUpsertArgs> = z
  .object({
    select: CategorySelectSchema.optional(),
    include: CategoryIncludeSchema.optional(),
    where: CategoryWhereUniqueInputSchema,
    create: z.union([
      CategoryCreateInputSchema,
      CategoryUncheckedCreateInputSchema,
    ]),
    update: z.union([
      CategoryUpdateInputSchema,
      CategoryUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const CategoryCreateManyArgsSchema: z.ZodType<Prisma.CategoryCreateManyArgs> =
  z
    .object({
      data: z.union([
        CategoryCreateManyInputSchema,
        CategoryCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const CategoryCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CategoryCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        CategoryCreateManyInputSchema,
        CategoryCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const CategoryDeleteArgsSchema: z.ZodType<Prisma.CategoryDeleteArgs> = z
  .object({
    select: CategorySelectSchema.optional(),
    include: CategoryIncludeSchema.optional(),
    where: CategoryWhereUniqueInputSchema,
  })
  .strict();

export const CategoryUpdateArgsSchema: z.ZodType<Prisma.CategoryUpdateArgs> = z
  .object({
    select: CategorySelectSchema.optional(),
    include: CategoryIncludeSchema.optional(),
    data: z.union([
      CategoryUpdateInputSchema,
      CategoryUncheckedUpdateInputSchema,
    ]),
    where: CategoryWhereUniqueInputSchema,
  })
  .strict();

export const CategoryUpdateManyArgsSchema: z.ZodType<Prisma.CategoryUpdateManyArgs> =
  z
    .object({
      data: z.union([
        CategoryUpdateManyMutationInputSchema,
        CategoryUncheckedUpdateManyInputSchema,
      ]),
      where: CategoryWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const CategoryUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CategoryUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        CategoryUpdateManyMutationInputSchema,
        CategoryUncheckedUpdateManyInputSchema,
      ]),
      where: CategoryWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const CategoryDeleteManyArgsSchema: z.ZodType<Prisma.CategoryDeleteManyArgs> =
  z
    .object({
      where: CategoryWhereInputSchema.optional(),
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

export const ProjectCreateArgsSchema: z.ZodType<Prisma.ProjectCreateArgs> = z
  .object({
    select: ProjectSelectSchema.optional(),
    include: ProjectIncludeSchema.optional(),
    data: z.union([
      ProjectCreateInputSchema,
      ProjectUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const ProjectUpsertArgsSchema: z.ZodType<Prisma.ProjectUpsertArgs> = z
  .object({
    select: ProjectSelectSchema.optional(),
    include: ProjectIncludeSchema.optional(),
    where: ProjectWhereUniqueInputSchema,
    create: z.union([
      ProjectCreateInputSchema,
      ProjectUncheckedCreateInputSchema,
    ]),
    update: z.union([
      ProjectUpdateInputSchema,
      ProjectUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const ProjectCreateManyArgsSchema: z.ZodType<Prisma.ProjectCreateManyArgs> =
  z
    .object({
      data: z.union([
        ProjectCreateManyInputSchema,
        ProjectCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const ProjectCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProjectCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        ProjectCreateManyInputSchema,
        ProjectCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const ProjectDeleteArgsSchema: z.ZodType<Prisma.ProjectDeleteArgs> = z
  .object({
    select: ProjectSelectSchema.optional(),
    include: ProjectIncludeSchema.optional(),
    where: ProjectWhereUniqueInputSchema,
  })
  .strict();

export const ProjectUpdateArgsSchema: z.ZodType<Prisma.ProjectUpdateArgs> = z
  .object({
    select: ProjectSelectSchema.optional(),
    include: ProjectIncludeSchema.optional(),
    data: z.union([
      ProjectUpdateInputSchema,
      ProjectUncheckedUpdateInputSchema,
    ]),
    where: ProjectWhereUniqueInputSchema,
  })
  .strict();

export const ProjectUpdateManyArgsSchema: z.ZodType<Prisma.ProjectUpdateManyArgs> =
  z
    .object({
      data: z.union([
        ProjectUpdateManyMutationInputSchema,
        ProjectUncheckedUpdateManyInputSchema,
      ]),
      where: ProjectWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const ProjectUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProjectUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        ProjectUpdateManyMutationInputSchema,
        ProjectUncheckedUpdateManyInputSchema,
      ]),
      where: ProjectWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const ProjectDeleteManyArgsSchema: z.ZodType<Prisma.ProjectDeleteManyArgs> =
  z
    .object({
      where: ProjectWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PostCreateArgsSchema: z.ZodType<Prisma.PostCreateArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    data: z.union([PostCreateInputSchema, PostUncheckedCreateInputSchema]),
  })
  .strict();

export const PostUpsertArgsSchema: z.ZodType<Prisma.PostUpsertArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
    create: z.union([PostCreateInputSchema, PostUncheckedCreateInputSchema]),
    update: z.union([PostUpdateInputSchema, PostUncheckedUpdateInputSchema]),
  })
  .strict();

export const PostCreateManyArgsSchema: z.ZodType<Prisma.PostCreateManyArgs> = z
  .object({
    data: z.union([
      PostCreateManyInputSchema,
      PostCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const PostCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PostCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PostCreateManyInputSchema,
        PostCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PostDeleteArgsSchema: z.ZodType<Prisma.PostDeleteArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    where: PostWhereUniqueInputSchema,
  })
  .strict();

export const PostUpdateArgsSchema: z.ZodType<Prisma.PostUpdateArgs> = z
  .object({
    select: PostSelectSchema.optional(),
    include: PostIncludeSchema.optional(),
    data: z.union([PostUpdateInputSchema, PostUncheckedUpdateInputSchema]),
    where: PostWhereUniqueInputSchema,
  })
  .strict();

export const PostUpdateManyArgsSchema: z.ZodType<Prisma.PostUpdateManyArgs> = z
  .object({
    data: z.union([
      PostUpdateManyMutationInputSchema,
      PostUncheckedUpdateManyInputSchema,
    ]),
    where: PostWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const PostUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PostUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PostUpdateManyMutationInputSchema,
        PostUncheckedUpdateManyInputSchema,
      ]),
      where: PostWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PostDeleteManyArgsSchema: z.ZodType<Prisma.PostDeleteManyArgs> = z
  .object({
    where: PostWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();
