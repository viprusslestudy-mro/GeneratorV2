/**
 * Форматирование значений метрик
 */

export function formatValue(value, format) {
  if (value === null || value === undefined) return '—';

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'integer':
      return formatInteger(value);
    case 'decimal':
      return formatDecimal(value);
    default:
      return String(value);
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

export function formatInteger(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

export function formatDecimal(value, decimals = 2) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
