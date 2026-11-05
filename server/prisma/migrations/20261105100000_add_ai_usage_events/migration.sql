-- CreateEnum
CREATE TYPE "AiUsagePurpose" AS ENUM ('STUDENT_ANALYSIS', 'PROF_ORIENTATION_ENRICHMENT', 'TEST_GENERATION', 'PROMPT_SIMULATION', 'CONNECTION_CHECK');

-- CreateEnum
CREATE TYPE "AiUsageStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ai_usage_events" (
    "id" SERIAL NOT NULL,
    "purpose" "AiUsagePurpose" NOT NULL,
    "status" "AiUsageStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "requestedModel" TEXT NOT NULL,
    "actualModel" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "cost" DECIMAL(18,8),
    "durationMs" INTEGER NOT NULL,
    "failureReason" TEXT,
    "attemptId" INTEGER,
    "actorUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_events_createdAt_idx" ON "ai_usage_events"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_events_attemptId_idx" ON "ai_usage_events"("attemptId");

-- CreateIndex
CREATE INDEX "ai_usage_events_actorUserId_idx" ON "ai_usage_events"("actorUserId");

-- AddForeignKey
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_student_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
