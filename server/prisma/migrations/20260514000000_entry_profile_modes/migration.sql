-- CreateEnum
CREATE TYPE "TestEntryProfileMode" AS ENUM ('DEMOGRAPHIC', 'EDUCATION');

-- CreateEnum
CREATE TYPE "TestStudentGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "TestStudentEducationLevel" AS ENUM ('BASIC_GENERAL', 'SECONDARY_GENERAL', 'SECONDARY_SPECIAL', 'INCOMPLETE_HIGHER_FROM_YEAR_3', 'HIGHER');

-- AlterTable
ALTER TABLE "test_public_links" ADD COLUMN "entryProfileMode" "TestEntryProfileMode" NOT NULL DEFAULT 'EDUCATION';

-- AlterTable
ALTER TABLE "test_student_attempts"
  ALTER COLUMN "studentName" DROP NOT NULL,
  ALTER COLUMN "studentLastInitial" DROP NOT NULL,
  ALTER COLUMN "studentMiddleInitial" DROP NOT NULL,
  ALTER COLUMN "educationOrganization" DROP NOT NULL,
  ALTER COLUMN "groupOrClass" DROP NOT NULL,
  ADD COLUMN "studentGender" "TestStudentGender",
  ADD COLUMN "studentAge" INTEGER,
  ADD COLUMN "studentResidence" TEXT,
  ADD COLUMN "studentEducationLevel" "TestStudentEducationLevel";
