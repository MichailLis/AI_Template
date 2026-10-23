-- Redundant: covered by the prefix of the unique composite indexes.
DROP INDEX IF EXISTS "test_student_attempts_publicLinkId_studentKeyHash_idx";
DROP INDEX IF EXISTS "test_student_answers_attemptId_idx";
