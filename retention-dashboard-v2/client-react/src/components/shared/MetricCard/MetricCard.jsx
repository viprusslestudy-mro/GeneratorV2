import styles from './MetricCard.module.css';
import { formatValue } from '../../../utils/formatters';
import { useTranslation } from '../../../hooks/useTranslation';

export function MetricCard({ metric }) {
  const { icon, title, value, diff, valueFormat, disabled } = metric;
  const { t } = useTranslation();

  const diffClass = getDiffClass(diff);

  // Форматируем дельту: добавляем "к пред.", если его там еще нет
  let displayDiff = diff;
  if (diff && typeof diff === 'string' && !diff.includes('пред.') && !diff.includes('prev.')) {
    const suffix = t('к пред.', 'vs prev.');
    displayDiff = `${diff} ${suffix}`;
  }

  return (
    <div className={`${styles.metric} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.content}>
        <div className={styles.title}>
          <span className={styles.icon}>{icon}</span>
          <span>{title}</span>
        </div>
        <div className={styles.value}>
          {disabled ? '—' : formatValue(value, valueFormat)}
        </div>
        {displayDiff && !disabled && (
          <div className={`${styles.diff} ${styles[diffClass]}`}>
            {displayDiff}
          </div>
        )}
      </div>
    </div>
  );
}

function getDiffClass(diff) {
  if (!diff) return '';
  
  // Если уже есть знак — используем его
  if (diff.startsWith('+')) return 'positive';
  if (diff.startsWith('-')) return 'negative';
  
  // Парсим число из строки (заменяем запятую на точку)
  const numStr = diff.replace(/[^0-9,.-]/g, '').replace(',', '.');
  const num = parseFloat(numStr);
  
  if (isNaN(num) || num === 0) return 'neutral';
  if (num > 0) return 'positive';
  if (num < 0) return 'negative';
  
  return 'neutral';
}
