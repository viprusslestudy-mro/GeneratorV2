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


/**
 * Компактное форматирование больших чисел (1000 → 1K, 1000000 → 1M)
 */
export function formatCompact(value) {
  if (value === null || value === undefined) return '—';
  
  const num = Number(value);
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'K';
  return Math.round(num).toString();
}

/**
 * Sanitize diff значений (убирает #DIV/0, NaN и т.д.)
 */
export function sanitizeDiffValue(diffStr) {
  if (diffStr === null || diffStr === undefined) return '—';
  
  const strVal = String(diffStr).trim();
  if (!strVal || strVal === '-') return '—';
  
  const upper = strVal.toUpperCase();
  if (
    upper.includes('DIV/0') ||
    upper.includes('#DIV') ||
    upper.includes('NAN') ||
    upper === 'INFINITY' ||
    upper === '-INFINITY' ||
    upper.includes('#')
  ) {
    return '—';
  }
  
  return strVal;
}

/**
 * Получить CSS класс для diff (positive/negative/base)
 */
export function getDiffClass(diff) {
  const normalized = sanitizeDiffValue(diff);
  if (!normalized || normalized === '—') return 'base';
  
  const str = String(normalized).trim();
  const parsed = parseFloat(str.replace(',', '.').replace('%', '').replace(/\s/g, ''));
  
  if (str.startsWith('+') || (!isNaN(parsed) && parsed > 0)) return 'positive';
  if ((str.startsWith('-') && /\d/.test(str)) || (!isNaN(parsed) && parsed < 0)) return 'negative';
  
  return 'base';
}

/**
 * Получить цвет фона для ячейки таблицы (heatmap)
 */
export function getCellBackground(periodIndex, diffStr) {
  if (periodIndex === 0) return '#ffffff';
  
  const normalized = sanitizeDiffValue(diffStr);
  if (!normalized || normalized === '—') return '#ffffff';
  
  const cleanStr = String(normalized)
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace('%', '')
    .replace('+', '');
  
  let val = parseFloat(cleanStr);
  
  const isNegative = String(normalized).trim().startsWith('-') && /\d/.test(normalized);
  if (isNegative) val = -Math.abs(val);
  
  if (isNaN(val) || val === 0) return '#ffffff';
  
  if (val > 0) {
    const intensity = Math.min(Math.abs(val) / 100, 1);
    const alpha = (0.08 + intensity * 0.20).toFixed(2);
    return `rgba(46, 125, 50, ${alpha})`;
  }
  
  if (val < 0) {
    const intensity = Math.min(Math.abs(val) / 100, 1);
    const alpha = (0.08 + intensity * 0.20).toFixed(2);
    return `rgba(198, 40, 40, ${alpha})`;
  }
  
  return '#ffffff';
}

/**
 * Парсинг diff строки в число
 */
export function parseDiffToNumber(diffStr) {
  if (!diffStr) return 0;
  
  const str = String(diffStr).trim()
    .replace(',', '.')
    .replace('%', '')
    .replace('+', '')
    .trim();
  
  let val = parseFloat(str);
  
  if (String(diffStr).trim().startsWith('-')) {
    val = -Math.abs(val);
  }
  
  return isNaN(val) ? 0 : val;
}

/**
 * Рассчитать MoM рост (Month over Month)
 */
export function getMomGrowth(arr) {
  return arr.map((val, i) => {
    if (i === 0) return 0;
    
    const prev = arr[i - 1] || 0;
    const curr = val || 0;
    
    if (prev === 0 && curr > 0) return 100;
    if (prev === 0 && curr === 0) return 0;
    
    return ((curr - prev) / Math.abs(prev)) * 100;
  });
}