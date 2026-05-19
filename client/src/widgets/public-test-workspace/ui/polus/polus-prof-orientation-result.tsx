import { ExternalLink } from 'lucide-react';

import { parseProfOrientationMethodologyEnrichment } from './polus-prof-orientation-llm-data';
import { polusAssets } from './polus-public-assets';

import type { ProfOrientationMethodologyEnrichment } from './polus-prof-orientation-llm-data';
import type { ProfOrientationSummary } from './polus-prof-orientation-summary';

type ProfOrientationProfession = NonNullable<
  ProfOrientationSummary['primaryDirection']
>['professions'][number];

const getProfessorStatusText = (llmStatus: string) => {
  if (llmStatus === 'pending') {
    return 'Профессор Полюс формулирует короткое ИИ-пояснение. Базовый результат ниже уже готов.';
  }

  if (llmStatus === 'failed') {
    return 'Короткое ИИ-пояснение пока недоступно. Базовый результат ниже рассчитан алгоритмом методики.';
  }

  return 'Короткое ИИ-пояснение появится здесь после обработки результата.';
};

const getCompactText = (text: string, maxLength = 300) => {
  if (text.length <= maxLength) {
    return text;
  }

  const sentenceEnd = text.lastIndexOf('.', maxLength);
  const cutIndex = sentenceEnd > maxLength * 0.55 ? sentenceEnd + 1 : maxLength;

  return `${text.slice(0, cutIndex).trim()}...`;
};

const methodologyDetailMarkers = [
  'gap',
  'consistencyindex',
  'readinesstop',
  'selectedcounts',
  'slidervalues',
  'профиль ведущего направления',
  'слайдер',
  'шкал',
  'коэффициент',
  'формул',
  'флаг',
];

const hasMethodologyDetails = (text: string) => {
  const normalizedText = text.toLocaleLowerCase('ru-RU');

  return methodologyDetailMarkers.some((marker) => normalizedText.includes(marker));
};

const getScoreWord = (score: number) => {
  const normalized = Math.abs(score);
  const lastTwoDigits = normalized % 100;
  const lastDigit = normalized % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'баллов';
  }

  if (lastDigit === 1) {
    return 'балл';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'балла';
  }

  return 'баллов';
};

const getScoreLabel = (score: number) => {
  const roundedScore = Math.round(score);

  return `${roundedScore} ${getScoreWord(roundedScore)}`;
};

const lowerFirstLetter = (value: string) =>
  value ? `${value.slice(0, 1).toLocaleLowerCase('ru-RU')}${value.slice(1)}` : value;

const upperFirstLetter = (value: string) =>
  value ? `${value.slice(0, 1).toLocaleUpperCase('ru-RU')}${value.slice(1)}` : value;

const normalizeDashes = (value: string) => value.replace(/[‐‑‒–—]/gu, '-');

const isDigit = (value: string) => value >= '0' && value <= '9';

