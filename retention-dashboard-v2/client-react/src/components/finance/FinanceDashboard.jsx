/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FinanceDashboard.jsx - Полный Finance Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionStore, selectCurrentPeriod } from '../../store/retentionStore';
import { Card } from '../shared/Card/Card';
import { MetricCard } from '../shared/MetricCard/MetricCard';
import { FinanceChart } from './FinanceChart';
import { BarChart } from './BarChart';
import { DoughnutChart } from './DoughnutChart';
import { GrowthAnalysis } from './GrowthAnalysis';
import { FinanceTable } from './FinanceTable';
import styles from './FinanceDashboard.module.css';
// ДОБАВЬ ИМПОРТ В НАЧАЛО:
import { useTranslation } from '../../hooks/useTranslation';

export function FinanceDashboard() {
  const currentPeriodData = useRetentionStore(selectCurrentPeriod);
  const { t } = useTranslation(); // ДОБАВЛЕН ХУК ПЕРЕВОДА

  if (!currentPeriodData) {
    return (
      <div className={styles.empty}>
        <p>📊 Select a period to view data</p>
      </div>
    );
  }

  const kpiMetrics = currentPeriodData.cards
    .filter(c => ['total_deposits_count', 'total_deposits_amount', 'total_profit', 'ftd_amount'].includes(c.id))
    .sort((a, b) => a.order - b.order)
    .map(c => ({
      ...c,
      // ИСПРАВЛЕНИЕ: Просто переводим оригинальный заголовок (например "Тотал кол-во депозитов")
      title: t(c.title)
    }));

  return (
    <div className="page-container">
      {/* Заголовок */}
      <div className={styles.header}>
        <h1>
          <span className={styles.headerTitle}>{t('tab.finance', '💰 Main Dashboard')} {new Date().getFullYear()}</span>
          {/* ПЕРЕВОДИМ МЕСЯЦ В ЗНАЧКЕ */}
          <span className={styles.periodBadge}>{t(currentPeriodData.label)}</span>
        </h1>
      </div>

      {/* KPI Карточки (УБРАН title="Key Metrics") */}
      <Card>
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
    </div>
  );
}
