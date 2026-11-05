import { ProfOrientationResult } from '../prof-orientation/prof-orientation-result';

import { PolusResultHero } from './polus-result-hero';

import type { ProfOrientationHeroContent } from '../prof-orientation/prof-orientation-result';
import type { ComponentProps } from 'react';

const renderPolusHero = ({ headline, summary }: ProfOrientationHeroContent) => (
  <PolusResultHero headline={headline} professorSummary={summary} />
);

/**
 * The profession-orientation result in the POLUS theme: the shared result with the professor
 * as its banner. Everything else comes from the `.theme-public--polus` styles.
 */
export function PolusProfOrientationResult(
  props: Omit<ComponentProps<typeof ProfOrientationResult>, 'renderHero'>,
) {
  return <ProfOrientationResult {...props} renderHero={renderPolusHero} />;
}
