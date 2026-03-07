/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LocalizationAudit.js — Аудит и автогенерация ключей локализации
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *  Функции:
 *  1. auditLocalizationKeys()     — Полный аудит: находит ВСЕ ключи в коде,
 *                                    сравнивает с таблицей, показывает пропущенные
 *  2. generateMissingTranslations() — Автоматически добавляет недостающие строки
 *  3. validateTranslations()       — Проверяет консистентность
 *  4. buildKeyRegistry()          — Строит реестр всех ключей из кода
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Главная функция аудита — запускать из меню или вручную
 * Сканирует ВСЕ файлы проекта, находит ключи, сравнивает с таблицей
 */
function auditLocalizationKeys() {
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('   🔍 LOCALIZATION AUDIT — START');
  Logger.log('═══════════════════════════════════════════════════════════════');
  
  // 1. Собираем все ключи из кода
  var codeKeys = _collectAllCodeKeys();
  Logger.log('\n📋 Найдено ключей в коде: ' + codeKeys.length);
  
  // 2. Загружаем существующие переводы из таблицы
  var existingKeys = _loadExistingTranslationKeys();
  Logger.log('📋 Ключей в таблице TRANSLATIONS: ' + existingKeys.length);
  
  // 3. Нормализуем для сравнения
  var normalizedExisting = {};
  existingKeys.forEach(function(k) {
    normalizedExisting[k.original] = true;
    normalizedExisting[_normalizeForComparison(k.original)] = true;
    if (k.noEmoji) normalizedExisting[k.noEmoji] = true;
    if (k.lower) normalizedExisting[k.lower] = true;
    if (k.noEmojiLower) normalizedExisting[k.noEmojiLower] = true;
  });
  
  // 4. Находим пропущенные
  var missing = [];
  var found = [];
  
  codeKeys.forEach(function(entry) {
    var key = entry.key;
    var normalized = _normalizeForComparison(key);
    
    var isFound = normalizedExisting[key] || 
                  normalizedExisting[normalized] ||
                  normalizedExisting[_stripEmojiServer(key)] ||
                  normalizedExisting[_stripEmojiServer(key).toLowerCase()] ||
                  normalizedExisting[key.toLowerCase()];
    
    if (isFound) {
      found.push(entry);
    } else {
      missing.push(entry);
    }
  });
  
  // 5. Отчёт
  Logger.log('\n═══════════════════════════════════════════════════════════════');
  Logger.log('   📊 РЕЗУЛЬТАТЫ АУДИТА');
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('✅ Найдены в таблице: ' + found.length);
  Logger.log('❌ ОТСУТСТВУЮТ в таблице: ' + missing.length);
  
  if (missing.length > 0) {
    Logger.log('\n🔴 ПРОПУЩЕННЫЕ КЛЮЧИ:');
    Logger.log('────────────────────────────────────────────────────────');
    
    // Группируем по источнику
    var bySource = {};
    missing.forEach(function(m) {
      var src = m.source || 'unknown';
      if (!bySource[src]) bySource[src] = [];
      bySource[src].push(m);
    });
    
    Object.keys(bySource).forEach(function(src) {
      Logger.log('\n📁 ' + src + ':');
      bySource[src].forEach(function(m) {
        Logger.log('   ❌ "' + m.key + '"  [' + m.type + ']');
      });
    });
  }
  
  // 6. Генерируем предложения для таблицы
  if (missing.length > 0) {
    Logger.log('\n═══════════════════════════════════════════════════════════════');
    Logger.log('   📝 ПРЕДЛОЖЕНИЯ ДЛЯ ДОБАВЛЕНИЯ В ТАБЛИЦУ');
    Logger.log('   (Колонка A | Колонка B (RU) | Колонка C (EN))');
    Logger.log('═══════════════════════════════════════════════════════════════');
    
    // Дедупликация
    var uniqueMissing = {};
    missing.forEach(function(m) {
      var cleanKey = _stripEmojiServer(m.key).trim();
      if (!uniqueMissing[cleanKey]) {
        uniqueMissing[cleanKey] = m;
      }
    });
    
    Object.keys(uniqueMissing).forEach(function(cleanKey) {
      var m = uniqueMissing[cleanKey];
      var ruText = m.key;
      var enText = _autoTranslateGuess(m.key);
      Logger.log(m.key + ' | ' + ruText + ' | ' + enText);
    });
  }
  
  Logger.log('\n═══════════════════════════════════════════════════════════════');
  Logger.log('   🔍 LOCALIZATION AUDIT — COMPLETE');
  Logger.log('═══════════════════════════════════════════════════════════════');
  
  return {
    total: codeKeys.length,
    found: found.length,
    missing: missing,
    missingCount: missing.length
  };
}

