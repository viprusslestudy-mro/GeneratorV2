/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GrowthAnalysis.jsx - Анализ роста с боковой панелью метрик
 *  ИСПРАВЛЕНО: Убраны inline селекторы, добавлено кэширование
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo } from 'react';
import { 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact, parseDiffToNumber, getMomGrowth } from '../../utils/formatters';
import { SparklineChart } from './SparklineChart';
import styles from './GrowthAnalysis.module.css';

// Конфигурация метрик для Growth Sidebar
const GROWTH_METRICS = [
  { 
    id: 'deposits', 
    label: 'Deposits', 
    emoji: '💰', 
    dataKey: 'total_deposits_amount',
    color: '#9c27b0',
    sectionKey: 'deposits'
  },
  { 
    id: 'casino', 
    label: 'Casino', 
    emoji: '🎰', 
    dataKey: 'casino_stake_amount',
    color: '#00bcd4',
    sectionKey: 'casino'
  },
  { 
    id: 'sport', 
    label: 'Sport', 
    emoji: '⚽', 
    dataKey: 'sport_stake_amount',
    color: '#4caf50',
    sectionKey: 'sport'
  },
  { 
    id: 'profit', 
    label: 'Profit', 
    emoji: '📈', 
    dataKey: 'total_profit',
    color: '#f44336',
    sectionKey: 'profit'
  }
];

// Подметрики для каждой секции
const SUBMETRICS = {
  deposits: [
    { key: 'total_deposits_amount', label: 'Total Deposits Sum' },
    { key: 'total_deposits_count', label: 'Total Deposits Count' },
    { key: 'ftd_amount', label: 'FTD Amount' }
  ],
  casino: [
    { key: 'casino_stake_amount', label: 'Total Stakes' },
    { key: 'casino_stake_count', label: 'Stakes Count' }
  ],
  sport: [
    { key: 'sport_stake_amount', label: 'Total Stakes' },
    { key: 'sport_stake_count', label: 'Stakes Count' }
  ],
  profit: [
    { key: 'total_profit', label: 'Total Profit' },
    { key: 'avg_profit_per_day', label: 'Avg Profit/Day' }
  ]
};

// Helper: получить значение карточки
function getCardValueFromPeriod(period, cardId) {
  if (!period) return null;
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
}

// Helper: получить diff карточки
function getCardDiffFromPeriod(period, cardId) {
  if (!period) return '';
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? (card.diff || '') : '';
}

