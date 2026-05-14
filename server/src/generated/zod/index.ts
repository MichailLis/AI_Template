import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

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
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','email','name','password','hashedRefreshToken','role','createdAt','updatedAt']);

export const TestTopicScalarFieldEnumSchema = z.enum(['id','slug','createdAt','updatedAt','archivedAt','activeDraftVersionId','activePublishedVersionId']);

export const TestTopicVersionScalarFieldEnumSchema = z.enum(['id','topicId','versionNumber','status','title','description','analysisPromptVersionId','createdAt','updatedAt']);

export const TestQuestionScalarFieldEnumSchema = z.enum(['id','versionId','type','title','description','required','order','settings','createdAt','updatedAt']);

export const TestQuestionOptionScalarFieldEnumSchema = z.enum(['id','questionId','label','value','weight','order','createdAt','updatedAt']);

export const TestQuestionSliderBandScalarFieldEnumSchema = z.enum(['id','questionId','minValue','maxValue','label','weight','order']);

export const TestPublicLinkScalarFieldEnumSchema = z.enum(['id','topicVersionId','educationOrganizationId','shortCode','isActive','startsAt','endsAt','maxAttemptsPerStudent','timeLimitMinutes','allowResume','entryProfileMode','consentVersion','consentTextSnapshot','createdByUserId','createdAt','updatedAt','archivedAt']);

export const EducationOrganizationScalarFieldEnumSchema = z.enum(['id','name','isActive','groupValidationMode','groupValidationPattern','groupValidationExample','groupValidationHint','createdAt','updatedAt']);

export const TestStudentAttemptScalarFieldEnumSchema = z.enum(['id','publicLinkId','topicVersionId','attemptNumber','status','studentName','studentLastInitial','studentMiddleInitial','educationOrganization','groupOrClass','studentGender','studentAge','studentResidence','studentEducationLevel','studentKeyHash','consentAcceptedAt','consentVersion','consentTextSnapshot','resumeToken','startedAt','expiresAt','finishedAt','anonymizedAt','createdAt','updatedAt']);

export const TestStudentAnswerScalarFieldEnumSchema = z.enum(['id','attemptId','questionId','questionTypeSnapshot','questionTitleSnapshot','answerPayload','createdAt','updatedAt']);

export const TestStudentAnalysisScalarFieldEnumSchema = z.enum(['id','attemptId','promptVersionId','providerMode','status','summary','rawText','errorMessage','generatedAt','createdAt','updatedAt']);

export const AnalysisPromptScalarFieldEnumSchema = z.enum(['id','title','description','archivedAt','createdAt','updatedAt']);

export const AnalysisPromptVersionScalarFieldEnumSchema = z.enum(['id','promptId','versionNumber','status','model','temperature','prompt','outputSchema','publishedAt','createdAt','updatedAt']);

export const AppSettingScalarFieldEnumSchema = z.enum(['key','value','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema: z.ZodType<Prisma.NullableJsonNullValueInput> = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema: z.ZodType<Prisma.JsonNullValueInput> = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const RoleSchema = z.enum(['USER','ADMIN']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export const TestTopicVersionStatusSchema = z.enum(['DRAFT','PUBLISHED','ARCHIVED']);

export type TestTopicVersionStatusType = `${z.infer<typeof TestTopicVersionStatusSchema>}`

export const TestQuestionTypeSchema = z.enum(['OPEN_TEXT','SINGLE_CHOICE','MULTI_CHOICE','SLIDER']);

export type TestQuestionTypeType = `${z.infer<typeof TestQuestionTypeSchema>}`

export const TestStudentAttemptStatusSchema = z.enum(['IN_PROGRESS','COMPLETED','EXPIRED','ABANDONED']);

export type TestStudentAttemptStatusType = `${z.infer<typeof TestStudentAttemptStatusSchema>}`

export const TestStudentAnalysisStatusSchema = z.enum(['PENDING','READY','FAILED']);

export type TestStudentAnalysisStatusType = `${z.infer<typeof TestStudentAnalysisStatusSchema>}`

export const TestStudentAnalysisProviderModeSchema = z.enum(['STUB','LLM']);

export type TestStudentAnalysisProviderModeType = `${z.infer<typeof TestStudentAnalysisProviderModeSchema>}`

export const TestEntryProfileModeSchema = z.enum(['DEMOGRAPHIC','EDUCATION']);

export type TestEntryProfileModeType = `${z.infer<typeof TestEntryProfileModeSchema>}`

export const TestStudentGenderSchema = z.enum(['MALE','FEMALE']);

export type TestStudentGenderType = `${z.infer<typeof TestStudentGenderSchema>}`

export const TestStudentEducationLevelSchema = z.enum(['BASIC_GENERAL','SECONDARY_GENERAL','SECONDARY_SPECIAL','INCOMPLETE_HIGHER_FROM_YEAR_3','HIGHER']);

export type TestStudentEducationLevelType = `${z.infer<typeof TestStudentEducationLevelSchema>}`

export const AnalysisPromptVersionStatusSchema = z.enum(['DRAFT','PUBLISHED','ARCHIVED']);

export type AnalysisPromptVersionStatusType = `${z.infer<typeof AnalysisPromptVersionStatusSchema>}`

export const GroupOrClassValidationModeSchema = z.enum(['NONE','HINT','STRICT']);

export type GroupOrClassValidationModeType = `${z.infer<typeof GroupOrClassValidationModeSchema>}`

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
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// TEST TOPIC SCHEMA
/////////////////////////////////////////

export const TestTopicSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  archivedAt: z.coerce.date().nullable(),
  activeDraftVersionId: z.number().int().nullable(),
  activePublishedVersionId: z.number().int().nullable(),
})

export type TestTopic = z.infer<typeof TestTopicSchema>

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
  analysisPromptVersionId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TestTopicVersion = z.infer<typeof TestTopicVersionSchema>

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
})

export type TestQuestion = z.infer<typeof TestQuestionSchema>

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
})

export type TestQuestionOption = z.infer<typeof TestQuestionOptionSchema>

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
})

export type TestQuestionSliderBand = z.infer<typeof TestQuestionSliderBandSchema>

/////////////////////////////////////////
// TEST PUBLIC LINK SCHEMA
/////////////////////////////////////////

export const TestPublicLinkSchema = z.object({
  entryProfileMode: TestEntryProfileModeSchema,
  id: z.number().int(),
  topicVersionId: z.number().int(),
  educationOrganizationId: z.number().int().nullable(),
  shortCode: z.string(),
  isActive: z.boolean(),
  startsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  maxAttemptsPerStudent: z.number().int(),
  timeLimitMinutes: z.number().int().nullable(),
  allowResume: z.boolean(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  archivedAt: z.coerce.date().nullable(),
})

export type TestPublicLink = z.infer<typeof TestPublicLinkSchema>

/////////////////////////////////////////
// EDUCATION ORGANIZATION SCHEMA
/////////////////////////////////////////

export const EducationOrganizationSchema = z.object({
  groupValidationMode: GroupOrClassValidationModeSchema,
  id: z.number().int(),
  name: z.string(),
  isActive: z.boolean(),
  groupValidationPattern: z.string().nullable(),
  groupValidationExample: z.string().nullable(),
  groupValidationHint: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EducationOrganization = z.infer<typeof EducationOrganizationSchema>

/////////////////////////////////////////
// TEST STUDENT ATTEMPT SCHEMA
/////////////////////////////////////////

export const TestStudentAttemptSchema = z.object({
  status: TestStudentAttemptStatusSchema,
  studentGender: TestStudentGenderSchema.nullable(),
  studentEducationLevel: TestStudentEducationLevelSchema.nullable(),
  id: z.number().int(),
  publicLinkId: z.number().int(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  studentName: z.string().nullable(),
  studentLastInitial: z.string().nullable(),
  studentMiddleInitial: z.string().nullable(),
  educationOrganization: z.string().nullable(),
  groupOrClass: z.string().nullable(),
  studentAge: z.number().int().nullable(),
  studentResidence: z.string().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  finishedAt: z.coerce.date().nullable(),
  anonymizedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TestStudentAttempt = z.infer<typeof TestStudentAttemptSchema>

/////////////////////////////////////////
// TEST STUDENT ANSWER SCHEMA
/////////////////////////////////////////

export const TestStudentAnswerSchema = z.object({
  questionTypeSnapshot: TestQuestionTypeSchema,
  id: z.number().int(),
  attemptId: z.number().int(),
  questionId: z.number().int(),
  questionTitleSnapshot: z.string(),
  answerPayload: JsonValueSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TestStudentAnswer = z.infer<typeof TestStudentAnswerSchema>

/////////////////////////////////////////
// TEST STUDENT ANALYSIS SCHEMA
/////////////////////////////////////////

export const TestStudentAnalysisSchema = z.object({
  providerMode: TestStudentAnalysisProviderModeSchema,
  status: TestStudentAnalysisStatusSchema,
  id: z.number().int(),
  attemptId: z.number().int(),
  promptVersionId: z.number().int().nullable(),
  summary: JsonValueSchema.nullable(),
  rawText: z.string().nullable(),
  errorMessage: z.string().nullable(),
  generatedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TestStudentAnalysis = z.infer<typeof TestStudentAnalysisSchema>

/////////////////////////////////////////
// ANALYSIS PROMPT SCHEMA
/////////////////////////////////////////

export const AnalysisPromptSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  archivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AnalysisPrompt = z.infer<typeof AnalysisPromptSchema>

/////////////////////////////////////////
// ANALYSIS PROMPT VERSION SCHEMA
/////////////////////////////////////////

export const AnalysisPromptVersionSchema = z.object({
  status: AnalysisPromptVersionStatusSchema,
  id: z.number().int(),
  promptId: z.number().int(),
  versionNumber: z.number().int(),
  model: z.string(),
  temperature: z.number(),
  prompt: z.string(),
  outputSchema: JsonValueSchema.nullable(),
  publishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AnalysisPromptVersion = z.infer<typeof AnalysisPromptVersionSchema>

/////////////////////////////////////////
// APP SETTING SCHEMA
/////////////////////////////////////////

export const AppSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AppSetting = z.infer<typeof AppSettingSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  createdPublicTestLinks: z.union([z.boolean(),z.lazy(() => TestPublicLinkFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  createdPublicTestLinks: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  email: z.boolean().optional(),
  name: z.boolean().optional(),
  password: z.boolean().optional(),
  hashedRefreshToken: z.boolean().optional(),
  role: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  createdPublicTestLinks: z.union([z.boolean(),z.lazy(() => TestPublicLinkFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TEST TOPIC
//------------------------------------------------------

export const TestTopicIncludeSchema: z.ZodType<Prisma.TestTopicInclude> = z.object({
  versions: z.union([z.boolean(),z.lazy(() => TestTopicVersionFindManyArgsSchema)]).optional(),
  activeDraftVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  activePublishedVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestTopicCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const TestTopicArgsSchema: z.ZodType<Prisma.TestTopicDefaultArgs> = z.object({
  select: z.lazy(() => TestTopicSelectSchema).optional(),
  include: z.lazy(() => TestTopicIncludeSchema).optional(),
}).strict();

export const TestTopicCountOutputTypeArgsSchema: z.ZodType<Prisma.TestTopicCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => TestTopicCountOutputTypeSelectSchema).nullish(),
}).strict();

export const TestTopicCountOutputTypeSelectSchema: z.ZodType<Prisma.TestTopicCountOutputTypeSelect> = z.object({
  versions: z.boolean().optional(),
}).strict();

export const TestTopicSelectSchema: z.ZodType<Prisma.TestTopicSelect> = z.object({
  id: z.boolean().optional(),
  slug: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  archivedAt: z.boolean().optional(),
  activeDraftVersionId: z.boolean().optional(),
  activePublishedVersionId: z.boolean().optional(),
  versions: z.union([z.boolean(),z.lazy(() => TestTopicVersionFindManyArgsSchema)]).optional(),
  activeDraftVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  activePublishedVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestTopicCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TEST TOPIC VERSION
//------------------------------------------------------

export const TestTopicVersionIncludeSchema: z.ZodType<Prisma.TestTopicVersionInclude> = z.object({
  topic: z.union([z.boolean(),z.lazy(() => TestTopicArgsSchema)]).optional(),
  draftForTopic: z.union([z.boolean(),z.lazy(() => TestTopicFindManyArgsSchema)]).optional(),
  publishedForTopic: z.union([z.boolean(),z.lazy(() => TestTopicFindManyArgsSchema)]).optional(),
  analysisPromptVersion: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionArgsSchema)]).optional(),
  questions: z.union([z.boolean(),z.lazy(() => TestQuestionFindManyArgsSchema)]).optional(),
  publicLinks: z.union([z.boolean(),z.lazy(() => TestPublicLinkFindManyArgsSchema)]).optional(),
  studentAttempts: z.union([z.boolean(),z.lazy(() => TestStudentAttemptFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestTopicVersionCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const TestTopicVersionArgsSchema: z.ZodType<Prisma.TestTopicVersionDefaultArgs> = z.object({
  select: z.lazy(() => TestTopicVersionSelectSchema).optional(),
  include: z.lazy(() => TestTopicVersionIncludeSchema).optional(),
}).strict();

export const TestTopicVersionCountOutputTypeArgsSchema: z.ZodType<Prisma.TestTopicVersionCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => TestTopicVersionCountOutputTypeSelectSchema).nullish(),
}).strict();

export const TestTopicVersionCountOutputTypeSelectSchema: z.ZodType<Prisma.TestTopicVersionCountOutputTypeSelect> = z.object({
  draftForTopic: z.boolean().optional(),
  publishedForTopic: z.boolean().optional(),
  questions: z.boolean().optional(),
  publicLinks: z.boolean().optional(),
  studentAttempts: z.boolean().optional(),
}).strict();

export const TestTopicVersionSelectSchema: z.ZodType<Prisma.TestTopicVersionSelect> = z.object({
  id: z.boolean().optional(),
  topicId: z.boolean().optional(),
  versionNumber: z.boolean().optional(),
  status: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  analysisPromptVersionId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  topic: z.union([z.boolean(),z.lazy(() => TestTopicArgsSchema)]).optional(),
  draftForTopic: z.union([z.boolean(),z.lazy(() => TestTopicFindManyArgsSchema)]).optional(),
  publishedForTopic: z.union([z.boolean(),z.lazy(() => TestTopicFindManyArgsSchema)]).optional(),
  analysisPromptVersion: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionArgsSchema)]).optional(),
  questions: z.union([z.boolean(),z.lazy(() => TestQuestionFindManyArgsSchema)]).optional(),
  publicLinks: z.union([z.boolean(),z.lazy(() => TestPublicLinkFindManyArgsSchema)]).optional(),
  studentAttempts: z.union([z.boolean(),z.lazy(() => TestStudentAttemptFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestTopicVersionCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TEST QUESTION
//------------------------------------------------------

export const TestQuestionIncludeSchema: z.ZodType<Prisma.TestQuestionInclude> = z.object({
  version: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  options: z.union([z.boolean(),z.lazy(() => TestQuestionOptionFindManyArgsSchema)]).optional(),
  sliderBands: z.union([z.boolean(),z.lazy(() => TestQuestionSliderBandFindManyArgsSchema)]).optional(),
  studentAnswers: z.union([z.boolean(),z.lazy(() => TestStudentAnswerFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestQuestionCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const TestQuestionArgsSchema: z.ZodType<Prisma.TestQuestionDefaultArgs> = z.object({
  select: z.lazy(() => TestQuestionSelectSchema).optional(),
  include: z.lazy(() => TestQuestionIncludeSchema).optional(),
}).strict();

export const TestQuestionCountOutputTypeArgsSchema: z.ZodType<Prisma.TestQuestionCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => TestQuestionCountOutputTypeSelectSchema).nullish(),
}).strict();

export const TestQuestionCountOutputTypeSelectSchema: z.ZodType<Prisma.TestQuestionCountOutputTypeSelect> = z.object({
  options: z.boolean().optional(),
  sliderBands: z.boolean().optional(),
  studentAnswers: z.boolean().optional(),
}).strict();

export const TestQuestionSelectSchema: z.ZodType<Prisma.TestQuestionSelect> = z.object({
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
  version: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  options: z.union([z.boolean(),z.lazy(() => TestQuestionOptionFindManyArgsSchema)]).optional(),
  sliderBands: z.union([z.boolean(),z.lazy(() => TestQuestionSliderBandFindManyArgsSchema)]).optional(),
  studentAnswers: z.union([z.boolean(),z.lazy(() => TestStudentAnswerFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestQuestionCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TEST QUESTION OPTION
//------------------------------------------------------

export const TestQuestionOptionIncludeSchema: z.ZodType<Prisma.TestQuestionOptionInclude> = z.object({
  question: z.union([z.boolean(),z.lazy(() => TestQuestionArgsSchema)]).optional(),
}).strict();

export const TestQuestionOptionArgsSchema: z.ZodType<Prisma.TestQuestionOptionDefaultArgs> = z.object({
  select: z.lazy(() => TestQuestionOptionSelectSchema).optional(),
  include: z.lazy(() => TestQuestionOptionIncludeSchema).optional(),
}).strict();

export const TestQuestionOptionSelectSchema: z.ZodType<Prisma.TestQuestionOptionSelect> = z.object({
  id: z.boolean().optional(),
  questionId: z.boolean().optional(),
  label: z.boolean().optional(),
  value: z.boolean().optional(),
  weight: z.boolean().optional(),
  order: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  question: z.union([z.boolean(),z.lazy(() => TestQuestionArgsSchema)]).optional(),
}).strict()

// TEST QUESTION SLIDER BAND
//------------------------------------------------------

export const TestQuestionSliderBandIncludeSchema: z.ZodType<Prisma.TestQuestionSliderBandInclude> = z.object({
  question: z.union([z.boolean(),z.lazy(() => TestQuestionArgsSchema)]).optional(),
}).strict();

export const TestQuestionSliderBandArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandDefaultArgs> = z.object({
  select: z.lazy(() => TestQuestionSliderBandSelectSchema).optional(),
  include: z.lazy(() => TestQuestionSliderBandIncludeSchema).optional(),
}).strict();

export const TestQuestionSliderBandSelectSchema: z.ZodType<Prisma.TestQuestionSliderBandSelect> = z.object({
  id: z.boolean().optional(),
  questionId: z.boolean().optional(),
  minValue: z.boolean().optional(),
  maxValue: z.boolean().optional(),
  label: z.boolean().optional(),
  weight: z.boolean().optional(),
  order: z.boolean().optional(),
  question: z.union([z.boolean(),z.lazy(() => TestQuestionArgsSchema)]).optional(),
}).strict()

// TEST PUBLIC LINK
//------------------------------------------------------

export const TestPublicLinkIncludeSchema: z.ZodType<Prisma.TestPublicLinkInclude> = z.object({
  topicVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  educationOrganization: z.union([z.boolean(),z.lazy(() => EducationOrganizationArgsSchema)]).optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  attempts: z.union([z.boolean(),z.lazy(() => TestStudentAttemptFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestPublicLinkCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const TestPublicLinkArgsSchema: z.ZodType<Prisma.TestPublicLinkDefaultArgs> = z.object({
  select: z.lazy(() => TestPublicLinkSelectSchema).optional(),
  include: z.lazy(() => TestPublicLinkIncludeSchema).optional(),
}).strict();

export const TestPublicLinkCountOutputTypeArgsSchema: z.ZodType<Prisma.TestPublicLinkCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => TestPublicLinkCountOutputTypeSelectSchema).nullish(),
}).strict();

export const TestPublicLinkCountOutputTypeSelectSchema: z.ZodType<Prisma.TestPublicLinkCountOutputTypeSelect> = z.object({
  attempts: z.boolean().optional(),
}).strict();

export const TestPublicLinkSelectSchema: z.ZodType<Prisma.TestPublicLinkSelect> = z.object({
  id: z.boolean().optional(),
  topicVersionId: z.boolean().optional(),
  educationOrganizationId: z.boolean().optional(),
  shortCode: z.boolean().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.boolean().optional(),
  endsAt: z.boolean().optional(),
  maxAttemptsPerStudent: z.boolean().optional(),
  timeLimitMinutes: z.boolean().optional(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.boolean().optional(),
  consentVersion: z.boolean().optional(),
  consentTextSnapshot: z.boolean().optional(),
  createdByUserId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  archivedAt: z.boolean().optional(),
  topicVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  educationOrganization: z.union([z.boolean(),z.lazy(() => EducationOrganizationArgsSchema)]).optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  attempts: z.union([z.boolean(),z.lazy(() => TestStudentAttemptFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestPublicLinkCountOutputTypeArgsSchema)]).optional(),
}).strict()

// EDUCATION ORGANIZATION
//------------------------------------------------------

export const EducationOrganizationIncludeSchema: z.ZodType<Prisma.EducationOrganizationInclude> = z.object({
  publicLinks: z.union([z.boolean(),z.lazy(() => TestPublicLinkFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EducationOrganizationCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const EducationOrganizationArgsSchema: z.ZodType<Prisma.EducationOrganizationDefaultArgs> = z.object({
  select: z.lazy(() => EducationOrganizationSelectSchema).optional(),
  include: z.lazy(() => EducationOrganizationIncludeSchema).optional(),
}).strict();

export const EducationOrganizationCountOutputTypeArgsSchema: z.ZodType<Prisma.EducationOrganizationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => EducationOrganizationCountOutputTypeSelectSchema).nullish(),
}).strict();

export const EducationOrganizationCountOutputTypeSelectSchema: z.ZodType<Prisma.EducationOrganizationCountOutputTypeSelect> = z.object({
  publicLinks: z.boolean().optional(),
}).strict();

export const EducationOrganizationSelectSchema: z.ZodType<Prisma.EducationOrganizationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  isActive: z.boolean().optional(),
  groupValidationMode: z.boolean().optional(),
  groupValidationPattern: z.boolean().optional(),
  groupValidationExample: z.boolean().optional(),
  groupValidationHint: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  publicLinks: z.union([z.boolean(),z.lazy(() => TestPublicLinkFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => EducationOrganizationCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TEST STUDENT ATTEMPT
//------------------------------------------------------

export const TestStudentAttemptIncludeSchema: z.ZodType<Prisma.TestStudentAttemptInclude> = z.object({
  publicLink: z.union([z.boolean(),z.lazy(() => TestPublicLinkArgsSchema)]).optional(),
  topicVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  answers: z.union([z.boolean(),z.lazy(() => TestStudentAnswerFindManyArgsSchema)]).optional(),
  analysis: z.union([z.boolean(),z.lazy(() => TestStudentAnalysisArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestStudentAttemptCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const TestStudentAttemptArgsSchema: z.ZodType<Prisma.TestStudentAttemptDefaultArgs> = z.object({
  select: z.lazy(() => TestStudentAttemptSelectSchema).optional(),
  include: z.lazy(() => TestStudentAttemptIncludeSchema).optional(),
}).strict();

export const TestStudentAttemptCountOutputTypeArgsSchema: z.ZodType<Prisma.TestStudentAttemptCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => TestStudentAttemptCountOutputTypeSelectSchema).nullish(),
}).strict();

export const TestStudentAttemptCountOutputTypeSelectSchema: z.ZodType<Prisma.TestStudentAttemptCountOutputTypeSelect> = z.object({
  answers: z.boolean().optional(),
}).strict();

export const TestStudentAttemptSelectSchema: z.ZodType<Prisma.TestStudentAttemptSelect> = z.object({
  id: z.boolean().optional(),
  publicLinkId: z.boolean().optional(),
  topicVersionId: z.boolean().optional(),
  attemptNumber: z.boolean().optional(),
  status: z.boolean().optional(),
  studentName: z.boolean().optional(),
  studentLastInitial: z.boolean().optional(),
  studentMiddleInitial: z.boolean().optional(),
  educationOrganization: z.boolean().optional(),
  groupOrClass: z.boolean().optional(),
  studentGender: z.boolean().optional(),
  studentAge: z.boolean().optional(),
  studentResidence: z.boolean().optional(),
  studentEducationLevel: z.boolean().optional(),
  studentKeyHash: z.boolean().optional(),
  consentAcceptedAt: z.boolean().optional(),
  consentVersion: z.boolean().optional(),
  consentTextSnapshot: z.boolean().optional(),
  resumeToken: z.boolean().optional(),
  startedAt: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  finishedAt: z.boolean().optional(),
  anonymizedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  publicLink: z.union([z.boolean(),z.lazy(() => TestPublicLinkArgsSchema)]).optional(),
  topicVersion: z.union([z.boolean(),z.lazy(() => TestTopicVersionArgsSchema)]).optional(),
  answers: z.union([z.boolean(),z.lazy(() => TestStudentAnswerFindManyArgsSchema)]).optional(),
  analysis: z.union([z.boolean(),z.lazy(() => TestStudentAnalysisArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => TestStudentAttemptCountOutputTypeArgsSchema)]).optional(),
}).strict()

// TEST STUDENT ANSWER
//------------------------------------------------------

export const TestStudentAnswerIncludeSchema: z.ZodType<Prisma.TestStudentAnswerInclude> = z.object({
  attempt: z.union([z.boolean(),z.lazy(() => TestStudentAttemptArgsSchema)]).optional(),
  question: z.union([z.boolean(),z.lazy(() => TestQuestionArgsSchema)]).optional(),
}).strict();

export const TestStudentAnswerArgsSchema: z.ZodType<Prisma.TestStudentAnswerDefaultArgs> = z.object({
  select: z.lazy(() => TestStudentAnswerSelectSchema).optional(),
  include: z.lazy(() => TestStudentAnswerIncludeSchema).optional(),
}).strict();

export const TestStudentAnswerSelectSchema: z.ZodType<Prisma.TestStudentAnswerSelect> = z.object({
  id: z.boolean().optional(),
  attemptId: z.boolean().optional(),
  questionId: z.boolean().optional(),
  questionTypeSnapshot: z.boolean().optional(),
  questionTitleSnapshot: z.boolean().optional(),
  answerPayload: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  attempt: z.union([z.boolean(),z.lazy(() => TestStudentAttemptArgsSchema)]).optional(),
  question: z.union([z.boolean(),z.lazy(() => TestQuestionArgsSchema)]).optional(),
}).strict()

// TEST STUDENT ANALYSIS
//------------------------------------------------------

export const TestStudentAnalysisIncludeSchema: z.ZodType<Prisma.TestStudentAnalysisInclude> = z.object({
  attempt: z.union([z.boolean(),z.lazy(() => TestStudentAttemptArgsSchema)]).optional(),
  promptVersion: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionArgsSchema)]).optional(),
}).strict();

export const TestStudentAnalysisArgsSchema: z.ZodType<Prisma.TestStudentAnalysisDefaultArgs> = z.object({
  select: z.lazy(() => TestStudentAnalysisSelectSchema).optional(),
  include: z.lazy(() => TestStudentAnalysisIncludeSchema).optional(),
}).strict();

export const TestStudentAnalysisSelectSchema: z.ZodType<Prisma.TestStudentAnalysisSelect> = z.object({
  id: z.boolean().optional(),
  attemptId: z.boolean().optional(),
  promptVersionId: z.boolean().optional(),
  providerMode: z.boolean().optional(),
  status: z.boolean().optional(),
  summary: z.boolean().optional(),
  rawText: z.boolean().optional(),
  errorMessage: z.boolean().optional(),
  generatedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  attempt: z.union([z.boolean(),z.lazy(() => TestStudentAttemptArgsSchema)]).optional(),
  promptVersion: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionArgsSchema)]).optional(),
}).strict()

// ANALYSIS PROMPT
//------------------------------------------------------

export const AnalysisPromptIncludeSchema: z.ZodType<Prisma.AnalysisPromptInclude> = z.object({
  versions: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => AnalysisPromptCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const AnalysisPromptArgsSchema: z.ZodType<Prisma.AnalysisPromptDefaultArgs> = z.object({
  select: z.lazy(() => AnalysisPromptSelectSchema).optional(),
  include: z.lazy(() => AnalysisPromptIncludeSchema).optional(),
}).strict();

export const AnalysisPromptCountOutputTypeArgsSchema: z.ZodType<Prisma.AnalysisPromptCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => AnalysisPromptCountOutputTypeSelectSchema).nullish(),
}).strict();

export const AnalysisPromptCountOutputTypeSelectSchema: z.ZodType<Prisma.AnalysisPromptCountOutputTypeSelect> = z.object({
  versions: z.boolean().optional(),
}).strict();

export const AnalysisPromptSelectSchema: z.ZodType<Prisma.AnalysisPromptSelect> = z.object({
  id: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  archivedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  versions: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => AnalysisPromptCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ANALYSIS PROMPT VERSION
//------------------------------------------------------

export const AnalysisPromptVersionIncludeSchema: z.ZodType<Prisma.AnalysisPromptVersionInclude> = z.object({
  analysisPrompt: z.union([z.boolean(),z.lazy(() => AnalysisPromptArgsSchema)]).optional(),
  testVersions: z.union([z.boolean(),z.lazy(() => TestTopicVersionFindManyArgsSchema)]).optional(),
  studentAnalyses: z.union([z.boolean(),z.lazy(() => TestStudentAnalysisFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const AnalysisPromptVersionArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionDefaultArgs> = z.object({
  select: z.lazy(() => AnalysisPromptVersionSelectSchema).optional(),
  include: z.lazy(() => AnalysisPromptVersionIncludeSchema).optional(),
}).strict();

export const AnalysisPromptVersionCountOutputTypeArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => AnalysisPromptVersionCountOutputTypeSelectSchema).nullish(),
}).strict();

export const AnalysisPromptVersionCountOutputTypeSelectSchema: z.ZodType<Prisma.AnalysisPromptVersionCountOutputTypeSelect> = z.object({
  testVersions: z.boolean().optional(),
  studentAnalyses: z.boolean().optional(),
}).strict();

export const AnalysisPromptVersionSelectSchema: z.ZodType<Prisma.AnalysisPromptVersionSelect> = z.object({
  id: z.boolean().optional(),
  promptId: z.boolean().optional(),
  versionNumber: z.boolean().optional(),
  status: z.boolean().optional(),
  model: z.boolean().optional(),
  temperature: z.boolean().optional(),
  prompt: z.boolean().optional(),
  outputSchema: z.boolean().optional(),
  publishedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  analysisPrompt: z.union([z.boolean(),z.lazy(() => AnalysisPromptArgsSchema)]).optional(),
  testVersions: z.union([z.boolean(),z.lazy(() => TestTopicVersionFindManyArgsSchema)]).optional(),
  studentAnalyses: z.union([z.boolean(),z.lazy(() => TestStudentAnalysisFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => AnalysisPromptVersionCountOutputTypeArgsSchema)]).optional(),
}).strict()

// APP SETTING
//------------------------------------------------------

export const AppSettingSelectSchema: z.ZodType<Prisma.AppSettingSelect> = z.object({
  key: z.boolean().optional(),
  value: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hashedRefreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkListRelationFilterSchema).optional(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  hashedRefreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkOrderByRelationAggregateInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
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
.and(z.strictObject({
  id: z.number().int().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  hashedRefreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkListRelationFilterSchema).optional(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  hashedRefreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => UserAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => UserSumOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  hashedRefreshToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => EnumRoleWithAggregatesFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestTopicWhereInputSchema: z.ZodType<Prisma.TestTopicWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestTopicWhereInputSchema), z.lazy(() => TestTopicWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicWhereInputSchema), z.lazy(() => TestTopicWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  slug: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionListRelationFilterSchema).optional(),
  activeDraftVersion: z.union([ z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional().nullable(),
  activePublishedVersion: z.union([ z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional().nullable(),
});

export const TestTopicOrderByWithRelationInputSchema: z.ZodType<Prisma.TestTopicOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  activeDraftVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  activePublishedVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  versions: z.lazy(() => TestTopicVersionOrderByRelationAggregateInputSchema).optional(),
  activeDraftVersion: z.lazy(() => TestTopicVersionOrderByWithRelationInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionOrderByWithRelationInputSchema).optional(),
});

export const TestTopicWhereUniqueInputSchema: z.ZodType<Prisma.TestTopicWhereUniqueInput> = z.union([
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
.and(z.strictObject({
  id: z.number().int().optional(),
  slug: z.string().optional(),
  AND: z.union([ z.lazy(() => TestTopicWhereInputSchema), z.lazy(() => TestTopicWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicWhereInputSchema), z.lazy(() => TestTopicWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionListRelationFilterSchema).optional(),
  activeDraftVersion: z.union([ z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional().nullable(),
  activePublishedVersion: z.union([ z.lazy(() => TestTopicVersionNullableScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional().nullable(),
}));

export const TestTopicOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestTopicOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  activeDraftVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  activePublishedVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => TestTopicCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestTopicAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestTopicMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestTopicMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestTopicSumOrderByAggregateInputSchema).optional(),
});

export const TestTopicScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestTopicScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema), z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema), z.lazy(() => TestTopicScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  slug: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
});

export const TestTopicVersionWhereInputSchema: z.ZodType<Prisma.TestTopicVersionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestTopicVersionWhereInputSchema), z.lazy(() => TestTopicVersionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicVersionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicVersionWhereInputSchema), z.lazy(() => TestTopicVersionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  topicId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestTopicVersionStatusFilterSchema), z.lazy(() => TestTopicVersionStatusSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  topic: z.union([ z.lazy(() => TestTopicScalarRelationFilterSchema), z.lazy(() => TestTopicWhereInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicListRelationFilterSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicListRelationFilterSchema).optional(),
  analysisPromptVersion: z.union([ z.lazy(() => AnalysisPromptVersionNullableScalarRelationFilterSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional().nullable(),
  questions: z.lazy(() => TestQuestionListRelationFilterSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkListRelationFilterSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptListRelationFilterSchema).optional(),
});

export const TestTopicVersionOrderByWithRelationInputSchema: z.ZodType<Prisma.TestTopicVersionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  analysisPromptVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  topic: z.lazy(() => TestTopicOrderByWithRelationInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicOrderByRelationAggregateInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicOrderByRelationAggregateInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionOrderByWithRelationInputSchema).optional(),
  questions: z.lazy(() => TestQuestionOrderByRelationAggregateInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkOrderByRelationAggregateInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptOrderByRelationAggregateInputSchema).optional(),
});

export const TestTopicVersionWhereUniqueInputSchema: z.ZodType<Prisma.TestTopicVersionWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    topicId_versionNumber: z.lazy(() => TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    topicId_versionNumber: z.lazy(() => TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  topicId_versionNumber: z.lazy(() => TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => TestTopicVersionWhereInputSchema), z.lazy(() => TestTopicVersionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicVersionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicVersionWhereInputSchema), z.lazy(() => TestTopicVersionWhereInputSchema).array() ]).optional(),
  topicId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestTopicVersionStatusFilterSchema), z.lazy(() => TestTopicVersionStatusSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  topic: z.union([ z.lazy(() => TestTopicScalarRelationFilterSchema), z.lazy(() => TestTopicWhereInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicListRelationFilterSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicListRelationFilterSchema).optional(),
  analysisPromptVersion: z.union([ z.lazy(() => AnalysisPromptVersionNullableScalarRelationFilterSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional().nullable(),
  questions: z.lazy(() => TestQuestionListRelationFilterSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkListRelationFilterSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptListRelationFilterSchema).optional(),
}));

export const TestTopicVersionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestTopicVersionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  analysisPromptVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestTopicVersionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestTopicVersionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestTopicVersionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestTopicVersionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestTopicVersionSumOrderByAggregateInputSchema).optional(),
});

export const TestTopicVersionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestTopicVersionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema), z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema), z.lazy(() => TestTopicVersionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  topicId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestTopicVersionStatusWithAggregatesFilterSchema), z.lazy(() => TestTopicVersionStatusSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestQuestionWhereInputSchema: z.ZodType<Prisma.TestQuestionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionWhereInputSchema), z.lazy(() => TestQuestionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionWhereInputSchema), z.lazy(() => TestQuestionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  versionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => EnumTestQuestionTypeFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  settings: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  version: z.union([ z.lazy(() => TestTopicVersionScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionListRelationFilterSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandListRelationFilterSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerListRelationFilterSchema).optional(),
});

export const TestQuestionOrderByWithRelationInputSchema: z.ZodType<Prisma.TestQuestionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  versionId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  settings: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  version: z.lazy(() => TestTopicVersionOrderByWithRelationInputSchema).optional(),
  options: z.lazy(() => TestQuestionOptionOrderByRelationAggregateInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandOrderByRelationAggregateInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerOrderByRelationAggregateInputSchema).optional(),
});

export const TestQuestionWhereUniqueInputSchema: z.ZodType<Prisma.TestQuestionWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    versionId_order: z.lazy(() => TestQuestionVersionIdOrderCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    versionId_order: z.lazy(() => TestQuestionVersionIdOrderCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  versionId_order: z.lazy(() => TestQuestionVersionIdOrderCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => TestQuestionWhereInputSchema), z.lazy(() => TestQuestionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionWhereInputSchema), z.lazy(() => TestQuestionWhereInputSchema).array() ]).optional(),
  versionId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  type: z.union([ z.lazy(() => EnumTestQuestionTypeFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  settings: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  version: z.union([ z.lazy(() => TestTopicVersionScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionListRelationFilterSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandListRelationFilterSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerListRelationFilterSchema).optional(),
}));

export const TestQuestionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestQuestionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  versionId: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  required: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  settings: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestQuestionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestQuestionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestQuestionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestQuestionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestQuestionSumOrderByAggregateInputSchema).optional(),
});

export const TestQuestionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestQuestionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema), z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema), z.lazy(() => TestQuestionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  versionId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => EnumTestQuestionTypeWithAggregatesFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  settings: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestQuestionOptionWhereInputSchema: z.ZodType<Prisma.TestQuestionOptionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionOptionWhereInputSchema), z.lazy(() => TestQuestionOptionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionOptionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionOptionWhereInputSchema), z.lazy(() => TestQuestionOptionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  question: z.union([ z.lazy(() => TestQuestionScalarRelationFilterSchema), z.lazy(() => TestQuestionWhereInputSchema) ]).optional(),
});

export const TestQuestionOptionOrderByWithRelationInputSchema: z.ZodType<Prisma.TestQuestionOptionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  question: z.lazy(() => TestQuestionOrderByWithRelationInputSchema).optional(),
});

export const TestQuestionOptionWhereUniqueInputSchema: z.ZodType<Prisma.TestQuestionOptionWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    questionId_order: z.lazy(() => TestQuestionOptionQuestionIdOrderCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    questionId_order: z.lazy(() => TestQuestionOptionQuestionIdOrderCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  questionId_order: z.lazy(() => TestQuestionOptionQuestionIdOrderCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => TestQuestionOptionWhereInputSchema), z.lazy(() => TestQuestionOptionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionOptionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionOptionWhereInputSchema), z.lazy(() => TestQuestionOptionWhereInputSchema).array() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  question: z.union([ z.lazy(() => TestQuestionScalarRelationFilterSchema), z.lazy(() => TestQuestionWhereInputSchema) ]).optional(),
}));

export const TestQuestionOptionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestQuestionOptionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestQuestionOptionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestQuestionOptionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestQuestionOptionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestQuestionOptionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestQuestionOptionSumOrderByAggregateInputSchema).optional(),
});

export const TestQuestionOptionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestQuestionOptionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema), z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema), z.lazy(() => TestQuestionOptionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  label: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestQuestionSliderBandWhereInputSchema: z.ZodType<Prisma.TestQuestionSliderBandWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionSliderBandWhereInputSchema), z.lazy(() => TestQuestionSliderBandWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionSliderBandWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionSliderBandWhereInputSchema), z.lazy(() => TestQuestionSliderBandWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  minValue: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  maxValue: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  question: z.union([ z.lazy(() => TestQuestionScalarRelationFilterSchema), z.lazy(() => TestQuestionWhereInputSchema) ]).optional(),
});

export const TestQuestionSliderBandOrderByWithRelationInputSchema: z.ZodType<Prisma.TestQuestionSliderBandOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  question: z.lazy(() => TestQuestionOrderByWithRelationInputSchema).optional(),
});

export const TestQuestionSliderBandWhereUniqueInputSchema: z.ZodType<Prisma.TestQuestionSliderBandWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    questionId_order: z.lazy(() => TestQuestionSliderBandQuestionIdOrderCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    questionId_order: z.lazy(() => TestQuestionSliderBandQuestionIdOrderCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  questionId_order: z.lazy(() => TestQuestionSliderBandQuestionIdOrderCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => TestQuestionSliderBandWhereInputSchema), z.lazy(() => TestQuestionSliderBandWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionSliderBandWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionSliderBandWhereInputSchema), z.lazy(() => TestQuestionSliderBandWhereInputSchema).array() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  minValue: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  maxValue: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  question: z.union([ z.lazy(() => TestQuestionScalarRelationFilterSchema), z.lazy(() => TestQuestionWhereInputSchema) ]).optional(),
}));

export const TestQuestionSliderBandOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestQuestionSliderBandOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestQuestionSliderBandCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestQuestionSliderBandAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestQuestionSliderBandMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestQuestionSliderBandMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestQuestionSliderBandSumOrderByAggregateInputSchema).optional(),
});

export const TestQuestionSliderBandScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestQuestionSliderBandScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema), z.lazy(() => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema), z.lazy(() => TestQuestionSliderBandScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  minValue: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  maxValue: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  label: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
});

export const TestPublicLinkWhereInputSchema: z.ZodType<Prisma.TestPublicLinkWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestPublicLinkWhereInputSchema), z.lazy(() => TestPublicLinkWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestPublicLinkWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestPublicLinkWhereInputSchema), z.lazy(() => TestPublicLinkWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  educationOrganizationId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  shortCode: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  startsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  timeLimitMinutes: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  allowResume: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => EnumTestEntryProfileModeFilterSchema), z.lazy(() => TestEntryProfileModeSchema) ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  topicVersion: z.union([ z.lazy(() => TestTopicVersionScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  educationOrganization: z.union([ z.lazy(() => EducationOrganizationNullableScalarRelationFilterSchema), z.lazy(() => EducationOrganizationWhereInputSchema) ]).optional().nullable(),
  createdByUser: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptListRelationFilterSchema).optional(),
});

export const TestPublicLinkOrderByWithRelationInputSchema: z.ZodType<Prisma.TestPublicLinkOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  shortCode: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  startsAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  endsAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  allowResume: z.lazy(() => SortOrderSchema).optional(),
  entryProfileMode: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  topicVersion: z.lazy(() => TestTopicVersionOrderByWithRelationInputSchema).optional(),
  educationOrganization: z.lazy(() => EducationOrganizationOrderByWithRelationInputSchema).optional(),
  createdByUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptOrderByRelationAggregateInputSchema).optional(),
});

export const TestPublicLinkWhereUniqueInputSchema: z.ZodType<Prisma.TestPublicLinkWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    shortCode: z.string(),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    shortCode: z.string(),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  shortCode: z.string().optional(),
  AND: z.union([ z.lazy(() => TestPublicLinkWhereInputSchema), z.lazy(() => TestPublicLinkWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestPublicLinkWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestPublicLinkWhereInputSchema), z.lazy(() => TestPublicLinkWhereInputSchema).array() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  educationOrganizationId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  startsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  timeLimitMinutes: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  allowResume: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => EnumTestEntryProfileModeFilterSchema), z.lazy(() => TestEntryProfileModeSchema) ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  topicVersion: z.union([ z.lazy(() => TestTopicVersionScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  educationOrganization: z.union([ z.lazy(() => EducationOrganizationNullableScalarRelationFilterSchema), z.lazy(() => EducationOrganizationWhereInputSchema) ]).optional().nullable(),
  createdByUser: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptListRelationFilterSchema).optional(),
}));

export const TestPublicLinkOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestPublicLinkOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  shortCode: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  startsAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  endsAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  allowResume: z.lazy(() => SortOrderSchema).optional(),
  entryProfileMode: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => TestPublicLinkCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestPublicLinkAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestPublicLinkMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestPublicLinkMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestPublicLinkSumOrderByAggregateInputSchema).optional(),
});

export const TestPublicLinkScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestPublicLinkScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestPublicLinkScalarWhereWithAggregatesInputSchema), z.lazy(() => TestPublicLinkScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestPublicLinkScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestPublicLinkScalarWhereWithAggregatesInputSchema), z.lazy(() => TestPublicLinkScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  educationOrganizationId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  shortCode: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  startsAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  timeLimitMinutes: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  allowResume: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => EnumTestEntryProfileModeWithAggregatesFilterSchema), z.lazy(() => TestEntryProfileModeSchema) ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const EducationOrganizationWhereInputSchema: z.ZodType<Prisma.EducationOrganizationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EducationOrganizationWhereInputSchema), z.lazy(() => EducationOrganizationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EducationOrganizationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EducationOrganizationWhereInputSchema), z.lazy(() => EducationOrganizationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => EnumGroupOrClassValidationModeFilterSchema), z.lazy(() => GroupOrClassValidationModeSchema) ]).optional(),
  groupValidationPattern: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupValidationExample: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupValidationHint: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  publicLinks: z.lazy(() => TestPublicLinkListRelationFilterSchema).optional(),
});

export const EducationOrganizationOrderByWithRelationInputSchema: z.ZodType<Prisma.EducationOrganizationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  groupValidationMode: z.lazy(() => SortOrderSchema).optional(),
  groupValidationPattern: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  groupValidationExample: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  groupValidationHint: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkOrderByRelationAggregateInputSchema).optional(),
});

export const EducationOrganizationWhereUniqueInputSchema: z.ZodType<Prisma.EducationOrganizationWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    name: z.string(),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    name: z.string(),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  name: z.string().optional(),
  AND: z.union([ z.lazy(() => EducationOrganizationWhereInputSchema), z.lazy(() => EducationOrganizationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EducationOrganizationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EducationOrganizationWhereInputSchema), z.lazy(() => EducationOrganizationWhereInputSchema).array() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => EnumGroupOrClassValidationModeFilterSchema), z.lazy(() => GroupOrClassValidationModeSchema) ]).optional(),
  groupValidationPattern: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupValidationExample: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupValidationHint: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  publicLinks: z.lazy(() => TestPublicLinkListRelationFilterSchema).optional(),
}));

