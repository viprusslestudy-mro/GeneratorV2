import { supabaseApi } from './supabaseApi';
import { gasCall } from './gasApi';

/**
 * Получить полный отчёт Retention (из настоящей базы)
 */
export async function getRetentionReport() {
  return supabaseApi.getRetentionReport();
}

/**
 * Получить отчёт Support (пока из мока через supabaseApi)
 */
export async function getSupportReport() {
  return supabaseApi.getSupportReport();
}

/**
 * Настройки UI (Хардкодим, чтобы не делать лишний запрос в БД)
 */
export async function getUISettings() {
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

/**
 * Получить переводы и флаг Dev Mode
 * @returns {Promise<Object>} { RU: {}, EN: {}, devMode: boolean }
 */
export async function getTranslations() {
  try {
    const response = await gasCall('api_getTranslations');
    return response;
  } catch (error) {
    console.error('[retentionApi] getTranslations error:', error);
    return { RU: {}, EN: {}, devMode: false };
  }
}

/**
 * Отправить непереведённые ключи на бэкенд
 * @param {Array} missingKeys - [{ key, screen }]
 * @returns {Promise<Object>} { success, added, skipped }
 */
export async function addMissingTranslations(missingKeys) {
  try {
    const response = await gasCall('api_addMissingTranslations', JSON.stringify(missingKeys));
    return response;
  } catch (error) {
    console.error('[retentionApi] addMissingTranslations error:', error);
    return { success: false, error: error.message };
  }
}
