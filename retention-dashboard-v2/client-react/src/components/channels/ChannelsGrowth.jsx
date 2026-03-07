/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsGrowth.jsx - Анализ роста каналов с боковой панелью
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact, parseDiffToNumber, getMomGrowth } from '../../utils/formatters';
import { SparklineChart } from '../finance/SparklineChart';
import styles from './ChannelsGrowth.module.css';

// Цвета каналов
const CHANNEL_COLORS = {
  mail: '#FFD700',
  push: '#F06292',
  sms: '#00C853',
  tg: '#0097A7',
  wa: '#25D366',
  webpush: '#29B6F6',
  popup: '#FF9100'
};

// Иконки каналов
const CHANNEL_ICONS = {
  mail: '📧', push: '📱', sms: '💬', tg: '✈️',
  wa: '📞', webpush: '🌐', popup: '🔔'
};

export function ChannelsGrowth() {
  const [selectedChannelKey, setSelectedChannelKey] = useState(null);
  const [showAllChannels, setShowAllChannels] = useState(false);
  const [selectedSubmetric, setSelectedSubmetric] = useState('sent');
  const [chartMode, setChartMode] = useState('auto'); // 'auto' | 'percent' | 'absolute'

  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  // Фильтруем индексы с channels данными
  const channelIndices = useMemo(() => {
    return periods.map((p, i) => (p.hasChannels ? i : -1)).filter(i => i !== -1);
  }, [periods]);

  // ДИНАМИЧЕСКАЯ СБОРКА КАНАЛОВ И ИХ МЕТРИК ИЗ ДАННЫХ
  const { availableChannels, channelConfigs } = useMemo(() => {
    const channelsMap = new Map();
    const configs = {};

    periods.forEach(p => {
      if (p.hasChannels && p.channelCards) {
        Object.entries(p.channelCards).forEach(([chKey, chData]) => {
          if (chKey === 'total' || chData.fullyDisabled) return;
          
          if (!channelsMap.has(chKey)) {
            channelsMap.set(chKey, {
              key: chKey,
              name: chData.name || chKey,
              icon: chData.icon || CHANNEL_ICONS[chKey] || '📊',
              color: CHANNEL_COLORS[chKey] || '#9c27b0'
            });
          }

          if (!configs[chKey]) configs[chKey] = [];
          (chData.cards || []).forEach(card => {
            const mKey = card.id.replace(`${chKey}_`, '');
            if (!configs[chKey].some(m => m.key === mKey)) {
              configs[chKey].push({ key: mKey, label: card.title });
            }
          });
        });
      }
    });

    return {
      availableChannels: Array.from(channelsMap.values()),
      channelConfigs: configs
    };
  }, [periods]);

  // Список метрик для выпадающего списка (динамический!)
  const dynamicSubmetrics = useMemo(() => {
    if (showAllChannels || !selectedChannelKey) {
      return [{ key: 'sent', label: 'Sent' }, { key: 'conversions', label: 'Conversions' }];
    }
    return channelConfigs[selectedChannelKey] || [];
  }, [showAllChannels, selectedChannelKey, channelConfigs]);

  // Устанавливаем первый канал по умолчанию
  if (!selectedChannelKey && availableChannels.length > 0) {
    setSelectedChannelKey(availableChannels[0].key);
  }

  const getChannelValue = (period, chKey, metric) => {
    if (!period?.channelCards?.[chKey]?.cards) return null;
    const card = period.channelCards[chKey].cards.find(c => c.id === `${chKey}_${metric}`);
    return card?.value ?? null;
  };

  const getChannelDiff = (period, chKey, metric) => {
    if (!period?.channelCards?.[chKey]?.cards) return '';
    const card = period.channelCards[chKey].cards.find(c => c.id === `${chKey}_${metric}`);
    return card?.diff || '';
  };

  const sidebarData = useMemo(() => {
    return availableChannels.map(ch => {
      const values = periods.map(p => getChannelValue(p, ch.key, 'sent'));
      const diffs = periods.map(p => getChannelDiff(p, ch.key, 'sent'));
      
      const filteredValues = channelIndices.map(i => values[i] || 0);
      const filteredDiffs = channelIndices.map(i => diffs[i] || '');
      
      const selectedIndex = periods.findIndex(p => p.key === selectedPeriod);
      const filteredIndex = channelIndices.indexOf(selectedIndex);
      
      const isFirstPeriod = filteredIndex === 0; // БАЗОВЫЙ МЕСЯЦ
      const currentDiff = filteredIndex > 0 ? filteredDiffs[filteredIndex] : '';
      const currentValue = filteredIndex >= 0 ? filteredValues[filteredIndex] : 0;
      
      const diffNum = parseDiffToNumber(currentDiff);
      
      // Если это первый месяц, показываем значение
      const displayValue = (currentDiff && currentDiff !== '—' && !isFirstPeriod)
        ? `${diffNum >= 0 ? '+' : ''}${diffNum.toFixed(1)}%` 
        : formatCompact(currentValue);

      return {
        ...ch,
        momData: getMomGrowth(filteredValues),
        displayValue
      };
    });
  }, [availableChannels, periods, channelIndices, selectedPeriod]);

  const chartData = useMemo(() => {
    const metricKey = selectedSubmetric;
    
    return channelIndices.map((periodIndex, idx) => {
      const isFirst = idx === 0; // БАЗОВЫЙ МЕСЯЦ
      const period = periods[periodIndex];
      const dataPoint = {
        name: period.label.split(' ').map((p,i) => i===0 ? p.substring(0,3) : p.substring(2)).join(' '),
        periodIndex
      };

      if (showAllChannels) {
        availableChannels.forEach(ch => {
          const diffStr = getChannelDiff(period, ch.key, metricKey);
          const val = getChannelValue(period, ch.key, metricKey) || 0;
          dataPoint[ch.key] = chartMode === 'absolute' ? val : (isFirst ? 0 : parseDiffToNumber(diffStr));
        });
      } else if (selectedChannelKey) {
        const diffStr = getChannelDiff(period, selectedChannelKey, metricKey);
        const val = getChannelValue(period, selectedChannelKey, metricKey) || 0;
        dataPoint.value = chartMode === 'absolute' ? val : (isFirst ? 0 : parseDiffToNumber(diffStr));
      }

      return dataPoint;
    });
  }, [channelIndices, periods, showAllChannels, availableChannels, selectedChannelKey, selectedSubmetric, chartMode]);

  const currentChannel = availableChannels.find(c => c.key === selectedChannelKey);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>📅 {payload[0].payload.name}</div>
        {payload.map((entry, idx) => {
          const val = entry.value;
          const isPercent = chartMode !== 'absolute';
          const displayVal = isPercent 
            ? `${val >= 0 ? '↗ +' : '↘ '}${val.toFixed(1)}%`
            : formatCompact(val);
            
          return (
            <div key={idx} className={styles.tooltipValue} style={{ color: entry.color }}>
              {entry.name === 'value' ? currentChannel?.name : availableChannels.find(c=>c.key===entry.name)?.name}: {displayVal}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <button 
            className={`${styles.showAllBtn} ${showAllChannels ? styles.active : ''}`}
            onClick={() => setShowAllChannels(!showAllChannels)}
          >
            ✨ SHOW ALL
          </button>
          
          <div className={styles.metricsList}>
            {sidebarData.map(ch => (
              <div 
                key={ch.key}
                className={`${styles.metricItem} ${!showAllChannels && selectedChannelKey === ch.key ? styles.active : ''}`}
                onClick={() => {
                  setShowAllChannels(false);
                  setSelectedChannelKey(ch.key);
                }}
              >
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>{ch.icon} {ch.name}</span>
                  <span className={styles.metricValue}>{ch.displayValue}</span>
                </div>
                <div className={styles.sparklineWrapper}>
                  <SparklineChart data={ch.momData} color={ch.color} height={40} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailChart}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitle}>
              <span className={styles.detailEmoji}>{showAllChannels ? '✨' : currentChannel?.icon}</span>
              <span className={styles.detailName}>{showAllChannels ? 'All Channels' : currentChannel?.name}</span>
            </div>

            <div className={styles.controlsRow}>
              <div className={styles.modeToggle}>
                <button 
                  className={`${styles.modeBtn} ${chartMode === 'percent' || chartMode === 'auto' ? styles.active : ''}`}
                  onClick={() => setChartMode('percent')}
                >📊 %</button>
                <button 
                  className={`${styles.modeBtn} ${chartMode === 'absolute' ? styles.active : ''}`}
                  onClick={() => setChartMode('absolute')}
                >📈 Values</button>
              </div>

              <div className={styles.submetricSelector}>
                <select 
                  className={styles.submetricSelect}
                  value={selectedSubmetric}
                  onChange={e => setSelectedSubmetric(e.target.value)}
                  disabled={showAllChannels}
                >
                  {dynamicSubmetrics.map(sub => (
                    <option key={sub.key} value={sub.key}>{sub.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.chartWrapper} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: '800px', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {showAllChannels ? (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" stroke="#666" style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} />
                    <YAxis 
                      stroke="#666" 
                      style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
                      tickFormatter={v => chartMode === 'absolute' ? formatCompact(v) : `${v > 0 ? '+' : ''}${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {availableChannels.map(ch => (
                      <Line
                        key={ch.key}
                        type="monotone"
                        dataKey={ch.key}
                        stroke={ch.color}
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: ch.color }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorChannels" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentChannel?.color || '#9c27b0'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={currentChannel?.color || '#9c27b0'} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" stroke="#666" style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} />
                    <YAxis 
                      stroke="#666" 
                      style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
                      tickFormatter={v => chartMode === 'absolute' ? formatCompact(v) : `${v > 0 ? '+' : ''}${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={currentChannel?.color || '#9c27b0'}
                      strokeWidth={4}
                      fill="url(#colorChannels)"
                      dot={{ r: 6, fill: '#fff', strokeWidth: 3, stroke: currentChannel?.color || '#9c27b0' }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
