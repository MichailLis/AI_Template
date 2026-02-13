import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput =
  | Prisma.JsonValue
  | null
  | 'JsonNull'
  | 'DbNull'
  | Prisma.NullTypes.DbNull
  | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(
      z.string(),
      z.lazy(() => JsonValueSchema.optional()),
    ),
    z.array(z.lazy(() => JsonValueSchema)),
  ]),
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(
  () =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.object({ toJSON: z.any() }),
      z.record(
        z.string(),
        z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)])),
      ),
      z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    ]),
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

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

export const TestTopicScalarFieldEnumSchema = z.enum([
  'id',
  'slug',
  'createdAt',
  'updatedAt',
  'activeDraftVersionId',
  'activePublishedVersionId',
]);

export const TestTopicVersionScalarFieldEnumSchema = z.enum([
  'id',
  'topicId',
  'versionNumber',
  'status',
  'title',
  'description',
  'createdAt',
  'updatedAt',
]);

export const TestQuestionScalarFieldEnumSchema = z.enum([
  'id',
  'versionId',
  'type',
  'title',
  'description',
  'required',
  'order',
  'settings',
  'createdAt',
  'updatedAt',
]);

export const TestQuestionOptionScalarFieldEnumSchema = z.enum([
  'id',
  'questionId',
  'label',
  'value',
  'weight',
  'order',
  'createdAt',
  'updatedAt',
]);

export const TestQuestionSliderBandScalarFieldEnumSchema = z.enum([
  'id',
  'questionId',
  'minValue',
  'maxValue',
  'label',
  'weight',
  'order',
]);

export const SortOrderSchema = z.enum(['asc', 'desc']);

export const NullableJsonNullValueInputSchema: z.ZodType<Prisma.NullableJsonNullValueInput> =
  z
    .enum(['DbNull', 'JsonNull'])
    .transform((value) =>
      value === 'JsonNull'
        ? Prisma.JsonNull
        : value === 'DbNull'
          ? Prisma.DbNull
          : value,
    );

export const QueryModeSchema = z.enum(['default', 'insensitive']);

export const NullsOrderSchema = z.enum(['first', 'last']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> =
  z
    .enum(['DbNull', 'JsonNull', 'AnyNull'])
    .transform((value) =>
      value === 'JsonNull'
        ? Prisma.JsonNull
        : value === 'DbNull'
          ? Prisma.DbNull
          : value === 'AnyNull'
            ? Prisma.AnyNull
            : value,
    );

export const RoleSchema = z.enum(['USER', 'ADMIN']);

export type RoleType = `${z.infer<typeof RoleSchema>}`;

export const TestTopicVersionStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
]);

export type TestTopicVersionStatusType =
  `${z.infer<typeof TestTopicVersionStatusSchema>}`;

export const TestQuestionTypeSchema = z.enum([
  'OPEN_TEXT',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'SLIDER',
]);

export type TestQuestionTypeType = `${z.infer<typeof TestQuestionTypeSchema>}`;

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
// TEST TOPIC SCHEMA
/////////////////////////////////////////

export const TestTopicSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  activeDraftVersionId: z.number().int().nullable(),
  activePublishedVersionId: z.number().int().nullable(),
});

export type TestTopic = z.infer<typeof TestTopicSchema>;

/////////////////////////////////////////
// TEST TOPIC VERSION SCHEMA
/////////////////////////////////////////

export const TestTopicVersionSchema = z.object({
  status: TestTopicVersionStatusSchema,
  id: z.number().int(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TestTopicVersion = z.infer<typeof TestTopicVersionSchema>;

/////////////////////////////////////////
// TEST QUESTION SCHEMA
/////////////////////////////////////////

export const TestQuestionSchema = z.object({
  type: TestQuestionTypeSchema,
  id: z.number().int(),
  versionId: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  required: z.boolean(),
  order: z.number().int(),
  settings: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TestQuestion = z.infer<typeof TestQuestionSchema>;

/////////////////////////////////////////
// TEST QUESTION OPTION SCHEMA
/////////////////////////////////////////

export const TestQuestionOptionSchema = z.object({
  id: z.number().int(),
  questionId: z.number().int(),
  label: z.string(),
  value: z.string(),
  weight: z.number().int(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TestQuestionOption = z.infer<typeof TestQuestionOptionSchema>;

/////////////////////////////////////////
// TEST QUESTION SLIDER BAND SCHEMA
/////////////////////////////////////////

export const TestQuestionSliderBandSchema = z.object({
  id: z.number().int(),
  questionId: z.number().int(),
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int(),
  order: z.number().int(),
});

export type TestQuestionSliderBand = z.infer<
  typeof TestQuestionSliderBandSchema
>;

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

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
  })
  .strict();

// TEST TOPIC
//------------------------------------------------------

export const TestTopicIncludeSchema: z.ZodType<Prisma.TestTopicInclude> = z
  .object({
    versions: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionFindManyArgsSchema)])
      .optional(),
    activeDraftVersion: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionArgsSchema)])
      .optional(),
    activePublishedVersion: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => TestTopicCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

export const TestTopicArgsSchema: z.ZodType<Prisma.TestTopicDefaultArgs> = z
  .object({
    select: z.lazy(() => TestTopicSelectSchema).optional(),
    include: z.lazy(() => TestTopicIncludeSchema).optional(),
  })
  .strict();

export const TestTopicCountOutputTypeArgsSchema: z.ZodType<Prisma.TestTopicCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => TestTopicCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const TestTopicCountOutputTypeSelectSchema: z.ZodType<Prisma.TestTopicCountOutputTypeSelect> =
  z
    .object({
      versions: z.boolean().optional(),
    })
    .strict();

export const TestTopicSelectSchema: z.ZodType<Prisma.TestTopicSelect> = z
  .object({
    id: z.boolean().optional(),
    slug: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    activeDraftVersionId: z.boolean().optional(),
    activePublishedVersionId: z.boolean().optional(),
    versions: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionFindManyArgsSchema)])
      .optional(),
    activeDraftVersion: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionArgsSchema)])
      .optional(),
    activePublishedVersion: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => TestTopicCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// TEST TOPIC VERSION
//------------------------------------------------------

export const TestTopicVersionIncludeSchema: z.ZodType<Prisma.TestTopicVersionInclude> =
  z
    .object({
      topic: z
        .union([z.boolean(), z.lazy(() => TestTopicArgsSchema)])
        .optional(),
      draftForTopic: z
        .union([z.boolean(), z.lazy(() => TestTopicFindManyArgsSchema)])
        .optional(),
      publishedForTopic: z
        .union([z.boolean(), z.lazy(() => TestTopicFindManyArgsSchema)])
        .optional(),
      questions: z
        .union([z.boolean(), z.lazy(() => TestQuestionFindManyArgsSchema)])
        .optional(),
      _count: z
        .union([
          z.boolean(),
          z.lazy(() => TestTopicVersionCountOutputTypeArgsSchema),
        ])
        .optional(),
    })
    .strict();

export const TestTopicVersionArgsSchema: z.ZodType<Prisma.TestTopicVersionDefaultArgs> =
  z
    .object({
      select: z.lazy(() => TestTopicVersionSelectSchema).optional(),
      include: z.lazy(() => TestTopicVersionIncludeSchema).optional(),
    })
    .strict();

export const TestTopicVersionCountOutputTypeArgsSchema: z.ZodType<Prisma.TestTopicVersionCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z
        .lazy(() => TestTopicVersionCountOutputTypeSelectSchema)
        .nullish(),
    })
    .strict();

export const TestTopicVersionCountOutputTypeSelectSchema: z.ZodType<Prisma.TestTopicVersionCountOutputTypeSelect> =
  z
    .object({
      draftForTopic: z.boolean().optional(),
      publishedForTopic: z.boolean().optional(),
      questions: z.boolean().optional(),
    })
    .strict();

export const TestTopicVersionSelectSchema: z.ZodType<Prisma.TestTopicVersionSelect> =
  z
    .object({
      id: z.boolean().optional(),
      topicId: z.boolean().optional(),
      versionNumber: z.boolean().optional(),
      status: z.boolean().optional(),
      title: z.boolean().optional(),
      description: z.boolean().optional(),
      createdAt: z.boolean().optional(),
      updatedAt: z.boolean().optional(),
      topic: z
        .union([z.boolean(), z.lazy(() => TestTopicArgsSchema)])
        .optional(),
      draftForTopic: z
        .union([z.boolean(), z.lazy(() => TestTopicFindManyArgsSchema)])
        .optional(),
      publishedForTopic: z
        .union([z.boolean(), z.lazy(() => TestTopicFindManyArgsSchema)])
        .optional(),
      questions: z
        .union([z.boolean(), z.lazy(() => TestQuestionFindManyArgsSchema)])
        .optional(),
      _count: z
        .union([
          z.boolean(),
          z.lazy(() => TestTopicVersionCountOutputTypeArgsSchema),
        ])
        .optional(),
    })
    .strict();

// TEST QUESTION
//------------------------------------------------------

