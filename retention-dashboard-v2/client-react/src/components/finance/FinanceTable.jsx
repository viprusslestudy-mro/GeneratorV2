/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FinanceTable.jsx - Таблица метрик с Heatmap
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo, useEffect } from 'react';
import { Card } from '../shared/Card/Card';
import { useRetentionStore, selectFinanceTabs, selectPeriods } from '../../store/retentionStore';
import { formatValue, sanitizeDiffValue, getDiffClass, getCellBackground } from '../../utils/formatters';
import styles from './FinanceTable.module.css';

const TABLE_CONFIGS = {
  deposits: [
    { key: 'total_deposits_count', label: 'Total Deposits Count', format: 'integer' },
    { key: 'total_deposits_amount', label: 'Total Deposits Sum', format: 'currency' },
    { key: 'avg_deposits_per_day', label: 'Avg Deposits / Day', format: 'decimal' },
    { key: 'avg_deposits_amount_per_day', label: 'Avg Amount / Day', format: 'currency' },
    { key: 'ftd_amount', label: 'FTD Amount', format: 'currency' },
    { key: 'redep_1m_amount', label: 'Redeposit 1M Amount', format: 'currency' },
    { key: 'redep_1m_ratio', label: 'Redeposit 1M / FTD (%)', format: 'percent' },
    { key: 'redep_1m_plus_amount', label: 'Redeposit 1M+ Amount', format: 'currency' },
    { key: 'redep_1m_plus_ratio', label: 'Redeposit 1M+ / Total (%)', format: 'percent' }
  ],
  sport: [
    { key: 'sport_stake_amount', label: 'Total Stakes Amount', format: 'currency' },
    { key: 'sport_stake_count', label: 'Total Stakes Count', format: 'integer' },
    { key: 'sport_bet_profit', label: 'Bet Profit', format: 'currency' },
    { key: 'sport_avg_stake_per_day', label: 'Avg Stakes / Day', format: 'currency' },
    { key: 'sport_avg_count_per_day', label: 'Avg Count / Day', format: 'decimal' },
    { key: 'sport_avg_bettors_per_day', label: 'Avg Bettors / Day', format: 'decimal' }
  ],
  casino: [
    { key: 'casino_stake_amount', label: 'Total Stakes Amount', format: 'currency' },
    { key: 'casino_stake_count', label: 'Total Stakes Count', format: 'integer' },
    { key: 'casino_bet_profit', label: 'Bet Profit', format: 'currency' },
    { key: 'casino_avg_stake_per_day', label: 'Avg Stakes / Day', format: 'currency' },
    { key: 'casino_avg_count_per_day', label: 'Avg Count / Day', format: 'decimal' },
    { key: 'casino_avg_bettors_per_day', label: 'Avg Bettors / Day', format: 'decimal' }
  ],
  profit: [
    { key: 'total_profit', label: 'Total Profit', format: 'currency' },
    { key: 'avg_profit_per_day', label: 'Avg Profit / Day', format: 'currency' },
    { key: 'bonuses_issued', label: 'Bonuses Issued', format: 'currency' },
    { key: 'bonus_to_deposits_ratio', label: 'Bonuses / Deposits (%)', format: 'percent' }
  ],
  structure: [
    { key: 'total_stake_amount', label: 'Total Bets', format: 'currency' },
    { key: 'sport_stake_percent', label: 'Sport %', format: 'percent' },
    { key: 'casino_stake_percent', label: 'Casino %', format: 'percent' }
  ]
};

