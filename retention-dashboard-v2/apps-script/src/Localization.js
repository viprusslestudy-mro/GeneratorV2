/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LOCALIZATION.js - Система локализации v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

var TRANSLATIONS_SHEET_NAME = '🌐 TRANSLATIONS';
var SUPPORTED_LANGUAGES = ['RU', 'EN'];
var DEFAULT_LANGUAGE = 'RU';

/**
 * Генерирует ключ из текста
 */
function generateKeyFromText(text) {
  if (!text) return '';
  
  var str = String(text);
  var cleaned = '';
  
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDFFF) { i++; continue; }
    if (code >= 0x2600 && code <= 0x27BF) continue;
    if (code >= 0x2300 && code <= 0x23FF) continue;
    cleaned += str[i];
  }
  
  return cleaned
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '_');
}

/**
 * Удаляет эмодзи из текста
 */
function removeEmojis(text) {
  if (!text) return '';
  
  var str = String(text);
  var cleaned = '';
  
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    // Пропускаем суррогатные пары (эмодзи)
    if (code >= 0xD800 && code <= 0xDFFF) { i++; continue; }
    // Пропускаем символы эмодзи
    if (code >= 0x2600 && code <= 0x27BF) continue;
    if (code >= 0x2300 && code <= 0x23FF) continue;
    if (code >= 0x1F300 && code <= 0x1F9FF) continue;
    cleaned += str[i];
  }
  
  return cleaned.trim();
}

/**
 * Проверяет, является ли строка заголовком категории
 * Заголовки категорий: "Боковое меню - ...", "Вкладка - 1 - ...", "График - ...", "Таблица - ..."
 */