export const EducationOrganizationOrderByWithAggregationInputSchema: z.ZodType<Prisma.EducationOrganizationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  groupValidationMode: z.lazy(() => SortOrderSchema).optional(),
  groupValidationPattern: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  groupValidationExample: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  groupValidationHint: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => EducationOrganizationCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => EducationOrganizationAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EducationOrganizationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EducationOrganizationMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => EducationOrganizationSumOrderByAggregateInputSchema).optional(),
});

export const EducationOrganizationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.EducationOrganizationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EducationOrganizationScalarWhereWithAggregatesInputSchema), z.lazy(() => EducationOrganizationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => EducationOrganizationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EducationOrganizationScalarWhereWithAggregatesInputSchema), z.lazy(() => EducationOrganizationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => EnumGroupOrClassValidationModeWithAggregatesFilterSchema), z.lazy(() => GroupOrClassValidationModeSchema) ]).optional(),
  groupValidationPattern: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  groupValidationExample: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  groupValidationHint: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestStudentAttemptWhereInputSchema: z.ZodType<Prisma.TestStudentAttemptWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAttemptWhereInputSchema), z.lazy(() => TestStudentAttemptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAttemptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAttemptWhereInputSchema), z.lazy(() => TestStudentAttemptWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  publicLinkId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  attemptNumber: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAttemptStatusFilterSchema), z.lazy(() => TestStudentAttemptStatusSchema) ]).optional(),
  studentName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentLastInitial: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  educationOrganization: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupOrClass: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => EnumTestStudentGenderNullableFilterSchema), z.lazy(() => TestStudentGenderSchema) ]).optional().nullable(),
  studentAge: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  studentResidence: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => EnumTestStudentEducationLevelNullableFilterSchema), z.lazy(() => TestStudentEducationLevelSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentAcceptedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  resumeToken: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  startedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  finishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  anonymizedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  publicLink: z.union([ z.lazy(() => TestPublicLinkScalarRelationFilterSchema), z.lazy(() => TestPublicLinkWhereInputSchema) ]).optional(),
  topicVersion: z.union([ z.lazy(() => TestTopicVersionScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  answers: z.lazy(() => TestStudentAnswerListRelationFilterSchema).optional(),
  analysis: z.union([ z.lazy(() => TestStudentAnalysisNullableScalarRelationFilterSchema), z.lazy(() => TestStudentAnalysisWhereInputSchema) ]).optional().nullable(),
});

export const TestStudentAttemptOrderByWithRelationInputSchema: z.ZodType<Prisma.TestStudentAttemptOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  studentName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentLastInitial: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentMiddleInitial: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  educationOrganization: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  groupOrClass: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentGender: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentAge: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentResidence: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentEducationLevel: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentKeyHash: z.lazy(() => SortOrderSchema).optional(),
  consentAcceptedAt: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  resumeToken: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  finishedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  anonymizedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publicLink: z.lazy(() => TestPublicLinkOrderByWithRelationInputSchema).optional(),
  topicVersion: z.lazy(() => TestTopicVersionOrderByWithRelationInputSchema).optional(),
  answers: z.lazy(() => TestStudentAnswerOrderByRelationAggregateInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisOrderByWithRelationInputSchema).optional(),
});

export const TestStudentAttemptWhereUniqueInputSchema: z.ZodType<Prisma.TestStudentAttemptWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    resumeToken: z.string(),
    publicLinkId_studentKeyHash_attemptNumber: z.lazy(() => TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
    resumeToken: z.string(),
  }),
  z.object({
    id: z.number().int(),
    publicLinkId_studentKeyHash_attemptNumber: z.lazy(() => TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    resumeToken: z.string(),
    publicLinkId_studentKeyHash_attemptNumber: z.lazy(() => TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInputSchema),
  }),
  z.object({
    resumeToken: z.string(),
  }),
  z.object({
    publicLinkId_studentKeyHash_attemptNumber: z.lazy(() => TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  resumeToken: z.string().optional(),
  publicLinkId_studentKeyHash_attemptNumber: z.lazy(() => TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => TestStudentAttemptWhereInputSchema), z.lazy(() => TestStudentAttemptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAttemptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAttemptWhereInputSchema), z.lazy(() => TestStudentAttemptWhereInputSchema).array() ]).optional(),
  publicLinkId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  attemptNumber: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAttemptStatusFilterSchema), z.lazy(() => TestStudentAttemptStatusSchema) ]).optional(),
  studentName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentLastInitial: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  educationOrganization: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupOrClass: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => EnumTestStudentGenderNullableFilterSchema), z.lazy(() => TestStudentGenderSchema) ]).optional().nullable(),
  studentAge: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  studentResidence: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => EnumTestStudentEducationLevelNullableFilterSchema), z.lazy(() => TestStudentEducationLevelSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentAcceptedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  startedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  finishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  anonymizedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  publicLink: z.union([ z.lazy(() => TestPublicLinkScalarRelationFilterSchema), z.lazy(() => TestPublicLinkWhereInputSchema) ]).optional(),
  topicVersion: z.union([ z.lazy(() => TestTopicVersionScalarRelationFilterSchema), z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  answers: z.lazy(() => TestStudentAnswerListRelationFilterSchema).optional(),
  analysis: z.union([ z.lazy(() => TestStudentAnalysisNullableScalarRelationFilterSchema), z.lazy(() => TestStudentAnalysisWhereInputSchema) ]).optional().nullable(),
}));

export const TestStudentAttemptOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestStudentAttemptOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  studentName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentLastInitial: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentMiddleInitial: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  educationOrganization: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  groupOrClass: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentGender: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentAge: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentResidence: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentEducationLevel: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  studentKeyHash: z.lazy(() => SortOrderSchema).optional(),
  consentAcceptedAt: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  resumeToken: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  finishedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  anonymizedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestStudentAttemptCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestStudentAttemptAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestStudentAttemptMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestStudentAttemptMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestStudentAttemptSumOrderByAggregateInputSchema).optional(),
});

export const TestStudentAttemptScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestStudentAttemptScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAttemptScalarWhereWithAggregatesInputSchema), z.lazy(() => TestStudentAttemptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAttemptScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAttemptScalarWhereWithAggregatesInputSchema), z.lazy(() => TestStudentAttemptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  publicLinkId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  attemptNumber: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAttemptStatusWithAggregatesFilterSchema), z.lazy(() => TestStudentAttemptStatusSchema) ]).optional(),
  studentName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  studentLastInitial: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  educationOrganization: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  groupOrClass: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => EnumTestStudentGenderNullableWithAggregatesFilterSchema), z.lazy(() => TestStudentGenderSchema) ]).optional().nullable(),
  studentAge: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  studentResidence: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => EnumTestStudentEducationLevelNullableWithAggregatesFilterSchema), z.lazy(() => TestStudentEducationLevelSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  consentAcceptedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  resumeToken: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  startedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  finishedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  anonymizedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestStudentAnswerWhereInputSchema: z.ZodType<Prisma.TestStudentAnswerWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAnswerWhereInputSchema), z.lazy(() => TestStudentAnswerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnswerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnswerWhereInputSchema), z.lazy(() => TestStudentAnswerWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => EnumTestQuestionTypeFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  answerPayload: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  attempt: z.union([ z.lazy(() => TestStudentAttemptScalarRelationFilterSchema), z.lazy(() => TestStudentAttemptWhereInputSchema) ]).optional(),
  question: z.union([ z.lazy(() => TestQuestionScalarRelationFilterSchema), z.lazy(() => TestQuestionWhereInputSchema) ]).optional(),
});

export const TestStudentAnswerOrderByWithRelationInputSchema: z.ZodType<Prisma.TestStudentAnswerOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  questionTypeSnapshot: z.lazy(() => SortOrderSchema).optional(),
  questionTitleSnapshot: z.lazy(() => SortOrderSchema).optional(),
  answerPayload: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  attempt: z.lazy(() => TestStudentAttemptOrderByWithRelationInputSchema).optional(),
  question: z.lazy(() => TestQuestionOrderByWithRelationInputSchema).optional(),
});

export const TestStudentAnswerWhereUniqueInputSchema: z.ZodType<Prisma.TestStudentAnswerWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    attemptId_questionId: z.lazy(() => TestStudentAnswerAttemptIdQuestionIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    attemptId_questionId: z.lazy(() => TestStudentAnswerAttemptIdQuestionIdCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  attemptId_questionId: z.lazy(() => TestStudentAnswerAttemptIdQuestionIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => TestStudentAnswerWhereInputSchema), z.lazy(() => TestStudentAnswerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnswerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnswerWhereInputSchema), z.lazy(() => TestStudentAnswerWhereInputSchema).array() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => EnumTestQuestionTypeFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  answerPayload: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  attempt: z.union([ z.lazy(() => TestStudentAttemptScalarRelationFilterSchema), z.lazy(() => TestStudentAttemptWhereInputSchema) ]).optional(),
  question: z.union([ z.lazy(() => TestQuestionScalarRelationFilterSchema), z.lazy(() => TestQuestionWhereInputSchema) ]).optional(),
}));

export const TestStudentAnswerOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestStudentAnswerOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  questionTypeSnapshot: z.lazy(() => SortOrderSchema).optional(),
  questionTitleSnapshot: z.lazy(() => SortOrderSchema).optional(),
  answerPayload: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestStudentAnswerCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestStudentAnswerAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestStudentAnswerMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestStudentAnswerMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestStudentAnswerSumOrderByAggregateInputSchema).optional(),
});

export const TestStudentAnswerScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestStudentAnswerScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAnswerScalarWhereWithAggregatesInputSchema), z.lazy(() => TestStudentAnswerScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnswerScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnswerScalarWhereWithAggregatesInputSchema), z.lazy(() => TestStudentAnswerScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => EnumTestQuestionTypeWithAggregatesFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  answerPayload: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const TestStudentAnalysisWhereInputSchema: z.ZodType<Prisma.TestStudentAnalysisWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAnalysisWhereInputSchema), z.lazy(() => TestStudentAnalysisWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnalysisWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnalysisWhereInputSchema), z.lazy(() => TestStudentAnalysisWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  promptVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => EnumTestStudentAnalysisProviderModeFilterSchema), z.lazy(() => TestStudentAnalysisProviderModeSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAnalysisStatusFilterSchema), z.lazy(() => TestStudentAnalysisStatusSchema) ]).optional(),
  summary: z.lazy(() => JsonNullableFilterSchema).optional(),
  rawText: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  errorMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  generatedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  attempt: z.union([ z.lazy(() => TestStudentAttemptScalarRelationFilterSchema), z.lazy(() => TestStudentAttemptWhereInputSchema) ]).optional(),
  promptVersion: z.union([ z.lazy(() => AnalysisPromptVersionNullableScalarRelationFilterSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional().nullable(),
});

export const TestStudentAnalysisOrderByWithRelationInputSchema: z.ZodType<Prisma.TestStudentAnalysisOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  providerMode: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  summary: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rawText: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  errorMessage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  generatedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  attempt: z.lazy(() => TestStudentAttemptOrderByWithRelationInputSchema).optional(),
  promptVersion: z.lazy(() => AnalysisPromptVersionOrderByWithRelationInputSchema).optional(),
});

export const TestStudentAnalysisWhereUniqueInputSchema: z.ZodType<Prisma.TestStudentAnalysisWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    attemptId: z.number().int(),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    attemptId: z.number().int(),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int().optional(),
  AND: z.union([ z.lazy(() => TestStudentAnalysisWhereInputSchema), z.lazy(() => TestStudentAnalysisWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnalysisWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnalysisWhereInputSchema), z.lazy(() => TestStudentAnalysisWhereInputSchema).array() ]).optional(),
  promptVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => EnumTestStudentAnalysisProviderModeFilterSchema), z.lazy(() => TestStudentAnalysisProviderModeSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAnalysisStatusFilterSchema), z.lazy(() => TestStudentAnalysisStatusSchema) ]).optional(),
  summary: z.lazy(() => JsonNullableFilterSchema).optional(),
  rawText: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  errorMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  generatedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  attempt: z.union([ z.lazy(() => TestStudentAttemptScalarRelationFilterSchema), z.lazy(() => TestStudentAttemptWhereInputSchema) ]).optional(),
  promptVersion: z.union([ z.lazy(() => AnalysisPromptVersionNullableScalarRelationFilterSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional().nullable(),
}));

