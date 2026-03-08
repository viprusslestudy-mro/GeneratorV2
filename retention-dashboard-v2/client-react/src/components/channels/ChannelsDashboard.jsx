/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsDashboard.jsx - Главный дашборд каналов коммуникации
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionStore, selectPeriods, selectCurrentPeriod } from '../../store/retentionStore';
import { Card } from '../shared/Card/Card';
import { MetricCard } from '../shared/MetricCard/MetricCard';
import { ChannelsGrowth } from './ChannelsGrowth';
import { ChannelsLineChart } from './ChannelsLineChart';
import { ChannelsBarChart } from './ChannelsBarChart';
import { ChannelsDoughnutChart } from './ChannelsDoughnutChart';
import { ChannelsTable } from './ChannelsTable';
import styles from './ChannelsDashboard.module.css';
import { useTranslation } from '../../hooks/useTranslation';

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
  const currentPeriodData = useRetentionStore(selectCurrentPeriod);
  const periods = useRetentionStore(selectPeriods);
  const { t, translateMonth } = useTranslation();

  if (!currentPeriodData || !currentPeriodData.hasChannels) {
    return (
      <div className={styles.empty}>
        <p>📈 No channel data available for this period</p>
      </div>
    );
  }

  // Находим предыдущий период (для подсчета дельт)
  const currentIndex = periods.findIndex(p => p.key === currentPeriodData.key);
  const prevPeriodData = currentIndex > 0 ? periods[currentIndex - 1] : null;

  // Helper для получения значения
  const getCardValue = (periodData, chKey, metricKey) => {
    const ch = periodData?.channelCards?.[chKey];
    if (!ch || !ch.cards) return null;
    const card = ch.cards.find(c => c.id === `${chKey}_${metricKey}`);
    return card?.value ?? null;
  };

  // Helper для агрегации
  const aggregateByMap = (periodData, keysMap) => {
    if (!periodData) return null;
    let total = 0;
    let hasAny = false;
    keysMap.forEach(({ ch, metric }) => {
      const val = getCardValue(periodData, ch, metric);
      if (val !== null && val !== undefined) {
        hasAny = true;
        total += Number(val);
      }
    });
    return hasAny ? total : null;
  };

  // Вычисляем KPI для текущего месяца
  const contacts = aggregateByMap(currentPeriodData, CONTACTS_KEYS) || 0;
  const conversions = aggregateByMap(currentPeriodData, CONVERSIONS_KEYS) || 0;
  const clicks = aggregateByMap(currentPeriodData, CLICKS_KEYS) || 0;
  const conversionRate = contacts > 0 ? (conversions / contacts) : 0;

  // Вычисляем KPI для предыдущего месяца
  const prevContacts = aggregateByMap(prevPeriodData, CONTACTS_KEYS);
  const prevConversions = aggregateByMap(prevPeriodData, CONVERSIONS_KEYS);
  const prevClicks = aggregateByMap(prevPeriodData, CLICKS_KEYS);
  const prevConversionRate = prevContacts > 0 ? (prevConversions / prevContacts) : null;

  // Helper для вычисления строки дельты (например, "+15.2% к пред.")
  const calcDiff = (curr, prev) => {
    // Если текущее значение пустое или 0 — не показываем дельту
    if (curr === null || curr === undefined || curr === 0) return '';
    // Если предыдущее значение пустое или 0 — не показываем дельту
    if (prev === null || prev === undefined || prev === 0) return '';
    
    const diff = ((curr - prev) / Math.abs(prev)) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% ${t('к пред.', 'vs prev.')}`;
  };

  // Формируем KPI карточки
  const kpiMetrics = [
    {
      id: 'total_contacts',
      title: t('✉️ Total Contacts', 'Total Contacts'),
      value: contacts,
      diff: calcDiff(contacts, prevContacts),
      valueFormat: 'integer',
      icon: '✉️'
    },
    {
      id: 'total_conversions',
      title: t('🎯Total Conversions', 'Total Conversions'),
      value: conversions,
      diff: calcDiff(conversions, prevConversions),
      valueFormat: 'integer',
      icon: '🎯'
    },
    {
      id: 'conversion_rate',
      title: t('📊Total Conversion Rate', 'Conversion Rate'),
      value: conversionRate, // Не умножаем на 100, formatValue('percent') сделает это
      diff: calcDiff(conversionRate, prevConversionRate),
      valueFormat: 'percent',
      icon: '📊'
    },
    {
      id: 'total_clicks',
      // ИСПРАВЛЕНИЕ: Точное название из словаря (без эмодзи, просто Тотал клики)
      title: t('Тотал клики', 'Total Clicks'),
      value: clicks,
      diff: calcDiff(clicks, prevClicks),
      valueFormat: 'integer',
      icon: '🖱️'
    }
  ];

  return (
    <div className="page-container">
      <div className={styles.header}>
        <h1>
          <span className={styles.headerIcon}>📈</span>
          <span className={styles.headerTitle}>{t('tab.channels', 'Communication Channels')}</span>
          <span className={styles.periodBadge}>{translateMonth(currentPeriodData.label)}</span>
        </h1>
      </div>

      <Card>
        <div className={styles.kpiGrid}>
          {kpiMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Card>

      <ChannelsGrowth />

      <div className={styles.chartsRow}>
        <ChannelsBarChart />
        <ChannelsDoughnutChart />
      </div>

      <ChannelsLineChart />

      <ChannelsTable period={currentPeriodData} />
    </div>
  );
}