import { useState, useEffect, useMemo } from 'react';
import { Card } from '../shared/Card/Card';
import { SatisfactionCard } from './SatisfactionCard';
import { SupportMetricCard } from './SupportMetricCard';
import { SupportTrendChart } from './SupportTrendChart';
import { SupportLocaleDonut } from './SupportLocaleDonut';
import { SupportLocaleTable } from './SupportLocaleTable';
import { useRetentionStore } from '../../store/retentionStore';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './SupportDashboard.module.css';
import { TagsAnalytics } from './TagsAnalytics';

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

  if (!globalSupportData) {
    return <div className={styles.empty}>No Support Data available</div>;
  }

  const availableKeys = globalSupportData.byPeriod ? Object.keys(globalSupportData.byPeriod).sort().reverse() : [];
  const actualPeriodKey = selectedSupportPeriod || availableKeys[0]; 
  
  const periodData = globalSupportData.byPeriod?.[actualPeriodKey] || globalSupportData;
  const kpiData = periodData.liveChat || {};
  const tagsData = periodData.tags || {};
  const periodLabel = periodData.period?.label || 'Current Month';

  const hasData = (chats) => (chats || 0) > 0;

  // ═══ ЛОКАЛИ ДЛЯ LIVECHAT KPI ═══
  // ИСПРАВЛЕНО: Берем ВСЕ локали, даже с нулями
  const kpiLocales = useMemo(() => {
    return Object.keys(kpiData.byLocale || {}).sort();
  }, [kpiData]);

  // Функция проверки наличия данных у локали
  const isLocaleActive = (loc) => {
    if (loc === 'ALL') return kpiAllGeoHasData;
    const locData = kpiData.byLocale?.[loc] || {};
    return locData.totalChats > 0 || (locData.weeklyKPI || []).some(w => w.totalChats > 0);
  };

  const kpiAllGeoHasData = (kpiData.totalChats || 0) > 0 || (kpiData.weeklyKPI || []).some(w => (w.totalChats || 0) > 0);

  // ═══ ЛОКАЛИ ДЛЯ TAGS ═══
  const tagsLocales = useMemo(() => {
    const locSet = new Set();
    const categories = tagsData?.categories || [];
    
    categories.forEach(cat => {
      (cat.tags || []).forEach(tag => {
        if (tag.byGeo) {
          Object.keys(tag.byGeo).forEach(loc => locSet.add(loc));
        }
        if (tag.byWeekByGeo) {
          Object.keys(tag.byWeekByGeo).forEach(loc => locSet.add(loc));
        }
      });
    });
    
    return Array.from(locSet).sort();
  }, [tagsData]);

  const isTagLocaleActive = (loc) => {
    const categories = tagsData?.categories || [];
    return categories.some(cat => 
      (cat.tags || []).some(tag => {
        if (loc === 'ALL') return (tag.allGeo || 0) > 0;
        return (tag.byGeo?.[loc] || 0) > 0 || Object.values(tag.byWeekByGeo?.[loc] || {}).some(v => v > 0);
      })
    );
  };

  const tagsAllGeoHasData = isTagLocaleActive('ALL');

  // ═══ ВЫБИРАЕМ ЛОКАЛИ В ЗАВИСИМОСТИ ОТ ТИПА ВКЛАДКИ ═══
  const locales = type === 'tags' ? tagsLocales : kpiLocales;
  const allGeoHasData = type === 'tags' ? tagsAllGeoHasData : kpiAllGeoHasData;
  const checkLocaleActive = type === 'tags' ? isTagLocaleActive : isLocaleActive;

  // Валидация текущей локали (если текущая не имеет данных - ищем первую с данными)
  let actualLocale = activeLocale;
  if (actualLocale !== 'ALL' && !locales.includes(actualLocale)) {
    actualLocale = 'ALL';
  }
  // Если ALL пустой, ищем первую активную
  if (actualLocale === 'ALL' && !allGeoHasData) {
    const firstActive = locales.find(loc => checkLocaleActive(loc));
    if (firstActive) actualLocale = firstActive;
  }
  // Если текущая локаль пустая, ищем первую активную
  if (!checkLocaleActive(actualLocale)) {
    const firstActive = locales.find(loc => checkLocaleActive(loc));
    if (firstActive) actualLocale = firstActive;
    else if (allGeoHasData) actualLocale = 'ALL';
  }

  const currentLocaleData = actualLocale === 'ALL' 
    ? kpiData 
    : (kpiData.byLocale?.[actualLocale] || {});

  const weeklyKPI = currentLocaleData.weeklyKPI?.length > 0 
    ? currentLocaleData.weeklyKPI 
    : [{}, {}, {}, {}];
  
  // Валидация периода
  let actualActivePeriod = activePeriod;
  if (actualActivePeriod.startsWith('week-')) {
    const wIdx = parseInt(actualActivePeriod.split('-')[1], 10);
    if (!weeklyKPI[wIdx] || !(weeklyKPI[wIdx].totalChats > 0)) {
      actualActivePeriod = 'total';
    }
  }

  let statsToShow = {};
  if (actualActivePeriod === 'total') {
    statsToShow = currentLocaleData;
  } else if (actualActivePeriod.startsWith('week-')) {
    const weekIdx = parseInt(actualActivePeriod.split('-')[1], 10);
    statsToShow = weeklyKPI[weekIdx] || {};
  }

  // ═══ АВТОВЫБОР ПРИ СМЕНЕ МЕСЯЦА ИЛИ ВКЛАДКИ ═══
  useEffect(() => {
    let newLocale = activeLocale;
    
    // Если текущая локаль не активна, ищем активную
    if (!checkLocaleActive(newLocale)) {
      const firstActive = locales.find(loc => checkLocaleActive(loc));
      newLocale = firstActive || (allGeoHasData ? 'ALL' : locales[0] || 'ALL');
      setActiveLocale(newLocale);
    }
    
    // Для KPI проверяем период
    if (type === 'stats') {
      const localeData = newLocale === 'ALL' ? kpiData : (kpiData.byLocale?.[newLocale] || {});
      const localeWeeklyKPI = localeData.weeklyKPI || [];
      
      if (activePeriod === 'total' && !hasData(localeData.totalChats)) {
        const firstValidWeek = localeWeeklyKPI.findIndex(w => hasData(w.totalChats));
        if (firstValidWeek >= 0) {
          setActivePeriod(`week-${firstValidWeek}`);
        }
      } else if (activePeriod.startsWith('week-')) {
        const wIdx = parseInt(activePeriod.split('-')[1], 10);
        if (!hasData(localeWeeklyKPI[wIdx]?.totalChats)) {
          if (hasData(localeData.totalChats)) {
            setActivePeriod('total');
          } else {
            const firstValidWeek = localeWeeklyKPI.findIndex(w => hasData(w.totalChats));
            if (firstValidWeek >= 0) {
              setActivePeriod(`week-${firstValidWeek}`);
            }
          }
        }
      }
    }
  }, [selectedSupportPeriod, type, kpiData, tagsData]);

  const handlePeriodSelect = (periodId, chats) => {
    if (hasData(chats)) {
      setActivePeriod(periodId);
    }
  };

  const handleLocaleSelect = (loc) => {
    // ИСПРАВЛЕНО: Нельзя выбрать отключенную локаль
    if (!checkLocaleActive(loc)) return;
    
    setActiveLocale(loc);
    
    if (type === 'stats') {
      const newLocaleData = loc === 'ALL' ? kpiData : (kpiData.byLocale?.[loc] || {});
      const newWeeklyKPI = newLocaleData.weeklyKPI || [];
      
      if (hasData(newLocaleData.totalChats)) {
        setActivePeriod('total');
      } else {
        const firstValidWeek = newWeeklyKPI.findIndex(w => hasData(w.totalChats));
        if (firstValidWeek >= 0) {
          setActivePeriod(`week-${firstValidWeek}`);
        } else {
          setActivePeriod('total');
        }
      }
    } else {
      setActivePeriod('total');
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
            className={`${styles.localeBtn} ${actualLocale === 'ALL' ? styles.active : ''} ${!allGeoHasData ? styles.disabledBtn : ''}`}
            onClick={() => handleLocaleSelect('ALL')}
            disabled={!allGeoHasData}
          >
            {t('ALL GEO', 'ALL GEO')}
          </button>
          {locales.map((loc) => {
            const isActive = checkLocaleActive(loc);
            return (
              <button 
                key={loc}
                className={`${styles.localeBtn} ${actualLocale === loc ? styles.active : ''} ${!isActive ? styles.disabledBtn : ''}`}
                onClick={() => handleLocaleSelect(loc)}
                disabled={!isActive}
                title={!isActive ? 'Нет данных' : ''}
              >
                {loc}
              </button>
            );
          })}
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
                {!hasData(currentLocaleData.totalChats) && (
                  <div className={styles.noDataOverlay}>{t('нет данных', 'no data')}</div>
                )}
              </div>

              {/* Week Cards */}
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
            <SupportLocaleDonut kpiData={kpiData} activePeriod={activePeriod} locales={kpiLocales} />
          </div>

          <SupportLocaleTable kpiData={kpiData} activePeriod={activePeriod} activeLocale={activeLocale} />
        </>
      )}

      {type === 'tags' && (
        <TagsAnalytics 
          tagsData={tagsData} 
          activeLocale={actualLocale} 
          activePeriod={activePeriod} 
          setActivePeriod={setActivePeriod} 
        />
      )}
    </div>
  );
}