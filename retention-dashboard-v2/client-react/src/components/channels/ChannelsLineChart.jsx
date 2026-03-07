/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsLineChart.jsx - Динамика отправок (Sent)
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact } from '../../utils/formatters';
import styles from './ChannelsCharts.module.css';

const CHANNEL_COLORS = {
  mail: '#FFD700', push: '#F06292', sms: '#00C853', tg: '#0097A7',
  wa: '#25D366', webpush: '#29B6F6', popup: '#FF9100'
};

export function ChannelsLineChart() {
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  const channelIndices = useMemo(() => {
    return periods.map((p, i) => (p.hasChannels ? i : -1)).filter(i => i !== -1);
  }, [periods]);

  const availableChannels = useMemo(() => {
    const period = periods.find(p => p.key === selectedPeriod);
    if (!period || !period.channelCards) return [];
    
    return Object.entries(period.channelCards)
      .filter(([key, data]) => key !== 'total' && !data.fullyDisabled)
      .map(([key, data]) => ({
        key,
        name: data.name || key,
        color: CHANNEL_COLORS[key] || '#9c27b0'
      }));
  }, [periods, selectedPeriod]);

  const chartData = useMemo(() => {
    return channelIndices.map(periodIndex => {
      const period = periods[periodIndex];
      const dataPoint = {
        name: period.label.split(' ').map((p,i) => i===0 ? p.substring(0,3) : p.substring(2)).join(' '),
        periodKey: period.key
      };

      availableChannels.forEach(ch => {
        const card = period.channelCards?.[ch.key]?.cards?.find(c => c.id === `${ch.key}_sent`);
        dataPoint[ch.key] = card?.value || 0;
      });

      return dataPoint;
    });
  }, [channelIndices, periods, availableChannels]);

  const selectedIndex = channelIndices.findIndex(i => periods[i]?.key === selectedPeriod);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>📅 {payload[0].payload.name}</div>
        {payload.map((entry, index) => {
          if (entry.value === 0) return null;
          const channel = availableChannels.find(c => c.key === entry.name);
          return (
            <div key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
              {channel?.name}: {formatCompact(entry.value)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>📈 Sent Dynamics by Channel</div>
          <div className={styles.subtitle}>Month comparison</div>
        </div>
        
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px', fontWeight: 600 }} />
              <YAxis stroke="#666" style={{ fontSize: '12px', fontWeight: 600 }} tickFormatter={formatCompact} />
              <Tooltip content={<CustomTooltip />} />
              
              {availableChannels.map(ch => (
                <Line
                  key={ch.key}
                  type="monotone"
                  dataKey={ch.key}
                  stroke={ch.color}
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    const isSelected = index === selectedIndex;
                    return (
                      <circle cx={cx} cy={cy} r={isSelected ? 8 : 4} fill={isSelected ? '#ff6b00' : ch.color} stroke="#fff" strokeWidth={2} />
                    );
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}