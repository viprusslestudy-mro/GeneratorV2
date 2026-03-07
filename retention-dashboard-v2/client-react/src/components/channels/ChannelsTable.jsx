/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsTable.jsx - Таблица метрик по каналам с Heatmap
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo } from 'react';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods, selectUI } from '../../store/retentionStore';
import { 
  formatValue, 
  sanitizeDiffValue, 
  getDiffClass, 
  getCellBackground 
} from '../../utils/formatters';
import styles from '../finance/FinanceTable.module.css'; // Переиспользуем стили от FinanceTable

// Базовые конфиги метрик для каждого канала
const CHANNEL_METRIC_CONFIGS = {
  mail: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'delivered', label: 'Delivered', format: 'integer' },
    { key: 'deliveryRate', label: 'Delivery Rate', format: 'percent' },
    { key: 'opened', label: 'Opened', format: 'integer' },
    { key: 'openRate', label: 'Open Rate', format: 'percent' },
    { key: 'click', label: 'Click', format: 'integer' },
    { key: 'clickRate', label: 'Click Rate', format: 'percent' },
    { key: 'conversions', label: 'Conversions', format: 'integer' },
    { key: 'conversionRate', label: 'Conversion Rate', format: 'percent' }
  ],
  push: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'opened', label: 'Opened', format: 'integer' },
    { key: 'openRate', label: 'Open Rate', format: 'percent' },
    { key: 'conversions', label: 'Conversions', format: 'integer' },
    { key: 'conversionRate', label: 'Conversion Rate', format: 'percent' }
  ],
  webpush: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'delivered', label: 'Delivered', format: 'integer' },
    { key: 'deliveryRate', label: 'Delivery Rate', format: 'percent' },
    { key: 'opened', label: 'Opened', format: 'integer' },
    { key: 'openRate', label: 'Open Rate', format: 'percent' },
    { key: 'conversions', label: 'Converted', format: 'integer' },
    { key: 'conversionRate', label: 'Convert Rate', format: 'percent' }
  ],
  sms: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'delivered', label: 'Delivered', format: 'integer' },
    { key: 'deliveryRate', label: 'Delivery Rate', format: 'percent' },
    { key: 'click', label: 'Clicked', format: 'integer' },
    { key: 'clickRate', label: 'Click Rate', format: 'percent' }
  ],
  tg: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'delivered', label: 'Delivered', format: 'integer' },
    { key: 'deliveryRate', label: 'Delivery Rate', format: 'percent' },
    { key: 'click', label: 'Clicked', format: 'integer' },
    { key: 'clickRate', label: 'Click Rate', format: 'percent' }
  ],
  wa: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'delivered', label: 'Delivered', format: 'integer' },
    { key: 'deliveryRate', label: 'Delivery Rate', format: 'percent' },
    { key: 'opened', label: 'Read', format: 'integer' },
    { key: 'openRate', label: 'Read Rate', format: 'percent' },
    { key: 'click', label: 'Clicked', format: 'integer' },
    { key: 'clickRate', label: 'Click Rate', format: 'percent' },
    { key: 'conversions', label: 'Conversions', format: 'integer' },
    { key: 'conversionRate', label: 'Conversion Rate', format: 'percent' }
  ],
  popup: [
    { key: 'sent', label: 'Sent', format: 'integer' },
    { key: 'opened', label: 'Opened', format: 'integer' },
    { key: 'openRate', label: 'Open Rate', format: 'percent' },
    { key: 'click', label: 'Clicked', format: 'integer' },
    { key: 'clickRate', label: 'Click Rate', format: 'percent' },
    { key: 'conversions', label: 'Converted', format: 'integer' },
    { key: 'conversionRate', label: 'Conversion Rate', format: 'percent' }
  ]
};

