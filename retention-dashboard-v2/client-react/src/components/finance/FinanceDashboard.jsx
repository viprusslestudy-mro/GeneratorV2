import { usePeriodFilter } from '../../hooks/usePeriodFilter';
import { Card } from '../shared/Card/Card';
import { MetricCard } from '../shared/MetricCard/MetricCard';
import { FinanceTable } from './FinanceTable';
import styles from './FinanceDashboard.module.css';

export function FinanceDashboard() {
  const { currentPeriodData } = usePeriodFilter();

  if (!currentPeriodData) {
    return (
      <div className={styles.empty}>
        <p>📊 Выберите период для отображения данных</p>
      </div>
    );
  }

  // KPI метрики (топ-4)
  const kpiMetrics = currentPeriodData.cards
    .filter(c => [
      'total_deposits_count',
      'total_deposits_amount',
      'total_profit',
      'ftd_amount'
    ].includes(c.id))
    .sort((a, b) => a.order - b.order);

  return (
    <div className={styles.dashboard}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1>💰 Finance Dashboard</h1>
        <div className={styles.periodInfo}>
          Период: <strong>{currentPeriodData.label}</strong>
        </div>
      </div>

      {/* KPI Карточки */}
      <Card title="Ключевые показатели">
        <div className={styles.kpiGrid}>
          {kpiMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      {/* Детальная таблица */}
      <FinanceTable period={currentPeriodData} />

      {/* Информация о периоде */}
      <Card title="Информация о периоде">
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>📈 Всего метрик:</span>
            <span className={styles.infoValue}>{currentPeriodData.cards.length}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>📊 Категории:</span>
            <span className={styles.infoValue}>
              {Array.from(new Set(currentPeriodData.cards.map(c => c.category))).join(', ')}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>✅ Finance данные:</span>
            <span className={styles.infoValue}>
              {currentPeriodData.hasFinance ? 'Доступны' : 'Нет данных'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>📡 Channels данные:</span>
            <span className={styles.infoValue}>
              {currentPeriodData.hasChannels ? 'Доступны' : 'Нет данных'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
