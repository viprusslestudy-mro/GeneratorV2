/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  useTranslation.js - Умный хук для перевода
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionStore } from '../store/retentionStore';

function stripEmoji(text) {
  if (!text) return '';
  let str = String(text);
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) { i++; continue; }
    if (code >= 0x2600 && code <= 0x27BF) continue;
    if (code >= 0x2300 && code <= 0x23FF) continue;
    if (code >= 0x2B50 && code <= 0x2B55) continue;
    if (code === 0x200D || code === 0xFE0F || code === 0x20E3) continue;
    result += str[i];
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function useTranslation() {
  const language = useRetentionStore(state => state.language);
  const translations = useRetentionStore(state => 
    state.data?.localization?.translations?.[language] || {}
  );

  // Умный перевод: ищет точную фразу в словаре
  const t = (key, fallback) => {
    if (!key) return fallback || '';
    
    // 1. Ищем точное совпадение (как есть)
    if (translations[key]) return translations[key];
    
    // 2. Ищем без эмодзи
    const cleanKey = stripEmoji(key);
    if (translations[cleanKey]) return translations[cleanKey];

    // 3. Ищем в нижнем регистре
    const lowerKey = key.toLowerCase().trim();
    
    // Перебираем все ключи в словаре, сравнивая их в нижнем регистре
    const dictKeys = Object.keys(translations);
    for (let i = 0; i < dictKeys.length; i++) {
      const dictKeyLower = dictKeys[i].toLowerCase().trim();
      
      // Если ключи совпали без учета регистра
      if (dictKeyLower === lowerKey) {
        return translations[dictKeys[i]];
      }
      
      // Если ключ из таблицы (например, metric.casino_stake_amount)
      // совпал с тем, что мы ищем (например, просто casino_stake_amount)
      if (dictKeyLower === `metric.${lowerKey}` || dictKeyLower === `kpi.${lowerKey}`) {
        return translations[dictKeys[i]];
      }
    }

    // 4. Возвращаем оригинальный текст, если ничего не нашли
    return language === 'EN' && fallback !== undefined ? fallback : key;
  };

  // Специальный переводчик для месяцев (Январь 2026 -> January 2026)
  const translateMonth = (monthStr) => {
    if (!monthStr) return '';
    if (language === 'RU') return monthStr; // Если русский - оставляем как есть
    
    const ruFull = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const enFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const ruShort = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const enShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    let res = String(monthStr);
    
    ruFull.forEach((ru, i) => {
      res = res.replace(new RegExp(ru, 'gi'), enFull[i]);
    });
    ruShort.forEach((ru, i) => {
      res = res.replace(new RegExp(ru, 'gi'), enShort[i]);
    });
    
    return res;
  };

  return { t, language, translateMonth };
}