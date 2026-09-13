import { Link } from 'react-router-dom';

import { pluralizeRu } from '@/shared/lib/ru-plural';

import { PolusPublicLayout } from './polus/polus-public-layout';
import { PublicThemeLayout } from './public-theme-layout';

import type { PublicTestSession } from './public-test-run.types';

interface PublicTestRunExpiredScreenProps {
  code: string;
  session: PublicTestSession;
}

const getExpiredMessage = (timeLimitMinutes: number | null) => {
  const limitText = timeLimitMinutes
    ? ` — ${timeLimitMinutes} ${pluralizeRu(timeLimitMinutes, ['минута', 'минуты', 'минут'])} —`
    : '';

  return `Время на прохождение теста${limitText} закончилось. Попытка закрыта: ответы больше не принимаются, и результат по ней не формируется.`;
};

const NEXT_STEP_MESSAGE =
  'Если по ссылке можно пройти тест еще раз, начните заново. Если попыток не осталось, обратитесь к педагогу или администратору теста.';

// Экран закрытой по времени попытки: вопросы не показываются, потому что сервер ответы уже не примет.
export function PublicTestRunExpiredScreen({ code, session }: PublicTestRunExpiredScreenProps) {
  const entryPath = `/t/${code}`;
  const message = getExpiredMessage(session.timeLimitMinutes);

  if (session.publicTemplate === 'POLUS') {
    return (
      <PolusPublicLayout view="question">
        <div className="polus-question-shell">
          <article className="polus-question-card polus-expired-card">
            <h1>Время вышло</h1>
            <p className="polus-question-description">{message}</p>
            <p className="polus-question-description">{NEXT_STEP_MESSAGE}</p>
            <div className="polus-question-actions">
              <Link className="polus-primary-action" to={entryPath}>
                Вернуться к началу теста
              </Link>
            </div>
          </article>
        </div>
      </PolusPublicLayout>
    );
  }

  return (
    <PublicThemeLayout
      branding={session.publicBranding}
      containerClassName="grid min-h-screen max-w-2xl place-items-center py-8"
    >
      <section className="public-glass w-full space-y-4 rounded-[1.75rem] px-5 py-8 text-center md:px-10">
        <h1 className="text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl">
          Время вышло
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{message}</p>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {NEXT_STEP_MESSAGE}
        </p>
        <Link
          to={entryPath}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Вернуться к началу теста
        </Link>
      </section>
    </PublicThemeLayout>
  );
}
