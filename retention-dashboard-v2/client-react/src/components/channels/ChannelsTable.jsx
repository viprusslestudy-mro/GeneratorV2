/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsTable.jsx - Динамическая таблица метрик по каналам
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo, useEffect } from 'react';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods, selectUI } from '../../store/retentionStore';
import { formatValue, sanitizeDiffValue, getDiffClass, getCellBackground } from '../../utils/formatters';
import styles from '../finance/FinanceTable.module.css'; 

export function ChannelsTable() {
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);
  const uiSettings = useRetentionStore(selectUI);
  const channelTabsMap = uiSettings.channelTabs || {};

  // Оставляем только периоды с Channels данными
  const channelsPeriodsData = useMemo(() => periods.filter(p => p.hasChannels), [periods]);

  // ДИНАМИЧЕСКИ: собираем каналы, которые ДОСТУПНЫ В ВЫБРАННОМ ПЕРИОДЕ
  // (чтобы не показывать SMS, если в этом месяце его не рассылали)
  const { availableChannels, channelConfigs } = useMemo(() => {
    const channelsSet = new Map();
    const configs = {};

    // Мы ищем конфиги по ВСЕМ периодам (чтобы собрать структуру таблицы)
    channelsPeriodsData.forEach(p => {
      if (p.channelCards) {
        Object.entries(p.channelCards).forEach(([chKey, chData]) => {
          if (chKey === 'total' || chData.fullyDisabled) return;
          
          if (!configs[chKey]) configs[chKey] = [];
          
          (chData.cards || []).forEach(card => {
            const metricKey = card.id.replace(`${chKey}_`, '');
            if (!configs[chKey].some(m => m.key === metricKey)) {
              configs[chKey].push({
                key: metricKey,
                label: card.title,
                format: card.valueFormat || 'integer'
              });
            }
          });
        });
      }
    });

    // НО табы (кнопки) мы показываем ТОЛЬКО для тех каналов, которые живы в выбранном периоде!
    const currentPeriodData = channelsPeriodsData.find(p => p.key === selectedPeriod);
    if (currentPeriodData?.channelCards) {
      Object.entries(currentPeriodData.channelCards).forEach(([chKey, chData]) => {
        // Канал считается "живым", если он не fullyDisabled и у него есть хотя бы одна карточка без disabled: true
        const isAlive = !chData.fullyDisabled && (chData.cards || []).some(c => !c.disabled && c.value !== null);
        
        if (chKey !== 'total' && isAlive) {
          channelsSet.set(chKey, {
            key: chKey,
            label: channelTabsMap[chKey] || chData.name || chKey
          });
        }
      });
    }

    return {
      availableChannels: Array.from(channelsSet.values()),
      channelConfigs: configs
    };
  }, [channelsPeriodsData, selectedPeriod, channelTabsMap]);

  const [activeChannel, setActiveChannel] = useState(availableChannels[0]?.key || '');

  // Переключаем активный канал, если текущий исчез при смене месяца
  useEffect(() => {
    if (availableChannels.length > 0 && !availableChannels.find(c => c.key === activeChannel)) {
      setActiveChannel(availableChannels[0].key);
    }
  }, [availableChannels, activeChannel]);

  // Конфиг метрик для текущего канала
  const currentChannelConfig = channelConfigs[activeChannel] || [];

  // ФИЛЬТРУЕМ КОЛОНКИ (МЕСЯЦЫ):
  // Для текущего канала оставляем только те месяцы, где канал РАБОТАЛ (не был OFF)
  const activePeriodsForChannel = useMemo(() => {
    return channelsPeriodsData.filter(p => {
      const chData = p.channelCards?.[activeChannel];
      // Оставляем месяц, если канал не disabled и есть хоть одно значение
      return chData && !chData.fullyDisabled && (chData.cards || []).some(c => !c.disabled && c.value !== null);
    });
  }, [activeChannel, channelsPeriodsData]);

  // Получаем данные ячейки
  const getMetricData = (metricKey, periodData) => {
    const channelData = periodData.channelCards?.[activeChannel];
    const cardId = `${activeChannel}_${metricKey}`;
    const card = (channelData?.cards || []).find(c => c.id === cardId);
    
    return {
      value: card?.value ?? null,
      diff: card?.diff || '',
      disabled: !card || card.disabled === true
    };
  };

  // Видимые метрики (строки)
  const visibleMetrics = useMemo(() => {
    return currentChannelConfig.filter(metric => {
      // Строка видима, если хотя бы в одном АКТИВНОМ месяце она не disabled
      return activePeriodsForChannel.some(p => {
        const data = getMetricData(metric.key, p);
        return !data.disabled && data.value !== null;
      });
    });
  }, [activeChannel, activePeriodsForChannel, currentChannelConfig]);

  if (availableChannels.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyMessage}>No active channels</div>
          <div className={styles.emptyHint}>
            No channels were active during this month
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
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
              {/* Рендерим только АКТИВНЫЕ периоды для этого канала */}
              {activePeriodsForChannel.map(periodData => (
                <th 
                  key={periodData.key}
                  className={`${styles.periodHeader} ${periodData.key === selectedPeriod ? styles.selectedHeader : ''}`}
                >
                  {periodData.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleMetrics.map(metric => (
              <tr key={metric.key} className={styles.row}>
                <td className={styles.metricCell}>{metric.label}</td>
                
                {/* Данные только по активным периодам */}
                {activePeriodsForChannel.map((periodData, index) => {
                  const cellData = getMetricData(metric.key, periodData);
                  const isSelected = periodData.key === selectedPeriod;
                  const isFirstPeriod = index === 0;

                  if (cellData.disabled || cellData.value === null) {
                    return (
                      <td key={periodData.key} className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`} style={{ background: isSelected ? 'rgba(255, 179, 0, 0.15)' : '#ffffff' }}>
                        <div className={styles.cellContent}><span className={styles.cellValue}>—</span></div>
                      </td>
                    );
                  }

                  let diffStr = sanitizeDiffValue(cellData.diff);
                  
                  // ДИНАМИЧЕСКИЙ БАЗОВЫЙ МЕСЯЦ
                  if (isFirstPeriod) {
                    diffStr = '—';
                  } else if (diffStr && diffStr !== '—') {
                    const numVal = parseFloat(String(diffStr).replace('%', '').replace(',', '.').replace(/\s/g, ''));
                    if (!isNaN(numVal) && numVal > 0 && !diffStr.startsWith('+')) diffStr = '+' + diffStr;
                  }

                  const heatmapBg = isFirstPeriod ? '#ffffff' : getCellBackground(index, diffStr);
                  const finalBg = isSelected ? 'rgba(255, 179, 0, 0.15)' : heatmapBg;
                  const diffClass = getDiffClass(diffStr);

                  return (
                    <td key={periodData.key} className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`} style={{ background: finalBg }}>
                      <div className={styles.cellContent}>
                        <span className={styles.cellValue}>{formatValue(cellData.value, metric.format)}</span>
                        <span className={`${styles.cellDiff} ${styles[diffClass]}`}>{diffStr || '—'}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}