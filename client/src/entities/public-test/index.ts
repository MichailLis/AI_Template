// Всё, что видит ученик на /t/*: тема, брендинг, POLUS и экраны результата.
// Слайс не импортирует админский код — это проверяет npm run verify:public-bundle (#162).
import './theme';

export { PublicThemeLayout } from './ui/public-theme-layout';
export { PublicTestStudentAnalysisView } from './ui/public-test-student-analysis-view';
export { TestAnalysisResultView } from './ui/test-analysis-result-view';

export { getMaxChoices, isChoiceLimitReached } from './lib/public-question-choice-limit';
export { getProfOrientationLlmStatus } from './ui/polus/prof-orientation-llm-data';
export { hexToHslToken, resolvePublicBrandingTheme } from './public-branding';
export { ProfOrientationResult } from './ui/polus/prof-orientation-result';
export { polusAssets } from './ui/polus/polus-public-assets';
export { PolusResultHero } from './ui/polus/polus-result-hero';

export type {
  PublicBrandingConfig,
  PublicBrandingLogo,
  PublicBrandingStyle,
  ResolvedPublicBrandingTheme,
} from './public-branding';
