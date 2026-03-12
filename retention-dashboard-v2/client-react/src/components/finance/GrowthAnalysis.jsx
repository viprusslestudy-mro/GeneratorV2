/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GrowthAnalysis.jsx - Анализ роста с боковой панелью метрик (ФИНАНСЫ)
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
import { SparklineChart } from './SparklineChart';
import styles from './GrowthAnalysis.module.css';
import { FINANCE_TABLE_CONFIGS } from '../../config/metricsConfig';
import { useTranslation } from '../../hooks/useTranslation';

const GROWTH_METRICS = [
  { id: 'deposits', label: 'Deposits', emoji: '💰', dataKey: 'total_deposits_amount', color: '#9c27b0', sectionKey: 'deposits' },
  { id: 'casino', label: 'Casino', emoji: '🎰', dataKey: 'casino_stake_amount', color: '#00bcd4', sectionKey: 'casino' },
  { id: 'sport', label: 'Sport', emoji: '⚽', dataKey: 'sport_stake_amount', color: '#4caf50', sectionKey: 'sport' },
  { id: 'profit', label: 'Profit', emoji: '📈', dataKey: 'total_profit', color: '#f44336', sectionKey: 'profit' }
];

function getCardValueFromPeriod(period, cardId) {
  if (!period) return null;
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
}

function getCardDiffFromPeriod(period, cardId) {
  if (!period) return '';
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? (card.diff || '') : '';
}

