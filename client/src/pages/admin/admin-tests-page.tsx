import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useTestsControllerCreateQuestion,
  useTestsControllerCreateTopic,
  useTestsControllerDeleteQuestion,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
  useTestsControllerPublishTopic,
  useTestsControllerUpdateQuestion,
  useTestsControllerUpdateTopicDraft,
} from '@/shared/api/generated/tests/tests';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

type QuestionType = 'OPEN_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SLIDER';

interface QuestionOptionDraft {
  id: string;
  label: string;
  value: string;
  weight: string;
}

interface QuestionSliderBandDraft {
  id: string;
  minValue: string;
  maxValue: string;
  label: string;
  weight: string;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  OPEN_TEXT: 'Открытый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  SLIDER: 'Слайдер',
};

const parseApiError = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Не удалось выполнить запрос';
  }

  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return 'Не удалось выполнить запрос';
  }

  const data = response.data;
  if (typeof data !== 'object' || data === null) {
    return 'Не удалось выполнить запрос';
  }

  if (
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'message' in data.error
  ) {
    return String(data.error.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return 'Не удалось выполнить запрос';
};

const parseSettings = (raw: string) => {
  const value = raw.trim();
  if (!value) {
    return undefined;
  }

  return JSON.parse(value) as unknown;
};

const createDraftId = () => Math.random().toString(36).slice(2, 10);

const createEmptyOptionDraft = (): QuestionOptionDraft => ({
  id: createDraftId(),
  label: '',
  value: '',
  weight: '0',
});

const createEmptySliderBandDraft = (): QuestionSliderBandDraft => ({
  id: createDraftId(),
  minValue: '0',
  maxValue: '0',
  label: '',
  weight: '0',
});

const isChoiceType = (type: QuestionType) => type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';

const normalizeOptionValue = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, '_').replace(/\|/g, '');

const parseOptionsDraft = (drafts: QuestionOptionDraft[]) => {
  const nonEmptyDrafts = drafts.filter(
    (option) => option.label.trim() || option.value.trim() || option.weight.trim(),
  );

  if (nonEmptyDrafts.length < 2) {
    throw new Error('Добавьте минимум два варианта ответа');
  }

  return nonEmptyDrafts.map((option, index) => {
    const label = option.label.trim();
    if (!label) {
      throw new Error(`Вариант ${index + 1}: заполните текст`);
    }

    const fallbackValue = normalizeOptionValue(label);
    const value = option.value.trim() || fallbackValue;

    if (!value) {
      throw new Error(`Вариант ${index + 1}: заполните код`);
    }

    const weight = Number.parseInt(option.weight.trim() || '0', 10);
    if (Number.isNaN(weight)) {
      throw new Error(`Вариант ${index + 1}: вес должен быть целым числом`);
    }

    return { label, value, weight };
  });
};

const parseSliderBandsDraft = (drafts: QuestionSliderBandDraft[]) => {
  const nonEmptyDrafts = drafts.filter(
    (band) =>
      band.minValue.trim() || band.maxValue.trim() || band.label.trim() || band.weight.trim(),
  );

  if (nonEmptyDrafts.length === 0) {
    throw new Error('Добавьте минимум один диапазон слайдера');
  }

  return nonEmptyDrafts.map((band, index) => {
    const minValue = Number.parseInt(band.minValue.trim(), 10);
    const maxValue = Number.parseInt(band.maxValue.trim(), 10);
    const weight = Number.parseInt(band.weight.trim() || '0', 10);
    const label = band.label.trim();

    if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
      throw new Error(`Диапазон ${index + 1}: min и max должны быть целыми числами`);
    }

    if (!label) {
      throw new Error(`Диапазон ${index + 1}: заполните название`);
    }

    if (Number.isNaN(weight)) {
      throw new Error(`Диапазон ${index + 1}: вес должен быть целым числом`);
    }

    return { minValue, maxValue, label, weight };
  });
};

