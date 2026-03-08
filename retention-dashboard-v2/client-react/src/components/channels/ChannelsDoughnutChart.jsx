/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsDoughnutChart.jsx - Круговая диаграмма (Распределение Sent)
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact } from '../../utils/formatters';
import styles from './ChannelsCharts.module.css';

const CHANNEL_COLORS = {
  mail: '#FFD700', push: '#F06292', sms: '#00C853', tg: '#0097A7',
  wa: '#25D366', webpush: '#29B6F6', popup: '#FF9100'
};

const CHANNEL_ICONS = {
  mail: '📧', push: '📱', sms: '💬', tg: '✈️',
  wa: '📞', webpush: '🌐', popup: '🔔'
};

export function ChannelsDoughnutChart() {
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  const chartData = useMemo(() => {
    const period = periods.find(p => p.key === selectedPeriod);
    if (!period || !period.channelCards) return [];

    const data = [];
    Object.entries(period.channelCards).forEach(([key, chData]) => {
      if (key === 'total' || chData.fullyDisabled) return;
      
      const sentCard = chData.cards?.find(c => c.id === `${key}_sent`);
      if (sentCard?.value > 0) {
        data.push({
          name: chData.name || key,
          key: key,
          value: sentCard.value,
          color: CHANNEL_COLORS[key] || '#9c27b0'
        });
      }
    });

    // ИСПРАВЛЕНИЕ: Если нет данных, создаем фейковый сегмент для отрисовки серого кольца
    if (data.length === 0) {
      data.push({ name: 'No Data', value: 1, isEmpty: true, color: '#eeeeee' });
    }

    return data.sort((a, b) => b.value - a.value); // Сортируем по убыванию
  }, [periods, selectedPeriod]);

  const isZeroState = chartData[0]?.isEmpty;
  const total = isZeroState ? 0 : chartData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>{data.name}</div>
        <div className={styles.tooltipValue}>
          {formatCompact(data.value)} ({percent}%)
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>🎯 Sent Distribution</div>
          <div className={styles.subtitle}>By channels for current period</div>
        </div>
        
        {/* ИСПРАВЛЕНИЕ ПОЗИЦИОНИРОВАНИЯ ТЕКСТА */}
        <div className={styles.chartWrapper} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* ТЕКСТ СТРОГО ПО ЦЕНТРУ */}
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1a1a', lineHeight: 1.1 }}>
              {isZeroState ? '0' : formatCompact(total)}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
              Total Sent
            </div>
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={110}
                outerRadius={150}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {!isZeroState && <Tooltip content={<CustomTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.legend}>
          {chartData.map((entry, index) => {
            const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            const icon = CHANNEL_ICONS[entry.key] || '📊';
            
            return (
              <div key={index} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: entry.color }} />
                <span>{icon} {entry.name}</span>
                <span className={styles.legendValue}>{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}