/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TagsAnalytics.jsx - Дашборд аналитики тегов
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Card } from '../shared/Card/Card';
import { useRetentionStore } from '../../store/retentionStore';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('count');
  const [sortDir, setSortDir] = useState('desc');

  const categories = tagsData?.categories || [];
  
  const { totalMonthChats, totalUniqueTags, weeksData } = useMemo(() => {
    let tChats = 0;
    let uTags = 0;
    const wData = [0, 0, 0, 0, 0];

    categories.forEach(cat => {
      (cat.tags || []).forEach(tag => {
        const valTotal = getTagCount(tag, activeLocale, 'total');
        if (valTotal > 0) {
          tChats += valTotal;
          uTags++;
        }
        for (let i = 0; i < 5; i++) {
          wData[i] += getTagCount(tag, activeLocale, `week-${i}`);
        }
      });
    });

    return { totalMonthChats: tChats, totalUniqueTags: uTags, weeksData: wData };
  }, [categories, activeLocale]);

  const pieData = useMemo(() => {
    const data = categories.map(cat => {
      const sum = (cat.tags || []).reduce((acc, tag) => acc + getTagCount(tag, activeLocale, activePeriod), 0);
      return { name: cat.name, value: sum };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
    return data.length ? data : [{ name: 'No data', value: 1, isEmpty: true }];
  }, [categories, activeLocale, activePeriod]);

  const topIssues = useMemo(() => {
    let issues = [];
    const issuesCat = categories.find(c => c.name.toLowerCase() === 'issues' || c.name === 'Проблемы');
    const sourceTags = issuesCat ? issuesCat.tags : categories.flatMap(c => c.tags || []);
    
    issues = sourceTags.map(t => ({
      name: t.name,
      count: getTagCount(t, activeLocale, activePeriod)
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return issues;
  }, [categories, activeLocale, activePeriod]);

  const tableData = useMemo(() => {
    let rows = [];
    let grandTotal = 0;

    categories.forEach(cat => {
      (cat.tags || []).forEach(tag => {
        grandTotal += getTagCount(tag, activeLocale, activePeriod);
      });
    });

    categories.forEach(cat => {
      if (categoryFilter !== 'all' && cat.name !== categoryFilter) return;
      
      (cat.tags || []).forEach(tag => {
        if (searchQuery && !tag.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
        
        const count = getTagCount(tag, activeLocale, activePeriod);
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
  }, [categories, activeLocale, activePeriod, categoryFilter, searchQuery, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handlePeriodSelect = (periodId, hasData) => {
    if (hasData) setActivePeriod(periodId);
  };

  return (
    <div className={styles.tagsContainer}>
      
      {/* ═══ HEADER (ЦЕНТРИРОВАННЫЙ КАК В SUPPORT) ═══ */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>
            <span className={styles.headerIcon}>🏷️</span>
            &nbsp;Tags Analytics&nbsp;
          </h1>
        </div>
      </div>

      {/* ═══ PERIODS ═══ */}
      <Card>
        <div className={styles.periodsGrid}>
          {/* Total Month */}
          <div 
            className={`${styles.periodCard} ${activePeriod === 'total' ? styles.active : ''} ${totalMonthChats === 0 ? styles.disabled : ''}`}
            onClick={() => handlePeriodSelect('total', totalMonthChats > 0)}
          >
            <div className={styles.totalMonthHeader}>
              <div className={styles.tagIcon}>🏷️</div>
              <div>
                <h3 className={styles.totalTitle}>Total Month</h3>
                <p className={styles.totalDates}>All Tags Data</p>
              </div>
            </div>
            <div className={styles.totalStats}>
              <div>
                <div className={styles.statTileLabel}>Total Used</div>
                <div className={styles.statTileValue}>{totalMonthChats.toLocaleString()}</div>
              </div>
              <div>
                <div className={styles.statTileLabel}>Unique Tags</div>
                <div className={styles.statTileValue}>{totalUniqueTags}</div>
              </div>
            </div>
          </div>

          {/* Weeks */}
          <div className={styles.weeksContainer}>
            {weeksData.map((val, idx) => {
              const weekId = `week-${idx}`;
              const isDisabled = val === 0;
              
              // Достаем даты из liveChat (так как в tags дат нет)
              const globalData = useRetentionStore.getState().supportData;
              const periodData = globalData?.byPeriod?.[activePeriod] || globalData;
              const weekDates = periodData?.liveChat?.weeklyKPI?.[idx]?.dates || '';

              if (isDisabled) return null; // Прячем полностью пустые

              return (
                <div 
                  key={weekId}
                  className={`${styles.periodCard} ${activePeriod === weekId ? styles.active : ''}`}
                  onClick={() => handlePeriodSelect(weekId, true)}
                >
                  <div className={styles.weekHeader}>
                    <span className={styles.weekTitle}>Week {idx + 1}</span>
                  </div>
                  {/* ИСПРАВЛЕНИЕ: Выводим реальные даты вместо "week dates" */}
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

      {/* ═══ CHARTS (КАТЕГОРИИ СЛЕВА, ИШЬЮС СПРАВА) ═══ */}
      <div className={styles.chartsRow}>
        
        {/* ЛЕВАЯ КАРТОЧКА: Category Distribution */}
        <Card title="Category Distribution" subtitle="Breakdown by volume">
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%" innerRadius={110} outerRadius={150}
                  dataKey="value" stroke="#fff" strokeWidth={2}
                  label={!pieData[0].isEmpty ? ({name, percent}) => `${name} (${(percent*100).toFixed(0)}%)` : false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.isEmpty ? '#e5e7eb' : PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                {!pieData[0].isEmpty && <RechartsTooltip />}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ПРАВАЯ КАРТОЧКА: Top Issues */}
        <Card title="Top Issues" subtitle="Most frequent issue tags">
          <div className={styles.issuesWrapper}>
            {topIssues.length === 0 ? (
              <div className={styles.emptyChart}>No issues found</div>
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
                        <span className={styles.issueName}>{tag.name}</span>
                        <span className={styles.issueCount}>{tag.count.toLocaleString()}</span>
                      </div>
                      <div className={styles.issueBarBg}>
                        <div className={styles.issueBarFill} style={{ width: `${percent}%`, background: style.bg }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ═══ TABLE ═══ */}
      <Card>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>All Tags</h3>
          <div className={styles.searchWrap}>
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search tags..." 
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
          >All Categories</button>
          {categories.filter(c => !c.name.toLowerCase().startsWith('week')).map(cat => (
            <button 
              key={cat.name}
              className={`${styles.chip} ${categoryFilter === cat.name ? styles.active : ''}`}
              onClick={() => setCategoryFilter(cat.name)}
            >{cat.name}</button>
          ))}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Tag Name ↕</th>
                <th onClick={() => handleSort('category')}>Category ↕</th>
                <th onClick={() => handleSort('count')} style={{textAlign: 'center'}}>Count ↕</th>
                <th style={{textAlign: 'center'}}>% Share</th>
                <th style={{textAlign: 'center'}}>Top Locale</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  <td className={styles.boldText}>{row.name}</td>
                  <td>
                    <span className={styles.categoryBadge}>{row.category}</span>
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
      </Card>
    </div>
  );
}