export default function AdminTestsPage() {
  const topicsQuery = useTestsControllerListTopics();
  const createTopicMutation = useTestsControllerCreateTopic();
  const updateDraftMutation = useTestsControllerUpdateTopicDraft();
  const createQuestionMutation = useTestsControllerCreateQuestion();
  const updateQuestionMutation = useTestsControllerUpdateQuestion();
  const deleteQuestionMutation = useTestsControllerDeleteQuestion();
  const publishMutation = useTestsControllerPublishTopic();

  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [draftEdits, setDraftEdits] = useState<
    Record<number, { title: string; description: string }>
  >({});

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSlug, setNewTopicSlug] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');

  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('OPEN_TEXT');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionDescription, setQuestionDescription] = useState('');
  const [questionRequired, setQuestionRequired] = useState(true);
  const [questionSettingsText, setQuestionSettingsText] = useState('');
  const [questionOptionsDraft, setQuestionOptionsDraft] = useState<QuestionOptionDraft[]>([
    createEmptyOptionDraft(),
    createEmptyOptionDraft(),
  ]);
  const [questionBandsDraft, setQuestionBandsDraft] = useState<QuestionSliderBandDraft[]>([
    createEmptySliderBandDraft(),
  ]);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const effectiveSelectedTopicId = useMemo(() => {
    if (topics.length === 0) {
      return null;
    }

    if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topics[0].id;
  }, [selectedTopicId, topics]);

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId ?? 0, {
    query: {
      enabled: Boolean(effectiveSelectedTopicId),
    },
  });

  const draftForm = useMemo(() => {
    const draft = detailQuery.data?.draft;
    if (!draft) {
      return { id: 0, title: '', description: '' };
    }

    const edited = draftEdits[draft.id];
    return {
      id: draft.id,
      title: edited?.title ?? draft.title,
      description: edited?.description ?? draft.description ?? '',
    };
  }, [detailQuery.data?.draft, draftEdits]);

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionType('OPEN_TEXT');
    setQuestionTitle('');
    setQuestionDescription('');
    setQuestionRequired(true);
    setQuestionSettingsText('');
    setQuestionOptionsDraft([createEmptyOptionDraft(), createEmptyOptionDraft()]);
    setQuestionBandsDraft([createEmptySliderBandDraft()]);
  };

  const updateOptionDraft = (
    optionId: string,
    field: 'label' | 'value' | 'weight',
    value: string,
  ) => {
    setQuestionOptionsDraft((previous) =>
      previous.map((option) => (option.id === optionId ? { ...option, [field]: value } : option)),
    );
  };

  const addOptionDraft = () => {
    setQuestionOptionsDraft((previous) => [...previous, createEmptyOptionDraft()]);
  };

  const removeOptionDraft = (optionId: string) => {
    setQuestionOptionsDraft((previous) => {
      if (previous.length <= 2) {
        return previous;
      }

      return previous.filter((option) => option.id !== optionId);
    });
  };

  const updateSliderBandDraft = (
    bandId: string,
    field: 'minValue' | 'maxValue' | 'label' | 'weight',
    value: string,
  ) => {
    setQuestionBandsDraft((previous) =>
      previous.map((band) => (band.id === bandId ? { ...band, [field]: value } : band)),
    );
  };

  const addSliderBandDraft = () => {
    setQuestionBandsDraft((previous) => [...previous, createEmptySliderBandDraft()]);
  };

  const removeSliderBandDraft = (bandId: string) => {
    setQuestionBandsDraft((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((band) => band.id !== bandId);
    });
  };

  const openCreateQuestionModal = () => {
    resetQuestionForm();
    setIsQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false);
    resetQuestionForm();
  };

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim()) {
      toast.error('Укажите название темы');
      return;
    }

    createTopicMutation.mutate(
      {
        data: {
          title: newTopicTitle.trim(),
          slug: newTopicSlug.trim() || undefined,
          description: newTopicDescription.trim() || null,
        },
      },
      {
        onSuccess: (topic) => {
          toast.success('Тема создана');
          setNewTopicTitle('');
          setNewTopicSlug('');
          setNewTopicDescription('');
          setSelectedTopicId(topic.topicId);
          void topicsQuery.refetch();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSaveDraft = () => {
    if (!effectiveSelectedTopicId) {
      return;
    }

    updateDraftMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
        data: {
          title: draftForm.title.trim() || undefined,
          description: draftForm.description.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Черновик обновлен');
          if (draftForm.id) {
            setDraftEdits((previous) => {
              const next = { ...previous };
              delete next[draftForm.id];
              return next;
            });
          }
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSubmitQuestion = () => {
    if (!effectiveSelectedTopicId) {
      return;
    }

    if (!questionTitle.trim()) {
      toast.error('Укажите заголовок вопроса');
      return;
    }

    try {
      const payload = {
        type: questionType,
        title: questionTitle.trim(),
        description: questionDescription.trim() || null,
        required: questionRequired,
        settings: parseSettings(questionSettingsText),
        options: isChoiceType(questionType) ? parseOptionsDraft(questionOptionsDraft) : undefined,
        sliderBands:
          questionType === 'SLIDER' ? parseSliderBandsDraft(questionBandsDraft) : undefined,
      };

      if (editingQuestionId) {
        updateQuestionMutation.mutate(
          {
            topicId: effectiveSelectedTopicId,
            questionId: editingQuestionId,
            data: payload,
          },
          {
            onSuccess: () => {
              toast.success('Вопрос обновлен');
              closeQuestionModal();
              void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
            },
            onError: (error) => {
              toast.error(parseApiError(error));
            },
          },
        );

        return;
      }

      createQuestionMutation.mutate(
        {
          topicId: effectiveSelectedTopicId,
          data: payload,
        },
        {
          onSuccess: () => {
            toast.success('Вопрос добавлен');
            closeQuestionModal();
            void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
          },
          onError: (error) => {
            toast.error(parseApiError(error));
          },
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Некорректные данные вопроса');
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (!effectiveSelectedTopicId) {
      return;
    }

    deleteQuestionMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
        questionId,
      },
      {
        onSuccess: () => {
          toast.success('Вопрос удален');
          if (editingQuestionId === questionId) {
            closeQuestionModal();
          }
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleEditQuestion = (
    question: NonNullable<typeof detailQuery.data>['draft']['questions'][number],
  ) => {
    setEditingQuestionId(question.id);
    setQuestionType(question.type as QuestionType);
    setQuestionTitle(question.title);
    setQuestionDescription(question.description ?? '');
    setQuestionRequired(question.required);
    setQuestionSettingsText(
      question.settings === null || question.settings === undefined
        ? ''
        : JSON.stringify(question.settings, null, 2),
    );
    setQuestionOptionsDraft(
      question.options.length > 0
        ? question.options.map((option) => ({
            id: createDraftId(),
            label: option.label,
            value: option.value,
            weight: String(option.weight),
          }))
        : [createEmptyOptionDraft(), createEmptyOptionDraft()],
    );
    setQuestionBandsDraft(
      question.sliderBands.length > 0
        ? question.sliderBands.map((band) => ({
            id: createDraftId(),
            minValue: String(band.minValue),
            maxValue: String(band.maxValue),
            label: band.label,
            weight: String(band.weight),
          }))
        : [createEmptySliderBandDraft()],
    );
    setIsQuestionModalOpen(true);
  };

  const handlePublish = () => {
    if (!effectiveSelectedTopicId) {
      return;
    }

    publishMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Опубликована версия v${result.publishedVersionNumber}. Создан новый черновик v${result.newDraftVersionNumber}`,
          );
          closeQuestionModal();
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Темы тестов</CardTitle>
            <CardDescription>Создание и управление черновиками тем.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-topic-title">Название</Label>
              <Input
                id="new-topic-title"
                value={newTopicTitle}
                onChange={(event) => setNewTopicTitle(event.target.value)}
                placeholder="Профориентация"
              />
              <Label htmlFor="new-topic-slug">Slug (необязательно)</Label>
              <Input
                id="new-topic-slug"
                value={newTopicSlug}
                onChange={(event) => setNewTopicSlug(event.target.value)}
                placeholder="career-orientation"
              />
              <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
              <Textarea
                id="new-topic-description"
                value={newTopicDescription}
                onChange={(event) => setNewTopicDescription(event.target.value)}
                rows={3}
              />
              <Button
                className="w-full"
                onClick={handleCreateTopic}
                disabled={createTopicMutation.isPending}
              >
                {createTopicMutation.isPending ? 'Создание...' : 'Создать тему'}
              </Button>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4">
              {topicsQuery.isLoading ? (
                <p className="text-sm text-slate-500">Загрузка тем...</p>
              ) : null}
              {topicsQuery.isError ? (
                <p className="text-sm text-red-600">Не удалось загрузить темы.</p>
              ) : null}
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  variant={effectiveSelectedTopicId === topic.id ? 'secondary' : 'outline'}
                  className="h-auto w-full justify-start"
                  onClick={() => setSelectedTopicId(topic.id)}
                >
                  <div className="w-full text-left">
                    <p className="text-sm font-semibold">{topic.draftTitle}</p>
                    <p className="text-xs text-slate-500">{topic.slug}</p>
                    <p className="text-xs text-slate-500">Черновик v{topic.draftVersionNumber}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Редактор черновика</CardTitle>
            <CardDescription>Изменение данных темы, вопросов и публикация.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!effectiveSelectedTopicId ? (
              <p className="text-sm text-slate-500">Создайте тему, чтобы начать.</p>
            ) : null}
            {effectiveSelectedTopicId && detailQuery.isLoading ? (
              <p className="text-sm text-slate-500">Загрузка черновика...</p>
            ) : null}
            {effectiveSelectedTopicId && (detailQuery.isError || !detailQuery.data) ? (
              <p className="text-sm text-red-600">Не удалось загрузить черновик.</p>
            ) : null}

            {detailQuery.data ? (
              <>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Slug: {detailQuery.data.slug}</Badge>
                    <Badge variant="outline">
                      Черновик v{detailQuery.data.draft.versionNumber}
                    </Badge>
                    <Badge variant="outline">
                      Опубликовано:{' '}
                      {detailQuery.data.published
                        ? `v${detailQuery.data.published.versionNumber}`
                        : 'нет'}
                    </Badge>
                  </div>
                  <Label htmlFor="draft-title">Название черновика</Label>
                  <Input
                    id="draft-title"
                    value={draftForm.title}
                    onChange={(event) => {
                      const draft = detailQuery.data?.draft;
                      if (!draft) {
                        return;
                      }

                      setDraftEdits((previous) => ({
                        ...previous,
                        [draft.id]: {
                          title: event.target.value,
                          description: previous[draft.id]?.description ?? draft.description ?? '',
                        },
                      }));
                    }}
                  />
                  <Label htmlFor="draft-description">Описание черновика</Label>
                  <Textarea
                    id="draft-description"
                    rows={3}
                    value={draftForm.description}
                    onChange={(event) => {
                      const draft = detailQuery.data?.draft;
                      if (!draft) {
                        return;
                      }

                      setDraftEdits((previous) => ({
                        ...previous,
                        [draft.id]: {
                          title: previous[draft.id]?.title ?? draft.title,
                          description: event.target.value,
                        },
                      }));
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSaveDraft} disabled={updateDraftMutation.isPending}>
                      {updateDraftMutation.isPending ? 'Сохранение...' : 'Сохранить черновик'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handlePublish}
                      disabled={publishMutation.isPending}
                    >
                      {publishMutation.isPending ? 'Публикация...' : 'Опубликовать'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <div>
                    <p className="text-sm font-semibold">Управление вопросами</p>
                    <p className="text-xs text-slate-500">
                      Добавляйте и редактируйте вопросы через модальное окно.
                    </p>
                  </div>
                  <Button onClick={openCreateQuestionModal}>Добавить вопрос</Button>
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold">
                    Вопросы в черновике ({detailQuery.data.draft.questions.length})
                  </p>
                  {detailQuery.data.draft.questions.length === 0 ? (
                    <p className="text-sm text-slate-500">Пока нет вопросов.</p>
                  ) : null}
                  {detailQuery.data.draft.questions.map((question) => (
                    <Card key={question.id} className="border-slate-200">
                      <CardContent className="space-y-2 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              #{question.order} {question.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              Тип:{' '}
                              {QUESTION_TYPE_LABELS[question.type as QuestionType] ?? question.type}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              Изменить
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                              disabled={deleteQuestionMutation.isPending}
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {isQuestionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 md:items-center">
          <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border-slate-200 shadow-xl">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{editingQuestionId ? 'Изменить вопрос' : 'Добавить вопрос'}</CardTitle>
                <Button variant="outline" size="sm" onClick={closeQuestionModal}>
                  Закрыть
                </Button>
              </div>
              <CardDescription>
                Заполните поля и сохраните изменения. После сохранения модальное окно закроется.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="question-type-modal">Тип</Label>
              <select
                id="question-type-modal"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={questionType}
                onChange={(event) => {
                  const nextType = event.target.value as QuestionType;
                  setQuestionType(nextType);

                  if (isChoiceType(nextType) && questionOptionsDraft.length === 0) {
                    setQuestionOptionsDraft([createEmptyOptionDraft(), createEmptyOptionDraft()]);
                  }

                  if (nextType === 'SLIDER' && questionBandsDraft.length === 0) {
                    setQuestionBandsDraft([createEmptySliderBandDraft()]);
                  }
                }}
              >
                <option value="OPEN_TEXT">Открытый текст</option>
                <option value="SINGLE_CHOICE">Один вариант</option>
                <option value="MULTI_CHOICE">Несколько вариантов</option>
                <option value="SLIDER">Слайдер</option>
              </select>

              <Label htmlFor="question-title-modal">Заголовок</Label>
              <Input
                id="question-title-modal"
                value={questionTitle}
                onChange={(event) => setQuestionTitle(event.target.value)}
                placeholder="Заголовок вопроса"
              />

              <Label htmlFor="question-description-modal">Описание</Label>
              <Textarea
                id="question-description-modal"
                rows={2}
                value={questionDescription}
                onChange={(event) => setQuestionDescription(event.target.value)}
              />

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={questionRequired}
                  onChange={(event) => setQuestionRequired(event.target.checked)}
                />
                Обязательный вопрос
              </label>

              <details className="rounded-md border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-700">
                  Расширенные настройки
                </summary>
                <div className="space-y-2 border-t border-slate-200 p-3">
                  <Label htmlFor="question-settings-modal">Настройки JSON (необязательно)</Label>
                  <Textarea
                    id="question-settings-modal"
                    rows={4}
                    placeholder='{"min":0,"max":10,"step":1}'
                    value={questionSettingsText}
                    onChange={(event) => setQuestionSettingsText(event.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Используйте только для редких дополнительных параметров вопроса.
                  </p>
                </div>
              </details>

              {isChoiceType(questionType) && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Варианты ответа</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addOptionDraft}>
                      Добавить вариант
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Заполните текст и вес. Служебный код формируется автоматически.
                  </p>
                  <div className="hidden items-center gap-2 px-1 text-xs font-medium text-slate-500 md:grid md:grid-cols-[minmax(0,1fr)_8rem_2.25rem]">
                    <span>Текст варианта</span>
                    <span>Вес (целое)</span>
                    <span />
                  </div>
                  <div className="space-y-2">
                    {questionOptionsDraft.map((option, index) => (
                      <div
                        key={option.id}
                        className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 md:grid-cols-[minmax(0,1fr)_8rem_2.25rem]"
                      >
                        <Input
                          value={option.label}
                          onChange={(event) =>
                            updateOptionDraft(option.id, 'label', event.target.value)
                          }
                          placeholder={`Текст варианта ${index + 1}`}
                          aria-label={`Текст варианта ${index + 1}`}
                        />
                        <Input
                          type="number"
                          step={1}
                          value={option.weight}
                          onChange={(event) =>
                            updateOptionDraft(option.id, 'weight', event.target.value)
                          }
                          placeholder="Вес (целое)"
                          aria-label={`Вес варианта ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOptionDraft(option.id)}
                          disabled={questionOptionsDraft.length <= 2}
                          aria-label={`Удалить вариант ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questionType === 'SLIDER' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Диапазоны слайдера</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSliderBandDraft}>
                      Добавить диапазон
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {questionBandsDraft.map((band, index) => (
                      <div
                        key={band.id}
                        className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 md:grid-cols-[8rem_8rem_minmax(0,1fr)_8rem_auto]"
                      >
                        <Input
                          type="number"
                          step={1}
                          value={band.minValue}
                          onChange={(event) =>
                            updateSliderBandDraft(band.id, 'minValue', event.target.value)
                          }
                          placeholder="Мин"
                        />
                        <Input
                          type="number"
                          step={1}
                          value={band.maxValue}
                          onChange={(event) =>
                            updateSliderBandDraft(band.id, 'maxValue', event.target.value)
                          }
                          placeholder="Макс"
                        />
                        <Input
                          value={band.label}
                          onChange={(event) =>
                            updateSliderBandDraft(band.id, 'label', event.target.value)
                          }
                          placeholder={`Название диапазона ${index + 1}`}
                        />
                        <Input
                          type="number"
                          step={1}
                          value={band.weight}
                          onChange={(event) =>
                            updateSliderBandDraft(band.id, 'weight', event.target.value)
                          }
                          placeholder="Вес (целое)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSliderBandDraft(band.id)}
                          disabled={questionBandsDraft.length <= 1}
                          aria-label={`Удалить диапазон ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {editingQuestionId
                    ? updateQuestionMutation.isPending
                      ? 'Обновление...'
                      : 'Обновить вопрос'
                    : createQuestionMutation.isPending
                      ? 'Добавление...'
                      : 'Добавить вопрос'}
                </Button>
                <Button variant="outline" onClick={closeQuestionModal}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
