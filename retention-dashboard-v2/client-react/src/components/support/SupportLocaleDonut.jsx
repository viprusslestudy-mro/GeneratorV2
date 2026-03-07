import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../shared/Card/Card';
import styles from './SupportCharts.module.css';

const COLORS = ['#3b82f6', '#10b981', '#F5B800', '#ec4899', '#a855f7', '#06b6d4', '#f43f5e', '#6b7280'];

export function SupportLocaleDonut({ kpiData, activePeriod, locales }) {
  
  const chartData = useMemo(() => {
    if (!kpiData || !kpiData.byLocale) return [];
    
    const data = locales.map(loc => {
      const locData = kpiData.byLocale[loc];
      let val = 0;
      
      if (activePeriod === 'total') {
        val = locData?.totalChats || 0;
      } else if (activePeriod.startsWith('week-')) {
        const weekIdx = parseInt(activePeriod.split('-')[1]);
        val = locData?.weeklyKPI?.[weekIdx]?.totalChats || 0;
      }
      
      return { name: loc, value: val };
    }).filter(d => d.value > 0);

    return data.sort((a, b) => b.value - a.value);
  }, [kpiData, activePeriod, locales]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // ИСПРАВЛЕНИЕ: Функция для отображения процентов прямо на кусках кольца
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent < 0.05) return null; // Не пишем текст на слишком мелких кусках
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '14px', fontWeight: 'bold' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0];
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTitle}>🌍 {data.name}</div>
        <div className={styles.tooltipRow}>Chats: {data.value.toLocaleString()}</div>
        <div className={styles.tooltipRow}>Share: {percent}%</div>
      </div>
    );
  };

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>By Locale</div>
            <div className={styles.subtitle}>Chat distribution</div>
          </div>
        </div>
        
        <div className={styles.chartWrapper}>
          <div className={styles.centerOverlay}>
            <div className={styles.centerLabel}>{total.toLocaleString()}</div>
            <div className={styles.centerSubLabel}>Total</div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData.length > 0 ? chartData : [{ name: 'No data', value: 1 }]}
                cx="50%" cy="50%" innerRadius={90} outerRadius={130} paddingAngle={2}
                dataKey="value" stroke="none"
                labelLine={false}
                label={chartData.length > 0 ? renderCustomizedLabel : false} /* ДОБАВЛЕНО */
                isAnimationActive={false} /* ИСПРАВЛЕНИЕ: Отключаем анимацию для мгновенного рендера без багов! */
              >
                {chartData.length > 0 
                  ? chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)
                  : <Cell fill="#e5e7eb" />
                }
              </Pie>
              {chartData.length > 0 && <Tooltip content={<CustomTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ИСПРАВЛЕНИЕ: Добавлена легенда (список стран) снизу */}
        <div className={styles.legend}>
          {chartData.map((entry, index) => {
            const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className={styles.legendItem}>
                <div className={styles.dot} style={{ background: COLORS[index % COLORS.length] }} />
                <span>{entry.name}</span>
                <span style={{ fontWeight: 800, paddingLeft: '8px', borderLeft: '1px solid #ddd' }}>{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}