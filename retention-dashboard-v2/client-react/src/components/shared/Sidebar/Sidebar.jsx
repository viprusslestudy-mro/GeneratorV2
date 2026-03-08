import { useMemo } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useRetentionStore } from '../../../store/retentionStore';
import styles from './Sidebar.module.css';

export function Sidebar({ activeScreen, onScreenChange }) {
  const { t, translateMonth } = useTranslation();
  
  // 1. Берем только сырые данные
  const projectSettings = useRetentionStore(state => state.projectSettings);
  const data = useRetentionStore(state => state.data);
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);
  const selectedSupportPeriod = useRetentionStore(state => state.selectedSupportPeriod);
  
  const setPeriod = useRetentionStore(state => state.setPeriod);
  const setSupportPeriod = useRetentionStore(state => state.setSupportPeriod);

  const isSupport = activeScreen.startsWith('support');

  // 2. МЕМОИЗИРУЕМ РАСЧЕТ ПЕРИОДОВ RETENTION
  const retentionPeriods = useMemo(() => {
    return data?.periods || [];
  }, [data]);

  // 3. БЕРЕМ УЖЕ ГОТОВЫЕ ПЕРИОДЫ SUPPORT ИЗ КЕША (уже перевёрнуты!)
  const supportPeriods = useRetentionStore(state => state.supportPeriodsCache) || [];

  // Выбираем нужные периоды в зависимости от активного экрана
  const activePeriods = isSupport ? supportPeriods : retentionPeriods;
  const activeSelectedPeriod = isSupport ? selectedSupportPeriod : selectedPeriod;
  const activeSetPeriod = isSupport ? setSupportPeriod : setPeriod;

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>📊</span>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>RETENZA</div>
        </div>
      </div>

      {/* Project Card */}
      <div className={styles.projectCard}>
        <div className={styles.projectIcon}>
          {projectSettings.logoUrl ? (
            <img 
              src={projectSettings.logoUrl} 
              alt="Project Logo"
              className={styles.projectLogo}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={styles.projectIconFallback}
            style={{ display: projectSettings.logoUrl ? 'none' : 'flex' }}
          >
            {projectSettings.icon}
          </div>
        </div>
        <div className={styles.projectInfo}>
          <span className={styles.projectLabel}>Dashboard</span>
          <span className={styles.projectName}>{projectSettings.name}</span>
        </div>
      </div>

      {/* Navigation - Retention */}
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Retention</div>
        <button 
          className={`${styles.navItem} ${activeScreen === 'finance' ? styles.active : ''}`}
          onClick={() => onScreenChange('finance')}
        >
          <span>💰</span> {t('tab.finance', 'Main Dashboard')}
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'channels' ? styles.active : ''}`}
          onClick={() => onScreenChange('channels')}
        >
          <span>📈</span> {t('tab.channels', 'Communication channels')}
        </button>
      </nav>

      {/* Navigation - Support */}
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Support</div>
        <button 
          className={`${styles.navItem} ${activeScreen === 'support_stats' ? styles.active : ''}`}
          onClick={() => onScreenChange('support_stats')}
        >
          <span>📋</span> {t('tab.support_stats', 'LiveChat KPI')}
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'support_tags' ? styles.active : ''}`}
          onClick={() => onScreenChange('support_tags')}
        >
          <span>🏷️</span> {t('tab.support_tags', 'Issue Tags')}
        </button>
      </nav>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        <div className={styles.selectorTitle}>{t('label.period', 'Select Period')}</div>
        <div className={styles.periodList}>
          {activePeriods.map(period => (
            <button
              key={period.key}
              className={`${styles.periodItem} ${
                activeSelectedPeriod === period.key ? styles.selected : ''
              }`}
              onClick={() => activeSetPeriod(period.key)}
            >
              <span className={styles.periodLabel}>{translateMonth(period.label)}</span>
              {activeSelectedPeriod === period.key && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}