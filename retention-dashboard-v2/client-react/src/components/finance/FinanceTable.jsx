import { useState } from 'react';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectFinanceTabs } from '../../store/retentionStore';
import { formatValue } from '../../utils/formatters';
import styles from './FinanceTable.module.css';

export function FinanceTable({ period }) {
  const financeTabs = useRetentionStore(selectFinanceTabs);

  // Берём первую секцию по умолчанию
  const sections = Object.keys(financeTabs);
  const [activeSection, setActiveSection] = useState(sections[0] || 'deposits');

  // Фильтруем метрики по выбранной секции
  const sectionMetrics = period.cards
    .filter(c => c.category === activeSection)
    .sort((a, b) => a.order - b.order);

  return (
    <Card title="📋 Детальная статистика по метрикам">
      {/* Табы секций */}
      {sections.length > 0 && (
        <div className={styles.tabs}>
          {Object.entries(financeTabs).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.tab} ${activeSection === key ? styles.active : ''}`}
              onClick={() => setActiveSection(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Таблица метрик */}
      <div className={styles.tableWrapper}>
        {sectionMetrics.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Метрика</th>
                <th className={styles.alignRight}>Значение</th>
                <th className={styles.alignRight}>Изменение</th>
              </tr>
            </thead>
            <tbody>
              {sectionMetrics.map(metric => (
                <tr
                  key={metric.id}
                  className={metric.disabled ? styles.disabled : ''}
                >
                  <td>
                    <span className={styles.icon}>{metric.icon}</span>
                    <span className={styles.metricTitle}>{metric.title}</span>
                  </td>
                  <td className={`${styles.value} ${styles.alignRight}`}>
                    {formatValue(metric.value, metric.valueFormat)}
                  </td>
                  <td className={`${getDiffClassName(metric.diff, styles)} ${styles.alignRight}`}>
                    {metric.diff || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>
            <p>📭 Нет метрик для секции "{financeTabs[activeSection] || activeSection}"</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function getDiffClassName(diff, styles) {
  const baseClass = styles.diff;
  if (!diff) return baseClass;
  if (diff.startsWith('+')) return `${baseClass} ${styles.positive}`;
  if (diff.startsWith('-')) return `${baseClass} ${styles.negative}`;
  return baseClass;
}