export const TestStudentAnalysisOrderByWithAggregationInputSchema: z.ZodType<Prisma.TestStudentAnalysisOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  providerMode: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  summary: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rawText: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  errorMessage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  generatedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TestStudentAnalysisCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TestStudentAnalysisAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TestStudentAnalysisMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TestStudentAnalysisMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TestStudentAnalysisSumOrderByAggregateInputSchema).optional(),
});

export const TestStudentAnalysisScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TestStudentAnalysisScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAnalysisScalarWhereWithAggregatesInputSchema), z.lazy(() => TestStudentAnalysisScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnalysisScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnalysisScalarWhereWithAggregatesInputSchema), z.lazy(() => TestStudentAnalysisScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  promptVersionId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => EnumTestStudentAnalysisProviderModeWithAggregatesFilterSchema), z.lazy(() => TestStudentAnalysisProviderModeSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAnalysisStatusWithAggregatesFilterSchema), z.lazy(() => TestStudentAnalysisStatusSchema) ]).optional(),
  summary: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  rawText: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  errorMessage: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  generatedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const AnalysisPromptWhereInputSchema: z.ZodType<Prisma.AnalysisPromptWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AnalysisPromptWhereInputSchema), z.lazy(() => AnalysisPromptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptWhereInputSchema), z.lazy(() => AnalysisPromptWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  versions: z.lazy(() => AnalysisPromptVersionListRelationFilterSchema).optional(),
});

export const AnalysisPromptOrderByWithRelationInputSchema: z.ZodType<Prisma.AnalysisPromptOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  archivedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  versions: z.lazy(() => AnalysisPromptVersionOrderByRelationAggregateInputSchema).optional(),
});

export const AnalysisPromptWhereUniqueInputSchema: z.ZodType<Prisma.AnalysisPromptWhereUniqueInput> = z.object({
  id: z.number().int(),
})
.and(z.strictObject({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => AnalysisPromptWhereInputSchema), z.lazy(() => AnalysisPromptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptWhereInputSchema), z.lazy(() => AnalysisPromptWhereInputSchema).array() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  versions: z.lazy(() => AnalysisPromptVersionListRelationFilterSchema).optional(),
}));

export const AnalysisPromptOrderByWithAggregationInputSchema: z.ZodType<Prisma.AnalysisPromptOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  archivedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AnalysisPromptCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => AnalysisPromptAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AnalysisPromptMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AnalysisPromptMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => AnalysisPromptSumOrderByAggregateInputSchema).optional(),
});

export const AnalysisPromptScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AnalysisPromptScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AnalysisPromptScalarWhereWithAggregatesInputSchema), z.lazy(() => AnalysisPromptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptScalarWhereWithAggregatesInputSchema), z.lazy(() => AnalysisPromptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const AnalysisPromptVersionWhereInputSchema: z.ZodType<Prisma.AnalysisPromptVersionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AnalysisPromptVersionWhereInputSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptVersionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptVersionWhereInputSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  promptId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumAnalysisPromptVersionStatusFilterSchema), z.lazy(() => AnalysisPromptVersionStatusSchema) ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  temperature: z.union([ z.lazy(() => FloatFilterSchema), z.number() ]).optional(),
  prompt: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  outputSchema: z.lazy(() => JsonNullableFilterSchema).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  analysisPrompt: z.union([ z.lazy(() => AnalysisPromptScalarRelationFilterSchema), z.lazy(() => AnalysisPromptWhereInputSchema) ]).optional(),
  testVersions: z.lazy(() => TestTopicVersionListRelationFilterSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisListRelationFilterSchema).optional(),
});

export const AnalysisPromptVersionOrderByWithRelationInputSchema: z.ZodType<Prisma.AnalysisPromptVersionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
  prompt: z.lazy(() => SortOrderSchema).optional(),
  outputSchema: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  publishedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptOrderByWithRelationInputSchema).optional(),
  testVersions: z.lazy(() => TestTopicVersionOrderByRelationAggregateInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisOrderByRelationAggregateInputSchema).optional(),
});

export const AnalysisPromptVersionWhereUniqueInputSchema: z.ZodType<Prisma.AnalysisPromptVersionWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    promptId_versionNumber: z.lazy(() => AnalysisPromptVersionPromptIdVersionNumberCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    promptId_versionNumber: z.lazy(() => AnalysisPromptVersionPromptIdVersionNumberCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.number().int().optional(),
  promptId_versionNumber: z.lazy(() => AnalysisPromptVersionPromptIdVersionNumberCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => AnalysisPromptVersionWhereInputSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptVersionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptVersionWhereInputSchema), z.lazy(() => AnalysisPromptVersionWhereInputSchema).array() ]).optional(),
  promptId: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  status: z.union([ z.lazy(() => EnumAnalysisPromptVersionStatusFilterSchema), z.lazy(() => AnalysisPromptVersionStatusSchema) ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  temperature: z.union([ z.lazy(() => FloatFilterSchema), z.number() ]).optional(),
  prompt: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  outputSchema: z.lazy(() => JsonNullableFilterSchema).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  analysisPrompt: z.union([ z.lazy(() => AnalysisPromptScalarRelationFilterSchema), z.lazy(() => AnalysisPromptWhereInputSchema) ]).optional(),
  testVersions: z.lazy(() => TestTopicVersionListRelationFilterSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisListRelationFilterSchema).optional(),
}));

export const AnalysisPromptVersionOrderByWithAggregationInputSchema: z.ZodType<Prisma.AnalysisPromptVersionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
  prompt: z.lazy(() => SortOrderSchema).optional(),
  outputSchema: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  publishedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AnalysisPromptVersionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => AnalysisPromptVersionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AnalysisPromptVersionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AnalysisPromptVersionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => AnalysisPromptVersionSumOrderByAggregateInputSchema).optional(),
});

export const AnalysisPromptVersionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AnalysisPromptVersionScalarWhereWithAggregatesInputSchema), z.lazy(() => AnalysisPromptVersionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptVersionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptVersionScalarWhereWithAggregatesInputSchema), z.lazy(() => AnalysisPromptVersionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  promptId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumAnalysisPromptVersionStatusWithAggregatesFilterSchema), z.lazy(() => AnalysisPromptVersionStatusSchema) ]).optional(),
  model: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  temperature: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema), z.number() ]).optional(),
  prompt: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  outputSchema: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const AppSettingWhereInputSchema: z.ZodType<Prisma.AppSettingWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AppSettingWhereInputSchema), z.lazy(() => AppSettingWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AppSettingWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AppSettingWhereInputSchema), z.lazy(() => AppSettingWhereInputSchema).array() ]).optional(),
  key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const AppSettingOrderByWithRelationInputSchema: z.ZodType<Prisma.AppSettingOrderByWithRelationInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AppSettingWhereUniqueInputSchema: z.ZodType<Prisma.AppSettingWhereUniqueInput> = z.object({
  key: z.string(),
})
.and(z.strictObject({
  key: z.string().optional(),
  AND: z.union([ z.lazy(() => AppSettingWhereInputSchema), z.lazy(() => AppSettingWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AppSettingWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AppSettingWhereInputSchema), z.lazy(() => AppSettingWhereInputSchema).array() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const AppSettingOrderByWithAggregationInputSchema: z.ZodType<Prisma.AppSettingOrderByWithAggregationInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AppSettingCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AppSettingMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AppSettingMinOrderByAggregateInputSchema).optional(),
});

export const AppSettingScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AppSettingScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AppSettingScalarWhereWithAggregatesInputSchema), z.lazy(() => AppSettingScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AppSettingScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AppSettingScalarWhereWithAggregatesInputSchema), z.lazy(() => AppSettingScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  key: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  email: z.string(),
  name: z.string().optional().nullable(),
  password: z.string(),
  hashedRefreshToken: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  password: z.string(),
  hashedRefreshToken: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hashedRefreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hashedRefreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdPublicTestLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  password: z.string(),
  hashedRefreshToken: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hashedRefreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hashedRefreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestTopicCreateInputSchema: z.ZodType<Prisma.TestTopicCreateInput> = z.strictObject({
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  versions: z.lazy(() => TestTopicVersionCreateNestedManyWithoutTopicInputSchema).optional(),
  activeDraftVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema).optional(),
});

export const TestTopicUncheckedCreateInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activeDraftVersionId: z.number().int().optional().nullable(),
  activePublishedVersionId: z.number().int().optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema).optional(),
});

export const TestTopicUpdateInputSchema: z.ZodType<Prisma.TestTopicUpdateInput> = z.strictObject({
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUpdateManyWithoutTopicNestedInputSchema).optional(),
  activeDraftVersion: z.lazy(() => TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema).optional(),
});

export const TestTopicUncheckedUpdateInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema).optional(),
});

export const TestTopicCreateManyInputSchema: z.ZodType<Prisma.TestTopicCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activeDraftVersionId: z.number().int().optional().nullable(),
  activePublishedVersionId: z.number().int().optional().nullable(),
});

export const TestTopicUpdateManyMutationInputSchema: z.ZodType<Prisma.TestTopicUpdateManyMutationInput> = z.strictObject({
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestTopicUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestTopicVersionCreateInputSchema: z.ZodType<Prisma.TestTopicVersionCreateInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUpdateInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionCreateManyInputSchema: z.ZodType<Prisma.TestTopicVersionCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestTopicVersionUpdateManyMutationInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyMutationInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestTopicVersionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionCreateInputSchema: z.ZodType<Prisma.TestQuestionCreateInput> = z.strictObject({
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  version: z.lazy(() => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema),
  options: z.lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionUncheckedCreateInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  versionId: z.number().int(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionUpdateInputSchema: z.ZodType<Prisma.TestQuestionUpdateInput> = z.strictObject({
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  version: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema).optional(),
  options: z.lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionUncheckedUpdateInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionCreateManyInputSchema: z.ZodType<Prisma.TestQuestionCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  versionId: z.number().int(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionUpdateManyMutationInputSchema: z.ZodType<Prisma.TestQuestionUpdateManyMutationInput> = z.strictObject({
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionOptionCreateInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateInput> = z.strictObject({
  label: z.string(),
  value: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  question: z.lazy(() => TestQuestionCreateNestedOneWithoutOptionsInputSchema),
});

export const TestQuestionOptionUncheckedCreateInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  questionId: z.number().int(),
  label: z.string(),
  value: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionOptionUpdateInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateInput> = z.strictObject({
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  question: z.lazy(() => TestQuestionUpdateOneRequiredWithoutOptionsNestedInputSchema).optional(),
});

export const TestQuestionOptionUncheckedUpdateInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionOptionCreateManyInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  questionId: z.number().int(),
  label: z.string(),
  value: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionOptionUpdateManyMutationInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyMutationInput> = z.strictObject({
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionOptionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionSliderBandCreateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateInput> = z.strictObject({
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  question: z.lazy(() => TestQuestionCreateNestedOneWithoutSliderBandsInputSchema),
});

export const TestQuestionSliderBandUncheckedCreateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  questionId: z.number().int(),
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
});

export const TestQuestionSliderBandUpdateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateInput> = z.strictObject({
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  question: z.lazy(() => TestQuestionUpdateOneRequiredWithoutSliderBandsNestedInputSchema).optional(),
});

export const TestQuestionSliderBandUncheckedUpdateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionSliderBandCreateManyInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  questionId: z.number().int(),
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
});

export const TestQuestionSliderBandUpdateManyMutationInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyMutationInput> = z.strictObject({
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionSliderBandUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestPublicLinkCreateInputSchema: z.ZodType<Prisma.TestPublicLinkCreateInput> = z.strictObject({
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublicLinksInputSchema),
  educationOrganization: z.lazy(() => EducationOrganizationCreateNestedOneWithoutPublicLinksInputSchema).optional(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedPublicTestLinksInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkUncheckedCreateInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkUpdateInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateInput> = z.strictObject({
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutPublicLinksNestedInputSchema).optional(),
  educationOrganization: z.lazy(() => EducationOrganizationUpdateOneWithoutPublicLinksNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneWithoutCreatedPublicTestLinksNestedInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkCreateManyInputSchema: z.ZodType<Prisma.TestPublicLinkCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
});

export const TestPublicLinkUpdateManyMutationInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyMutationInput> = z.strictObject({
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestPublicLinkUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const EducationOrganizationCreateInputSchema: z.ZodType<Prisma.EducationOrganizationCreateInput> = z.strictObject({
  name: z.string(),
  isActive: z.boolean().optional(),
  groupValidationMode: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  groupValidationPattern: z.string().optional().nullable(),
  groupValidationExample: z.string().optional().nullable(),
  groupValidationHint: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutEducationOrganizationInputSchema).optional(),
});

export const EducationOrganizationUncheckedCreateInputSchema: z.ZodType<Prisma.EducationOrganizationUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  name: z.string(),
  isActive: z.boolean().optional(),
  groupValidationMode: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  groupValidationPattern: z.string().optional().nullable(),
  groupValidationExample: z.string().optional().nullable(),
  groupValidationHint: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutEducationOrganizationInputSchema).optional(),
});

export const EducationOrganizationUpdateInputSchema: z.ZodType<Prisma.EducationOrganizationUpdateInput> = z.strictObject({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationPattern: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationExample: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationHint: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutEducationOrganizationNestedInputSchema).optional(),
});

export const EducationOrganizationUncheckedUpdateInputSchema: z.ZodType<Prisma.EducationOrganizationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationPattern: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationExample: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationHint: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutEducationOrganizationNestedInputSchema).optional(),
});

export const EducationOrganizationCreateManyInputSchema: z.ZodType<Prisma.EducationOrganizationCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  name: z.string(),
  isActive: z.boolean().optional(),
  groupValidationMode: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  groupValidationPattern: z.string().optional().nullable(),
  groupValidationExample: z.string().optional().nullable(),
  groupValidationHint: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EducationOrganizationUpdateManyMutationInputSchema: z.ZodType<Prisma.EducationOrganizationUpdateManyMutationInput> = z.strictObject({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationPattern: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationExample: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationHint: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EducationOrganizationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.EducationOrganizationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationPattern: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationExample: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationHint: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAttemptCreateInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateInput> = z.strictObject({
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publicLink: z.lazy(() => TestPublicLinkCreateNestedOneWithoutAttemptsInputSchema),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutStudentAttemptsInputSchema),
  answers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutAttemptInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptUncheckedCreateInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  publicLinkId: z.number().int(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutAttemptInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptUpdateInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateInput> = z.strictObject({
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publicLink: z.lazy(() => TestPublicLinkUpdateOneRequiredWithoutAttemptsNestedInputSchema).optional(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutStudentAttemptsNestedInputSchema).optional(),
  answers: z.lazy(() => TestStudentAnswerUpdateManyWithoutAttemptNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutAttemptNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptCreateManyInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  publicLinkId: z.number().int(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAttemptUpdateManyMutationInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyMutationInput> = z.strictObject({
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAttemptUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnswerCreateInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateInput> = z.strictObject({
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  attempt: z.lazy(() => TestStudentAttemptCreateNestedOneWithoutAnswersInputSchema),
  question: z.lazy(() => TestQuestionCreateNestedOneWithoutStudentAnswersInputSchema),
});

export const TestStudentAnswerUncheckedCreateInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  questionId: z.number().int(),
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnswerUpdateInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateInput> = z.strictObject({
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  attempt: z.lazy(() => TestStudentAttemptUpdateOneRequiredWithoutAnswersNestedInputSchema).optional(),
  question: z.lazy(() => TestQuestionUpdateOneRequiredWithoutStudentAnswersNestedInputSchema).optional(),
});

export const TestStudentAnswerUncheckedUpdateInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnswerCreateManyInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  questionId: z.number().int(),
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnswerUpdateManyMutationInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyMutationInput> = z.strictObject({
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnswerUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnalysisCreateInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateInput> = z.strictObject({
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  attempt: z.lazy(() => TestStudentAttemptCreateNestedOneWithoutAnalysisInputSchema),
  promptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutStudentAnalysesInputSchema).optional(),
});

export const TestStudentAnalysisUncheckedCreateInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  promptVersionId: z.number().int().optional().nullable(),
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnalysisUpdateInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateInput> = z.strictObject({
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  attempt: z.lazy(() => TestStudentAttemptUpdateOneRequiredWithoutAnalysisNestedInputSchema).optional(),
  promptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutStudentAnalysesNestedInputSchema).optional(),
});

export const TestStudentAnalysisUncheckedUpdateInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnalysisCreateManyInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  promptVersionId: z.number().int().optional().nullable(),
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnalysisUpdateManyMutationInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateManyMutationInput> = z.strictObject({
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnalysisUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AnalysisPromptCreateInputSchema: z.ZodType<Prisma.AnalysisPromptCreateInput> = z.strictObject({
  title: z.string(),
  description: z.string().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  versions: z.lazy(() => AnalysisPromptVersionCreateNestedManyWithoutAnalysisPromptInputSchema).optional(),
});

export const AnalysisPromptUncheckedCreateInputSchema: z.ZodType<Prisma.AnalysisPromptUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  versions: z.lazy(() => AnalysisPromptVersionUncheckedCreateNestedManyWithoutAnalysisPromptInputSchema).optional(),
});

export const AnalysisPromptUpdateInputSchema: z.ZodType<Prisma.AnalysisPromptUpdateInput> = z.strictObject({
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  versions: z.lazy(() => AnalysisPromptVersionUpdateManyWithoutAnalysisPromptNestedInputSchema).optional(),
});

export const AnalysisPromptUncheckedUpdateInputSchema: z.ZodType<Prisma.AnalysisPromptUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  versions: z.lazy(() => AnalysisPromptVersionUncheckedUpdateManyWithoutAnalysisPromptNestedInputSchema).optional(),
});

export const AnalysisPromptCreateManyInputSchema: z.ZodType<Prisma.AnalysisPromptCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AnalysisPromptUpdateManyMutationInputSchema: z.ZodType<Prisma.AnalysisPromptUpdateManyMutationInput> = z.strictObject({
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AnalysisPromptUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AnalysisPromptUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AnalysisPromptVersionCreateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptCreateNestedOneWithoutVersionsInputSchema),
  testVersions: z.lazy(() => TestTopicVersionCreateNestedManyWithoutAnalysisPromptVersionInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisCreateNestedManyWithoutPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedCreateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedCreateInput> = z.strictObject({
  id: z.number().int().optional(),
  promptId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  testVersions: z.lazy(() => TestTopicVersionUncheckedCreateNestedManyWithoutAnalysisPromptVersionInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedManyWithoutPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionUpdateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  testVersions: z.lazy(() => TestTopicVersionUpdateManyWithoutAnalysisPromptVersionNestedInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUpdateManyWithoutPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  testVersions: z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionNestedInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionCreateManyInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateManyInput> = z.strictObject({
  id: z.number().int().optional(),
  promptId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AnalysisPromptVersionUpdateManyMutationInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateManyMutationInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AppSettingCreateInputSchema: z.ZodType<Prisma.AppSettingCreateInput> = z.strictObject({
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AppSettingUncheckedCreateInputSchema: z.ZodType<Prisma.AppSettingUncheckedCreateInput> = z.strictObject({
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AppSettingUpdateInputSchema: z.ZodType<Prisma.AppSettingUpdateInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AppSettingUncheckedUpdateInputSchema: z.ZodType<Prisma.AppSettingUncheckedUpdateInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AppSettingCreateManyInputSchema: z.ZodType<Prisma.AppSettingCreateManyInput> = z.strictObject({
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AppSettingUpdateManyMutationInputSchema: z.ZodType<Prisma.AppSettingUpdateManyMutationInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AppSettingUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AppSettingUncheckedUpdateManyInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const TestPublicLinkListRelationFilterSchema: z.ZodType<Prisma.TestPublicLinkListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
  some: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
  none: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const TestPublicLinkOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestPublicLinkOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  hashedRefreshToken: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserAvgOrderByAggregateInputSchema: z.ZodType<Prisma.UserAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  hashedRefreshToken: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  hashedRefreshToken: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserSumOrderByAggregateInputSchema: z.ZodType<Prisma.UserSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const TestTopicVersionListRelationFilterSchema: z.ZodType<Prisma.TestTopicVersionListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  some: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  none: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestTopicVersionNullableScalarRelationFilterSchema: z.ZodType<Prisma.TestTopicVersionNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestTopicVersionWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => TestTopicVersionWhereInputSchema).optional().nullable(),
});

export const TestTopicVersionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
  activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
  activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
  activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
  activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
  activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
  activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
  activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  activeDraftVersionId: z.lazy(() => SortOrderSchema).optional(),
  activePublishedVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const EnumTestTopicVersionStatusFilterSchema: z.ZodType<Prisma.EnumTestTopicVersionStatusFilter> = z.strictObject({
  equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  in: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema) ]).optional(),
});

export const TestTopicScalarRelationFilterSchema: z.ZodType<Prisma.TestTopicScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestTopicWhereInputSchema).optional(),
  isNot: z.lazy(() => TestTopicWhereInputSchema).optional(),
});

export const TestTopicListRelationFilterSchema: z.ZodType<Prisma.TestTopicListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestTopicWhereInputSchema).optional(),
  some: z.lazy(() => TestTopicWhereInputSchema).optional(),
  none: z.lazy(() => TestTopicWhereInputSchema).optional(),
});

export const AnalysisPromptVersionNullableScalarRelationFilterSchema: z.ZodType<Prisma.AnalysisPromptVersionNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional().nullable(),
});

export const TestQuestionListRelationFilterSchema: z.ZodType<Prisma.TestQuestionListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  some: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  none: z.lazy(() => TestQuestionWhereInputSchema).optional(),
});

export const TestStudentAttemptListRelationFilterSchema: z.ZodType<Prisma.TestStudentAttemptListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
  some: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
  none: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
});

export const TestTopicOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestTopicOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestQuestionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAttemptOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestStudentAttemptOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicVersionTopicIdVersionNumberCompoundUniqueInputSchema: z.ZodType<Prisma.TestTopicVersionTopicIdVersionNumberCompoundUniqueInput> = z.strictObject({
  topicId: z.number(),
  versionNumber: z.number(),
});

export const TestTopicVersionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  analysisPromptVersionId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicVersionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  analysisPromptVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicVersionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  analysisPromptVersionId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicVersionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  analysisPromptVersionId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestTopicVersionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestTopicVersionSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  analysisPromptVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumTestTopicVersionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestTopicVersionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  in: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => NestedEnumTestTopicVersionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
});

export const EnumTestQuestionTypeFilterSchema: z.ZodType<Prisma.EnumTestQuestionTypeFilter> = z.strictObject({
  equals: z.lazy(() => TestQuestionTypeSchema).optional(),
  in: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  notIn: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => NestedEnumTestQuestionTypeFilterSchema) ]).optional(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
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

export const TestTopicVersionScalarRelationFilterSchema: z.ZodType<Prisma.TestTopicVersionScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  isNot: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestQuestionOptionListRelationFilterSchema: z.ZodType<Prisma.TestQuestionOptionListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestQuestionOptionWhereInputSchema).optional(),
  some: z.lazy(() => TestQuestionOptionWhereInputSchema).optional(),
  none: z.lazy(() => TestQuestionOptionWhereInputSchema).optional(),
});

export const TestQuestionSliderBandListRelationFilterSchema: z.ZodType<Prisma.TestQuestionSliderBandListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestQuestionSliderBandWhereInputSchema).optional(),
  some: z.lazy(() => TestQuestionSliderBandWhereInputSchema).optional(),
  none: z.lazy(() => TestQuestionSliderBandWhereInputSchema).optional(),
});

export const TestStudentAnswerListRelationFilterSchema: z.ZodType<Prisma.TestStudentAnswerListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestStudentAnswerWhereInputSchema).optional(),
  some: z.lazy(() => TestStudentAnswerWhereInputSchema).optional(),
  none: z.lazy(() => TestStudentAnswerWhereInputSchema).optional(),
});

export const TestQuestionOptionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionSliderBandOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnswerOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestStudentAnswerOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionVersionIdOrderCompoundUniqueInputSchema: z.ZodType<Prisma.TestQuestionVersionIdOrderCompoundUniqueInput> = z.strictObject({
  versionId: z.number(),
  order: z.number(),
});

export const TestQuestionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionCountOrderByAggregateInput> = z.strictObject({
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

export const TestQuestionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  versionId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionMaxOrderByAggregateInput> = z.strictObject({
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

export const TestQuestionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionMinOrderByAggregateInput> = z.strictObject({
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

export const TestQuestionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  versionId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumTestQuestionTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestQuestionTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestQuestionTypeSchema).optional(),
  in: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  notIn: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => NestedEnumTestQuestionTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
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

export const TestQuestionScalarRelationFilterSchema: z.ZodType<Prisma.TestQuestionScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  isNot: z.lazy(() => TestQuestionWhereInputSchema).optional(),
});

export const TestQuestionOptionQuestionIdOrderCompoundUniqueInputSchema: z.ZodType<Prisma.TestQuestionOptionQuestionIdOrderCompoundUniqueInput> = z.strictObject({
  questionId: z.number(),
  order: z.number(),
});

export const TestQuestionOptionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionOptionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionOptionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionOptionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionOptionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionOptionSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionSliderBandQuestionIdOrderCompoundUniqueInputSchema: z.ZodType<Prisma.TestQuestionSliderBandQuestionIdOrderCompoundUniqueInput> = z.strictObject({
  questionId: z.number(),
  order: z.number(),
});

export const TestQuestionSliderBandCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionSliderBandAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionSliderBandMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionSliderBandMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const TestQuestionSliderBandSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestQuestionSliderBandSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  minValue: z.lazy(() => SortOrderSchema).optional(),
  maxValue: z.lazy(() => SortOrderSchema).optional(),
  weight: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumTestEntryProfileModeFilterSchema: z.ZodType<Prisma.EnumTestEntryProfileModeFilter> = z.strictObject({
  equals: z.lazy(() => TestEntryProfileModeSchema).optional(),
  in: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  notIn: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => NestedEnumTestEntryProfileModeFilterSchema) ]).optional(),
});

export const EducationOrganizationNullableScalarRelationFilterSchema: z.ZodType<Prisma.EducationOrganizationNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => EducationOrganizationWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => EducationOrganizationWhereInputSchema).optional().nullable(),
});

export const UserNullableScalarRelationFilterSchema: z.ZodType<Prisma.UserNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserWhereInputSchema).optional().nullable(),
});

export const TestPublicLinkCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestPublicLinkCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.lazy(() => SortOrderSchema).optional(),
  shortCode: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  startsAt: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.lazy(() => SortOrderSchema).optional(),
  allowResume: z.lazy(() => SortOrderSchema).optional(),
  entryProfileMode: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestPublicLinkAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestPublicLinkAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.lazy(() => SortOrderSchema).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestPublicLinkMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestPublicLinkMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.lazy(() => SortOrderSchema).optional(),
  shortCode: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  startsAt: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.lazy(() => SortOrderSchema).optional(),
  allowResume: z.lazy(() => SortOrderSchema).optional(),
  entryProfileMode: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestPublicLinkMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestPublicLinkMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.lazy(() => SortOrderSchema).optional(),
  shortCode: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  startsAt: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.lazy(() => SortOrderSchema).optional(),
  allowResume: z.lazy(() => SortOrderSchema).optional(),
  entryProfileMode: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestPublicLinkSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestPublicLinkSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  educationOrganizationId: z.lazy(() => SortOrderSchema).optional(),
  maxAttemptsPerStudent: z.lazy(() => SortOrderSchema).optional(),
  timeLimitMinutes: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumTestEntryProfileModeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestEntryProfileModeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestEntryProfileModeSchema).optional(),
  in: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  notIn: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => NestedEnumTestEntryProfileModeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestEntryProfileModeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestEntryProfileModeFilterSchema).optional(),
});

export const EnumGroupOrClassValidationModeFilterSchema: z.ZodType<Prisma.EnumGroupOrClassValidationModeFilter> = z.strictObject({
  equals: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  in: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  notIn: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  not: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => NestedEnumGroupOrClassValidationModeFilterSchema) ]).optional(),
});

export const EducationOrganizationCountOrderByAggregateInputSchema: z.ZodType<Prisma.EducationOrganizationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  groupValidationMode: z.lazy(() => SortOrderSchema).optional(),
  groupValidationPattern: z.lazy(() => SortOrderSchema).optional(),
  groupValidationExample: z.lazy(() => SortOrderSchema).optional(),
  groupValidationHint: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EducationOrganizationAvgOrderByAggregateInputSchema: z.ZodType<Prisma.EducationOrganizationAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
});

