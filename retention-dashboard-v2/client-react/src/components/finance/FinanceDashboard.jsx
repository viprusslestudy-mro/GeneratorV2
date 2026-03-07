/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FinanceDashboard.jsx - Полный Finance Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { usePeriodFilter } from '../../hooks/usePeriodFilter';
import { Card } from '../shared/Card/Card';
import { MetricCard } from '../shared/MetricCard/MetricCard';
import { FinanceChart } from './FinanceChart';
import { BarChart } from './BarChart';
import { DoughnutChart } from './DoughnutChart';
import { GrowthAnalysis } from './GrowthAnalysis';
import { FinanceTable } from './FinanceTable';
import styles from './FinanceDashboard.module.css';

export function FinanceDashboard() {
  const { currentPeriodData } = usePeriodFilter();

  if (!currentPeriodData) {
    return (
      <div className={styles.empty}>
        <p>📊 Select a period to view data</p>
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
        <h1>
          <span className={styles.headerIcon}>📊</span>
          <span className={styles.headerTitle}>Main Dashboard {new Date().getFullYear()}</span>
          <span className={styles.periodBadge}>{currentPeriodData.label}</span>
        </h1>
      </div>

      {/* KPI Карточки */}
      <Card title="Key Metrics">
        <div className={styles.kpiGrid}>
          {kpiMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      {/* Growth Analysis (Sidebar + Detail Chart) */}
      <GrowthAnalysis />

      {/* Графики (2 колонки: Bar + Doughnut) */}
      <div className={styles.chartsRow}>
        <BarChart />
        <DoughnutChart />
      </div>

      {/* Line Chart (на всю ширину) */}
      <FinanceChart />

      {/* Детальная таблица */}
      <FinanceTable period={currentPeriodData} />

      {/* Информация о периоде */}
      <Card title="Period Info">
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>📈 Total Metrics:</span>
            <span className={styles.infoValue}>{currentPeriodData.cards.length}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>📊 Categories:</span>
            <span className={styles.infoValue}>
              {Array.from(new Set(currentPeriodData.cards.map(c => c.category))).join(', ')}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>✅ Finance Data:</span>
            <span className={styles.infoValue}>
              {currentPeriodData.hasFinance ? 'Available' : 'No data'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