/**
 * Автоматически добавляет недостающие переводы в таблицу
 * ВНИМАНИЕ: EN переводы будут приблизительными — нужна ручная проверка!
 */
function generateMissingTranslations() {
  var audit = auditLocalizationKeys();
  
  if (audit.missingCount === 0) {
    Logger.log('✅ Все ключи уже есть в таблице! Ничего добавлять не нужно.');
    return;
  }
  
  var ss = getSettingsSpreadsheet();
  var sheet = ss.getSheetByName(TRANSLATIONS_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('❌ Лист ' + TRANSLATIONS_SHEET_NAME + ' не найден!');
    return;
  }
  
  // Находим последнюю заполненную строку
  var lastRow = sheet.getLastRow();
  
  // Дедупликация
  var uniqueKeys = {};
  audit.missing.forEach(function(m) {
    var key = m.key;
    if (!uniqueKeys[key]) {
      uniqueKeys[key] = m;
    }
  });
  
  var keysToAdd = Object.keys(uniqueKeys);
  
  Logger.log('\n📝 Добавляю ' + keysToAdd.length + ' ключей в таблицу...');
  
  // Добавляем разделитель
  lastRow++;
  sheet.getRange(lastRow, 1).setValue('___AUTO_GENERATED_' + new Date().toISOString().slice(0,10));
  sheet.getRange(lastRow, 1, 1, 3).merge();
  
  // Добавляем ключи
  keysToAdd.forEach(function(key) {
    lastRow++;
    var m = uniqueKeys[key];
    var enText = _autoTranslateGuess(key);
    
    // RU: для label.* ключей подставляем читаемый русский текст
    var ruText = _getRuDisplayText(key);
    
    sheet.getRange(lastRow, 1).setValue(key);
    sheet.getRange(lastRow, 2).setValue(ruText);
    sheet.getRange(lastRow, 3).setValue(enText);
    
    Logger.log('   ✅ Added: "' + key + '" → RU: "' + ruText + '" → EN: "' + enText + '"');
  });
  
  Logger.log('\n✅ Добавлено ' + keysToAdd.length + ' ключей!');
  Logger.log('⚠️ ВАЖНО: Проверьте EN переводы вручную — автоперевод приблизительный!');
}

/**
 * Валидация: проверяет что все ключи в таблице корректны
 */
