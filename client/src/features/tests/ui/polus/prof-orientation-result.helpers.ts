import type { ProfOrientationMethodologyEnrichment } from './prof-orientation-llm-data';
import type { ProfOrientationSummary } from './prof-orientation-summary';

export type ProfOrientationProfession = NonNullable<
  ProfOrientationSummary['primaryDirection']
>['professions'][number];

export const getProfessorStatusText = (llmStatus: string) => {
  if (llmStatus === 'pending') {
    return 'Профессор Полюс формулирует понятное ИИ-пояснение. Базовый результат ниже уже готов.';
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

export const getScoreLabel = (score: number) => {
  const roundedScore = Math.round(score);

  return `${roundedScore} ${getScoreWord(roundedScore)}`;
};

const lowerFirstLetter = (value: string) =>
  value ? `${value.slice(0, 1).toLocaleLowerCase('ru-RU')}${value.slice(1)}` : value;

const upperFirstLetter = (value: string) =>
  value ? `${value.slice(0, 1).toLocaleUpperCase('ru-RU')}${value.slice(1)}` : value;

const normalizeDashes = (value: string) => value.replace(/[‐‑‒–—]/gu, '-');

const isDigit = (value: string) => value >= '0' && value <= '9';

export const formatProfessionCode = (code: string) => {
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

export const getProfessionNote = ({
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

export const getProfessorText = ({
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

export const getProfileExplanation = ({
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
