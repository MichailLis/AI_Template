import { isRecord } from '@/shared/lib/type-guards';

import type { PublicProfOrientationEnrichment } from '@/shared/api/model';

export interface ProfOrientationMethodologyEnrichment {
  professorSummary: string | null;
  summary: string;
  firstSteps: string[];
  learningPlan: string[];
  professionNotes: string[];
  nextMiniProject: string;
}

export const getProfOrientationLlmStatus = (summary: unknown) => {
  if (!isRecord(summary) || summary.resultKind !== 'prof_orientation_v3_plus') {
    return null;
  }

  const llm = isRecord(summary.llm) ? summary.llm : null;

  const status = llm?.status;

  if (
    status === 'not_requested' ||
    status === 'pending' ||
    status === 'ready' ||
    status === 'failed'
  ) {
    return status;
  }

  return 'not_requested';
};

const internalTermReplacements = [
  ['single_profile', 'ведущего направления'],
  ['mixed_profile', 'смешанный профиль'],
  ['broad_interest', 'широкий интерес'],
  ['low_definition', 'пока не определенный интерес'],
  ['primaryDirection', 'ведущее направление'],
  ['topDirections', 'близкие направления'],
  ['consistencyIndex', 'устойчивость выборов'],
  ['readinessTop', 'готовность к направлению'],
  ['selectedCounts', 'количество выборов'],
  ['sliderValues', 'оценки по шкалам'],
] as const;

const repeatedChoiceToken = 'выбор';

const isWhitespaceChar = (char: string) => char.trim().length === 0;

const isChoiceTokenBoundary = (char: string | undefined) =>
  char === undefined || char === ')' || char === ',' || isWhitespaceChar(char);

const trimTrailingWhitespace = (text: string) => {
  let endIndex = text.length;

  while (endIndex > 0 && isWhitespaceChar(text[endIndex - 1] ?? '')) {
    endIndex -= 1;
  }

  return text.slice(0, endIndex);
};

const getRepeatedChoiceNoiseEnd = (text: string, startIndex: number) => {
  let index = startIndex + 1;
  let choiceCount = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === ')' && choiceCount >= 2) {
      return index + 1;
    }

    if (char === ',' || isWhitespaceChar(char)) {
      index += 1;
      continue;
    }

    if (
      text.startsWith(repeatedChoiceToken, index) &&
      isChoiceTokenBoundary(text[index + repeatedChoiceToken.length])
    ) {
      choiceCount += 1;
      index += repeatedChoiceToken.length;
      continue;
    }

    return choiceCount >= 2 ? index : null;
  }

  return choiceCount >= 2 ? index : null;
};

const stripRepeatedChoiceNoise = (text: string) => {
  let strippedText = '';
  let index = 0;

  while (index < text.length) {
    if (text[index] === '(') {
      const noiseEnd = getRepeatedChoiceNoiseEnd(text, index);

      if (noiseEnd !== null) {
        index = noiseEnd;
        continue;
      }
    }

    strippedText += text[index];
    index += 1;
  }

  return strippedText;
};

const removeSpacesBeforePunctuation = (text: string) => {
  let normalizedText = '';

  for (const char of text) {
    if (char === ',' || char === '.' || char === ')') {
      normalizedText = trimTrailingWhitespace(normalizedText);
    }

    normalizedText += char;
  }

  return normalizedText;
};

const normalizeWhitespace = (text: string) => {
  let normalizedText = '';
  let hasPendingSpace = false;

  for (const char of text) {
    if (isWhitespaceChar(char)) {
      hasPendingSpace = true;
      continue;
    }

    if (hasPendingSpace && normalizedText) {
      normalizedText += ' ';
    }

    normalizedText += char;
    hasPendingSpace = false;
  }

  return normalizedText;
};

const trimLeadingSeparators = (text: string) => {
  let startIndex = 0;

  while (
    startIndex < text.length &&
    (text[startIndex] === ':' ||
      text[startIndex] === ';' ||
      text[startIndex] === ',' ||
      text[startIndex] === '-' ||
      text[startIndex] === '–' ||
      text[startIndex] === '—' ||
      isWhitespaceChar(text[startIndex] ?? ''))
  ) {
    startIndex += 1;
  }

  return text.slice(startIndex);
};

const sanitizeMethodologyText = (text: string) => {
  let sanitizedText = text;

  for (const [technicalTerm, readableTerm] of internalTermReplacements) {
    sanitizedText = sanitizedText.replaceAll(technicalTerm, readableTerm);
  }

  sanitizedText = sanitizedText
    .replace(/\bQ\d+_[A-Z]\d\b/gu, 'выбор')
    .replace(/\bS_[A-Z]\d\b/gu, 'шкала интереса')
    .replace(/\bR_[A-Z_]+\b/gu, 'шкала готовности')
    .replace(/\b[A-Z]\d\b\s*[—-]\s*/gu, '')
    .replace(/\b[A-Z]\d\b/gu, 'направление')
    .replace(/\bgap\s*\d+(?:[.,]\d+)?/giu, 'отрыв по баллам')
    .replace(/\blabel\s*/giu, '');

  sanitizedText = stripRepeatedChoiceNoise(sanitizedText)
    .replace(/отрыв по баллам,\s*высокая,\s*/giu, 'отрыв по баллам высокий, ')
    .replace(/устойчивость выборов\s*1/giu, 'выборы были устойчивыми')
    .replace(/по направление/giu, 'по ведущему направлению');

  return trimLeadingSeparators(
    normalizeWhitespace(removeSpacesBeforePunctuation(sanitizedText)),
  ).trim();
};

const toDisplayString = (value: string) => sanitizeMethodologyText(value.trim());

const toDisplayStrings = (values: string[], maxItems: number) =>
  values
    .filter((item) => item.trim().length > 0)
    .map(toDisplayString)
    .slice(0, maxItems);

/**
 * The model writes this text and the server hands it over as is, so a technical code can still
 * slip into it. The student sees it with those codes replaced; `null` means the LLM text is not
 * usable and the screen falls back to the card of the methodology.
 */
export const sanitizeProfOrientationEnrichment = (
  analysis: PublicProfOrientationEnrichment | null,
): ProfOrientationMethodologyEnrichment | null => {
  if (!analysis) {
    return null;
  }

  const summary = toDisplayString(analysis.summary);
  const professorSummary = analysis.professorSummary
    ? toDisplayString(analysis.professorSummary)
    : null;
  const nextMiniProject = toDisplayString(analysis.nextMiniProject);
  const firstSteps = toDisplayStrings(analysis.firstSteps, 5);
  const learningPlan = toDisplayStrings(analysis.learningPlan, 5);

  if (!summary || !nextMiniProject || firstSteps.length === 0 || learningPlan.length === 0) {
    return null;
  }

  return {
    professorSummary: professorSummary && professorSummary.length >= 24 ? professorSummary : null,
    summary,
    firstSteps,
    learningPlan,
    professionNotes: toDisplayStrings(analysis.professionNotes, 4),
    nextMiniProject,
  };
};