export const EducationOrganizationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.EducationOrganizationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  groupValidationMode: z.lazy(() => SortOrderSchema).optional(),
  groupValidationPattern: z.lazy(() => SortOrderSchema).optional(),
  groupValidationExample: z.lazy(() => SortOrderSchema).optional(),
  groupValidationHint: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EducationOrganizationMinOrderByAggregateInputSchema: z.ZodType<Prisma.EducationOrganizationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  groupValidationMode: z.lazy(() => SortOrderSchema).optional(),
  groupValidationPattern: z.lazy(() => SortOrderSchema).optional(),
  groupValidationExample: z.lazy(() => SortOrderSchema).optional(),
  groupValidationHint: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EducationOrganizationSumOrderByAggregateInputSchema: z.ZodType<Prisma.EducationOrganizationSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumGroupOrClassValidationModeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumGroupOrClassValidationModeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  in: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  notIn: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  not: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => NestedEnumGroupOrClassValidationModeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumGroupOrClassValidationModeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumGroupOrClassValidationModeFilterSchema).optional(),
});

export const EnumTestStudentAttemptStatusFilterSchema: z.ZodType<Prisma.EnumTestStudentAttemptStatusFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  in: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => NestedEnumTestStudentAttemptStatusFilterSchema) ]).optional(),
});

export const EnumTestStudentGenderNullableFilterSchema: z.ZodType<Prisma.EnumTestStudentGenderNullableFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  in: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NestedEnumTestStudentGenderNullableFilterSchema) ]).optional().nullable(),
});

export const EnumTestStudentEducationLevelNullableFilterSchema: z.ZodType<Prisma.EnumTestStudentEducationLevelNullableFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  in: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NestedEnumTestStudentEducationLevelNullableFilterSchema) ]).optional().nullable(),
});

export const TestPublicLinkScalarRelationFilterSchema: z.ZodType<Prisma.TestPublicLinkScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
  isNot: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
});

export const TestStudentAnalysisNullableScalarRelationFilterSchema: z.ZodType<Prisma.TestStudentAnalysisNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional().nullable(),
});

export const TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInputSchema: z.ZodType<Prisma.TestStudentAttemptPublicLinkIdStudentKeyHashAttemptNumberCompoundUniqueInput> = z.strictObject({
  publicLinkId: z.number(),
  studentKeyHash: z.string(),
  attemptNumber: z.number(),
});

export const TestStudentAttemptCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAttemptCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  studentName: z.lazy(() => SortOrderSchema).optional(),
  studentLastInitial: z.lazy(() => SortOrderSchema).optional(),
  studentMiddleInitial: z.lazy(() => SortOrderSchema).optional(),
  educationOrganization: z.lazy(() => SortOrderSchema).optional(),
  groupOrClass: z.lazy(() => SortOrderSchema).optional(),
  studentGender: z.lazy(() => SortOrderSchema).optional(),
  studentAge: z.lazy(() => SortOrderSchema).optional(),
  studentResidence: z.lazy(() => SortOrderSchema).optional(),
  studentEducationLevel: z.lazy(() => SortOrderSchema).optional(),
  studentKeyHash: z.lazy(() => SortOrderSchema).optional(),
  consentAcceptedAt: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  resumeToken: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  finishedAt: z.lazy(() => SortOrderSchema).optional(),
  anonymizedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAttemptAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAttemptAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  studentAge: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAttemptMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAttemptMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  studentName: z.lazy(() => SortOrderSchema).optional(),
  studentLastInitial: z.lazy(() => SortOrderSchema).optional(),
  studentMiddleInitial: z.lazy(() => SortOrderSchema).optional(),
  educationOrganization: z.lazy(() => SortOrderSchema).optional(),
  groupOrClass: z.lazy(() => SortOrderSchema).optional(),
  studentGender: z.lazy(() => SortOrderSchema).optional(),
  studentAge: z.lazy(() => SortOrderSchema).optional(),
  studentResidence: z.lazy(() => SortOrderSchema).optional(),
  studentEducationLevel: z.lazy(() => SortOrderSchema).optional(),
  studentKeyHash: z.lazy(() => SortOrderSchema).optional(),
  consentAcceptedAt: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  resumeToken: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  finishedAt: z.lazy(() => SortOrderSchema).optional(),
  anonymizedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAttemptMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAttemptMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  studentName: z.lazy(() => SortOrderSchema).optional(),
  studentLastInitial: z.lazy(() => SortOrderSchema).optional(),
  studentMiddleInitial: z.lazy(() => SortOrderSchema).optional(),
  educationOrganization: z.lazy(() => SortOrderSchema).optional(),
  groupOrClass: z.lazy(() => SortOrderSchema).optional(),
  studentGender: z.lazy(() => SortOrderSchema).optional(),
  studentAge: z.lazy(() => SortOrderSchema).optional(),
  studentResidence: z.lazy(() => SortOrderSchema).optional(),
  studentEducationLevel: z.lazy(() => SortOrderSchema).optional(),
  studentKeyHash: z.lazy(() => SortOrderSchema).optional(),
  consentAcceptedAt: z.lazy(() => SortOrderSchema).optional(),
  consentVersion: z.lazy(() => SortOrderSchema).optional(),
  consentTextSnapshot: z.lazy(() => SortOrderSchema).optional(),
  resumeToken: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  finishedAt: z.lazy(() => SortOrderSchema).optional(),
  anonymizedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAttemptSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAttemptSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  publicLinkId: z.lazy(() => SortOrderSchema).optional(),
  topicVersionId: z.lazy(() => SortOrderSchema).optional(),
  attemptNumber: z.lazy(() => SortOrderSchema).optional(),
  studentAge: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumTestStudentAttemptStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestStudentAttemptStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  in: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => NestedEnumTestStudentAttemptStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentAttemptStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentAttemptStatusFilterSchema).optional(),
});

export const EnumTestStudentGenderNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestStudentGenderNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  in: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NestedEnumTestStudentGenderNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentGenderNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentGenderNullableFilterSchema).optional(),
});

export const EnumTestStudentEducationLevelNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestStudentEducationLevelNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  in: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NestedEnumTestStudentEducationLevelNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentEducationLevelNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentEducationLevelNullableFilterSchema).optional(),
});

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.strictObject({
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

export const TestStudentAttemptScalarRelationFilterSchema: z.ZodType<Prisma.TestStudentAttemptScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
  isNot: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
});

export const TestStudentAnswerAttemptIdQuestionIdCompoundUniqueInputSchema: z.ZodType<Prisma.TestStudentAnswerAttemptIdQuestionIdCompoundUniqueInput> = z.strictObject({
  attemptId: z.number(),
  questionId: z.number(),
});

export const TestStudentAnswerCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnswerCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  questionTypeSnapshot: z.lazy(() => SortOrderSchema).optional(),
  questionTitleSnapshot: z.lazy(() => SortOrderSchema).optional(),
  answerPayload: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnswerAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnswerAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnswerMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnswerMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  questionTypeSnapshot: z.lazy(() => SortOrderSchema).optional(),
  questionTitleSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnswerMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnswerMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
  questionTypeSnapshot: z.lazy(() => SortOrderSchema).optional(),
  questionTitleSnapshot: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnswerSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnswerSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  questionId: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.strictObject({
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
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional(),
});

export const EnumTestStudentAnalysisProviderModeFilterSchema: z.ZodType<Prisma.EnumTestStudentAnalysisProviderModeFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => NestedEnumTestStudentAnalysisProviderModeFilterSchema) ]).optional(),
});

export const EnumTestStudentAnalysisStatusFilterSchema: z.ZodType<Prisma.EnumTestStudentAnalysisStatusFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => NestedEnumTestStudentAnalysisStatusFilterSchema) ]).optional(),
});

export const TestStudentAnalysisCountOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnalysisCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.lazy(() => SortOrderSchema).optional(),
  providerMode: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  summary: z.lazy(() => SortOrderSchema).optional(),
  rawText: z.lazy(() => SortOrderSchema).optional(),
  errorMessage: z.lazy(() => SortOrderSchema).optional(),
  generatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnalysisAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnalysisAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnalysisMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnalysisMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.lazy(() => SortOrderSchema).optional(),
  providerMode: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  rawText: z.lazy(() => SortOrderSchema).optional(),
  errorMessage: z.lazy(() => SortOrderSchema).optional(),
  generatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnalysisMinOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnalysisMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.lazy(() => SortOrderSchema).optional(),
  providerMode: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  rawText: z.lazy(() => SortOrderSchema).optional(),
  errorMessage: z.lazy(() => SortOrderSchema).optional(),
  generatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestStudentAnalysisSumOrderByAggregateInputSchema: z.ZodType<Prisma.TestStudentAnalysisSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  attemptId: z.lazy(() => SortOrderSchema).optional(),
  promptVersionId: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumTestStudentAnalysisProviderModeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestStudentAnalysisProviderModeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => NestedEnumTestStudentAnalysisProviderModeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentAnalysisProviderModeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentAnalysisProviderModeFilterSchema).optional(),
});

export const EnumTestStudentAnalysisStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTestStudentAnalysisStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => NestedEnumTestStudentAnalysisStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentAnalysisStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentAnalysisStatusFilterSchema).optional(),
});

export const AnalysisPromptVersionListRelationFilterSchema: z.ZodType<Prisma.AnalysisPromptVersionListRelationFilter> = z.strictObject({
  every: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
  some: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
  none: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
});

export const AnalysisPromptVersionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptCountOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptAvgOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptMinOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  archivedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptSumOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumAnalysisPromptVersionStatusFilterSchema: z.ZodType<Prisma.EnumAnalysisPromptVersionStatusFilter> = z.strictObject({
  equals: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  in: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => NestedEnumAnalysisPromptVersionStatusFilterSchema) ]).optional(),
});

export const FloatFilterSchema: z.ZodType<Prisma.FloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const AnalysisPromptScalarRelationFilterSchema: z.ZodType<Prisma.AnalysisPromptScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => AnalysisPromptWhereInputSchema).optional(),
  isNot: z.lazy(() => AnalysisPromptWhereInputSchema).optional(),
});

export const TestStudentAnalysisListRelationFilterSchema: z.ZodType<Prisma.TestStudentAnalysisListRelationFilter> = z.strictObject({
  every: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional(),
  some: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional(),
  none: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional(),
});

export const TestStudentAnalysisOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TestStudentAnalysisOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptVersionPromptIdVersionNumberCompoundUniqueInputSchema: z.ZodType<Prisma.AnalysisPromptVersionPromptIdVersionNumberCompoundUniqueInput> = z.strictObject({
  promptId: z.number(),
  versionNumber: z.number(),
});

export const AnalysisPromptVersionCountOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
  prompt: z.lazy(() => SortOrderSchema).optional(),
  outputSchema: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptVersionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionAvgOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptVersionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
  prompt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptVersionMinOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
  prompt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AnalysisPromptVersionSumOrderByAggregateInputSchema: z.ZodType<Prisma.AnalysisPromptVersionSumOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  promptId: z.lazy(() => SortOrderSchema).optional(),
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  temperature: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumAnalysisPromptVersionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumAnalysisPromptVersionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  in: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => NestedEnumAnalysisPromptVersionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumAnalysisPromptVersionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumAnalysisPromptVersionStatusFilterSchema).optional(),
});

export const FloatWithAggregatesFilterSchema: z.ZodType<Prisma.FloatWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional(),
});

export const AppSettingCountOrderByAggregateInputSchema: z.ZodType<Prisma.AppSettingCountOrderByAggregateInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AppSettingMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AppSettingMaxOrderByAggregateInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AppSettingMinOrderByAggregateInputSchema: z.ZodType<Prisma.AppSettingMinOrderByAggregateInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const TestPublicLinkCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkCreateNestedManyWithoutCreatedByUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
});

export const TestPublicLinkUncheckedCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateNestedManyWithoutCreatedByUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => RoleSchema).optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const TestPublicLinkUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyWithoutCreatedByUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const TestPublicLinkUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyWithoutCreatedByUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicVersionCreateNestedManyWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedManyWithoutTopicInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutDraftForTopicInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutDraftForTopicInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
});

export const TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutPublishedForTopicInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutPublishedForTopicInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateNestedManyWithoutTopicInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const TestTopicVersionUpdateManyWithoutTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyWithoutTopicNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicVersionScalarWhereInputSchema), z.lazy(() => TestTopicVersionScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneWithoutDraftForTopicNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutDraftForTopicInputSchema).optional(),
  upsert: z.lazy(() => TestTopicVersionUpsertWithoutDraftForTopicInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateToOneWithWhereWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUpdateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema) ]).optional(),
});

export const TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutPublishedForTopicInputSchema).optional(),
  upsert: z.lazy(() => TestTopicVersionUpsertWithoutPublishedForTopicInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => TestTopicVersionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateToOneWithWhereWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUpdateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema) ]).optional(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutTopicInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyTopicInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicVersionScalarWhereInputSchema), z.lazy(() => TestTopicVersionScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicCreateNestedOneWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicCreateNestedOneWithoutVersionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicCreateOrConnectWithoutVersionsInputSchema).optional(),
  connect: z.lazy(() => TestTopicWhereUniqueInputSchema).optional(),
});

export const TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateNestedManyWithoutActiveDraftVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
});

export const TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateNestedManyWithoutActivePublishedVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
});

export const AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutTestVersionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutTestVersionsInputSchema).optional(),
  connect: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).optional(),
});

export const TestQuestionCreateNestedManyWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedManyWithoutVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkCreateNestedManyWithoutTopicVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyTopicVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateNestedManyWithoutTopicVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyTopicVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
});

export const TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
});

export const TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
});

export const TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateNestedManyWithoutVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyTopicVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyTopicVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestTopicVersionStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestTopicVersionStatusSchema).optional(),
});

export const TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema: z.ZodType<Prisma.TestTopicUpdateOneRequiredWithoutVersionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicCreateOrConnectWithoutVersionsInputSchema).optional(),
  upsert: z.lazy(() => TestTopicUpsertWithoutVersionsInputSchema).optional(),
  connect: z.lazy(() => TestTopicWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestTopicUpdateToOneWithWhereWithoutVersionsInputSchema), z.lazy(() => TestTopicUpdateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutVersionsInputSchema) ]).optional(),
});

export const TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithoutActiveDraftVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicScalarWhereInputSchema), z.lazy(() => TestTopicScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithoutActivePublishedVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicScalarWhereInputSchema), z.lazy(() => TestTopicScalarWhereInputSchema).array() ]).optional(),
});

export const AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutTestVersionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutTestVersionsInputSchema).optional(),
  upsert: z.lazy(() => AnalysisPromptVersionUpsertWithoutTestVersionsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateToOneWithWhereWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUpdateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutTestVersionsInputSchema) ]).optional(),
});

export const TestQuestionUpdateManyWithoutVersionNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateManyWithoutVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema), z.lazy(() => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema), z.lazy(() => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema), z.lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestQuestionScalarWhereInputSchema), z.lazy(() => TestQuestionScalarWhereInputSchema).array() ]).optional(),
});

export const TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyWithoutTopicVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyTopicVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutTopicVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyWithoutTopicVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyTopicVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutTopicVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAttemptScalarWhereInputSchema), z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicScalarWhereInputSchema), z.lazy(() => TestTopicScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema).array(), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicWhereUniqueInputSchema), z.lazy(() => TestTopicWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicScalarWhereInputSchema), z.lazy(() => TestTopicScalarWhereInputSchema).array() ]).optional(),
});

export const TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateManyWithoutVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateWithoutVersionInputSchema).array(), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema), z.lazy(() => TestQuestionCreateOrConnectWithoutVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema), z.lazy(() => TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionCreateManyVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestQuestionWhereUniqueInputSchema), z.lazy(() => TestQuestionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema), z.lazy(() => TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema), z.lazy(() => TestQuestionUpdateManyWithWhereWithoutVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestQuestionScalarWhereInputSchema), z.lazy(() => TestQuestionScalarWhereInputSchema).array() ]).optional(),
});

export const TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyTopicVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutTopicVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyTopicVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutTopicVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutTopicVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAttemptScalarWhereInputSchema), z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutQuestionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutQuestionsInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
});

export const TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateNestedManyWithoutQuestionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateNestedManyWithoutQuestionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAnswerCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateNestedManyWithoutQuestionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyQuestionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
});

export const TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAnswerUncheckedCreateNestedManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedCreateNestedManyWithoutQuestionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyQuestionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumTestQuestionTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestQuestionTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestQuestionTypeSchema).optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutQuestionsInputSchema).optional(),
  upsert: z.lazy(() => TestTopicVersionUpsertWithoutQuestionsInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateToOneWithWhereWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUpdateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema) ]).optional(),
});

export const TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyWithoutQuestionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestQuestionOptionScalarWhereInputSchema), z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array() ]).optional(),
});

export const TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyWithoutQuestionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema), z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAnswerUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyWithoutQuestionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyQuestionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutQuestionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAnswerScalarWhereInputSchema), z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array() ]).optional(),
});

export const TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionOptionCreateManyQuestionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestQuestionOptionWhereUniqueInputSchema), z.lazy(() => TestQuestionOptionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestQuestionOptionScalarWhereInputSchema), z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array() ]).optional(),
});

export const TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema), z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema), z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAnswerUncheckedUpdateManyWithoutQuestionNestedInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateManyWithoutQuestionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyQuestionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutQuestionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutQuestionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAnswerScalarWhereInputSchema), z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array() ]).optional(),
});

export const TestQuestionCreateNestedOneWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedOneWithoutOptionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestQuestionCreateOrConnectWithoutOptionsInputSchema).optional(),
  connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
});

export const TestQuestionUpdateOneRequiredWithoutOptionsNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateOneRequiredWithoutOptionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestQuestionCreateOrConnectWithoutOptionsInputSchema).optional(),
  upsert: z.lazy(() => TestQuestionUpsertWithoutOptionsInputSchema).optional(),
  connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestQuestionUpdateToOneWithWhereWithoutOptionsInputSchema), z.lazy(() => TestQuestionUpdateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutOptionsInputSchema) ]).optional(),
});

export const TestQuestionCreateNestedOneWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedOneWithoutSliderBandsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestQuestionCreateOrConnectWithoutSliderBandsInputSchema).optional(),
  connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
});

export const TestQuestionUpdateOneRequiredWithoutSliderBandsNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateOneRequiredWithoutSliderBandsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestQuestionCreateOrConnectWithoutSliderBandsInputSchema).optional(),
  upsert: z.lazy(() => TestQuestionUpsertWithoutSliderBandsInputSchema).optional(),
  connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestQuestionUpdateToOneWithWhereWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUpdateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema) ]).optional(),
});

export const TestTopicVersionCreateNestedOneWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutPublicLinksInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublicLinksInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutPublicLinksInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
});

export const EducationOrganizationCreateNestedOneWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationCreateNestedOneWithoutPublicLinksInput> = z.strictObject({
  create: z.union([ z.lazy(() => EducationOrganizationCreateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedCreateWithoutPublicLinksInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EducationOrganizationCreateOrConnectWithoutPublicLinksInputSchema).optional(),
  connect: z.lazy(() => EducationOrganizationWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCreatedPublicTestLinksInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedCreateWithoutCreatedPublicTestLinksInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedPublicTestLinksInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const TestStudentAttemptCreateNestedManyWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateNestedManyWithoutPublicLinkInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyPublicLinkInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAttemptUncheckedCreateNestedManyWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateNestedManyWithoutPublicLinkInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyPublicLinkInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumTestEntryProfileModeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestEntryProfileModeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestEntryProfileModeSchema).optional(),
});

export const TestTopicVersionUpdateOneRequiredWithoutPublicLinksNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneRequiredWithoutPublicLinksNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublicLinksInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutPublicLinksInputSchema).optional(),
  upsert: z.lazy(() => TestTopicVersionUpsertWithoutPublicLinksInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateToOneWithWhereWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUpdateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutPublicLinksInputSchema) ]).optional(),
});

export const EducationOrganizationUpdateOneWithoutPublicLinksNestedInputSchema: z.ZodType<Prisma.EducationOrganizationUpdateOneWithoutPublicLinksNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => EducationOrganizationCreateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedCreateWithoutPublicLinksInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => EducationOrganizationCreateOrConnectWithoutPublicLinksInputSchema).optional(),
  upsert: z.lazy(() => EducationOrganizationUpsertWithoutPublicLinksInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => EducationOrganizationWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => EducationOrganizationWhereInputSchema) ]).optional(),
  connect: z.lazy(() => EducationOrganizationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => EducationOrganizationUpdateToOneWithWhereWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUpdateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedUpdateWithoutPublicLinksInputSchema) ]).optional(),
});

export const UserUpdateOneWithoutCreatedPublicTestLinksNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutCreatedPublicTestLinksNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedCreateWithoutCreatedPublicTestLinksInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedPublicTestLinksInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCreatedPublicTestLinksInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUpdateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedUpdateWithoutCreatedPublicTestLinksInputSchema) ]).optional(),
});

export const TestStudentAttemptUpdateManyWithoutPublicLinkNestedInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyWithoutPublicLinkNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutPublicLinkInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyPublicLinkInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutPublicLinkInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutPublicLinkInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAttemptScalarWhereInputSchema), z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkNestedInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema).array(), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUpsertWithWhereUniqueWithoutPublicLinkInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAttemptCreateManyPublicLinkInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAttemptWhereUniqueInputSchema), z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUpdateWithWhereUniqueWithoutPublicLinkInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUpdateManyWithWhereWithoutPublicLinkInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAttemptScalarWhereInputSchema), z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array() ]).optional(),
});

export const TestPublicLinkCreateNestedManyWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkCreateNestedManyWithoutEducationOrganizationInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyEducationOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
});

export const TestPublicLinkUncheckedCreateNestedManyWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateNestedManyWithoutEducationOrganizationInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyEducationOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumGroupOrClassValidationModeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
});

export const TestPublicLinkUpdateManyWithoutEducationOrganizationNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyWithoutEducationOrganizationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutEducationOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyEducationOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutEducationOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutEducationOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
});

export const TestPublicLinkUncheckedUpdateManyWithoutEducationOrganizationNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyWithoutEducationOrganizationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema).array(), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUpsertWithWhereUniqueWithoutEducationOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestPublicLinkCreateManyEducationOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestPublicLinkWhereUniqueInputSchema), z.lazy(() => TestPublicLinkWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUpdateWithWhereUniqueWithoutEducationOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUpdateManyWithWhereWithoutEducationOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
});

export const TestPublicLinkCreateNestedOneWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkCreateNestedOneWithoutAttemptsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutAttemptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestPublicLinkCreateOrConnectWithoutAttemptsInputSchema).optional(),
  connect: z.lazy(() => TestPublicLinkWhereUniqueInputSchema).optional(),
});

export const TestTopicVersionCreateNestedOneWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedOneWithoutStudentAttemptsInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutStudentAttemptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutStudentAttemptsInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
});

export const TestStudentAnswerCreateNestedManyWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateNestedManyWithoutAttemptInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyAttemptInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisCreateNestedOneWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateNestedOneWithoutAttemptInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutAttemptInputSchema).optional(),
  connect: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).optional(),
});

export const TestStudentAnswerUncheckedCreateNestedManyWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedCreateNestedManyWithoutAttemptInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyAttemptInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisUncheckedCreateNestedOneWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedCreateNestedOneWithoutAttemptInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutAttemptInputSchema).optional(),
  connect: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).optional(),
});

export const EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestStudentAttemptStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
});

export const NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumTestStudentGenderFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
});

export const NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumTestStudentEducationLevelFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
});

export const TestPublicLinkUpdateOneRequiredWithoutAttemptsNestedInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateOneRequiredWithoutAttemptsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutAttemptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestPublicLinkCreateOrConnectWithoutAttemptsInputSchema).optional(),
  upsert: z.lazy(() => TestPublicLinkUpsertWithoutAttemptsInputSchema).optional(),
  connect: z.lazy(() => TestPublicLinkWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateToOneWithWhereWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUpdateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutAttemptsInputSchema) ]).optional(),
});

export const TestTopicVersionUpdateOneRequiredWithoutStudentAttemptsNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateOneRequiredWithoutStudentAttemptsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutStudentAttemptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestTopicVersionCreateOrConnectWithoutStudentAttemptsInputSchema).optional(),
  upsert: z.lazy(() => TestTopicVersionUpsertWithoutStudentAttemptsInputSchema).optional(),
  connect: z.lazy(() => TestTopicVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateToOneWithWhereWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUpdateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutStudentAttemptsInputSchema) ]).optional(),
});

export const TestStudentAnswerUpdateManyWithoutAttemptNestedInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyWithoutAttemptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutAttemptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyAttemptInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutAttemptInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutAttemptInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAnswerScalarWhereInputSchema), z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisUpdateOneWithoutAttemptNestedInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateOneWithoutAttemptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutAttemptInputSchema).optional(),
  upsert: z.lazy(() => TestStudentAnalysisUpsertWithoutAttemptInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => TestStudentAnalysisWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => TestStudentAnalysisWhereInputSchema) ]).optional(),
  connect: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestStudentAnalysisUpdateToOneWithWhereWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUpdateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateWithoutAttemptInputSchema) ]).optional(),
});

export const TestStudentAnswerUncheckedUpdateManyWithoutAttemptNestedInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateManyWithoutAttemptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema).array(), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUpsertWithWhereUniqueWithoutAttemptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnswerCreateManyAttemptInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnswerWhereUniqueInputSchema), z.lazy(() => TestStudentAnswerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUpdateWithWhereUniqueWithoutAttemptInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUpdateManyWithWhereWithoutAttemptInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAnswerScalarWhereInputSchema), z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisUncheckedUpdateOneWithoutAttemptNestedInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateOneWithoutAttemptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutAttemptInputSchema).optional(),
  upsert: z.lazy(() => TestStudentAnalysisUpsertWithoutAttemptInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => TestStudentAnalysisWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => TestStudentAnalysisWhereInputSchema) ]).optional(),
  connect: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestStudentAnalysisUpdateToOneWithWhereWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUpdateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateWithoutAttemptInputSchema) ]).optional(),
});

export const TestStudentAttemptCreateNestedOneWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateNestedOneWithoutAnswersInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnswersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAttemptCreateOrConnectWithoutAnswersInputSchema).optional(),
  connect: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).optional(),
});

export const TestQuestionCreateNestedOneWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionCreateNestedOneWithoutStudentAnswersInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutStudentAnswersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestQuestionCreateOrConnectWithoutStudentAnswersInputSchema).optional(),
  connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
});

export const TestStudentAttemptUpdateOneRequiredWithoutAnswersNestedInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateOneRequiredWithoutAnswersNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnswersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAttemptCreateOrConnectWithoutAnswersInputSchema).optional(),
  upsert: z.lazy(() => TestStudentAttemptUpsertWithoutAnswersInputSchema).optional(),
  connect: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateToOneWithWhereWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUpdateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutAnswersInputSchema) ]).optional(),
});

export const TestQuestionUpdateOneRequiredWithoutStudentAnswersNestedInputSchema: z.ZodType<Prisma.TestQuestionUpdateOneRequiredWithoutStudentAnswersNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutStudentAnswersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestQuestionCreateOrConnectWithoutStudentAnswersInputSchema).optional(),
  upsert: z.lazy(() => TestQuestionUpsertWithoutStudentAnswersInputSchema).optional(),
  connect: z.lazy(() => TestQuestionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestQuestionUpdateToOneWithWhereWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUpdateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutStudentAnswersInputSchema) ]).optional(),
});

export const TestStudentAttemptCreateNestedOneWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateNestedOneWithoutAnalysisInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnalysisInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAttemptCreateOrConnectWithoutAnalysisInputSchema).optional(),
  connect: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).optional(),
});

export const AnalysisPromptVersionCreateNestedOneWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateNestedOneWithoutStudentAnalysesInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutStudentAnalysesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutStudentAnalysesInputSchema).optional(),
  connect: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).optional(),
});

export const EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
});

export const EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTestStudentAnalysisStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
});

export const TestStudentAttemptUpdateOneRequiredWithoutAnalysisNestedInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateOneRequiredWithoutAnalysisNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnalysisInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => TestStudentAttemptCreateOrConnectWithoutAnalysisInputSchema).optional(),
  upsert: z.lazy(() => TestStudentAttemptUpsertWithoutAnalysisInputSchema).optional(),
  connect: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateToOneWithWhereWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUpdateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutAnalysisInputSchema) ]).optional(),
});

export const AnalysisPromptVersionUpdateOneWithoutStudentAnalysesNestedInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateOneWithoutStudentAnalysesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutStudentAnalysesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutStudentAnalysesInputSchema).optional(),
  upsert: z.lazy(() => AnalysisPromptVersionUpsertWithoutStudentAnalysesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => AnalysisPromptVersionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateToOneWithWhereWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUpdateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutStudentAnalysesInputSchema) ]).optional(),
});

export const AnalysisPromptVersionCreateNestedManyWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateNestedManyWithoutAnalysisPromptInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema).array(), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AnalysisPromptVersionCreateManyAnalysisPromptInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
});

