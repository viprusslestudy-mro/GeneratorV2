/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BarChart.jsx - Столбчатый график объёма депозитов
 *  ИСПРАВЛЕНО: Убраны inline селекторы
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact, formatValue } from '../../utils/formatters';
import styles from './BarChart.module.css';

// Helper: получить значение карточки
function getCardValueFromPeriod(period, cardId) {
  if (!period) return null;
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
}

export function BarChart() {
  // Простые селекторы
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  // Подготовка данных (кэшировано)
  const chartData = useMemo(() => {
    return periods.map((p, i) => {
      const label = p.label || '';
      const parts = label.split(' ');
      const shortLabel = parts.length >= 2 
        ? `${parts[0].substring(0, 3)} ${parts[1].substring(2)}`
        : label.substring(0, 3);
      
      return {
        name: shortLabel,
        value: getCardValueFromPeriod(p, 'total_deposits_count') || 0,
        periodIndex: i,
        periodKey: p.key
      };
    });
  }, [periods]);

  // Определяем индекс выбранного периода
  const selectedIndex = useMemo(() => {
    return periods.findIndex(p => p.key === selectedPeriod);
  }, [periods, selectedPeriod]);

  // Кастомный Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>📅 {data.name}</div>
        <div className={styles.tooltipValue}>
          Deposits: {formatValue(data.value, 'integer')}
        </div>
      </div>
    );
  };

  // Легенда (кэшировано)
  const total = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.value, 0);
  }, [chartData]);

  const renderLegend = () => (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: 'var(--primary-accent)' }} />
        <span>💵 Deposits Count</span>
        <span className={styles.legendValue}>{formatValue(total, 'integer')}</span>
      </div>
    </div>
  );

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>📊 Deposit Volume</div>
          <div className={styles.subtitle}>Month comparison</div>
        </div>
        
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={380}>
            <RechartsBarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              
              <XAxis 
                dataKey="name" 
                stroke="#666"
                style={{ fontSize: '12px', fontWeight: 600 }}
              />
              
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px', fontWeight: 600 }}
                tickFormatter={(value) => formatCompact(value)}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((entry, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <Cell 
                      key={`cell-${index}`}
                      fill={isSelected ? '#ff9800' : '#ffb300'}
                      stroke={isSelected ? '#ff6b00' : 'transparent'}
                      strokeWidth={isSelected ? 3 : 0}
                      opacity={isSelected ? 1 : 0.8}
                    />
                  );
                })}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>

        {renderLegend()}
      </div>
    </Card>
  );
}