import { BarChart3, FileText, Send, Sparkles, Target } from 'lucide-react';

import type { PublicLinkAccessResponseDtoResultKind } from '@/shared/api/model';
import type { LucideIcon } from 'lucide-react';

interface PublicTestOverviewPanelProps {
  title: string;
  description: string | null;
  questionCount: number;
  maxAttemptsPerStudent: number;
  timeLimitMinutes: number | null;
  resultKind: PublicLinkAccessResponseDtoResultKind;
  /** В анкетном режиме DEMOGRAPHIC каждый старт — новая попытка, лимит не действует. */
  showAttempts: boolean;
}

interface AfterTestPromise {
  icon: LucideIcon;
  text: string;
}

const STRENGTHS: AfterTestPromise = {
  icon: Target,
  text: 'Узнаете свои сильные стороны и профессиональные склонности.',
};

// Обещания совпадают с тем, что сервер запишет при завершении (getPlannedAnalysisKind).
const AFTER_TEST: Record<PublicLinkAccessResponseDtoResultKind, AfterTestPromise[]> = {
  ALGORITHM_AI: [
    STRENGTHS,
    { icon: BarChart3, text: 'Получите подробный анализ результатов после завершения.' },
    { icon: FileText, text: 'Получите рекомендации для выбора профессии.' },
  ],
  ALGORITHM: [
    STRENGTHS,
    { icon: BarChart3, text: 'Увидите результат по шкалам сразу после завершения.' },
  ],
  AI: [{ icon: BarChart3, text: 'Получите анализ ответов после завершения.' }],
  BASIC: [{ icon: Send, text: 'Ваши ответы получит организатор теста.' }],
};

export function PublicTestOverviewPanel({
  title,
  description,
  questionCount,
  maxAttemptsPerStudent,
  timeLimitMinutes,
  resultKind,
  showAttempts,
}: PublicTestOverviewPanelProps) {
  const isProfOrientation = resultKind === 'ALGORITHM' || resultKind === 'ALGORITHM_AI';

  return (
    <div className="order-2 space-y-6 lg:order-1">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          {isProfOrientation ? 'Система профориентации' : 'Онлайн-тестирование'}
        </div>

        <h1 className="bg-linear-to-br/srgb from-primary via-accent to-secondary bg-clip-text text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight text-transparent">
          {title}
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          {description ?? 'Публичное тестирование'}
        </p>
      </div>

      <div className={`grid gap-3 ${showAttempts ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-xs backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Вопросов</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{questionCount}</p>
        </div>
        {showAttempts ? (
          <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-xs backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Попыток</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{maxAttemptsPerStudent}</p>
          </div>
        ) : null}
        <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-xs backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Лимит времени</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {timeLimitMinutes ? `${timeLimitMinutes} мин` : 'Без лимита'}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-card/85 p-5 shadow-xs backdrop-blur-sm">
        <h4 className="font-semibold text-foreground">После прохождения</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {AFTER_TEST[resultKind].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 rounded-md bg-transparent p-1.5 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
