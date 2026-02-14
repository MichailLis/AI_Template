import { Badge } from '@/shared/ui/badge';

import { AI_QUESTION_TYPE_LABELS } from '../lib/ai-generator-utils';

import type { CreateTestsTopicFromAiDtoQuestionsItem } from '@/shared/api/model';

interface AiQuestionsPreviewProps {
  questions: CreateTestsTopicFromAiDtoQuestionsItem[];
}

export function AiQuestionsPreview({ questions }: AiQuestionsPreviewProps) {
  return (
    <div className="space-y-3 self-start rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Предпросмотр вопросов</p>
        <Badge variant="outline">{questions.length}</Badge>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-slate-500">
          Нажмите "Сгенерировать вопросы", чтобы увидеть результат перед сохранением.
        </p>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {questions.map((question, index) => (
            <div
              key={`${question.title}-${index}`}
              className="rounded-md border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                <Badge variant="outline">{AI_QUESTION_TYPE_LABELS[question.type]}</Badge>
                {question.required ? <Badge variant="outline">Обязательный</Badge> : null}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900">{question.title}</p>
              {question.description ? (
                <p className="mt-1 text-xs text-slate-600">{question.description}</p>
              ) : null}

              {question.options && question.options.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs text-slate-700">
                  {question.options.map((option, optionIndex) => (
                    <p key={`${option.value}-${optionIndex}`}>
                      - {option.label} (вес: {option.weight ?? 0})
                    </p>
                  ))}
                </div>
              ) : null}

              {question.sliderBands && question.sliderBands.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs text-slate-700">
                  {question.sliderBands.map((band, bandIndex) => (
                    <p key={`${band.label}-${bandIndex}`}>
                      - {band.label}: {band.minValue}..{band.maxValue} (вес: {band.weight ?? 0})
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
