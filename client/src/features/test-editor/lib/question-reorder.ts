export const hasInvalidQuestionReorderPayload = (
  currentIds: number[],
  nextIds: number[],
): boolean => {
  if (JSON.stringify(currentIds) === JSON.stringify(nextIds)) {
    return false;
  }

  const currentIdSet = new Set(currentIds);
  const nextIdSet = new Set(nextIds);

  return (
    nextIdSet.size !== nextIds.length ||
    nextIds.length !== currentIds.length ||
    nextIds.some((id) => !currentIdSet.has(id))
  );
};

export const isBackendReorderRouteError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('numeric string is expected') ||
    normalizedMessage.includes('questionid') ||
    normalizedMessage.includes('validation failed')
  );
};