export function ChannelsTable({ period }) {
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);
  const uiSettings = useRetentionStore(selectUI);
  const channelTabsMap = uiSettings.channelTabs || {};

  // Получить доступные каналы (из всех периодов с channels)
  const availableChannels = useMemo(() => {
    const channelKeys = new Set();
    
    periods.forEach(p => {
      if (p.hasChannels && p.channelCards) {
        Object.entries(p.channelCards).forEach(([key, data]) => {
          if (key !== 'total' && !data.fullyDisabled) {
            channelKeys.add(key);
          }
        });
      }
    });

    return Array.from(channelKeys).map(key => ({
      key,
      label: channelTabsMap[key] || period?.channelCards?.[key]?.name || key
    }));
  }, [periods, period, channelTabsMap]);

  const [activeChannel, setActiveChannel] = useState(availableChannels[0]?.key || 'mail');

  // Установить активный канал при загрузке
  if (!activeChannel && availableChannels.length > 0) {
    setActiveChannel(availableChannels[0].key);
  }

  // Фильтруем периоды с Channels данными
  const channelsPeriodsData = useMemo(() => {
    return periods
      .map((p, index) => ({ ...p, originalIndex: index }))
      .filter(p => p.hasChannels);
  }, [periods]);

  // Конфиг метрик для выбранного канала
  const channelConfig = CHANNEL_METRIC_CONFIGS[activeChannel] || CHANNEL_METRIC_CONFIGS['mail'];

  // Получаем данные метрики для всех периодов
  const getMetricData = (metricKey) => {
    return channelsPeriodsData.map(periodData => {
      const channelData = periodData.channelCards?.[activeChannel];
      
      if (!channelData || channelData.fullyDisabled) {
        return { value: null, diff: '', disabled: true };
      }

      const cardId = `${activeChannel}_${metricKey}`;
      const card = (channelData.cards || []).find(c => c.id === cardId);
      
      return {
        value: card?.value ?? null,
        diff: card?.diff || '',
        disabled: card?.disabled || card?.value === null || card?.value === undefined
      };
    });
  };

  // Фильтруем только метрики с данными
  const visibleMetrics = useMemo(() => {
    return channelConfig.filter(metric => {
      const data = getMetricData(metric.key);
      return data.some(d => !d.disabled);
    });
  }, [activeChannel, channelsPeriodsData]);

  // Рендер ячейки таблицы
  const renderCell = (metric, periodData, periodIndex, isFirstPeriod) => {
    const data = getMetricData(metric.key);
    const cellData = data[periodIndex];
    const isSelected = periodData.key === selectedPeriod;

    // Если метрика выключена
    if (cellData.disabled) {
      return (
        <td 
          key={periodData.key}
          className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`}
          style={{ 
            background: isSelected ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 0, 0, 0.02)'
          }}
        >
          <div className={styles.cellContent}>
            <span className={styles.disabledLabel}>OFF</span>
          </div>
        </td>
      );
    }

    // Форматируем diff
    let diffStr = sanitizeDiffValue(cellData.diff);
    if (diffStr && diffStr !== '—') {
      const numVal = parseFloat(String(diffStr).replace('%', '').replace(',', '.').replace(/\s/g, ''));
      if (!isNaN(numVal) && numVal > 0 && !diffStr.startsWith('+')) {
        diffStr = '+' + diffStr;
      }
    }

    // Определяем background (heatmap)
    const heatmapBg = isFirstPeriod ? '#ffffff' : getCellBackground(periodIndex, diffStr);
    const finalBg = isSelected ? 'rgba(255, 179, 0, 0.15)' : heatmapBg;

    // Определяем класс для diff
    const diffClass = getDiffClass(diffStr);

    return (
      <td 
        key={periodData.key}
        className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`}
        style={{ background: finalBg }}
      >
        <div className={styles.cellContent}>
          <span className={styles.cellValue}>
            {formatValue(cellData.value, metric.format)}
          </span>
          <span className={`${styles.cellDiff} ${styles[diffClass]}`}>
            {diffStr || '—'}
          </span>
        </div>
      </td>
    );
  };

  // Нет данных
  if (visibleMetrics.length === 0 || channelsPeriodsData.length === 0) {
    return (
      <Card title="📋 Channel Metrics Breakdown">
        <div className={styles.tabs}>
          {availableChannels.map(ch => (
            <button
              key={ch.key}
              className={`${styles.tab} ${activeChannel === ch.key ? styles.active : ''}`}
              onClick={() => setActiveChannel(ch.key)}
            >
              {ch.label}
            </button>
          ))}
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyMessage}>No active metrics</div>
          <div className={styles.emptyHint}>
            No metrics available for this channel in selected periods
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="📋 Channel Metrics Breakdown">
      {/* Табы секций (Каналы) */}
      <div className={styles.tabs}>
        {availableChannels.map(ch => (
          <button
            key={ch.key}
            className={`${styles.tab} ${activeChannel === ch.key ? styles.active : ''}`}
            onClick={() => setActiveChannel(ch.key)}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>Metric</th>
              {channelsPeriodsData.map((periodData) => {
                const isSelected = periodData.key === selectedPeriod;
                return (
                  <th 
                    key={periodData.key}
                    className={`${styles.periodHeader} ${isSelected ? styles.selectedHeader : ''}`}
                  >
                    {periodData.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleMetrics.map(metric => (
              <tr key={metric.key} className={styles.row}>
                <td className={styles.metricCell}>
                  {metric.label}
                </td>
                {channelsPeriodsData.map((periodData, index) => 
                  renderCell(metric, periodData, index, index === 0)
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}