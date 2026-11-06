import { isRecord } from '../../common/type-guards';
import {
  PublicProfOrientationAtlasSchema,
  PublicProfOrientationEnrichmentSchema,
  PublicProfOrientationSummarySchema,
  type PublicProfOrientationSummary,
} from '../dto/tests-public-result.dto';
import { getProfOrientationLlmStatus } from './scoring';
import type { ProfOrientationSummary } from './types';

/** Белый список полей v3+ для ученика: поля берутся через схему, а не удаляются из сохранённого. */
const toProfOrientationEnrichment = (llm: unknown) =>
  PublicProfOrientationEnrichmentSchema.safeParse(isRecord(llm) ? llm.analysis : undefined).data ??
  null;

// A broken optional section (atlas, LLM text) must not hide the result the algorithm computed.
export const toPublicProfOrientationSummary = (
  stored: ProfOrientationSummary,
): PublicProfOrientationSummary | null => {
  const parsed = PublicProfOrientationSummarySchema.safeParse({
    ...stored,
    llm: {
      status: getProfOrientationLlmStatus(stored),
      analysis: toProfOrientationEnrichment(stored.llm),
    },
    atlas: PublicProfOrientationAtlasSchema.safeParse(stored.atlas).data ?? null,
  });

  return parsed.success ? parsed.data : null;
};
