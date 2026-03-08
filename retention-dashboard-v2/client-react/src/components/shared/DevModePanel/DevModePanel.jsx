/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DevModePanel.jsx - Панель разработчика для поиска непереведённых фраз
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { useRetentionStore } from '../../../store/retentionStore';
import styles from './DevModePanel.module.css';

export function DevModePanel() {
  const devMode = useRetentionStore(state => state.devMode);
  const missingTranslations = useRetentionStore(state => state.missingTranslations);
  const clearMissingTranslations = useRetentionStore(state => state.clearMissingTranslations);
  const sendMissingTranslations = useRetentionStore(state => state.sendMissingTranslations);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!devMode) return null;

  const missingCount = missingTranslations.size;
  const missingArray = Array.from(missingTranslations).map(item => JSON.parse(item));

  const handleSend = async () => {
    if (missingCount === 0) return;
    
    setIsSending(true);
    await sendMissingTranslations();
    setIsSending(false);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.icon}>🔍</span>
        <span className={styles.title}>Dev Mode: Непереведённые фразы</span>
        <span className={styles.badge}>{missingCount}</span>
        <button className={styles.toggle}>
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.actions}>
            <button 
              className={styles.btnClear}
              onClick={clearMissingTranslations}
              disabled={missingCount === 0}
            >
              🗑️ Очистить
            </button>
            <button 
              className={styles.btnSend}
              onClick={handleSend}
              disabled={missingCount === 0 || isSending}
            >
              {isSending ? '⏳ Отправка...' : `📤 Добавить в таблицу (${missingCount})`}
            </button>
          </div>

          {missingCount > 0 ? (
            <div className={styles.list}>
              {missingArray.map((item, idx) => (
                <div key={idx} className={styles.item}>
                  <span className={styles.itemKey}>{item.key}</span>
                  <span className={styles.itemScreen}>{item.screen}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              ✅ Все фразы переведены! Переключайтесь между вкладками для проверки.
            </div>
          )}

          <div className={styles.hint}>
            💡 Перемещайтесь по всем вкладкам (Finance, Channels, Support Stats, Support Tags), 
            чтобы собрать все непереведённые фразы.
          </div>
        </div>
      )}
    </div>
  );
}