/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  retentionApi.js - API для получения данных Retention
 *  Путь: client-react/src/api/retentionApi.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { supabaseApi } from './supabaseApi';
import { gasApi } from './gasApi';

/**
 * Определяем режим работы
 * - Embedded (скачанный HTML) → gasApi
 * - GAS Dialog → gasApi
 * - Web (Vercel) → supabaseApi
 */
function getDataSource() {
  // 1. Embedded режим (скачанный файл)
  if (typeof window !== 'undefined' && window.__EMBEDDED_MODE__ === true) {
    return 'embedded';
  }
  
  // 2. Google Apps Script Dialog (есть google.script.run)
  if (typeof google !== 'undefined' && google?.script?.run) {
    return 'gas';
  }
  
  // 3. Web (Vercel, localhost без GAS)
  return 'web';
}

/**
 * Получить полный отчёт Retention
 * @returns {Promise<Object>}
 */
async function getRetentionReport() {
  const source = getDataSource();
  
  console.log(`[retentionApi] Data source: ${source}`);
  
  switch (source) {
    case 'embedded':
    case 'gas':
      // Из Google Apps Script или встроенных данных
      return gasApi.call('api_getRetentionReport');
    
    case 'web':
    default:
      // Из Supabase (веб-версия)
      return supabaseApi.getRetentionReport();
  }
}

/**
 * Получить отчёт Support
 * @returns {Promise<Object>}
 */
async function getSupportReport() {
  const source = getDataSource();
  
  switch (source) {
    case 'embedded':
    case 'gas':
      return gasApi.call('api_getSupportReport');
    
    case 'web':
    default:
      return supabaseApi.getSupportReport();
  }
}

/**
 * Получить настройки UI
 * @returns {Promise<Object>}
 */
async function getUISettings() {
  const source = getDataSource();
  
  switch (source) {
    case 'embedded':
    case 'gas':
      return gasApi.call('api_getUISettings');
    
    case 'web':
    default:
      // Хардкод для веб-версии (можно позже перенести в Supabase)
      return {
        financeTabs: {
          deposits: "ДЕПОЗИТЫ",
          sport: "СПОРТ",
          casino: "КАЗИНО",
          profit: "ПРОФИТ И БОНУСЫ"
        },
        channelTabs: {
          mail: "E-mail",
          push: "App Push",
          webpush: "Web-Push",
          sms: "SMS",
          tg: "Telegram",
          wa: "WhatsApp",
          popup: "Pop-Up"
        }
      };
  }
}

/**
 * Получить переводы
 * @returns {Promise<Object>} { RU: {}, EN: {}, devMode: boolean }
 */
async function getTranslations() {
  const source = getDataSource();
  
  try {
    switch (source) {
      case 'embedded':
      case 'gas':
        return gasApi.call('api_getTranslations');
      
      case 'web':
      default:
        const response = await supabaseApi.getTranslations();
        
        if (!response) {
          console.warn('[retentionApi] Переводы в БД не найдены, используем дефолт');
          return { RU: {}, EN: {}, devMode: false };
        }
        
        return response;
    }
  } catch (error) {
    console.error('[retentionApi] getTranslations error:', error);
    return { RU: {}, EN: {}, devMode: false };
  }
}

/**
 * Получить список источников
 * @returns {Promise<Array>}
 */
async function getSources() {
  const source = getDataSource();
  
  switch (source) {
    case 'embedded':
    case 'gas':
      return gasApi.call('api_getSources');
    
    case 'web':
    default:
      // Для веб-версии можно вернуть хардкод или запросить из Supabase
      return [
        { key: 'retention', name: 'Retention', icon: '📊', color: '#9c27b0' },
        { key: 'support', name: 'Support', icon: '🎧', color: '#2196f3' }
      ];
  }
}

/**
 * Отправить непереведённые ключи на бэкенд
 * @param {Array} missingKeys - [{ key, screen }]
 * @returns {Promise<Object>} { success, added, skipped }
 */
async function addMissingTranslations(missingKeys) {
  const source = getDataSource();
  
  // Только для GAS режима (не работает в embedded)
  if (source === 'gas') {
    try {
      const response = await gasApi.call('api_addMissingTranslations', JSON.stringify(missingKeys));
      return response;
    } catch (error) {
      console.error('[retentionApi] addMissingTranslations error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // В embedded или web режиме ничего не делаем
  console.warn('[retentionApi] addMissingTranslations не доступно в режиме:', source);
  return { success: false, error: 'Not available in this mode' };
}

// Экспортируем как единый объект
export const retentionApi = {
  getReport: getRetentionReport,
  getSupportReport,
  getUISettings,
  getTranslations,
  getSources,
  addMissingTranslations
};

// Экспортируем отдельные функции для обратной совместимости
export {
  getRetentionReport as _getRetentionReport,
  getSupportReport as _getSupportReport,
  getUISettings as _getUISettings,
  getTranslations as _getTranslations,
  getSources as _getSources,
  addMissingTranslations as _addMissingTranslations
};