const formatProfessionCode = (code: string) => {
  const trimmedCode = code.trim();
  const codeCharacters = Array.from(trimmedCode);
  const canFormat = codeCharacters.every((character) => character === '.' || isDigit(character));
  const digits = codeCharacters.filter(isDigit).join('');

  if (!canFormat || digits.length !== 6) {
    return trimmedCode;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

const stripTextPrefix = (value: string, prefix: string) => {
  const trimmedStartValue = value.trimStart();
  const leadingWhitespaceLength = value.length - trimmedStartValue.length;
  const normalizedValue = normalizeDashes(trimmedStartValue).toLocaleLowerCase('ru-RU');
  const normalizedPrefix = normalizeDashes(prefix).toLocaleLowerCase('ru-RU');

  if (!normalizedValue.startsWith(normalizedPrefix)) {
    return value;
  }

  return value.slice(leadingWhitespaceLength + prefix.length);
};

const stripLeadingSeparators = (value: string) => {
  let result = value.trimStart();
  const separators = [':', '-', '–', '—'];

  while (separators.includes(result[0] ?? '')) {
    result = result.slice(1).trimStart();
  }

  return result;
};

const stripProfessionPrefix = (note: string, profession: ProfOrientationProfession) => {
  const trimmedNote = note.trim();
  const normalizedNote = normalizeDashes(trimmedNote).toLocaleLowerCase('ru-RU');
  const normalizedTitle = normalizeDashes(profession.title).toLocaleLowerCase('ru-RU');

  if (!normalizedNote.startsWith(normalizedTitle)) {
    return trimmedNote;
  }

  let cleanedNote = trimmedNote.slice(profession.title.length);

  if (/^\s*и\s/iu.test(cleanedNote)) {
    return trimmedNote;
  }

  const formattedCode = formatProfessionCode(profession.code);
  const codePrefixes = [
    `(код ${profession.code})`,
    `(код: ${profession.code})`,
    profession.code,
    `(код ${formattedCode})`,
    `(код: ${formattedCode})`,
    formattedCode,
  ];

  for (const prefix of codePrefixes) {
    const nextNote = stripTextPrefix(cleanedNote, prefix);

    if (nextNote !== cleanedNote) {
      cleanedNote = nextNote;
      break;
    }
  }

  return upperFirstLetter(stripLeadingSeparators(cleanedNote));
};

const getProfessionNote = ({
  analysis,
  index,
  profession,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  index: number;
  profession: ProfOrientationProfession;
}) => {
  const note = analysis?.professionNotes[index];

  if (!note) {
    return null;
  }

  const normalizedNote = normalizeDashes(note).toLocaleLowerCase('ru-RU');
  const normalizedTitle = normalizeDashes(profession.title).toLocaleLowerCase('ru-RU');

  if (!normalizedNote.includes(normalizedTitle)) {
    return null;
  }

  return stripProfessionPrefix(note, profession) || null;
};

const getProfessorFollowUp = (primary: ProfOrientationSummary['primaryDirection']) => {
  const action = primary?.resultCard.tryActions[0] ?? primary?.resultCard.miniProject;

  if (!action) {
    return 'Дальше лучше проверить это через короткую практическую пробу: так станет понятнее, насколько направление действительно подходит в работе.';
  }

  return `Дальше лучше проверить это через практическую пробу: ${lowerFirstLetter(action)}. Так результат станет не просто выводом теста, а первым шагом к понятному проекту.`;
};

const getProfessorText = ({
  analysis,
  fallback,
  primary,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  fallback: string;
  primary: ProfOrientationSummary['primaryDirection'];
}) => {
  const baseText = analysis?.professorSummary ?? analysis?.summary ?? fallback;

  if (baseText.length >= 240 || !analysis) {
    return baseText;
  }

  return `${baseText} ${getProfessorFollowUp(primary)}`;
};

const getProfileExplanation = ({
  analysis,
  meaning,
}: {
  analysis: ProfOrientationMethodologyEnrichment | null;
  meaning: string;
}) => {
  if (analysis?.summary && !hasMethodologyDetails(analysis.summary)) {
    return getCompactText(analysis.summary);
  }

  return `${meaning} Воспринимай это не как окончательный выбор профессии, а как подсказку, с какого типа задач лучше начать пробовать себя.`;
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

export function ProfOrientationResult({
  professionAtlasUrl,
  summary,
}: {
  professionAtlasUrl?: null | string;
  summary: ProfOrientationSummary;
}) {
  const primary = summary.primaryDirection;
  const headline = primary?.resultCard.headline ?? summary.profile.title;
  const meaning = primary?.resultCard.meaning ?? summary.profile.meaning;
  const llmAnalysis =
    summary.llm.status === 'ready'
      ? parseProfOrientationMethodologyEnrichment(summary.llm.analysis)
      : null;
  const professorSummary = getProfessorText({
    analysis: llmAnalysis,
    fallback:
      summary.llm.status === 'pending' ? getProfessorStatusText(summary.llm.status) : meaning,
    primary,
  });
  const topDirections = summary.topDirections.length > 0 ? summary.topDirections : [];
  const bullets = primary?.resultCard.fitsIf ?? [];
  const actions = primary?.resultCard.tryActions ?? [];
  const miniProject =
    llmAnalysis?.nextMiniProject ?? primary?.resultCard.miniProject ?? summary.profile.miniProject;

  return (
    <>
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

      <div className="polus-result-grid">
        {topDirections.slice(0, 3).map((direction) => (
          <div className="polus-result-tile" key={direction.id}>
            <strong>{getScoreLabel(direction.score)}</strong>
            <span>{direction.name}</span>
          </div>
        ))}
      </div>

      <section className="polus-profile-card" aria-label="Расширенный профиль участника">
        <div className="polus-profile-heading">
          <h3>{primary?.name ?? summary.profile.title}</h3>
          <p>{meaning}</p>
        </div>
        <ul className="polus-profile-bullets">
          {[...bullets, ...actions].slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ProfOrientationProfileNote analysis={llmAnalysis} meaning={meaning} />
      </section>

      {primary ? (
        <section className="polus-method-card" aria-label="Подходящие специальности">
          <span className="polus-method-label">Подходящие специальности</span>
          <div className="polus-profession-list">
            {primary.professions.map((profession, index) => {
              const professionNote = getProfessionNote({
                analysis: llmAnalysis,
                index,
                profession,
              });

              return (
                <div
                  className="polus-profession-row"
                  key={`${profession.code}-${profession.title}`}
                >
                  <div className="polus-profession-main">
                    <strong>{profession.title}</strong>
                    <span>{formatProfessionCode(profession.code)}</span>
                  </div>
                  {professionNote ? (
                    <p className="polus-profession-note">{professionNote}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {professionAtlasUrl ? <ProfOrientationAtlasAction url={professionAtlasUrl} /> : null}
        </section>
      ) : null}

      {miniProject ? (
        <section className="polus-method-card" aria-label="Мини-проект">
          <span className="polus-method-label">Мини-проект</span>
          <p>{miniProject}</p>
          <ProfOrientationNextSteps analysis={llmAnalysis} />
        </section>
      ) : null}
    </>
  );
}
