import styles from './SatisfactionCard.module.css';
import { useTranslation } from '../../hooks/useTranslation';

export function SatisfactionCard({ satisfaction = 0, goodCount = 0, badCount = 0 }) {
  const { t } = useTranslation();
  const radius = 40; // УВЕЛИЧЕНО! Было 32
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (satisfaction / 100) * circumference;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>🤩</span> {/* Заменил на более яркий смайл */}
        </div>
        <div className={styles.titleBlock}>
          <span className={styles.label}>{t('Satisfaction', 'Satisfaction')}</span>
          <span className={styles.sublabel}>{t('Customer rating', 'Customer rating')}</span>
        </div>
      </div>

      {/* ДОБАВЛЕН TITLE ДЛЯ ПОДСКАЗКИ ПРИ НАВЕДЕНИИ */}
      <div className={styles.center} title={`Exact satisfaction: ${satisfaction}%`}>
        <div className={styles.percentBlock}>
          <span className={styles.bigValue}>{satisfaction}</span>
          <span className={styles.percentSign}>%</span>
        </div>
        
        <div className={styles.ringWrapper}>
          <svg viewBox="0 0 100 100" className={styles.svgRing}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f0e6d3" strokeWidth="12" />
            <circle 
              cx="50" cy="50" r={radius} fill="none" stroke="#FFC107" strokeWidth="12"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" className={styles.progressCircle}
            />
          </svg>
          <div className={styles.starIcon}>⭐</div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={`${styles.thumbBlock} ${styles.good}`}>
          <span className={styles.thumbIcon}>👍</span>
          <span className={styles.thumbCount}>{goodCount}</span>
          <span className={styles.thumbLabel}>{t('Good', 'Good')}</span>
        </div>
        <div className={`${styles.thumbBlock} ${styles.bad}`}>
          <span className={styles.thumbIcon}>👎</span>
          <span className={styles.thumbCount}>{badCount}</span>
          <span className={styles.thumbLabel}>{t('Bad', 'Bad')}</span>
        </div>
      </div>
    </div>
  );
}
