/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Menu.js - Меню приложения v2.0 (React + Supabase Edition)
 *  Путь: apps-script/src/Menu.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🚀 SaaS Dashboard v2.0')
    // 1. Главные функции
    .addItem('💻 Открыть React Dashboard', 'showReactDashboard')
    .addSeparator()
    
    // 2. Экспорт в БД (Supabase)
    .addSubMenu(ui.createMenu('☁️ Отправить данные в БД')
      .addItem('📤 Отправить ВСЁ', 'exportAllToSupabaseUI')
      .addItem('💰 Только Retention', 'exportRetentionToSupabaseUI')
      .addItem('🎧 Только Support', 'exportSupportToSupabaseUI')
      .addItem('📤 Отправить Переводы', 'uploadTranslationsToDB')
    )
    .addSeparator()

    // 3. Настройки источников
    .addSubMenu(ui.createMenu('⚙️ Настройки источников')
      .addItem('➕ Добавить источник', 'showAddSourceDialog')
      .addItem('🔧 Создать/Обновить Settings', 'createSettingsSheetMenu')
      .addSeparator()
      .addItem('🔄 Синхронизировать метрики', 'syncMetricsConfig')
      .addSeparator()
      .addItem('📝 Автоформатирование: Вкл/Выкл', 'toggleAutoFormat')
      .addItem('ℹ️ Статус автоформатирования', 'showAutoFormatStatus')
      .addItem('📝 Настроить автоформатирование...', 'showAutoFormatDialog')
    )
    
    // 4. Мастер-таблица Settings
    .addSubMenu(ui.createMenu('🗂️ Мастер Settings')
      .addItem('ℹ️ Показать текущие настройки', 'showCurrentSettingsInfo')
      .addItem('🔗 Подключить другую таблицу', 'configureMasterSettings')
      .addItem('📋 Создать новую мастер-таблицу', 'createNewMasterSettingsSpreadsheet')
      .addItem('🔄 Сбросить к дефолтной', 'resetToDefaultMasterSettings')
    )
    
    // 5. Обслуживание и Тесты
    .addSubMenu(ui.createMenu('🛠️ Обслуживание и Тесты')
      .addItem('🔍 Универсальный Анализатор v2', 'showUniversalAnalyzerDialogV2')
      .addItem('🧹 Очистить хранилище', 'cleanupAppStorage')
      .addItem('🐞 DEBUG: LiveChat Data', 'debugLiveChatData')
      .addItem('🧪 Тест всех источников', 'testBothSources')
      .addItem('🧨 Полный сброс (Hard Reset)', 'forceResetAppStorage')
    )
    .addSeparator()
    
    // 6. Переводы
    .addItem('🌐 Отформатировать лист переводов', 'formatTranslationsSheet')
    .addSeparator()
    
    // 7. Внешний сайт
    .addItem('🌍 Открыть готовый сайт (Vercel)', 'openVercelSite')
    .addSeparator()
    
    // 8. Экспорт HTML
    .addItem('📦 Скачать Dashboard (HTML)', 'downloadReactDashboard')

    .addToUi();
}

/**
 * Открыть готовый сайт (динамическая ссылка из настроек)
 */
function openVercelSite() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const ss = getSettingsSpreadsheet();
    let sheet = ss.getSheetByName('⚙️ APP_SETTINGS');
    if (!sheet) sheet = ss.getSheetByName('APP_SETTINGS');
    
    if (!sheet) {
      ui.alert('❌ Ошибка', 'Лист APP_SETTINGS не найден.', ui.ButtonSet.OK);
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    let siteUrl = '';
    
    // Ищем ключ 'site_url' или 'vercel_url'
    for (let i = 0; i < data.length; i++) {
      const key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'site_url' || key === 'vercel_url' || key === 'url дашборда') {
        siteUrl = String(data[i][1] || '').trim();
        break;
      }
    }
    
    if (!siteUrl) {
      ui.alert(
        '⚠️ Ссылка не найдена', 
        'Чтобы эта кнопка работала, добавьте в лист "⚙️ APP_SETTINGS" строку:\n\n' +
        'Колонка A: site_url\n' +
        'Колонка B: https://ваш-сайт.vercel.app', 
        ui.ButtonSet.OK
      );
      return;
    }
    
    // Добавляем https:// если пользователь забыл
    if (!siteUrl.startsWith('http')) {
      siteUrl = 'https://' + siteUrl;
    }
    
    const htmlOutput = HtmlService.createHtmlOutput(
      `<script>window.open("${siteUrl}", "_blank"); google.script.host.close();</script>`
    ).setWidth(10).setHeight(10);
    
    ui.showModalDialog(htmlOutput, 'Открываем дашборд...');
    
  } catch (error) {
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}