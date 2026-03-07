/*
 * ═══════════════════════════════════════════════════════════════════════════
 *  Sidebar.jsx - Боковая панель для Retention Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { usePeriodFilter } from '../../../hooks/usePeriodFilter';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { periods, selectedPeriod, setPeriod } = usePeriodFilter();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>📊</span>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>Retention</div>
          <div className={styles.logoSubtitle}>Dashboard v2.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navItem + ' ' + styles.active}>
          💰 Finance Dashboard
        </div>
        <div className={styles.navItem + ' ' + styles.disabled}>
          📈 Channels (скоро)
        </div>
      </nav>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        <div className={styles.selectorTitle}>Выберите период</div>
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

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerText}>
          Powered by React + Zustand
        </div>
      </div>
    </aside>
  );
}
