/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DoughnutChart.jsx - Круговая диаграмма (Казино vs Спорт)
 *  ИСПРАВЛЕНО: Убраны inline селекторы
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact } from '../../utils/formatters';
import styles from './DoughnutChart.module.css';

const COLORS = {
  'Casino': '#ff9800',
  'Sport': '#00bcd4'
};

// Helper: получить значение карточки
function getCardValueFromPeriod(period, cardId) {
  if (!period) return null;
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
}

export function DoughnutChart() {
  // Простые селекторы
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  // Подготовка данных (кэшировано)
  const chartData = useMemo(() => {
    let casinoTotal = 0;
    let sportTotal = 0;
    
    // Если выбран месяц — берем только его, иначе все месяцы
    const periodsToUse = selectedPeriod 
      ? periods.filter(p => p.key === selectedPeriod) 
      : periods;
    
    periodsToUse.forEach(p => {
      casinoTotal += getCardValueFromPeriod(p, 'casino_stake_amount') || 0;
      sportTotal += getCardValueFromPeriod(p, 'sport_stake_amount') || 0;
    });
    
    const data = [];
    if (casinoTotal > 0) data.push({ name: 'Casino', value: casinoTotal });
    if (sportTotal > 0) data.push({ name: 'Sport', value: sportTotal });
    
    return data;
  }, [periods, selectedPeriod]);

  // Если нет данных - не показываем компонент
  if (chartData.length === 0) return null;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const isZeroState = total === 0;

  // Для zero-state показываем серые сегменты
  const displayData = isZeroState 
    ? chartData.map(d => ({ ...d, value: 1 }))
    : chartData;

  // Кастомный Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0];
    const entry = chartData.find(d => d.name === data.name);
    const rawValue = entry?.value || 0;
    const percent = total > 0 ? ((rawValue / total) * 100).toFixed(1) : 0;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>{data.name}</div>
        <div className={styles.tooltipValue}>
          {isZeroState ? 'No data' : `${formatCompact(rawValue)} (${percent}%)`}
        </div>
      </div>
    );
  };

  // Кастомная метка в центре
  const renderCenterLabel = ({ cx, cy }) => (
    <g>
      <text 
        x={cx} 
        y={cy - 10} 
        textAnchor="middle" 
        dominantBaseline="middle"
        className={styles.centerLabel}
      >
        {formatCompact(total)}
      </text>
      <text 
        x={cx} 
        y={cy + 15} 
        textAnchor="middle" 
        dominantBaseline="middle"
        className={styles.centerSubLabel}
      >
        Total Bets
      </text>
    </g>
  );

  // Легенда
  const renderLegend = () => (
    <div className={styles.legend}>
      {chartData.map((entry, index) => {
        const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
        const icon = entry.name === 'Casino' ? '🎰' : '⚽';
        const color = isZeroState ? '#bdbdbd' : COLORS[entry.name];
        
        return (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendDot} 
              style={{ background: color }}
            />
            <span>{icon} {entry.name}</span>
            <span className={styles.legendValue}>
              {isZeroState 
                ? `${formatCompact(entry.value)} (no data)` 
                : `${formatCompact(entry.value)} (${percent}%)`
              }
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>💡 Bet Category</div>
          <div className={styles.subtitle}>Bet sum distribution</div>
        </div>
        
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
                label={renderCenterLabel}
              >
                {displayData.map((entry, index) => {
                  const color = isZeroState ? '#bdbdbd' : COLORS[entry.name];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color}
                      stroke="#fff"
                      strokeWidth={4}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {renderLegend()}
      </div>
    </Card>
  );
}