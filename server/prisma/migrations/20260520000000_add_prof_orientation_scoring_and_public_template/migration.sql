-- CreateEnum
CREATE TYPE "TestScoringKind" AS ENUM ('DEFAULT', 'PROF_ORIENTATION_V3_PLUS');

-- CreateEnum
CREATE TYPE "TestPublicTemplate" AS ENUM ('STANDARD', 'POLUS');

-- AlterEnum
ALTER TYPE "TestStudentAnalysisProviderMode" ADD VALUE 'ALGORITHM';
ALTER TYPE "TestStudentAnalysisProviderMode" ADD VALUE 'ALGORITHM_LLM';

-- AlterTable
ALTER TABLE "test_public_links" ADD COLUMN "publicTemplate" "TestPublicTemplate" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "test_topic_versions"
  ADD COLUMN "scoringConfig" JSONB,
  ADD COLUMN "scoringKind" "TestScoringKind" NOT NULL DEFAULT 'DEFAULT';
