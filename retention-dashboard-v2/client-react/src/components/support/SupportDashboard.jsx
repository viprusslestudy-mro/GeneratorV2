import { useState, useEffect } from 'react';
import { Card } from '../shared/Card/Card';
import { SatisfactionCard } from './SatisfactionCard';
import { SupportMetricCard } from './SupportMetricCard';
import { SupportTrendChart } from './SupportTrendChart';
import { SupportLocaleDonut } from './SupportLocaleDonut';
import { SupportLocaleTable } from './SupportLocaleTable';
import { TagsAnalytics } from './TagsAnalytics';
import { useRetentionStore } from '../../store/retentionStore';
import styles from './SupportDashboard.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const formatTime = (totalSeconds) => {
  if (totalSeconds === undefined || totalSeconds === null) return '-';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatDuration = (val) => {
  if (val === undefined || val === null) return '-';
  const m = Math.floor(val);
  const s = Math.round((val - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function SupportDashboard({ type }) {
  const globalSupportData = useRetentionStore((state) => state.supportData);
  const selectedSupportPeriod = useRetentionStore((state) => state.selectedSupportPeriod);
  
  const [activeLocale, setActiveLocale] = useState('ALL');
  const [activePeriod, setActivePeriod] = useState('total');

  useEffect(() => {
    setActiveLocale('ALL');
    setActivePeriod('total');
  }, [selectedSupportPeriod]);

  if (!globalSupportData) {
    return <div className={styles.empty}>No Support Data available</div>;
  }

  // ДОБАВЛЕНО: Безопасное получение данных периода
  const availableKeys = globalSupportData.byPeriod ? Object.keys(globalSupportData.byPeriod).sort() : [];
  const actualPeriodKey = selectedSupportPeriod || availableKeys[availableKeys.length - 1]; // Берем выбранный или последний
  
  const periodData = globalSupportData.byPeriod?.[actualPeriodKey] || globalSupportData;
  const kpiData = periodData.liveChat || {};
  
  const periodLabel = periodData.period?.label || 'Current Month';

  const locales = Object.keys(kpiData.byLocale || {}).filter((loc) => {
    return kpiData.byLocale[loc].totalChats > 0 || (kpiData.byLocale[loc].weeklyKPI || []).some((w) => w.totalChats > 0);
  }).sort();

  const currentLocaleData = activeLocale === 'ALL' 
    ? kpiData 
    : (kpiData.byLocale?.[activeLocale] || {});

  const weeklyKPI = currentLocaleData.weeklyKPI || [];
  
  let statsToShow = {};
  if (activePeriod === 'total') {
    statsToShow = currentLocaleData;
  } else if (activePeriod.startsWith('week-')) {
    const weekIdx = parseInt(activePeriod.split('-')[1], 10);
    statsToShow = weeklyKPI[weekIdx] || {};
  }

  const hasData = (chats) => (chats || 0) > 0;

  const { t, translateMonth } = useTranslation();

  const handlePeriodSelect = (periodId, chats) => {
    if (hasData(chats)) {
      setActivePeriod(periodId);
    }
  };

  return (
    <div className="page-container">
      {/* ═══ HEADER (С ПРОБЕЛАМИ) ═══ */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>
            <span className={styles.headerIcon}>{type === 'stats' ? '📋' : '🏷️'}</span>
            &nbsp;
            {/* ИСПРАВЛЕНИЕ: ПЕРЕВОДИМ ЗАГОЛОВКИ */}
            {type === 'stats' ? t('Support Dashboard', 'LiveChat KPI Dashboard') : t('tab.support_tags', 'Tags Analytics')}
            &nbsp;
          </h1>
          {/* ИСПРАВЛЕНИЕ: ПЕРЕВОДИМ МЕСЯЦ */}
          <p className={styles.periodSubtitle}>{translateMonth(periodLabel)}</p>
        </div>

        <div className={styles.localeSwitcher}>
          <button 
            className={`${styles.localeBtn} ${activeLocale === 'ALL' ? styles.active : ''}`}
            onClick={() => setActiveLocale('ALL')}
            disabled={!hasData(kpiData.totalChats)}
          >
            {t('ALL GEO')}
          </button>
          {locales.map((loc) => (
            <button 
              key={loc}
              className={`${styles.localeBtn} ${activeLocale === loc ? styles.active : ''}`}
              onClick={() => {
                setActiveLocale(loc);
                setActivePeriod('total');
              }}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {type === 'stats' && (
        <>
          {/* ═══ PERIODS В РАМКЕ ═══ */}
          <Card>
            <div className={styles.periodsGrid}>
              {/* Total Month Card */}
              <div 
                className={`${styles.periodCard} ${activePeriod === 'total' ? styles.active : ''} ${!hasData(currentLocaleData.totalChats) ? styles.disabled : ''}`}
                onClick={() => handlePeriodSelect('total', currentLocaleData.totalChats)}
              >
                <div className={styles.totalMonthHeader}>
                  <div className={styles.crownIcon}>👑</div>
                  <div>
                    <h3 className={styles.totalTitle}>{t('Total Month')}</h3>
                    <p className={styles.totalDates}>{t('Full month data', 'Full month data')}</p>
                  </div>
                </div>
                <div className={styles.totalStats}>
                  <div>
                    <div className={styles.statTileLabel}>{t('Total Chats')}</div>
                    <div className={styles.statTileValue}>{currentLocaleData.totalChats?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className={styles.statTileLabel}>{t('Satisfaction', 'Satisfaction')}</div>
                    <div className={styles.statTileValue}>
                      {currentLocaleData.chatSatisfaction || currentLocaleData.satisfaction || 0}
                      <span style={{ fontSize: '1rem', color: '#9ca3af' }}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Week Cards (Фильтруем пустые!) */}
              <div className={styles.weeksContainer}>
                {weeklyKPI.filter(week => hasData(week.totalChats)).map((week, idx) => {
                  const weekId = `week-${idx}`;
                  const isActive = activePeriod === weekId;

                  return (
                    <div 
                      key={weekId}
                      className={`${styles.periodCard} ${isActive ? styles.active : ''}`}
                      onClick={() => handlePeriodSelect(weekId, week.totalChats)}
                    >
                      <div className={styles.weekHeader}>
                        <span className={styles.weekTitle}>{week.label || `${t('Week', 'Week')} ${idx + 1}`}</span>
                        <span className={styles.weekSat}>
                          😊 {week.satisfaction || 0}%
                        </span>
                      </div>
                      <div className={styles.weekDate}>{week.dates || '-'}</div>
                      <div className={styles.weekChats}>{week.totalChats?.toLocaleString() || 0}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ═══ KPI В РАМКЕ ═══ */}
          <Card>
            <div className={styles.supportKpiLayout}>
              {/* Левая колонка (3 метрики времени) */}
              <div className={styles.kpiColLeft}>
                <SupportMetricCard 
                  title={t('First Response')} subtitle={t('Target: under 0:15', 'Target: under 0:15')} 
                  value={formatTime(statsToShow.firstResponseTime || statsToShow.firstResponse)} icon="⚡" colorClass="blue" 
                />
                <SupportMetricCard 
                  title={t('Avg Response')} subtitle={t('Target: under 1:00', 'Target: under 1:00')} 
                  value={formatTime(statsToShow.avgResponseTime || statsToShow.avgResponse)} icon="⏱️" colorClass="purple" 
                />
                <SupportMetricCard 
                  title={t('Avg Duration')} subtitle={t('Average minutes', 'Average minutes')} 
                  value={formatDuration(statsToShow.avgChatDuration || statsToShow.chatDuration)} icon="⏳" colorClass="rose" 
                />
              </div>
              
              {/* Правая колонка */}
              <div className={styles.kpiColRight}>
                {/* Верхний ряд (2 карточки) */}
                <div className={styles.kpiRightTop}>
                  <SupportMetricCard 
                    title={t('Total Chats')} subtitle={t('Total chats', 'Total chats')} 
                    value={statsToShow.totalChats?.toLocaleString() || 0} icon="💬" colorClass="yellow" 
                  />
                  <SupportMetricCard 
                    title={t('Missed Chats')} subtitle={t('Missed chats count', 'Missed chats count')} 
                    value={statsToShow.missedChats || 0} icon="⚠️" colorClass="green" 
                  />
                </div>
                {/* Нижний ряд (Большое кольцо) */}
                <div className={styles.kpiRightBottom}>
                  <SatisfactionCard 
                    satisfaction={statsToShow.chatSatisfaction || statsToShow.satisfaction} 
                    goodCount={statsToShow.ratedGood} 
                    badCount={statsToShow.ratedBad} 
                  />
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <SupportTrendChart weeklyKPI={currentLocaleData.weeklyKPI || []} activePeriod={activePeriod} />
            <SupportLocaleDonut kpiData={kpiData} activePeriod={activePeriod} locales={locales} />
          </div>

          <SupportLocaleTable kpiData={kpiData} activePeriod={activePeriod} activeLocale={activeLocale} />
        </>
      )}

      {type === 'tags' && (
        <TagsAnalytics 
          // ИСПРАВЛЕНИЕ: Передаем данные тегов для выбранного периода
          tagsData={periodData.tags} 
          activeLocale={activeLocale} 
          activePeriod={activePeriod} 
          setActivePeriod={setActivePeriod} 
        />
      )}
    </div>
  );
}