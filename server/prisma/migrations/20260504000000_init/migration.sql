-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TestTopicVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestQuestionType" AS ENUM ('OPEN_TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'SLIDER');

-- CreateEnum
CREATE TYPE "TestStudentAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TestStudentAnalysisStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "TestStudentAnalysisProviderMode" AS ENUM ('STUB', 'LLM');

-- CreateEnum
CREATE TYPE "AnalysisPromptVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupOrClassValidationMode" AS ENUM ('NONE', 'HINT', 'STRICT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "hashedRefreshToken" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_topics" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "activeDraftVersionId" INTEGER,
    "activePublishedVersionId" INTEGER,

    CONSTRAINT "test_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_topic_versions" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "TestTopicVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "analysisPromptVersionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_topic_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "type" "TestQuestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_question_options" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_question_slider_bands" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "minValue" INTEGER NOT NULL,
    "maxValue" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,

    CONSTRAINT "test_question_slider_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_public_links" (
    "id" SERIAL NOT NULL,
    "topicVersionId" INTEGER NOT NULL,
    "educationOrganizationId" INTEGER,
    "shortCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxAttemptsPerStudent" INTEGER NOT NULL DEFAULT 1,
    "timeLimitMinutes" INTEGER,
    "allowResume" BOOLEAN NOT NULL DEFAULT true,
    "consentVersion" TEXT NOT NULL,
    "consentTextSnapshot" TEXT NOT NULL,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "test_public_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "groupValidationMode" "GroupOrClassValidationMode" NOT NULL DEFAULT 'NONE',
    "groupValidationPattern" TEXT,
    "groupValidationExample" TEXT,
    "groupValidationHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_student_attempts" (
    "id" SERIAL NOT NULL,
    "publicLinkId" INTEGER NOT NULL,
    "topicVersionId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "TestStudentAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "studentName" TEXT NOT NULL,
    "studentLastInitial" TEXT NOT NULL,
    "studentMiddleInitial" TEXT NOT NULL,
    "educationOrganization" TEXT NOT NULL,
    "groupOrClass" TEXT NOT NULL,
    "studentKeyHash" TEXT NOT NULL,
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentTextSnapshot" TEXT NOT NULL,
    "resumeToken" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_student_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_student_answers" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "questionTypeSnapshot" "TestQuestionType" NOT NULL,
    "questionTitleSnapshot" TEXT NOT NULL,
    "answerPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_student_analyses" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "promptVersionId" INTEGER,
    "providerMode" "TestStudentAnalysisProviderMode" NOT NULL DEFAULT 'STUB',
    "status" "TestStudentAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "summary" JSONB,
    "rawText" TEXT,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_student_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_prompts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_prompt_versions" (
    "id" SERIAL NOT NULL,
    "promptId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "AnalysisPromptVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "prompt" TEXT NOT NULL,
    "outputSchema" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "test_topics_slug_key" ON "test_topics"("slug");

-- CreateIndex
CREATE INDEX "test_topics_archivedAt_idx" ON "test_topics"("archivedAt");

-- CreateIndex
CREATE INDEX "test_topic_versions_topicId_status_idx" ON "test_topic_versions"("topicId", "status");

-- CreateIndex
CREATE INDEX "test_topic_versions_analysisPromptVersionId_idx" ON "test_topic_versions"("analysisPromptVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "test_topic_versions_topicId_versionNumber_key" ON "test_topic_versions"("topicId", "versionNumber");

-- CreateIndex
CREATE INDEX "test_questions_versionId_order_idx" ON "test_questions"("versionId", "order");

-- CreateIndex
CREATE INDEX "test_question_options_questionId_order_idx" ON "test_question_options"("questionId", "order");

-- CreateIndex
CREATE INDEX "test_question_slider_bands_questionId_order_idx" ON "test_question_slider_bands"("questionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "test_public_links_shortCode_key" ON "test_public_links"("shortCode");

-- CreateIndex
CREATE INDEX "test_public_links_topicVersionId_idx" ON "test_public_links"("topicVersionId");

-- CreateIndex
CREATE INDEX "test_public_links_educationOrganizationId_idx" ON "test_public_links"("educationOrganizationId");

-- CreateIndex
CREATE INDEX "test_public_links_isActive_idx" ON "test_public_links"("isActive");

-- CreateIndex
CREATE INDEX "test_public_links_createdAt_idx" ON "test_public_links"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "education_organizations_name_key" ON "education_organizations"("name");

-- CreateIndex
CREATE INDEX "education_organizations_isActive_idx" ON "education_organizations"("isActive");

-- CreateIndex
CREATE INDEX "education_organizations_groupValidationMode_idx" ON "education_organizations"("groupValidationMode");

-- CreateIndex
CREATE UNIQUE INDEX "test_student_attempts_resumeToken_key" ON "test_student_attempts"("resumeToken");

-- CreateIndex
CREATE INDEX "test_student_attempts_publicLinkId_studentKeyHash_idx" ON "test_student_attempts"("publicLinkId", "studentKeyHash");

-- CreateIndex
CREATE INDEX "test_student_attempts_status_startedAt_idx" ON "test_student_attempts"("status", "startedAt");

-- CreateIndex
CREATE INDEX "test_student_attempts_topicVersionId_idx" ON "test_student_attempts"("topicVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "test_student_attempts_publicLinkId_studentKeyHash_attemptNu_key" ON "test_student_attempts"("publicLinkId", "studentKeyHash", "attemptNumber");

-- CreateIndex
CREATE INDEX "test_student_answers_attemptId_idx" ON "test_student_answers"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "test_student_answers_attemptId_questionId_key" ON "test_student_answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "test_student_analyses_attemptId_key" ON "test_student_analyses"("attemptId");

-- CreateIndex
CREATE INDEX "test_student_analyses_status_generatedAt_idx" ON "test_student_analyses"("status", "generatedAt");

-- CreateIndex
CREATE INDEX "test_student_analyses_promptVersionId_idx" ON "test_student_analyses"("promptVersionId");

-- CreateIndex
CREATE INDEX "analysis_prompts_archivedAt_idx" ON "analysis_prompts"("archivedAt");

-- CreateIndex
CREATE INDEX "analysis_prompt_versions_promptId_status_idx" ON "analysis_prompt_versions"("promptId", "status");

-- CreateIndex
CREATE INDEX "analysis_prompt_versions_status_idx" ON "analysis_prompt_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_prompt_versions_promptId_versionNumber_key" ON "analysis_prompt_versions"("promptId", "versionNumber");

-- AddForeignKey
ALTER TABLE "test_topics" ADD CONSTRAINT "test_topics_activeDraftVersionId_fkey" FOREIGN KEY ("activeDraftVersionId") REFERENCES "test_topic_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_topics" ADD CONSTRAINT "test_topics_activePublishedVersionId_fkey" FOREIGN KEY ("activePublishedVersionId") REFERENCES "test_topic_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_topic_versions" ADD CONSTRAINT "test_topic_versions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "test_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_topic_versions" ADD CONSTRAINT "test_topic_versions_analysisPromptVersionId_fkey" FOREIGN KEY ("analysisPromptVersionId") REFERENCES "analysis_prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "test_topic_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_question_options" ADD CONSTRAINT "test_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_question_slider_bands" ADD CONSTRAINT "test_question_slider_bands_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_public_links" ADD CONSTRAINT "test_public_links_topicVersionId_fkey" FOREIGN KEY ("topicVersionId") REFERENCES "test_topic_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_public_links" ADD CONSTRAINT "test_public_links_educationOrganizationId_fkey" FOREIGN KEY ("educationOrganizationId") REFERENCES "education_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_public_links" ADD CONSTRAINT "test_public_links_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_student_attempts" ADD CONSTRAINT "test_student_attempts_publicLinkId_fkey" FOREIGN KEY ("publicLinkId") REFERENCES "test_public_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_student_attempts" ADD CONSTRAINT "test_student_attempts_topicVersionId_fkey" FOREIGN KEY ("topicVersionId") REFERENCES "test_topic_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_student_answers" ADD CONSTRAINT "test_student_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_student_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_student_answers" ADD CONSTRAINT "test_student_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_student_analyses" ADD CONSTRAINT "test_student_analyses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_student_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_student_analyses" ADD CONSTRAINT "test_student_analyses_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "analysis_prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_prompt_versions" ADD CONSTRAINT "analysis_prompt_versions_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "analysis_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
