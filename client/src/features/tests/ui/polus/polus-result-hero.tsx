import { polusAssets } from './polus-public-assets';

interface PolusResultHeroProps {
  headline: string;
  professorSummary: string;
}

export function PolusResultHero({ headline, professorSummary }: PolusResultHeroProps) {
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
