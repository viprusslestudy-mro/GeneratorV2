import { useState, useEffect } from 'react';
import { Card } from '../shared/Card/Card';
import { SatisfactionCard } from './SatisfactionCard';
import { SupportMetricCard } from './SupportMetricCard';
import { SupportTrendChart } from './SupportTrendChart';
import { SupportLocaleDonut } from './SupportLocaleDonut';
import { SupportLocaleTable } from './SupportLocaleTable';
import { useRetentionStore } from '../../store/retentionStore';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './SupportDashboard.module.css'; // <-- ВАЖНО: используем правильные стили

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
  const { t, translateMonth } = useTranslation();
  const globalSupportData = useRetentionStore((state) => state.supportData);
  const selectedSupportPeriod = useRetentionStore((state) => state.selectedSupportPeriod);
  
  const [activeLocale, setActiveLocale] = useState('ALL');
  const [activePeriod, setActivePeriod] = useState('total');

  // При смене месяца сбрасываем фильтры, чтобы сработал автовыбор ниже
  useEffect(() => {
    setActiveLocale('ALL');
    setActivePeriod('total');
  }, [selectedSupportPeriod]);

  if (!globalSupportData) {
    return <div className={styles.empty}>No Support Data available</div>;
  }

  const availableKeys = globalSupportData.byPeriod ? Object.keys(globalSupportData.byPeriod).sort() : [];
  const actualPeriodKey = selectedSupportPeriod || availableKeys[availableKeys.length - 1]; 
  
  const periodData = globalSupportData.byPeriod?.[actualPeriodKey] || globalSupportData;
  const kpiData = periodData.liveChat || {};
  const periodLabel = periodData.period?.label || 'Current Month';

  // 1. Собираем локали с данными
  const locales = Object.keys(kpiData.byLocale || {}).filter((loc) => {
    return kpiData.byLocale[loc].totalChats > 0 || (kpiData.byLocale[loc].weeklyKPI || []).some((w) => w.totalChats > 0);
  }).sort();

  // 2. АВТОВЫБОР ЛОКАЛИ (Если ALL GEO пустой, а другие есть — переключаем)
  const allGeoHasData = (kpiData.totalChats || 0) > 0 || (kpiData.weeklyKPI || []).some(w => (w.totalChats || 0) > 0);
  
  useEffect(() => {
    if (activeLocale === 'ALL' && !allGeoHasData && locales.length > 0) {
      // Ищем самую жирную локаль для автовыбора
      const bestLocale = locales.reduce((best, loc) => {
        const chats = kpiData.byLocale[loc]?.totalChats || 0;
        return chats > best.chats ? { loc, chats } : best;
      }, { loc: locales[0], chats: -1 }).loc;
      
      setActiveLocale(bestLocale);
    }
  }, [activeLocale, allGeoHasData, locales, kpiData.byLocale]);

  // 3. Получаем данные для текущей локали
  const currentLocaleData = activeLocale === 'ALL' 
    ? kpiData 
    : (kpiData.byLocale?.[activeLocale] || {});

  // Если у локали нет weeklyKPI (например, пустой массив), создаем 4 "пустые" недели, чтобы они нарисовались
  const weeklyKPI = currentLocaleData.weeklyKPI?.length > 0 
    ? currentLocaleData.weeklyKPI 
    : [{}, {}, {}, {}];
  
  let statsToShow = {};
  if (activePeriod === 'total') {
    statsToShow = currentLocaleData;
  } else if (activePeriod.startsWith('week-')) {
    const weekIdx = parseInt(activePeriod.split('-')[1], 10);
    statsToShow = weeklyKPI[weekIdx] || {};
  }

  const hasData = (chats) => (chats || 0) > 0;

  const handlePeriodSelect = (periodId, chats) => {
    if (hasData(chats)) {
      setActivePeriod(periodId);
    }
  };

  return (
    <div className="page-container">
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>
            <span className={styles.headerIcon}>{type === 'stats' ? '📋' : '🏷️'}</span>
            &nbsp;
            {type === 'stats' ? t('Support Dashboard', 'LiveChat KPI Dashboard') : t('tab.support_tags', 'Tags Analytics')}
            &nbsp;
          </h1>
          <p className={styles.periodSubtitle}>{translateMonth(periodLabel)}</p>
        </div>

        <div className={styles.localeSwitcher}>
          <button 
            className={`${styles.localeBtn} ${activeLocale === 'ALL' ? styles.active : ''}`}
            onClick={() => { setActiveLocale('ALL'); setActivePeriod('total'); }}
            disabled={!allGeoHasData}
          >
            {t('ALL GEO', 'ALL GEO')}
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
                    <h3 className={styles.totalTitle}>{t('Total Month', 'Total Month')}</h3>
                    <p className={styles.totalDates}>{t('Full month data', 'Full month data')}</p>
                  </div>
                </div>
                <div className={styles.totalStats}>
                  <div>
                    <div className={styles.statTileLabel}>{t('total_chats', 'Total Chats')}</div>
                    <div className={styles.statTileValue}>{currentLocaleData.totalChats?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className={styles.statTileLabel}>{t('chat_satisfaction', 'Satisfaction')}</div>
                    <div className={styles.statTileValue}>
                      {currentLocaleData.chatSatisfaction || currentLocaleData.satisfaction || 0}
                      <span style={{ fontSize: '1rem', color: '#9ca3af' }}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Week Cards (Рисуем ВСЕГДА, даже пустые, и переводим Week) */}
              <div className={styles.weeksContainer}>
                {weeklyKPI.map((week, idx) => {
                  const weekId = `week-${idx}`;
                  const isActive = activePeriod === weekId;
                  const isDisabled = !hasData(week.totalChats);

                  return (
                    <div 
                      key={weekId}
                      className={`${styles.periodCard} ${isActive ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
                      onClick={() => handlePeriodSelect(weekId, week.totalChats)}
                    >
                      <div className={styles.weekHeader}>
                        {/* ИСПРАВЛЕНИЕ: Перевод слова Week */}
                        <span className={styles.weekTitle}>{t('Week', 'Week')} {idx + 1}</span>
                        <span className={styles.weekSat} style={{ opacity: isDisabled ? 0.5 : 1 }}>
                          😊 {week.satisfaction || 0}%
                        </span>
                      </div>
                      <div className={styles.weekDate}>{week.dates || '-'}</div>
                      <div className={styles.weekBottom}>
                        <div className={styles.weekChats}>{week.totalChats?.toLocaleString() || 0}</div>
                        {isDisabled && (
                          <span className={styles.noDataBadge}>{t('нет данных', 'no data')}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <div className={styles.supportKpiLayout}>
              <div className={styles.kpiColLeft}>
                <SupportMetricCard 
                  title={t('first_response', 'First Response')} 
                  subtitle={t('first_response_subtext', 'Target: under 0:15')} 
                  value={formatTime(statsToShow.firstResponseTime || statsToShow.firstResponse)} 
                  icon="⚡" colorClass="blue" 
                />
                <SupportMetricCard 
                  title={t('avg_response', 'Avg Response')} 
                  subtitle={t('avg_response_subtext', 'Target: under 1:00')} 
                  value={formatTime(statsToShow.avgResponseTime || statsToShow.avgResponse)} 
                  icon="⏱️" colorClass="purple" 
                />
                <SupportMetricCard 
                  title={t('avg_duration', 'Duration')} 
                  subtitle={t('avg_duration_subtext', 'Average minutes')} 
                  value={formatDuration(statsToShow.avgChatDuration || statsToShow.chatDuration)} 
                  icon="⏳" colorClass="rose" 
                />
              </div>
              
              <div className={styles.kpiColRight}>
                <div className={styles.kpiRightTop}>
                  <SupportMetricCard 
                    title={t('total_chats', 'Total Chats')} 
                    subtitle={t('total_chats_subtext', 'Total chats')} 
                    value={statsToShow.totalChats?.toLocaleString() || 0} 
                    icon="💬" colorClass="yellow" 
                  />
                  <SupportMetricCard 
                    title={t('missed_chats', 'Missed Chats')} 
                    subtitle={t('missed_chats_subtext', 'Missed chats count')} 
                    value={statsToShow.missedChats || 0} 
                    icon="⚠️" colorClass="green" 
                  />
                </div>
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
          tagsData={periodData.tags} 
          activeLocale={activeLocale} 
          activePeriod={activePeriod} 
          setActivePeriod={setActivePeriod} 
        />
      )}
    </div>
  );
}