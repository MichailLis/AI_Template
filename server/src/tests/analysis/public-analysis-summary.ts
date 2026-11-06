import type { PublicAnalysisSummary } from '../dto/tests-public-result.dto';
import { getMethodologyBySummary } from '../methodology/registry';

/**
 * Projection of a stored `summary` onto what a student may see. The stored value is Prisma JSON
 * written by three independent phases (algorithm, atlas, LLM), so it is read as `unknown` and
 * every public field is picked through a schema, never deleted from the stored object. The
 * projection belongs to the methodology that recognises the summary.
 */

export const NO_PUBLIC_ANALYSIS_SUMMARY: PublicAnalysisSummary = { resultKind: 'none' };

export const toPublicAnalysisSummary = (stored: unknown): PublicAnalysisSummary =>
  getMethodologyBySummary(stored).toPublic(stored) ?? NO_PUBLIC_ANALYSIS_SUMMARY;
