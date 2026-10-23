import { createZodDto } from '../../common/zod-dto';

import { TestAnalysisResultSchema } from '../../common/analysis/test-analysis-result.contract';

export {
  TestAnalysisResultJsonSchema,
  TestAnalysisResultSchema,
  TestAnalysisSkillItemSchema,
  TestAnalysisSkillLevelSchema,
  TestAnalysisSummarySchema,
} from '../../common/analysis/test-analysis-result.contract';

export class TestAnalysisResultDto extends createZodDto(TestAnalysisResultSchema) {}
