/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MAIN.gs - Главный модуль / Точка входа
 * ═══════════════════════════════════════════════════════════════════════════
 *  VERSION: 1.0.75
 *
 *  Основные функции:
 *  - Запуск генерации отчета
 *  - Публичные функции для UI
 *
 *  Примечание: Меню вынесено в Menu.gs
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const APP_VERSION = '1.0.75';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        АСИНХРОННЫЙ ЗАПУСК (ПРАВИЛЬНЫЙ)                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Запуск генерации ПОЛНОГО отчета (открывает окно-лоадер)
 */
function generateFullDashboardReport() {
  const ui = SpreadsheetApp.getUi();
  const html = HtmlService.createHtmlOutput(getAsyncLoaderHtml('full'))
    .setWidth(450)
    .setHeight(360);
  ui.showModalDialog(html, '📊 Генерация полного дашборда');
}

/**
 * Запуск генерации RETENTION отчета (открывает окно-лоадер)
 */
function generateRetentionReport() {
  const ui = SpreadsheetApp.getUi();
  const html = HtmlService.createHtmlOutput(getAsyncLoaderHtml('retention'))
    .setWidth(450)
    .setHeight(360);
  ui.showModalDialog(html, '📊 Генерация Retention отчета');
}

/**
 * HTML/JS код окна загрузки
 * @param {string} type - 'full' или 'retention'
 */
