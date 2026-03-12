/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LegacyReports.js - Старые функции генерации отчётов (для совместимости)
 *  Путь: apps-script/src/legacy/LegacyReports.js
 * ═══════════════════════════════════════════════════════════════════════════
 *  ВНИМАНИЕ: Этот файл содержит legacy код для обратной совместимости.
 *  Основной функционал перенесён в React Dashboard v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        LEGACY DATA COLLECTION                              ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Собрать данные для retention-отчета (legacy функция для совместимости)
 * @param {boolean} detailedLogging - Флаг детального логирования
 * @returns {Object} Данные отчета
 */
function collectReportData(detailedLogging = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = createEmptyReport();

  const settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (settingsSheet) {
    const settings = readSheetAsKeyValue(settingsSheet);
    report.meta.month = settings.month || 'Месяц';
    report.meta.year = parseNumber(settings.year || new Date().getFullYear());
  }

  report.retention = collectRetentionData();
  return report;
}

/**
 * Создать пустую структуру отчета (legacy)
 * @returns {Object} Пустая структура
 */
function createEmptyReport() {
  return {
    meta: {
      month: '',
      year: new Date().getFullYear(),
      generatedAt: new Date().toISOString()
    },
    retention: null
  };
}

/**
 * Валидация отчета (legacy)
 * @param {Object} reportData - Данные отчёта
 * @returns {Object} Результат валидации
 */
