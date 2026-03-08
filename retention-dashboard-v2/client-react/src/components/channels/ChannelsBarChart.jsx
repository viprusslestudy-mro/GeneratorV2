/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ChannelsBarChart.jsx - Столбчатый график (Конверсии)
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { 
  BarChart, 
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
import { formatCompact } from '../../utils/formatters';
import styles from './ChannelsCharts.module.css';
import { useTranslation } from '../../hooks/useTranslation';

// Цвета каналов
const CHANNEL_COLORS = {
  mail: '#FFD700', push: '#F06292', sms: '#00C853', tg: '#0097A7',
  wa: '#25D366', webpush: '#29B6F6', popup: '#FF9100'
};

const CHANNEL_ICONS = {
  mail: '📧', push: '📱', sms: '💬', tg: '✈️',
  wa: '📞', webpush: '🌐', popup: '🔔'
};

export function ChannelsBarChart() {
  const { t, translateMonth } = useTranslation();
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  // Фильтруем индексы с channels данными
  const channelIndices = useMemo(() => {
    return periods.map((p, i) => (p.hasChannels ? i : -1)).filter(i => i !== -1);
  }, [periods]);

  // Получить доступные каналы (имеющие конверсии)
  const availableChannels = useMemo(() => {
    const period = periods.find(p => p.key === selectedPeriod);
    if (!period || !period.channelCards) return [];
    
    return Object.entries(period.channelCards)
      .filter(([key, data]) => {
        if (key === 'total' || data.fullyDisabled) return false;
        // Проверяем есть ли метрика conversions
        return data.cards?.some(c => c.id.endsWith('_conversions'));
      })
      .map(([key, data]) => ({
        key,
        name: data.name || key,
        color: CHANNEL_COLORS[key] || '#9c27b0'
      }));
  }, [periods, selectedPeriod]);

  // Получить значение карточки канала
  const getChannelValue = (period, chKey, metric) => {
    if (!period?.channelCards?.[chKey]?.cards) return 0;
    const card = period.channelCards[chKey].cards.find(c => c.id === `${chKey}_${metric}`);
    return card?.value ?? 0;
  };

  // Подготовка данных для графика (Stacked Bar)
  const chartData = useMemo(() => {
    return channelIndices.map(periodIndex => {
      const period = periods[periodIndex];
      const dataPoint = {
        name: period.label.split(' ').map((p,i) => i===0 ? p.substring(0,3) : p.substring(2)).join(' '),
        periodIndex,
        periodKey: period.key
      };

      availableChannels.forEach(ch => {
        dataPoint[ch.key] = getChannelValue(period, ch.key, 'conversions');
      });

      return dataPoint;
    });
  }, [channelIndices, periods, availableChannels]);

  // Индекс выбранного периода
  const selectedIndex = channelIndices.findIndex(
    i => periods[i]?.key === selectedPeriod
  );

  // Кастомный Tooltip
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
              {CHANNEL_ICONS[entry.name]} {channel?.name}: {formatCompact(entry.value)}
            </div>
          );
        })}
      </div>
    );
  };

  // Легенда (пересчитывается при смене месяца)
  const renderLegend = () => {
    return (
      <div className={styles.legend}>
        {availableChannels.map(ch => {
          // Считаем тотал за все время
          const totalAllTime = chartData.reduce((sum, d) => sum + (d[ch.key] || 0), 0);
          
          // Выбираем: если выбран месяц, берем его значение. Иначе тотал.
          const valueToShow = selectedPeriod 
            ? (chartData.find(d => d.periodKey === selectedPeriod)?.[ch.key] || 0)
            : totalAllTime;

          if (valueToShow === 0) return null; // Скрываем пустые в легенде

          return (
            <div key={ch.key} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: ch.color }} />
              <span>{CHANNEL_ICONS[ch.key]} {ch.name}</span>
              <span className={styles.legendValue}>{formatCompact(valueToShow)}</span>
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
          {/* ИСПРАВЛЕНИЕ */}
          <div className={styles.title}>{t('📊 Конверсии по каналам', '📊 Conversions by Channel')}</div>
          <div className={styles.subtitle}>{t('Конверсии по месяцам', 'Stacked month comparison')}</div>
        </div>
        
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="99%" height={380}>
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} 
                tickFormatter={(val) => translateMonth(val)}
              />
              <YAxis 
                stroke="#666" 
                style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} 
                tickFormatter={formatCompact} 
              />
              <Tooltip content={<CustomTooltip />} />
              
              {availableChannels.map((ch, i) => (
                <Bar 
                  key={ch.key} 
                  dataKey={ch.key} 
                  stackId="a" 
                  fill={ch.color}
                  radius={i === availableChannels.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        opacity={isSelected ? 1 : 0.6}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {renderLegend()}
      </div>
    </Card>
  );
}