export const AnalysisPromptVersionUncheckedCreateNestedManyWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedCreateNestedManyWithoutAnalysisPromptInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema).array(), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AnalysisPromptVersionCreateManyAnalysisPromptInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
});

export const AnalysisPromptVersionUpdateManyWithoutAnalysisPromptNestedInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateManyWithoutAnalysisPromptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema).array(), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AnalysisPromptVersionUpsertWithWhereUniqueWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUpsertWithWhereUniqueWithoutAnalysisPromptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AnalysisPromptVersionCreateManyAnalysisPromptInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithWhereUniqueWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUpdateWithWhereUniqueWithoutAnalysisPromptInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AnalysisPromptVersionUpdateManyWithWhereWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUpdateManyWithWhereWithoutAnalysisPromptInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema), z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema).array() ]).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateManyWithoutAnalysisPromptNestedInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateManyWithoutAnalysisPromptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema).array(), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AnalysisPromptVersionUpsertWithWhereUniqueWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUpsertWithWhereUniqueWithoutAnalysisPromptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AnalysisPromptVersionCreateManyAnalysisPromptInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema), z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithWhereUniqueWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUpdateWithWhereUniqueWithoutAnalysisPromptInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AnalysisPromptVersionUpdateManyWithWhereWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUpdateManyWithWhereWithoutAnalysisPromptInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema), z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema).array() ]).optional(),
});

export const AnalysisPromptCreateNestedOneWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptCreateNestedOneWithoutVersionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptCreateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedCreateWithoutVersionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => AnalysisPromptCreateOrConnectWithoutVersionsInputSchema).optional(),
  connect: z.lazy(() => AnalysisPromptWhereUniqueInputSchema).optional(),
});

export const TestTopicVersionCreateNestedManyWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionCreateNestedManyWithoutAnalysisPromptVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyAnalysisPromptVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisCreateNestedManyWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateNestedManyWithoutPromptVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema).array(), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnalysisCreateManyPromptVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
});

export const TestTopicVersionUncheckedCreateNestedManyWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateNestedManyWithoutAnalysisPromptVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyAnalysisPromptVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisUncheckedCreateNestedManyWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedCreateNestedManyWithoutPromptVersionInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema).array(), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnalysisCreateManyPromptVersionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumAnalysisPromptVersionStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
});

export const FloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.FloatFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const AnalysisPromptUpdateOneRequiredWithoutVersionsNestedInputSchema: z.ZodType<Prisma.AnalysisPromptUpdateOneRequiredWithoutVersionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AnalysisPromptCreateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedCreateWithoutVersionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => AnalysisPromptCreateOrConnectWithoutVersionsInputSchema).optional(),
  upsert: z.lazy(() => AnalysisPromptUpsertWithoutVersionsInputSchema).optional(),
  connect: z.lazy(() => AnalysisPromptWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => AnalysisPromptUpdateToOneWithWhereWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUpdateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedUpdateWithoutVersionsInputSchema) ]).optional(),
});

export const TestTopicVersionUpdateManyWithoutAnalysisPromptVersionNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyWithoutAnalysisPromptVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyAnalysisPromptVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicVersionScalarWhereInputSchema), z.lazy(() => TestTopicVersionScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisUpdateManyWithoutPromptVersionNestedInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateManyWithoutPromptVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema).array(), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAnalysisUpsertWithWhereUniqueWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUpsertWithWhereUniqueWithoutPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnalysisCreateManyPromptVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAnalysisUpdateWithWhereUniqueWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUpdateWithWhereUniqueWithoutPromptVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAnalysisUpdateManyWithWhereWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUpdateManyWithWhereWithoutPromptVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAnalysisScalarWhereInputSchema), z.lazy(() => TestStudentAnalysisScalarWhereInputSchema).array() ]).optional(),
});

export const TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionNestedInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema).array(), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUpsertWithWhereUniqueWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestTopicVersionCreateManyAnalysisPromptVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestTopicVersionWhereUniqueInputSchema), z.lazy(() => TestTopicVersionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUpdateWithWhereUniqueWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUpdateManyWithWhereWithoutAnalysisPromptVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestTopicVersionScalarWhereInputSchema), z.lazy(() => TestTopicVersionScalarWhereInputSchema).array() ]).optional(),
});

export const TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionNestedInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema).array(), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TestStudentAnalysisUpsertWithWhereUniqueWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUpsertWithWhereUniqueWithoutPromptVersionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TestStudentAnalysisCreateManyPromptVersionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema), z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TestStudentAnalysisUpdateWithWhereUniqueWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUpdateWithWhereUniqueWithoutPromptVersionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TestStudentAnalysisUpdateManyWithWhereWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUpdateManyWithWhereWithoutPromptVersionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TestStudentAnalysisScalarWhereInputSchema), z.lazy(() => TestStudentAnalysisScalarWhereInputSchema).array() ]).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
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
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumTestTopicVersionStatusFilterSchema: z.ZodType<Prisma.NestedEnumTestTopicVersionStatusFilter> = z.strictObject({
  equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  in: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema) ]).optional(),
});

export const NestedEnumTestTopicVersionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestTopicVersionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  in: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => TestTopicVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => NestedEnumTestTopicVersionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestTopicVersionStatusFilterSchema).optional(),
});

export const NestedEnumTestQuestionTypeFilterSchema: z.ZodType<Prisma.NestedEnumTestQuestionTypeFilter> = z.strictObject({
  equals: z.lazy(() => TestQuestionTypeSchema).optional(),
  in: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  notIn: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => NestedEnumTestQuestionTypeFilterSchema) ]).optional(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedEnumTestQuestionTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestQuestionTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestQuestionTypeSchema).optional(),
  in: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  notIn: z.lazy(() => TestQuestionTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => NestedEnumTestQuestionTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestQuestionTypeFilterSchema).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
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

export const NestedEnumTestEntryProfileModeFilterSchema: z.ZodType<Prisma.NestedEnumTestEntryProfileModeFilter> = z.strictObject({
  equals: z.lazy(() => TestEntryProfileModeSchema).optional(),
  in: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  notIn: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => NestedEnumTestEntryProfileModeFilterSchema) ]).optional(),
});

export const NestedEnumTestEntryProfileModeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestEntryProfileModeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestEntryProfileModeSchema).optional(),
  in: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  notIn: z.lazy(() => TestEntryProfileModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => NestedEnumTestEntryProfileModeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestEntryProfileModeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestEntryProfileModeFilterSchema).optional(),
});

export const NestedEnumGroupOrClassValidationModeFilterSchema: z.ZodType<Prisma.NestedEnumGroupOrClassValidationModeFilter> = z.strictObject({
  equals: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  in: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  notIn: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  not: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => NestedEnumGroupOrClassValidationModeFilterSchema) ]).optional(),
});

export const NestedEnumGroupOrClassValidationModeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumGroupOrClassValidationModeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  in: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  notIn: z.lazy(() => GroupOrClassValidationModeSchema).array().optional(),
  not: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => NestedEnumGroupOrClassValidationModeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumGroupOrClassValidationModeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumGroupOrClassValidationModeFilterSchema).optional(),
});

export const NestedEnumTestStudentAttemptStatusFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentAttemptStatusFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  in: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => NestedEnumTestStudentAttemptStatusFilterSchema) ]).optional(),
});

export const NestedEnumTestStudentGenderNullableFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentGenderNullableFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  in: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NestedEnumTestStudentGenderNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumTestStudentEducationLevelNullableFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentEducationLevelNullableFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  in: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NestedEnumTestStudentEducationLevelNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumTestStudentAttemptStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentAttemptStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  in: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAttemptStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => NestedEnumTestStudentAttemptStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentAttemptStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentAttemptStatusFilterSchema).optional(),
});

export const NestedEnumTestStudentGenderNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentGenderNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  in: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentGenderSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NestedEnumTestStudentGenderNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentGenderNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentGenderNullableFilterSchema).optional(),
});

export const NestedEnumTestStudentEducationLevelNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentEducationLevelNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  in: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  notIn: z.lazy(() => TestStudentEducationLevelSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NestedEnumTestStudentEducationLevelNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentEducationLevelNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentEducationLevelNullableFilterSchema).optional(),
});

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.strictObject({
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

export const NestedEnumTestStudentAnalysisProviderModeFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentAnalysisProviderModeFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => NestedEnumTestStudentAnalysisProviderModeFilterSchema) ]).optional(),
});

export const NestedEnumTestStudentAnalysisStatusFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentAnalysisStatusFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => NestedEnumTestStudentAnalysisStatusFilterSchema) ]).optional(),
});

export const NestedEnumTestStudentAnalysisProviderModeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentAnalysisProviderModeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisProviderModeSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => NestedEnumTestStudentAnalysisProviderModeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentAnalysisProviderModeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentAnalysisProviderModeFilterSchema).optional(),
});

export const NestedEnumTestStudentAnalysisStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTestStudentAnalysisStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  in: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  notIn: z.lazy(() => TestStudentAnalysisStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => NestedEnumTestStudentAnalysisStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumTestStudentAnalysisStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumTestStudentAnalysisStatusFilterSchema).optional(),
});

export const NestedEnumAnalysisPromptVersionStatusFilterSchema: z.ZodType<Prisma.NestedEnumAnalysisPromptVersionStatusFilter> = z.strictObject({
  equals: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  in: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => NestedEnumAnalysisPromptVersionStatusFilterSchema) ]).optional(),
});

export const NestedEnumAnalysisPromptVersionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumAnalysisPromptVersionStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  in: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  notIn: z.lazy(() => AnalysisPromptVersionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => NestedEnumAnalysisPromptVersionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumAnalysisPromptVersionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumAnalysisPromptVersionStatusFilterSchema).optional(),
});

export const NestedFloatWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional(),
});

export const TestPublicLinkCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkCreateWithoutCreatedByUserInput> = z.strictObject({
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublicLinksInputSchema),
  educationOrganization: z.lazy(() => EducationOrganizationCreateNestedOneWithoutPublicLinksInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateWithoutCreatedByUserInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkCreateOrConnectWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkCreateOrConnectWithoutCreatedByUserInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema) ]),
});

export const TestPublicLinkCreateManyCreatedByUserInputEnvelopeSchema: z.ZodType<Prisma.TestPublicLinkCreateManyCreatedByUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestPublicLinkCreateManyCreatedByUserInputSchema), z.lazy(() => TestPublicLinkCreateManyCreatedByUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestPublicLinkUpsertWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUpsertWithWhereUniqueWithoutCreatedByUserInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutCreatedByUserInputSchema) ]),
});

export const TestPublicLinkUpdateWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithWhereUniqueWithoutCreatedByUserInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutCreatedByUserInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
});

export const TestPublicLinkUpdateManyWithWhereWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyWithWhereWithoutCreatedByUserInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateManyMutationInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutCreatedByUserInputSchema) ]),
});

export const TestPublicLinkScalarWhereInputSchema: z.ZodType<Prisma.TestPublicLinkScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestPublicLinkScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestPublicLinkScalarWhereInputSchema), z.lazy(() => TestPublicLinkScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  educationOrganizationId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  shortCode: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  startsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  timeLimitMinutes: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  allowResume: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => EnumTestEntryProfileModeFilterSchema), z.lazy(() => TestEntryProfileModeSchema) ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const TestTopicVersionCreateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutTopicInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutTopicInput> = z.strictObject({
  id: z.number().int().optional(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema) ]),
});

export const TestTopicVersionCreateManyTopicInputEnvelopeSchema: z.ZodType<Prisma.TestTopicVersionCreateManyTopicInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestTopicVersionCreateManyTopicInputSchema), z.lazy(() => TestTopicVersionCreateManyTopicInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestTopicVersionCreateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutDraftForTopicInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutDraftForTopicInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutDraftForTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema) ]),
});

export const TestTopicVersionCreateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutPublishedForTopicInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutPublishedForTopicInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutPublishedForTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema) ]),
});

export const TestTopicVersionUpsertWithWhereUniqueWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithWhereUniqueWithoutTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutTopicInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutTopicInputSchema) ]),
});

export const TestTopicVersionUpdateWithWhereUniqueWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithWhereUniqueWithoutTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutTopicInputSchema) ]),
});

export const TestTopicVersionUpdateManyWithWhereWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyWithWhereWithoutTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateManyMutationInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutTopicInputSchema) ]),
});

export const TestTopicVersionScalarWhereInputSchema: z.ZodType<Prisma.TestTopicVersionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestTopicVersionScalarWhereInputSchema), z.lazy(() => TestTopicVersionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicVersionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicVersionScalarWhereInputSchema), z.lazy(() => TestTopicVersionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  topicId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestTopicVersionStatusFilterSchema), z.lazy(() => TestTopicVersionStatusSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const TestTopicVersionUpsertWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutDraftForTopicInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutDraftForTopicInputSchema) ]),
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestTopicVersionUpdateToOneWithWhereWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutDraftForTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutDraftForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema) ]),
});

export const TestTopicVersionUpdateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutDraftForTopicInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutDraftForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutDraftForTopicInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUpsertWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutPublishedForTopicInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublishedForTopicInputSchema) ]),
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestTopicVersionUpdateToOneWithWhereWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutPublishedForTopicInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutPublishedForTopicInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema) ]),
});

export const TestTopicVersionUpdateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutPublishedForTopicInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutPublishedForTopicInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicCreateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicCreateWithoutVersionsInput> = z.strictObject({
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activeDraftVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema).optional(),
});

export const TestTopicUncheckedCreateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateWithoutVersionsInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activeDraftVersionId: z.number().int().optional().nullable(),
  activePublishedVersionId: z.number().int().optional().nullable(),
});

export const TestTopicCreateOrConnectWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicCreateOrConnectWithoutVersionsInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicCreateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema) ]),
});

export const TestTopicCreateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateWithoutActiveDraftVersionInput> = z.strictObject({
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  versions: z.lazy(() => TestTopicVersionCreateNestedManyWithoutTopicInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublishedForTopicInputSchema).optional(),
});

export const TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateWithoutActiveDraftVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activePublishedVersionId: z.number().int().optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema).optional(),
});

export const TestTopicCreateOrConnectWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateOrConnectWithoutActiveDraftVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema) ]),
});

export const TestTopicCreateManyActiveDraftVersionInputEnvelopeSchema: z.ZodType<Prisma.TestTopicCreateManyActiveDraftVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestTopicCreateManyActiveDraftVersionInputSchema), z.lazy(() => TestTopicCreateManyActiveDraftVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestTopicCreateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateWithoutActivePublishedVersionInput> = z.strictObject({
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  versions: z.lazy(() => TestTopicVersionCreateNestedManyWithoutTopicInputSchema).optional(),
  activeDraftVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutDraftForTopicInputSchema).optional(),
});

export const TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedCreateWithoutActivePublishedVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activeDraftVersionId: z.number().int().optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUncheckedCreateNestedManyWithoutTopicInputSchema).optional(),
});

export const TestTopicCreateOrConnectWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateOrConnectWithoutActivePublishedVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema) ]),
});

export const TestTopicCreateManyActivePublishedVersionInputEnvelopeSchema: z.ZodType<Prisma.TestTopicCreateManyActivePublishedVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestTopicCreateManyActivePublishedVersionInputSchema), z.lazy(() => TestTopicCreateManyActivePublishedVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AnalysisPromptVersionCreateWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateWithoutTestVersionsInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptCreateNestedOneWithoutVersionsInputSchema),
  studentAnalyses: z.lazy(() => TestStudentAnalysisCreateNestedManyWithoutPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedCreateWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedCreateWithoutTestVersionsInput> = z.strictObject({
  id: z.number().int().optional(),
  promptId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedManyWithoutPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionCreateOrConnectWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateOrConnectWithoutTestVersionsInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutTestVersionsInputSchema) ]),
});

export const TestQuestionCreateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutVersionInput> = z.strictObject({
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  options: z.lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionUncheckedCreateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionCreateOrConnectWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutVersionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema) ]),
});

export const TestQuestionCreateManyVersionInputEnvelopeSchema: z.ZodType<Prisma.TestQuestionCreateManyVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestQuestionCreateManyVersionInputSchema), z.lazy(() => TestQuestionCreateManyVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestPublicLinkCreateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkCreateWithoutTopicVersionInput> = z.strictObject({
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  educationOrganization: z.lazy(() => EducationOrganizationCreateNestedOneWithoutPublicLinksInputSchema).optional(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedPublicTestLinksInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateWithoutTopicVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkCreateOrConnectWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkCreateOrConnectWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema) ]),
});

export const TestPublicLinkCreateManyTopicVersionInputEnvelopeSchema: z.ZodType<Prisma.TestPublicLinkCreateManyTopicVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestPublicLinkCreateManyTopicVersionInputSchema), z.lazy(() => TestPublicLinkCreateManyTopicVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestStudentAttemptCreateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateWithoutTopicVersionInput> = z.strictObject({
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publicLink: z.lazy(() => TestPublicLinkCreateNestedOneWithoutAttemptsInputSchema),
  answers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutAttemptInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateWithoutTopicVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  publicLinkId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutAttemptInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptCreateOrConnectWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateOrConnectWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema) ]),
});

export const TestStudentAttemptCreateManyTopicVersionInputEnvelopeSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyTopicVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestStudentAttemptCreateManyTopicVersionInputSchema), z.lazy(() => TestStudentAttemptCreateManyTopicVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestTopicUpsertWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUpsertWithoutVersionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestTopicUpdateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutVersionsInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicCreateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutVersionsInputSchema) ]),
  where: z.lazy(() => TestTopicWhereInputSchema).optional(),
});

export const TestTopicUpdateToOneWithWhereWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUpdateToOneWithWhereWithoutVersionsInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestTopicUpdateWithoutVersionsInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutVersionsInputSchema) ]),
});

export const TestTopicUpdateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUpdateWithoutVersionsInput> = z.strictObject({
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activeDraftVersion: z.lazy(() => TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema).optional(),
});

export const TestTopicUncheckedUpdateWithoutVersionsInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateWithoutVersionsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpsertWithWhereUniqueWithoutActiveDraftVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestTopicUpdateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutActiveDraftVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActiveDraftVersionInputSchema) ]),
});

export const TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithWhereUniqueWithoutActiveDraftVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestTopicUpdateWithoutActiveDraftVersionInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutActiveDraftVersionInputSchema) ]),
});

export const TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithWhereWithoutActiveDraftVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestTopicUpdateManyMutationInputSchema), z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionInputSchema) ]),
});

export const TestTopicScalarWhereInputSchema: z.ZodType<Prisma.TestTopicScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestTopicScalarWhereInputSchema), z.lazy(() => TestTopicScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestTopicScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestTopicScalarWhereInputSchema), z.lazy(() => TestTopicScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  slug: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  archivedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
});

export const TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpsertWithWhereUniqueWithoutActivePublishedVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestTopicUpdateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutActivePublishedVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicCreateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedCreateWithoutActivePublishedVersionInputSchema) ]),
});

export const TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithWhereUniqueWithoutActivePublishedVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestTopicUpdateWithoutActivePublishedVersionInputSchema), z.lazy(() => TestTopicUncheckedUpdateWithoutActivePublishedVersionInputSchema) ]),
});

export const TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateManyWithWhereWithoutActivePublishedVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestTopicUpdateManyMutationInputSchema), z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionInputSchema) ]),
});

export const AnalysisPromptVersionUpsertWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpsertWithoutTestVersionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutTestVersionsInputSchema) ]),
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutTestVersionsInputSchema) ]),
  where: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
});

export const AnalysisPromptVersionUpdateToOneWithWhereWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateToOneWithWhereWithoutTestVersionsInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithoutTestVersionsInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutTestVersionsInputSchema) ]),
});

export const AnalysisPromptVersionUpdateWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateWithoutTestVersionsInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUpdateManyWithoutPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateWithoutTestVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateWithoutTestVersionsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionNestedInputSchema).optional(),
});

export const TestQuestionUpsertWithWhereUniqueWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithWhereUniqueWithoutVersionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestQuestionUpdateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutVersionInputSchema) ]),
});

export const TestQuestionUpdateWithWhereUniqueWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithWhereUniqueWithoutVersionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestQuestionUpdateWithoutVersionInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutVersionInputSchema) ]),
});

export const TestQuestionUpdateManyWithWhereWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpdateManyWithWhereWithoutVersionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestQuestionUpdateManyMutationInputSchema), z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionInputSchema) ]),
});

export const TestQuestionScalarWhereInputSchema: z.ZodType<Prisma.TestQuestionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionScalarWhereInputSchema), z.lazy(() => TestQuestionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionScalarWhereInputSchema), z.lazy(() => TestQuestionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  versionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  type: z.union([ z.lazy(() => EnumTestQuestionTypeFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  required: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  settings: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const TestPublicLinkUpsertWithWhereUniqueWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUpsertWithWhereUniqueWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutTopicVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutTopicVersionInputSchema) ]),
});

export const TestPublicLinkUpdateWithWhereUniqueWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithWhereUniqueWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutTopicVersionInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutTopicVersionInputSchema) ]),
});

export const TestPublicLinkUpdateManyWithWhereWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyWithWhereWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateManyMutationInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionInputSchema) ]),
});

export const TestStudentAttemptUpsertWithWhereUniqueWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUpsertWithWhereUniqueWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutTopicVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutTopicVersionInputSchema) ]),
});

export const TestStudentAttemptUpdateWithWhereUniqueWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateWithWhereUniqueWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutTopicVersionInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutTopicVersionInputSchema) ]),
});

export const TestStudentAttemptUpdateManyWithWhereWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyWithWhereWithoutTopicVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestStudentAttemptUpdateManyMutationInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionInputSchema) ]),
});

export const TestStudentAttemptScalarWhereInputSchema: z.ZodType<Prisma.TestStudentAttemptScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAttemptScalarWhereInputSchema), z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAttemptScalarWhereInputSchema), z.lazy(() => TestStudentAttemptScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  publicLinkId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  topicVersionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  attemptNumber: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAttemptStatusFilterSchema), z.lazy(() => TestStudentAttemptStatusSchema) ]).optional(),
  studentName: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentLastInitial: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  educationOrganization: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  groupOrClass: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => EnumTestStudentGenderNullableFilterSchema), z.lazy(() => TestStudentGenderSchema) ]).optional().nullable(),
  studentAge: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  studentResidence: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => EnumTestStudentEducationLevelNullableFilterSchema), z.lazy(() => TestStudentEducationLevelSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentAcceptedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  consentVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  consentTextSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  resumeToken: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  startedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  finishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  anonymizedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const TestTopicVersionCreateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutQuestionsInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutQuestionsInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutQuestionsInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema) ]),
});

export const TestQuestionOptionCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateWithoutQuestionInput> = z.strictObject({
  label: z.string(),
  value: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedCreateWithoutQuestionInput> = z.strictObject({
  id: z.number().int().optional(),
  label: z.string(),
  value: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionOptionCreateOrConnectWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateOrConnectWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema) ]),
});

export const TestQuestionOptionCreateManyQuestionInputEnvelopeSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyQuestionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestQuestionOptionCreateManyQuestionInputSchema), z.lazy(() => TestQuestionOptionCreateManyQuestionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestQuestionSliderBandCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateWithoutQuestionInput> = z.strictObject({
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
});

export const TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedCreateWithoutQuestionInput> = z.strictObject({
  id: z.number().int().optional(),
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
});

export const TestQuestionSliderBandCreateOrConnectWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateOrConnectWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema) ]),
});

export const TestQuestionSliderBandCreateManyQuestionInputEnvelopeSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyQuestionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputSchema), z.lazy(() => TestQuestionSliderBandCreateManyQuestionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestStudentAnswerCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateWithoutQuestionInput> = z.strictObject({
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  attempt: z.lazy(() => TestStudentAttemptCreateNestedOneWithoutAnswersInputSchema),
});

export const TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedCreateWithoutQuestionInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnswerCreateOrConnectWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateOrConnectWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema) ]),
});

export const TestStudentAnswerCreateManyQuestionInputEnvelopeSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyQuestionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestStudentAnswerCreateManyQuestionInputSchema), z.lazy(() => TestStudentAnswerCreateManyQuestionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestTopicVersionUpsertWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutQuestionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutQuestionsInputSchema) ]),
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestTopicVersionUpdateToOneWithWhereWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutQuestionsInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutQuestionsInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema) ]),
});

export const TestTopicVersionUpdateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutQuestionsInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutQuestionsInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutQuestionsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpsertWithWhereUniqueWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestQuestionOptionUpdateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedUpdateWithoutQuestionInputSchema) ]),
  create: z.union([ z.lazy(() => TestQuestionOptionCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedCreateWithoutQuestionInputSchema) ]),
});

export const TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateWithWhereUniqueWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionOptionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestQuestionOptionUpdateWithoutQuestionInputSchema), z.lazy(() => TestQuestionOptionUncheckedUpdateWithoutQuestionInputSchema) ]),
});

export const TestQuestionOptionUpdateManyWithWhereWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyWithWhereWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionOptionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestQuestionOptionUpdateManyMutationInputSchema), z.lazy(() => TestQuestionOptionUncheckedUpdateManyWithoutQuestionInputSchema) ]),
});

export const TestQuestionOptionScalarWhereInputSchema: z.ZodType<Prisma.TestQuestionOptionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionOptionScalarWhereInputSchema), z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionOptionScalarWhereInputSchema), z.lazy(() => TestQuestionOptionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpsertWithWhereUniqueWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestQuestionSliderBandUpdateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedUpdateWithoutQuestionInputSchema) ]),
  create: z.union([ z.lazy(() => TestQuestionSliderBandCreateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedCreateWithoutQuestionInputSchema) ]),
});

export const TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateWithWhereUniqueWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionSliderBandWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestQuestionSliderBandUpdateWithoutQuestionInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedUpdateWithoutQuestionInputSchema) ]),
});

export const TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyWithWhereWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestQuestionSliderBandUpdateManyMutationInputSchema), z.lazy(() => TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionInputSchema) ]),
});

export const TestQuestionSliderBandScalarWhereInputSchema: z.ZodType<Prisma.TestQuestionSliderBandScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema), z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema), z.lazy(() => TestQuestionSliderBandScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  minValue: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  maxValue: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  weight: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
});

export const TestStudentAnswerUpsertWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUpsertWithWhereUniqueWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestStudentAnswerUpdateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedUpdateWithoutQuestionInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutQuestionInputSchema) ]),
});

export const TestStudentAnswerUpdateWithWhereUniqueWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateWithWhereUniqueWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestStudentAnswerUpdateWithoutQuestionInputSchema), z.lazy(() => TestStudentAnswerUncheckedUpdateWithoutQuestionInputSchema) ]),
});

export const TestStudentAnswerUpdateManyWithWhereWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyWithWhereWithoutQuestionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestStudentAnswerUpdateManyMutationInputSchema), z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutQuestionInputSchema) ]),
});

export const TestStudentAnswerScalarWhereInputSchema: z.ZodType<Prisma.TestStudentAnswerScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAnswerScalarWhereInputSchema), z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnswerScalarWhereInputSchema), z.lazy(() => TestStudentAnswerScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => EnumTestQuestionTypeFilterSchema), z.lazy(() => TestQuestionTypeSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  answerPayload: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const TestQuestionCreateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutOptionsInput> = z.strictObject({
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  version: z.lazy(() => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema),
  sliderBands: z.lazy(() => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionUncheckedCreateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutOptionsInput> = z.strictObject({
  id: z.number().int().optional(),
  versionId: z.number().int(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionCreateOrConnectWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutOptionsInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema) ]),
});

export const TestQuestionUpsertWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithoutOptionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestQuestionUpdateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutOptionsInputSchema) ]),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutOptionsInputSchema) ]),
  where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
});

export const TestQuestionUpdateToOneWithWhereWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUpdateToOneWithWhereWithoutOptionsInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestQuestionUpdateWithoutOptionsInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutOptionsInputSchema) ]),
});

export const TestQuestionUpdateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutOptionsInput> = z.strictObject({
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  version: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionUncheckedUpdateWithoutOptionsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutOptionsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionCreateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutSliderBandsInput> = z.strictObject({
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  version: z.lazy(() => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema),
  options: z.lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionUncheckedCreateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutSliderBandsInput> = z.strictObject({
  id: z.number().int().optional(),
  versionId: z.number().int(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionCreateOrConnectWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutSliderBandsInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema) ]),
});

export const TestQuestionUpsertWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithoutSliderBandsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestQuestionUpdateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema) ]),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutSliderBandsInputSchema) ]),
  where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
});

export const TestQuestionUpdateToOneWithWhereWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUpdateToOneWithWhereWithoutSliderBandsInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestQuestionUpdateWithoutSliderBandsInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema) ]),
});

