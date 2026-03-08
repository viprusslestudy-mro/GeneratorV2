/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MENU.gs - Application menu v2.0 (React + Supabase Edition)
 * ═══════════════════════════════════════════════════════════════════════════
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🚀 SaaS Dashboard v2.0')
    // 1. Главные функции (Современная архитектура)
    .addItem('💻 Открыть React Dashboard', 'showReactDashboard')
    .addSeparator()
    
    // 2. Экспорт в Базу Данных (Supabase)
    .addSubMenu(ui.createMenu('☁️ Отправить данные в БД')
      .addItem('📤 Отправить ВСЁ', 'exportAllToSupabaseUI')
      .addItem('💰 Только Retention', 'exportRetentionToSupabaseUI')
      .addItem('🎧 Только Support', 'exportSupportToSupabaseUI')
    )
    .addSeparator()

    // 3. Настройки
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
    
    // 4. Мастер-таблица
    .addSubMenu(ui.createMenu('🗂️ Мастер Settings')
      .addItem('ℹ️ Показать текущие настройки', 'showCurrentSettingsInfo')
      .addItem('🔗 Подключить другую таблицу', 'configureMasterSettings')
      .addItem('📋 Создать новую мастер-таблицу', 'createNewMasterSettingsSpreadsheet')
      .addItem('🔄 Сбросить к дефолтной', 'resetToDefaultMasterSettings')
    )
    
    // 5. Тестирование и Обслуживание
    .addSubMenu(ui.createMenu('🛠️ Обслуживание и Тесты')
      .addItem('🔍 Универсальный Анализатор v2', 'showUniversalAnalyzerDialogV2')
      .addItem('🧹 Очистить старые отчеты', 'cleanupAppStorage')
      .addItem('🐞 DEBUG: LiveChat Data', 'debugLiveChatData')
      .addItem('🧪 Тест всех источников', 'testBothSources')
      .addItem('🧨 Полный сброс (Hard Reset)', 'forceResetAppStorage')
    )
    .addSeparator()
    
    // 6. Старый проект (Спрятан в подменю, чтобы не мешал)
    .addSubMenu(ui.createMenu('📦 Архив (Старый HTML)')
      .addItem('🏠 Открыть старый Dashboard', 'showDashboardPreview')
      .addItem('💾 Сгенерировать весь Сайт', 'generateFullDashboardReport')
    )
    .addToUi();
}