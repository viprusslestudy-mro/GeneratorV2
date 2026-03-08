/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FinanceChart.jsx - Line Chart (Deposits & Profit)
 *  ИСПРАВЛЕНО: Убраны inline селекторы
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectPeriods } from '../../store/retentionStore';
import { formatCompact } from '../../utils/formatters';
import styles from './FinanceChart.module.css';
import { useTranslation } from '../../hooks/useTranslation';

// Helper: получить значение карточки
function getCardValueFromPeriod(period, cardId) {
  if (!period) return null;
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
}

export function FinanceChart() {
  const { t, translateMonth } = useTranslation();
  // Простые селекторы
  const periods = [...useRetentionStore(selectPeriods)].reverse();
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
        deposits: getCardValueFromPeriod(p, 'total_deposits_amount') || 0,
        profit: getCardValueFromPeriod(p, 'total_profit') || 0,
        periodKey: p.key,
        isSelected: p.key === selectedPeriod
      };
    });
  }, [periods, selectedPeriod]);

  // Кастомный Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>📅 {payload[0].payload.name}</div>
        {payload.map((entry, index) => (
          <div key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
            {entry.dataKey === 'deposits' ? '💰 Deposits' : '📈 Profit'}: {formatCompact(entry.value)}
          </div>
        ))}
      </div>
    );
  };

  // Кастомный dot с подсветкой выбранного периода
  const renderDot = (color) => (props) => {
    const { cx, cy, index } = props;
    const periodIsSelected = chartData[index]?.isSelected;
    
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={periodIsSelected ? 10 : 5}
        fill={periodIsSelected ? '#ff6b00' : color}
        stroke="#fff"
        strokeWidth={periodIsSelected ? 3 : 2}
      />
    );
  };

  // Легенда: если месяц выбран - показываем его значение, иначе сумму
  const legendData = useMemo(() => {
    if (!selectedPeriod) {
      return {
        deposits: chartData.reduce((sum, d) => sum + d.deposits, 0),
        profit: chartData.reduce((sum, d) => sum + d.profit, 0)
      };
    }
    const pData = chartData.find(d => d.periodKey === selectedPeriod);
    return {
      deposits: pData ? pData.deposits : 0,
      profit: pData ? pData.profit : 0
    };
  }, [chartData, selectedPeriod]);

  const renderLegend = () => (
    <div className={styles.customLegend}>
      <div className={styles.legendItem}>
        <div 
          className={styles.legendDot} 
          style={{ background: '#888888', border: '2px dashed #555' }} 
        />
        {/* ИСПРАВЛЕНИЕ: Перевод легенды */}
        <span>💰 {t('Депозиты (Сумма)', 'Deposits')}</span>
        <span className={styles.legendValue}>{formatCompact(legendData.deposits)}</span>
      </div>
      <div className={styles.legendItem}>
        <div 
          className={styles.legendDot} 
          style={{ background: '#ffb300' }} 
        />
        {/* ИСПРАВЛЕНИЕ: Перевод легенды */}
        <span>📈 {t('Профит (Сумма)', 'Profit')}</span>
        <span className={styles.legendValue}>{formatCompact(legendData.profit)}</span>
      </div>
    </div>
  );

  return (
    <Card>
      <div className={styles.chartContainer}>
        {/* Заголовок */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            {/* ИСПРАВЛЕНИЕ */}
            <h3 className={styles.title}>{t('📈 Депозиты и Профит', '📈 Deposits & Profit (Sum)')}</h3>
            <p className={styles.subtitle}>{t('Сравнение по месяцам', 'Month comparison')}</p>
          </div>
        </div>

        {/* График */}
        <div className={styles.chartWrapper} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ minWidth: '800px', height: '380px' }}> {/* <- Это заставит график появиться скроллом, если экран узкий, а месяцев много */}
            <ResponsiveContainer width="99%" minHeight={300} height="100%">
              <LineChart 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                
                {/* ИСПРАВЛЕНИЕ ШРИФТА ОСЕЙ */}
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }} 
                  tickFormatter={(val) => translateMonth(val)}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '15px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
                  tickFormatter={(value) => formatCompact(value)}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Deposits Line (пунктирная) */}
                <Line
                  type="monotone"
                  dataKey="deposits"
                  name="deposits"
                  stroke="#888888"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={renderDot('#888888')}
                  activeDot={{ r: 8, fill: '#888888', stroke: '#fff', strokeWidth: 2 }}
                />
                
                {/* Profit Line (сплошная) */}
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="profit"
                  stroke="#ffb300"
                  strokeWidth={4}
                  dot={renderDot('#ffb300')}
                  activeDot={{ r: 10, fill: '#ffb300', stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Легенда */}
        {renderLegend()}
      </div>
    </Card>
  );
}