export const TestQuestionUpdateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutSliderBandsInput> = z.strictObject({
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  version: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema).optional(),
  options: z.lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionUncheckedUpdateWithoutSliderBandsInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutSliderBandsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestTopicVersionCreateWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutPublicLinksInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutPublicLinksInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutPublicLinksInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublicLinksInputSchema) ]),
});

export const EducationOrganizationCreateWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationCreateWithoutPublicLinksInput> = z.strictObject({
  name: z.string(),
  isActive: z.boolean().optional(),
  groupValidationMode: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  groupValidationPattern: z.string().optional().nullable(),
  groupValidationExample: z.string().optional().nullable(),
  groupValidationHint: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EducationOrganizationUncheckedCreateWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationUncheckedCreateWithoutPublicLinksInput> = z.strictObject({
  id: z.number().int().optional(),
  name: z.string(),
  isActive: z.boolean().optional(),
  groupValidationMode: z.lazy(() => GroupOrClassValidationModeSchema).optional(),
  groupValidationPattern: z.string().optional().nullable(),
  groupValidationExample: z.string().optional().nullable(),
  groupValidationHint: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const EducationOrganizationCreateOrConnectWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationCreateOrConnectWithoutPublicLinksInput> = z.strictObject({
  where: z.lazy(() => EducationOrganizationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => EducationOrganizationCreateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedCreateWithoutPublicLinksInputSchema) ]),
});

export const UserCreateWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserCreateWithoutCreatedPublicTestLinksInput> = z.strictObject({
  email: z.string(),
  name: z.string().optional().nullable(),
  password: z.string(),
  hashedRefreshToken: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const UserUncheckedCreateWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCreatedPublicTestLinksInput> = z.strictObject({
  id: z.number().int().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  password: z.string(),
  hashedRefreshToken: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const UserCreateOrConnectWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCreatedPublicTestLinksInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedCreateWithoutCreatedPublicTestLinksInputSchema) ]),
});

export const TestStudentAttemptCreateWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateWithoutPublicLinkInput> = z.strictObject({
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutStudentAttemptsInputSchema),
  answers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutAttemptInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateWithoutPublicLinkInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutAttemptInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptCreateOrConnectWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateOrConnectWithoutPublicLinkInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema) ]),
});

export const TestStudentAttemptCreateManyPublicLinkInputEnvelopeSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyPublicLinkInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestStudentAttemptCreateManyPublicLinkInputSchema), z.lazy(() => TestStudentAttemptCreateManyPublicLinkInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestTopicVersionUpsertWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutPublicLinksInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutPublicLinksInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutPublicLinksInputSchema) ]),
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestTopicVersionUpdateToOneWithWhereWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutPublicLinksInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutPublicLinksInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutPublicLinksInputSchema) ]),
});

export const TestTopicVersionUpdateWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutPublicLinksInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutPublicLinksInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutPublicLinksInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const EducationOrganizationUpsertWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationUpsertWithoutPublicLinksInput> = z.strictObject({
  update: z.union([ z.lazy(() => EducationOrganizationUpdateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedUpdateWithoutPublicLinksInputSchema) ]),
  create: z.union([ z.lazy(() => EducationOrganizationCreateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedCreateWithoutPublicLinksInputSchema) ]),
  where: z.lazy(() => EducationOrganizationWhereInputSchema).optional(),
});

export const EducationOrganizationUpdateToOneWithWhereWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationUpdateToOneWithWhereWithoutPublicLinksInput> = z.strictObject({
  where: z.lazy(() => EducationOrganizationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => EducationOrganizationUpdateWithoutPublicLinksInputSchema), z.lazy(() => EducationOrganizationUncheckedUpdateWithoutPublicLinksInputSchema) ]),
});

export const EducationOrganizationUpdateWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationUpdateWithoutPublicLinksInput> = z.strictObject({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationPattern: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationExample: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationHint: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const EducationOrganizationUncheckedUpdateWithoutPublicLinksInputSchema: z.ZodType<Prisma.EducationOrganizationUncheckedUpdateWithoutPublicLinksInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationMode: z.union([ z.lazy(() => GroupOrClassValidationModeSchema), z.lazy(() => EnumGroupOrClassValidationModeFieldUpdateOperationsInputSchema) ]).optional(),
  groupValidationPattern: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationExample: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupValidationHint: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUpsertWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserUpsertWithoutCreatedPublicTestLinksInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedUpdateWithoutCreatedPublicTestLinksInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedCreateWithoutCreatedPublicTestLinksInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCreatedPublicTestLinksInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCreatedPublicTestLinksInputSchema), z.lazy(() => UserUncheckedUpdateWithoutCreatedPublicTestLinksInputSchema) ]),
});

export const UserUpdateWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserUpdateWithoutCreatedPublicTestLinksInput> = z.strictObject({
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hashedRefreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUncheckedUpdateWithoutCreatedPublicTestLinksInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCreatedPublicTestLinksInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  hashedRefreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAttemptUpsertWithWhereUniqueWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUpsertWithWhereUniqueWithoutPublicLinkInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutPublicLinkInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutPublicLinkInputSchema) ]),
});

export const TestStudentAttemptUpdateWithWhereUniqueWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateWithWhereUniqueWithoutPublicLinkInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutPublicLinkInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutPublicLinkInputSchema) ]),
});

export const TestStudentAttemptUpdateManyWithWhereWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyWithWhereWithoutPublicLinkInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestStudentAttemptUpdateManyMutationInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkInputSchema) ]),
});

export const TestPublicLinkCreateWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkCreateWithoutEducationOrganizationInput> = z.strictObject({
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublicLinksInputSchema),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedPublicTestLinksInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateWithoutEducationOrganizationInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutPublicLinkInputSchema).optional(),
});

export const TestPublicLinkCreateOrConnectWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkCreateOrConnectWithoutEducationOrganizationInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema) ]),
});

export const TestPublicLinkCreateManyEducationOrganizationInputEnvelopeSchema: z.ZodType<Prisma.TestPublicLinkCreateManyEducationOrganizationInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestPublicLinkCreateManyEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkCreateManyEducationOrganizationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestPublicLinkUpsertWithWhereUniqueWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUpsertWithWhereUniqueWithoutEducationOrganizationInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutEducationOrganizationInputSchema) ]),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutEducationOrganizationInputSchema) ]),
});

export const TestPublicLinkUpdateWithWhereUniqueWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithWhereUniqueWithoutEducationOrganizationInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutEducationOrganizationInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutEducationOrganizationInputSchema) ]),
});

export const TestPublicLinkUpdateManyWithWhereWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyWithWhereWithoutEducationOrganizationInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateManyMutationInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutEducationOrganizationInputSchema) ]),
});

export const TestPublicLinkCreateWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkCreateWithoutAttemptsInput> = z.strictObject({
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutPublicLinksInputSchema),
  educationOrganization: z.lazy(() => EducationOrganizationCreateNestedOneWithoutPublicLinksInputSchema).optional(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedPublicTestLinksInputSchema).optional(),
});

export const TestPublicLinkUncheckedCreateWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedCreateWithoutAttemptsInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
});

export const TestPublicLinkCreateOrConnectWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkCreateOrConnectWithoutAttemptsInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutAttemptsInputSchema) ]),
});

export const TestTopicVersionCreateWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutStudentAttemptsInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutTestVersionsInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutStudentAttemptsInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutStudentAttemptsInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutStudentAttemptsInputSchema) ]),
});

export const TestStudentAnswerCreateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateWithoutAttemptInput> = z.strictObject({
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  question: z.lazy(() => TestQuestionCreateNestedOneWithoutStudentAnswersInputSchema),
});

export const TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedCreateWithoutAttemptInput> = z.strictObject({
  id: z.number().int().optional(),
  questionId: z.number().int(),
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnswerCreateOrConnectWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateOrConnectWithoutAttemptInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema) ]),
});

export const TestStudentAnswerCreateManyAttemptInputEnvelopeSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyAttemptInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestStudentAnswerCreateManyAttemptInputSchema), z.lazy(() => TestStudentAnswerCreateManyAttemptInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestStudentAnalysisCreateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateWithoutAttemptInput> = z.strictObject({
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  promptVersion: z.lazy(() => AnalysisPromptVersionCreateNestedOneWithoutStudentAnalysesInputSchema).optional(),
});

export const TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedCreateWithoutAttemptInput> = z.strictObject({
  id: z.number().int().optional(),
  promptVersionId: z.number().int().optional().nullable(),
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnalysisCreateOrConnectWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateOrConnectWithoutAttemptInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema) ]),
});

export const TestPublicLinkUpsertWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkUpsertWithoutAttemptsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutAttemptsInputSchema) ]),
  create: z.union([ z.lazy(() => TestPublicLinkCreateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedCreateWithoutAttemptsInputSchema) ]),
  where: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
});

export const TestPublicLinkUpdateToOneWithWhereWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateToOneWithWhereWithoutAttemptsInput> = z.strictObject({
  where: z.lazy(() => TestPublicLinkWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestPublicLinkUpdateWithoutAttemptsInputSchema), z.lazy(() => TestPublicLinkUncheckedUpdateWithoutAttemptsInputSchema) ]),
});

export const TestPublicLinkUpdateWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithoutAttemptsInput> = z.strictObject({
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutPublicLinksNestedInputSchema).optional(),
  educationOrganization: z.lazy(() => EducationOrganizationUpdateOneWithoutPublicLinksNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneWithoutCreatedPublicTestLinksNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateWithoutAttemptsInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateWithoutAttemptsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestTopicVersionUpsertWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithoutStudentAttemptsInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutStudentAttemptsInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutStudentAttemptsInputSchema) ]),
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
});

export const TestTopicVersionUpdateToOneWithWhereWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateToOneWithWhereWithoutStudentAttemptsInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutStudentAttemptsInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutStudentAttemptsInputSchema) ]),
});

export const TestTopicVersionUpdateWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutStudentAttemptsInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutStudentAttemptsInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutStudentAttemptsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestStudentAnswerUpsertWithWhereUniqueWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUpsertWithWhereUniqueWithoutAttemptInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestStudentAnswerUpdateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedUpdateWithoutAttemptInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAnswerCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedCreateWithoutAttemptInputSchema) ]),
});

export const TestStudentAnswerUpdateWithWhereUniqueWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateWithWhereUniqueWithoutAttemptInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestStudentAnswerUpdateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnswerUncheckedUpdateWithoutAttemptInputSchema) ]),
});

export const TestStudentAnswerUpdateManyWithWhereWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyWithWhereWithoutAttemptInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnswerScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestStudentAnswerUpdateManyMutationInputSchema), z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutAttemptInputSchema) ]),
});

export const TestStudentAnalysisUpsertWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpsertWithoutAttemptInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestStudentAnalysisUpdateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateWithoutAttemptInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutAttemptInputSchema) ]),
  where: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional(),
});

export const TestStudentAnalysisUpdateToOneWithWhereWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateToOneWithWhereWithoutAttemptInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnalysisWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestStudentAnalysisUpdateWithoutAttemptInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateWithoutAttemptInputSchema) ]),
});

export const TestStudentAnalysisUpdateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateWithoutAttemptInput> = z.strictObject({
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutStudentAnalysesNestedInputSchema).optional(),
});

export const TestStudentAnalysisUncheckedUpdateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateWithoutAttemptInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAttemptCreateWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateWithoutAnswersInput> = z.strictObject({
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publicLink: z.lazy(() => TestPublicLinkCreateNestedOneWithoutAttemptsInputSchema),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutStudentAttemptsInputSchema),
  analysis: z.lazy(() => TestStudentAnalysisCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptUncheckedCreateWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateWithoutAnswersInput> = z.strictObject({
  id: z.number().int().optional(),
  publicLinkId: z.number().int(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedOneWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptCreateOrConnectWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateOrConnectWithoutAnswersInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnswersInputSchema) ]),
});

export const TestQuestionCreateWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionCreateWithoutStudentAnswersInput> = z.strictObject({
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  version: z.lazy(() => TestTopicVersionCreateNestedOneWithoutQuestionsInputSchema),
  options: z.lazy(() => TestQuestionOptionCreateNestedManyWithoutQuestionInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionUncheckedCreateWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionUncheckedCreateWithoutStudentAnswersInput> = z.strictObject({
  id: z.number().int().optional(),
  versionId: z.number().int(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedCreateNestedManyWithoutQuestionInputSchema).optional(),
});

export const TestQuestionCreateOrConnectWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionCreateOrConnectWithoutStudentAnswersInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutStudentAnswersInputSchema) ]),
});

export const TestStudentAttemptUpsertWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptUpsertWithoutAnswersInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutAnswersInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnswersInputSchema) ]),
  where: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
});

export const TestStudentAttemptUpdateToOneWithWhereWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateToOneWithWhereWithoutAnswersInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutAnswersInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutAnswersInputSchema) ]),
});

export const TestStudentAttemptUpdateWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateWithoutAnswersInput> = z.strictObject({
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publicLink: z.lazy(() => TestPublicLinkUpdateOneRequiredWithoutAttemptsNestedInputSchema).optional(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutStudentAttemptsNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateWithoutAnswersInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateWithoutAnswersInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestQuestionUpsertWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionUpsertWithoutStudentAnswersInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestQuestionUpdateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutStudentAnswersInputSchema) ]),
  create: z.union([ z.lazy(() => TestQuestionCreateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedCreateWithoutStudentAnswersInputSchema) ]),
  where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
});

export const TestQuestionUpdateToOneWithWhereWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionUpdateToOneWithWhereWithoutStudentAnswersInput> = z.strictObject({
  where: z.lazy(() => TestQuestionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestQuestionUpdateWithoutStudentAnswersInputSchema), z.lazy(() => TestQuestionUncheckedUpdateWithoutStudentAnswersInputSchema) ]),
});

export const TestQuestionUpdateWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutStudentAnswersInput> = z.strictObject({
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  version: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutQuestionsNestedInputSchema).optional(),
  options: z.lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionUncheckedUpdateWithoutStudentAnswersInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutStudentAnswersInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestStudentAttemptCreateWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateWithoutAnalysisInput> = z.strictObject({
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publicLink: z.lazy(() => TestPublicLinkCreateNestedOneWithoutAttemptsInputSchema),
  topicVersion: z.lazy(() => TestTopicVersionCreateNestedOneWithoutStudentAttemptsInputSchema),
  answers: z.lazy(() => TestStudentAnswerCreateNestedManyWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptUncheckedCreateWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedCreateWithoutAnalysisInput> = z.strictObject({
  id: z.number().int().optional(),
  publicLinkId: z.number().int(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedCreateNestedManyWithoutAttemptInputSchema).optional(),
});

export const TestStudentAttemptCreateOrConnectWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateOrConnectWithoutAnalysisInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnalysisInputSchema) ]),
});

export const AnalysisPromptVersionCreateWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateWithoutStudentAnalysesInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptCreateNestedOneWithoutVersionsInputSchema),
  testVersions: z.lazy(() => TestTopicVersionCreateNestedManyWithoutAnalysisPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedCreateWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedCreateWithoutStudentAnalysesInput> = z.strictObject({
  id: z.number().int().optional(),
  promptId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  testVersions: z.lazy(() => TestTopicVersionUncheckedCreateNestedManyWithoutAnalysisPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionCreateOrConnectWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateOrConnectWithoutStudentAnalysesInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutStudentAnalysesInputSchema) ]),
});

export const TestStudentAttemptUpsertWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptUpsertWithoutAnalysisInput> = z.strictObject({
  update: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutAnalysisInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAttemptCreateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedCreateWithoutAnalysisInputSchema) ]),
  where: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
});

export const TestStudentAttemptUpdateToOneWithWhereWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateToOneWithWhereWithoutAnalysisInput> = z.strictObject({
  where: z.lazy(() => TestStudentAttemptWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => TestStudentAttemptUpdateWithoutAnalysisInputSchema), z.lazy(() => TestStudentAttemptUncheckedUpdateWithoutAnalysisInputSchema) ]),
});

export const TestStudentAttemptUpdateWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateWithoutAnalysisInput> = z.strictObject({
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publicLink: z.lazy(() => TestPublicLinkUpdateOneRequiredWithoutAttemptsNestedInputSchema).optional(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutStudentAttemptsNestedInputSchema).optional(),
  answers: z.lazy(() => TestStudentAnswerUpdateManyWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateWithoutAnalysisInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateWithoutAnalysisInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutAttemptNestedInputSchema).optional(),
});

export const AnalysisPromptVersionUpsertWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpsertWithoutStudentAnalysesInput> = z.strictObject({
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutStudentAnalysesInputSchema) ]),
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutStudentAnalysesInputSchema) ]),
  where: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
});

export const AnalysisPromptVersionUpdateToOneWithWhereWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateToOneWithWhereWithoutStudentAnalysesInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithoutStudentAnalysesInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutStudentAnalysesInputSchema) ]),
});

export const AnalysisPromptVersionUpdateWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateWithoutStudentAnalysesInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  analysisPrompt: z.lazy(() => AnalysisPromptUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  testVersions: z.lazy(() => TestTopicVersionUpdateManyWithoutAnalysisPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateWithoutStudentAnalysesInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateWithoutStudentAnalysesInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  promptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  testVersions: z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateWithoutAnalysisPromptInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  testVersions: z.lazy(() => TestTopicVersionCreateNestedManyWithoutAnalysisPromptVersionInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisCreateNestedManyWithoutPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInput> = z.strictObject({
  id: z.number().int().optional(),
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  testVersions: z.lazy(() => TestTopicVersionUncheckedCreateNestedManyWithoutAnalysisPromptVersionInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUncheckedCreateNestedManyWithoutPromptVersionInputSchema).optional(),
});

export const AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateOrConnectWithoutAnalysisPromptInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema) ]),
});

export const AnalysisPromptVersionCreateManyAnalysisPromptInputEnvelopeSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateManyAnalysisPromptInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AnalysisPromptVersionCreateManyAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionCreateManyAnalysisPromptInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AnalysisPromptVersionUpsertWithWhereUniqueWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpsertWithWhereUniqueWithoutAnalysisPromptInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutAnalysisPromptInputSchema) ]),
  create: z.union([ z.lazy(() => AnalysisPromptVersionCreateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedCreateWithoutAnalysisPromptInputSchema) ]),
});

export const AnalysisPromptVersionUpdateWithWhereUniqueWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateWithWhereUniqueWithoutAnalysisPromptInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AnalysisPromptVersionUpdateWithoutAnalysisPromptInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateWithoutAnalysisPromptInputSchema) ]),
});

export const AnalysisPromptVersionUpdateManyWithWhereWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateManyWithWhereWithoutAnalysisPromptInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AnalysisPromptVersionUpdateManyMutationInputSchema), z.lazy(() => AnalysisPromptVersionUncheckedUpdateManyWithoutAnalysisPromptInputSchema) ]),
});

export const AnalysisPromptVersionScalarWhereInputSchema: z.ZodType<Prisma.AnalysisPromptVersionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema), z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema), z.lazy(() => AnalysisPromptVersionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  promptId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  versionNumber: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumAnalysisPromptVersionStatusFilterSchema), z.lazy(() => AnalysisPromptVersionStatusSchema) ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  temperature: z.union([ z.lazy(() => FloatFilterSchema), z.number() ]).optional(),
  prompt: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  outputSchema: z.lazy(() => JsonNullableFilterSchema).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const AnalysisPromptCreateWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptCreateWithoutVersionsInput> = z.strictObject({
  title: z.string(),
  description: z.string().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AnalysisPromptUncheckedCreateWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptUncheckedCreateWithoutVersionsInput> = z.strictObject({
  id: z.number().int().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AnalysisPromptCreateOrConnectWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptCreateOrConnectWithoutVersionsInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AnalysisPromptCreateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedCreateWithoutVersionsInputSchema) ]),
});

export const TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionCreateWithoutAnalysisPromptVersionInput> = z.strictObject({
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  topic: z.lazy(() => TestTopicCreateNestedOneWithoutVersionsInputSchema),
  draftForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActiveDraftVersionInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedCreateNestedManyWithoutActivePublishedVersionInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedCreateNestedManyWithoutVersionInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedCreateNestedManyWithoutTopicVersionInputSchema).optional(),
});

export const TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionCreateOrConnectWithoutAnalysisPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema) ]),
});

export const TestTopicVersionCreateManyAnalysisPromptVersionInputEnvelopeSchema: z.ZodType<Prisma.TestTopicVersionCreateManyAnalysisPromptVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestTopicVersionCreateManyAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionCreateManyAnalysisPromptVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const TestStudentAnalysisCreateWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateWithoutPromptVersionInput> = z.strictObject({
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  attempt: z.lazy(() => TestStudentAttemptCreateNestedOneWithoutAnalysisInputSchema),
});

export const TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedCreateWithoutPromptVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnalysisCreateOrConnectWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateOrConnectWithoutPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema) ]),
});

export const TestStudentAnalysisCreateManyPromptVersionInputEnvelopeSchema: z.ZodType<Prisma.TestStudentAnalysisCreateManyPromptVersionInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => TestStudentAnalysisCreateManyPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisCreateManyPromptVersionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AnalysisPromptUpsertWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptUpsertWithoutVersionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => AnalysisPromptUpdateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedUpdateWithoutVersionsInputSchema) ]),
  create: z.union([ z.lazy(() => AnalysisPromptCreateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedCreateWithoutVersionsInputSchema) ]),
  where: z.lazy(() => AnalysisPromptWhereInputSchema).optional(),
});

export const AnalysisPromptUpdateToOneWithWhereWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptUpdateToOneWithWhereWithoutVersionsInput> = z.strictObject({
  where: z.lazy(() => AnalysisPromptWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => AnalysisPromptUpdateWithoutVersionsInputSchema), z.lazy(() => AnalysisPromptUncheckedUpdateWithoutVersionsInputSchema) ]),
});

export const AnalysisPromptUpdateWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptUpdateWithoutVersionsInput> = z.strictObject({
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AnalysisPromptUncheckedUpdateWithoutVersionsInputSchema: z.ZodType<Prisma.AnalysisPromptUncheckedUpdateWithoutVersionsInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestTopicVersionUpsertWithWhereUniqueWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUpsertWithWhereUniqueWithoutAnalysisPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutAnalysisPromptVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestTopicVersionCreateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedCreateWithoutAnalysisPromptVersionInputSchema) ]),
});

export const TestTopicVersionUpdateWithWhereUniqueWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithWhereUniqueWithoutAnalysisPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateWithoutAnalysisPromptVersionInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateWithoutAnalysisPromptVersionInputSchema) ]),
});

export const TestTopicVersionUpdateManyWithWhereWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyWithWhereWithoutAnalysisPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestTopicVersionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestTopicVersionUpdateManyMutationInputSchema), z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionInputSchema) ]),
});

export const TestStudentAnalysisUpsertWithWhereUniqueWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpsertWithWhereUniqueWithoutPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TestStudentAnalysisUpdateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateWithoutPromptVersionInputSchema) ]),
  create: z.union([ z.lazy(() => TestStudentAnalysisCreateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedCreateWithoutPromptVersionInputSchema) ]),
});

export const TestStudentAnalysisUpdateWithWhereUniqueWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateWithWhereUniqueWithoutPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnalysisWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TestStudentAnalysisUpdateWithoutPromptVersionInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateWithoutPromptVersionInputSchema) ]),
});

export const TestStudentAnalysisUpdateManyWithWhereWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateManyWithWhereWithoutPromptVersionInput> = z.strictObject({
  where: z.lazy(() => TestStudentAnalysisScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TestStudentAnalysisUpdateManyMutationInputSchema), z.lazy(() => TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionInputSchema) ]),
});

export const TestStudentAnalysisScalarWhereInputSchema: z.ZodType<Prisma.TestStudentAnalysisScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => TestStudentAnalysisScalarWhereInputSchema), z.lazy(() => TestStudentAnalysisScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TestStudentAnalysisScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TestStudentAnalysisScalarWhereInputSchema), z.lazy(() => TestStudentAnalysisScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  attemptId: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  promptVersionId: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  providerMode: z.union([ z.lazy(() => EnumTestStudentAnalysisProviderModeFilterSchema), z.lazy(() => TestStudentAnalysisProviderModeSchema) ]).optional(),
  status: z.union([ z.lazy(() => EnumTestStudentAnalysisStatusFilterSchema), z.lazy(() => TestStudentAnalysisStatusSchema) ]).optional(),
  summary: z.lazy(() => JsonNullableFilterSchema).optional(),
  rawText: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  errorMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  generatedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const TestPublicLinkCreateManyCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkCreateManyCreatedByUserInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
});

export const TestPublicLinkUpdateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithoutCreatedByUserInput> = z.strictObject({
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutPublicLinksNestedInputSchema).optional(),
  educationOrganization: z.lazy(() => EducationOrganizationUpdateOneWithoutPublicLinksNestedInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateWithoutCreatedByUserInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyWithoutCreatedByUserInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestTopicVersionCreateManyTopicInputSchema: z.ZodType<Prisma.TestTopicVersionCreateManyTopicInput> = z.strictObject({
  id: z.number().int().optional(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  analysisPromptVersionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestTopicVersionUpdateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutTopicInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  analysisPromptVersion: z.lazy(() => AnalysisPromptVersionUpdateOneWithoutTestVersionsNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutTopicInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateManyWithoutTopicInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyWithoutTopicInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  analysisPromptVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestTopicCreateManyActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicCreateManyActiveDraftVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activePublishedVersionId: z.number().int().optional().nullable(),
});

export const TestTopicCreateManyActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicCreateManyActivePublishedVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  slug: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  activeDraftVersionId: z.number().int().optional().nullable(),
});

export const TestQuestionCreateManyVersionInputSchema: z.ZodType<Prisma.TestQuestionCreateManyVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  type: z.lazy(() => TestQuestionTypeSchema),
  title: z.string(),
  description: z.string().optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestPublicLinkCreateManyTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkCreateManyTopicVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  educationOrganizationId: z.number().int().optional().nullable(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
});

export const TestStudentAttemptCreateManyTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyTopicVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  publicLinkId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestTopicUpdateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithoutActiveDraftVersionInput> = z.strictObject({
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUpdateManyWithoutTopicNestedInputSchema).optional(),
  activePublishedVersion: z.lazy(() => TestTopicVersionUpdateOneWithoutPublishedForTopicNestedInputSchema).optional(),
});

export const TestTopicUncheckedUpdateWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateWithoutActiveDraftVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema).optional(),
});

export const TestTopicUncheckedUpdateManyWithoutActiveDraftVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActiveDraftVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activePublishedVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestTopicUpdateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUpdateWithoutActivePublishedVersionInput> = z.strictObject({
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUpdateManyWithoutTopicNestedInputSchema).optional(),
  activeDraftVersion: z.lazy(() => TestTopicVersionUpdateOneWithoutDraftForTopicNestedInputSchema).optional(),
});

export const TestTopicUncheckedUpdateWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateWithoutActivePublishedVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  versions: z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutTopicNestedInputSchema).optional(),
});

