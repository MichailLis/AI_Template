import { ExternalLink } from 'lucide-react';

import { polusAssets } from './polus-public-assets';
import {
  formatProfessionCode,
  getProfessionNote,
  getProfileExplanation,
  getScoreLabel,
} from './prof-orientation-result.helpers';

import type { ProfOrientationMethodologyEnrichment } from './prof-orientation-llm-data';
import type { ProfOrientationProfession } from './prof-orientation-result.helpers';
import type { ProfOrientationSummary } from './prof-orientation-summary';

type ProfOrientationPrimaryDirection = NonNullable<ProfOrientationSummary['primaryDirection']>;

function ProfOrientationInlineList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="polus-inline-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function ProfOrientationProfileNote({
  analysis,
  meaning,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  meaning: string;
}) {
  if (!analysis) {
    return null;
  }

  return (
    <div className="polus-inline-note">
      <h4>Как читать результат</h4>
      <p>{getProfileExplanation({ analysis, meaning })}</p>
    </div>
  );
}

function ProfOrientationNextSteps({
  analysis,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
}) {
  if (!analysis) {
    return null;
  }

  return (
    <div className="polus-method-columns">
      <div className="polus-method-column">
        <h4>Первые пробы</h4>
        <ProfOrientationInlineList items={analysis.firstSteps.slice(0, 3)} />
      </div>
      <div className="polus-method-column">
        <h4>Что подтянуть</h4>
        <ProfOrientationInlineList items={analysis.learningPlan.slice(0, 3)} />
      </div>
    </div>
  );
}

function ProfOrientationAtlasAction({ url }: { url: string }) {
  return (
    <div className="polus-profession-atlas">
      <p>В атласе можно открыть подробные описания специальностей и посмотреть спрос на них.</p>
      <a
        className="polus-secondary-action polus-atlas-action polus-atlas-inline-action"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Перейти в атлас профессий
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}

function ProfOrientationProfessionRow({
  analysis,
  index,
  profession,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  index: number;
  profession: ProfOrientationProfession;
}) {
  const professionNote = getProfessionNote({
    analysis,
    index,
    profession,
  });

  return (
    <div className="polus-profession-row">
      <div className="polus-profession-main">
        <strong>{profession.title}</strong>
        <span>{formatProfessionCode(profession.code)}</span>
      </div>
      {professionNote ? <p className="polus-profession-note">{professionNote}</p> : null}
    </div>
  );
}

export function ProfOrientationHero({
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

export function ProfOrientationScoreGrid({
  directions,
}: {
  directions: ProfOrientationSummary['topDirections'];
}) {
  return (
    <div className="polus-result-grid">
      {directions.slice(0, 3).map((direction) => (
        <div className="polus-result-tile" key={direction.id}>
          <strong>{getScoreLabel(direction.score)}</strong>
          <span>{direction.name}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfOrientationProfileCard({
  analysis,
  items,
  meaning,
  title,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  items: string[];
  meaning: string;
  title: string;
}) {
  return (
    <section className="polus-profile-card" aria-label="Расширенный профиль участника">
      <div className="polus-profile-heading">
        <h3>{title}</h3>
        <p>{meaning}</p>
      </div>
      <ul className="polus-profile-bullets">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
      <ProfOrientationProfileNote analysis={analysis} meaning={meaning} />
    </section>
  );
}

export function ProfOrientationProfessionsCard({
  analysis,
  primary,
  professionAtlasUrl,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  primary: ProfOrientationPrimaryDirection;
  professionAtlasUrl?: null | string;
}) {
  return (
    <section className="polus-method-card" aria-label="Подходящие специальности">
      <span className="polus-method-label">Подходящие специальности</span>
      <div className="polus-profession-list">
        {primary.professions.map((profession, index) => (
          <ProfOrientationProfessionRow
            analysis={analysis}
            index={index}
            key={`${profession.code}-${profession.title}`}
            profession={profession}
          />
        ))}
      </div>
      {professionAtlasUrl ? <ProfOrientationAtlasAction url={professionAtlasUrl} /> : null}
    </section>
  );
}

export function ProfOrientationMiniProjectCard({
  analysis,
  miniProject,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  miniProject: string;
}) {
  return (
    <section className="polus-method-card" aria-label="Мини-проект">
      <span className="polus-method-label">Мини-проект</span>
      <p>{miniProject}</p>
      <ProfOrientationNextSteps analysis={analysis} />
    </section>
  );
}
