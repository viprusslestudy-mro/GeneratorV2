/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ExportDashboard.js - Экспорт React Dashboard как автономный HTML файл
 *  Путь: apps-script/src/ExportDashboard.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Вызывается из меню: 📦 Скачать Dashboard (HTML)
 * Показывает окно загрузки, которое само запускает генерацию
 */
function downloadReactDashboard() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const htmlOutput = HtmlService.createHtmlOutput(`
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
              max-width: 400px;
            }
            h2 { margin: 0 0 10px 0; font-size: 20px; color: #2c3e50; }
            .subtitle { font-size: 13px; color: #7f8c8d; margin-bottom: 25px; }
            
            /* Спиннер */
            .loader-circle {
              width: 50px; height: 50px; border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db; border-radius: 50%;
              animation: spin 1s linear infinite; margin: 0 auto 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            
            /* Прогресс-бар */
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
            
            /* Кнопка скачивания */
            .download-btn {
              display: none;
              margin-top: 20px;
              padding: 12px 24px;
              background: linear-gradient(135deg, #FFB300 0%, #FFC107 100%);
              color: #000;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 700;
              font-size: 14px;
              box-shadow: 0 4px 12px rgba(255, 179, 0, 0.4);
              transition: all 0.3s ease;
              cursor: pointer;
              border: none;
              width: 100%;
            }
            .download-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(255, 179, 0, 0.6);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="loader-circle" id="spinner"></div>
            <div class="success-icon" id="successIcon">✅</div>
            
            <h2 id="mainTitle">Сборка автономного Dashboard...</h2>
            <div class="subtitle" id="subtitle">Пожалуйста, не закрывайте это окно. Процесс может занять 10-30 секунд.</div>
            
            <div class="progress-bar-container" id="progressContainer">
              <div class="progress-bar" id="progressBar"></div>
            </div>
            
            <div class="status-text" id="statusText">Инициализация...</div>
            <div class="timer" id="timer">Время: 0 сек</div>
            
            <button id="downloadBtn" class="download-btn">⬇️ Скачать файл</button>
          </div>

          <script>
            let seconds = 0;
            let progress = 0;
            let downloadData = null;
            
            // Таймер и фейковый прогресс
            const timerInterval = setInterval(() => {
              seconds++;
              document.getElementById('timer').innerText = 'Время выполнения: ' + seconds + ' сек';
              
              if (progress < 95) {
                progress += (95 - progress) * 0.05; // Асимптотически приближается к 95%
                document.getElementById('progressBar').style.width = progress + '%';
              }
              
              if (seconds === 3) document.getElementById('statusText').innerText = 'Сбор данных Retention...';
              if (seconds === 10) document.getElementById('statusText').innerText = 'Сбор данных Support...';
              if (seconds === 18) document.getElementById('statusText').innerText = 'Загрузка переводов...';
              if (seconds === 22) document.getElementById('statusText').innerText = 'Генерация HTML файла...';
            }, 1000);

            // ЗАПУСК БЭКЕНДА
            google.script.run
              .withSuccessHandler(onSuccess)
              .withFailureHandler(onError)
              .generateEmbeddedDashboardBackend(); // Вызов функции сборки

            function onSuccess(result) {
              clearInterval(timerInterval);
              
              document.getElementById('progressBar').style.width = '100%';
              document.getElementById('spinner').style.display = 'none';
              document.getElementById('successIcon').style.display = 'block';
              
              document.getElementById('mainTitle').innerText = 'Dashboard готов!';
              document.getElementById('subtitle').innerText = 'Файл успешно сохранен на Google Drive.';
              
              document.getElementById('statusText').innerText = 'Нажмите кнопку для скачивания';
              document.getElementById('statusText').style.color = '#2ecc71';
              document.getElementById('progressContainer').style.display = 'none';
              
              const btn = document.getElementById('downloadBtn');
              btn.style.display = 'block';
              
              downloadData = result;
              
              // Авто-клик через 1 секунду
              setTimeout(() => btn.click(), 1000);
              
              // Нажатие кнопки скачивания
              btn.onclick = function() {
                window.open(downloadData.downloadUrl, "_blank");
                setTimeout(() => google.script.host.close(), 1500); // Закрываем окно после скачивания
              };
            }

            function onError(err) {
              clearInterval(timerInterval);
              document.getElementById('spinner').style.display = 'none';
              document.getElementById('successIcon').innerText = '❌';
              document.getElementById('successIcon').style.display = 'block';
              
              document.getElementById('mainTitle').innerText = 'Ошибка генерации';
              document.getElementById('mainTitle').style.color = '#e74c3c';
              
              document.getElementById('statusText').innerText = err.message;
              document.getElementById('statusText').style.color = '#e74c3c';
              document.getElementById('progressContainer').style.display = 'none';
              document.getElementById('subtitle').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `).setWidth(450).setHeight(360);
    
    ui.showModalDialog(htmlOutput, '📦 Экспорт Dashboard');
    
  } catch (error) {
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Парсинг данных из строки JSON (если нужно)
 */
function parseIfString_(data) {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch (e) { return null; }
  }
  return data;
}

/**
 * СЕРВЕРНАЯ ФУНКЦИЯ: Собирает данные и создает файл (вызывается асинхронно из JS)
 * @returns {Object} Объект с URL для скачивания
 */
function generateEmbeddedDashboardBackend() {
  Logger.log('[Export] Начинаем асинхронный сбор данных...');
  
  // 1. Собираем данные
  const retentionData = api_getRetentionReport();
  const supportData = api_getSupportReport();
  const uiSettings = api_getUISettings();
  const translations = api_getTranslations();
  const sources = api_getSources();
  
  // 2. Получаем HTML
  let htmlContent = getReactDashboardHTML();
  if (!htmlContent) throw new Error('Не удалось получить HTML шаблон (сделайте clasp push)');
  
  // 3. Парсим данные
  const parsedRetention = parseIfString_(retentionData);
  const parsedSupport = parseIfString_(supportData);
  const parsedUI = parseIfString_(uiSettings);
  const parsedTranslations = parseIfString_(translations);
  const parsedSources = parseIfString_(sources);
  
  // 4. Встраиваем данные
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
</script>
  `;
  
  htmlContent = htmlContent.replace('</head>', embeddedDataScript + '\n</head>');
  
  // 5. Создаем файл
  const timestamp = Utilities.formatDate(new Date(), 'GMT+3', 'yyyy-MM-dd_HH-mm');
  const fileName = 'retention-dashboard_' + timestamp + '.html';
  const blob = Utilities.newBlob(htmlContent, 'text/html', fileName);
  
  const folder = DriveApp.getRootFolder();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  Logger.log('[Export] Файл успешно создан: ' + fileName);
  
  // Возвращаем данные обратно в UI окно (скачивание начнется само)
  return {
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
    viewUrl: file.getUrl(),
    fileName: fileName
  };
}

/**
 * Получить HTML содержимое React Dashboard
 */
function getReactDashboardHTML() {
  try {
    return HtmlService.createHtmlOutputFromFile('dist/index').getContent();
  } catch (error) {
    Logger.log('[getReactDashboardHTML] ERROR: ' + error.message);
    return null;
  }
}