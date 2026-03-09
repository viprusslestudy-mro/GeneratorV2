/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TranslationsManager.js - Управление переводами и Dev Mode
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Получить все переводы из листа 🌐 TRANSLATIONS
 * @returns {Object} { RU: {}, EN: {}, devMode: boolean }
 */
function getTranslations() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('🌐 TRANSLATIONS');
    if (!sheet) sheet = ss.getSheetByName('TRANSLATIONS');
    
    if (!sheet) {
      Logger.log('[getTranslations] Translations sheet not found');
      return { RU: {}, EN: {}, devMode: false };
    }
    
    var data = sheet.getDataRange().getValues();
    var translations = { RU: {}, EN: {} };
    
    var currentSection = 'general';
    
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim();
      var ru = String(data[i][1] || '').trim();
      var en = String(data[i][2] || '').trim();
      
      // Определяем секцию
      if (key.startsWith('___') || key.indexOf('---') >= 0 || key.indexOf('===') >= 0) {
        var lower = key.toLowerCase();
        if (lower.indexOf('retention') >= 0) currentSection = 'retention';
        else if (lower.indexOf('support') >= 0) currentSection = 'support';
        else if (lower.indexOf('channel') >= 0) currentSection = 'channels';
        else if (lower.indexOf('finance') >= 0) currentSection = 'finance';
        continue;
      }
      
      if (!key || key.toLowerCase() === 'сейчас') continue;
      
      if (ru) translations.RU[key] = ru;
      if (en) translations.EN[key] = en;
    }
    
    // Читаем флаг Dev Mode
    var devMode = getDevModeFlag();
    
    return { 
      RU: translations.RU, 
      EN: translations.EN, 
      devMode: devMode 
    };
    
  } catch (e) {
    Logger.log('[getTranslations] Error: ' + e.message);
    return { RU: {}, EN: {}, devMode: false };
  }
}

/**
 * Получить флаг developer_mode_search_translation из APP_SETTINGS
 */
function getDevModeFlag() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('⚙️ APP_SETTINGS') || ss.getSheetByName('APP_SETTINGS');
    if (!sheet) return false;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'developer_mode_search_translation') {
        var value = String(data[i][1] || '').trim().toUpperCase();
        return value === 'ON' || value === 'TRUE';
      }
    }
  } catch (e) {
    Logger.log('[getDevModeFlag] Error: ' + e.message);
  }
  return false;
}

/**
 * API: Добавить массив непереведённых ключей в таблицу
 * @param {Array} missingKeys - [{ key, context, screen }]
 * @returns {Object} { success, added, skipped }
 */
