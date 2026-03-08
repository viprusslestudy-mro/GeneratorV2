/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SupportLocaleTable.jsx - Детальная таблица метрик по гео
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useMemo } from 'react';
import { Card } from '../shared/Card/Card';
import styles from './SupportLocaleTable.module.css';
import { useTranslation } from '../../hooks/useTranslation';

// Конфигурация строк таблицы
const METRICS = [
  { id: 'totalChats', label: 'total_chats', fallback: 'Total Chats', icon: '💬', color: '#F5B800', format: 'number' },
  { id: 'firstResponse', label: 'first_response', fallback: 'First Response', icon: '⚡', color: '#3b82f6', format: 'time' },
  { id: 'avgResponse', label: 'avg_response', fallback: 'Avg Response', icon: '⏱️', color: '#a855f7', format: 'time' },
  { id: 'chatDuration', label: 'avg_duration', fallback: 'Chat Duration', icon: '⏳', color: '#f43f5e', format: 'duration' },
  { id: 'missedChats', label: 'missed_chats', fallback: 'Missed Chats', icon: '⚠️', color: '#10b981', format: 'number' },
  { id: 'satisfaction', label: 'chat_satisfaction', fallback: 'Satisfaction', icon: '😊', color: '#F5B800', format: 'percent' }
];

// Форматирование значений (специфично для Support)
const formatVal = (val, format) => {
  if (val === undefined || val === null) return '-';
  
  if (format === 'percent') return `${val}%`;
  
  if (format === 'number') return val.toLocaleString();
  
  if (format === 'time' || format === 'duration') {
    if (typeof val === 'number') {
      let m, s;
      if (format === 'duration') {
        // duration обычно в минутах (например 8.5 -> 8:30)
        m = Math.floor(val);
        s = Math.round((val - m) * 60);
      } else {
        // time обычно в секундах (например 125 -> 2:05)
        const totalSeconds = Math.round(val);
        m = Math.floor(totalSeconds / 60);
        s = totalSeconds % 60;
      }
      return `${m}:${String(s).padStart(2, '0')}`;
    }
    return val;
  }
  return val;
};

// Извлечение данных для конкретного периода
const extractPeriodData = (sourceObj, periodId) => {
  if (!sourceObj) return {};
  if (periodId === 'total') {
    return {
      totalChats: sourceObj.totalChats || 0,
      firstResponse: sourceObj.firstResponseTime || sourceObj.firstResponse || 0,
      avgResponse: sourceObj.avgResponseTime || sourceObj.avgResponse || 0,
      chatDuration: sourceObj.avgChatDuration || sourceObj.chatDuration || 0,
      missedChats: sourceObj.missedChats || 0,
      satisfaction: sourceObj.chatSatisfaction || sourceObj.satisfaction || 0
    };
  } else if (periodId.startsWith('week-')) {
    const weekIdx = parseInt(periodId.split('-')[1]);
    const wData = (sourceObj.weeklyKPI || [])[weekIdx] || {};
    return {
      totalChats: wData.totalChats || 0,
      firstResponse: wData.firstResponseTime || wData.firstResponse || 0,
      avgResponse: wData.avgResponseTime || wData.avgResponse || 0,
      chatDuration: wData.avgChatDuration || wData.chatDuration || 0,
      missedChats: wData.missedChats || 0,
      satisfaction: wData.satisfaction || 0
    };
  }
  return {};
};

export function SupportLocaleTable({ kpiData, activePeriod, activeLocale }) {
  
  // 1. Собираем и сортируем локали для текущего периода
  const sortedLocales = useMemo(() => {
    if (!kpiData || !kpiData.byLocale) return [];
    
    const locs = [];
    Object.keys(kpiData.byLocale).forEach(loc => {
      const pData = extractPeriodData(kpiData.byLocale[loc], activePeriod);
      if (pData.totalChats > 0) {
        locs.push({ code: loc, chats: pData.totalChats });
      }
    });
    
    return locs.sort((a, b) => b.chats - a.chats).map(l => l.code);
  }, [kpiData, activePeriod]);

  // 2. Данные для "All Geo"
  const allGeoData = useMemo(() => extractPeriodData(kpiData, activePeriod), [kpiData, activePeriod]);

  const { t } = useTranslation();

  if (sortedLocales.length === 0) return null;

  return (
    <Card>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('Detailed Metrics by Locale', 'Detailed Metrics by Locale')}</h3>
        <p className={styles.subtitle}>{t('Complete breakdown for selected period', 'Complete breakdown for selected period')}</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thLeft}>{t('Метрика', 'Metric')}</th>
              <th className={`${styles.thCenter} ${activeLocale === 'ALL' ? styles.highlightCol : ''}`}>
                {t('ALL GEO', 'All Geo')}
              </th>
              {sortedLocales.map(loc => (
                <th 
                  key={loc} 
                  className={`${styles.thCenter} ${activeLocale === loc ? styles.highlightCol : ''}`}
                >
                  {loc}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(m => {
              const allValRaw = allGeoData[m.id];
              const allValFormatted = formatVal(allValRaw, m.format);

              return (
                <tr key={m.id} className={styles.row}>
                  {/* Название метрики */}
                  <td className={styles.tdLeft}>
                    <div className={styles.metricLabelWrap}>
                      <div className={styles.metricIcon} style={{ background: `${m.color}20`, color: m.color }}>
                        {m.icon}
                      </div>
                      <span>{t(m.label, m.fallback)}</span>
                    </div>
                  </td>
                  
                  {/* All Geo значение */}
                  <td className={`${styles.tdCenter} ${styles.boldText} ${activeLocale === 'ALL' ? styles.highlightCol : ''}`}>
                    {allValFormatted}
                  </td>
                  
                  {/* Значения по локалям */}
                  {sortedLocales.map(loc => {
                    const locDataRaw = extractPeriodData(kpiData.byLocale[loc], activePeriod)[m.id];
                    const locValFormatted = formatVal(locDataRaw, m.format);
                    
                    // Цветовое кодирование для процентов (зеленый > 80, красный < 60)
                    let colorStyle = {};
                    if (m.format === 'percent' && locDataRaw !== undefined) {
                      const numVal = parseFloat(locDataRaw);
                      if (numVal > 80) colorStyle = { color: '#16a34a' }; // Green
                      else if (numVal < 60) colorStyle = { color: '#ef4444' }; // Red
                    }

                    return (
                      <td 
                        key={loc} 
                        className={`${styles.tdCenter} ${activeLocale === loc ? styles.highlightCol : ''}`}
                        style={colorStyle}
                      >
                        {locValFormatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}