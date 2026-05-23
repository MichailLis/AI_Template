import { createZodDto } from 'nestjs-zod';

import { TestAnalysisResultSchema } from '../../common/analysis/test-analysis-result.contract';

export {
  TestAnalysisResultJsonSchema,
  TestAnalysisResultSchema,
  TestAnalysisSkillItemSchema,
  TestAnalysisSkillLevelSchema,
  TestAnalysisSummarySchema,
} from '../../common/analysis/test-analysis-result.contract';

export class TestAnalysisResultDto extends createZodDto(TestAnalysisResultSchema) {}
