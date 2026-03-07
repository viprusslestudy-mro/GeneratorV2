import { useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../shared/Card/Card';
import styles from './SupportCharts.module.css';

export function SupportTrendChart({ weeklyKPI = [], activePeriod }) {
  const chartData = useMemo(() => {
    return weeklyKPI.map((w, idx) => ({
      name: w.label || `Week ${idx + 1}`,
      chats: w.totalChats || 0,
      satisfaction: w.satisfaction || 0,
      isTarget: activePeriod === `week-${idx}`
    }));
  }, [weeklyKPI, activePeriod]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTitle}>{label}</div>
        <div className={styles.tooltipRow} style={{ color: '#F5B800' }}>
          💬 Chats: {payload[0].value}
        </div>
        <div className={styles.tooltipRow} style={{ color: '#a855f7' }}>
          😊 Satisfaction: {payload[1].value}%
        </div>
      </div>
    );
  };

  // Кастомные точки (выделяем выбранную неделю)
  const renderDot = (color) => (props) => {
    const { cx, cy, payload } = props;
    if (payload.isTarget) {
      return <circle cx={cx} cy={cy} r={8} fill="#ff6b6b" stroke="#fff" strokeWidth={3} />;
    }
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
  };

  return (
    <Card className={styles.card}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Performance Trend</div>
            <div className={styles.subtitle}>Chats and Satisfaction over time</div>
          </div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.dot} style={{ background: '#F5B800' }} /> Chats
            </div>
            <div className={styles.legendItem}>
              <div className={styles.dot} style={{ background: '#a855f7' }} /> Satisfaction
            </div>
          </div>
        </div>
        
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={350}>
            {/* ИСПРАВЛЕНИЕ: Добавлен padding, чтобы не прилипало */}
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
              <defs>
                <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5B800" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F5B800" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              
              {/* ИСПРАВЛЕНИЕ: padding={{ left: 30, right: 30 }} отдаляет первую и последнюю точку от краев */}
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontWeight: 700, fill: '#666', fontSize: 14 }} 
                padding={{ left: 30, right: 30 }} 
              />
              
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontWeight: 700, fill: '#666', fontSize: 14 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontWeight: 700, fill: '#666', fontSize: 14 }} tickFormatter={v => `${v}%`} />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* ИСПРАВЛЕНИЕ: strokeWidth={6} (сделал жирнее) */}
              <Area yAxisId="left" type="monotone" dataKey="chats" fill="url(#colorChats)" stroke="#F5B800" strokeWidth={6} activeDot={{ r: 8 }} dot={renderDot('#F5B800')} />
              <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#a855f7" strokeWidth={6} activeDot={{ r: 8 }} dot={renderDot('#a855f7')} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}