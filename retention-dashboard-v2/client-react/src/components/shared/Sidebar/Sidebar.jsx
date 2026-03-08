// ДОБАВЛЕНО: Импортируем наш хук перевода
import { useTranslation } from '../../../hooks/useTranslation';
import { useRetentionStore, selectPeriods, selectSupportPeriods } from '../../../store/retentionStore';
import styles from './Sidebar.module.css';

export function Sidebar({ activeScreen, onScreenChange }) {
  const { t, translateMonth } = useTranslation(); // Инициализируем переводчик с функцией месяцев
  const projectSettings = useRetentionStore(state => state.projectSettings);
  
  // Читаем из стора ВСЕ данные
  const retentionPeriods = useRetentionStore(selectPeriods);
  const supportPeriods = useRetentionStore(selectSupportPeriods);
  const selectedRetentionPeriod = useRetentionStore(state => state.selectedPeriod);
  const selectedSupportPeriod = useRetentionStore(state => state.selectedSupportPeriod);
  const setRetentionPeriod = useRetentionStore(state => state.setPeriod);
  const setSupportPeriod = useRetentionStore(state => state.setSupportPeriod);

  // Определяем, мы в Retention или в Support
  const isSupport = activeScreen.startsWith('support');
  
  // Выбираем нужные данные для отображения
  const activePeriods = isSupport ? supportPeriods : retentionPeriods;
  const activeSelectedPeriod = isSupport ? selectedSupportPeriod : selectedRetentionPeriod;
  const activeSetPeriod = isSupport ? setSupportPeriod : setRetentionPeriod;

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
          <div className={styles.projectIconFallback}>
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
          {/* ИСПРАВЛЕНО: Ключом является русская фраза */}
          <span>💰</span> {t('Главная панель', 'Main Dashboard')}
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'channels' ? styles.active : ''}`}
          onClick={() => onScreenChange('channels')}
        >
          {/* ИСПРАВЛЕНО: Ключом является русская фраза */}
          <span>📈</span> {t('Каналы коммуникации', 'Communication channels')}
        </button>
      </nav>

      {/* Navigation - Support */}
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Support</div>
        <button 
          className={`${styles.navItem} ${activeScreen === 'support_stats' ? styles.active : ''}`}
          onClick={() => onScreenChange('support_stats')}
        >
          {/* ИСПРАВЛЕНО: Ключом является русская фраза */}
          <span>📋</span> {t('Показатели LiveChat', 'LiveChat KPI')}
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'support_tags' ? styles.active : ''}`}
          onClick={() => onScreenChange('support_tags')}
        >
          {/* ИСПРАВЛЕНО: Ключом является русская фраза */}
          <span>🏷️</span> {t('Тэги проблем', 'Issue Tags')}
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
              {/* ИСПРАВЛЕНО: УМНЫЙ ПЕРЕВОД МЕСЯЦА */}
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
