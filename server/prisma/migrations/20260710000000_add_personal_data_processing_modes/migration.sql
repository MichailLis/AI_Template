CREATE TYPE "PersonalDataProcessingMode" AS ENUM ('PUBLIC', 'ON_BEHALF_OF_EDUCATION_ORGANIZATION');

ALTER TABLE "education_organizations"
  ADD COLUMN "fullName" TEXT,
  ADD COLUMN "shortName" TEXT,
  ADD COLUMN "inn" TEXT,
  ADD COLUMN "ogrn" TEXT,
  ADD COLUMN "legalAddress" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "privacyPolicyUrl" TEXT,
  ADD COLUMN "consentDocumentUrl" TEXT,
  ADD COLUMN "logoUrl" TEXT;

ALTER TABLE "test_public_links"
  ADD COLUMN "personalDataProcessingMode" "PersonalDataProcessingMode" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "operatorFullNameSnapshot" TEXT,
  ADD COLUMN "operatorShortNameSnapshot" TEXT,
  ADD COLUMN "operatorPrivacyPolicyUrlSnapshot" TEXT,
  ADD COLUMN "operatorConsentDocumentUrlSnapshot" TEXT;

UPDATE "test_public_links"
SET
  "operatorFullNameSnapshot" = 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
  "operatorShortNameSnapshot" = NULL,
  "operatorPrivacyPolicyUrlSnapshot" = '/privacy',
  "operatorConsentDocumentUrlSnapshot" = NULL
WHERE "personalDataProcessingMode" = 'PUBLIC';

ALTER TABLE "test_student_attempts"
  ADD COLUMN "operatorEducationOrganizationId" INTEGER,
  ADD COLUMN "operatorFullNameSnapshot" TEXT,
  ADD COLUMN "operatorShortNameSnapshot" TEXT,
  ADD COLUMN "operatorPrivacyPolicyUrlSnapshot" TEXT,
  ADD COLUMN "operatorConsentDocumentUrlSnapshot" TEXT;

CREATE INDEX "test_student_attempts_operatorEducationOrganizationId_idx"
  ON "test_student_attempts"("operatorEducationOrganizationId");

ALTER TABLE "test_student_attempts"
  ADD CONSTRAINT "test_student_attempts_operatorEducationOrganizationId_fkey"
  FOREIGN KEY ("operatorEducationOrganizationId") REFERENCES "education_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
