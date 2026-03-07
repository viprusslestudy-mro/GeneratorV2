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

    return data.sort((a, b) => b.value - a.value); // Сортируем по убыванию
  }, [periods, selectedPeriod]);

  if (chartData.length === 0) return null;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

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

  const renderCenterLabel = ({ cx, cy }) => (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" className={styles.centerLabel}>
        {formatCompact(total)}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" className={styles.centerSubLabel}>
        Total Sent
      </text>
    </g>
  );

  const renderLegend = () => (
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
  );

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>🎯 Sent Distribution</div>
          <div className={styles.subtitle}>By channels for current period</div>
        </div>
        
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
                label={renderCenterLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={4} />
                ))}
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