interface TopicWithPublication {
  id: number;
  publishedVersionNumber: number | null;
}

interface TopicOption {
  id: number;
}

/**
 * Выбор теста в мастере создания ссылки. Ссылку можно создать только на опубликованный тест:
 * первый в списке часто свежий черновик, и мастер открывался сразу с предупреждением.
 * Для пустого списка возвращает 0.
 */
export const resolveEffectiveTopicId = (
  selectedTopicId: number | null,
  topics: TopicWithPublication[],
) => {
  if (topics.length === 0) {
    return 0;
  }

  if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
    return selectedTopicId;
  }

  return (topics.find((topic) => topic.publishedVersionNumber !== null) ?? topics[0]).id;
};

/**
 * Выбор теста в аналитике: выбранный, если он есть в списке, иначе первый. Публикация не важна —
 * опции строятся из уже созданных ссылок. Для пустого списка возвращает `null`.
 */
export const resolveEffectiveAnalyticsTopicId = (
  selectedTopicId: number | null,
  topicOptions: TopicOption[],
) => {
  if (topicOptions.length === 0) {
    return null;
  }

  if (selectedTopicId && topicOptions.some((topic) => topic.id === selectedTopicId)) {
    return selectedTopicId;
  }

  return topicOptions[0].id;
};
