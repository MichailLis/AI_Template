export const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

export const formatShare = (value: number) => `${formatNumber(value)}%`;