function api_addMissingTranslations_internal(missingKeysJson) {
  try {
    var missingKeys = JSON.parse(missingKeysJson);
    
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('🌐 TRANSLATIONS');
    if (!sheet) sheet = ss.getSheetByName('TRANSLATIONS');
    
    if (!sheet) {
      throw new Error('Translations sheet not found');
    }
    
    var data = sheet.getDataRange().getValues();
    var existingKeys = {};
    
    // Собираем существующие ключи
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim();
      if (key) existingKeys[key.toLowerCase()] = true;
    }
    
    var added = 0;
    var skipped = 0;
    
    // Группируем ключи по секциям
    var sections = {
      finance: [],
      channels: [],
      support_stats: [],
      support_tags: [],
      general: []
    };
    
    for (var i = 0; i < missingKeys.length; i++) {
      var item = missingKeys[i];
      var key = String(item.key || '').trim();
      var screen = String(item.screen || 'general').trim();
      
      if (!key || existingKeys[key.toLowerCase()]) {
        skipped++;
        continue;
      }
      
      // Определяем секцию
      var section = 'general';
      if (screen === 'finance') section = 'finance';
      else if (screen === 'channels') section = 'channels';
      else if (screen === 'support_stats') section = 'support_stats';
      else if (screen === 'support_tags') section = 'support_tags';
      
      sections[section].push(key);
      existingKeys[key.toLowerCase()] = true;
    }
    
    // Добавляем в таблицу по секциям
    var lastRow = sheet.getLastRow();
    var dateStr = Utilities.formatDate(new Date(), 'GMT+3', 'yyyy-MM-dd');
    
    // Finance
    if (sections.finance.length > 0) {
      sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
        ['___AUTO_MISSING_FINANCE_' + dateStr, '', '']
      ]);
      lastRow++;
      
      for (var i = 0; i < sections.finance.length; i++) {
        sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
          [sections.finance[i], sections.finance[i], '']
        ]);
        lastRow++;
        added++;
      }
    }
    
    // Channels
    if (sections.channels.length > 0) {
      sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
        ['___AUTO_MISSING_CHANNELS_' + dateStr, '', '']
      ]);
      lastRow++;
      
      for (var i = 0; i < sections.channels.length; i++) {
        sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
          [sections.channels[i], sections.channels[i], '']
        ]);
        lastRow++;
        added++;
      }
    }
    
    // Support Stats
    if (sections.support_stats.length > 0) {
      sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
        ['___AUTO_MISSING_SUPPORT_STATS_' + dateStr, '', '']
      ]);
      lastRow++;
      
      for (var i = 0; i < sections.support_stats.length; i++) {
        sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
          [sections.support_stats[i], sections.support_stats[i], '']
        ]);
        lastRow++;
        added++;
      }
    }
    
    // Support Tags
    if (sections.support_tags.length > 0) {
      sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
        ['___AUTO_MISSING_SUPPORT_TAGS_' + dateStr, '', '']
      ]);
      lastRow++;
      
      for (var i = 0; i < sections.support_tags.length; i++) {
        sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
          [sections.support_tags[i], sections.support_tags[i], '']
        ]);
        lastRow++;
        added++;
      }
    }
    
    // General
    if (sections.general.length > 0) {
      sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
        ['___AUTO_MISSING_GENERAL_' + dateStr, '', '']
      ]);
      lastRow++;
      
      for (var i = 0; i < sections.general.length; i++) {
        sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
          [sections.general[i], sections.general[i], '']
        ]);
        lastRow++;
        added++;
      }
    }
    
    return JSON.stringify({
      success: true,
      added: added,
      skipped: skipped
    });
    
  } catch (e) {
    Logger.log('[api_addMissingTranslations] Error: ' + e.message);
    return JSON.stringify({
      success: false,
      error: e.message
    });
  }
}

/**
 * Отправить переводы в Supabase
 */
function uploadTranslationsToDB() {
  const ui = SpreadsheetApp.getUi();
  try {
    // 1. Получаем переводы
    const translationsData = getTranslations();
    // Принудительно ставим devMode = false для продакшена
    translationsData.devMode = false;
    
    // 2. Отправляем в Supabase (в таблицу report_cache с ключом 'translations')
    const config = getSupabaseConfig();
    const url = config.url + '/rest/v1/report_cache';
    
    const payload = {
      report_key: 'translations',
      report_data: translationsData,
      updated_at: new Date().toISOString()
    };
    
    const options = {
      method: 'post',
      headers: {
        'apikey': config.key,
        'Authorization': 'Bearer ' + config.key,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code >= 200 && code < 300) {
      ui.alert('✅ Успех', 'Переводы успешно отправлены в базу данных!', ui.ButtonSet.OK);
    } else {
      throw new Error('Supabase error: ' + response.getContentText());
    }
    
  } catch (error) {
    Logger.log('[uploadTranslationsToDB] Error: ' + error.message);
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Обновленная функция отправки ВСЕГО (добавляем переводы)
 */
function uploadAllToDB() {
  try {
    // Твои функции отправки
    if (typeof uploadRetentionToDB === 'function') uploadRetentionToDB();
    if (typeof uploadSupportToDB === 'function') uploadSupportToDB();
    
    // Наша новая функция
    uploadTranslationsToDB();
    
    SpreadsheetApp.getUi().alert('🚀 ВСЕ данные (Retention, Support, Переводы) успешно отправлены в базу!');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка отправки ВСЕГО: ' + error.message);
  }
}