import { BarChart3, Clock3, FileText, Sparkles, Target } from 'lucide-react';

interface PublicTestOverviewPanelProps {
  title: string;
  description: string | null;
  questionCount: number;
  maxAttemptsPerStudent: number;
  timeLimitMinutes: number | null;
}

export function PublicTestOverviewPanel({
  title,
  description,
  questionCount,
  maxAttemptsPerStudent,
  timeLimitMinutes,
}: PublicTestOverviewPanelProps) {
  return (
    <div className="order-2 space-y-6 lg:order-1">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Система профориентации
        </div>

        <h1 className="bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight text-transparent">
          {title}
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          {description ?? 'Публичное тестирование'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Вопросов</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{questionCount}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Попыток</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{maxAttemptsPerStudent}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Таймер</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {timeLimitMinutes ? `${timeLimitMinutes} мин` : 'Без лимита'}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-card/85 p-5 shadow-sm backdrop-blur">
        <h4 className="font-semibold text-foreground">После прохождения</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
              <Target className="h-4 w-4" />
            </span>
            <span>Узнаете свои сильные стороны и профессиональные склонности.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
              <BarChart3 className="h-4 w-4" />
            </span>
            <span>Получите подробный анализ результатов сразу после завершения.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <span>Получите персональные рекомендации для выбора профессии.</span>
          </li>
        </ul>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Время прохождения: {timeLimitMinutes ? `${timeLimitMinutes} минут` : '15-20 минут'}
          </span>
        </div>
      </div>
    </div>
  );
}
