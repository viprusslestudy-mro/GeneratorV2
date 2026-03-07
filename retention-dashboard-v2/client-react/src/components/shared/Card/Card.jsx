import styles from './Card.module.css';

export function Card({ children, title, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
