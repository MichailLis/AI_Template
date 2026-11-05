-- ABANDONED is unused: abandoned attempts are EXPIRED. Fails (does not rewrite data) if any row still has status ABANDONED.
ALTER TYPE "TestStudentAttemptStatus" RENAME TO "TestStudentAttemptStatus_old";
CREATE TYPE "TestStudentAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED');
ALTER TABLE "test_student_attempts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "test_student_attempts" ALTER COLUMN "status" TYPE "TestStudentAttemptStatus" USING ("status"::text::"TestStudentAttemptStatus");
ALTER TABLE "test_student_attempts" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
DROP TYPE "TestStudentAttemptStatus_old";
