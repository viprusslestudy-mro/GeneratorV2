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
import { FINANCE_TABLE_CONFIGS } from '../../config/metricsConfig';
import { useTranslation } from '../../hooks/useTranslation';

export function FinanceTable() {
  const { t, translateMonth } = useTranslation();
  const financeTabs = useRetentionStore(selectFinanceTabs);
  const periods = useRetentionStore(selectPeriods);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);

  const financePeriodsData = useMemo(() => periods.filter(p => p.hasFinance), [periods]);

  // Доступные вкладки (скрываем те, где все метрики выключены)
  const availableSections = useMemo(() => {
    return Object.keys(financeTabs).filter(sectionKey => {
      const config = FINANCE_TABLE_CONFIGS[sectionKey] || [];
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

  const sectionConfig = FINANCE_TABLE_CONFIGS[activeSection] || [];

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
    
    // ДИНАМИЧЕСКИЙ БАЗОВЫЙ МЕСЯЦ: Первый видимый месяц всегда пустой по изменениям
    if (isFirstPeriod) {
      diffStr = '—';
    } else if (diffStr && diffStr !== '—') {
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
    <Card>
      <div className={styles.tabs}>
        {availableSections.map(key => (
          <button key={key} className={`${styles.tab} ${activeSection === key ? styles.active : ''}`} onClick={() => setActiveSection(key)}>
            {/* ИСПРАВЛЕНИЕ: Оборачиваем текст таба в t() */}
            {t(financeTabs[key] || key)}
          </button>
        ))}
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>{t('Метрика', 'Metric')}</th>
              {financePeriodsData.map(periodData => (
                <th key={periodData.key} className={`${styles.periodHeader} ${periodData.key === selectedPeriod ? styles.selectedHeader : ''}`}>
                  {translateMonth(periodData.label)} {/* ПЕРЕВОД МЕСЯЦА */}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleMetrics.map(metric => (
              <tr key={metric.key} className={styles.row}>
                {/* ИСПРАВЛЕНО: ПРОСТО ПЕРЕДАЕМ РУССКУЮ ФРАЗУ! */}
                <td className={styles.metricCell}>{t(metric.label)}</td>
                {financePeriodsData.map((periodData, index) => renderCell(metric, periodData, index, index === 0))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}