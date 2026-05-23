import { PublicTestStudentAnalysisView } from '@/features/tests';
import { studentEducationLevelLabels, studentGenderLabels } from '@/shared/lib/public-test-labels';
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
  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
  professionAtlasUrl: string | null;
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: 'MALE' | 'FEMALE' | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel:
    | 'BASIC_GENERAL'
    | 'SECONDARY_GENERAL'
    | 'SECONDARY_SPECIAL'
    | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
    | 'HIGHER'
    | null;
  attemptNumber: number;
  status: string;
  analysis: AttemptAnalysis | null;
  answers: AttemptAnswer[];
}

const getAttemptDescriptionName = (attempt: AttemptDetail) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return 'Демографическая анкета';
  }

  if (attempt.entryProfileMode === 'EDUCATION_DEMOGRAPHIC') {
    return attempt.studentName ?? 'Учебные данные + демографическая анкета';
  }

  return attempt.studentName ?? 'Анкета по учебным данным';
};

const getDemographicProfileParts = (attempt: AttemptDetail) => [
  attempt.studentGender ? studentGenderLabels[attempt.studentGender] : null,
  attempt.studentAge ? `${attempt.studentAge} лет` : null,
  attempt.studentResidence,
  attempt.studentEducationLevel ? studentEducationLevelLabels[attempt.studentEducationLevel] : null,
];

const getEducationProfileParts = (attempt: AttemptDetail) => [
  attempt.studentName,
  attempt.studentLastInitial && attempt.studentMiddleInitial
    ? `${attempt.studentLastInitial}.${attempt.studentMiddleInitial}.`
    : null,
  attempt.educationOrganization,
  attempt.groupOrClass,
];

const getAttemptProfileText = (attempt: AttemptDetail) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return getDemographicProfileParts(attempt).filter(Boolean).join(' • ');
  }

  const educationDetails = getEducationProfileParts(attempt);

  if (attempt.entryProfileMode === 'EDUCATION_DEMOGRAPHIC') {
    return [...educationDetails, ...getDemographicProfileParts(attempt)]
      .filter(Boolean)
      .join(' • ');
  }

  return educationDetails.filter(Boolean).join(' • ');
};

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
                ? `${getAttemptDescriptionName(detailAttempt)} • прохождение #${
                    detailAttempt.attemptNumber
                  }`
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

          {!isLoading && detailAttempt ? (
            <div className={adminClassNames.panel.compactCard}>
              <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>
                Профиль участника
              </p>
              <p className={`mt-1 text-sm ${adminClassNames.text.muted}`}>
                {getAttemptProfileText(detailAttempt) || '—'}
              </p>
            </div>
          ) : null}

          {!isLoading && detailAttempt && detailView === 'analysis' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{detailAttempt.status}</Badge>
              </div>

              <PublicTestStudentAnalysisView
                analysis={detailAttempt.analysis}
                professionAtlasUrl={detailAttempt.professionAtlasUrl}
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
