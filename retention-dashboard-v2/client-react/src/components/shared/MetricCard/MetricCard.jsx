import styles from './MetricCard.module.css';
import { formatValue } from '../../../utils/formatters';

export function MetricCard({ metric }) {
  const { icon, title, value, diff, valueFormat, disabled } = metric;

  const diffClass = getDiffClass(diff);

  return (
    <div className={`${styles.metric} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>
          {disabled ? '—' : formatValue(value, valueFormat)}
        </div>
        {diff && !disabled && (
          <div className={`${styles.diff} ${styles[diffClass]}`}>
            {diff}
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
