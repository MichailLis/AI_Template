-- Replace ordered collection helper indexes with uniqueness constraints expected by schema.prisma.
DROP INDEX IF EXISTS "test_questions_versionId_order_idx";
DROP INDEX IF EXISTS "test_question_options_questionId_order_idx";
DROP INDEX IF EXISTS "test_question_slider_bands_questionId_order_idx";

CREATE UNIQUE INDEX "test_questions_versionId_order_key" ON "test_questions"("versionId", "order");
CREATE UNIQUE INDEX "test_question_options_questionId_order_key" ON "test_question_options"("questionId", "order");
CREATE UNIQUE INDEX "test_question_slider_bands_questionId_order_key" ON "test_question_slider_bands"("questionId", "order");
