import type {
  PublicSessionGetResponseDtoSession,
  PublicSessionGetResponseDtoSessionQuestionsItem,
  PublicSessionGetResponseDtoSessionQuestionsItemOptionsItem,
  PublicSessionGetResponseDtoSessionQuestionsItemSliderBandsItem,
} from '@/shared/api/model';

export type PublicTestSession = PublicSessionGetResponseDtoSession;
export type PublicTestQuestion = PublicSessionGetResponseDtoSessionQuestionsItem;
export type PublicTestQuestionOption = PublicSessionGetResponseDtoSessionQuestionsItemOptionsItem;
export type PublicTestQuestionSliderBand =
  PublicSessionGetResponseDtoSessionQuestionsItemSliderBandsItem;
export type PublicTestAutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export type PublicTestAnswerDraft = Record<number, unknown>;
