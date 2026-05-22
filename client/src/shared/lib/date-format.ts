export const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const formatDateTimeOrDash = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return '—';
  }

  return formatDateTime(value);
};
