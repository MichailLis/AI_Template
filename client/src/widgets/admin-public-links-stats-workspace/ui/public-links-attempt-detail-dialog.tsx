import { TestAnalysisResultView } from '@/features/tests';
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

type AttemptDetailView = 'analysis' | 'answers';

interface AttemptAnswer {
  questionId: number;
  questionType: string;
  questionTitle: string;
  answerPayload: unknown;
  updatedAt: string;
}

interface AttemptAnalysis {
  status: string;
  providerMode: string;
  generatedAt: string | null;
  summary: unknown;
  rawText: string | null;
  errorMessage: string | null;
}

interface AttemptDetail {
  studentName: string;
  attemptNumber: number;
  status: string;
  analysis: AttemptAnalysis | null;
  answers: AttemptAnswer[];
}

interface PublicLinksAttemptDetailDialogProps {
  isOpen: boolean;
  detailView: AttemptDetailView | null;
  detailAttempt: AttemptDetail | null;
  isLoading: boolean;
  onClose: () => void;
  formatDateTime: (value: string | null) => string;
  toPrettyJson: (value: unknown) => string;
}

export function PublicLinksAttemptDetailDialog({
  isOpen,
  detailView,
  detailAttempt,
  isLoading,
  onClose,
  formatDateTime,
  toPrettyJson,
}: PublicLinksAttemptDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`left-4 right-4 top-4 max-h-[calc(100vh-2rem)] w-auto max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:left-[50%] sm:right-auto sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:translate-x-[-50%] ${adminClassNames.dialog.content}`}
      >
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-6 pr-10">
          <DialogHeader>
            <DialogTitle>
              {detailView === 'analysis' ? 'Анализ студента' : 'Ответы студента'}
            </DialogTitle>
            <DialogDescription>
              {detailAttempt
                ? `${detailAttempt.studentName} • прохождение #${detailAttempt.attemptNumber}`
                : 'Загружаем данные прохождения...'}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <p className={`text-sm ${adminClassNames.text.muted}`}>Загрузка...</p>
          ) : null}

          {!isLoading && !detailAttempt ? (
            <p className={`text-sm ${adminToneClassNames.danger.textAccent}`}>
              Не удалось получить детали прохождения.
            </p>
          ) : null}

          {!isLoading && detailAttempt && detailView === 'analysis' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{detailAttempt.status}</Badge>
              </div>

              <TestAnalysisResultView
                analysis={detailAttempt.analysis}
                generatedAtLabel={`Сгенерировано: ${formatDateTime(
                  detailAttempt.analysis?.generatedAt ?? null,
                )}`}
              />
            </div>
          ) : null}

          {!isLoading && detailAttempt && detailView === 'answers' ? (
            <div className="space-y-3">
              {detailAttempt.answers.length === 0 ? (
                <p className={`text-sm ${adminClassNames.text.muted}`}>Ответы не найдены.</p>
              ) : (
                detailAttempt.answers.map((answer) => (
                  <div
                    key={`${answer.questionId}-${answer.updatedAt}`}
                    className={adminClassNames.panel.compactCard}
                  >
                    <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>
                      {answer.questionTitle}
                    </p>
                    <p className={`mt-1 text-xs ${adminClassNames.text.muted}`}>
                      #{answer.questionId} • {answer.questionType} •{' '}
                      {formatDateTime(answer.updatedAt)}
                    </p>
                    <pre className={`mt-2 ${adminClassNames.code.block}`}>
                      {toPrettyJson(answer.answerPayload)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
