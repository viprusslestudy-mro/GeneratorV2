/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsDashboard.jsx - Главный дашборд каналов коммуникации
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { usePeriodFilter } from '../../hooks/usePeriodFilter';
import { Card } from '../shared/Card/Card';
import { MetricCard } from '../shared/MetricCard/MetricCard';
import { ChannelsGrowth } from './ChannelsGrowth';
import { ChannelsLineChart } from './ChannelsLineChart';
import { ChannelsBarChart } from './ChannelsBarChart';
import { ChannelsDoughnutChart } from './ChannelsDoughnutChart';
import { ChannelsTable } from './ChannelsTable';
import styles from './ChannelsDashboard.module.css';

// Маппинг метрик для KPI (как в старом коде)
const CONTACTS_KEYS = [
  { ch: 'mail', metric: 'sent' }, { ch: 'push', metric: 'sent' },
  { ch: 'sms', metric: 'sent' }, { ch: 'tg', metric: 'sent' },
  { ch: 'wa', metric: 'sent' }, { ch: 'popup', metric: 'sent' },
  { ch: 'webpush', metric: 'sent' }
];

const CONVERSIONS_KEYS = [
  { ch: 'mail', metric: 'conversions' }, { ch: 'push', metric: 'conversions' },
  { ch: 'sms', metric: 'conversions' }, { ch: 'tg', metric: 'conversions' },
  { ch: 'wa', metric: 'conversions' }, { ch: 'popup', metric: 'conversions' },
  { ch: 'webpush', metric: 'conversions' }
];

const CLICKS_KEYS = [
  { ch: 'mail', metric: 'click' }, { ch: 'push', metric: 'opened' },
  { ch: 'sms', metric: 'click' }, { ch: 'tg', metric: 'click' },
  { ch: 'wa', metric: 'click' }, { ch: 'popup', metric: 'click' },
  { ch: 'webpush', metric: 'click' }
];

export function ChannelsDashboard() {
  const { currentPeriodData } = usePeriodFilter();

  if (!currentPeriodData || !currentPeriodData.hasChannels) {
    return (
      <div className={styles.empty}>
        <p>📈 No channel data available for this period</p>
      </div>
    );
  }

  // Helper для получения значения карточки
  const getCardValue = (chKey, metricKey) => {
    const ch = currentPeriodData.channelCards?.[chKey];
    if (!ch || !ch.cards) return null;
    const card = ch.cards.find(c => c.id === `${chKey}_${metricKey}`);
    return card?.value ?? null;
  };

  // Агрегация данных по маппингу
  const aggregateByMap = (keysMap) => {
    let total = 0;
    let hasAny = false;
    keysMap.forEach(({ ch, metric }) => {
      const val = getCardValue(ch, metric);
      if (val !== null && val !== undefined) {
        hasAny = true;
        total += Number(val);
      }
    });
    return hasAny ? total : null;
  };

  // Вычисляем KPI
  const contacts = aggregateByMap(CONTACTS_KEYS) || 0;
  const conversions = aggregateByMap(CONVERSIONS_KEYS) || 0;
  const clicks = aggregateByMap(CLICKS_KEYS) || 0;
  const conversionRate = contacts > 0 ? (conversions / contacts) : 0;

  // Формируем KPI карточки
  const kpiMetrics = [
    {
      id: 'total_contacts',
      title: 'Total Contacts',
      value: contacts,
      valueFormat: 'integer',
      icon: '✉️'
    },
    {
      id: 'total_conversions',
      title: 'Total Conversions',
      value: conversions,
      valueFormat: 'integer',
      icon: '🎯'
    },
    {
      id: 'conversion_rate',
      title: 'Conversion Rate',
      value: conversionRate,
      valueFormat: 'percent',
      icon: '📊'
    },
    {
      id: 'total_clicks',
      title: 'Total Clicks',
      value: clicks,
      valueFormat: 'integer',
      icon: '🖱️'
    }
  ];

  return (
    <div className={styles.dashboard}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1>
          <span className={styles.headerIcon}>📈</span>
          <span className={styles.headerTitle}>Communication Channels</span>
          <span className={styles.periodBadge}>{currentPeriodData.label}</span>
        </h1>
      </div>

      {/* KPI Карточки */}
      <Card title="Overall Channels KPI">
        <div className={styles.kpiGrid}>
          {kpiMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      {/* Growth Analysis (Sidebar + Detail Chart) */}
      <ChannelsGrowth />

      {/* Графики (2 колонки: Bar + Doughnut) */}
      <div className={styles.chartsRow}>
        <ChannelsBarChart />
        <ChannelsDoughnutChart />
      </div>

      {/* Line Chart (на всю ширину) */}
      <ChannelsLineChart />

      {/* Детальная таблица по каналам */}
      <ChannelsTable period={currentPeriodData} />
    </div>
  );
}