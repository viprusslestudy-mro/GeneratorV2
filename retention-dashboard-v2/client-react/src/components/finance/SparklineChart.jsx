/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SparklineChart.jsx - Мини-график для sidebar
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from 'recharts';

export function SparklineChart({ data, color = '#9c27b0', height = 40 }) {
  // Преобразуем данные в формат для Recharts
  const chartData = data.map((value, index) => ({
    index,
    value: value || 0
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`sparkline-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sparkline-${color.replace('#', '')})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}