/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  useTranslation.js - Умный хук для перевода (100% точный)
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionStore } from '../store/retentionStore';
import { useCallback } from 'react';

// Храним уже залогированные ключи вне React-цикла (чтобы не спамить)
const loggedMissingKeys = new Set();
// Статичный пустой объект, чтобы не создавать новые референсы в селекторе
const EMPTY_TRANSLATIONS = {};

export function useTranslation() {
  const language = useRetentionStore(state => state.language);
  const devMode = useRetentionStore(state => state.devMode);
  const currentScreen = useRetentionStore(state => state.currentScreen);

  // ИСПРАВЛЕНИЕ: Используем EMPTY_TRANSLATIONS вместо создания нового объекта {}
  const translations = useRetentionStore(state => {
    // Сначала пробуем новый формат
    if (state.translations && Object.keys(state.translations).length > 0) {
      return state.translations[language] || EMPTY_TRANSLATIONS;
    }
    // Фолбек на старый формат
    return state.data?.localization?.translations?.[language] || EMPTY_TRANSLATIONS;
  });

  // Используем useCallback, чтобы функция не пересоздавалась при каждом рендере
  const t = useCallback((key, fallback) => {
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
      if (dictKeyLower.includes(lowerKey) || lowerKey.includes(dictKeyLower)) {
        // Защита от ложных срабатываний (строки должны быть длиннее 5 символов)
        if (lowerKey.length > 5 && Math.abs(dictKeyLower.length - lowerKey.length) <= 4) {
          return translations[dictKey];
        }
      }
    }

    // Логируем непереведённое ТОЛЬКО если мы в DevMode, язык RU, и мы ещё не логировали этот ключ
    // Запускаем асинхронно через setTimeout, чтобы не прерывать текущий рендер
    if (devMode && language === 'RU' && !loggedMissingKeys.has(key)) {
      loggedMissingKeys.add(key); // Отмечаем как залогированный сразу
      
      setTimeout(() => {
        // Добавляем в Store (Zustand)
        useRetentionStore.getState().addMissingTranslation(key, currentScreen);
      }, 0);
    }

    // Если ничего не нашли - возвращаем оригинал
    return language === 'EN' && fallback !== undefined ? fallback : key;
  }, [translations, language, devMode, currentScreen]);

  const translateMonth = useCallback((monthStr) => {
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
  }, [language]);

  return { t, language, translateMonth };
}