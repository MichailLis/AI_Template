import { TestAnalysisResultView } from '@/features/tests';
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
      <DialogContent className="max-w-4xl">
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

        {isLoading ? <p className="text-sm text-slate-500">Загрузка...</p> : null}

        {!isLoading && !detailAttempt ? (
          <p className="text-sm text-red-600">Не удалось получить детали прохождения.</p>
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
              <p className="text-sm text-slate-500">Ответы не найдены.</p>
            ) : (
              detailAttempt.answers.map((answer) => (
                <div
                  key={`${answer.questionId}-${answer.updatedAt}`}
                  className="rounded-md border p-3"
                >
                  <p className="text-sm font-medium text-slate-900">{answer.questionTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    #{answer.questionId} • {answer.questionType} •{' '}
                    {formatDateTime(answer.updatedAt)}
                  </p>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                    {toPrettyJson(answer.answerPayload)}
                  </pre>
                </div>
              ))
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
