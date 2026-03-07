import styles from './Loader.module.css';

export function Loader({ message = 'Загрузка данных...' }) {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