export const TestQuestionIncludeSchema: z.ZodType<Prisma.TestQuestionInclude> =
  z
    .object({
      version: z
        .union([z.boolean(), z.lazy(() => TestTopicVersionArgsSchema)])
        .optional(),
      options: z
        .union([
          z.boolean(),
          z.lazy(() => TestQuestionOptionFindManyArgsSchema),
        ])
        .optional(),
      sliderBands: z
        .union([
          z.boolean(),
          z.lazy(() => TestQuestionSliderBandFindManyArgsSchema),
        ])
        .optional(),
      _count: z
        .union([
          z.boolean(),
          z.lazy(() => TestQuestionCountOutputTypeArgsSchema),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionArgsSchema: z.ZodType<Prisma.TestQuestionDefaultArgs> =
  z
    .object({
      select: z.lazy(() => TestQuestionSelectSchema).optional(),
      include: z.lazy(() => TestQuestionIncludeSchema).optional(),
    })
    .strict();

export const TestQuestionCountOutputTypeArgsSchema: z.ZodType<Prisma.TestQuestionCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => TestQuestionCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const TestQuestionCountOutputTypeSelectSchema: z.ZodType<Prisma.TestQuestionCountOutputTypeSelect> =
  z
    .object({
      options: z.boolean().optional(),
      sliderBands: z.boolean().optional(),
    })
    .strict();

export const TestQuestionSelectSchema: z.ZodType<Prisma.TestQuestionSelect> = z
  .object({
    id: z.boolean().optional(),
    versionId: z.boolean().optional(),
    type: z.boolean().optional(),
    title: z.boolean().optional(),
    description: z.boolean().optional(),
    required: z.boolean().optional(),
    order: z.boolean().optional(),
    settings: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    version: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionArgsSchema)])
      .optional(),
    options: z
      .union([z.boolean(), z.lazy(() => TestQuestionOptionFindManyArgsSchema)])
      .optional(),
    sliderBands: z
      .union([
        z.boolean(),
        z.lazy(() => TestQuestionSliderBandFindManyArgsSchema),
      ])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => TestQuestionCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// TEST QUESTION OPTION
//------------------------------------------------------

export const TestQuestionOptionIncludeSchema: z.ZodType<Prisma.TestQuestionOptionInclude> =
  z
    .object({
      question: z
        .union([z.boolean(), z.lazy(() => TestQuestionArgsSchema)])
        .optional(),
    })
    .strict();

export const TestQuestionOptionArgsSchema: z.ZodType<Prisma.TestQuestionOptionDefaultArgs> =
  z
    .object({
      select: z.lazy(() => TestQuestionOptionSelectSchema).optional(),
      include: z.lazy(() => TestQuestionOptionIncludeSchema).optional(),
    })
    .strict();

export const TestQuestionOptionSelectSchema: z.ZodType<Prisma.TestQuestionOptionSelect> =
  z
    .object({
      id: z.boolean().optional(),
      questionId: z.boolean().optional(),
      label: z.boolean().optional(),
      value: z.boolean().optional(),
      weight: z.boolean().optional(),
      order: z.boolean().optional(),
      createdAt: z.boolean().optional(),
      updatedAt: z.boolean().optional(),
      question: z
        .union([z.boolean(), z.lazy(() => TestQuestionArgsSchema)])
        .optional(),
    })
    .strict();

// TEST QUESTION SLIDER BAND
//------------------------------------------------------

export const TestQuestionSliderBandIncludeSchema: z.ZodType<Prisma.TestQuestionSliderBandInclude> =
  z
    .object({
      question: z
        .union([z.boolean(), z.lazy(() => TestQuestionArgsSchema)])
        .optional(),
    })
    .strict();

export const TestQuestionSliderBandArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandDefaultArgs> =
  z
    .object({
      select: z.lazy(() => TestQuestionSliderBandSelectSchema).optional(),
      include: z.lazy(() => TestQuestionSliderBandIncludeSchema).optional(),
    })
    .strict();

export const TestQuestionSliderBandSelectSchema: z.ZodType<Prisma.TestQuestionSliderBandSelect> =
  z
    .object({
      id: z.boolean().optional(),
      questionId: z.boolean().optional(),
      minValue: z.boolean().optional(),
      maxValue: z.boolean().optional(),
      label: z.boolean().optional(),
      weight: z.boolean().optional(),
      order: z.boolean().optional(),
      question: z
        .union([z.boolean(), z.lazy(() => TestQuestionArgsSchema)])
        .optional(),
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

export const TestTopicWhereInputSchema: z.ZodType<Prisma.TestTopicWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestTopicWhereInputSchema),
        z.lazy(() => TestTopicWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestTopicWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestTopicWhereInputSchema),
        z.lazy(() => TestTopicWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    slug: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    activeDraftVersionId: z
      .union([z.lazy(() => IntNullableFilterSchema), z.number()])
      .optional()
      .nullable(),
    activePublishedVersionId: z
      .union([z.lazy(() => IntNullableFilterSchema), z.number()])
      .optional()
      .nullable(),
    versions: z.lazy(() => TestTopicVersionListRelationFilterSchema).optional(),
    activeDraftVersion: z
      .union([
        z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema),
        z.lazy(() => TestTopicVersionWhereInputSchema),
      ])
      .optional()
      .nullable(),
    activePublishedVersion: z
      .union([
        z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema),
        z.lazy(() => TestTopicVersionWhereInputSchema),
      ])
      .optional()
      .nullable(),
  });

export const TestTopicOrderByWithRelationInputSchema: z.ZodType<Prisma.TestTopicOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    slug: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    activePublishedVersionId: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    versions: z
      .lazy(() => TestTopicVersionOrderByRelationAggregateInputSchema)
      .optional(),
    activeDraftVersion: z
      .lazy(() => TestTopicVersionOrderByWithRelationInputSchema)
      .optional(),
    activePublishedVersion: z
      .lazy(() => TestTopicVersionOrderByWithRelationInputSchema)
      .optional(),
  });

export const TestTopicWhereUniqueInputSchema: z.ZodType<Prisma.TestTopicWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.number().int(),
        slug: z.string(),
      }),
      z.object({
        id: z.number().int(),
      }),
      z.object({
        slug: z.string(),
      }),
    ])
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        slug: z.string().optional(),
        AND: z
          .union([
            z.lazy(() => TestTopicWhereInputSchema),
            z.lazy(() => TestTopicWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => TestTopicWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => TestTopicWhereInputSchema),
            z.lazy(() => TestTopicWhereInputSchema).array(),
          ])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        activeDraftVersionId: z
          .union([z.lazy(() => IntNullableFilterSchema), z.number().int()])
          .optional()
          .nullable(),
        activePublishedVersionId: z
          .union([z.lazy(() => IntNullableFilterSchema), z.number().int()])
          .optional()
          .nullable(),
        versions: z
          .lazy(() => TestTopicVersionListRelationFilterSchema)
          .optional(),
        activeDraftVersion: z
          .union([
            z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema),
            z.lazy(() => TestTopicVersionWhereInputSchema),
          ])
          .optional()
          .nullable(),
        activePublishedVersion: z
          .union([
            z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema),
            z.lazy(() => TestTopicVersionWhereInputSchema),
          ])
          .optional()
          .nullable(),
      }),
    );

export const TestTopicOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestTopicOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    slug: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    activePublishedVersionId: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    _count: z.lazy(() => TestTopicCountOrderByAggregateInputSchema).optional(),
    _avg: z.lazy(() => TestTopicAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => TestTopicMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => TestTopicMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => TestTopicSumOrderByAggregateInputSchema).optional(),
  });

export const TestTopicScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestTopicScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema),
        z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestTopicScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema),
        z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    slug: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
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
    activeDraftVersionId: z
      .union([z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number()])
      .optional()
      .nullable(),
    activePublishedVersionId: z
      .union([z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number()])
      .optional()
      .nullable(),
  });

export const TestTopicVersionWhereInputSchema: z.ZodType<Prisma.TestTopicVersionWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestTopicVersionWhereInputSchema),
        z.lazy(() => TestTopicVersionWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestTopicVersionWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestTopicVersionWhereInputSchema),
        z.lazy(() => TestTopicVersionWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    topicId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    versionNumber: z
      .union([z.lazy(() => IntFilterSchema), z.number()])
      .optional(),
    status: z
      .union([
        z.lazy(() => EnumTestTopicVersionStatusFilterSchema),
        z.lazy(() => TestTopicVersionStatusSchema),
      ])
      .optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    topic: z
      .union([
        z.lazy(() => TestTopicScalarRelationFilterSchema),
        z.lazy(() => TestTopicWhereInputSchema),
      ])
      .optional(),
    draftForTopic: z.lazy(() => TestTopicListRelationFilterSchema).optional(),
    publishedForTopic: z
      .lazy(() => TestTopicListRelationFilterSchema)
      .optional(),
    questions: z.lazy(() => TestQuestionListRelationFilterSchema).optional(),
  });

export const TestTopicVersionOrderByWithRelationInputSchema: z.ZodType<Prisma.TestTopicVersionOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    topic: z.lazy(() => TestTopicOrderByWithRelationInputSchema).optional(),
    draftForTopic: z
      .lazy(() => TestTopicOrderByRelationAggregateInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(() => TestTopicOrderByRelationAggregateInputSchema)
      .optional(),
    questions: z
      .lazy(() => TestQuestionOrderByRelationAggregateInputSchema)
      .optional(),
  });

export const TestTopicVersionWhereUniqueInputSchema: z.ZodType<Prisma.TestTopicVersionWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.number().int(),
        topicId_versionNumber: z.lazy(
          () => TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema,
        ),
      }),
      z.object({
        id: z.number().int(),
      }),
      z.object({
        topicId_versionNumber: z.lazy(
          () => TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema,
        ),
      }),
    ])
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        topicId_versionNumber: z
          .lazy(
            () => TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema,
          )
          .optional(),
        AND: z
          .union([
            z.lazy(() => TestTopicVersionWhereInputSchema),
            z.lazy(() => TestTopicVersionWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => TestTopicVersionWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => TestTopicVersionWhereInputSchema),
            z.lazy(() => TestTopicVersionWhereInputSchema).array(),
          ])
          .optional(),
        topicId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        versionNumber: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        status: z
          .union([
            z.lazy(() => EnumTestTopicVersionStatusFilterSchema),
            z.lazy(() => TestTopicVersionStatusSchema),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        description: z
          .union([z.lazy(() => StringNullableFilterSchema), z.string()])
          .optional()
          .nullable(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        topic: z
          .union([
            z.lazy(() => TestTopicScalarRelationFilterSchema),
            z.lazy(() => TestTopicWhereInputSchema),
          ])
          .optional(),
        draftForTopic: z
          .lazy(() => TestTopicListRelationFilterSchema)
          .optional(),
        publishedForTopic: z
          .lazy(() => TestTopicListRelationFilterSchema)
          .optional(),
        questions: z
          .lazy(() => TestQuestionListRelationFilterSchema)
          .optional(),
      }),
    );

export const TestTopicVersionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestTopicVersionOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => TestTopicVersionCountOrderByAggregateInputSchema)
      .optional(),
    _avg: z
      .lazy(() => TestTopicVersionAvgOrderByAggregateInputSchema)
      .optional(),
    _max: z
      .lazy(() => TestTopicVersionMaxOrderByAggregateInputSchema)
      .optional(),
    _min: z
      .lazy(() => TestTopicVersionMinOrderByAggregateInputSchema)
      .optional(),
    _sum: z
      .lazy(() => TestTopicVersionSumOrderByAggregateInputSchema)
      .optional(),
  });

export const TestTopicVersionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestTopicVersionScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema),
        z
          .lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema),
        z
          .lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema)
          .array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    topicId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    versionNumber: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    status: z
      .union([
        z.lazy(() => EnumTestTopicVersionStatusWithAggregatesFilterSchema),
        z.lazy(() => TestTopicVersionStatusSchema),
      ])
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

export const TestQuestionWhereInputSchema: z.ZodType<Prisma.TestQuestionWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionWhereInputSchema),
        z.lazy(() => TestQuestionWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionWhereInputSchema),
        z.lazy(() => TestQuestionWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    versionId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    type: z
      .union([
        z.lazy(() => EnumTestQuestionTypeFilterSchema),
        z.lazy(() => TestQuestionTypeSchema),
      ])
      .optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    required: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    settings: z.lazy(() => JsonNullableFilterSchema).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    version: z
      .union([
        z.lazy(() => TestTopicVersionScalarRelationFilterSchema),
        z.lazy(() => TestTopicVersionWhereInputSchema),
      ])
      .optional(),
    options: z
      .lazy(() => TestQuestionOptionListRelationFilterSchema)
      .optional(),
    sliderBands: z
      .lazy(() => TestQuestionSliderBandListRelationFilterSchema)
      .optional(),
  });

export const TestQuestionOrderByWithRelationInputSchema: z.ZodType<Prisma.TestQuestionOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    required: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    settings: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    version: z
      .lazy(() => TestTopicVersionOrderByWithRelationInputSchema)
      .optional(),
    options: z
      .lazy(() => TestQuestionOptionOrderByRelationAggregateInputSchema)
      .optional(),
    sliderBands: z
      .lazy(() => TestQuestionSliderBandOrderByRelationAggregateInputSchema)
      .optional(),
  });

