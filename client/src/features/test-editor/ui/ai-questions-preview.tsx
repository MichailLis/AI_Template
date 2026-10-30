import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';

import { AI_QUESTION_TYPE_LABELS } from '../lib/ai-generator-utils';

import type { CreateTestsTopicFromAiDtoQuestionsItem } from '@/shared/api/model';

interface AiQuestionsPreviewProps {
  questions: CreateTestsTopicFromAiDtoQuestionsItem[];
}

export function AiQuestionsPreview({ questions }: AiQuestionsPreviewProps) {
  return (
    <div className={`flex flex-col gap-3 self-start ${adminClassNames.panel.compactSection}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${adminClassNames.text.heading}`}>
          Предпросмотр вопросов
        </p>
        <Badge variant="outline" className={adminBadgeClassNames.info}>
          {questions.length}
        </Badge>
      </div>

      {questions.length === 0 ? (
        <p className={`text-sm ${adminClassNames.text.muted}`}>
          Нажмите "Сгенерировать вопросы", чтобы увидеть результат перед сохранением.
        </p>
      ) : (
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
          {questions.map((question, index) => (
            <div key={`${question.title}-${index}`} className={adminClassNames.panel.compactCard}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={adminBadgeClassNames.neutral}>
                  #{index + 1}
                </Badge>
                <Badge variant="outline" className={adminBadgeClassNames.info}>
                  {AI_QUESTION_TYPE_LABELS[question.type]}
                </Badge>
                {question.required ? (
                  <Badge variant="outline" className={adminBadgeClassNames.warning}>
                    Обязательный
                  </Badge>
                ) : null}
              </div>
              <p className={`mt-2 text-sm font-medium ${adminClassNames.text.heading}`}>
                {question.title}
              </p>
              {question.description ? (
                <p className={`mt-1 text-xs ${adminClassNames.text.body}`}>
                  {question.description}
                </p>
              ) : null}

              {question.options && question.options.length > 0 ? (
                <div className={`mt-2 flex flex-col gap-1 text-xs ${adminClassNames.text.body}`}>
                  {question.options.map((option, optionIndex) => (
                    <p key={`${option.value}-${optionIndex}`}>
                      - {option.label} (вес: {option.weight ?? 0})
                    </p>
                  ))}
                </div>
              ) : null}

              {question.sliderBands && question.sliderBands.length > 0 ? (
                <div className={`mt-2 flex flex-col gap-1 text-xs ${adminClassNames.text.body}`}>
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
