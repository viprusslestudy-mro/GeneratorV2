/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Main.js - Главный модуль (React Dashboard)
 *  Путь: apps-script/src/Main.js
 * ═══════════════════════════════════════════════════════════════════════════
 *  VERSION: 2.0.0
 *
 *  Функции:
 *  - Показ React Dashboard
 *  - Получение данных для API
 *  - Утилиты
 * ═══════════════════════════════════════════════════════════════════════════
 */

const APP_VERSION = '2.0.0';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        REACT DASHBOARD                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Показать React Dashboard в диалоге
 * @param {boolean} exportMode - Если true, возвращает HTML строку вместо показа окна
 * @returns {string|void}
 */
function showReactDashboard(exportMode) {
  try {
    const htmlContent = getReactAppHTML();
    
    // Если режим экспорта - возвращаем HTML как строку
    if (exportMode === true) {
      return htmlContent;
    }
    
    // Иначе показываем окно как обычно
    const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(1600)
      .setHeight(900)
      .setTitle('Retention Dashboard v2.0');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📊 Retention Dashboard v2.0');
    
  } catch (error) {
    Logger.log('[showReactDashboard] ERROR: ' + error.message);
    if (exportMode) return null;
    
    SpreadsheetApp.getUi().alert(
      '❌ Ошибка', 
      'Не удалось загрузить Dashboard:\n\n' + error.message, 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Получить HTML React приложения
 * @returns {string} HTML код
 */
function getReactAppHTML() {
  // DEBUG режим - редирект на localhost (для разработки)
  if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
    return `<!DOCTYPE html><html><head><title>Dev Redirect</title></head>
      <body style="margin:0;padding:0;overflow:hidden;">
        <iframe src="http://localhost:5173" style="width:100vw;height:100vh;border:none;"></iframe>
      </body></html>`;
  }
  
  // Production - читаем собранный Vite файл
  try {
    return HtmlService.createHtmlOutputFromFile('dist/index').getContent();
  } catch (e) {
    Logger.log('[getReactAppHTML] Build not found: ' + e.message);
    
    // Fallback - показываем сообщение об ошибке
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dashboard Error</title></head>
      <body style="font-family: sans-serif; padding: 50px; text-align: center; background: #f8f9fa;">
        <h2 style="color: #e74c3c;">⚠️ React Build не найден</h2>
        <p>Файл <b>dist/index.html</b> отсутствует на сервере Google Apps Script.</p>
        <p>Пожалуйста, выполните команды:</p>
        <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; display: inline-block; text-align: left;">
cd client-react
npm run build
cd ../apps-script
clasp push</pre>
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">Версия: ${APP_VERSION}</p>
      </body></html>`;
  }
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        DATA FETCHING (для API)                            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Универсальная функция получения данных по источнику
 * @param {string} sourceKey - Ключ источника (retention, support, etc)
 * @returns {Object} JSON данные отчета
 */
function getReportData(sourceKey) {
  const sourceConfig = getSourceByKey(sourceKey);
  
  if (!sourceConfig) {
    throw new Error(`Source not found: ${sourceKey}`);
  }

  const template = (sourceConfig.template || 'Retention').toLowerCase();

  switch (template) {
    case 'retention':
      return getRetentionReportJSON(sourceConfig);
    case 'support':
      return getSupportReportJSON(sourceConfig);
    default:
      throw new Error(`Unknown template: ${template} for source: ${sourceKey}`);
  }
}

/**
 * Получить JSON данные Support отчета
 * @param {Object} sourceConfig - Конфигурация источника
 * @returns {Object} JSON данные
 */
function getSupportReportJSON(sourceConfig) {
  const supportData = collectAllSupportPeriods(sourceConfig);
  return supportData;
}

/**
 * Получить JSON данные Retention отчета
 * @param {Object} sourceConfig - Конфигурация источника
 * @returns {Object} JSON данные
 */
function getRetentionReportJSON(sourceConfig) {
  invalidateMetricsConfigCache();
  
  const sourceKey = sourceConfig ? sourceConfig.key : 'retention';
  const activeMonths = getActiveMonthsForSource(sourceKey);
  const retentionData = collectRetentionData(sourceConfig);
  
  return createReportJSON(activeMonths, retentionData);
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        UTILITIES                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Получить ID активной таблицы
 * @returns {string}
 */
function getActiveSpreadsheetId() {
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}

/**
 * Форматировать размер файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Форматированный размер
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Экранировать HTML для безопасного отображения
 * @param {string} text - Текст для экранирования
 * @returns {string} Экранированный текст
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}