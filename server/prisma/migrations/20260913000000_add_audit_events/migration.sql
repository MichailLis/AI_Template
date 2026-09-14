-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'ANALYSIS_PROMPT', 'APP_SETTING', 'PUBLIC_LINK');

-- CreateTable
CREATE TABLE "audit_events" (
    "id" SERIAL NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" INTEGER,
    "changes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_createdAt_idx" ON "audit_events"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_actorUserId_idx" ON "audit_events"("actorUserId");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