export function FinanceTable() {
  const financeTabs = useRetentionStore(selectFinanceTabs);
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  const financePeriodsData = useMemo(() => periods.filter(p => p.hasFinance), [periods]);

  // Доступные вкладки (скрываем те, где все метрики выключены)
  const availableSections = useMemo(() => {
    return Object.keys(financeTabs).filter(sectionKey => {
      const config = TABLE_CONFIGS[sectionKey] || [];
      return config.some(metric => {
        return financePeriodsData.some(p => {
          const card = (p.cards || []).find(c => c.id === metric.key);
          return card && card.disabled !== true; 
        });
      });
    });
  }, [financeTabs, financePeriodsData]);

  const [activeSection, setActiveSection] = useState(availableSections[0] || 'deposits');

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(activeSection)) {
      setActiveSection(availableSections[0]);
    }
  }, [availableSections, activeSection]);

  const sectionConfig = TABLE_CONFIGS[activeSection] || [];

  // Получаем данные для конкретной метрики по всем периодам
  const getMetricData = (metricKey) => {
    return financePeriodsData.map(periodData => {
      const card = (periodData.cards || []).find(c => c.id === metricKey);
      const isDisabled = !card || card.disabled === true;

      return {
        value: card?.value ?? null,
        diff: card?.diff || '',
        disabled: isDisabled
      };
    });
  };

  // Видимые метрики (хотя бы в одном периоде не отключены)
  const visibleMetrics = useMemo(() => {
    return sectionConfig.filter(metric => {
      const data = getMetricData(metric.key);
      return data.some(d => !d.disabled);
    });
  }, [activeSection, financePeriodsData]);

  // Рендер ячейки таблицы
  const renderCell = (metric, periodData, periodIndex, isFirstPeriod) => {
    const data = getMetricData(metric.key);
    const cellData = data[periodIndex];
    const isSelected = periodData.key === selectedPeriod;

    if (cellData.disabled) {
      return (
        <td key={periodData.key} className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`} style={{ background: isSelected ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 0, 0, 0.02)' }}>
          <div className={styles.cellContent}><span className={styles.disabledLabel}>OFF</span></div>
        </td>
      );
    }

    if (cellData.value === null || cellData.value === undefined) {
      return (
        <td key={periodData.key} className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`} style={{ background: isSelected ? 'rgba(255, 179, 0, 0.15)' : '#ffffff' }}>
          <div className={styles.cellContent}><span className={styles.cellValue}>—</span></div>
        </td>
      );
    }

    let diffStr = sanitizeDiffValue(cellData.diff);
    if (diffStr && diffStr !== '—') {
      const numVal = parseFloat(String(diffStr).replace('%', '').replace(',', '.').replace(/\s/g, ''));
      if (!isNaN(numVal) && numVal > 0 && !diffStr.startsWith('+')) diffStr = '+' + diffStr;
    }

    const heatmapBg = isFirstPeriod ? '#ffffff' : getCellBackground(periodIndex, diffStr);
    const finalBg = isSelected ? 'rgba(255, 179, 0, 0.15)' : heatmapBg;
    const diffClass = getDiffClass(diffStr);

    return (
      <td key={periodData.key} className={`${styles.cell} ${isSelected ? styles.selectedCell : ''}`} style={{ background: finalBg }}>
        <div className={styles.cellContent}>
          <span className={styles.cellValue}>{formatValue(cellData.value, metric.format)}</span>
          <span className={`${styles.cellDiff} ${styles[diffClass]}`}>{diffStr || '—'}</span>
        </div>
      </td>
    );
  };

  if (availableSections.length === 0) return null;

  return (
    <Card title="📋 Detailed Metrics">
      <div className={styles.tabs}>
        {availableSections.map(key => (
          <button key={key} className={`${styles.tab} ${activeSection === key ? styles.active : ''}`} onClick={() => setActiveSection(key)}>
            {financeTabs[key] || key}
          </button>
        ))}
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>Metric</th>
              {financePeriodsData.map(periodData => (
                <th key={periodData.key} className={`${styles.periodHeader} ${periodData.key === selectedPeriod ? styles.selectedHeader : ''}`}>
                  {periodData.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleMetrics.map(metric => (
              <tr key={metric.key} className={styles.row}>
                <td className={styles.metricCell}>{metric.label}</td>
                {financePeriodsData.map((periodData, index) => renderCell(metric, periodData, index, index === 0))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}