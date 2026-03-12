/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LegacyStorage.js - Функции хранилища (для совместимости)
 *  Путь: apps-script/src/legacy/LegacyStorage.js
 * ═══════════════════════════════════════════════════════════════════════════
 *  ВНИМАНИЕ: Эти функции используются только для очистки старых данных.
 *  В React Dashboard v2.0 данные не сохраняются в PropertiesService.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Очистить хранилище приложения
 */
function cleanupAppStorage() {
  const ui = SpreadsheetApp.getUi();
  let count = 0;

  try {
    // 1. Очистка Script Properties
    const scriptProps = PropertiesService.getScriptProperties();
    const scriptData = scriptProps.getProperties();
    const scriptKeysToDelete = [];

    for (const key in scriptData) {
      if (key.includes('_CHUNK_') ||
          key.includes('_CHUNKS_COUNT') ||
          key.includes('_TOTAL_SIZE') ||
          key.includes('LAST_REPORT') ||
          key.includes('html_')) {
        scriptKeysToDelete.push(key);
      }
    }

    if (scriptKeysToDelete.length > 0) {
      scriptKeysToDelete.forEach(k => scriptProps.deleteProperty(k));
      count += scriptKeysToDelete.length;
    }

    // 2. Очистка User Properties
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

    ui.alert(
      '✅ Очистка завершена', 
      `Удалено ${count} записей из хранилища.\n\n` +
      `Примечание: React Dashboard v2.0 не использует хранилище.\n` +
      `Эта функция нужна только для удаления старых данных.`, 
      ui.ButtonSet.OK
    );
    
    logSuccess('Хранилище очищено', `Очищено ${count} свойств`, 'cleanupAppStorage');

  } catch (e) {
    ui.alert('❌ Ошибка', 'Не удалось очистить хранилище:\n\n' + e.message, ui.ButtonSet.OK);
    logError('Ошибка очистки хранилища', e.message, 'cleanupAppStorage');
  }
}

/**
 * ПОЛНЫЙ СБРОС хранилища (Emergency)
 */
function forceResetAppStorage() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    '⚠️ ПРЕДУПРЕЖДЕНИЕ',
    'Это полностью удалит ВСЕ настройки и данные в хранилище приложения.\n\n' +
    'React Dashboard v2.0 не пострадает (он не использует хранилище).\n\n' +
    'Продолжить?',
    ui.ButtonSet.YES_NO
  );

  if (res === ui.Button.YES) {
    try {
      PropertiesService.getUserProperties().deleteAllProperties();
      PropertiesService.getScriptProperties().deleteAllProperties();
      
      ui.alert('✅ Хранилище полностью очищено.');
      logWarning('FORCE RESET', 'Пользователь выполнил полную очистку хранилища', 'forceResetAppStorage');
    } catch (e) {
      ui.alert('❌ Ошибка', 'Не удалось очистить:\n\n' + e.message, ui.ButtonSet.OK);
    }
  }
}

/**
 * Очистка логов (триггер) - LEGACY
 */
function clearLogsAuto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.LOGS);
  
  if (sheet && sheet.getLastRow() > 1000) {
    sheet.deleteRows(2, sheet.getLastRow() - 100);
  }
}