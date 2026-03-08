/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TagsAnalytics.jsx - Дашборд аналитики тегов
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore } from '../../store/retentionStore';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCompact } from '../../utils/formatters';
import styles from './TagsAnalytics.module.css';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#a855f7', '#F5B800'];
const BAR_STYLES = [
  { emoji: '⚡', bg: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', shadow: 'rgba(255, 154, 158, 0.4)' },
  { emoji: '🔥', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', shadow: 'rgba(161, 140, 209, 0.4)' },
  { emoji: '🛠️', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', shadow: 'rgba(132, 250, 176, 0.4)' },
  { emoji: '🐛', bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', shadow: 'rgba(224, 195, 252, 0.4)' },
  { emoji: '⚠️', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', shadow: 'rgba(245, 87, 108, 0.4)' }
];

const getTagCount = (tag, locale, period) => {
  if (!tag) return 0;
  if (period === 'total') {
    if (locale === 'ALL') {
      if (tag.allGeo > 0) return tag.allGeo;
      if (tag.byWeekByGeo) return Object.values(tag.byWeekByGeo).reduce((sum, weeks) => sum + weeks.reduce((a,b)=>a+b,0), 0);
      return 0;
    }
    if (tag.byGeo?.[locale] > 0) return tag.byGeo[locale];
    if (tag.byWeekByGeo?.[locale]) return tag.byWeekByGeo[locale].reduce((a,b)=>a+b,0);
    return 0;
  }
  
  if (period.startsWith('week-')) {
    const wIdx = parseInt(period.split('-')[1], 10);
    if (locale === 'ALL') {
      if (tag.byWeek?.[wIdx] > 0) return tag.byWeek[wIdx];
      if (tag.byWeekByGeo) return Object.values(tag.byWeekByGeo).reduce((sum, weeks) => sum + (weeks[wIdx] || 0), 0);
    } else {
      return tag.byWeekByGeo?.[locale]?.[wIdx] || 0;
    }
  }
  return 0;
};

export function TagsAnalytics({ tagsData, activeLocale, activePeriod, setActivePeriod }) {
  const { t } = useTranslation();
  
  // ═══ ВСЕ ХУКИ STORE В НАЧАЛЕ! ═══
  const globalSupportData = useRetentionStore(state => state.supportData);
  const selectedSupportPeriod = useRetentionStore(state => state.selectedSupportPeriod);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('count');
  const [sortDir, setSortDir] = useState('desc');

  const categories = tagsData?.categories || [];
  
  const availableLocales = useMemo(() => {
    const locSet = new Set();
    categories.forEach(cat => {
      (cat.tags || []).forEach(tag => {
        if (tag.byGeo) Object.entries(tag.byGeo).forEach(([loc, val]) => { if (val > 0) locSet.add(loc); });
        if (tag.byWeekByGeo) Object.entries(tag.byWeekByGeo).forEach(([loc, weeks]) => { if (weeks.some(w => w > 0)) locSet.add(loc); });
      });
    });
    return Array.from(locSet).sort();
  }, [categories]);

  const actualLocale = (activeLocale === 'ALL' || availableLocales.includes(activeLocale)) ? activeLocale : (availableLocales[0] || 'ALL');

  // ═══ Получаем данные о неделях из LiveChat KPI ═══
  const weeklyKPIData = useMemo(() => {
    const periodData = globalSupportData?.byPeriod?.[selectedSupportPeriod] || globalSupportData;
    return periodData?.liveChat?.weeklyKPI || [];
  }, [globalSupportData, selectedSupportPeriod]);

  // ═══ Вычисляем данные тегов ═══
  const { totalMonthChats, totalUniqueTags, weeksData } = useMemo(() => {
    let tChats = 0;
    let uTags = 0;
    
    const numWeeks = weeklyKPIData.length || 5;
    const wData = new Array(numWeeks).fill(0);

    categories.forEach(cat => {
      (cat.tags || []).forEach(tag => {
        const valTotal = getTagCount(tag, actualLocale, 'total');
        if (valTotal > 0) {
          tChats += valTotal;
          uTags++;
        }
        for (let i = 0; i < numWeeks; i++) {
          wData[i] += getTagCount(tag, actualLocale, `week-${i}`);
        }
      });
    });

    return { totalMonthChats: tChats, totalUniqueTags: uTags, weeksData: wData };
  }, [categories, actualLocale, weeklyKPIData]);

  // ═══ Автовыбор периода ═══
  useEffect(() => {
    if (activePeriod === 'total' && totalMonthChats === 0) {
      const firstValidWeek = weeksData.findIndex(val => val > 0);
      if (firstValidWeek >= 0) {
        setActivePeriod(`week-${firstValidWeek}`);
      }
    } else if (activePeriod.startsWith('week-')) {
      const wIdx = parseInt(activePeriod.split('-')[1], 10);
      if (weeksData[wIdx] === 0) {
        if (totalMonthChats > 0) {
          setActivePeriod('total');
        } else {
          const firstValidWeek = weeksData.findIndex(val => val > 0);
          if (firstValidWeek >= 0) {
            setActivePeriod(`week-${firstValidWeek}`);
          }
        }
      }
    }
  }, [actualLocale, totalMonthChats, weeksData, activePeriod, setActivePeriod]);

  // ═══ Получаем даты недели ═══
  const getWeekDates = (weekIdx) => {
    if (weekIdx >= weeklyKPIData.length) return null;
    return weeklyKPIData[weekIdx]?.dates || '';
  };

  const pieData = useMemo(() => {
    const data = categories.map(cat => {
      const sum = (cat.tags || []).reduce((acc, tag) => acc + getTagCount(tag, actualLocale, activePeriod), 0);
      return { name: cat.name, value: sum };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
    return data.length ? data : [{ name: 'No data', value: 1, isEmpty: true }];
  }, [categories, actualLocale, activePeriod]);

  const pieTotal = pieData[0]?.isEmpty ? 0 : pieData.reduce((sum, d) => sum + d.value, 0);

  const topIssues = useMemo(() => {
    const issuesCat = categories.find(c => c.name.toLowerCase() === 'issues' || c.name === 'Проблемы');
    const sourceTags = issuesCat ? issuesCat.tags : categories.flatMap(c => c.tags || []);
    
    return sourceTags.map(t => ({
      name: t.name,
      count: getTagCount(t, actualLocale, activePeriod)
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [categories, actualLocale, activePeriod]);

  const tableData = useMemo(() => {
    let rows = [];
    let grandTotal = 0;

    categories.forEach(cat => {
      (cat.tags || []).forEach(tag => {
        grandTotal += getTagCount(tag, actualLocale, activePeriod);
      });
    });

    categories.forEach(cat => {
      if (categoryFilter !== 'all' && cat.name !== categoryFilter) return;
      
      (cat.tags || []).forEach(tag => {
        if (searchQuery && !tag.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
        
        const count = getTagCount(tag, actualLocale, activePeriod);
        if (count === 0) return;

        const percent = grandTotal > 0 ? ((count / grandTotal) * 100).toFixed(1) : 0;
        
        let topLoc = '-';
        let maxVal = 0;
        if (tag.byGeo) {
          Object.entries(tag.byGeo).forEach(([loc, val]) => {
            if (val > maxVal) { maxVal = val; topLoc = loc; }
          });
        }

        rows.push({ name: tag.name, category: cat.name, count, percent: parseFloat(percent), topLoc });
      });
    });

    rows.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [categories, actualLocale, activePeriod, categoryFilter, searchQuery, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handlePeriodSelect = (periodId, hasData) => {
    if (hasData) setActivePeriod(periodId);
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length || payload[0].payload.isEmpty) return null;
    const data = payload[0].payload;
    const percent = pieTotal > 0 ? ((data.value / pieTotal) * 100).toFixed(1) : 0;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTitle}>{t(data.name)}</div>
        <div className={styles.tooltipRow}>Volume: {data.value.toLocaleString()}</div>
        <div className={styles.tooltipRow}>Share: {percent}%</div>
      </div>
    );
  };

  return (
    <div className={styles.tagsContainer}>
      
      <Card>
        <div className={styles.periodsGrid}>
          <div 
            className={`${styles.periodCard} ${activePeriod === 'total' ? styles.active : ''} ${totalMonthChats === 0 ? styles.disabled : ''}`}
            onClick={() => handlePeriodSelect('total', totalMonthChats > 0)}
          >
            <div className={styles.totalMonthHeader}>
              <div className={styles.tagIcon}>🏷️</div>
              <div>
                <h3 className={styles.totalTitle}>{t('Total Month', 'Total Month')}</h3>
                <p className={styles.totalDates}>{t('All Tags Data', 'All Tags Data')}</p>
              </div>
            </div>
            <div className={styles.totalStats}>
              <div>
                <div className={styles.statTileLabel}>{t('Total Used', 'Total Used')}</div>
                <div className={styles.statTileValue}>{totalMonthChats.toLocaleString()}</div>
              </div>
              <div>
                <div className={styles.statTileLabel}>{t('Unique Tags', 'Unique Tags')}</div>
                <div className={styles.statTileValue}>{totalUniqueTags}</div>
              </div>
            </div>
          </div>

          <div className={styles.weeksContainer}>
            {weeksData.map((val, idx) => {
              const weekId = `week-${idx}`;
              const isDisabled = val === 0;
              const weekDates = getWeekDates(idx);
              
              // Показываем неделю только если есть даты
              if (!weekDates) return null;

              return (
                <div 
                  key={weekId}
                  className={`${styles.periodCard} ${activePeriod === weekId ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
                  onClick={() => !isDisabled && handlePeriodSelect(weekId, true)}
                >
                  <div className={styles.weekHeader}>
                    <span className={styles.weekTitle}>{t('Week', 'Week')} {idx + 1}</span>
                  </div>
                  <div className={styles.weekDates}>{weekDates}</div>
                  <div className={styles.weekBottom}>
                    <div className={styles.weekChats}>{val.toLocaleString()}</div>
                    <span className={styles.weekSub}>tags</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className={styles.chartsRow}>
        <Card>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>{t('Category Distribution', 'Category Distribution')}</h3>
            <p className={styles.chartSubtitle}>{t('Breakdown by volume', 'Breakdown by volume')}</p>
          </div>
          
          <div className={styles.chartWrapper} style={{ position: 'relative' }}>
            <div className={styles.centerOverlay}>
              <div className={styles.centerLabel}>{formatCompact(pieTotal)}</div>
              <div className={styles.centerSubLabel}>Total</div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%" innerRadius={110} outerRadius={150}
                  paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.isEmpty ? '#e5e7eb' : PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                {!pieData[0].isEmpty && <RechartsTooltip content={<CustomPieTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.legend}>
            {pieData.map((entry, index) => {
              if (entry.isEmpty) return null;
              const percent = pieTotal > 0 ? ((entry.value / pieTotal) * 100).toFixed(1) : 0;
              return (
                <div key={index} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span>{t(entry.name)}</span>
                  <span className={styles.legendValue}>{percent}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>{t('Top Issues', 'Top Issues')}</h3>
            <p className={styles.chartSubtitle}>{t('Most frequent issue tags', 'Most frequent issue tags')}</p>
          </div>
          <div className={styles.issuesWrapper}>
            {topIssues.length === 0 ? (
              <div className={styles.emptyChart}>{t('No issues found', 'No issues found')}</div>
            ) : (
              topIssues.map((tag, idx) => {
                const style = BAR_STYLES[idx % BAR_STYLES.length];
                const percent = (tag.count / topIssues[0].count) * 100; 
                return (
                  <div key={idx} className={styles.issueRow}>
                    <div className={styles.issueIcon} style={{ background: style.bg, boxShadow: `0 4px 12px ${style.shadow}` }}>
                      {style.emoji}
                    </div>
                    <div className={styles.issueContent}>
                      <div className={styles.issueText}>
                        <span className={styles.issueName}>{t(tag.name)}</span>
                        <span className={styles.issueCount}>{tag.count.toLocaleString()}</span>
                      </div>
                      <div className={styles.issueBarBg}>
                        <div className={styles.issueBarFill} style={{ width: `${percent}%`, background: style.bg, boxShadow: `0 2px 8px ${style.shadow}` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>{t('All Tags', 'All Tags')}</h3>
          <div className={styles.searchWrap}>
            <span>🔍</span>
            <input 
              type="text" 
              placeholder={t('Search tags...', 'Search tags...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        
        <div className={styles.chipsWrap}>
          <button 
            className={`${styles.chip} ${categoryFilter === 'all' ? styles.active : ''}`}
            onClick={() => setCategoryFilter('all')}
          >{t('All Categories', 'All Categories')}</button>
          {categories.filter(c => !c.name.toLowerCase().startsWith('week')).map(cat => (
            <button 
              key={cat.name}
              className={`${styles.chip} ${categoryFilter === cat.name ? styles.active : ''}`}
              onClick={() => setCategoryFilter(cat.name)}
            >{t(cat.name)}</button>
          ))}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>{t('Tag Name', 'Tag Name')} ↕</th>
                <th onClick={() => handleSort('category')}>{t('Category', 'Category')} ↕</th>
                <th onClick={() => handleSort('count')} style={{textAlign: 'center'}}>{t('Count', 'Count')} ↕</th>
                <th style={{textAlign: 'center'}}>{t('% Share', '% Share')}</th>
                <th style={{textAlign: 'center'}}>{t('Top Locale', 'Top Locale')}</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  <td className={styles.boldText}>{t(row.name)}</td>
                  <td>
                    <span className={styles.categoryBadge}>{t(row.category)}</span>
                  </td>
                  <td className={styles.boldText} style={{textAlign: 'center'}}>{row.count}</td>
                  <td style={{textAlign: 'center'}}>
                    <div className={styles.percentWrap}>
                      <div className={styles.percentTrack}>
                        <div className={styles.percentFill} style={{ width: `${row.percent}%` }} />
                      </div>
                      <span className={styles.percentText}>{row.percent}%</span>
                    </div>
                  </td>
                  <td style={{textAlign: 'center', fontWeight: 'bold'}}>{row.topLoc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.tableFooter}>
          <p className={styles.showingText}>{t('Showing', 'Showing')} <span className={styles.showingCount}>{tableData.length}</span> {t('tags', 'tags')}</p>
          <button className={styles.exportBtn}>
            <span style={{ marginRight: '8px' }}>📥</span> {t('Export CSV', 'Export CSV')}
          </button>
        </div>
      </div>
    </div>
  );
}