export const TestQuestionWhereUniqueInputSchema: z.ZodType<Prisma.TestQuestionWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => TestQuestionWhereInputSchema),
            z.lazy(() => TestQuestionWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => TestQuestionWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => TestQuestionWhereInputSchema),
            z.lazy(() => TestQuestionWhereInputSchema).array(),
          ])
          .optional(),
        versionId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        type: z
          .union([
            z.lazy(() => EnumTestQuestionTypeFilterSchema),
            z.lazy(() => TestQuestionTypeSchema),
          ])
          .optional(),
        title: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        description: z
          .union([z.lazy(() => StringNullableFilterSchema), z.string()])
          .optional()
          .nullable(),
        required: z
          .union([z.lazy(() => BoolFilterSchema), z.boolean()])
          .optional(),
        order: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        settings: z.lazy(() => JsonNullableFilterSchema).optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        version: z
          .union([
            z.lazy(() => TestTopicVersionScalarRelationFilterSchema),
            z.lazy(() => TestTopicVersionWhereInputSchema),
          ])
          .optional(),
        options: z
          .lazy(() => TestQuestionOptionListRelationFilterSchema)
          .optional(),
        sliderBands: z
          .lazy(() => TestQuestionSliderBandListRelationFilterSchema)
          .optional(),
      }),
    );

export const TestQuestionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestQuestionOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    required: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    settings: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputSchema),
      ])
      .optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => TestQuestionCountOrderByAggregateInputSchema)
      .optional(),
    _avg: z.lazy(() => TestQuestionAvgOrderByAggregateInputSchema).optional(),
    _max: z.lazy(() => TestQuestionMaxOrderByAggregateInputSchema).optional(),
    _min: z.lazy(() => TestQuestionMinOrderByAggregateInputSchema).optional(),
    _sum: z.lazy(() => TestQuestionSumOrderByAggregateInputSchema).optional(),
  });

export const TestQuestionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestQuestionScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema),
        z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema),
        z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    versionId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    type: z
      .union([
        z.lazy(() => EnumTestQuestionTypeWithAggregatesFilterSchema),
        z.lazy(() => TestQuestionTypeSchema),
      ])
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
    required: z
      .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
      .optional(),
    order: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    settings: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
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

export const TestQuestionOptionWhereInputSchema: z.ZodType<Prisma.TestQuestionOptionWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionOptionWhereInputSchema),
        z.lazy(() => TestQuestionOptionWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionOptionWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionOptionWhereInputSchema),
        z.lazy(() => TestQuestionOptionWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    questionId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    label: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    value: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    weight: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    question: z
      .union([
        z.lazy(() => TestQuestionScalarRelationFilterSchema),
        z.lazy(() => TestQuestionWhereInputSchema),
      ])
      .optional(),
  });

export const TestQuestionOptionOrderByWithRelationInputSchema: z.ZodType<Prisma.TestQuestionOptionOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    question: z
      .lazy(() => TestQuestionOrderByWithRelationInputSchema)
      .optional(),
  });

export const TestQuestionOptionWhereUniqueInputSchema: z.ZodType<Prisma.TestQuestionOptionWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => TestQuestionOptionWhereInputSchema),
            z.lazy(() => TestQuestionOptionWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => TestQuestionOptionWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => TestQuestionOptionWhereInputSchema),
            z.lazy(() => TestQuestionOptionWhereInputSchema).array(),
          ])
          .optional(),
        questionId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        label: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        value: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        weight: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        order: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        createdAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        updatedAt: z
          .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
          .optional(),
        question: z
          .union([
            z.lazy(() => TestQuestionScalarRelationFilterSchema),
            z.lazy(() => TestQuestionWhereInputSchema),
          ])
          .optional(),
      }),
    );

export const TestQuestionOptionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestQuestionOptionOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => TestQuestionOptionCountOrderByAggregateInputSchema)
      .optional(),
    _avg: z
      .lazy(() => TestQuestionOptionAvgOrderByAggregateInputSchema)
      .optional(),
    _max: z
      .lazy(() => TestQuestionOptionMaxOrderByAggregateInputSchema)
      .optional(),
    _min: z
      .lazy(() => TestQuestionOptionMinOrderByAggregateInputSchema)
      .optional(),
    _sum: z
      .lazy(() => TestQuestionOptionSumOrderByAggregateInputSchema)
      .optional(),
  });

export const TestQuestionOptionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestQuestionOptionScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema),
        z
          .lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema),
        z
          .lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema)
          .array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    questionId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    label: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    value: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    weight: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    order: z
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

export const TestQuestionSliderBandWhereInputSchema: z.ZodType<Prisma.TestQuestionSliderBandWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionSliderBandWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    questionId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    minValue: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    maxValue: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    label: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    weight: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    question: z
      .union([
        z.lazy(() => TestQuestionScalarRelationFilterSchema),
        z.lazy(() => TestQuestionWhereInputSchema),
      ])
      .optional(),
  });

export const TestQuestionSliderBandOrderByWithRelationInputSchema: z.ZodType<Prisma.TestQuestionSliderBandOrderByWithRelationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    question: z
      .lazy(() => TestQuestionOrderByWithRelationInputSchema)
      .optional(),
  });

export const TestQuestionSliderBandWhereUniqueInputSchema: z.ZodType<Prisma.TestQuestionSliderBandWhereUniqueInput> =
  z
    .object({
      id: z.number().int(),
    })
    .and(
      z.strictObject({
        id: z.number().int().optional(),
        AND: z
          .union([
            z.lazy(() => TestQuestionSliderBandWhereInputSchema),
            z.lazy(() => TestQuestionSliderBandWhereInputSchema).array(),
          ])
          .optional(),
        OR: z
          .lazy(() => TestQuestionSliderBandWhereInputSchema)
          .array()
          .optional(),
        NOT: z
          .union([
            z.lazy(() => TestQuestionSliderBandWhereInputSchema),
            z.lazy(() => TestQuestionSliderBandWhereInputSchema).array(),
          ])
          .optional(),
        questionId: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        minValue: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        maxValue: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        label: z
          .union([z.lazy(() => StringFilterSchema), z.string()])
          .optional(),
        weight: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        order: z
          .union([z.lazy(() => IntFilterSchema), z.number().int()])
          .optional(),
        question: z
          .union([
            z.lazy(() => TestQuestionScalarRelationFilterSchema),
            z.lazy(() => TestQuestionWhereInputSchema),
          ])
          .optional(),
      }),
    );

export const TestQuestionSliderBandOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestQuestionSliderBandOrderByWithAggregationInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => TestQuestionSliderBandCountOrderByAggregateInputSchema)
      .optional(),
    _avg: z
      .lazy(() => TestQuestionSliderBandAvgOrderByAggregateInputSchema)
      .optional(),
    _max: z
      .lazy(() => TestQuestionSliderBandMaxOrderByAggregateInputSchema)
      .optional(),
    _min: z
      .lazy(() => TestQuestionSliderBandMinOrderByAggregateInputSchema)
      .optional(),
    _sum: z
      .lazy(() => TestQuestionSliderBandSumOrderByAggregateInputSchema)
      .optional(),
  });

export const TestQuestionSliderBandScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestQuestionSliderBandScalarWhereWithAggregatesInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(
          () => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema,
          )
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(
          () => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema,
          )
          .array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    questionId: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    minValue: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    maxValue: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    label: z
      .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
      .optional(),
    weight: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
      .optional(),
    order: z
      .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
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