export function GrowthAnalysis() {
  const [selectedMetricIndex, setSelectedMetricIndex] = useState(0);
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [selectedSubmetric, setSelectedSubmetric] = useState(GROWTH_METRICS[0].dataKey);

  // Простые селекторы (не создают новые объекты)
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  // Фильтруем только периоды с Finance данными
  const financeIndices = useMemo(() => {
    return periods
      .map((p, i) => (p.hasFinance ? i : -1))
      .filter(i => i !== -1);
  }, [periods]);

  // Подготовка данных для метрик sidebar (кэшировано через useMemo)
  const metricsData = useMemo(() => {
    return GROWTH_METRICS.map(metric => {
      // Получаем значения по всем периодам
      const values = periods.map(p => getCardValueFromPeriod(p, metric.dataKey));
      const diffs = periods.map(p => getCardDiffFromPeriod(p, metric.dataKey));
      
      // Фильтруем только finance периоды
      const filteredValues = financeIndices.map(i => values[i] || 0);
      const filteredDiffs = financeIndices.map(i => diffs[i] || '');
      
      // MoM данные для sparkline
      const momData = getMomGrowth(filteredValues);
      
      // Текущее значение/diff
      const selectedIndex = periods.findIndex(p => p.key === selectedPeriod);
      const filteredIndex = financeIndices.indexOf(selectedIndex);
      const currentDiff = filteredIndex >= 0 ? filteredDiffs[filteredIndex] : '';
      const currentValue = filteredIndex >= 0 ? filteredValues[filteredIndex] : 0;
      
      // Парсим diff
      const diffNum = parseDiffToNumber(currentDiff);
      const displayValue = currentDiff && currentDiff !== '—' 
        ? `${diffNum >= 0 ? '+' : ''}${diffNum.toFixed(1)}%`
        : formatCompact(currentValue);
      
      return {
        ...metric,
        values: filteredValues,
        momData,
        displayValue,
        hasData: filteredValues.some(v => v > 0)
      };
    }).filter(m => m.hasData);
  }, [periods, financeIndices, selectedPeriod]);

  // Текущая выбранная метрика
  const currentMetric = metricsData[selectedMetricIndex] || metricsData[0];

  // Метки месяцев (кэшировано)
  const monthLabels = useMemo(() => {
    return periods.map(p => {
      const label = p.label || '';
      const parts = label.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].substring(0, 3)} ${parts[1].substring(2)}`;
      }
      return label.substring(0, 3);
    });
  }, [periods]);

  // Подготовка данных для детального графика (кэшировано)
  const detailChartData = useMemo(() => {
    const metricKey = selectedSubmetric || currentMetric?.dataKey;
    if (!metricKey) return [];
    
    const diffs = periods.map(p => getCardDiffFromPeriod(p, metricKey));
    
    return financeIndices.map(periodIndex => {
      const diffStr = diffs[periodIndex] || '';
      const momValue = parseDiffToNumber(diffStr);
      
      return {
        name: monthLabels[periodIndex],
        value: momValue,
        periodIndex
      };
    });
  }, [periods, financeIndices, monthLabels, selectedSubmetric, currentMetric]);

  // Доступные подметрики для текущей секции
  const availableSubmetrics = currentMetric 
    ? (SUBMETRICS[currentMetric.sectionKey] || [])
    : [];

  // Обработчики
  const handleMetricClick = (index) => {
    setShowAllMetrics(false);
    setSelectedMetricIndex(index);
    
    const metric = metricsData[index];
    if (metric) {
      setSelectedSubmetric(metric.dataKey);
    }
  };

  const handleShowAll = () => {
    setShowAllMetrics(!showAllMetrics);
  };

  const handleSubmetricChange = (e) => {
    setSelectedSubmetric(e.target.value);
  };

  // Кастомный Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const val = data.value;
    const arrow = val >= 0 ? '↗' : '↘';
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>📅 {data.name}</div>
        <div className={styles.tooltipValue}>
          {arrow} {val > 0 ? '+' : ''}{val.toFixed(1)}%
        </div>
      </div>
    );
  };

  if (metricsData.length === 0) {
    return (
      <Card>
        <div className={styles.empty}>
          <p>📊 No finance metrics available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.container}>
        {/* Левая панель - список метрик */}
        <div className={styles.sidebar}>
          <button 
            className={`${styles.showAllBtn} ${showAllMetrics ? styles.active : ''}`}
            onClick={handleShowAll}
          >
            ✨ SHOW ALL
          </button>
          
          <div className={styles.metricsList}>
            {metricsData.map((metric, index) => (
              <div 
                key={metric.id}
                className={`${styles.metricItem} ${
                  !showAllMetrics && selectedMetricIndex === index ? styles.active : ''
                }`}
                onClick={() => handleMetricClick(index)}
              >
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>
                    {metric.emoji} {metric.label}
                  </span>
                  <span className={styles.metricValue}>
                    {metric.displayValue}
                  </span>
                </div>
                <div className={styles.sparklineWrapper}>
                  <SparklineChart 
                    data={metric.momData} 
                    color={metric.color}
                    height={40}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Правая панель - детальный график */}
        <div className={styles.detailChart}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitle}>
              <span className={styles.detailEmoji}>
                {showAllMetrics ? '✨' : currentMetric?.emoji}
              </span>
              <span className={styles.detailName}>
                {showAllMetrics ? 'All Metrics' : currentMetric?.label}
              </span>
              <span className={styles.detailSuffix}>— MoM Growth</span>
            </div>
            
            <div className={styles.submetricSelector}>
              <label className={styles.submetricLabel}>Submetric:</label>
              <select 
                className={styles.submetricSelect}
                value={selectedSubmetric}
                onChange={handleSubmetricChange}
                disabled={showAllMetrics}
              >
                {availableSubmetrics.map(sub => (
                  <option key={sub.key} value={sub.key}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
            
            <p className={styles.detailSubtitle}>
              Month-over-Month growth percentage
            </p>
          </div>

          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart 
                data={detailChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric?.color || '#9c27b0'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={currentMetric?.color || '#9c27b0'} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  style={{ fontSize: '13px', fontWeight: 700 }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '13px', fontWeight: 700 }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentMetric?.color || '#9c27b0'}
                  strokeWidth={4}
                  fill="url(#colorGrowth)"
                  dot={{ 
                    r: 6, 
                    fill: '#fff', 
                    strokeWidth: 3, 
                    stroke: currentMetric?.color || '#9c27b0'
                  }}
                  activeDot={{ r: 10 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}