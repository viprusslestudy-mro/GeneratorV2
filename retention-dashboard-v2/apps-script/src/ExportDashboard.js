/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ExportDashboard.js - Экспорт React Dashboard как автономный HTML файл
 *  Путь: apps-script/src/ExportDashboard.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Парсинг данных из строки JSON (если нужно)
 * @param {string|Object} data - Данные
 * @returns {Object} Распарсенные данные
 */
function parseIfString_(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      Logger.log('[Export] Parse error: ' + e.message);
      return null;
    }
  }
  return data;
}

/**
 * Скачать React Dashboard как единый HTML файл с встроенными данными
 * Вызывается из меню: 📦 Скачать Dashboard (HTML)
 */
function downloadReactDashboard() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    ui.alert('⏳ Генерация', 'Подождите, идёт сборка Dashboard с данными...\n\nЭто может занять 10-30 секунд.', ui.ButtonSet.OK);
    
    // 1. Собираем ВСЕ данные
    Logger.log('[Export] Начинаем сбор данных...');
    
    const retentionData = api_getRetentionReport();
    const supportData = api_getSupportReport();
    const uiSettings = api_getUISettings();
    const translations = api_getTranslations();
    const sources = api_getSources();
    
    Logger.log('[Export] Данные собраны, генерируем HTML...');
    
    // 2. Получаем базовый HTML
    let htmlContent = getReactDashboardHTML();
    
    if (!htmlContent) {
      ui.alert('❌ Ошибка', 'Не удалось получить HTML шаблон.', ui.ButtonSet.OK);
      return;
    }
    
    // 3. Парсим данные (API возвращает строки JSON)
    const parsedRetention = parseIfString_(retentionData);
    const parsedSupport = parseIfString_(supportData);
    const parsedUI = parseIfString_(uiSettings);
    const parsedTranslations = parseIfString_(translations);
    const parsedSources = parseIfString_(sources);
    
    // 4. Создаём скрипт с встроенными данными
    const embeddedDataScript = `
<script>
// ═══════════════════════════════════════════════════════════════════════════
// EMBEDDED DATA - Данные встроены при экспорте ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════════════════════════
window.__EMBEDDED_MODE__ = true;
window.__EMBEDDED_DATA__ = {
  retentionReport: ${JSON.stringify(parsedRetention)},
  supportReport: ${JSON.stringify(parsedSupport)},
  uiSettings: ${JSON.stringify(parsedUI)},
  translations: ${JSON.stringify(parsedTranslations)},
  sources: ${JSON.stringify(parsedSources)}
};
console.log('[Embedded] Dashboard загружен в автономном режиме');
console.log('[Embedded] Данные:', Object.keys(window.__EMBEDDED_DATA__));
</script>
`;
    
    // 5. Вставляем данные перед </head>
    htmlContent = htmlContent.replace('</head>', embeddedDataScript + '\n</head>');
    
    // 6. Создаём файл
    const timestamp = Utilities.formatDate(new Date(), 'GMT+3', 'yyyy-MM-dd_HH-mm');
    const fileName = 'retention-dashboard_' + timestamp + '.html';
    const blob = Utilities.newBlob(htmlContent, 'text/html', fileName);
    
    // 7. Сохраняем на Google Drive
    const folder = DriveApp.getRootFolder();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // 8. Получаем ссылки
    const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + file.getId();
    const viewUrl = file.getUrl();
    
    Logger.log('[Export] Файл создан: ' + fileName);
    
    // 9. Показываем окно со ссылкой
    const htmlOutput = HtmlService.createHtmlOutput(`
      <style>
        body {
          font-family: 'Google Sans', Arial, sans-serif;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          min-height: 100vh;
          margin: 0;
          box-sizing: border-box;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 520px;
          margin: 0 auto;
        }
        h2 { margin: 0 0 15px 0; font-size: 24px; font-weight: 700; }
        p { font-size: 15px; line-height: 1.6; margin-bottom: 15px; }
        .filename {
          background: #f5f5f5;
          padding: 12px 15px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 13px;
          margin-bottom: 20px;
          word-break: break-all;
        }
        .info {
          background: #e3f2fd;
          color: #1565c0;
          padding: 12px 15px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: left;
        }
        .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        a {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #FFB300 0%, #FFC107 100%);
          color: #000;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 16px rgba(255, 179, 0, 0.4);
          transition: all 0.3s ease;
        }
        a:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255, 179, 0, 0.6); }
        a.secondary { background: #f0f0f0; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        a.secondary:hover { background: #e0e0e0; }
        .icon { font-size: 48px; margin-bottom: 15px; }
        .success { color: #4caf50; font-weight: 600; }
      </style>
      <div class="container">
        <div class="icon">✅</div>
        <h2>Dashboard готов!</h2>
        <p class="success">Файл с данными создан на Google Drive</p>
        <div class="filename">📄 ${fileName}</div>
        <div class="info">
          💡 <strong>Автономный режим:</strong> Файл содержит все данные (Retention + Support) и работает без интернета!
        </div>
        <div class="buttons">
          <a href="${downloadUrl}" target="_blank">⬇️ Скачать</a>
          <a href="${viewUrl}" target="_blank" class="secondary">📂 Google Drive</a>
        </div>
      </div>
      <script>
        setTimeout(function() { window.open("${downloadUrl}", "_blank"); }, 1500);
      </script>
    `).setWidth(620).setHeight(500);
    
    ui.showModalDialog(htmlOutput, '✅ Dashboard экспортирован');
    
  } catch (error) {
    Logger.log('[downloadReactDashboard] ERROR: ' + error.message + '\n' + error.stack);
    ui.alert('❌ Ошибка', 'Не удалось создать файл:\n\n' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Получить HTML содержимое React Dashboard
 * @returns {string|null} HTML строка или null при ошибке
 */
function getReactDashboardHTML() {
  try {
    const template = HtmlService.createTemplateFromFile('dist/index');
    const htmlOutput = template.evaluate();
    return htmlOutput.getContent();
  } catch (error) {
    Logger.log('[getReactDashboardHTML] ERROR: ' + error.message);
    return null;
  }
}