export const TestTopicCreateInputSchema: z.ZodType<Prisma.TestTopicCreateInput> =
  z.strictObject({
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    versions: z
      .lazy(() => TestTopicVersionCreateNestedManyWithoutTopicInputSchema)
      .optional(),
    activeDraftVersion: z
      .lazy(
        () => TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema,
      )
      .optional(),
    activePublishedVersion: z
      .lazy(
        () =>
          TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedCreateInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activeDraftVersionId: z.number().int().optional().nullable(),
    activePublishedVersionId: z.number().int().optional().nullable(),
    versions: z
      .lazy(
        () => TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicUpdateInputSchema: z.ZodType<Prisma.TestTopicUpdateInput> =
  z.strictObject({
    slug: z
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
    versions: z
      .lazy(() => TestTopicVersionUpdateManyWithoutTopicNestedInputSchema)
      .optional(),
    activeDraftVersion: z
      .lazy(
        () => TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema,
      )
      .optional(),
    activePublishedVersion: z
      .lazy(
        () =>
          TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedUpdateInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activeDraftVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    activePublishedVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    versions: z
      .lazy(
        () => TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicCreateManyInputSchema: z.ZodType<Prisma.TestTopicCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activeDraftVersionId: z.number().int().optional().nullable(),
    activePublishedVersionId: z.number().int().optional().nullable(),
  });

export const TestTopicUpdateManyMutationInputSchema: z.ZodType<Prisma.TestTopicUpdateManyMutationInput> =
  z.strictObject({
    slug: z
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

export const TestTopicUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activeDraftVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    activePublishedVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
  });

export const TestTopicVersionCreateInputSchema: z.ZodType<Prisma.TestTopicVersionCreateInput> =
  z.strictObject({
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
    draftForTopic: z
      .lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedCreateInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    topicId: z.number().int(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema,
      )
      .optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionUpdateInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateInput> =
  z.strictObject({
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    topic: z
      .lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema)
      .optional(),
    draftForTopic: z
      .lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedUpdateInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    topicId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema,
      )
      .optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionCreateManyInputSchema: z.ZodType<Prisma.TestTopicVersionCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    topicId: z.number().int(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestTopicVersionUpdateManyMutationInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyMutationInput> =
  z.strictObject({
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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

export const TestTopicVersionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    topicId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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

export const TestQuestionCreateInputSchema: z.ZodType<Prisma.TestQuestionCreateInput> =
  z.strictObject({
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    version: z.lazy(
      () => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema,
    ),
    options: z
      .lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema)
      .optional(),
    sliderBands: z
      .lazy(
        () => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedCreateInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    versionId: z.number().int(),
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    options: z
      .lazy(
        () =>
          TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
    sliderBands: z
      .lazy(
        () =>
          TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionUpdateInputSchema: z.ZodType<Prisma.TestQuestionUpdateInput> =
  z.strictObject({
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    version: z
      .lazy(
        () =>
          TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema,
      )
      .optional(),
    options: z
      .lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema)
      .optional(),
    sliderBands: z
      .lazy(
        () => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedUpdateInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    options: z
      .lazy(
        () =>
          TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
    sliderBands: z
      .lazy(
        () =>
          TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionCreateManyInputSchema: z.ZodType<Prisma.TestQuestionCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    versionId: z.number().int(),
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestQuestionUpdateManyMutationInputSchema: z.ZodType<Prisma.TestQuestionUpdateManyMutationInput> =
  z.strictObject({
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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

export const TestQuestionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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

export const TestQuestionOptionCreateInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateInput> =
  z.strictObject({
    label: z.string(),
    value: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    question: z.lazy(
      () => TestQuestionCreateNestedOneWithoutOptionsInputSchema,
    ),
  });

export const TestQuestionOptionUncheckedCreateInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    questionId: z.number().int(),
    label: z.string(),
    value: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestQuestionOptionUpdateInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateInput> =
  z.strictObject({
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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
    question: z
      .lazy(() => TestQuestionUpdateOneRequiredWithoutOptionsNestedInputSchema)
      .optional(),
  });

export const TestQuestionOptionUncheckedUpdateInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    questionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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

export const TestQuestionOptionCreateManyInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    questionId: z.number().int(),
    label: z.string(),
    value: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestQuestionOptionUpdateManyMutationInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyMutationInput> =
  z.strictObject({
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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

export const TestQuestionOptionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    questionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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

export const TestQuestionSliderBandCreateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateInput> =
  z.strictObject({
    minValue: z.number().int(),
    maxValue: z.number().int(),
    label: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    question: z.lazy(
      () => TestQuestionCreateNestedOneWithoutSliderBandsInputSchema,
    ),
  });

export const TestQuestionSliderBandUncheckedCreateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedCreateInput> =
  z.strictObject({
    id: z.number().int().optional(),
    questionId: z.number().int(),
    minValue: z.number().int(),
    maxValue: z.number().int(),
    label: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
  });

export const TestQuestionSliderBandUpdateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateInput> =
  z.strictObject({
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    question: z
      .lazy(
        () => TestQuestionUpdateOneRequiredWithoutSliderBandsNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionSliderBandUncheckedUpdateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    questionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const TestQuestionSliderBandCreateManyInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyInput> =
  z.strictObject({
    id: z.number().int().optional(),
    questionId: z.number().int(),
    minValue: z.number().int(),
    maxValue: z.number().int(),
    label: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
  });

export const TestQuestionSliderBandUpdateManyMutationInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyMutationInput> =
  z.strictObject({
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const TestQuestionSliderBandUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateManyInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    questionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
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

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> =
  z.strictObject({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
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

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> =
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

export const TestTopicVersionListRelationFilterSchema: z.ZodType<Prisma.TestTopicVersionListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
    some: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
    none: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  });

export const TestTopicVersionNullableScalarRelationFilterSchema: z.ZodType<Prisma.TestTopicVersionNullableScalarRelationFilter> =
  z.strictObject({
    is: z
      .lazy(() => TestTopicVersionWhereInputSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => TestTopicVersionWhereInputSchema)
      .optional()
      .nullable(),
  });

export const TestTopicVersionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    slug: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
    activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
    activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    slug: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
    activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    slug: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
    activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
    activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
  });

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> =
  z.strictObject({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([
        z.number(),
        z.lazy(() => NestedIntNullableWithAggregatesFilterSchema),
      ])
      .optional()
      .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
    _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  });

export const EnumTestTopicVersionStatusFilterSchema: z.ZodType<Prisma.EnumTestTopicVersionStatusFilter> =
  z.strictObject({
    equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    in: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema),
      ])
      .optional(),
  });

export const TestTopicScalarRelationFilterSchema: z.ZodType<Prisma.TestTopicScalarRelationFilter> =
  z.strictObject({
    is: z.lazy(() => TestTopicWhereInputSchema).optional(),
    isNot: z.lazy(() => TestTopicWhereInputSchema).optional(),
  });

export const TestTopicListRelationFilterSchema: z.ZodType<Prisma.TestTopicListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => TestTopicWhereInputSchema).optional(),
    some: z.lazy(() => TestTopicWhereInputSchema).optional(),
    none: z.lazy(() => TestTopicWhereInputSchema).optional(),
  });

export const TestQuestionListRelationFilterSchema: z.ZodType<Prisma.TestQuestionListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => TestQuestionWhereInputSchema).optional(),
    some: z.lazy(() => TestQuestionWhereInputSchema).optional(),
    none: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  });

export const TestTopicOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestTopicOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestQuestionOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema: z.ZodType<Prisma.TestTopicVersionTopicIdVersionNumberCompoundUniqueInput> =
  z.strictObject({
    topicId: z.number(),
    versionNumber: z.number(),
  });

export const TestTopicVersionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicVersionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicVersionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicVersionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
    status: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestTopicVersionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    topicId: z.lazy(() => SortOrderSchema).optional(),
    versionNumber: z.lazy(() => SortOrderSchema).optional(),
  });

export const EnumTestTopicVersionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestTopicVersionStatusWithAggregatesFilter> =
  z.strictObject({
    equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    in: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => NestedEnumTestTopicVersionStatusWithAggregatesFilterSchema,
        ),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
  });

export const EnumTestQuestionTypeFilterSchema: z.ZodType<Prisma.EnumTestQuestionTypeFilter> =
  z.strictObject({
    equals: z.lazy(() => TestQuestionTypeSchema).optional(),
    in: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => NestedEnumTestQuestionTypeFilterSchema),
      ])
      .optional(),
  });

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)]).optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> =
  z.strictObject({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
  });

export const TestTopicVersionScalarRelationFilterSchema: z.ZodType<Prisma.TestTopicVersionScalarRelationFilter> =
  z.strictObject({
    is: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
    isNot: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  });

export const TestQuestionOptionListRelationFilterSchema: z.ZodType<Prisma.TestQuestionOptionListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => TestQuestionOptionWhereInputSchema).optional(),
    some: z.lazy(() => TestQuestionOptionWhereInputSchema).optional(),
    none: z.lazy(() => TestQuestionOptionWhereInputSchema).optional(),
  });

export const TestQuestionSliderBandListRelationFilterSchema: z.ZodType<Prisma.TestQuestionSliderBandListRelationFilter> =
  z.strictObject({
    every: z.lazy(() => TestQuestionSliderBandWhereInputSchema).optional(),
    some: z.lazy(() => TestQuestionSliderBandWhereInputSchema).optional(),
    none: z.lazy(() => TestQuestionSliderBandWhereInputSchema).optional(),
  });

export const TestQuestionOptionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSliderBandOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandOrderByRelationAggregateInput> =
  z.strictObject({
    _count: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    required: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    settings: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    required: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    required: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    versionId: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const EnumTestQuestionTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestQuestionTypeWithAggregatesFilter> =
  z.strictObject({
    equals: z.lazy(() => TestQuestionTypeSchema).optional(),
    in: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => NestedEnumTestQuestionTypeWithAggregatesFilterSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
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

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> =
  z.strictObject({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  });

export const TestQuestionScalarRelationFilterSchema: z.ZodType<Prisma.TestQuestionScalarRelationFilter> =
  z.strictObject({
    is: z.lazy(() => TestQuestionWhereInputSchema).optional(),
    isNot: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  });

export const TestQuestionOptionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionOptionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionOptionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionOptionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
    createdAt: z.lazy(() => SortOrderSchema).optional(),
    updatedAt: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionOptionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSliderBandCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCountOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSliderBandAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandAvgOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSliderBandMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandMaxOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSliderBandMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandMinOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    label: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
  });

export const TestQuestionSliderBandSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandSumOrderByAggregateInput> =
  z.strictObject({
    id: z.lazy(() => SortOrderSchema).optional(),
    questionId: z.lazy(() => SortOrderSchema).optional(),
    minValue: z.lazy(() => SortOrderSchema).optional(),
    maxValue: z.lazy(() => SortOrderSchema).optional(),
    weight: z.lazy(() => SortOrderSchema).optional(),
    order: z.lazy(() => SortOrderSchema).optional(),
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

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.number().optional(),
    increment: z.number().optional(),
    decrement: z.number().optional(),
    multiply: z.number().optional(),
    divide: z.number().optional(),
  });

export const TestTopicVersionCreateNestedManyWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedManyWithoutTopicInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema),
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(),
        z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutDraftForTopicInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema),
        z.lazy(
          () => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema,
        ),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(
        () => TestTopicVersionCreateOrConnectWithoutDraftForTopicInputSchema,
      )
      .optional(),
    connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  });

export const TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutPublishedForTopicInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema),
        z.lazy(
          () =>
            TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema,
        ),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(
        () =>
          TestTopicVersionCreateOrConnectWithoutPublishedForTopicInputSchema,
      )
      .optional(),
    connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  });

export const TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateNestedManyWithoutTopicInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema),
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(),
        z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicVersionUpdateManyWithoutTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyWithoutTopicNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema),
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(),
        z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema,
        ),
        z
          .lazy(
            () => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema,
        ),
        z
          .lazy(
            () => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema,
        ),
        z
          .lazy(
            () => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestTopicVersionScalarWhereInputSchema),
        z.lazy(() => TestTopicVersionScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneWithoutDraftForTopicNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema),
        z.lazy(
          () => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema,
        ),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(
        () => TestTopicVersionCreateOrConnectWithoutDraftForTopicInputSchema,
      )
      .optional(),
    upsert: z
      .lazy(() => TestTopicVersionUpsertWithoutDraftForTopicInputSchema)
      .optional(),
    disconnect: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionWhereInputSchema)])
      .optional(),
    delete: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionWhereInputSchema)])
      .optional(),
    connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestTopicVersionUpdateToOneWithWhereWithoutDraftForTopicInputSchema,
        ),
        z.lazy(() => TestTopicVersionUpdateWithoutDraftForTopicInputSchema),
        z.lazy(
          () => TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema,
        ),
      ])
      .optional(),
  });

export const TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema),
        z.lazy(
          () =>
            TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema,
        ),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(
        () =>
          TestTopicVersionCreateOrConnectWithoutPublishedForTopicInputSchema,
      )
      .optional(),
    upsert: z
      .lazy(() => TestTopicVersionUpsertWithoutPublishedForTopicInputSchema)
      .optional(),
    disconnect: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionWhereInputSchema)])
      .optional(),
    delete: z
      .union([z.boolean(), z.lazy(() => TestTopicVersionWhereInputSchema)])
      .optional(),
    connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestTopicVersionUpdateToOneWithWhereWithoutPublishedForTopicInputSchema,
        ),
        z.lazy(() => TestTopicVersionUpdateWithoutPublishedForTopicInputSchema),
        z.lazy(
          () =>
            TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema,
        ),
      ])
      .optional(),
  });

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.number().optional().nullable(),
    increment: z.number().optional(),
    decrement: z.number().optional(),
    multiply: z.number().optional(),
    divide: z.number().optional(),
  });

export const TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema),
        z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(),
        z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema),
        z
          .lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema)
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema,
        ),
        z
          .lazy(
            () => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
        z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema,
        ),
        z
          .lazy(
            () => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema,
        ),
        z
          .lazy(
            () => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestTopicVersionScalarWhereInputSchema),
        z.lazy(() => TestTopicVersionScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicCreateNestedOneWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicCreateNestedOneWithoutVersionsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutVersionsInputSchema),
        z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestTopicCreateOrConnectWithoutVersionsInputSchema)
      .optional(),
    connect: z.lazy(() => TestTopicWhereUniqueInputSchema).optional(),
  });

export const TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateNestedManyWithoutActiveDraftVersionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema)
          .array(),
        z.lazy(
          () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateNestedManyWithoutActivePublishedVersionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema)
          .array(),
        z.lazy(
          () =>
            TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () =>
            TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionCreateNestedManyWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedManyWithoutVersionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema),
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(),
        z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema)
          .array(),
        z.lazy(
          () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema)
          .array(),
        z.lazy(
          () =>
            TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () =>
            TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateNestedManyWithoutVersionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema),
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(),
        z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestTopicVersionStatusFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  });

export const TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema: z.ZodType<Prisma.TestTopicUpdateOneRequiredWithoutVersionsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutVersionsInputSchema),
        z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestTopicCreateOrConnectWithoutVersionsInputSchema)
      .optional(),
    upsert: z.lazy(() => TestTopicUpsertWithoutVersionsInputSchema).optional(),
    connect: z.lazy(() => TestTopicWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => TestTopicUpdateToOneWithWhereWithoutVersionsInputSchema),
        z.lazy(() => TestTopicUpdateWithoutVersionsInputSchema),
        z.lazy(() => TestTopicUncheckedUpdateWithoutVersionsInputSchema),
      ])
      .optional(),
  });

