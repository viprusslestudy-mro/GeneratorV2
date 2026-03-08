import { supabaseApi } from './supabaseApi';
import { gasApi } from './gasApi'; // ИСПРАВЛЕНО: импортируем gasApi вместо gasCall

/**
 * Получить полный отчёт Retention (из настоящей базы)
 */
async function getRetentionReport() {
  return supabaseApi.getRetentionReport();
}

/**
 * Получить отчёт Support (пока из мока через supabaseApi)
 */
async function getSupportReport() {
  return supabaseApi.getSupportReport();
}

/**
 * Настройки UI (Хардкодим, чтобы не делать лишний запрос в БД)
 */
async function getUISettings() {
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
async function getTranslations() {
  try {
    // В локальном режиме нужен мок api_getTranslations.json
    const response = await gasApi.call('api_getTranslations');
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
async function addMissingTranslations(missingKeys) {
  try {
    const response = await gasApi.call('api_addMissingTranslations', JSON.stringify(missingKeys));
    return response;
  } catch (error) {
    console.error('[retentionApi] addMissingTranslations error:', error);
    return { success: false, error: error.message };
  }
}

// Экспортируем как единый объект для удобства использования в store
export const retentionApi = {
  getReport: getRetentionReport, // ИСПРАВЛЕНО: Алиас для совместимости со store
  getSupportReport,
  getUISettings,
  getTranslations,
  addMissingTranslations
};

// Экспортируем и отдельные функции для обратной совместимости, если где-то используются
export {
  getRetentionReport as _getRetentionReport,
  getSupportReport as _getSupportReport,
  getUISettings as _getUISettings,
  getTranslations as _getTranslations,
  addMissingTranslations as _addMissingTranslations
};