export const TestTopicUncheckedUpdateManyWithoutActivePublishedVersionInputSchema: z.ZodType<Prisma.TestTopicUncheckedUpdateManyWithoutActivePublishedVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  activeDraftVersionId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestQuestionUpdateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUpdateWithoutVersionInput> = z.strictObject({
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionUpdateManyWithoutQuestionNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionUncheckedUpdateWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateWithoutVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  options: z.lazy(() => TestQuestionOptionUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  sliderBands: z.lazy(() => TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
  studentAnswers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutQuestionNestedInputSchema).optional(),
});

export const TestQuestionUncheckedUpdateManyWithoutVersionInputSchema: z.ZodType<Prisma.TestQuestionUncheckedUpdateManyWithoutVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  required: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestPublicLinkUpdateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithoutTopicVersionInput> = z.strictObject({
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.lazy(() => EducationOrganizationUpdateOneWithoutPublicLinksNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneWithoutCreatedPublicTestLinksNestedInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateWithoutTopicVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateManyWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyWithoutTopicVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  educationOrganizationId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestStudentAttemptUpdateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateWithoutTopicVersionInput> = z.strictObject({
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publicLink: z.lazy(() => TestPublicLinkUpdateOneRequiredWithoutAttemptsNestedInputSchema).optional(),
  answers: z.lazy(() => TestStudentAnswerUpdateManyWithoutAttemptNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateWithoutTopicVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutAttemptNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  publicLinkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionOptionCreateManyQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyQuestionInput> = z.strictObject({
  id: z.number().int().optional(),
  label: z.string(),
  value: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionSliderBandCreateManyQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyQuestionInput> = z.strictObject({
  id: z.number().int().optional(),
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string(),
  weight: z.number().int().optional(),
  order: z.number().int(),
});

export const TestStudentAnswerCreateManyQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyQuestionInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestQuestionOptionUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUpdateWithoutQuestionInput> = z.strictObject({
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionOptionUncheckedUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateWithoutQuestionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionOptionUncheckedUpdateManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionOptionUncheckedUpdateManyWithoutQuestionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionSliderBandUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateWithoutQuestionInput> = z.strictObject({
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionSliderBandUncheckedUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateWithoutQuestionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestQuestionSliderBandUncheckedUpdateManyWithoutQuestionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  minValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  maxValue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  label: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  weight: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnswerUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateWithoutQuestionInput> = z.strictObject({
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  attempt: z.lazy(() => TestStudentAttemptUpdateOneRequiredWithoutAnswersNestedInputSchema).optional(),
});

export const TestStudentAnswerUncheckedUpdateWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateWithoutQuestionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnswerUncheckedUpdateManyWithoutQuestionInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateManyWithoutQuestionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAttemptCreateManyPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyPublicLinkInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  attemptNumber: z.number().int(),
  status: z.lazy(() => TestStudentAttemptStatusSchema).optional(),
  studentName: z.string().optional().nullable(),
  studentLastInitial: z.string().optional().nullable(),
  studentMiddleInitial: z.string().optional().nullable(),
  educationOrganization: z.string().optional().nullable(),
  groupOrClass: z.string().optional().nullable(),
  studentGender: z.lazy(() => TestStudentGenderSchema).optional().nullable(),
  studentAge: z.number().int().optional().nullable(),
  studentResidence: z.string().optional().nullable(),
  studentEducationLevel: z.lazy(() => TestStudentEducationLevelSchema).optional().nullable(),
  studentKeyHash: z.string(),
  consentAcceptedAt: z.coerce.date(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  resumeToken: z.string(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  anonymizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAttemptUpdateWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUpdateWithoutPublicLinkInput> = z.strictObject({
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutStudentAttemptsNestedInputSchema).optional(),
  answers: z.lazy(() => TestStudentAnswerUpdateManyWithoutAttemptNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateWithoutPublicLinkInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  answers: z.lazy(() => TestStudentAnswerUncheckedUpdateManyWithoutAttemptNestedInputSchema).optional(),
  analysis: z.lazy(() => TestStudentAnalysisUncheckedUpdateOneWithoutAttemptNestedInputSchema).optional(),
});

export const TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkInputSchema: z.ZodType<Prisma.TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAttemptStatusSchema), z.lazy(() => EnumTestStudentAttemptStatusFieldUpdateOperationsInputSchema) ]).optional(),
  studentName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentLastInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentMiddleInitial: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  educationOrganization: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  groupOrClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentGender: z.union([ z.lazy(() => TestStudentGenderSchema), z.lazy(() => NullableEnumTestStudentGenderFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentAge: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentResidence: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentEducationLevel: z.union([ z.lazy(() => TestStudentEducationLevelSchema), z.lazy(() => NullableEnumTestStudentEducationLevelFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  studentKeyHash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentAcceptedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resumeToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  finishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  anonymizedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestPublicLinkCreateManyEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkCreateManyEducationOrganizationInput> = z.strictObject({
  id: z.number().int().optional(),
  topicVersionId: z.number().int(),
  shortCode: z.string(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  maxAttemptsPerStudent: z.number().int().optional(),
  timeLimitMinutes: z.number().int().optional().nullable(),
  allowResume: z.boolean().optional(),
  entryProfileMode: z.lazy(() => TestEntryProfileModeSchema).optional(),
  consentVersion: z.string(),
  consentTextSnapshot: z.string(),
  createdByUserId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
});

export const TestPublicLinkUpdateWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUpdateWithoutEducationOrganizationInput> = z.strictObject({
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  topicVersion: z.lazy(() => TestTopicVersionUpdateOneRequiredWithoutPublicLinksNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneWithoutCreatedPublicTestLinksNestedInputSchema).optional(),
  attempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateWithoutEducationOrganizationInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  attempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutPublicLinkNestedInputSchema).optional(),
});

export const TestPublicLinkUncheckedUpdateManyWithoutEducationOrganizationInputSchema: z.ZodType<Prisma.TestPublicLinkUncheckedUpdateManyWithoutEducationOrganizationInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicVersionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shortCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  startsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  maxAttemptsPerStudent: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  timeLimitMinutes: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  allowResume: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  entryProfileMode: z.union([ z.lazy(() => TestEntryProfileModeSchema), z.lazy(() => EnumTestEntryProfileModeFieldUpdateOperationsInputSchema) ]).optional(),
  consentVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  consentTextSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  archivedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const TestStudentAnswerCreateManyAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyAttemptInput> = z.strictObject({
  id: z.number().int().optional(),
  questionId: z.number().int(),
  questionTypeSnapshot: z.lazy(() => TestQuestionTypeSchema),
  questionTitleSnapshot: z.string(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnswerUpdateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUpdateWithoutAttemptInput> = z.strictObject({
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  question: z.lazy(() => TestQuestionUpdateOneRequiredWithoutStudentAnswersNestedInputSchema).optional(),
});

export const TestStudentAnswerUncheckedUpdateWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateWithoutAttemptInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnswerUncheckedUpdateManyWithoutAttemptInputSchema: z.ZodType<Prisma.TestStudentAnswerUncheckedUpdateManyWithoutAttemptInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  questionTypeSnapshot: z.union([ z.lazy(() => TestQuestionTypeSchema), z.lazy(() => EnumTestQuestionTypeFieldUpdateOperationsInputSchema) ]).optional(),
  questionTitleSnapshot: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  answerPayload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AnalysisPromptVersionCreateManyAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateManyAnalysisPromptInput> = z.strictObject({
  id: z.number().int().optional(),
  versionNumber: z.number().int(),
  status: z.lazy(() => AnalysisPromptVersionStatusSchema).optional(),
  model: z.string(),
  temperature: z.number().optional(),
  prompt: z.string(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AnalysisPromptVersionUpdateWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateWithoutAnalysisPromptInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  testVersions: z.lazy(() => TestTopicVersionUpdateManyWithoutAnalysisPromptVersionNestedInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUpdateManyWithoutPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateWithoutAnalysisPromptInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  testVersions: z.lazy(() => TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionNestedInputSchema).optional(),
  studentAnalyses: z.lazy(() => TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionNestedInputSchema).optional(),
});

export const AnalysisPromptVersionUncheckedUpdateManyWithoutAnalysisPromptInputSchema: z.ZodType<Prisma.AnalysisPromptVersionUncheckedUpdateManyWithoutAnalysisPromptInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => AnalysisPromptVersionStatusSchema), z.lazy(() => EnumAnalysisPromptVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  temperature: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  prompt: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outputSchema: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestTopicVersionCreateManyAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionCreateManyAnalysisPromptVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  topicId: z.number().int(),
  versionNumber: z.number().int(),
  status: z.lazy(() => TestTopicVersionStatusSchema).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestStudentAnalysisCreateManyPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisCreateManyPromptVersionInput> = z.strictObject({
  id: z.number().int().optional(),
  attemptId: z.number().int(),
  providerMode: z.lazy(() => TestStudentAnalysisProviderModeSchema).optional(),
  status: z.lazy(() => TestStudentAnalysisStatusSchema).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  generatedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const TestTopicVersionUpdateWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUpdateWithoutAnalysisPromptVersionInput> = z.strictObject({
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  topic: z.lazy(() => TestTopicUpdateOneRequiredWithoutVersionsNestedInputSchema).optional(),
  draftForTopic: z.lazy(() => TestTopicUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateWithoutAnalysisPromptVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  draftForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActiveDraftVersionNestedInputSchema).optional(),
  publishedForTopic: z.lazy(() => TestTopicUncheckedUpdateManyWithoutActivePublishedVersionNestedInputSchema).optional(),
  questions: z.lazy(() => TestQuestionUncheckedUpdateManyWithoutVersionNestedInputSchema).optional(),
  publicLinks: z.lazy(() => TestPublicLinkUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
  studentAttempts: z.lazy(() => TestStudentAttemptUncheckedUpdateManyWithoutTopicVersionNestedInputSchema).optional(),
});

export const TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionInputSchema: z.ZodType<Prisma.TestTopicVersionUncheckedUpdateManyWithoutAnalysisPromptVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  topicId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  versionNumber: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestTopicVersionStatusSchema), z.lazy(() => EnumTestTopicVersionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnalysisUpdateWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateWithoutPromptVersionInput> = z.strictObject({
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  attempt: z.lazy(() => TestStudentAttemptUpdateOneRequiredWithoutAnalysisNestedInputSchema).optional(),
});

export const TestStudentAnalysisUncheckedUpdateWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateWithoutPromptVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionInputSchema: z.ZodType<Prisma.TestStudentAnalysisUncheckedUpdateManyWithoutPromptVersionInput> = z.strictObject({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  attemptId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  providerMode: z.union([ z.lazy(() => TestStudentAnalysisProviderModeSchema), z.lazy(() => EnumTestStudentAnalysisProviderModeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => TestStudentAnalysisStatusSchema), z.lazy(() => EnumTestStudentAnalysisStatusFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  rawText: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  generatedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const TestTopicFindFirstArgsSchema: z.ZodType<Prisma.TestTopicFindFirstArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicOrderByWithRelationInputSchema.array(), TestTopicOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestTopicScalarFieldEnumSchema, TestTopicScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestTopicFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestTopicFindFirstOrThrowArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicOrderByWithRelationInputSchema.array(), TestTopicOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestTopicScalarFieldEnumSchema, TestTopicScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestTopicFindManyArgsSchema: z.ZodType<Prisma.TestTopicFindManyArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicOrderByWithRelationInputSchema.array(), TestTopicOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestTopicScalarFieldEnumSchema, TestTopicScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestTopicAggregateArgsSchema: z.ZodType<Prisma.TestTopicAggregateArgs> = z.object({
  where: TestTopicWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicOrderByWithRelationInputSchema.array(), TestTopicOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestTopicGroupByArgsSchema: z.ZodType<Prisma.TestTopicGroupByArgs> = z.object({
  where: TestTopicWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicOrderByWithAggregationInputSchema.array(), TestTopicOrderByWithAggregationInputSchema ]).optional(),
  by: TestTopicScalarFieldEnumSchema.array(), 
  having: TestTopicScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestTopicFindUniqueArgsSchema: z.ZodType<Prisma.TestTopicFindUniqueArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereUniqueInputSchema, 
}).strict();

export const TestTopicFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestTopicFindUniqueOrThrowArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereUniqueInputSchema, 
}).strict();

export const TestTopicVersionFindFirstArgsSchema: z.ZodType<Prisma.TestTopicVersionFindFirstArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicVersionOrderByWithRelationInputSchema.array(), TestTopicVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestTopicVersionScalarFieldEnumSchema, TestTopicVersionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestTopicVersionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestTopicVersionFindFirstOrThrowArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicVersionOrderByWithRelationInputSchema.array(), TestTopicVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestTopicVersionScalarFieldEnumSchema, TestTopicVersionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestTopicVersionFindManyArgsSchema: z.ZodType<Prisma.TestTopicVersionFindManyArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicVersionOrderByWithRelationInputSchema.array(), TestTopicVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestTopicVersionScalarFieldEnumSchema, TestTopicVersionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestTopicVersionAggregateArgsSchema: z.ZodType<Prisma.TestTopicVersionAggregateArgs> = z.object({
  where: TestTopicVersionWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicVersionOrderByWithRelationInputSchema.array(), TestTopicVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestTopicVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestTopicVersionGroupByArgsSchema: z.ZodType<Prisma.TestTopicVersionGroupByArgs> = z.object({
  where: TestTopicVersionWhereInputSchema.optional(), 
  orderBy: z.union([ TestTopicVersionOrderByWithAggregationInputSchema.array(), TestTopicVersionOrderByWithAggregationInputSchema ]).optional(),
  by: TestTopicVersionScalarFieldEnumSchema.array(), 
  having: TestTopicVersionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestTopicVersionFindUniqueArgsSchema: z.ZodType<Prisma.TestTopicVersionFindUniqueArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereUniqueInputSchema, 
}).strict();

export const TestTopicVersionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestTopicVersionFindUniqueOrThrowArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionFindFirstArgsSchema: z.ZodType<Prisma.TestQuestionFindFirstArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOrderByWithRelationInputSchema.array(), TestQuestionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionScalarFieldEnumSchema, TestQuestionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionFindFirstOrThrowArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOrderByWithRelationInputSchema.array(), TestQuestionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionScalarFieldEnumSchema, TestQuestionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionFindManyArgsSchema: z.ZodType<Prisma.TestQuestionFindManyArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOrderByWithRelationInputSchema.array(), TestQuestionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionScalarFieldEnumSchema, TestQuestionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionAggregateArgsSchema: z.ZodType<Prisma.TestQuestionAggregateArgs> = z.object({
  where: TestQuestionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOrderByWithRelationInputSchema.array(), TestQuestionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestQuestionGroupByArgsSchema: z.ZodType<Prisma.TestQuestionGroupByArgs> = z.object({
  where: TestQuestionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOrderByWithAggregationInputSchema.array(), TestQuestionOrderByWithAggregationInputSchema ]).optional(),
  by: TestQuestionScalarFieldEnumSchema.array(), 
  having: TestQuestionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestQuestionFindUniqueArgsSchema: z.ZodType<Prisma.TestQuestionFindUniqueArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionFindUniqueOrThrowArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionOptionFindFirstArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindFirstArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOptionOrderByWithRelationInputSchema.array(), TestQuestionOptionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionOptionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionOptionScalarFieldEnumSchema, TestQuestionOptionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionOptionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindFirstOrThrowArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOptionOrderByWithRelationInputSchema.array(), TestQuestionOptionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionOptionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionOptionScalarFieldEnumSchema, TestQuestionOptionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionOptionFindManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindManyArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOptionOrderByWithRelationInputSchema.array(), TestQuestionOptionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionOptionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionOptionScalarFieldEnumSchema, TestQuestionOptionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionOptionAggregateArgsSchema: z.ZodType<Prisma.TestQuestionOptionAggregateArgs> = z.object({
  where: TestQuestionOptionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOptionOrderByWithRelationInputSchema.array(), TestQuestionOptionOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionOptionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestQuestionOptionGroupByArgsSchema: z.ZodType<Prisma.TestQuestionOptionGroupByArgs> = z.object({
  where: TestQuestionOptionWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionOptionOrderByWithAggregationInputSchema.array(), TestQuestionOptionOrderByWithAggregationInputSchema ]).optional(),
  by: TestQuestionOptionScalarFieldEnumSchema.array(), 
  having: TestQuestionOptionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestQuestionOptionFindUniqueArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindUniqueArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionOptionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionOptionFindUniqueOrThrowArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionSliderBandFindFirstArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindFirstArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionSliderBandOrderByWithRelationInputSchema.array(), TestQuestionSliderBandOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionSliderBandScalarFieldEnumSchema, TestQuestionSliderBandScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionSliderBandFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindFirstOrThrowArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionSliderBandOrderByWithRelationInputSchema.array(), TestQuestionSliderBandOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionSliderBandScalarFieldEnumSchema, TestQuestionSliderBandScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionSliderBandFindManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindManyArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionSliderBandOrderByWithRelationInputSchema.array(), TestQuestionSliderBandOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestQuestionSliderBandScalarFieldEnumSchema, TestQuestionSliderBandScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestQuestionSliderBandAggregateArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandAggregateArgs> = z.object({
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionSliderBandOrderByWithRelationInputSchema.array(), TestQuestionSliderBandOrderByWithRelationInputSchema ]).optional(),
  cursor: TestQuestionSliderBandWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestQuestionSliderBandGroupByArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandGroupByArgs> = z.object({
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  orderBy: z.union([ TestQuestionSliderBandOrderByWithAggregationInputSchema.array(), TestQuestionSliderBandOrderByWithAggregationInputSchema ]).optional(),
  by: TestQuestionSliderBandScalarFieldEnumSchema.array(), 
  having: TestQuestionSliderBandScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestQuestionSliderBandFindUniqueArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindUniqueArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereUniqueInputSchema, 
}).strict();

export const TestQuestionSliderBandFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandFindUniqueOrThrowArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereUniqueInputSchema, 
}).strict();

export const TestPublicLinkFindFirstArgsSchema: z.ZodType<Prisma.TestPublicLinkFindFirstArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereInputSchema.optional(), 
  orderBy: z.union([ TestPublicLinkOrderByWithRelationInputSchema.array(), TestPublicLinkOrderByWithRelationInputSchema ]).optional(),
  cursor: TestPublicLinkWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestPublicLinkScalarFieldEnumSchema, TestPublicLinkScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestPublicLinkFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestPublicLinkFindFirstOrThrowArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereInputSchema.optional(), 
  orderBy: z.union([ TestPublicLinkOrderByWithRelationInputSchema.array(), TestPublicLinkOrderByWithRelationInputSchema ]).optional(),
  cursor: TestPublicLinkWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestPublicLinkScalarFieldEnumSchema, TestPublicLinkScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestPublicLinkFindManyArgsSchema: z.ZodType<Prisma.TestPublicLinkFindManyArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereInputSchema.optional(), 
  orderBy: z.union([ TestPublicLinkOrderByWithRelationInputSchema.array(), TestPublicLinkOrderByWithRelationInputSchema ]).optional(),
  cursor: TestPublicLinkWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestPublicLinkScalarFieldEnumSchema, TestPublicLinkScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestPublicLinkAggregateArgsSchema: z.ZodType<Prisma.TestPublicLinkAggregateArgs> = z.object({
  where: TestPublicLinkWhereInputSchema.optional(), 
  orderBy: z.union([ TestPublicLinkOrderByWithRelationInputSchema.array(), TestPublicLinkOrderByWithRelationInputSchema ]).optional(),
  cursor: TestPublicLinkWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestPublicLinkGroupByArgsSchema: z.ZodType<Prisma.TestPublicLinkGroupByArgs> = z.object({
  where: TestPublicLinkWhereInputSchema.optional(), 
  orderBy: z.union([ TestPublicLinkOrderByWithAggregationInputSchema.array(), TestPublicLinkOrderByWithAggregationInputSchema ]).optional(),
  by: TestPublicLinkScalarFieldEnumSchema.array(), 
  having: TestPublicLinkScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestPublicLinkFindUniqueArgsSchema: z.ZodType<Prisma.TestPublicLinkFindUniqueArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereUniqueInputSchema, 
}).strict();

export const TestPublicLinkFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestPublicLinkFindUniqueOrThrowArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereUniqueInputSchema, 
}).strict();

export const EducationOrganizationFindFirstArgsSchema: z.ZodType<Prisma.EducationOrganizationFindFirstArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereInputSchema.optional(), 
  orderBy: z.union([ EducationOrganizationOrderByWithRelationInputSchema.array(), EducationOrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: EducationOrganizationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EducationOrganizationScalarFieldEnumSchema, EducationOrganizationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EducationOrganizationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.EducationOrganizationFindFirstOrThrowArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereInputSchema.optional(), 
  orderBy: z.union([ EducationOrganizationOrderByWithRelationInputSchema.array(), EducationOrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: EducationOrganizationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EducationOrganizationScalarFieldEnumSchema, EducationOrganizationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EducationOrganizationFindManyArgsSchema: z.ZodType<Prisma.EducationOrganizationFindManyArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereInputSchema.optional(), 
  orderBy: z.union([ EducationOrganizationOrderByWithRelationInputSchema.array(), EducationOrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: EducationOrganizationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EducationOrganizationScalarFieldEnumSchema, EducationOrganizationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const EducationOrganizationAggregateArgsSchema: z.ZodType<Prisma.EducationOrganizationAggregateArgs> = z.object({
  where: EducationOrganizationWhereInputSchema.optional(), 
  orderBy: z.union([ EducationOrganizationOrderByWithRelationInputSchema.array(), EducationOrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: EducationOrganizationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EducationOrganizationGroupByArgsSchema: z.ZodType<Prisma.EducationOrganizationGroupByArgs> = z.object({
  where: EducationOrganizationWhereInputSchema.optional(), 
  orderBy: z.union([ EducationOrganizationOrderByWithAggregationInputSchema.array(), EducationOrganizationOrderByWithAggregationInputSchema ]).optional(),
  by: EducationOrganizationScalarFieldEnumSchema.array(), 
  having: EducationOrganizationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const EducationOrganizationFindUniqueArgsSchema: z.ZodType<Prisma.EducationOrganizationFindUniqueArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereUniqueInputSchema, 
}).strict();

export const EducationOrganizationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EducationOrganizationFindUniqueOrThrowArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereUniqueInputSchema, 
}).strict();

export const TestStudentAttemptFindFirstArgsSchema: z.ZodType<Prisma.TestStudentAttemptFindFirstArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAttemptOrderByWithRelationInputSchema.array(), TestStudentAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAttemptScalarFieldEnumSchema, TestStudentAttemptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAttemptFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestStudentAttemptFindFirstOrThrowArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAttemptOrderByWithRelationInputSchema.array(), TestStudentAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAttemptScalarFieldEnumSchema, TestStudentAttemptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAttemptFindManyArgsSchema: z.ZodType<Prisma.TestStudentAttemptFindManyArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAttemptOrderByWithRelationInputSchema.array(), TestStudentAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAttemptScalarFieldEnumSchema, TestStudentAttemptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAttemptAggregateArgsSchema: z.ZodType<Prisma.TestStudentAttemptAggregateArgs> = z.object({
  where: TestStudentAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAttemptOrderByWithRelationInputSchema.array(), TestStudentAttemptOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAttemptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestStudentAttemptGroupByArgsSchema: z.ZodType<Prisma.TestStudentAttemptGroupByArgs> = z.object({
  where: TestStudentAttemptWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAttemptOrderByWithAggregationInputSchema.array(), TestStudentAttemptOrderByWithAggregationInputSchema ]).optional(),
  by: TestStudentAttemptScalarFieldEnumSchema.array(), 
  having: TestStudentAttemptScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestStudentAttemptFindUniqueArgsSchema: z.ZodType<Prisma.TestStudentAttemptFindUniqueArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereUniqueInputSchema, 
}).strict();

export const TestStudentAttemptFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestStudentAttemptFindUniqueOrThrowArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnswerFindFirstArgsSchema: z.ZodType<Prisma.TestStudentAnswerFindFirstArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnswerOrderByWithRelationInputSchema.array(), TestStudentAnswerOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnswerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAnswerScalarFieldEnumSchema, TestStudentAnswerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAnswerFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestStudentAnswerFindFirstOrThrowArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnswerOrderByWithRelationInputSchema.array(), TestStudentAnswerOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnswerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAnswerScalarFieldEnumSchema, TestStudentAnswerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAnswerFindManyArgsSchema: z.ZodType<Prisma.TestStudentAnswerFindManyArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnswerOrderByWithRelationInputSchema.array(), TestStudentAnswerOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnswerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAnswerScalarFieldEnumSchema, TestStudentAnswerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAnswerAggregateArgsSchema: z.ZodType<Prisma.TestStudentAnswerAggregateArgs> = z.object({
  where: TestStudentAnswerWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnswerOrderByWithRelationInputSchema.array(), TestStudentAnswerOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnswerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestStudentAnswerGroupByArgsSchema: z.ZodType<Prisma.TestStudentAnswerGroupByArgs> = z.object({
  where: TestStudentAnswerWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnswerOrderByWithAggregationInputSchema.array(), TestStudentAnswerOrderByWithAggregationInputSchema ]).optional(),
  by: TestStudentAnswerScalarFieldEnumSchema.array(), 
  having: TestStudentAnswerScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestStudentAnswerFindUniqueArgsSchema: z.ZodType<Prisma.TestStudentAnswerFindUniqueArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnswerFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestStudentAnswerFindUniqueOrThrowArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnalysisFindFirstArgsSchema: z.ZodType<Prisma.TestStudentAnalysisFindFirstArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnalysisOrderByWithRelationInputSchema.array(), TestStudentAnalysisOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnalysisWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAnalysisScalarFieldEnumSchema, TestStudentAnalysisScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAnalysisFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TestStudentAnalysisFindFirstOrThrowArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnalysisOrderByWithRelationInputSchema.array(), TestStudentAnalysisOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnalysisWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAnalysisScalarFieldEnumSchema, TestStudentAnalysisScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAnalysisFindManyArgsSchema: z.ZodType<Prisma.TestStudentAnalysisFindManyArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnalysisOrderByWithRelationInputSchema.array(), TestStudentAnalysisOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnalysisWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TestStudentAnalysisScalarFieldEnumSchema, TestStudentAnalysisScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const TestStudentAnalysisAggregateArgsSchema: z.ZodType<Prisma.TestStudentAnalysisAggregateArgs> = z.object({
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnalysisOrderByWithRelationInputSchema.array(), TestStudentAnalysisOrderByWithRelationInputSchema ]).optional(),
  cursor: TestStudentAnalysisWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestStudentAnalysisGroupByArgsSchema: z.ZodType<Prisma.TestStudentAnalysisGroupByArgs> = z.object({
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  orderBy: z.union([ TestStudentAnalysisOrderByWithAggregationInputSchema.array(), TestStudentAnalysisOrderByWithAggregationInputSchema ]).optional(),
  by: TestStudentAnalysisScalarFieldEnumSchema.array(), 
  having: TestStudentAnalysisScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const TestStudentAnalysisFindUniqueArgsSchema: z.ZodType<Prisma.TestStudentAnalysisFindUniqueArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnalysisFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TestStudentAnalysisFindUniqueOrThrowArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptFindFirstArgsSchema: z.ZodType<Prisma.AnalysisPromptFindFirstArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptOrderByWithRelationInputSchema.array(), AnalysisPromptOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AnalysisPromptScalarFieldEnumSchema, AnalysisPromptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AnalysisPromptFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AnalysisPromptFindFirstOrThrowArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptOrderByWithRelationInputSchema.array(), AnalysisPromptOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AnalysisPromptScalarFieldEnumSchema, AnalysisPromptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AnalysisPromptFindManyArgsSchema: z.ZodType<Prisma.AnalysisPromptFindManyArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptOrderByWithRelationInputSchema.array(), AnalysisPromptOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AnalysisPromptScalarFieldEnumSchema, AnalysisPromptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AnalysisPromptAggregateArgsSchema: z.ZodType<Prisma.AnalysisPromptAggregateArgs> = z.object({
  where: AnalysisPromptWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptOrderByWithRelationInputSchema.array(), AnalysisPromptOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AnalysisPromptGroupByArgsSchema: z.ZodType<Prisma.AnalysisPromptGroupByArgs> = z.object({
  where: AnalysisPromptWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptOrderByWithAggregationInputSchema.array(), AnalysisPromptOrderByWithAggregationInputSchema ]).optional(),
  by: AnalysisPromptScalarFieldEnumSchema.array(), 
  having: AnalysisPromptScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AnalysisPromptFindUniqueArgsSchema: z.ZodType<Prisma.AnalysisPromptFindUniqueArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AnalysisPromptFindUniqueOrThrowArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptVersionFindFirstArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionFindFirstArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptVersionOrderByWithRelationInputSchema.array(), AnalysisPromptVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AnalysisPromptVersionScalarFieldEnumSchema, AnalysisPromptVersionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AnalysisPromptVersionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionFindFirstOrThrowArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptVersionOrderByWithRelationInputSchema.array(), AnalysisPromptVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AnalysisPromptVersionScalarFieldEnumSchema, AnalysisPromptVersionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AnalysisPromptVersionFindManyArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionFindManyArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptVersionOrderByWithRelationInputSchema.array(), AnalysisPromptVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AnalysisPromptVersionScalarFieldEnumSchema, AnalysisPromptVersionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AnalysisPromptVersionAggregateArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionAggregateArgs> = z.object({
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptVersionOrderByWithRelationInputSchema.array(), AnalysisPromptVersionOrderByWithRelationInputSchema ]).optional(),
  cursor: AnalysisPromptVersionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AnalysisPromptVersionGroupByArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionGroupByArgs> = z.object({
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  orderBy: z.union([ AnalysisPromptVersionOrderByWithAggregationInputSchema.array(), AnalysisPromptVersionOrderByWithAggregationInputSchema ]).optional(),
  by: AnalysisPromptVersionScalarFieldEnumSchema.array(), 
  having: AnalysisPromptVersionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AnalysisPromptVersionFindUniqueArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionFindUniqueArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptVersionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionFindUniqueOrThrowArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereUniqueInputSchema, 
}).strict();

export const AppSettingFindFirstArgsSchema: z.ZodType<Prisma.AppSettingFindFirstArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereInputSchema.optional(), 
  orderBy: z.union([ AppSettingOrderByWithRelationInputSchema.array(), AppSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: AppSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AppSettingScalarFieldEnumSchema, AppSettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AppSettingFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AppSettingFindFirstOrThrowArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereInputSchema.optional(), 
  orderBy: z.union([ AppSettingOrderByWithRelationInputSchema.array(), AppSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: AppSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AppSettingScalarFieldEnumSchema, AppSettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AppSettingFindManyArgsSchema: z.ZodType<Prisma.AppSettingFindManyArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereInputSchema.optional(), 
  orderBy: z.union([ AppSettingOrderByWithRelationInputSchema.array(), AppSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: AppSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AppSettingScalarFieldEnumSchema, AppSettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AppSettingAggregateArgsSchema: z.ZodType<Prisma.AppSettingAggregateArgs> = z.object({
  where: AppSettingWhereInputSchema.optional(), 
  orderBy: z.union([ AppSettingOrderByWithRelationInputSchema.array(), AppSettingOrderByWithRelationInputSchema ]).optional(),
  cursor: AppSettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AppSettingGroupByArgsSchema: z.ZodType<Prisma.AppSettingGroupByArgs> = z.object({
  where: AppSettingWhereInputSchema.optional(), 
  orderBy: z.union([ AppSettingOrderByWithAggregationInputSchema.array(), AppSettingOrderByWithAggregationInputSchema ]).optional(),
  by: AppSettingScalarFieldEnumSchema.array(), 
  having: AppSettingScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AppSettingFindUniqueArgsSchema: z.ZodType<Prisma.AppSettingFindUniqueArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereUniqueInputSchema, 
}).strict();

export const AppSettingFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AppSettingFindUniqueOrThrowArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereUniqueInputSchema, 
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestTopicCreateArgsSchema: z.ZodType<Prisma.TestTopicCreateArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  data: z.union([ TestTopicCreateInputSchema, TestTopicUncheckedCreateInputSchema ]),
}).strict();

export const TestTopicUpsertArgsSchema: z.ZodType<Prisma.TestTopicUpsertArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereUniqueInputSchema, 
  create: z.union([ TestTopicCreateInputSchema, TestTopicUncheckedCreateInputSchema ]),
  update: z.union([ TestTopicUpdateInputSchema, TestTopicUncheckedUpdateInputSchema ]),
}).strict();

export const TestTopicCreateManyArgsSchema: z.ZodType<Prisma.TestTopicCreateManyArgs> = z.object({
  data: z.union([ TestTopicCreateManyInputSchema, TestTopicCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestTopicCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestTopicCreateManyInputSchema, TestTopicCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestTopicDeleteArgsSchema: z.ZodType<Prisma.TestTopicDeleteArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  where: TestTopicWhereUniqueInputSchema, 
}).strict();

export const TestTopicUpdateArgsSchema: z.ZodType<Prisma.TestTopicUpdateArgs> = z.object({
  select: TestTopicSelectSchema.optional(),
  include: TestTopicIncludeSchema.optional(),
  data: z.union([ TestTopicUpdateInputSchema, TestTopicUncheckedUpdateInputSchema ]),
  where: TestTopicWhereUniqueInputSchema, 
}).strict();

export const TestTopicUpdateManyArgsSchema: z.ZodType<Prisma.TestTopicUpdateManyArgs> = z.object({
  data: z.union([ TestTopicUpdateManyMutationInputSchema, TestTopicUncheckedUpdateManyInputSchema ]),
  where: TestTopicWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestTopicUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestTopicUpdateManyMutationInputSchema, TestTopicUncheckedUpdateManyInputSchema ]),
  where: TestTopicWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestTopicDeleteManyArgsSchema: z.ZodType<Prisma.TestTopicDeleteManyArgs> = z.object({
  where: TestTopicWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestTopicVersionCreateArgsSchema: z.ZodType<Prisma.TestTopicVersionCreateArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  data: z.union([ TestTopicVersionCreateInputSchema, TestTopicVersionUncheckedCreateInputSchema ]),
}).strict();

export const TestTopicVersionUpsertArgsSchema: z.ZodType<Prisma.TestTopicVersionUpsertArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereUniqueInputSchema, 
  create: z.union([ TestTopicVersionCreateInputSchema, TestTopicVersionUncheckedCreateInputSchema ]),
  update: z.union([ TestTopicVersionUpdateInputSchema, TestTopicVersionUncheckedUpdateInputSchema ]),
}).strict();

export const TestTopicVersionCreateManyArgsSchema: z.ZodType<Prisma.TestTopicVersionCreateManyArgs> = z.object({
  data: z.union([ TestTopicVersionCreateManyInputSchema, TestTopicVersionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestTopicVersionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicVersionCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestTopicVersionCreateManyInputSchema, TestTopicVersionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestTopicVersionDeleteArgsSchema: z.ZodType<Prisma.TestTopicVersionDeleteArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  where: TestTopicVersionWhereUniqueInputSchema, 
}).strict();

export const TestTopicVersionUpdateArgsSchema: z.ZodType<Prisma.TestTopicVersionUpdateArgs> = z.object({
  select: TestTopicVersionSelectSchema.optional(),
  include: TestTopicVersionIncludeSchema.optional(),
  data: z.union([ TestTopicVersionUpdateInputSchema, TestTopicVersionUncheckedUpdateInputSchema ]),
  where: TestTopicVersionWhereUniqueInputSchema, 
}).strict();

export const TestTopicVersionUpdateManyArgsSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyArgs> = z.object({
  data: z.union([ TestTopicVersionUpdateManyMutationInputSchema, TestTopicVersionUncheckedUpdateManyInputSchema ]),
  where: TestTopicVersionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestTopicVersionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestTopicVersionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestTopicVersionUpdateManyMutationInputSchema, TestTopicVersionUncheckedUpdateManyInputSchema ]),
  where: TestTopicVersionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestTopicVersionDeleteManyArgsSchema: z.ZodType<Prisma.TestTopicVersionDeleteManyArgs> = z.object({
  where: TestTopicVersionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionCreateArgsSchema: z.ZodType<Prisma.TestQuestionCreateArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  data: z.union([ TestQuestionCreateInputSchema, TestQuestionUncheckedCreateInputSchema ]),
}).strict();

export const TestQuestionUpsertArgsSchema: z.ZodType<Prisma.TestQuestionUpsertArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereUniqueInputSchema, 
  create: z.union([ TestQuestionCreateInputSchema, TestQuestionUncheckedCreateInputSchema ]),
  update: z.union([ TestQuestionUpdateInputSchema, TestQuestionUncheckedUpdateInputSchema ]),
}).strict();

export const TestQuestionCreateManyArgsSchema: z.ZodType<Prisma.TestQuestionCreateManyArgs> = z.object({
  data: z.union([ TestQuestionCreateManyInputSchema, TestQuestionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestQuestionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestQuestionCreateManyInputSchema, TestQuestionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestQuestionDeleteArgsSchema: z.ZodType<Prisma.TestQuestionDeleteArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  where: TestQuestionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionUpdateArgsSchema: z.ZodType<Prisma.TestQuestionUpdateArgs> = z.object({
  select: TestQuestionSelectSchema.optional(),
  include: TestQuestionIncludeSchema.optional(),
  data: z.union([ TestQuestionUpdateInputSchema, TestQuestionUncheckedUpdateInputSchema ]),
  where: TestQuestionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionUpdateManyArgsSchema: z.ZodType<Prisma.TestQuestionUpdateManyArgs> = z.object({
  data: z.union([ TestQuestionUpdateManyMutationInputSchema, TestQuestionUncheckedUpdateManyInputSchema ]),
  where: TestQuestionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestQuestionUpdateManyMutationInputSchema, TestQuestionUncheckedUpdateManyInputSchema ]),
  where: TestQuestionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionDeleteManyArgsSchema: z.ZodType<Prisma.TestQuestionDeleteManyArgs> = z.object({
  where: TestQuestionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionOptionCreateArgsSchema: z.ZodType<Prisma.TestQuestionOptionCreateArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  data: z.union([ TestQuestionOptionCreateInputSchema, TestQuestionOptionUncheckedCreateInputSchema ]),
}).strict();

export const TestQuestionOptionUpsertArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpsertArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereUniqueInputSchema, 
  create: z.union([ TestQuestionOptionCreateInputSchema, TestQuestionOptionUncheckedCreateInputSchema ]),
  update: z.union([ TestQuestionOptionUpdateInputSchema, TestQuestionOptionUncheckedUpdateInputSchema ]),
}).strict();

export const TestQuestionOptionCreateManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyArgs> = z.object({
  data: z.union([ TestQuestionOptionCreateManyInputSchema, TestQuestionOptionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestQuestionOptionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionOptionCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestQuestionOptionCreateManyInputSchema, TestQuestionOptionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestQuestionOptionDeleteArgsSchema: z.ZodType<Prisma.TestQuestionOptionDeleteArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  where: TestQuestionOptionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionOptionUpdateArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpdateArgs> = z.object({
  select: TestQuestionOptionSelectSchema.optional(),
  include: TestQuestionOptionIncludeSchema.optional(),
  data: z.union([ TestQuestionOptionUpdateInputSchema, TestQuestionOptionUncheckedUpdateInputSchema ]),
  where: TestQuestionOptionWhereUniqueInputSchema, 
}).strict();

export const TestQuestionOptionUpdateManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyArgs> = z.object({
  data: z.union([ TestQuestionOptionUpdateManyMutationInputSchema, TestQuestionOptionUncheckedUpdateManyInputSchema ]),
  where: TestQuestionOptionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionOptionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionOptionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestQuestionOptionUpdateManyMutationInputSchema, TestQuestionOptionUncheckedUpdateManyInputSchema ]),
  where: TestQuestionOptionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionOptionDeleteManyArgsSchema: z.ZodType<Prisma.TestQuestionOptionDeleteManyArgs> = z.object({
  where: TestQuestionOptionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionSliderBandCreateArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  data: z.union([ TestQuestionSliderBandCreateInputSchema, TestQuestionSliderBandUncheckedCreateInputSchema ]),
}).strict();

export const TestQuestionSliderBandUpsertArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpsertArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereUniqueInputSchema, 
  create: z.union([ TestQuestionSliderBandCreateInputSchema, TestQuestionSliderBandUncheckedCreateInputSchema ]),
  update: z.union([ TestQuestionSliderBandUpdateInputSchema, TestQuestionSliderBandUncheckedUpdateInputSchema ]),
}).strict();

export const TestQuestionSliderBandCreateManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyArgs> = z.object({
  data: z.union([ TestQuestionSliderBandCreateManyInputSchema, TestQuestionSliderBandCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestQuestionSliderBandCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestQuestionSliderBandCreateManyInputSchema, TestQuestionSliderBandCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestQuestionSliderBandDeleteArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandDeleteArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  where: TestQuestionSliderBandWhereUniqueInputSchema, 
}).strict();

export const TestQuestionSliderBandUpdateArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateArgs> = z.object({
  select: TestQuestionSliderBandSelectSchema.optional(),
  include: TestQuestionSliderBandIncludeSchema.optional(),
  data: z.union([ TestQuestionSliderBandUpdateInputSchema, TestQuestionSliderBandUncheckedUpdateInputSchema ]),
  where: TestQuestionSliderBandWhereUniqueInputSchema, 
}).strict();

export const TestQuestionSliderBandUpdateManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyArgs> = z.object({
  data: z.union([ TestQuestionSliderBandUpdateManyMutationInputSchema, TestQuestionSliderBandUncheckedUpdateManyInputSchema ]),
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionSliderBandUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestQuestionSliderBandUpdateManyMutationInputSchema, TestQuestionSliderBandUncheckedUpdateManyInputSchema ]),
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestQuestionSliderBandDeleteManyArgsSchema: z.ZodType<Prisma.TestQuestionSliderBandDeleteManyArgs> = z.object({
  where: TestQuestionSliderBandWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestPublicLinkCreateArgsSchema: z.ZodType<Prisma.TestPublicLinkCreateArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  data: z.union([ TestPublicLinkCreateInputSchema, TestPublicLinkUncheckedCreateInputSchema ]),
}).strict();

export const TestPublicLinkUpsertArgsSchema: z.ZodType<Prisma.TestPublicLinkUpsertArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereUniqueInputSchema, 
  create: z.union([ TestPublicLinkCreateInputSchema, TestPublicLinkUncheckedCreateInputSchema ]),
  update: z.union([ TestPublicLinkUpdateInputSchema, TestPublicLinkUncheckedUpdateInputSchema ]),
}).strict();

export const TestPublicLinkCreateManyArgsSchema: z.ZodType<Prisma.TestPublicLinkCreateManyArgs> = z.object({
  data: z.union([ TestPublicLinkCreateManyInputSchema, TestPublicLinkCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestPublicLinkCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestPublicLinkCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestPublicLinkCreateManyInputSchema, TestPublicLinkCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestPublicLinkDeleteArgsSchema: z.ZodType<Prisma.TestPublicLinkDeleteArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  where: TestPublicLinkWhereUniqueInputSchema, 
}).strict();

export const TestPublicLinkUpdateArgsSchema: z.ZodType<Prisma.TestPublicLinkUpdateArgs> = z.object({
  select: TestPublicLinkSelectSchema.optional(),
  include: TestPublicLinkIncludeSchema.optional(),
  data: z.union([ TestPublicLinkUpdateInputSchema, TestPublicLinkUncheckedUpdateInputSchema ]),
  where: TestPublicLinkWhereUniqueInputSchema, 
}).strict();

export const TestPublicLinkUpdateManyArgsSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyArgs> = z.object({
  data: z.union([ TestPublicLinkUpdateManyMutationInputSchema, TestPublicLinkUncheckedUpdateManyInputSchema ]),
  where: TestPublicLinkWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestPublicLinkUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestPublicLinkUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestPublicLinkUpdateManyMutationInputSchema, TestPublicLinkUncheckedUpdateManyInputSchema ]),
  where: TestPublicLinkWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestPublicLinkDeleteManyArgsSchema: z.ZodType<Prisma.TestPublicLinkDeleteManyArgs> = z.object({
  where: TestPublicLinkWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EducationOrganizationCreateArgsSchema: z.ZodType<Prisma.EducationOrganizationCreateArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  data: z.union([ EducationOrganizationCreateInputSchema, EducationOrganizationUncheckedCreateInputSchema ]),
}).strict();

export const EducationOrganizationUpsertArgsSchema: z.ZodType<Prisma.EducationOrganizationUpsertArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereUniqueInputSchema, 
  create: z.union([ EducationOrganizationCreateInputSchema, EducationOrganizationUncheckedCreateInputSchema ]),
  update: z.union([ EducationOrganizationUpdateInputSchema, EducationOrganizationUncheckedUpdateInputSchema ]),
}).strict();

export const EducationOrganizationCreateManyArgsSchema: z.ZodType<Prisma.EducationOrganizationCreateManyArgs> = z.object({
  data: z.union([ EducationOrganizationCreateManyInputSchema, EducationOrganizationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EducationOrganizationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EducationOrganizationCreateManyAndReturnArgs> = z.object({
  data: z.union([ EducationOrganizationCreateManyInputSchema, EducationOrganizationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const EducationOrganizationDeleteArgsSchema: z.ZodType<Prisma.EducationOrganizationDeleteArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  where: EducationOrganizationWhereUniqueInputSchema, 
}).strict();

export const EducationOrganizationUpdateArgsSchema: z.ZodType<Prisma.EducationOrganizationUpdateArgs> = z.object({
  select: EducationOrganizationSelectSchema.optional(),
  include: EducationOrganizationIncludeSchema.optional(),
  data: z.union([ EducationOrganizationUpdateInputSchema, EducationOrganizationUncheckedUpdateInputSchema ]),
  where: EducationOrganizationWhereUniqueInputSchema, 
}).strict();

export const EducationOrganizationUpdateManyArgsSchema: z.ZodType<Prisma.EducationOrganizationUpdateManyArgs> = z.object({
  data: z.union([ EducationOrganizationUpdateManyMutationInputSchema, EducationOrganizationUncheckedUpdateManyInputSchema ]),
  where: EducationOrganizationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EducationOrganizationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EducationOrganizationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EducationOrganizationUpdateManyMutationInputSchema, EducationOrganizationUncheckedUpdateManyInputSchema ]),
  where: EducationOrganizationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const EducationOrganizationDeleteManyArgsSchema: z.ZodType<Prisma.EducationOrganizationDeleteManyArgs> = z.object({
  where: EducationOrganizationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAttemptCreateArgsSchema: z.ZodType<Prisma.TestStudentAttemptCreateArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  data: z.union([ TestStudentAttemptCreateInputSchema, TestStudentAttemptUncheckedCreateInputSchema ]),
}).strict();

export const TestStudentAttemptUpsertArgsSchema: z.ZodType<Prisma.TestStudentAttemptUpsertArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereUniqueInputSchema, 
  create: z.union([ TestStudentAttemptCreateInputSchema, TestStudentAttemptUncheckedCreateInputSchema ]),
  update: z.union([ TestStudentAttemptUpdateInputSchema, TestStudentAttemptUncheckedUpdateInputSchema ]),
}).strict();

export const TestStudentAttemptCreateManyArgsSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyArgs> = z.object({
  data: z.union([ TestStudentAttemptCreateManyInputSchema, TestStudentAttemptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestStudentAttemptCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestStudentAttemptCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestStudentAttemptCreateManyInputSchema, TestStudentAttemptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestStudentAttemptDeleteArgsSchema: z.ZodType<Prisma.TestStudentAttemptDeleteArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  where: TestStudentAttemptWhereUniqueInputSchema, 
}).strict();

export const TestStudentAttemptUpdateArgsSchema: z.ZodType<Prisma.TestStudentAttemptUpdateArgs> = z.object({
  select: TestStudentAttemptSelectSchema.optional(),
  include: TestStudentAttemptIncludeSchema.optional(),
  data: z.union([ TestStudentAttemptUpdateInputSchema, TestStudentAttemptUncheckedUpdateInputSchema ]),
  where: TestStudentAttemptWhereUniqueInputSchema, 
}).strict();

export const TestStudentAttemptUpdateManyArgsSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyArgs> = z.object({
  data: z.union([ TestStudentAttemptUpdateManyMutationInputSchema, TestStudentAttemptUncheckedUpdateManyInputSchema ]),
  where: TestStudentAttemptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAttemptUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestStudentAttemptUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestStudentAttemptUpdateManyMutationInputSchema, TestStudentAttemptUncheckedUpdateManyInputSchema ]),
  where: TestStudentAttemptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAttemptDeleteManyArgsSchema: z.ZodType<Prisma.TestStudentAttemptDeleteManyArgs> = z.object({
  where: TestStudentAttemptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAnswerCreateArgsSchema: z.ZodType<Prisma.TestStudentAnswerCreateArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  data: z.union([ TestStudentAnswerCreateInputSchema, TestStudentAnswerUncheckedCreateInputSchema ]),
}).strict();

export const TestStudentAnswerUpsertArgsSchema: z.ZodType<Prisma.TestStudentAnswerUpsertArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereUniqueInputSchema, 
  create: z.union([ TestStudentAnswerCreateInputSchema, TestStudentAnswerUncheckedCreateInputSchema ]),
  update: z.union([ TestStudentAnswerUpdateInputSchema, TestStudentAnswerUncheckedUpdateInputSchema ]),
}).strict();

export const TestStudentAnswerCreateManyArgsSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyArgs> = z.object({
  data: z.union([ TestStudentAnswerCreateManyInputSchema, TestStudentAnswerCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestStudentAnswerCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestStudentAnswerCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestStudentAnswerCreateManyInputSchema, TestStudentAnswerCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestStudentAnswerDeleteArgsSchema: z.ZodType<Prisma.TestStudentAnswerDeleteArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  where: TestStudentAnswerWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnswerUpdateArgsSchema: z.ZodType<Prisma.TestStudentAnswerUpdateArgs> = z.object({
  select: TestStudentAnswerSelectSchema.optional(),
  include: TestStudentAnswerIncludeSchema.optional(),
  data: z.union([ TestStudentAnswerUpdateInputSchema, TestStudentAnswerUncheckedUpdateInputSchema ]),
  where: TestStudentAnswerWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnswerUpdateManyArgsSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyArgs> = z.object({
  data: z.union([ TestStudentAnswerUpdateManyMutationInputSchema, TestStudentAnswerUncheckedUpdateManyInputSchema ]),
  where: TestStudentAnswerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAnswerUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestStudentAnswerUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestStudentAnswerUpdateManyMutationInputSchema, TestStudentAnswerUncheckedUpdateManyInputSchema ]),
  where: TestStudentAnswerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAnswerDeleteManyArgsSchema: z.ZodType<Prisma.TestStudentAnswerDeleteManyArgs> = z.object({
  where: TestStudentAnswerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAnalysisCreateArgsSchema: z.ZodType<Prisma.TestStudentAnalysisCreateArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  data: z.union([ TestStudentAnalysisCreateInputSchema, TestStudentAnalysisUncheckedCreateInputSchema ]),
}).strict();

export const TestStudentAnalysisUpsertArgsSchema: z.ZodType<Prisma.TestStudentAnalysisUpsertArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereUniqueInputSchema, 
  create: z.union([ TestStudentAnalysisCreateInputSchema, TestStudentAnalysisUncheckedCreateInputSchema ]),
  update: z.union([ TestStudentAnalysisUpdateInputSchema, TestStudentAnalysisUncheckedUpdateInputSchema ]),
}).strict();

export const TestStudentAnalysisCreateManyArgsSchema: z.ZodType<Prisma.TestStudentAnalysisCreateManyArgs> = z.object({
  data: z.union([ TestStudentAnalysisCreateManyInputSchema, TestStudentAnalysisCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestStudentAnalysisCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TestStudentAnalysisCreateManyAndReturnArgs> = z.object({
  data: z.union([ TestStudentAnalysisCreateManyInputSchema, TestStudentAnalysisCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const TestStudentAnalysisDeleteArgsSchema: z.ZodType<Prisma.TestStudentAnalysisDeleteArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  where: TestStudentAnalysisWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnalysisUpdateArgsSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateArgs> = z.object({
  select: TestStudentAnalysisSelectSchema.optional(),
  include: TestStudentAnalysisIncludeSchema.optional(),
  data: z.union([ TestStudentAnalysisUpdateInputSchema, TestStudentAnalysisUncheckedUpdateInputSchema ]),
  where: TestStudentAnalysisWhereUniqueInputSchema, 
}).strict();

export const TestStudentAnalysisUpdateManyArgsSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateManyArgs> = z.object({
  data: z.union([ TestStudentAnalysisUpdateManyMutationInputSchema, TestStudentAnalysisUncheckedUpdateManyInputSchema ]),
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAnalysisUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TestStudentAnalysisUpdateManyAndReturnArgs> = z.object({
  data: z.union([ TestStudentAnalysisUpdateManyMutationInputSchema, TestStudentAnalysisUncheckedUpdateManyInputSchema ]),
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const TestStudentAnalysisDeleteManyArgsSchema: z.ZodType<Prisma.TestStudentAnalysisDeleteManyArgs> = z.object({
  where: TestStudentAnalysisWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AnalysisPromptCreateArgsSchema: z.ZodType<Prisma.AnalysisPromptCreateArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  data: z.union([ AnalysisPromptCreateInputSchema, AnalysisPromptUncheckedCreateInputSchema ]),
}).strict();

export const AnalysisPromptUpsertArgsSchema: z.ZodType<Prisma.AnalysisPromptUpsertArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereUniqueInputSchema, 
  create: z.union([ AnalysisPromptCreateInputSchema, AnalysisPromptUncheckedCreateInputSchema ]),
  update: z.union([ AnalysisPromptUpdateInputSchema, AnalysisPromptUncheckedUpdateInputSchema ]),
}).strict();

export const AnalysisPromptCreateManyArgsSchema: z.ZodType<Prisma.AnalysisPromptCreateManyArgs> = z.object({
  data: z.union([ AnalysisPromptCreateManyInputSchema, AnalysisPromptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AnalysisPromptCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AnalysisPromptCreateManyAndReturnArgs> = z.object({
  data: z.union([ AnalysisPromptCreateManyInputSchema, AnalysisPromptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AnalysisPromptDeleteArgsSchema: z.ZodType<Prisma.AnalysisPromptDeleteArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  where: AnalysisPromptWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptUpdateArgsSchema: z.ZodType<Prisma.AnalysisPromptUpdateArgs> = z.object({
  select: AnalysisPromptSelectSchema.optional(),
  include: AnalysisPromptIncludeSchema.optional(),
  data: z.union([ AnalysisPromptUpdateInputSchema, AnalysisPromptUncheckedUpdateInputSchema ]),
  where: AnalysisPromptWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptUpdateManyArgsSchema: z.ZodType<Prisma.AnalysisPromptUpdateManyArgs> = z.object({
  data: z.union([ AnalysisPromptUpdateManyMutationInputSchema, AnalysisPromptUncheckedUpdateManyInputSchema ]),
  where: AnalysisPromptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AnalysisPromptUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AnalysisPromptUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AnalysisPromptUpdateManyMutationInputSchema, AnalysisPromptUncheckedUpdateManyInputSchema ]),
  where: AnalysisPromptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AnalysisPromptDeleteManyArgsSchema: z.ZodType<Prisma.AnalysisPromptDeleteManyArgs> = z.object({
  where: AnalysisPromptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AnalysisPromptVersionCreateArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  data: z.union([ AnalysisPromptVersionCreateInputSchema, AnalysisPromptVersionUncheckedCreateInputSchema ]),
}).strict();

export const AnalysisPromptVersionUpsertArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionUpsertArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereUniqueInputSchema, 
  create: z.union([ AnalysisPromptVersionCreateInputSchema, AnalysisPromptVersionUncheckedCreateInputSchema ]),
  update: z.union([ AnalysisPromptVersionUpdateInputSchema, AnalysisPromptVersionUncheckedUpdateInputSchema ]),
}).strict();

export const AnalysisPromptVersionCreateManyArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateManyArgs> = z.object({
  data: z.union([ AnalysisPromptVersionCreateManyInputSchema, AnalysisPromptVersionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AnalysisPromptVersionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionCreateManyAndReturnArgs> = z.object({
  data: z.union([ AnalysisPromptVersionCreateManyInputSchema, AnalysisPromptVersionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AnalysisPromptVersionDeleteArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionDeleteArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  where: AnalysisPromptVersionWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptVersionUpdateArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateArgs> = z.object({
  select: AnalysisPromptVersionSelectSchema.optional(),
  include: AnalysisPromptVersionIncludeSchema.optional(),
  data: z.union([ AnalysisPromptVersionUpdateInputSchema, AnalysisPromptVersionUncheckedUpdateInputSchema ]),
  where: AnalysisPromptVersionWhereUniqueInputSchema, 
}).strict();

export const AnalysisPromptVersionUpdateManyArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateManyArgs> = z.object({
  data: z.union([ AnalysisPromptVersionUpdateManyMutationInputSchema, AnalysisPromptVersionUncheckedUpdateManyInputSchema ]),
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AnalysisPromptVersionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AnalysisPromptVersionUpdateManyMutationInputSchema, AnalysisPromptVersionUncheckedUpdateManyInputSchema ]),
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AnalysisPromptVersionDeleteManyArgsSchema: z.ZodType<Prisma.AnalysisPromptVersionDeleteManyArgs> = z.object({
  where: AnalysisPromptVersionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AppSettingCreateArgsSchema: z.ZodType<Prisma.AppSettingCreateArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  data: z.union([ AppSettingCreateInputSchema, AppSettingUncheckedCreateInputSchema ]),
}).strict();

export const AppSettingUpsertArgsSchema: z.ZodType<Prisma.AppSettingUpsertArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereUniqueInputSchema, 
  create: z.union([ AppSettingCreateInputSchema, AppSettingUncheckedCreateInputSchema ]),
  update: z.union([ AppSettingUpdateInputSchema, AppSettingUncheckedUpdateInputSchema ]),
}).strict();

export const AppSettingCreateManyArgsSchema: z.ZodType<Prisma.AppSettingCreateManyArgs> = z.object({
  data: z.union([ AppSettingCreateManyInputSchema, AppSettingCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AppSettingCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AppSettingCreateManyAndReturnArgs> = z.object({
  data: z.union([ AppSettingCreateManyInputSchema, AppSettingCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AppSettingDeleteArgsSchema: z.ZodType<Prisma.AppSettingDeleteArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  where: AppSettingWhereUniqueInputSchema, 
}).strict();

export const AppSettingUpdateArgsSchema: z.ZodType<Prisma.AppSettingUpdateArgs> = z.object({
  select: AppSettingSelectSchema.optional(),
  data: z.union([ AppSettingUpdateInputSchema, AppSettingUncheckedUpdateInputSchema ]),
  where: AppSettingWhereUniqueInputSchema, 
}).strict();

export const AppSettingUpdateManyArgsSchema: z.ZodType<Prisma.AppSettingUpdateManyArgs> = z.object({
  data: z.union([ AppSettingUpdateManyMutationInputSchema, AppSettingUncheckedUpdateManyInputSchema ]),
  where: AppSettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AppSettingUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AppSettingUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AppSettingUpdateManyMutationInputSchema, AppSettingUncheckedUpdateManyInputSchema ]),
  where: AppSettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AppSettingDeleteManyArgsSchema: z.ZodType<Prisma.AppSettingDeleteManyArgs> = z.object({
  where: AppSettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();