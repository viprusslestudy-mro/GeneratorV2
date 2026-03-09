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
  const isChannels = activeScreen === 'channels';
  const isFinance = activeScreen === 'finance';

  // 2. МЕМОИЗИРУЕМ РАСЧЕТ ПЕРИОДОВ RETENTION С ФИЛЬТРАЦИЕЙ
  const retentionPeriods = useMemo(() => {
    const allPeriods = data?.periods || [];
    
    // Фильтруем в зависимости от активного экрана
    if (isChannels) {
      return allPeriods.filter(p => p.hasChannels === true);
    }
    if (isFinance) {
      return allPeriods.filter(p => p.hasFinance === true);
    }
    
    // По умолчанию возвращаем все периоды
    return allPeriods;
  }, [data, isChannels, isFinance]);

  // 3. БЕРЕМ УЖЕ ГОТОВЫЕ ПЕРИОДЫ SUPPORT ИЗ КЕША (уже перевёрнуты!)
  const supportPeriods = useRetentionStore(state => state.supportPeriodsCache) || [];

  // Выбираем нужные периоды в зависимости от активного экрана
  const activePeriods = isSupport ? supportPeriods : retentionPeriods;
  const activeSelectedPeriod = isSupport ? selectedSupportPeriod : selectedPeriod;
  const activeSetPeriod = isSupport ? setSupportPeriod : setPeriod;

  // 4. ПРОВЕРКА: Если выбранный период не в списке доступных — выбираем первый доступный
  const isSelectedPeriodValid = activePeriods.some(p => p.key === activeSelectedPeriod);
  
  // Автовыбор первого доступного периода при смене вкладки
  useMemo(() => {
    if (!isSelectedPeriodValid && activePeriods.length > 0 && !isSupport) {
      // Выбираем первый период (самый свежий, т.к. они уже отсортированы)
      activeSetPeriod(activePeriods[0].key);
    }
  }, [isSelectedPeriodValid, activePeriods, activeSetPeriod, isSupport]);

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
          {t('tab.finance', '💰 Main Dashboard')}
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'channels' ? styles.active : ''}`}
          onClick={() => onScreenChange('channels')}
        >
          {t('tab.channels', '📈 Communication channels')}
        </button>
      </nav>

      {/* Navigation - Support */}
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Support</div>
        <button 
          className={`${styles.navItem} ${activeScreen === 'support_stats' ? styles.active : ''}`}
          onClick={() => onScreenChange('support_stats')}
        >
          {t('tab.support_stats', '📋 LiveChat KPI')}
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'support_tags' ? styles.active : ''}`}
          onClick={() => onScreenChange('support_tags')}
        >
          {t('tab.support_tags', '🏷️ Issue Tags')}
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