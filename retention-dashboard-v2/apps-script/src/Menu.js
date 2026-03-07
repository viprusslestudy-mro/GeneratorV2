/**
 * MENU.gs - Application menu v1.0
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('📊 Генератор Отчетов v2.0')
    .addItem('🏠 Открыть Dashboard', 'showDashboardPreview')
    .addItem('💾 Сгенерировать весь Сайт', 'generateFullDashboardReport')
    .addSeparator()
    .addItem('📊 Retention v2.0', 'showReactDashboard')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ Настройки')
      .addItem('➕ Добавить источник', 'showAddSourceDialog')
      .addItem('🔧 Создать/Обновить Settings', 'createSettingsSheetMenu')
      .addSeparator()
      .addItem('🔄 Синхронизировать метрики', 'syncMetricsConfig')
      .addSeparator()
      .addItem('📝 Автоформатирование: Вкл/Выкл', 'toggleAutoFormat')
      .addItem('ℹ️ Статус автоформатирования', 'showAutoFormatStatus')
      .addItem('📝 Автоформатирование...', 'showAutoFormatDialog')
    )
    .addSubMenu(ui.createMenu('🗂️ Мастер Settings')
      .addItem('ℹ️ Показать текущие настройки', 'showCurrentSettingsInfo')
      .addItem('🔗 Подключить другую таблицу', 'configureMasterSettings')
      .addItem('📋 Создать новую мастер-таблицу', 'createNewMasterSettingsSpreadsheet')
      .addItem('🔄 Сбросить к дефолтной', 'resetToDefaultMasterSettings')
    )
    .addSeparator()
    .addSubMenu(ui.createMenu('🧹 Обслуживание')
      .addItem('🔍 Универсальный Анализатор', 'showUniversalAnalyzerDialogV2')
      .addItem('📊 Универсальный Анализатор v2', 'showUniversalAnalyzerDialog')
      .addItem('🧹 Очистить старые отчеты', 'cleanupAppStorage')
      .addItem('🐞 DEBUG: LiveChat Data', 'debugLiveChatData')
      .addItem('🧨 Полный сброс (Hard Reset)', 'forceResetAppStorage')
    )
    .addSubMenu(ui.createMenu('🧪 Тестирование')
      .addItem('🔍 Тест всех источников', 'testBothSources')
      .addItem('🎧 Тест Support', 'testSupportQuick')
      .addItem('📊 Тест Retention', 'testRetentionQuick')
    )
    .addToUi();
}

/**
 * Показать диалог добавления источника
 */
function showAddSourceDialog() {
  const html = HtmlService.createHtmlOutput(getAddSourceDialogHTML())
    .setWidth(500)
    .setHeight(450)
    .setTitle('➕ Добавить источник данных');

  SpreadsheetApp.getUi().showModalDialog(html, '➕ Добавить источник данных');
}

function getAddSourceDialogHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; font-weight: 600; margin-bottom: 5px; }
    input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    .btn { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%; }
    .btn:hover { background: #5a6fd6; }
    .hint { font-size: 12px; color: #666; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="form-group">
    <label>Название источника:</label>
    <input type="text" id="name" placeholder="Например: Marketing">
  </div>

  <div class="form-group">
    <label>Тип шаблона:</label>
    <select id="template">
      <option value="Retention">Retention (Финансы, Продукт)</option>
      <option value="Support">Support (KPI, Теги, Чаты)</option>
    </select>
    <div class="hint">Определяет структуру отчета и фильтры</div>
  </div>
  
  <div class="form-group">
    <label>ID или URL таблицы:</label>
    <input type="text" id="spreadsheetId" placeholder="Вставьте ID или ссылку">
    <div class="hint">Можно вставить полную ссылку, ID будет извлечен автоматически</div>
  </div>
  
  <div class="form-group">
    <label>Листы (через запятую):</label>
    <input type="text" id="sheets" placeholder="Sheet1, Sheet2">
    <div class="hint">Оставьте пустым для автоопределения</div>
  </div>
  
  <div class="form-group">
    <label>Иконка (эмодзи):</label>
    <input type="text" id="icon" value="📊" maxlength="2">
  </div>
  
  <div class="form-group">
    <label>Цвет:</label>
    <input type="color" id="color" value="#607d8b">
  </div>
  
  <button class="btn" onclick="addSource()">➕ Добавить</button>
  
  <script>
    function extractId(input) {
      const match = input.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : input.trim();
    }
    
    function addSource() {
      const name = document.getElementById('name').value.trim();
      const template = document.getElementById('template').value;
      const spreadsheetId = extractId(document.getElementById('spreadsheetId').value);
      const sheets = document.getElementById('sheets').value.split(',').map(s => s.trim()).filter(s => s);
      const icon = document.getElementById('icon').value || '📊';
      const color = document.getElementById('color').value;
      
      if (!name || !spreadsheetId) {
        alert('Заполните название и ID таблицы');
        return;
      }
      
      google.script.run
        .withSuccessHandler(function(result) {
          alert('✅ Источник "' + name + '" добавлен!');
          google.script.host.close();
        })
        .withFailureHandler(function(error) {
          alert('❌ Ошибка: ' + error.message);
        })
        .addNewDataSource(name, spreadsheetId, sheets, icon, color, template);
    }
  </script>
</body>
</html>
  `;
}
