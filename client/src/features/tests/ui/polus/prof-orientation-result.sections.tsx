import { ExternalLink } from 'lucide-react';

import { PolusResultHero } from './polus-result-hero';
import {
  formatProfessionCode,
  getProfessionNote,
  getProfileExplanation,
  getScoreLabel,
} from './prof-orientation-result.helpers';

import type { ProfOrientationMethodologyEnrichment } from './prof-orientation-llm-data';
import type { ProfOrientationProfession } from './prof-orientation-result.helpers';
import type {
  ProfOrientationAtlasProfessionCard,
  ProfOrientationAtlasRecommendation,
  ProfOrientationAtlasRecommendations,
  ProfOrientationSummary,
} from './prof-orientation-summary';

type ProfOrientationDisplayProfession = ProfOrientationProfession & {
  atlas?: null | ProfOrientationAtlasProfessionCard;
  atlasUrl?: null | string;
};

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

const atlasProfessionSourceLabels = {
  primary: 'Основная',
  secondary: 'Вторая',
} as const;

function ProfOrientationProfessionCard({
  analysis,
  index,
  profession,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  index: number;
  profession: ProfOrientationDisplayProfession;
}) {
  const professionNote = getProfessionNote({
    analysis,
    index,
    profession,
  });
  const atlasProfession = profession.atlas ?? null;
  const url = atlasProfession?.url ?? profession.atlasUrl ?? null;
  const description = atlasProfession?.summary ?? professionNote;
  const professionCode = formatProfessionCode(profession.code);
  const metaItems = [atlasProfession?.industry, atlasProfession?.municipality].filter(
    (item): item is string => Boolean(item),
  );
  const content = (
    <>
      <div className="polus-atlas-profession-header">
        <span className="polus-atlas-profession-source">
          {atlasProfession ? atlasProfessionSourceLabels[atlasProfession.source] : 'Специальность'}
        </span>
        {professionCode ? (
          <span className="polus-atlas-profession-code">Код {professionCode}</span>
        ) : null}
      </div>
      <strong>{profession.title}</strong>
      {description ? <p>{description}</p> : null}
      {metaItems.length > 0 ? (
        <div className="polus-atlas-profession-meta">
          {metaItems.map((item) => (
            <span key={`${profession.code}-${item}`}>{item}</span>
          ))}
        </div>
      ) : null}
      {atlasProfession?.skills.length ? (
        <div className="polus-atlas-skill-list">
          {atlasProfession.skills.slice(0, 4).map((skill) => (
            <span key={`${profession.code}-${skill}`}>{skill}</span>
          ))}
        </div>
      ) : null}
      {url ? <ExternalLink className="h-4 w-4" aria-hidden="true" /> : null}
      {url ? (
        <span className="polus-print-link" aria-hidden="true">
          Открыть: {url}
        </span>
      ) : null}
    </>
  );

  if (!url) {
    return <div className="polus-atlas-profession-card">{content}</div>;
  }

  return (
    <a
      aria-label={`${profession.title} в Атласе профессий`}
      className="polus-atlas-profession-card"
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      {content}
    </a>
  );
}

function ProfOrientationAtlasRecommendationList({
  items,
  layout = 'cards',
  title,
}: {
  items: ProfOrientationAtlasRecommendation[];
  layout?: 'cards' | 'events' | 'institutions';
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`polus-atlas-recommendation-group polus-atlas-recommendation-group--${layout}`}>
      <h4>{title}</h4>
      <div className="polus-atlas-recommendation-list">
        {items.slice(0, 2).map((item) => (
          <a
            className="polus-atlas-recommendation"
            href={item.url}
            key={`${title}-${item.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <strong>{item.title}</strong>
              {item.subtitle ? <small>{item.subtitle}</small> : null}
            </span>
            {item.summary ? <p>{item.summary}</p> : null}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="polus-print-link" aria-hidden="true">
              Открыть: {item.url}
            </span>
          </a>
        ))}
      </div>
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
  return <PolusResultHero headline={headline} professorSummary={professorSummary} />;
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
  professions,
  professionAtlasUrl,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  professions: ProfOrientationDisplayProfession[];
  professionAtlasUrl?: null | string;
}) {
  return (
    <section className="polus-method-card" aria-label="Подходящие специальности">
      <span className="polus-method-label">Подходящие специальности</span>
      <div className="polus-atlas-profession-grid">
        {professions.map((profession, index) => (
          <ProfOrientationProfessionCard
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

export function ProfOrientationAtlasRecommendationsCard({
  atlas,
}: {
  atlas: ProfOrientationAtlasRecommendations | null;
}) {
  if (!atlas) {
    return null;
  }

  const hasItems =
    atlas.enterprises.length > 0 || atlas.events.length > 0 || atlas.institutions.length > 0;

  if (!hasItems) {
    return null;
  }

  return (
    <section className="polus-method-card polus-atlas-result-card" aria-label="Атлас профессий">
      <span className="polus-method-label">Дальше в Атласе профессий</span>

      {atlas.status === 'partial' ? (
        <p className="polus-atlas-note">Показаны найденные совпадения по Атласу.</p>
      ) : null}

      <div className="polus-atlas-recommendation-grid">
        <ProfOrientationAtlasRecommendationList title="Предприятия" items={atlas.enterprises} />
        <ProfOrientationAtlasRecommendationList
          layout="events"
          title="Мероприятия"
          items={atlas.events}
        />
        <ProfOrientationAtlasRecommendationList
          layout="institutions"
          title="Учебные заведения"
          items={atlas.institutions}
        />
      </div>
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