function getAsyncLoaderHtml(type) {
  const functionToCall = type === 'full' ? 'generateFullDashboardBackend' : 'generateRetentionBackend';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            height: 100vh; margin: 0; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
          }
          .card {
            background: white; padding: 30px; border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; width: 85%;
          }
          h2 { margin: 0 0 10px 0; font-size: 20px; color: #2c3e50; }
          .subtitle { font-size: 13px; color: #7f8c8d; margin-bottom: 25px; }
          
          .loader-circle {
            width: 50px; height: 50px; border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db; border-radius: 50%;
            animation: spin 1s linear infinite; margin: 0 auto 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          
          .progress-bar-container {
            background: #ecf0f1; border-radius: 10px; height: 12px; overflow: hidden; margin-bottom: 15px;
          }
          .progress-bar {
            height: 100%; width: 0%; background: linear-gradient(90deg, #3498db, #2ecc71);
            transition: width 0.5s ease;
          }
          
          .status-text { font-size: 14px; font-weight: 500; color: #34495e; margin-bottom: 5px; }
          .timer { font-size: 12px; color: #95a5a6; font-variant-numeric: tabular-nums; }
          
          .success-icon { display: none; font-size: 50px; margin-bottom: 10px; animation: pop 0.4s ease; }
          @keyframes pop { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }
          
          .stats { display: none; justify-content: center; gap: 20px; margin-top: 15px; }
          .stat-box { background: #f8f9fa; padding: 10px; border-radius: 8px; min-width: 80px; }
          .stat-val { font-size: 16px; font-weight: bold; color: #2ecc71; }
          .stat-lbl { font-size: 11px; color: #7f8c8d; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="loader-circle" id="spinner"></div>
          <div class="success-icon" id="successIcon">✅</div>
          
          <h2 id="mainTitle">Собираем данные...</h2>
          <div class="subtitle">Пожалуйста, не закрывайте это окно. Процесс может занять 1-3 минуты.</div>
          
          <div class="progress-bar-container" id="progressContainer">
            <div class="progress-bar" id="progressBar"></div>
          </div>
          
          <div class="status-text" id="statusText">Инициализация скрипта</div>
          <div class="timer" id="timer">Время: 0 сек</div>
          
          <div class="stats" id="statsPanel">
            <div class="stat-box"><div class="stat-val" id="statSize">-</div><div class="stat-lbl">Размер</div></div>
            <div class="stat-box"><div class="stat-val" id="statTime">-</div><div class="stat-lbl">Затрачено</div></div>
          </div>
        </div>

        <script>
          let seconds = 0;
          let progress = 0;
          
          // Таймер и фейковый прогресс (чтобы пользователю не было скучно)
          const timerInterval = setInterval(() => {
            seconds++;
            document.getElementById('timer').innerText = 'Время выполнения: ' + seconds + ' сек';
            
            // Прогресс плавно ползет до 90%, потом ждет ответа от сервера
            if (progress < 90) {
              progress += (90 - progress) * 0.05; // Замедляется ближе к концу
              document.getElementById('progressBar').style.width = progress + '%';
            }
            
            // Смена текста
            if (seconds === 5) document.getElementById('statusText').innerText = 'Чтение настроек...';
            if (seconds === 15) document.getElementById('statusText').innerText = 'Сбор финансовых данных...';
            if (seconds === 40) document.getElementById('statusText').innerText = 'Обработка каналов коммуникации...';
            if (seconds === 80) document.getElementById('statusText').innerText = 'Генерация графиков и HTML...';
            if (seconds === 120) document.getElementById('statusText').innerText = 'Завершение...';
          }, 1000);

          // ЗАПУСК БЕКЕНДА
          google.script.run
            .withSuccessHandler(onSuccess)
            .withFailureHandler(onError)
            .${functionToCall}(); // Вызывает нужную функцию на сервере

          function onSuccess(result) {
            clearInterval(timerInterval);
            
            // Заполняем прогресс до 100%
            document.getElementById('progressBar').style.width = '100%';
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('successIcon').style.display = 'block';
            
            document.getElementById('mainTitle').innerText = 'Отчет готов!';
            document.getElementById('statusText').innerText = 'Скачивание начнется автоматически...';
            document.getElementById('statusText').style.color = '#2ecc71';
            
            document.getElementById('statsPanel').style.display = 'flex';
            document.getElementById('statSize').innerText = result.fileSize;
            document.getElementById('statTime').innerText = result.totalTime + 's';
            
            // СКАЧИВАНИЕ (Декодируем Base64)
            try {
              const byteCharacters = atob(result.base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], {type: 'text/html'});
              const url = URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = result.fileName;
              document.body.appendChild(a);
              a.click();
              
              setTimeout(() => { google.script.host.close(); }, 3000);
            } catch (e) {
              onError({message: "Ошибка при скачивании файла: " + e.message});
            }
          }

          function onError(err) {
            clearInterval(timerInterval);
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('mainTitle').innerText = '❌ Ошибка';
            document.getElementById('mainTitle').style.color = '#e74c3c';
            document.getElementById('statusText').innerText = err.message;
            document.getElementById('statusText').style.color = '#e74c3c';
            document.getElementById('progressContainer').style.display = 'none';
          }
        </script>
      </body>
    </html>
  `;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        БЕКЕНД ФУНКЦИИ (ВЫПОЛНЯЮТ РАБОТУ)                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * СЕРВЕР: Генерация полного дашборда (вызывается из окна загрузки)
 */
function generateFullDashboardBackend() {
  const startTime = Date.now();
  
  logInfo('Начало генерации полного отчета (ASYNC)', 'Запуск', 'generateFullDashboardBackend');
  invalidateMetricsConfigCache();

  // Основная генерация
  const html = buildAppShell('retention');

  const dateStr = Utilities.formatDate(new Date(), 'Europe/Kiev', 'dd_MM_yyyy_HH_mm');
  const fileName = 'FullDashboard_' + dateStr + '.html';
  const fileSize = formatFileSize(html.length);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // Логируем успех
  const props = PropertiesService.getScriptProperties();
  props.setProperty('LAST_FULL_REPORT_FILENAME', fileName);
  props.setProperty('LAST_FULL_REPORT_SIZE', fileSize);
  props.setProperty('LAST_FULL_REPORT_TIME', Date.now().toString());

  logSuccess('Полный отчет готов', 'Размер: ' + fileSize, 'generateFullDashboardBackend');

  // Возвращаем данные в браузер (Кодируем в Base64 чтобы не сломать JSON при передаче)
  return {
    base64: Utilities.base64Encode(html, Utilities.Charset.UTF_8),
    fileName: fileName,
    fileSize: fileSize,
    totalTime: totalTime
  };
}

/**
 * СЕРВЕР: Генерация Retention дашборда (вызывается из окна загрузки)
 */
function generateRetentionBackend() {
  const startTime = Date.now();
  
  logInfo('Начало генерации retention отчета (ASYNC)', 'Запуск', 'generateRetentionBackend');
  invalidateMetricsConfigCache();

  const activeMonths = getActiveMonthsDetailed();
  if (!activeMonths || activeMonths.length === 0) {
    throw new Error('Нет активных месяцев. Включите их в настройках.');
  }

  clearAllReportData();

  // Сбор данных
  const retentionData = collectRetentionData();
  const reportJSON = createReportJSON(activeMonths, retentionData);

  if (!reportJSON.periods || reportJSON.periods.length === 0) {
    throw new Error('Не найдены данные для выбранных месяцев.');
  }

  // Генерация HTML
  const showAllTime = getShowAllTimePeriod();
  const html = buildRetentionHTML(reportJSON, showAllTime);
  
  const dateStr = Utilities.formatDate(new Date(), 'Europe/Kiev', 'dd_MM_yyyy_HH_mm');
  const fileName = `RetentionReport_${reportJSON.periods.length}months_${dateStr}.html`;
  const fileSize = formatFileSize(html.length);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  logSuccess('Retention HTML готов', 'Размер: ' + fileSize, 'generateRetentionBackend');

  const props = PropertiesService.getScriptProperties();
  props.setProperty('LAST_RETENTION_REPORT_TIME', Date.now().toString());
  if (props.getProperty('AUTO_CLEAR_LOGS') === 'true') {
    triggerAutoClear();
  }

  // Возвращаем данные
  return {
    base64: Utilities.base64Encode(html, Utilities.Charset.UTF_8),
    fileName: fileName,
    fileSize: fileSize,
    totalTime: totalTime
  };
}

// Вспомогательная функция для триггера (чтобы не дублировать код)
function triggerAutoClear() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'clearLogsAuto') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('clearLogsAuto')
    .timeBased()
    .after(30000)
    .create();
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        СБОР ДАННЫХ                                        ║
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


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ГЛАВНЫЙ ДАШБОРД (Единая точка входа)                   ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Показать главный дашборд с навигацией Support/Retention
 * Это ЕДИНАЯ точка входа для всех отчетов
 */
function showDashboardPreview() {
  const ui = SpreadsheetApp.getUi();

  try {
    logInfo('Запуск главного дашборда', 'showDashboardPreview');

    // Генерируем HTML оболочки с меню
    // По умолчанию активен Retention
    const html = buildAppShell('retention');

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1500)
      .setHeight(900)
      .setTitle('Dashboard System');

    ui.showModalDialog(htmlOutput, '📊 Dashboard — Retention & Support');

  } catch (error) {
    logError('Ошибка главного дашборда', error.message, 'showDashboardPreview');
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}



// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    DATA FETCHING                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Универсальная функция получения данных по источнику
 * @param {string} sourceKey - Ключ источника (retention, support, etc)
 * @returns {Object} JSON данные отчета
 */
function getReportData(sourceKey) {
  const sourceConfig = getSourceByKey(sourceKey);
  if (!sourceConfig) {
    // Если источник не найден, пробуем найти по имени (fallback)
    if (sourceKey === 'retention' || sourceKey === 'support') {
      // Если это дефолтные ключи, но их нет в конфиге (странно), создаем дефолт
      // Или просто кидаем ошибку
    }
    throw new Error('Source not found: ' + sourceKey);
  }

  const template = (sourceConfig.template || 'Retention').toLowerCase();

  if (template === 'retention') {
    return getRetentionReportJSON(sourceConfig);
  } else if (template === 'support') {
    return getSupportReportJSON(sourceConfig);
  }

  // Фолбэк для старых настроек или если template не задан
  if (sourceKey === 'retention') return getRetentionReportJSON(sourceConfig);
  if (sourceKey === 'support') return getSupportReportJSON(sourceConfig);

  throw new Error('Unknown template for source: ' + sourceKey);
}

/**
 * Получить JSON данные Support отчета
 */
function getSupportReportJSON(sourceConfig) {
  const activeMonths = getActiveMonthsDetailed();
  // Передаем sourceConfig
  const supportData = collectSupportData(sourceConfig);
  // Передаем только данные (createSupportReportJSON не зависит от конфига напрямую, только от данных)
  return createSupportReportJSON(supportData);
}

/**
 * Получить JSON данные для внешнего использования (Retention)
 */
function getRetentionReportJSON(sourceConfig) {
  // Гарантируем актуальный config ON/OFF для внешних вызовов (SPA/preview).
  invalidateMetricsConfigCache();

  // Ищем месяцы именно для того ключа, который указан в источнике
  const sourceKey = sourceConfig ? sourceConfig.key : 'retention';
  const activeMonths = getActiveMonthsForSource(sourceKey);

  const retentionData = collectRetentionData(sourceConfig);
  return createReportJSON(activeMonths, retentionData);
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ                                ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function getActiveSpreadsheetId() {
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}




function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Сохранить HTML в хранилище (с разбиением на чанки)
 * Используем UserProperties для изоляции сессий и предотвращения переполнения глобального хранилища
 */
function saveHTMLToStorage(html, key) {
  // Используем UserProperties для временных данных отчетов
  const userProps = PropertiesService.getUserProperties();
  const scriptProps = PropertiesService.getScriptProperties();

  // 1. Очищаем старые данные из ScriptProperties (миграция/очистка мусора)
  try {
    cleanupStorageV2(scriptProps, key);
  } catch (e) {
    console.warn('Warning cleaning script props: ' + e.message);
  }

  // 2. Очищаем старые данные из UserProperties
  cleanupStorageV2(userProps, key);

  // 3. Агрессивная очистка ВСЕХ чанков в UserProperties перед записью новых
  // Это гарантирует, что мы не упремся в лимит, если у пользователя были другие отчеты
  cleanupAllChunksInProps(userProps);

  const totalLength = html.length;
  const fileSizeStr = formatFileSize(totalLength);

  // ЛИМИТ PropertiesService: 512,000 байт на один Script или User.
  // Оставляем запас 60KB для других настроек.
  const MAX_PROPERTY_STORAGE = 450 * 1024;

  if (totalLength > MAX_PROPERTY_STORAGE) {
    const errorMsg = `ОТЧЕТ СЛИШКОМ БОЛЬШОЙ: ${fileSizeStr}. Лимит хранилища Google: 450 KB. \nПожалуйста, уменьшите количество выбранных месяцев или источников.`;
    logError('Переполнение хранилища', errorMsg, 'saveHTMLToStorage');
    throw new Error(errorMsg);
  }

  const chunkSize = 8000; // Безопасный размер
  const chunksCount = Math.ceil(totalLength / chunkSize);

  userProps.setProperty(key + '_CHUNKS_COUNT', String(chunksCount));
  userProps.setProperty(key + '_TOTAL_SIZE', String(totalLength));

  for (let i = 0; i < chunksCount; i++) {
    const chunk = html.substr(i * chunkSize, chunkSize);
    userProps.setProperty(key + '_CHUNK_' + i, chunk);
  }
}

/**
 * Загрузить HTML из хранилища
 */
function loadHTMLFromStorage(key, useCache = true) {
  // Пробуем сначала UserProperties (новая логика)
  const userProps = PropertiesService.getUserProperties();
  let chunksCountStr = userProps.getProperty(key + '_CHUNKS_COUNT');
  let props = userProps;

  // Если нет в UserProperties, пробуем ScriptProperties (старая логика)
  if (!chunksCountStr) {
    const scriptProps = PropertiesService.getScriptProperties();
    chunksCountStr = scriptProps.getProperty(key + '_CHUNKS_COUNT');
    props = scriptProps;
  }

  if (!chunksCountStr) return null;

  const chunksCount = parseInt(chunksCountStr, 10);
  let html = '';

  for (let i = 0; i < chunksCount; i++) {
    const chunk = props.getProperty(key + '_CHUNK_' + i);
    if (chunk) html += chunk;
  }

  return html;
}

/**
 * Универсальная очистка чанков в переданном хранилище
 */
function cleanupStorageV2(props, key) {
  const oldChunksCount = parseInt(props.getProperty(key + '_CHUNKS_COUNT') || '0', 10);

  if (oldChunksCount > 0) {
    const keysToDelete = [];
    for (let i = 0; i < oldChunksCount; i++) {
      keysToDelete.push(key + '_CHUNK_' + i);
    }
    keysToDelete.push(key + '_CHUNKS_COUNT');
    keysToDelete.push(key + '_TOTAL_SIZE');

    // В Google Apps Script нет метода deleteProperties(array).
    // Нужно удалять по одному.
    if (keysToDelete.length > 0) {
      keysToDelete.forEach(k => props.deleteProperty(k));
    }
  }
}

/**
 * Очистить ВСЕ чанки в хранилище (агрессивная очистка)
 */
function cleanupAllChunksInProps(props) {
  try {
    const data = props.getProperties();
    const keysToDelete = [];

    for (const key in data) {
      if (key.includes('_CHUNK_') ||
        key.includes('_CHUNKS_COUNT') ||
        key.includes('_TOTAL_SIZE')) {
        keysToDelete.push(key);
      }
    }

    // В Google Apps Script нет метода deleteProperties(array).
    // Нужно удалять по одному.
    if (keysToDelete.length > 0) {
      keysToDelete.forEach(k => props.deleteProperty(k));
    }
  } catch (e) {
    console.error('Error in cleanupAllChunksInProps: ' + e.message);
  }
}

/**
 * Очистить старые чанки (deprecated wrapper)
 */
function cleanupStorage(key) {
  cleanupStorageV2(PropertiesService.getScriptProperties(), key);
}

/**
 * Получить интерфейс скачивания
 */
function getDownloadInterface(storageKey, fileName, fileSize) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
          .icon { font-size: 48px; margin-bottom: 20px; }
          h2 { margin: 0 0 10px 0; color: #333; }
          p { color: #666; margin: 0 0 25px 0; }
          .btn { background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
          .btn:hover { background: #3367d6; }
          .meta { font-size: 12px; color: #999; margin-top: 20px; }
          .loader { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: none; margin: 10px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">📄</div>
          <h2>Отчет готов!</h2>
          <p>Файл: <b>${fileName}</b><br>Размер: ${fileSize}</p>
          
          <div id="status">Подготовка ссылки...</div>
          <div class="loader" id="loader" style="display:block"></div>
          
          <a id="downloadBtn" class="btn" style="display:none" download="${fileName}" href="#">Скачать отчет</a>
          
          <div class="meta">Ссылка действительна пока открыто это окно</div>
        </div>

        <script>
          // Загружаем контент из хранилища частями
          google.script.run
            .withSuccessHandler(function(html) {
              const blob = new Blob([html], {type: 'text/html'});
              const url = URL.createObjectURL(blob);
              
              const btn = document.getElementById('downloadBtn');
              btn.href = url;
              btn.style.display = 'inline-block';
              
              document.getElementById('loader').style.display = 'none';
              document.getElementById('status').style.display = 'none';
              
              // Автоклик (опционально)
              // btn.click();
            })
            .withFailureHandler(function(err) {
              document.getElementById('status').innerText = 'Ошибка: ' + err.message;
              document.getElementById('status').style.color = 'red';
              document.getElementById('loader').style.display = 'none';
            })
            .getStoredHTML('${storageKey}');
        </script>
      </body>
    </html>
  `;
}

/**
 * Получить сохраненный HTML по ключу (для UI)
 */
function getStoredHTML(storageKey) {
  return loadHTMLFromStorage(storageKey, true) || '';
}

/**
 * Генерация имени файла retention отчета
 */
function generateRetentionFileName(reportData) {
  const periodsCount = reportData.periodsCount || reportData.periods?.length || 0;
  const dateStr = Utilities.formatDate(new Date(), 'Europe/Kiev', 'dd_MM_yyyy_HH_mm');
  return `RetentionReport_${periodsCount}months_${dateStr}.html`;
}

/**
 * Очистить логи (триггер)
 */
function clearLogsAuto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.LOGS);
  if (sheet) {
    if (sheet.getLastRow() > 1000) {
      sheet.deleteRows(2, sheet.getLastRow() - 100);
    }
  }
}

/**
 * Очистить хранилище приложения
 */
function cleanupAppStorage() {
  const ui = SpreadsheetApp.getUi();
  let count = 0;

  try {
    // 1. Clean Script Properties
    const scriptProps = PropertiesService.getScriptProperties();
    const scriptData = scriptProps.getProperties();
    const scriptKeysToDelete = [];

    for (const key in scriptData) {
      if (key.includes('_CHUNK_') ||
        key.includes('_CHUNKS_COUNT') ||
        key.includes('_TOTAL_SIZE') ||
        key.includes('LAST_REPORT') || // Catch-all for old report keys
        key.includes('html_')) {
        scriptKeysToDelete.push(key);
      }
    }

    if (scriptKeysToDelete.length > 0) {
      // scriptProps.deleteProperties(scriptKeysToDelete); // Ошибка: нет такого метода
      scriptKeysToDelete.forEach(k => scriptProps.deleteProperty(k));
      count += scriptKeysToDelete.length;
    }

    // 2. Clean User Properties
    const userProps = PropertiesService.getUserProperties();
    const userData = userProps.getProperties();
    const userKeysToDelete = [];

    for (const key in userData) {
      if (key.includes('_CHUNK_') ||
        key.includes('_CHUNKS_COUNT') ||
        key.includes('_TOTAL_SIZE') ||
        key.includes('LAST_REPORT')) {
        userKeysToDelete.push(key);
      }
    }

    if (userKeysToDelete.length > 0) {
      userKeysToDelete.forEach(k => userProps.deleteProperty(k));
      count += userKeysToDelete.length;
    }

    // 3. FORCE DELETE ALL - Emergency option if still failing
    // userProps.deleteAllProperties(); 

    ui.alert('✅ Очистка завершена', `Удалено ${count} записей из хранилища (Script + User).`, ui.ButtonSet.OK);
    logSuccess('Хранилище очищено', `Очищено ${count} свойств`, 'cleanupAppStorage');

  } catch (e) {
    ui.alert('❌ Ошибка', 'Не удалось очистить хранилище: ' + e.message, ui.ButtonSet.OK);
    logError('Ошибка очистки хранилища', e.message, 'cleanupAppStorage');
  }
}

/**
 * ПОЛНЫЙ СБРОС ХРАНИЛИЩА (Emergency)
 */
function forceResetAppStorage() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert('⚠️ ПРЕДУПРЕЖДЕНИЕ',
    'Это полностью удалит ВСЕ настройки и сохраненные отчеты в хранилище приложения.\n' +
    'Используйте это только если приложение не работает из-за ошибок памяти.\n\nПродолжить?',
    ui.ButtonSet.YES_NO);

  if (res === ui.Button.YES) {
    PropertiesService.getUserProperties().deleteAllProperties();
    PropertiesService.getScriptProperties().deleteAllProperties();
    ui.alert('✅ Хранилище полностью очищено.');
    logWarning('FORCE RESET', 'Пользователь выполнил полную очистку хранилища', 'forceResetAppStorage');
  }
}

/**
 * Экранировать HTML для безопасного отображения
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

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        SUPPORT ОТЧЕТЫ                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Сгенерировать Support отчет
 */
function generateSupportReport() {
  const ui = SpreadsheetApp.getUi();

  try {
    logInfo('Начало генерации support отчета', 'Запуск', 'generateSupportReport');

    // Получаем дефолтный Support источник или ищем по ключу 'support'
    const sourceConfig = getSourceByKey('support');

    // Используем getSupportReportJSON который теперь принимает sourceConfig
    // Если sourceConfig null, функции внутри должны иметь fallback (мы добавили fallback в DataReaderSupport)
    // Но лучше передать null явно если не найдено

    const reportJSON = getSupportReportJSON(sourceConfig);

    const html = buildSupportPreviewHTML(reportJSON);

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1400)
      .setHeight(900)
      .setTitle('Support Dashboard');

    ui.showModalDialog(htmlOutput, '📊 Support Dashboard');

  } catch (error) {
    logError('Ошибка генерации support', error.message, 'generateSupportReport');
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Показать предпросмотр Support
 */
function showSupportPreview() {
  generateSupportReport();
}
/**
 * Показывает окно, которое автоматически начинает скачивание и закрывается.
 * Это позволяет обойти лимиты хранилища PropertiesService.
 */
function showAutoDownloadDialog(htmlContent, fileName) {
  // 1. Кодируем в Base64 для безопасной передачи больших данных
  // Это предотвращает ошибки синтаксиса и проблемы с </script>
  const base64Content = Utilities.base64Encode(htmlContent, Utilities.Charset.UTF_8);

  const htmlOutput = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background: #fdfdfd; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #F5B800; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .msg { color: #333; font-weight: 500; font-size: 16px; line-height: 1.5; }
          .sub { color: #888; font-size: 13px; margin-top: 10px; }
          button { margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #eee; border: 1px solid #ccc; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <div class="msg" id="status">Генерируем файл...<br>Скачивание начнется через мгновение.</div>
        <div class="sub">Окно закроется автоматически.</div>
        
        <script>
          // Встраиваем Base64 прямо в скрипт
          var b64 = "${base64Content}";
          var fileName = "${fileName}";

          function startDownload() {
            try {
              // Декодируем Base64 обратно в строку (используем атлас UTF-8 через Blob)
              // В браузере b64 -> arrayBuffer -> blob
              var byteCharacters = atob(b64);
              var byteNumbers = new Array(byteCharacters.length);
              for (var i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              var byteArray = new Uint8Array(byteNumbers);
              var blob = new Blob([byteArray], {type: 'text/html'});
              
              var url = URL.createObjectURL(blob);
              
              var a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              
              document.getElementById('status').innerHTML = '✅ Файл подготовлен!<br>Проверьте папку загрузок.';
              
              setTimeout(function() {
                google.script.host.close();
              }, 2500);
              
            } catch (e) {
              console.error(e);
              document.getElementById('status').innerText = 'Ошибка: ' + e.message;
            }
          }

          window.onload = startDownload;
        </script>
      </body>
    </html>
  `)
    .setWidth(400)
    .setHeight(250);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📥 Скачивание...');
}

/**
 * Показать React Dashboard в диалоге
 */
function showReactDashboard() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var htmlContent = getReactAppHTML();
    
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(1600)
      .setHeight(900)
      .setTitle('Retention Dashboard v2.0');

    ui.showModalDialog(htmlOutput, '📊 Retention Dashboard v2.0');
    
  } catch (error) {
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Получить HTML React приложения
 */
function getReactAppHTML() {
  // CONFIG.DEBUG должен быть false при деплое!
  if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
    return '<!DOCTYPE html><html><head><title>Redirect</title></head><body style="margin:0;padding:0;overflow:hidden;">' +
           '<iframe src="http://localhost:5173" style="width:100vw;height:100vh;border:none;"></iframe>' +
           '</body></html>';
  }
  
  // Читаем собранный Vite файл. Важно: при сборке он должен попасть в apps-script/src/dist/index.html
  return HtmlService.createHtmlOutputFromFile('dist/index').getContent();
}