export const TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithoutActiveDraftVersionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema)
          .array(),
        z.lazy(
          () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestTopicScalarWhereInputSchema),
        z.lazy(() => TestTopicScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithoutActivePublishedVersionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema)
          .array(),
        z.lazy(
          () =>
            TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () =>
            TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestTopicScalarWhereInputSchema),
        z.lazy(() => TestTopicScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionUpdateManyWithoutVersionNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateManyWithoutVersionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema),
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(),
        z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestQuestionScalarWhereInputSchema),
        z.lazy(() => TestQuestionScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema)
          .array(),
        z.lazy(
          () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestTopicScalarWhereInputSchema),
        z.lazy(() => TestTopicScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema),
        z
          .lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema)
          .array(),
        z.lazy(
          () =>
            TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () =>
            TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestTopicWhereUniqueInputSchema),
        z.lazy(() => TestTopicWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () =>
            TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestTopicScalarWhereInputSchema),
        z.lazy(() => TestTopicScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateManyWithoutVersionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema),
        z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(),
        z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema),
        z
          .lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema)
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestQuestionScalarWhereInputSchema),
        z.lazy(() => TestQuestionScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutQuestionsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema),
        z.lazy(
          () => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema,
        ),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestTopicVersionCreateOrConnectWithoutQuestionsInputSchema)
      .optional(),
    connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  });

export const TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateNestedManyWithoutQuestionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateNestedManyWithoutQuestionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
  });

export const EnumTestQuestionTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestQuestionTypeFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.lazy(() => TestQuestionTypeSchema).optional(),
  });

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> =
  z.strictObject({
    set: z.boolean().optional(),
  });

export const TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema),
        z.lazy(
          () => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema,
        ),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestTopicVersionCreateOrConnectWithoutQuestionsInputSchema)
      .optional(),
    upsert: z
      .lazy(() => TestTopicVersionUpsertWithoutQuestionsInputSchema)
      .optional(),
    connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(
          () => TestTopicVersionUpdateToOneWithWhereWithoutQuestionsInputSchema,
        ),
        z.lazy(() => TestTopicVersionUpdateWithoutQuestionsInputSchema),
        z.lazy(
          () => TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema,
        ),
      ])
      .optional(),
  });

export const TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyWithoutQuestionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () => TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema),
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyWithoutQuestionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () =>
            TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema),
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
        z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () => TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema),
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema),
        z
          .lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema)
          .array(),
        z.lazy(
          () => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(
          () => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () =>
            TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
        z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () =>
            TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () =>
            TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema,
        ),
        z
          .lazy(
            () =>
              TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema),
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array(),
      ])
      .optional(),
  });

export const TestQuestionCreateNestedOneWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedOneWithoutOptionsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema),
        z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestQuestionCreateOrConnectWithoutOptionsInputSchema)
      .optional(),
    connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
  });

export const TestQuestionUpdateOneRequiredWithoutOptionsNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateOneRequiredWithoutOptionsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema),
        z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestQuestionCreateOrConnectWithoutOptionsInputSchema)
      .optional(),
    upsert: z
      .lazy(() => TestQuestionUpsertWithoutOptionsInputSchema)
      .optional(),
    connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(() => TestQuestionUpdateToOneWithWhereWithoutOptionsInputSchema),
        z.lazy(() => TestQuestionUpdateWithoutOptionsInputSchema),
        z.lazy(() => TestQuestionUncheckedUpdateWithoutOptionsInputSchema),
      ])
      .optional(),
  });

export const TestQuestionCreateNestedOneWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedOneWithoutSliderBandsInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema),
        z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestQuestionCreateOrConnectWithoutSliderBandsInputSchema)
      .optional(),
    connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
  });

export const TestQuestionUpdateOneRequiredWithoutSliderBandsNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateOneRequiredWithoutSliderBandsNestedInput> =
  z.strictObject({
    create: z
      .union([
        z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema),
        z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => TestQuestionCreateOrConnectWithoutSliderBandsInputSchema)
      .optional(),
    upsert: z
      .lazy(() => TestQuestionUpsertWithoutSliderBandsInputSchema)
      .optional(),
    connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
    update: z
      .union([
        z.lazy(
          () => TestQuestionUpdateToOneWithWhereWithoutSliderBandsInputSchema,
        ),
        z.lazy(() => TestQuestionUpdateWithoutSliderBandsInputSchema),
        z.lazy(() => TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema),
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

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> =
  z.strictObject({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([
        z.number(),
        z.lazy(() => NestedIntNullableWithAggregatesFilterSchema),
      ])
      .optional()
      .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
    _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
    _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  });

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> =
  z.strictObject({
    equals: z.number().optional().nullable(),
    in: z.number().array().optional().nullable(),
    notIn: z.number().array().optional().nullable(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedFloatNullableFilterSchema)])
      .optional()
      .nullable(),
  });

export const NestedEnumTestTopicVersionStatusFilterSchema: z.ZodType<Prisma.NestedEnumTestTopicVersionStatusFilter> =
  z.strictObject({
    equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    in: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema),
      ])
      .optional(),
  });

export const NestedEnumTestTopicVersionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestTopicVersionStatusWithAggregatesFilter> =
  z.strictObject({
    equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    in: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestTopicVersionStatusSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => NestedEnumTestTopicVersionStatusWithAggregatesFilterSchema,
        ),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
  });

export const NestedEnumTestQuestionTypeFilterSchema: z.ZodType<Prisma.NestedEnumTestQuestionTypeFilter> =
  z.strictObject({
    equals: z.lazy(() => TestQuestionTypeSchema).optional(),
    in: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => NestedEnumTestQuestionTypeFilterSchema),
      ])
      .optional(),
  });

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> =
  z.strictObject({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
      .optional(),
  });

export const NestedEnumTestQuestionTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestQuestionTypeWithAggregatesFilter> =
  z.strictObject({
    equals: z.lazy(() => TestQuestionTypeSchema).optional(),
    in: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    notIn: z
      .lazy(() => TestQuestionTypeSchema)
      .array()
      .optional(),
    not: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => NestedEnumTestQuestionTypeWithAggregatesFilterSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterSchema).optional(),
    _min: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
    _max: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
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

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> =
  z.strictObject({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
  });

export const TestTopicVersionCreateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutTopicInput> =
  z.strictObject({
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draftForTopic: z
      .lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedCreateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutTopicInput> =
  z.strictObject({
    id: z.number().int().optional(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema,
      )
      .optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionCreateOrConnectWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema),
      z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema),
    ]),
  });

export const TestTopicVersionCreateManyTopicInputEnvelopeSchema: z.ZodType<Prisma.TestTopicVersionCreateManyTopicInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TestTopicVersionCreateManyTopicInputSchema),
      z.lazy(() => TestTopicVersionCreateManyTopicInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TestTopicVersionCreateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutDraftForTopicInput> =
  z.strictObject({
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
    publishedForTopic: z
      .lazy(
        () => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutDraftForTopicInput> =
  z.strictObject({
    id: z.number().int().optional(),
    topicId: z.number().int(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionCreateOrConnectWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutDraftForTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema),
      z.lazy(
        () => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema,
      ),
    ]),
  });

export const TestTopicVersionCreateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutPublishedForTopicInput> =
  z.strictObject({
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
    draftForTopic: z
      .lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema)
      .optional(),
    questions: z
      .lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutPublishedForTopicInput> =
  z.strictObject({
    id: z.number().int().optional(),
    topicId: z.number().int(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionCreateOrConnectWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutPublishedForTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema),
      z.lazy(
        () =>
          TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema,
      ),
    ]),
  });

export const TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithWhereUniqueWithoutTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutTopicInputSchema),
      z.lazy(() => TestTopicVersionUncheckedUpdateWithoutTopicInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema),
      z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema),
    ]),
  });

export const TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithWhereUniqueWithoutTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutTopicInputSchema),
      z.lazy(() => TestTopicVersionUncheckedUpdateWithoutTopicInputSchema),
    ]),
  });

export const TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyWithWhereWithoutTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TestTopicVersionUpdateManyMutationInputSchema),
      z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutTopicInputSchema),
    ]),
  });

export const TestTopicVersionScalarWhereInputSchema: z.ZodType<Prisma.TestTopicVersionScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestTopicVersionScalarWhereInputSchema),
        z.lazy(() => TestTopicVersionScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestTopicVersionScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestTopicVersionScalarWhereInputSchema),
        z.lazy(() => TestTopicVersionScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    topicId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    versionNumber: z
      .union([z.lazy(() => IntFilterSchema), z.number()])
      .optional(),
    status: z
      .union([
        z.lazy(() => EnumTestTopicVersionStatusFilterSchema),
        z.lazy(() => TestTopicVersionStatusSchema),
      ])
      .optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const TestTopicVersionUpsertWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutDraftForTopicInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutDraftForTopicInputSchema),
      z.lazy(
        () => TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema),
      z.lazy(
        () => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema,
      ),
    ]),
    where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  });

export const TestTopicVersionUpdateToOneWithWhereWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutDraftForTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutDraftForTopicInputSchema),
      z.lazy(
        () => TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema,
      ),
    ]),
  });

export const TestTopicVersionUpdateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutDraftForTopicInput> =
  z.strictObject({
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    topic: z
      .lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutDraftForTopicInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    topicId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionUpsertWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutPublishedForTopicInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutPublishedForTopicInputSchema),
      z.lazy(
        () =>
          TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema),
      z.lazy(
        () =>
          TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema,
      ),
    ]),
    where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  });

export const TestTopicVersionUpdateToOneWithWhereWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutPublishedForTopicInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutPublishedForTopicInputSchema),
      z.lazy(
        () =>
          TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema,
      ),
    ]),
  });

export const TestTopicVersionUpdateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutPublishedForTopicInput> =
  z.strictObject({
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    topic: z
      .lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema)
      .optional(),
    draftForTopic: z
      .lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema)
      .optional(),
    questions: z
      .lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    topicId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicCreateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicCreateWithoutVersionsInput> =
  z.strictObject({
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activeDraftVersion: z
      .lazy(
        () => TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema,
      )
      .optional(),
    activePublishedVersion: z
      .lazy(
        () =>
          TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedCreateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateWithoutVersionsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activeDraftVersionId: z.number().int().optional().nullable(),
    activePublishedVersionId: z.number().int().optional().nullable(),
  });

export const TestTopicCreateOrConnectWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicCreateOrConnectWithoutVersionsInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicCreateWithoutVersionsInputSchema),
      z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema),
    ]),
  });

export const TestTopicCreateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateWithoutActiveDraftVersionInput> =
  z.strictObject({
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    versions: z
      .lazy(() => TestTopicVersionCreateNestedManyWithoutTopicInputSchema)
      .optional(),
    activePublishedVersion: z
      .lazy(
        () =>
          TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateWithoutActiveDraftVersionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activePublishedVersionId: z.number().int().optional().nullable(),
    versions: z
      .lazy(
        () => TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateOrConnectWithoutActiveDraftVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
      ),
    ]),
  });

