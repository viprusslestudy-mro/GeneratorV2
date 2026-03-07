/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DoughnutChart.jsx - Круговая диаграмма (Казино vs Спорт)
 *  ИСПРАВЛЕНО: Убраны inline селекторы
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact } from '../../utils/formatters';
import styles from './DoughnutChart.module.css';

const COLORS = { 'Casino': '#ff9800', 'Sport': '#00bcd4' };

function getCardValueFromPeriod(period, cardId) {
  if (!period) return null;
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
}

export function DoughnutChart() {
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  const chartData = useMemo(() => {
    let casinoTotal = 0;
    let sportTotal = 0;
    
    const periodsToUse = selectedPeriod ? periods.filter(p => p.key === selectedPeriod) : periods;
    
    periodsToUse.forEach(p => {
      casinoTotal += getCardValueFromPeriod(p, 'casino_stake_amount') || 0;
      sportTotal += getCardValueFromPeriod(p, 'sport_stake_amount') || 0;
    });
    
    const data = [];
    if (casinoTotal > 0) data.push({ name: 'Casino', value: casinoTotal });
    if (sportTotal > 0) data.push({ name: 'Sport', value: sportTotal });
    
    // ИСПРАВЛЕНИЕ: Если нет данных, создаем фейковый сегмент для отрисовки серого кольца
    if (data.length === 0) {
      data.push({ name: 'No Data', value: 1, isEmpty: true });
    }
    
    return data;
  }, [periods, selectedPeriod]);

  const isZeroState = chartData[0]?.isEmpty;
  const total = isZeroState ? 0 : chartData.reduce((sum, d) => sum + d.value, 0);

  const displayData = isZeroState ? chartData.map(d => ({ ...d, value: 1 })) : chartData;

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

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>💡 Bet Category</div>
          <div className={styles.subtitle}>Bet sum distribution</div>
        </div>
        
        {/* ИСПРАВЛЕНИЕ ПОЗИЦИОНИРОВАНИЯ ТЕКСТА */}
        <div className={styles.chartWrapper} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* ТЕКСТ СТРОГО ПО ЦЕНТРУ */}
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1a1a', lineHeight: 1.1 }}>
              {isZeroState ? '0' : formatCompact(total)}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
              Total Bets
            </div>
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={130}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={isZeroState ? '#eeeeee' : COLORS[entry.name]} />
                ))}
              </Pie>
              {!isZeroState && <Tooltip content={<CustomTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.legend}>
          {chartData.map((entry, index) => {
            const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            const icon = entry.name === 'Casino' ? '🎰' : '⚽';
            return (
              <div key={index} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: isZeroState ? '#bdbdbd' : COLORS[entry.name] }} />
                <span>{icon} {entry.name}</span>
                <span className={styles.legendValue}>
                  {isZeroState ? `${formatCompact(entry.value)} (no data)` : `${formatCompact(entry.value)} (${percent}%)`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}