function validateTranslations() {
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('   ✅ VALIDATION — START');
  Logger.log('═══════════════════════════════════════════════════════════════');
  
  var translations = loadTranslations();
  var issues = [];
  
  // Проверка 1: Есть RU но нет EN
  Object.keys(translations.RU || {}).forEach(function(key) {
    if (!translations.EN[key] && !translations.EN[_stripEmojiServer(key)]) {
      issues.push({ type: 'MISSING_EN', key: key });
    }
  });
  
  // Проверка 2: Пустые значения
  ['RU', 'EN'].forEach(function(lang) {
    Object.keys(translations[lang] || {}).forEach(function(key) {
      var val = translations[lang][key];
      if (!val || val.trim() === '' || val === '—') {
        issues.push({ type: 'EMPTY_' + lang, key: key });
      }
    });
  });
  
  // Проверка 3: Дубликаты ключей (без эмодзи)
  var seen = {};
  Object.keys(translations.RU || {}).forEach(function(key) {
    var clean = _stripEmojiServer(key).toLowerCase().trim();
    if (seen[clean]) {
      issues.push({ type: 'DUPLICATE', key: key, duplicateOf: seen[clean] });
    } else {
      seen[clean] = key;
    }
  });
  
  if (issues.length === 0) {
    Logger.log('✅ Все переводы корректны!');
  } else {
    Logger.log('⚠️ Найдено проблем: ' + issues.length);
    issues.forEach(function(issue) {
      Logger.log('   [' + issue.type + '] "' + issue.key + '"' + 
        (issue.duplicateOf ? ' (дубликат "' + issue.duplicateOf + '")' : ''));
    });
  }
  
  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE: Сбор ключей из кода
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Собирает ВСЕ ключи локализации из всех файлов проекта
 * Ищет: data-i18n="...", t('...'), t("...")
 */
function _collectAllCodeKeys() {
  var allKeys = [];
  
  // ═══ ИСТОЧНИК 1: HTML data-i18n атрибуты ═══
  var htmlSources = [
    { name: 'HTMLBuilder_FinanceDashboard.js', fn: function() { return buildFinanceDashboardHTML([], null); } },
    { name: 'HTMLBuilder_Sidebar.js', fn: function() { return getRetentionSidebar(''); } }
  ];
  
  // Безопасный вызов — если функция упала, пропускаем
  htmlSources.forEach(function(src) {
    try {
      var html = src.fn();
      var dataI18nKeys = _extractDataI18nKeys(html);
      dataI18nKeys.forEach(function(key) {
        allKeys.push({ key: key, type: 'data-i18n', source: src.name });
      });
    } catch(e) {
      Logger.log('⚠️ Skip ' + src.name + ': ' + e.message);
    }
  });
  
  // ═══ ИСТОЧНИК 2: JS вызовы t('...') ═══
  var jsSources = [
    { name: 'JSBuilder_FinanceKpi.js', fn: getFinanceKpiJS },
    { name: 'JSBuilder_FinanceTables.js', fn: getFinanceTablesJS },
    { name: 'JSBuilder_FinanceGrowth.js', fn: getFinanceGrowthSidebarJS },
    { name: 'JSBuilder_FinanceCharts_Init.js', fn: getFinanceChartsInitJS },
    { name: 'JSBuilder_FinanceCharts_Legends.js', fn: getFinanceChartsLegendsJS },
    { name: 'JSBuilder_FinanceCharts_Update.js', fn: getFinanceChartsUpdateJS },
    { name: 'JSBuilder_Navigation.js (Preview)', fn: getPreviewNavigationJS },
    { name: 'JSBuilder_Navigation.js (SPA)', fn: getSPANavigationJS },
    { name: 'HTMLBuilder_Utils.js', fn: getDataUtilsJS },
    { name: 'JSBuilder_FormatUtils.js', fn: getFormatUtilsJS }
  ];
  
  // Channels
  try {
    jsSources.push({ name: 'JSBuilder_ChannelKpi.js', fn: getChannelsKpiJS });
    jsSources.push({ name: 'JSBuilder_ChannelTables.js', fn: getChannelsTablesJS });
    jsSources.push({ name: 'JSBuilder_ChannelGrowth.js', fn: getChannelsGrowthSidebarJS });
    jsSources.push({ name: 'JSBuilder_ChannelCharts_Init.js', fn: getChannelChartsInitJS });
    jsSources.push({ name: 'JSBuilder_ChannelCharts_Legends.js', fn: getChannelChartsLegendsJS });
    jsSources.push({ name: 'JSBuilder_ChannelCharts_Update.js', fn: getChannelChartsUpdateJS });
  } catch(e) {}
  
  jsSources.forEach(function(src) {
    try {
      var jsCode = src.fn();
      var tKeys = _extractTFunctionKeys(jsCode);
      tKeys.forEach(function(key) {
        allKeys.push({ key: key, type: 't()', source: src.name });
      });
    } catch(e) {
      Logger.log('⚠️ Skip ' + src.name + ': ' + e.message);
    }
  });
  
  // ═══ ИСТОЧНИК 3: Статические ключи из tableConfigs ═══
  try {
    var tableConfigsJS = getFinanceTableConfigsJS();
    var labelKeys = _extractTableConfigLabels(tableConfigsJS);
    labelKeys.forEach(function(key) {
      allKeys.push({ key: key, type: 'tableConfig.label', source: 'JSBuilder_FinanceTableConfigs.js' });
    });
  } catch(e) {}
  
  // ═══ ИСТОЧНИК 4: growthMetrics labels ═══
  try {
    var metricsJS = getFinanceMetricsJS();
    var metricLabels = _extractMetricLabels(metricsJS);
    metricLabels.forEach(function(key) {
      allKeys.push({ key: key, type: 'growthMetric.label', source: 'JSBuilder_FinanceMetrics.js' });
    });
  } catch(e) {}
  
  // Дедупликация
  var unique = {};
  var result = [];
  allKeys.forEach(function(entry) {
    var cleanKey = entry.key.trim();
    if (!cleanKey || cleanKey === '—' || cleanKey === '-') return;
    if (unique[cleanKey]) return;
    unique[cleanKey] = true;
    entry.key = cleanKey;
    result.push(entry);
  });
  
  return result;
}

/**
 * Извлекает ключи из data-i18n="..." в HTML
 */
function _extractDataI18nKeys(html) {
  var keys = [];
  if (!html) return keys;
  
  // Regex для data-i18n="VALUE"
  var regex = /data-i18n="([^"]+)"/g;
  var match;
  while ((match = regex.exec(html)) !== null) {
    keys.push(match[1]);
  }
  
  // Regex для data-i18n='VALUE'
  var regex2 = /data-i18n='([^']+)'/g;
  while ((match = regex2.exec(html)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

/**
 * Извлекает ключи из вызовов t('KEY', ...) и t("KEY", ...) в JS коде
 */
function _extractTFunctionKeys(jsCode) {
  var keys = [];
  if (!jsCode) return keys;
  
  // t('KEY'  или  t('KEY',
  var regex1 = /\bt\s*\(\s*'([^']+)'/g;
  var match;
  while ((match = regex1.exec(jsCode)) !== null) {
    keys.push(match[1]);
  }
  
  // t("KEY"  или  t("KEY",
  var regex2 = /\bt\s*\(\s*"([^"]+)"/g;
  while ((match = regex2.exec(jsCode)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

/**
 * Извлекает label из tableConfigs
 */
function _extractTableConfigLabels(jsCode) {
  var keys = [];
  if (!jsCode) return keys;
  
  // "label": "VALUE" или "labelKey": "VALUE"
  var regex = /"(?:label|labelKey)"\s*:\s*"([^"]+)"/g;
  var match;
  while ((match = regex.exec(jsCode)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

/**
 * Извлекает label из growthMetrics
 */
function _extractMetricLabels(jsCode) {
  var keys = [];
  if (!jsCode) return keys;
  
  var regex = /label:\s*'([^']+)'/g;
  var match;
  while ((match = regex.exec(jsCode)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE: Загрузка существующих ключей из таблицы
// ═══════════════════════════════════════════════════════════════════════════

function _loadExistingTranslationKeys() {
  var keys = [];
  
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(TRANSLATIONS_SHEET_NAME);
    if (!sheet) return keys;
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var keyText = String(data[i][0] || '').trim();
      if (!keyText || keyText === '—' || keyText === '-') continue;
      if (isCategoryHeader(keyText)) continue;
      
      keys.push({
        original: keyText,
        noEmoji: _stripEmojiServer(keyText),
        lower: keyText.toLowerCase(),
        noEmojiLower: _stripEmojiServer(keyText).toLowerCase(),
        row: i + 1
      });
    }
  } catch(e) {
    Logger.log('Error loading translation keys: ' + e.message);
  }
  
  return keys;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE: Утилиты
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Удаляет эмодзи (серверная версия — без /u{} синтаксиса)
 */
function _stripEmojiServer(text) {
  if (!text) return '';
  var str = String(text);
  var result = '';
  
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    // Пропускаем суррогатные пары (эмодзи 4 байта)
    if (code >= 0xD800 && code <= 0xDBFF) {
      i++; // пропускаем low surrogate тоже
      continue;
    }
    // Пропускаем эмодзи из BMP
    if (code >= 0x2600 && code <= 0x27BF) continue;
    if (code >= 0x2300 && code <= 0x23FF) continue;
    if (code >= 0x2B50 && code <= 0x2B55) continue;
    if (code === 0x200D || code === 0xFE0F || code === 0x20E3) continue;
    if (code >= 0x00A9 && code <= 0x00AE) continue;
    if (code === 0x2122) continue;
    
    result += str[i];
  }
  
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Нормализует ключ для сравнения
 */
function _normalizeForComparison(text) {
  return _stripEmojiServer(text).toLowerCase().trim();
}

/**
 * Примитивный автоперевод RU → EN (на основе словаря)
 * Используется ТОЛЬКО как подсказка — нужна ручная проверка!
 */
/**
 * Примитивный автоперевод RU → EN (на основе словаря)
 * Используется ТОЛЬКО как подсказка — нужна ручная проверка!
 */
function _autoTranslateGuess(ruText) {
  var clean = _stripEmojiServer(ruText).trim();
  var original = ruText.trim();
  
  var dict = {
    // ═══ Общие ═══
    'Метрика': 'Metrics',
    'Подметрика': 'Submetric',
    'Выкл': 'Off',
    'Все метрики': 'All metrics',
    'Все каналы': 'All channels',
    'Период': 'Period',
    'нет данных': 'no data',
    'к пред.': 'vs prev.',
    'За все время': 'All time',
    'Базовый месяц': 'First month',
    'Первый месяц': 'First month',
    'Навигация': 'Navigation',
    'Показать все': 'Show all',
    'Отменить': 'Cancel',
    'Применить': 'Apply',
    'Итог/Ср.': 'Total/Avg.',
    'Загрузка...': 'Loading...',
    
    // ═══ Кнопки ═══
    'ОТОБРАЗИТЬ ВСЕ': 'SHOW ALL',
    'SHOW ALL': 'SHOW ALL',
    
    // ═══ Sidebar label.* ═══
    'label.navigation': 'Navigation',
    'label.channel_selection': 'Channel selection',
    'label.show_all': 'SHOW ALL',
    'label.period': 'Report period',
    
    // ═══ Финансы — KPI ═══
    'Депозиты (Кол-во)': 'Deposit (Count)',
    'Депозиты (Сумма)': 'Deposit (Sum)',
    'Общий Профит': 'Profit (Sum)',
    'Профит (Сумма)': 'Profit (Sum)',
    'Сумма ФТД': 'FTD Sum',
    'ФТД (Сумма)': 'FTD (Sum)',
    
    // ═══ Финансы — Growth sidebar ═══
    'Депозиты': 'Deposits',
    'Депозитов': 'Deposits',
    'Казино': 'Casino',
    'Спорт': 'Sport',
    'Профит': 'Profit',
    'Профит и Бонусы': 'Profit and Bonuses',
    'Структура': 'Structure',
    'СТРУКТУРА': 'Structure',
    'ДЕПОЗИТЫ': 'Deposits',
    'КАЗИНО': 'Casino',
    'СПОРТ': 'Sport',
    
    // ═══ Графики ═══
    'Детальный график': 'Dynamic report',
    '— детальный график': '— dynamic report',
    'детальный график': 'dynamic report',
    'Процент роста MoM по месяцам': 'Percentage change by month',
    'Процент изменений по месяцам': 'Percentage change by month',
    'рост MoM': 'MoM growth',
    'Сравнение по месяцам': 'Compared by month',
    'Объём депозитов': 'Deposit volume',
    'Количество депозитов': 'Deposit count',
    'Депозиты и Профит': 'Deposits and Profit',
    'Депозиты и Профит (Сумма)': 'Deposits and Profit (Sum)',
    'Категория ставок': 'Bet category',
    'Сумма ставок': 'Bet sum',
    'Общая сумма депозитов': 'Total deposit sum',
    'Распределение ставок': 'Bet distribution',
    'Казино vs Спорт': 'Casino vs Sport',
    
    // ═══ Таблица — Депозиты ═══
    'Тотал кол-во депозитов': 'Deposit count',
    'Кол-во депозитов': 'Deposit count',
    'Тотал сумма депозитов': 'Deposit sum',
    'Сумма депозитов': 'Deposit sum',
    'Ср. кол-во депозитов / день': 'Av. dep count per day',
    'Ср. сумма депозитов / день': 'Av. dep sum per day',
    'Сумма редеп 1м': 'FTD users re-dep sum',
    'Редеп 1м / ФТД (%)': 'FTD sum / FTD users total dep sum (%)',
    'Сумма редеп 1м+': 'Re-dep sum of users with FTD 1m+',
    'Редеп 1м+ / Тотал сумма деп (%)': 'Re-dep sum of users 1m+ / Total dep sum (%)',
    
    // ═══ Таблица — Ставки ═══
    'Тотал сумма ставок': 'Total bet sum',
    'Тотал сумма ставок (все)': 'Total bet sum (all)',
    'Тотал кол-во ставок': 'Total bet count',
    'Тотал Bet Profit': 'Total GGR',
    'Ср. сумма ставок / день': 'Av. bet sum per day',
    'Ср. кол-во ставок / день': 'Av. bet count per day',
    'Ср. кол-во ставочников / день': 'Av. users with bet per day',
    '% сумма СПОРТ': '% Sport sum',
    '% сумма КАЗИНО': '% Casino sum',
    
    // ═══ Таблица — Профит ═══
    'Тотал профит': 'Total profit (Dep-WD)',
    'Ср. профит / день': 'Av. profit per day',
    'Выданные бонусы': 'Credited bonuses',
    '% бонусов к депозитам': 'Bonus to deposits (%)',
    'Бонусы к депозитам (%)': 'Bonus to deposits (%)',
    
    // ═══ Каналы ═══
    'Конверсии': 'Conversions',
    'Отправки': 'Sent',
    'по каналам': 'by channel',
    'по месяцам': 'by month',
    'Динамика отправок по каналам': 'Sent by channel',
    'Конверсии по каналам': 'Conversions by channel',
    'Распределение Sent': 'Sent distribution',
    'Sent по месяцам': 'Dynamic by month',
    'Конверсии по месяцам': 'Dynamic by month',
    'По каналам': 'By channel',
    'Отправки по каналам': 'Sent by channel',
    
    // ═══ Пустые состояния ═══
    'Нет активных финансовых метрик': 'No active financial metrics',
    'Нет активных каналов': 'No active channels',
    'Нет активных метрик для этой вкладки в выбранных периодах': 'No active metrics for this tab in selected periods',
    'Нет активных метрик для этой вкладки': 'No active metrics for this tab',
    'Нет метрик': 'No metrics',
    
    // ═══ Каналы — KPI ═══
    'Тотал касаний': 'Total Contacts',
    'Тотал конверсий': 'Total Conversions',
    'Тотал конверсий к касаниям (%)': 'Total Conversion Rate',
    'Тотал клики': 'Total Clicks',
    
    // ═══ Названия каналов ═══
    'E-mail': 'E-mail',
    'SMS': 'SMS',
    'App Push': 'App Push',
    'Web-Push': 'Web-Push',
    'Telegram': 'Telegram',
    'WhatsApp': 'WhatsApp',
    'Pop-up': 'Pop-up',
    'AI': 'AI',
    'Call Center': 'Call Center',
    'Reactivation Team': 'Reactivation Team',
    
    // ═══ Специальные ═══
    'ТАЙТЛ': 'Bet category'
  }; // <--- ВОТ ЭТОЙ СКОБКИ У ТЕБЯ НЕ ХВАТАЛО!
  
  // 1. Точное совпадение по оригиналу (с эмодзи)
  if (dict[original]) return dict[original];
  
  // 2. Точное совпадение по очищенному
  if (dict[clean]) return dict[clean];
  
  // 3. Case-insensitive
  var cleanLower = clean.toLowerCase();
  var dictKeys = Object.keys(dict);
  for (var i = 0; i < dictKeys.length; i++) {
    if (dictKeys[i].toLowerCase() === cleanLower) {
      return dict[dictKeys[i]];
    }
  }
  
  // 4. Составной перевод: ищем каждое слово/фразу
  var result = clean;
  var replaced = false;
  
  // Сортируем ключи по длине (длинные первые — чтобы "Профит и Бонусы" заменился раньше "Профит")
  var sortedKeys = dictKeys.slice().sort(function(a, b) { return b.length - a.length; });
  
  for (var j = 0; j < sortedKeys.length; j++) {
    var ruPhrase = sortedKeys[j];
    if (ruPhrase.length < 3) continue; // пропускаем слишком короткие
    
    var idx = result.indexOf(ruPhrase);
    if (idx !== -1) {
      result = result.replace(ruPhrase, dict[ruPhrase]);
      replaced = true;
    }
  }
  
  if (replaced) return result;
  
  // 5. Не нашли — помечаем для ручной проверки
  return '⚠️ ' + clean;
}

/**
 * Возвращает читаемый RU текст для ключа
 * Для label.* ключей возвращает русский текст
 * Для обычных ключей — сам ключ
 */
function _getRuDisplayText(key) {
  var ruMap = {
    'label.navigation': 'Навигация',
    'label.channel_selection': '✨ Выбор канала',
    'label.show_all': '✨ ОТОБРАЗИТЬ ВСЕ',
    'label.period': '📅 Отчетный период',
    'Показать все': 'Показать все',
    'Детальный график': 'Детальный график',
    'Общая сумма депозитов': 'Общая сумма депозитов',
    '📊 СТРУКТУРА': '📊 Структура',
    '% бонусов к депозитам': 'Бонусы к депозитам (%)',
    'Тотал сумма ставок (все)': 'Тотал сумма ставок',
    '% сумма СПОРТ': '% сумма Спорт',
    '% сумма КАЗИНО': '% сумма Казино'
  };
  
  return ruMap[key] || key;
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Добавить пункты аудита в меню (вызывать из Menu.js)
 */
function addLocalizationAuditMenu(menu) {
  menu.addItem('🔍 Аудит ключей локализации', 'auditLocalizationKeys')
      .addItem('📝 Добавить недостающие переводы', 'generateMissingTranslations')
      .addItem('✅ Валидация переводов', 'validateTranslations');
  return menu;
}