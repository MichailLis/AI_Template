/**
 * Человекочитаемые подписи статусов прохождения для админских экранов.
 *
 * Значения приходят с сервера как enum (`IN_PROGRESS`, `READY`, ...). Раньше они попадали в
 * интерфейс как есть: латинские слова капсом посреди русского текста. Подписи живут здесь, а не
 * рядом с таблицей, потому что одни и те же статусы показывают и таблица прохождений, и карточка
 * прохождения, и сводный отчет.
 *
 * Неизвестное значение возвращается как есть: лучше показать сырой статус, чем скрыть его за
 * прочерком, если сервер добавит новое значение раньше клиента.
 */

/**
 * `COMPLETED` — «Пройдено», а не «Завершено»: в соседней колонке стоит статус анализа со словом
 * «Готов», и два похожих слова про разные вещи читались как одно.
 */
const attemptStatusLabels: Record<string, string> = {
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Пройдено',
  EXPIRED: 'Истекло',
  ABANDONED: 'Брошено',
};

const analysisStatusLabels: Record<string, string> = {
  PENDING: 'В очереди',
  READY: 'Готов',
  FAILED: 'Ошибка',
};

export const getAttemptStatusLabel = (status: string) => attemptStatusLabels[status] ?? status;

export const getAnalysisStatusLabel = (status: string | null | undefined) => {
  if (!status) {
    return 'Нет анализа';
  }

  return analysisStatusLabels[status] ?? status;
};
