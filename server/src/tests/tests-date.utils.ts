export const parseDateOrNull = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Date(value);
};

export const toOptionalIsoString = (value: Date | null) => {
  return value ? value.toISOString() : null;
};
