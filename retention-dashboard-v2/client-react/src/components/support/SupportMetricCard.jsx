import styles from './SupportMetricCard.module.css';

export function SupportMetricCard({ title, subtitle, value, icon, colorClass }) {
  const colorMap = {
    'yellow': '#F5B800',
    'blue': '#3b82f6',
    'purple': '#a855f7',
    'rose': '#f43f5e',
    'green': '#10b981'
  };
  
  const iconColor = colorMap[colorClass] || colorMap['blue'];

  return (
    <div className={styles.card} style={{ borderLeft: `4px solid ${iconColor}` }}>
      <div className={styles.leftGroup}>
        <div 
          className={styles.iconWrapper} 
          style={{ background: `${iconColor}15`, color: iconColor }}
        >
          {icon}
        </div>
        <div className={styles.titleBlock}>
          <span className={styles.label}>{title}</span>
          <span className={styles.sublabel}>{subtitle}</span>
        </div>
      </div>
      <div className={styles.rightGroup}>
        <span className={styles.value}>{value}</span>
      </div>
    </div>
  );
}