export const TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema: z.ZodType<Prisma.TestTopicCreateManyActiveDraftVersionInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TestTopicCreateManyActiveDraftVersionInputSchema),
      z.lazy(() => TestTopicCreateManyActiveDraftVersionInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TestTopicCreateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateWithoutActivePublishedVersionInput> =
  z.strictObject({
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    versions: z
      .lazy(() => TestTopicVersionCreateNestedManyWithoutTopicInputSchema)
      .optional(),
    activeDraftVersion: z
      .lazy(
        () => TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateWithoutActivePublishedVersionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activeDraftVersionId: z.number().int().optional().nullable(),
    versions: z
      .lazy(
        () => TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema,
      )
      .optional(),
  });

export const TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateOrConnectWithoutActivePublishedVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
      ),
    ]),
  });

export const TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema: z.ZodType<Prisma.TestTopicCreateManyActivePublishedVersionInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TestTopicCreateManyActivePublishedVersionInputSchema),
      z
        .lazy(() => TestTopicCreateManyActivePublishedVersionInputSchema)
        .array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TestQuestionCreateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutVersionInput> =
  z.strictObject({
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    options: z
      .lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema)
      .optional(),
    sliderBands: z
      .lazy(
        () => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedCreateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutVersionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    options: z
      .lazy(
        () =>
          TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
    sliderBands: z
      .lazy(
        () =>
          TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionCreateOrConnectWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestQuestionCreateWithoutVersionInputSchema),
      z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema),
    ]),
  });

export const TestQuestionCreateManyVersionInputEnvelopeSchema: z.ZodType<Prisma.TestQuestionCreateManyVersionInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TestQuestionCreateManyVersionInputSchema),
      z.lazy(() => TestQuestionCreateManyVersionInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TestTopicUpsertWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUpsertWithoutVersionsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => TestTopicUpdateWithoutVersionsInputSchema),
      z.lazy(() => TestTopicUncheckedUpdateWithoutVersionsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestTopicCreateWithoutVersionsInputSchema),
      z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema),
    ]),
    where: z.lazy(() => TestTopicWhereInputSchema).optional(),
  });

export const TestTopicUpdateToOneWithWhereWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUpdateToOneWithWhereWithoutVersionsInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => TestTopicUpdateWithoutVersionsInputSchema),
      z.lazy(() => TestTopicUncheckedUpdateWithoutVersionsInputSchema),
    ]),
  });

export const TestTopicUpdateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUpdateWithoutVersionsInput> =
  z.strictObject({
    slug: z
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
    activeDraftVersion: z
      .lazy(
        () => TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema,
      )
      .optional(),
    activePublishedVersion: z
      .lazy(
        () =>
          TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedUpdateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateWithoutVersionsInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activeDraftVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    activePublishedVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
  });

export const TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TestTopicUpdateWithoutActiveDraftVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedUpdateWithoutActiveDraftVersionInputSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema,
      ),
    ]),
  });

export const TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TestTopicUpdateWithoutActiveDraftVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedUpdateWithoutActiveDraftVersionInputSchema,
      ),
    ]),
  });

export const TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TestTopicUpdateManyMutationInputSchema),
      z.lazy(
        () => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionInputSchema,
      ),
    ]),
  });

export const TestTopicScalarWhereInputSchema: z.ZodType<Prisma.TestTopicScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestTopicScalarWhereInputSchema),
        z.lazy(() => TestTopicScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestTopicScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestTopicScalarWhereInputSchema),
        z.lazy(() => TestTopicScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    slug: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    activeDraftVersionId: z
      .union([z.lazy(() => IntNullableFilterSchema), z.number()])
      .optional()
      .nullable(),
    activePublishedVersionId: z
      .union([z.lazy(() => IntNullableFilterSchema), z.number()])
      .optional()
      .nullable(),
  });

export const TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TestTopicUpdateWithoutActivePublishedVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedUpdateWithoutActivePublishedVersionInputSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema,
      ),
    ]),
  });

export const TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TestTopicUpdateWithoutActivePublishedVersionInputSchema),
      z.lazy(
        () => TestTopicUncheckedUpdateWithoutActivePublishedVersionInputSchema,
      ),
    ]),
  });

export const TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TestTopicUpdateManyMutationInputSchema),
      z.lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActivePublishedVersionInputSchema,
      ),
    ]),
  });

export const TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithWhereUniqueWithoutVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TestQuestionUpdateWithoutVersionInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateWithoutVersionInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestQuestionCreateWithoutVersionInputSchema),
      z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema),
    ]),
  });

export const TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithWhereUniqueWithoutVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TestQuestionUpdateWithoutVersionInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateWithoutVersionInputSchema),
    ]),
  });

export const TestQuestionUpdateManyWithWhereWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpdateManyWithWhereWithoutVersionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TestQuestionUpdateManyMutationInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionInputSchema),
    ]),
  });

export const TestQuestionScalarWhereInputSchema: z.ZodType<Prisma.TestQuestionScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionScalarWhereInputSchema),
        z.lazy(() => TestQuestionScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionScalarWhereInputSchema),
        z.lazy(() => TestQuestionScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    versionId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    type: z
      .union([
        z.lazy(() => EnumTestQuestionTypeFilterSchema),
        z.lazy(() => TestQuestionTypeSchema),
      ])
      .optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    required: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    settings: z.lazy(() => JsonNullableFilterSchema).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const TestTopicVersionCreateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutQuestionsInput> =
  z.strictObject({
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
    draftForTopic: z
      .lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutQuestionsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    topicId: z.number().int(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema,
      )
      .optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionCreateOrConnectWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutQuestionsInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema),
      z.lazy(() => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema),
    ]),
  });

export const TestQuestionOptionCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateWithoutQuestionInput> =
  z.strictObject({
    label: z.string(),
    value: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedCreateWithoutQuestionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    label: z.string(),
    value: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateOrConnectWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema),
      z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema),
    ]),
  });

export const TestQuestionOptionCreateManyQuestionInputEnvelopeSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyQuestionInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TestQuestionOptionCreateManyQuestionInputSchema),
      z.lazy(() => TestQuestionOptionCreateManyQuestionInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TestQuestionSliderBandCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateWithoutQuestionInput> =
  z.strictObject({
    minValue: z.number().int(),
    maxValue: z.number().int(),
    label: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
  });

export const TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedCreateWithoutQuestionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    minValue: z.number().int(),
    maxValue: z.number().int(),
    label: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
  });

export const TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateOrConnectWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema),
      z.lazy(
        () => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
      ),
    ]),
  });

export const TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyQuestionInputEnvelope> =
  z.strictObject({
    data: z.union([
      z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputSchema),
      z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  });

export const TestTopicVersionUpsertWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutQuestionsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutQuestionsInputSchema),
      z.lazy(() => TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema),
      z.lazy(() => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema),
    ]),
    where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  });

export const TestTopicVersionUpdateToOneWithWhereWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutQuestionsInput> =
  z.strictObject({
    where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => TestTopicVersionUpdateWithoutQuestionsInputSchema),
      z.lazy(() => TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema),
    ]),
  });

export const TestTopicVersionUpdateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutQuestionsInput> =
  z.strictObject({
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    topic: z
      .lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema)
      .optional(),
    draftForTopic: z
      .lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutQuestionsInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    topicId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema,
      )
      .optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TestQuestionOptionUpdateWithoutQuestionInputSchema),
      z.lazy(() => TestQuestionOptionUncheckedUpdateWithoutQuestionInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema),
      z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema),
    ]),
  });

export const TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TestQuestionOptionUpdateWithoutQuestionInputSchema),
      z.lazy(() => TestQuestionOptionUncheckedUpdateWithoutQuestionInputSchema),
    ]),
  });

export const TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyWithWhereWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionOptionScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TestQuestionOptionUpdateManyMutationInputSchema),
      z.lazy(
        () => TestQuestionOptionUncheckedUpdateManyWithoutQuestionInputSchema,
      ),
    ]),
  });

export const TestQuestionOptionScalarWhereInputSchema: z.ZodType<Prisma.TestQuestionOptionScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema),
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionOptionScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema),
        z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    questionId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    label: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    value: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    weight: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  });

export const TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
    update: z.union([
      z.lazy(() => TestQuestionSliderBandUpdateWithoutQuestionInputSchema),
      z.lazy(
        () => TestQuestionSliderBandUncheckedUpdateWithoutQuestionInputSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema),
      z.lazy(
        () => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema,
      ),
    ]),
  });

export const TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
    data: z.union([
      z.lazy(() => TestQuestionSliderBandUpdateWithoutQuestionInputSchema),
      z.lazy(
        () => TestQuestionSliderBandUncheckedUpdateWithoutQuestionInputSchema,
      ),
    ]),
  });

export const TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema),
    data: z.union([
      z.lazy(() => TestQuestionSliderBandUpdateManyMutationInputSchema),
      z.lazy(
        () =>
          TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionInputSchema,
      ),
    ]),
  });

export const TestQuestionSliderBandScalarWhereInputSchema: z.ZodType<Prisma.TestQuestionSliderBandScalarWhereInput> =
  z.strictObject({
    AND: z
      .union([
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema),
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TestQuestionSliderBandScalarWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema),
        z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    questionId: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    minValue: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    maxValue: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    label: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    weight: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
    order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
  });

export const TestQuestionCreateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutOptionsInput> =
  z.strictObject({
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    version: z.lazy(
      () => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema,
    ),
    sliderBands: z
      .lazy(
        () => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedCreateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutOptionsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    versionId: z.number().int(),
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    sliderBands: z
      .lazy(
        () =>
          TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionCreateOrConnectWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutOptionsInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema),
      z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema),
    ]),
  });

export const TestQuestionUpsertWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithoutOptionsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => TestQuestionUpdateWithoutOptionsInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateWithoutOptionsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema),
      z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema),
    ]),
    where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  });

export const TestQuestionUpdateToOneWithWhereWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUpdateToOneWithWhereWithoutOptionsInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => TestQuestionUpdateWithoutOptionsInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateWithoutOptionsInputSchema),
    ]),
  });

export const TestQuestionUpdateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutOptionsInput> =
  z.strictObject({
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    version: z
      .lazy(
        () =>
          TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema,
      )
      .optional(),
    sliderBands: z
      .lazy(
        () => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedUpdateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutOptionsInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    sliderBands: z
      .lazy(
        () =>
          TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionCreateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutSliderBandsInput> =
  z.strictObject({
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    version: z.lazy(
      () => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema,
    ),
    options: z
      .lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema)
      .optional(),
  });

export const TestQuestionUncheckedCreateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutSliderBandsInput> =
  z.strictObject({
    id: z.number().int().optional(),
    versionId: z.number().int(),
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    options: z
      .lazy(
        () =>
          TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema,
      )
      .optional(),
  });

export const TestQuestionCreateOrConnectWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutSliderBandsInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
    create: z.union([
      z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema),
      z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema),
    ]),
  });

export const TestQuestionUpsertWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithoutSliderBandsInput> =
  z.strictObject({
    update: z.union([
      z.lazy(() => TestQuestionUpdateWithoutSliderBandsInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema),
    ]),
    create: z.union([
      z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema),
      z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema),
    ]),
    where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  });

export const TestQuestionUpdateToOneWithWhereWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUpdateToOneWithWhereWithoutSliderBandsInput> =
  z.strictObject({
    where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
    data: z.union([
      z.lazy(() => TestQuestionUpdateWithoutSliderBandsInputSchema),
      z.lazy(() => TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema),
    ]),
  });

export const TestQuestionUpdateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutSliderBandsInput> =
  z.strictObject({
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    version: z
      .lazy(
        () =>
          TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema,
      )
      .optional(),
    options: z
      .lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema)
      .optional(),
  });

export const TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutSliderBandsInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionId: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    options: z
      .lazy(
        () =>
          TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionCreateManyTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateManyTopicInput> =
  z.strictObject({
    id: z.number().int().optional(),
    versionNumber: z.number().int(),
    status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestTopicVersionUpdateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutTopicInput> =
  z.strictObject({
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    draftForTopic: z
      .lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema)
      .optional(),
    publishedForTopic: z
      .lazy(
        () => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema)
      .optional(),
  });

export const TestTopicVersionUncheckedUpdateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutTopicInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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
    draftForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema,
      )
      .optional(),
    publishedForTopic: z
      .lazy(
        () =>
          TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema,
      )
      .optional(),
    questions: z
      .lazy(
        () => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicVersionUncheckedUpdateManyWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyWithoutTopicInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    versionNumber: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    status: z
      .union([
        z.lazy(() => TestTopicVersionStatusSchema),
        z.lazy(
          () => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema,
        ),
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

export const TestTopicCreateManyActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateManyActiveDraftVersionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activePublishedVersionId: z.number().int().optional().nullable(),
  });

export const TestTopicCreateManyActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateManyActivePublishedVersionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    slug: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    activeDraftVersionId: z.number().int().optional().nullable(),
  });

