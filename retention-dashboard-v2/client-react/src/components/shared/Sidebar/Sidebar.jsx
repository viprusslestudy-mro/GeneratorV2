/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Sidebar.jsx - Боковая панель для Retention Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { usePeriodFilter } from '../../../hooks/usePeriodFilter';
import { useRetentionStore } from '../../../store/retentionStore';
import styles from './Sidebar.module.css';

export function Sidebar({ activeScreen, onScreenChange }) {
  const { periods, selectedPeriod, setPeriod } = usePeriodFilter();
  const projectSettings = useRetentionStore(state => state.projectSettings);

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

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Retention</div>
        <button 
          className={`${styles.navItem} ${activeScreen === 'finance' ? styles.active : ''}`}
          onClick={() => onScreenChange('finance')}
        >
          💰 Main Dashboard
        </button>
        <button 
          className={`${styles.navItem} ${activeScreen === 'channels' ? styles.active : ''}`}
          onClick={() => onScreenChange('channels')}
        >
          📈 Communication channels
        </button>
      </nav>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        <div className={styles.selectorTitle}>Select Period</div>
        <div className={styles.periodList}>
          {periods.map(period => (
            <button
              key={period.key}
              className={`${styles.periodItem} ${
                selectedPeriod === period.key ? styles.selected : ''
              }`}
              onClick={() => setPeriod(period.key)}
            >
              <span className={styles.periodLabel}>{period.label}</span>
              {selectedPeriod === period.key && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
