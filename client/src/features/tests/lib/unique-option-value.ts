export const getUniqueOptionValue = (
  baseValue: string,
  usedValues: Set<string>,
  index: number,
): string => {
  const base = baseValue || `option_${index + 1}`;

  if (!usedValues.has(base)) {
    usedValues.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}_${suffix}`;
  while (usedValues.has(candidate)) {
    suffix += 1;
    candidate = `${base}_${suffix}`;
  }

  usedValues.add(candidate);
  return candidate;
};
