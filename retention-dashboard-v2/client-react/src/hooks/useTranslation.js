/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  useTranslation.js - Умный хук для перевода (100% точный)
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionStore } from '../store/retentionStore';

export function useTranslation() {
  const language = useRetentionStore(state => state.language);
  const translations = useRetentionStore(state =>
    state.data?.localization?.translations?.[language] || {}
  );

  const t = (key, fallback) => {
    if (!key) return fallback || '';

    // 1. Прямое совпадение
    if (translations[key]) return translations[key];

    // 2. Ищем без учета регистра (самое надежное)
    const lowerKey = key.toLowerCase().trim();
    const dictKeys = Object.keys(translations);

    for (let i = 0; i < dictKeys.length; i++) {
      const dictKey = dictKeys[i];
      const dictKeyLower = dictKey.toLowerCase().trim();

      // Точное совпадение по нижнему регистру
      if (dictKeyLower === lowerKey) {
        return translations[dictKey];
      }

      // Если в словаре есть префикс (metric.xxx), а мы ищем без него
      if (dictKeyLower === `metric.${lowerKey}` || dictKeyLower === `kpi.${lowerKey}`) {
        return translations[dictKey];
      }

      // Если мы ищем с эмодзи, а в словаре без (или наоборот)
      // Просто проверяем, содержит ли длинная строка короткую
      if (dictKeyLower.includes(lowerKey) || lowerKey.includes(dictKeyLower)) {
        // Защита от ложных срабатываний (строки должны быть длиннее 5 символов)
        if (lowerKey.length > 5 && Math.abs(dictKeyLower.length - lowerKey.length) <= 4) {
          return translations[dictKey];
        }
      }
    }

    // Если ничего не нашли - возвращаем оригинал (на EN возвращаем fallback, если он есть)
    return language === 'EN' && fallback !== undefined ? fallback : key;
  };

  const translateMonth = (monthStr) => {
    if (!monthStr) return '';
    if (language === 'RU') return monthStr;

    const ruFull = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const enFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const ruShort = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const enShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let res = String(monthStr);

    ruFull.forEach((ru, i) => { res = res.replace(new RegExp(ru, 'gi'), enFull[i]); });
    ruShort.forEach((ru, i) => { res = res.replace(new RegExp(ru, 'gi'), enShort[i]); });

    return res;
  };

  return { t, language, translateMonth };
}