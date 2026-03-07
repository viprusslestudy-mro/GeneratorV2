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
  if (diff.startsWith('+')) return 'positive';
  if (diff.startsWith('-')) return 'negative';
  return 'neutral';
}
