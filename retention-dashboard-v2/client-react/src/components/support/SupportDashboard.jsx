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

  const periodData = globalSupportData.byPeriod?.[selectedSupportPeriod] || globalSupportData;
  const kpiData = periodData.liveChat || {};
  
  const currentPeriodInfo = globalSupportData.availablePeriods?.find((p) => p.key === selectedSupportPeriod);
  const periodLabel = currentPeriodInfo?.label || periodData.period?.label || 'Current Month';

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
            {type === 'stats' ? 'LiveChat KPI Dashboard' : 'Tags Analytics'}
            &nbsp;
          </h1>
          <p className={styles.periodSubtitle}>{periodLabel}</p>
        </div>

        <div className={styles.localeSwitcher}>
          <button 
            className={`${styles.localeBtn} ${activeLocale === 'ALL' ? styles.active : ''}`}
            onClick={() => setActiveLocale('ALL')}
            disabled={!hasData(kpiData.totalChats)}
          >
            ALL GEO
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
                    <h3 className={styles.totalTitle}>Total Month</h3>
                    <p className={styles.totalDates}>Full month data</p>
                  </div>
                </div>
                <div className={styles.totalStats}>
                  <div>
                    <div className={styles.statTileLabel}>Total Chats</div>
                    <div className={styles.statTileValue}>{currentLocaleData.totalChats?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className={styles.statTileLabel}>Satisfaction</div>
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
                        <span className={styles.weekTitle}>{week.label || `Week ${idx + 1}`}</span>
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
                  title="First Response" subtitle="Target: under 0:15" 
                  value={formatTime(statsToShow.firstResponseTime || statsToShow.firstResponse)} icon="⚡" colorClass="blue" 
                />
                <SupportMetricCard 
                  title="Avg Response" subtitle="Target: under 1:00" 
                  value={formatTime(statsToShow.avgResponseTime || statsToShow.avgResponse)} icon="⏱️" colorClass="purple" 
                />
                <SupportMetricCard 
                  title="Avg Duration" subtitle="Average minutes" 
                  value={formatDuration(statsToShow.avgChatDuration || statsToShow.chatDuration)} icon="⏳" colorClass="rose" 
                />
              </div>
              
              {/* Правая колонка */}
              <div className={styles.kpiColRight}>
                {/* Верхний ряд (2 карточки) */}
                <div className={styles.kpiRightTop}>
                  <SupportMetricCard 
                    title="Total Chats" subtitle="Total chats" 
                    value={statsToShow.totalChats?.toLocaleString() || 0} icon="💬" colorClass="yellow" 
                  />
                  <SupportMetricCard 
                    title="Missed Chats" subtitle="Missed chats count" 
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
          tagsData={globalSupportData.tags || periodData.tags} 
          activeLocale={activeLocale} 
          activePeriod={activePeriod} 
          setActivePeriod={setActivePeriod} 
        />
      )}
    </div>
  );
}