export const TestQuestionCreateManyVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateManyVersionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    type: z.lazy(() => TestQuestionTypeSchema),
    title: z.string(),
    description: z.string().optional().nullable(),
    required: z.boolean().optional(),
    order: z.number().int(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
      ])
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestTopicUpdateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithoutActiveDraftVersionInput> =
  z.strictObject({
    slug: z
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
    versions: z
      .lazy(() => TestTopicVersionUpdateManyWithoutTopicNestedInputSchema)
      .optional(),
    activePublishedVersion: z
      .lazy(
        () =>
          TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedUpdateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateWithoutActiveDraftVersionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activePublishedVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    versions: z
      .lazy(
        () => TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedUpdateManyWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActiveDraftVersionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activePublishedVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
  });

export const TestTopicUpdateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithoutActivePublishedVersionInput> =
  z.strictObject({
    slug: z
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
    versions: z
      .lazy(() => TestTopicVersionUpdateManyWithoutTopicNestedInputSchema)
      .optional(),
    activeDraftVersion: z
      .lazy(
        () => TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedUpdateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateWithoutActivePublishedVersionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activeDraftVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    versions: z
      .lazy(
        () => TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema,
      )
      .optional(),
  });

export const TestTopicUncheckedUpdateManyWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActivePublishedVersionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    slug: z
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
    activeDraftVersionId: z
      .union([
        z.number().int(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
  });

export const TestQuestionUpdateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutVersionInput> =
  z.strictObject({
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    options: z
      .lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema)
      .optional(),
    sliderBands: z
      .lazy(
        () => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedUpdateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutVersionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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
    options: z
      .lazy(
        () =>
          TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
    sliderBands: z
      .lazy(
        () =>
          TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema,
      )
      .optional(),
  });

export const TestQuestionUncheckedUpdateManyWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateManyWithoutVersionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    type: z
      .union([
        z.lazy(() => TestQuestionTypeSchema),
        z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema),
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
    required: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    settings: z
      .union([
        z.lazy(() => NullableJsonNullValueInputSchema),
        InputJsonValueSchema,
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

export const TestQuestionOptionCreateManyQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyQuestionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    label: z.string(),
    value: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  });

export const TestQuestionSliderBandCreateManyQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyQuestionInput> =
  z.strictObject({
    id: z.number().int().optional(),
    minValue: z.number().int(),
    maxValue: z.number().int(),
    label: z.string(),
    weight: z.number().int().optional(),
    order: z.number().int(),
  });

export const TestQuestionOptionUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateWithoutQuestionInput> =
  z.strictObject({
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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

export const TestQuestionOptionUncheckedUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateWithoutQuestionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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

export const TestQuestionOptionUncheckedUpdateManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateManyWithoutQuestionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    value: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
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

export const TestQuestionSliderBandUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateWithoutQuestionInput> =
  z.strictObject({
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const TestQuestionSliderBandUncheckedUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateWithoutQuestionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

export const TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionInput> =
  z.strictObject({
    id: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    minValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    maxValue: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    label: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    weight: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    order: z
      .union([
        z.number().int(),
        z.lazy(() => IntFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  });

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z
  .object({
    select: UserSelectSchema.optional(),
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
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> =
  z
    .object({
      select: UserSelectSchema.optional(),
      where: UserWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicFindFirstArgsSchema: z.ZodType<Prisma.TestTopicFindFirstArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicOrderByWithRelationInputSchema.array(),
          TestTopicOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestTopicScalarFieldEnumSchema,
          TestTopicScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestTopicFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestTopicFindFirstOrThrowArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicOrderByWithRelationInputSchema.array(),
          TestTopicOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestTopicScalarFieldEnumSchema,
          TestTopicScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestTopicFindManyArgsSchema: z.ZodType<Prisma.TestTopicFindManyArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicOrderByWithRelationInputSchema.array(),
          TestTopicOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestTopicScalarFieldEnumSchema,
          TestTopicScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestTopicAggregateArgsSchema: z.ZodType<Prisma.TestTopicAggregateArgs> =
  z
    .object({
      where: TestTopicWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicOrderByWithRelationInputSchema.array(),
          TestTopicOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestTopicGroupByArgsSchema: z.ZodType<Prisma.TestTopicGroupByArgs> =
  z
    .object({
      where: TestTopicWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicOrderByWithAggregationInputSchema.array(),
          TestTopicOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: TestTopicScalarFieldEnumSchema.array(),
      having: TestTopicScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestTopicFindUniqueArgsSchema: z.ZodType<Prisma.TestTopicFindUniqueArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestTopicFindUniqueOrThrowArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicVersionFindFirstArgsSchema: z.ZodType<Prisma.TestTopicVersionFindFirstArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicVersionOrderByWithRelationInputSchema.array(),
          TestTopicVersionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicVersionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestTopicVersionScalarFieldEnumSchema,
          TestTopicVersionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestTopicVersionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestTopicVersionFindFirstOrThrowArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicVersionOrderByWithRelationInputSchema.array(),
          TestTopicVersionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicVersionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestTopicVersionScalarFieldEnumSchema,
          TestTopicVersionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestTopicVersionFindManyArgsSchema: z.ZodType<Prisma.TestTopicVersionFindManyArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicVersionOrderByWithRelationInputSchema.array(),
          TestTopicVersionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicVersionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestTopicVersionScalarFieldEnumSchema,
          TestTopicVersionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestTopicVersionAggregateArgsSchema: z.ZodType<Prisma.TestTopicVersionAggregateArgs> =
  z
    .object({
      where: TestTopicVersionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicVersionOrderByWithRelationInputSchema.array(),
          TestTopicVersionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestTopicVersionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestTopicVersionGroupByArgsSchema: z.ZodType<Prisma.TestTopicVersionGroupByArgs> =
  z
    .object({
      where: TestTopicVersionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestTopicVersionOrderByWithAggregationInputSchema.array(),
          TestTopicVersionOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: TestTopicVersionScalarFieldEnumSchema.array(),
      having: TestTopicVersionScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestTopicVersionFindUniqueArgsSchema: z.ZodType<Prisma.TestTopicVersionFindUniqueArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicVersionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestTopicVersionFindUniqueOrThrowArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionFindFirstArgsSchema: z.ZodType<Prisma.TestQuestionFindFirstArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOrderByWithRelationInputSchema.array(),
          TestQuestionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionScalarFieldEnumSchema,
          TestQuestionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionFindFirstOrThrowArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOrderByWithRelationInputSchema.array(),
          TestQuestionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionScalarFieldEnumSchema,
          TestQuestionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionFindManyArgsSchema: z.ZodType<Prisma.TestQuestionFindManyArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOrderByWithRelationInputSchema.array(),
          TestQuestionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionScalarFieldEnumSchema,
          TestQuestionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionAggregateArgsSchema: z.ZodType<Prisma.TestQuestionAggregateArgs> =
  z
    .object({
      where: TestQuestionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOrderByWithRelationInputSchema.array(),
          TestQuestionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestQuestionGroupByArgsSchema: z.ZodType<Prisma.TestQuestionGroupByArgs> =
  z
    .object({
      where: TestQuestionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOrderByWithAggregationInputSchema.array(),
          TestQuestionOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: TestQuestionScalarFieldEnumSchema.array(),
      having: TestQuestionScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestQuestionFindUniqueArgsSchema: z.ZodType<Prisma.TestQuestionFindUniqueArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionFindUniqueOrThrowArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionOptionFindFirstArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindFirstArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOptionOrderByWithRelationInputSchema.array(),
          TestQuestionOptionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionOptionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionOptionScalarFieldEnumSchema,
          TestQuestionOptionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionOptionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindFirstOrThrowArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOptionOrderByWithRelationInputSchema.array(),
          TestQuestionOptionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionOptionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionOptionScalarFieldEnumSchema,
          TestQuestionOptionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionOptionFindManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindManyArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOptionOrderByWithRelationInputSchema.array(),
          TestQuestionOptionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionOptionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionOptionScalarFieldEnumSchema,
          TestQuestionOptionScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionOptionAggregateArgsSchema: z.ZodType<Prisma.TestQuestionOptionAggregateArgs> =
  z
    .object({
      where: TestQuestionOptionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOptionOrderByWithRelationInputSchema.array(),
          TestQuestionOptionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionOptionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestQuestionOptionGroupByArgsSchema: z.ZodType<Prisma.TestQuestionOptionGroupByArgs> =
  z
    .object({
      where: TestQuestionOptionWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionOptionOrderByWithAggregationInputSchema.array(),
          TestQuestionOptionOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: TestQuestionOptionScalarFieldEnumSchema.array(),
      having: TestQuestionOptionScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestQuestionOptionFindUniqueArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindUniqueArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionOptionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindUniqueOrThrowArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionSliderBandFindFirstArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindFirstArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionSliderBandOrderByWithRelationInputSchema.array(),
          TestQuestionSliderBandOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionSliderBandScalarFieldEnumSchema,
          TestQuestionSliderBandScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionSliderBandFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindFirstOrThrowArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionSliderBandOrderByWithRelationInputSchema.array(),
          TestQuestionSliderBandOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionSliderBandScalarFieldEnumSchema,
          TestQuestionSliderBandScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionSliderBandFindManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindManyArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionSliderBandOrderByWithRelationInputSchema.array(),
          TestQuestionSliderBandOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
      distinct: z
        .union([
          TestQuestionSliderBandScalarFieldEnumSchema,
          TestQuestionSliderBandScalarFieldEnumSchema.array(),
        ])
        .optional(),
    })
    .strict();

export const TestQuestionSliderBandAggregateArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandAggregateArgs> =
  z
    .object({
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionSliderBandOrderByWithRelationInputSchema.array(),
          TestQuestionSliderBandOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestQuestionSliderBandGroupByArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandGroupByArgs> =
  z
    .object({
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      orderBy: z
        .union([
          TestQuestionSliderBandOrderByWithAggregationInputSchema.array(),
          TestQuestionSliderBandOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: TestQuestionSliderBandScalarFieldEnumSchema.array(),
      having:
        TestQuestionSliderBandScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const TestQuestionSliderBandFindUniqueArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindUniqueArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionSliderBandFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindUniqueOrThrowArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereUniqueInputSchema,
    })
    .strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z
  .object({
    select: UserSelectSchema.optional(),
    data: z.union([UserCreateInputSchema, UserUncheckedCreateInputSchema]),
  })
  .strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z
  .object({
    select: UserSelectSchema.optional(),
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
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z
  .object({
    select: UserSelectSchema.optional(),
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

export const TestTopicCreateArgsSchema: z.ZodType<Prisma.TestTopicCreateArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      data: z.union([
        TestTopicCreateInputSchema,
        TestTopicUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const TestTopicUpsertArgsSchema: z.ZodType<Prisma.TestTopicUpsertArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereUniqueInputSchema,
      create: z.union([
        TestTopicCreateInputSchema,
        TestTopicUncheckedCreateInputSchema,
      ]),
      update: z.union([
        TestTopicUpdateInputSchema,
        TestTopicUncheckedUpdateInputSchema,
      ]),
    })
    .strict();

export const TestTopicCreateManyArgsSchema: z.ZodType<Prisma.TestTopicCreateManyArgs> =
  z
    .object({
      data: z.union([
        TestTopicCreateManyInputSchema,
        TestTopicCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestTopicCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestTopicCreateManyInputSchema,
        TestTopicCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestTopicDeleteArgsSchema: z.ZodType<Prisma.TestTopicDeleteArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      where: TestTopicWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicUpdateArgsSchema: z.ZodType<Prisma.TestTopicUpdateArgs> =
  z
    .object({
      select: TestTopicSelectSchema.optional(),
      include: TestTopicIncludeSchema.optional(),
      data: z.union([
        TestTopicUpdateInputSchema,
        TestTopicUncheckedUpdateInputSchema,
      ]),
      where: TestTopicWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicUpdateManyArgsSchema: z.ZodType<Prisma.TestTopicUpdateManyArgs> =
  z
    .object({
      data: z.union([
        TestTopicUpdateManyMutationInputSchema,
        TestTopicUncheckedUpdateManyInputSchema,
      ]),
      where: TestTopicWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestTopicUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestTopicUpdateManyMutationInputSchema,
        TestTopicUncheckedUpdateManyInputSchema,
      ]),
      where: TestTopicWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestTopicDeleteManyArgsSchema: z.ZodType<Prisma.TestTopicDeleteManyArgs> =
  z
    .object({
      where: TestTopicWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestTopicVersionCreateArgsSchema: z.ZodType<Prisma.TestTopicVersionCreateArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      data: z.union([
        TestTopicVersionCreateInputSchema,
        TestTopicVersionUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const TestTopicVersionUpsertArgsSchema: z.ZodType<Prisma.TestTopicVersionUpsertArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereUniqueInputSchema,
      create: z.union([
        TestTopicVersionCreateInputSchema,
        TestTopicVersionUncheckedCreateInputSchema,
      ]),
      update: z.union([
        TestTopicVersionUpdateInputSchema,
        TestTopicVersionUncheckedUpdateInputSchema,
      ]),
    })
    .strict();

export const TestTopicVersionCreateManyArgsSchema: z.ZodType<Prisma.TestTopicVersionCreateManyArgs> =
  z
    .object({
      data: z.union([
        TestTopicVersionCreateManyInputSchema,
        TestTopicVersionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestTopicVersionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicVersionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestTopicVersionCreateManyInputSchema,
        TestTopicVersionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestTopicVersionDeleteArgsSchema: z.ZodType<Prisma.TestTopicVersionDeleteArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      where: TestTopicVersionWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicVersionUpdateArgsSchema: z.ZodType<Prisma.TestTopicVersionUpdateArgs> =
  z
    .object({
      select: TestTopicVersionSelectSchema.optional(),
      include: TestTopicVersionIncludeSchema.optional(),
      data: z.union([
        TestTopicVersionUpdateInputSchema,
        TestTopicVersionUncheckedUpdateInputSchema,
      ]),
      where: TestTopicVersionWhereUniqueInputSchema,
    })
    .strict();

export const TestTopicVersionUpdateManyArgsSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        TestTopicVersionUpdateManyMutationInputSchema,
        TestTopicVersionUncheckedUpdateManyInputSchema,
      ]),
      where: TestTopicVersionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestTopicVersionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestTopicVersionUpdateManyMutationInputSchema,
        TestTopicVersionUncheckedUpdateManyInputSchema,
      ]),
      where: TestTopicVersionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestTopicVersionDeleteManyArgsSchema: z.ZodType<Prisma.TestTopicVersionDeleteManyArgs> =
  z
    .object({
      where: TestTopicVersionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionCreateArgsSchema: z.ZodType<Prisma.TestQuestionCreateArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      data: z.union([
        TestQuestionCreateInputSchema,
        TestQuestionUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const TestQuestionUpsertArgsSchema: z.ZodType<Prisma.TestQuestionUpsertArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereUniqueInputSchema,
      create: z.union([
        TestQuestionCreateInputSchema,
        TestQuestionUncheckedCreateInputSchema,
      ]),
      update: z.union([
        TestQuestionUpdateInputSchema,
        TestQuestionUncheckedUpdateInputSchema,
      ]),
    })
    .strict();

export const TestQuestionCreateManyArgsSchema: z.ZodType<Prisma.TestQuestionCreateManyArgs> =
  z
    .object({
      data: z.union([
        TestQuestionCreateManyInputSchema,
        TestQuestionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestQuestionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestQuestionCreateManyInputSchema,
        TestQuestionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestQuestionDeleteArgsSchema: z.ZodType<Prisma.TestQuestionDeleteArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      where: TestQuestionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionUpdateArgsSchema: z.ZodType<Prisma.TestQuestionUpdateArgs> =
  z
    .object({
      select: TestQuestionSelectSchema.optional(),
      include: TestQuestionIncludeSchema.optional(),
      data: z.union([
        TestQuestionUpdateInputSchema,
        TestQuestionUncheckedUpdateInputSchema,
      ]),
      where: TestQuestionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionUpdateManyArgsSchema: z.ZodType<Prisma.TestQuestionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        TestQuestionUpdateManyMutationInputSchema,
        TestQuestionUncheckedUpdateManyInputSchema,
      ]),
      where: TestQuestionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestQuestionUpdateManyMutationInputSchema,
        TestQuestionUncheckedUpdateManyInputSchema,
      ]),
      where: TestQuestionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionDeleteManyArgsSchema: z.ZodType<Prisma.TestQuestionDeleteManyArgs> =
  z
    .object({
      where: TestQuestionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionOptionCreateArgsSchema: z.ZodType<Prisma.TestQuestionOptionCreateArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      data: z.union([
        TestQuestionOptionCreateInputSchema,
        TestQuestionOptionUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const TestQuestionOptionUpsertArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpsertArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereUniqueInputSchema,
      create: z.union([
        TestQuestionOptionCreateInputSchema,
        TestQuestionOptionUncheckedCreateInputSchema,
      ]),
      update: z.union([
        TestQuestionOptionUpdateInputSchema,
        TestQuestionOptionUncheckedUpdateInputSchema,
      ]),
    })
    .strict();

export const TestQuestionOptionCreateManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyArgs> =
  z
    .object({
      data: z.union([
        TestQuestionOptionCreateManyInputSchema,
        TestQuestionOptionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestQuestionOptionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestQuestionOptionCreateManyInputSchema,
        TestQuestionOptionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestQuestionOptionDeleteArgsSchema: z.ZodType<Prisma.TestQuestionOptionDeleteArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      where: TestQuestionOptionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionOptionUpdateArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpdateArgs> =
  z
    .object({
      select: TestQuestionOptionSelectSchema.optional(),
      include: TestQuestionOptionIncludeSchema.optional(),
      data: z.union([
        TestQuestionOptionUpdateInputSchema,
        TestQuestionOptionUncheckedUpdateInputSchema,
      ]),
      where: TestQuestionOptionWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionOptionUpdateManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        TestQuestionOptionUpdateManyMutationInputSchema,
        TestQuestionOptionUncheckedUpdateManyInputSchema,
      ]),
      where: TestQuestionOptionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionOptionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestQuestionOptionUpdateManyMutationInputSchema,
        TestQuestionOptionUncheckedUpdateManyInputSchema,
      ]),
      where: TestQuestionOptionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionOptionDeleteManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionDeleteManyArgs> =
  z
    .object({
      where: TestQuestionOptionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionSliderBandCreateArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      data: z.union([
        TestQuestionSliderBandCreateInputSchema,
        TestQuestionSliderBandUncheckedCreateInputSchema,
      ]),
    })
    .strict();

export const TestQuestionSliderBandUpsertArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpsertArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereUniqueInputSchema,
      create: z.union([
        TestQuestionSliderBandCreateInputSchema,
        TestQuestionSliderBandUncheckedCreateInputSchema,
      ]),
      update: z.union([
        TestQuestionSliderBandUpdateInputSchema,
        TestQuestionSliderBandUncheckedUpdateInputSchema,
      ]),
    })
    .strict();

export const TestQuestionSliderBandCreateManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyArgs> =
  z
    .object({
      data: z.union([
        TestQuestionSliderBandCreateManyInputSchema,
        TestQuestionSliderBandCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestQuestionSliderBandCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestQuestionSliderBandCreateManyInputSchema,
        TestQuestionSliderBandCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TestQuestionSliderBandDeleteArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandDeleteArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      where: TestQuestionSliderBandWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionSliderBandUpdateArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateArgs> =
  z
    .object({
      select: TestQuestionSliderBandSelectSchema.optional(),
      include: TestQuestionSliderBandIncludeSchema.optional(),
      data: z.union([
        TestQuestionSliderBandUpdateInputSchema,
        TestQuestionSliderBandUncheckedUpdateInputSchema,
      ]),
      where: TestQuestionSliderBandWhereUniqueInputSchema,
    })
    .strict();

export const TestQuestionSliderBandUpdateManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyArgs> =
  z
    .object({
      data: z.union([
        TestQuestionSliderBandUpdateManyMutationInputSchema,
        TestQuestionSliderBandUncheckedUpdateManyInputSchema,
      ]),
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionSliderBandUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TestQuestionSliderBandUpdateManyMutationInputSchema,
        TestQuestionSliderBandUncheckedUpdateManyInputSchema,
      ]),
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TestQuestionSliderBandDeleteManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandDeleteManyArgs> =
  z
    .object({
      where: TestQuestionSliderBandWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();
