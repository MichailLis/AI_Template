import { polusAssets } from './polus-public-assets';

/**
 * The Polus result banner: the professor, the speech bubble and the two lines he says.
 *
 * Both result screens show it — the generic analysis and the prof-orientation report — and each
 * used to carry its own copy of this markup, down to the aria-label and the three speech dots.
 * Only the two strings ever differed, so those are the props.
 */
export function PolusResultHero({
  headline,
  professorSummary,
}: {
  headline: string;
  professorSummary: string;
}) {
  return (
    <div className="polus-result-hero" aria-label="Профессор Полюс рассказывает результат">
      <div className="polus-result-message">
        <p className="polus-speaker-label">Профессор Полюс говорит:</p>
        <h1>{headline}</h1>
        <p>{professorSummary}</p>
      </div>
      <div className="polus-result-professor" aria-hidden="true">
        <div className="polus-result-speech-bubble">
          <span className="polus-result-speech-dot" />
          <span className="polus-result-speech-dot" />
          <span className="polus-result-speech-dot" />
        </div>
        <div className="polus-result-professor-meta">
          <img className="polus-result-professor-figure" src={polusAssets.professor} alt="" />
          <span className="polus-result-professor-name">Профессор Полюс</span>
        </div>
      </div>
    </div>
  );
}