export function GrowthAnalysis() {
  const { t, translateMonth } = useTranslation();
  const [selectedMetricIndex, setSelectedMetricIndex] = useState(0);
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [selectedSubmetric, setSelectedSubmetric] = useState(GROWTH_METRICS[0].dataKey);
  // НОВОЕ: Режим отображения - по умолчанию значения
  const [displayMode, setDisplayMode] = useState('values'); // 'values' | 'percent'

  const rawPeriods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  const periods = useMemo(() => {
    return [...rawPeriods].reverse();
  }, [rawPeriods]);

  const financeIndices = useMemo(() => {
    return periods.map((p, i) => (p.hasFinance ? i : -1)).filter(i => i !== -1);
  }, [periods]);

  const metricsData = useMemo(() => {
    return GROWTH_METRICS.map(metric => {
      const values = periods.map(p => getCardValueFromPeriod(p, metric.dataKey));
      const diffs = periods.map(p => getCardDiffFromPeriod(p, metric.dataKey));
      
      const filteredValues = financeIndices.map(i => values[i] || 0);
      const filteredDiffs = financeIndices.map(i => diffs[i] || '');
      const momData = getMomGrowth(filteredValues);
      
      const selectedIndex = periods.findIndex(p => p.key === selectedPeriod);
      const filteredIndex = financeIndices.indexOf(selectedIndex);
      
      const isFirstPeriod = filteredIndex === 0;
      const currentDiff = filteredIndex > 0 ? filteredDiffs[filteredIndex] : '';
      const currentValue = filteredIndex >= 0 ? filteredValues[filteredIndex] : 0;
      
      const diffNum = parseDiffToNumber(currentDiff);

    // ИЗМЕНЕНО: Синхронизация с displayMode
    let displayValue;
    if (displayMode === 'values') {
      // Всегда показываем абсолютные значения
      displayValue = formatCompact(currentValue);
    } else {
      // Показываем проценты (если есть)
      const hasValidDiff = currentDiff && currentDiff !== '—' && !isFirstPeriod;
      displayValue = hasValidDiff 
        ? `${diffNum >= 0 ? '+' : ''}${diffNum.toFixed(1)}%` 
        : '—';
    }
      
      return {
        ...metric,
        values: filteredValues,
        momData,
        displayValue,
        hasData: filteredValues.some(v => v > 0)
      };
    }).filter(m => m.hasData);
  }, [periods, financeIndices, selectedPeriod, displayMode]);

  const currentMetric = metricsData[selectedMetricIndex] || metricsData[0];

  const monthLabels = useMemo(() => {
    return periods.map(p => {
      const label = p.label || '';
      const parts = label.split(' ');
      if (parts.length >= 2) return `${parts[0].substring(0, 3)} ${parts[1].substring(2)}`;
      return label.substring(0, 3);
    });
  }, [periods]);

  // ИСПРАВЛЕНО: Добавляем оба типа данных - absValue и value (проценты)
  const detailChartData = useMemo(() => {
    return financeIndices.map((periodIndex, idx) => {
      const isFirst = idx === 0;
      const isTarget = periods[periodIndex].key === selectedPeriod; 
      
      const dataPoint = { name: monthLabels[periodIndex], periodIndex, isTarget };

      GROWTH_METRICS.forEach(metric => {
        const diffStr = getCardDiffFromPeriod(periods[periodIndex], metric.dataKey);
        const absValue = getCardValueFromPeriod(periods[periodIndex], metric.dataKey);
        dataPoint[metric.id] = isFirst ? 0 : parseDiffToNumber(diffStr);
        dataPoint[`${metric.id}_abs`] = absValue || 0;
      });

      const metricKey = selectedSubmetric || currentMetric?.dataKey;
      if (metricKey) {
        const diffStr = getCardDiffFromPeriod(periods[periodIndex], metricKey);
        const absValue = getCardValueFromPeriod(periods[periodIndex], metricKey);
        dataPoint.value = isFirst ? 0 : parseDiffToNumber(diffStr);
        dataPoint.absValue = absValue || 0;
      }

      return dataPoint;
    });
  }, [periods, financeIndices, monthLabels, selectedSubmetric, currentMetric, selectedPeriod]);

  const availableSubmetrics = currentMetric ? (FINANCE_TABLE_CONFIGS[currentMetric.sectionKey] || []) : [];

  const renderDot = (color) => (props) => {
    const { cx, cy, payload } = props;
    if (payload.isTarget) {
      return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={8} fill="#ff4757" stroke="#fff" strokeWidth={2} />;
    }
    return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6} fill="#fff" stroke={color} strokeWidth={3} />;
  };

  const handleMetricClick = (index) => {
    setShowAllMetrics(false);
    setSelectedMetricIndex(index);
    if (metricsData[index]) setSelectedSubmetric(metricsData[index].dataKey);
  };

  // ИСПРАВЛЕНО: Tooltip с поддержкой обоих режимов
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    if (displayMode === 'values') {
      const val = data.absValue ?? payload[0].value;
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipLabel}>📅 {translateMonth(data.name)}</div>
          <div className={styles.tooltipValue}>💰 {formatCompact(val)}</div>
        </div>
      );
    }
    
    const val = data.value ?? payload[0].value;
    const arrow = val >= 0 ? '↗' : '↘';
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>📅 {translateMonth(data.name)}</div>
        <div className={styles.tooltipValue}>{arrow} {val > 0 ? '+' : ''}{val.toFixed(1)}%</div>
      </div>
    );
  };

  if (metricsData.length === 0) {
    return <Card><div className={styles.empty}><p>📊 No finance metrics available</p></div></Card>;
  }

  // Определяем dataKey в зависимости от режима
  const chartDataKey = displayMode === 'values' ? 'absValue' : 'value';
  const yAxisFormatter = displayMode === 'values' 
    ? (v) => formatCompact(v) 
    : (v) => `${v > 0 ? '+' : ''}${v}%`;

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <button 
            className={`${styles.showAllBtn} ${showAllMetrics ? styles.active : ''}`}
            onClick={() => setShowAllMetrics(!showAllMetrics)}
          >
            ✨ {t('✨ ОТОБРАЗИТЬ ВСЕ', 'SHOW ALL')}
          </button>
          
          <div className={styles.metricsList}>
            {metricsData.map((metric, index) => (
              <div 
                key={metric.id}
                className={`${styles.metricItem} ${!showAllMetrics && selectedMetricIndex === index ? styles.active : ''}`}
                onClick={() => handleMetricClick(index)}
              >
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>{metric.emoji} {t(metric.label)}</span>
                  <span className={styles.metricValue}>{metric.displayValue}</span>
                </div>
                <div className={styles.sparklineWrapper}>
                  <SparklineChart data={metric.momData} color={metric.color} height={40} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailChart}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitle}>
              <span className={styles.detailEmoji}>{showAllMetrics ? '✨' : currentMetric?.emoji}</span>
              <span className={styles.detailName}>{showAllMetrics ? t('Все метрики', 'All Metrics') : t(currentMetric?.label)}</span>
              <span className={styles.detailSuffix}>{t('— детальный график', '— dynamic report')}</span>
            </div>

            <div className={styles.controlsRow}>
              
              <div className={styles.submetricSelector}>
                <label className={styles.submetricLabel}>
                  <span className={styles.submetricIcon}>⚙️</span>
                  {t('Подметрика', 'Submetric:')}
                </label>
                <select 
                  className={styles.submetricSelect}
                  value={selectedSubmetric}
                  onChange={e => setSelectedSubmetric(e.target.value)}
                  disabled={showAllMetrics}
                >
                  {availableSubmetrics.map(sub => (
                    <option key={sub.key} value={sub.key}>
                      {t(sub.label)}
                    </option>
                  ))}
                </select>
              </div>

              {/* НОВОЕ: Переключатель режима отображения */}
              <div className={styles.modeToggle}>
                <button 
                  className={`${styles.modeBtn} ${displayMode === 'values' ? styles.active : ''}`}
                  onClick={() => setDisplayMode('values')}
                >
                  💰 {t('Значения', 'Values')}
                </button>
                <button 
                  className={`${styles.modeBtn} ${displayMode === 'percent' ? styles.active : ''}`}
                  onClick={() => setDisplayMode('percent')}
                >
                  📈 {t('Проценты', 'Percent')}
                </button>
              </div>

            </div>
          </div>

          <div className={styles.chartWrapper} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ minWidth: '800px', height: '400px' }}>
              <ResponsiveContainer width="99%" minHeight={300} height="100%">
                {showAllMetrics ? (
                  <LineChart data={detailChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" stroke="#666" style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} tickFormatter={(val) => translateMonth(val)} /> 
                    <YAxis stroke="#666" style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} tickFormatter={yAxisFormatter} />
                    <Tooltip content={<CustomTooltip />} />
                    {GROWTH_METRICS.map((metric) => (
                      <Line 
                        key={metric.id} 
                        type="monotone" 
                        dataKey={displayMode === 'values' ? `${metric.id}_abs` : metric.id} 
                        name={metric.label} 
                        stroke={metric.color} 
                        strokeWidth={3} 
                        dot={renderDot(metric.color)} 
                      />
                    ))}
                  </LineChart>
                ) : (
                  <AreaChart data={detailChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentMetric?.color || '#9c27b0'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={currentMetric?.color || '#9c27b0'} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" stroke="#666" style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} tickFormatter={(val) => translateMonth(val)} />
                    <YAxis stroke="#666" style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} tickFormatter={yAxisFormatter} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey={chartDataKey} 
                      stroke={currentMetric?.color || '#9c27b0'} 
                      strokeWidth={4} 
                      fill="url(#colorGrowth)" 
                      dot={renderDot(currentMetric?.color || '#9c27b0')} 
                      activeDot={{ r: 10 }} 
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