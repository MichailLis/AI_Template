import type {
  TestsTopicDetailResponseDtoDraftQuestionsItem,
  TestsTopicListResponseDtoTopicsItem,
} from '@/shared/api/model';

export type QuestionType = 'OPEN_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SLIDER';

export interface QuestionOptionDraft {
  id: string;
  label: string;
  value: string;
  weight: string;
}

export interface QuestionSliderBandDraft {
  id: string;
  minValue: string;
  maxValue: string;
  label: string;
  weight: string;
}

export interface QuestionFormState {
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  settingsText: string;
  options: QuestionOptionDraft[];
  sliderBands: QuestionSliderBandDraft[];
}

export type TestTopicListItem = TestsTopicListResponseDtoTopicsItem;
export type TestDraftQuestion = TestsTopicDetailResponseDtoDraftQuestionsItem;