function isCategoryHeader(text) {
  if (!text) return false;
  var t = String(text).trim().toLowerCase();
  
  // Заголовки категорий начинаются с этих слов
  var categoryPrefixes = [
    'общие',
    'боковое меню',
    'вкладка',
    'шапка',
    'график',
    'таблица',
    'легенды',
    'метрики в таблице',
    '___'  // Комментарии в конце
  ];
  
  for (var i = 0; i < categoryPrefixes.length; i++) {
    if (t.indexOf(categoryPrefixes[i]) === 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Загрузить все переводы
 * Структура таблицы:
 * A = Ключ (исходный текст с эмодзи)
 * B = RU перевод
 * C = EN перевод
 * 
 * Пропускает:
 * - Строки-заголовки категорий (объединённые ячейки)
 * - Пустые строки (—)
 */
function loadTranslations() {
  var translations = { RU: {}, EN: {} };
  
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(TRANSLATIONS_SHEET_NAME);
    
    if (!sheet) {
      Logger.log('[loadTranslations] Sheet not found');
      return translations;
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return translations;
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Колонка A = ключ (исходный текст)
      var keyText = String(row[0] || '').trim();
      // Колонка B = RU перевод
      var ruText = String(row[1] || '').trim();
      // Колонка C = EN перевод
      var enText = String(row[2] || '').trim();
      
      // ✅ Пропускаем пустые строки
      if (!keyText || keyText === '—' || keyText === '-') continue;
      
      // ✅ Пропускаем заголовки категорий
      if (isCategoryHeader(keyText)) {
        Logger.log('[loadTranslations] Skip category header: ' + keyText);
        continue;
      }
      
      // ✅ Пропускаем если нет RU перевода
      if (!ruText || ruText === '—' || ruText === '-') continue;
      
      // Ключ = колонка A КАК ЕСТЬ (с эмодзи)
      var key = keyText;
      
      // Ключ без эмодзи для fallback поиска
      var keyNoEmoji = removeEmojis(keyText);
      
      // Переводы БЕЗ эмодзи
      var ruClean = removeEmojis(ruText);
      var enClean = removeEmojis(enText);
      
      // Сохраняем с ключом как есть (с эмодзи)
      translations.RU[key] = ruClean || ruText;
      if (enClean) {
        translations.EN[key] = enClean;
      } else if (enText && enText !== '—' && enText !== '-') {
        translations.EN[key] = removeEmojis(enText) || enText;
      }
      
      // Также сохраняем с ключом без эмодзи для fallback
      if (keyNoEmoji && keyNoEmoji !== key) {
        translations.RU[keyNoEmoji] = ruClean || ruText;
        if (enClean) {
          translations.EN[keyNoEmoji] = enClean;
        }
      }
      
      // ✅ Также сохраняем UPPERCASE и lowercase версии ключа для fallback
      var keyUpper = key.toUpperCase();
      var keyLower = key.toLowerCase();
      
      if (keyUpper !== key) {
        translations.RU[keyUpper] = ruClean || ruText;
        if (enClean) translations.EN[keyUpper] = enClean;
      }
      if (keyLower !== key) {
        translations.RU[keyLower] = ruClean || ruText;
        if (enClean) translations.EN[keyLower] = enClean;
      }
      
      // То же для ключа без эмодзи
      if (keyNoEmoji) {
        var keyNoEmojiUpper = keyNoEmoji.toUpperCase();
        var keyNoEmojiLower = keyNoEmoji.toLowerCase();
        if (keyNoEmojiUpper !== keyNoEmoji) {
          translations.RU[keyNoEmojiUpper] = ruClean || ruText;
          if (enClean) translations.EN[keyNoEmojiUpper] = enClean;
        }
        if (keyNoEmojiLower !== keyNoEmoji) {
          translations.RU[keyNoEmojiLower] = ruClean || ruText;
          if (enClean) translations.EN[keyNoEmojiLower] = enClean;
        }
      }
    }
    
    Logger.log('[loadTranslations] Loaded ' + Object.keys(translations.RU).length + ' RU, ' + Object.keys(translations.EN).length + ' EN translations');
               
  } catch (e) {
    Logger.log('[loadTranslations] Error: ' + e.message);
  }
  
  return translations;
}

/**
 * Получить язык по умолчанию
 */
function getDefaultLanguage() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.SOURCES);
    if (!sheet) return DEFAULT_LANGUAGE;
    
    var data = sheet.getDataRange().getValues();
    var headerRow = data[1] || data[0];
    var langColIndex = -1;
    
    for (var c = 0; c < headerRow.length; c++) {
      var header = String(headerRow[c] || '').trim().toUpperCase();
      if (header === 'LANG' || header === 'LANGUAGE' || header === 'ЯЗЫК') {
        langColIndex = c;
        Logger.log('[getDefaultLanguage] Found LANG column at index: ' + c);
        break;
      }
    }
    
    if (langColIndex === -1) {
      Logger.log('[getDefaultLanguage] LANG column not found');
      return DEFAULT_LANGUAGE;
    }
    
    for (var i = 2; i < data.length; i++) {
      var sourceName = String(data[i][0] || '').trim().toLowerCase();
      if (sourceName === 'translation' || sourceName === 'localization') {
        var rawLang = data[i][langColIndex];
        var langValue = String(rawLang || '').trim().toUpperCase();
        
        // Пропускаем пустые и placeholder
        if (!langValue || langValue === '—' || langValue === '-' || langValue === '') {
          Logger.log('[getDefaultLanguage] Row ' + (i+1) + ': LANG is empty/dash, skipping');
          continue;
        }
        
        if (SUPPORTED_LANGUAGES.indexOf(langValue) !== -1) {
          Logger.log('[getDefaultLanguage] Found: ' + langValue + ' at row ' + (i+1));
          return langValue;
        } else {
          Logger.log('[getDefaultLanguage] Unsupported: "' + langValue + '" at row ' + (i+1));
        }
      }
    }
    
  } catch (e) {
    Logger.log('[getDefaultLanguage] Error: ' + e.message);
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Показывать переключатель языка?
 */
function getShowLanguageSwitcher() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (!sheet) return true;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'show_language_switcher') {
        var val = String(data[i][1] || '').trim().toUpperCase();
        return !(val === 'OFF' || val === 'FALSE' || val === 'НЕТ' || val === 'NO');
      }
    }
  } catch (e) {}
  return true;
}

/**
 * Получить полную конфигурацию локализации
 */
function getLocalizationSettings() {
  return {
    defaultLang: getDefaultLanguage(),
    showSwitcher: getShowLanguageSwitcher(),
    translations: loadTranslations()
  };
}

function finalTest() {
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('           ✅ FINAL LOCALIZATION TEST');
  Logger.log('═══════════════════════════════════════════════════════════════');
  
  var config = getLocalizationSettings();
  
  Logger.log('Default language: ' + config.defaultLang);
  Logger.log('Show switcher: ' + config.showSwitcher);
  Logger.log('RU keys: ' + Object.keys(config.translations.RU).length);
  Logger.log('EN keys: ' + Object.keys(config.translations.EN).length);
  
  Logger.log('');
  Logger.log('✅ SYSTEM READY!');
  Logger.log('');
  Logger.log('Next step: Regenerate report and test in browser');
}