function validateReport(reportData) {
  const errors = [];

  if (!reportData) {
    errors.push('Данные отчета отсутствуют');
    return { valid: false, errors: errors };
  }

  if (!reportData.retention) {
    errors.push('Данные retention отсутствуют');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Генерация имени файла retention отчета (legacy)
 * @param {Object} reportData - Данные отчёта
 * @returns {string} Имя файла
 */
function generateRetentionFileName(reportData) {
  const periodsCount = reportData.periodsCount || reportData.periods?.length || 0;
  const dateStr = Utilities.formatDate(new Date(), 'Europe/Kiev', 'dd_MM_yyyy_HH_mm');
  return `RetentionReport_${periodsCount}months_${dateStr}.html`;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        LEGACY SUPPORT REPORTS                              ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Сгенерировать Support отчет (legacy - показывает React Dashboard)
 */
function generateSupportReport() {
  // Редирект на React Dashboard
  showReactDashboard();
}

/**
 * Показать предпросмотр Support (legacy - показывает React Dashboard)
 */
function showSupportPreview() {
  showReactDashboard();
}

/**
 * Показать главный дашборд (legacy - показывает React Dashboard)
 */
function showDashboardPreview() {
  showReactDashboard();
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   LEGACY ASYNC GENERATION (DEPRECATED)                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * @deprecated Используйте downloadReactDashboard() вместо этого
 * Запуск генерации ПОЛНОГО отчета - теперь перенаправляет на новую функцию
 */
function generateFullDashboardReport() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    '⚠️ Функция устарела',
    'Генерация HTML отчётов через старую систему больше не поддерживается.\n\n' +
    'Используйте:\n' +
    '• "💻 Открыть React Dashboard" - для просмотра\n' +
    '• "📦 Скачать Dashboard (HTML)" - для скачивания файла\n\n' +
    'Старые отчёты удалены для экономии места.',
    ui.ButtonSet.OK
  );
}

/**
 * @deprecated Используйте downloadReactDashboard() вместо этого
 * Запуск генерации RETENTION отчета - теперь перенаправляет на новую функцию
 */
function generateRetentionReport() {
  generateFullDashboardReport(); // Показываем то же сообщение
}

/**
 * @deprecated Backend функции больше не нужны
 */
function generateFullDashboardBackend() {
  throw new Error('Функция устарела. Используйте downloadReactDashboard()');
}

/**
 * @deprecated Backend функции больше не нужны
 */
function generateRetentionBackend() {
  throw new Error('Функция устарела. Используйте downloadReactDashboard()');
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   LEGACY STORAGE FUNCTIONS (DEPRECATED)                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * @deprecated Хранилище больше не используется
 */
function saveHTMLToStorage(html, key) {
  Logger.log('[DEPRECATED] saveHTMLToStorage больше не используется');
  return false;
}

/**
 * @deprecated Хранилище больше не используется
 */
function loadHTMLFromStorage(key) {
  Logger.log('[DEPRECATED] loadHTMLFromStorage больше не используется');
  return null;
}

/**
 * @deprecated Хранилище больше не используется
 */
function getStoredHTML(storageKey) {
  Logger.log('[DEPRECATED] getStoredHTML больше не используется');
  return '';
}

/**
 * @deprecated Не используется
 */
function getDownloadInterface(storageKey, fileName, fileSize) {
  return '<html><body><h2>Функция устарела</h2><p>Используйте "📦 Скачать Dashboard (HTML)"</p></body></html>';
}

/**
 * @deprecated Не используется
 */
function showAutoDownloadDialog(htmlContent, fileName) {
  // Используем новую функцию
  downloadReactDashboard();
}

/**
 * @deprecated Триггер автоочистки больше не нужен
 */
function triggerAutoClear() {
  // Ничего не делаем - хранилище не используется
  Logger.log('[DEPRECATED] triggerAutoClear больше не нужен');
}

/**
 * @deprecated Очистка storage больше не нужна
 */
function cleanupStorage(key) {
  Logger.log('[DEPRECATED] cleanupStorage - используйте cleanupAppStorage()');
}

/**
 * @deprecated Очистка storage больше не нужна  
 */
function cleanupStorageV2(props, key) {
  // Оставляем для совместимости, но ничего критичного не делаем
  try {
    const oldChunksCount = parseInt(props.getProperty(key + '_CHUNKS_COUNT') || '0', 10);
    if (oldChunksCount > 0) {
      for (let i = 0; i < oldChunksCount; i++) {
        props.deleteProperty(key + '_CHUNK_' + i);
      }
      props.deleteProperty(key + '_CHUNKS_COUNT');
      props.deleteProperty(key + '_TOTAL_SIZE');
    }
  } catch (e) {
    // Игнорируем ошибки
  }
}

/**
 * @deprecated Очистка всех чанков
 */
function cleanupAllChunksInProps(props) {
  try {
    const data = props.getProperties();
    for (const key in data) {
      if (key.includes('_CHUNK_') || key.includes('_CHUNKS_COUNT') || key.includes('_TOTAL_SIZE')) {
        props.deleteProperty(key);
      }
    }
  } catch (e) {
    // Игнорируем ошибки
  }
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   LEGACY HTML BUILDERS (DEPRECATED)                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * @deprecated React Dashboard не использует эти функции
 */
function buildAppShell(type) {
  // Возвращаем React app
  return getReactAppHTML();
}

/**
 * @deprecated React Dashboard не использует эти функции
 */
function buildRetentionHTML(reportJSON, showAllTime) {
  Logger.log('[DEPRECATED] buildRetentionHTML - используется React Dashboard');
  return getReactAppHTML();
}

/**
 * @deprecated React Dashboard не использует эти функции
 */
function buildSupportPreviewHTML(reportJSON) {
  Logger.log('[DEPRECATED] buildSupportPreviewHTML - используется React Dashboard');
  return getReactAppHTML();
}

/**
 * @deprecated Async loader HTML больше не используется
 */
function getAsyncLoaderHtml(type) {
  return `<!DOCTYPE html>
<html><head><title>Deprecated</title></head>
<body style="font-family: sans-serif; padding: 40px; text-align: center;">
  <h2>⚠️ Функция устарела</h2>
  <p>Используйте "📦 Скачать Dashboard (HTML)" в меню.</p>
  <button onclick="google.script.host.close()">Закрыть</button>
</body></html>`;
}