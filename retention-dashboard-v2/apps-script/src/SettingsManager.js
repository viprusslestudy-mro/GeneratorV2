/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SETTINGSMANAGER.gs - Управление настройками мульти-источников v2.1
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ЧТЕНИЕ ИСТОЧНИКОВ ДАННЫХ                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Получить кастомные названия табов из листа ⚙️ APP_SETTINGS
 * Ищет ключи "Tab: Support Stats", "Tab: Retention Finance" и т.д.
 */
function getCustomTabLabels() {
  const labels = {
    support_stats: '📊 Статистика LiveChat',
    support_tags: '🏷️ Теги обращений',
    retention_finance: '💰 Финансовый дашборд',
    retention_channels: '📈 Каналы маркетинга'
  };

  try {
    const ss = getSettingsSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (!sheet) return labels;

    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      const key = String(data[i][0] || '').trim().toLowerCase();
      const val = String(data[i][1] || '').trim();
      
      if (!val) continue;

      if (key === 'tab: support stats' || key === 'таб: support статистика') labels.support_stats = val;
      if (key === 'tab: support tags' || key === 'таб: support теги') labels.support_tags = val;
      if (key === 'tab: retention finance' || key === 'таб: retention финансы') labels.retention_finance = val;
      if (key === 'tab: retention channels' || key === 'таб: retention каналы') labels.retention_channels = val;
    }
  } catch (e) {
    Logger.log('[getCustomTabLabels] Error: ' + e.message);
  }
  
  return labels;
}

/**
 * Получить все активные источники данных из Settings (ВЕРСИЯ 3.1)
 * Поддерживает оба формата:
 * - Старый: Источник | ID | Листы | Иконка | Цвет | Вкл
 * - Новый: Источник | ID | Иконка | Цвет | Вкл (без колонки Листы)
 */
function getActiveDataSourcesV3() {
  const ss = getSettingsSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SOURCES);
  
  // ✅ Получаем названия табов из настроек
  const tabLabels = getCustomTabLabels();

  if (!sheet) {
    Logger.log('[getActiveDataSourcesV3] Sources sheet not found, using defaults');
    return getDefaultSources();
  }

  const data = sheet.getDataRange().getValues();
  const sources = [];

  // Определяем формат по заголовкам (строка 1, индекс 1)
  const headerRow = data[1] || [];
  const hasSheetsList = headerRow.some(function(h) {
    var hLower = String(h || '').toLowerCase();
    return hLower.includes('лист') || hLower.includes('sheet');
  });

  Logger.log('[getActiveDataSourcesV3] Format: ' + (hasSheetsList ? 'OLD (with Sheets column)' : 'NEW (without Sheets column)'));

  // Индексы колонок в зависимости от формата
  var COL;
  if (hasSheetsList) {
    // Старый формат: Источник | ID | Листы | Иконка | Цвет | Вкл
    COL = { NAME: 0, ID: 1, SHEETS: 2, ICON: 3, COLOR: 4, ENABLED: 5 };
  } else {
    // Новый формат: Источник | ID | Иконка | Цвет | Вкл
    COL = { NAME: 0, ID: 1, SHEETS: -1, ICON: 2, COLOR: 3, ENABLED: 4 };
  }

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const name = String(row[COL.NAME] || '').trim();
    const spreadsheetId = String(row[COL.ID] || '').trim();
    
    // Проверяем enabled
    var enabledVal = row[COL.ENABLED];
    const isEnabled = enabledVal === true || 
      String(enabledVal).toUpperCase() === 'TRUE' ||
      String(enabledVal).toUpperCase() === 'ON';

    if (!name || !spreadsheetId || !isEnabled) {
      if (name) {
        Logger.log('[getActiveDataSourcesV3] Skipping "' + name + '": ID=' + (spreadsheetId || 'empty') + ', enabled=' + isEnabled);
      }
      continue;
    }

    const nameLower = name.toLowerCase();
    const icon = String(row[COL.ICON] || '').trim();
    const isSupport = nameLower.includes('support') || icon.includes('🎧');
    const template = isSupport ? 'Support' : 'Retention';
    const key = nameLower.replace(/\s+/g, '_');

    sources.push({
      name: name,
      key: key,
      spreadsheetId: spreadsheetId,
      template: template,
      sheets: COL.SHEETS >= 0 ? String(row[COL.SHEETS] || '').trim() : '',
      icon: icon,
      color: String(row[COL.COLOR] || '').trim(),
      enabled: true,
      reports: template === 'Support' ? [
        { id: 'stats', label: 'tab.support_stats|||📊 Статистика LiveChat', default: true },
        { id: 'tags', label: 'tab.support_tags|||🏷️ Теги обращений' }
      ] : [
        { id: 'finance', label: 'tab.finance|||💰 Главный Дашборд', default: true },
        { id: 'channels', label: 'tab.channels|||📈 Каналы коммуникации' }
      ]
    });

    Logger.log('[getActiveDataSourcesV3] Added source: ' + name + ' (ID: ' + spreadsheetId.substring(0, 20) + '...)');
  }

  if (sources.length === 0) {
    Logger.log('[getActiveDataSourcesV3] No sources found, using defaults');
    return getDefaultSources();
  }

  return sources;
}

/**
 * Получить настройки приложения (Брендинг + Support Settings)
 */
function getAppSettings() {
  const ss = getSettingsSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);

  const defaults = {
    projectName: 'Analytics',
    projectIcon: '🎰',
    logoUrl: '',
    // Support settings
    supportAutoCalcAllGeo: true
  };

  if (!sheet) return defaults;

  var lastRow = sheet.getLastRow();
  if (lastRow < 3) return defaults;
  
  var data = sheet.getRange(3, 1, lastRow - 2, 2).getValues();
  var settings = {};
  var currentSection = '';

  for (var i = 0; i < data.length; i++) {
    var rawKey = String(data[i][0] || '').trim();
    var val = String(data[i][1] || '').trim();
    var keyLower = rawKey.toLowerCase();

    // Определяем секцию по разделителям или заголовкам
    if (rawKey.indexOf('---') >= 0 || rawKey.indexOf('===') >= 0) {
      if (keyLower.indexOf('support') >= 0) {
        currentSection = 'support';
      } else if (keyLower.indexOf('tab') >= 0) {
        currentSection = 'tabs';
      } else {
        currentSection = rawKey;
      }
      continue;
    }
    
    // Секция по ключевому слову SUPPORT / GENERAL
    if (rawKey === rawKey.toUpperCase() && rawKey.length >= 3 && !val) {
      currentSection = keyLower;
      continue;
    }

    if (!val) continue;

    // ═══ ОСНОВНЫЕ НАСТРОЙКИ ═══
    if (keyLower.includes('название') || keyLower.includes('name') || keyLower.includes('project_name')) {
      settings.projectName = val;
    }
    if (keyLower.includes('иконка') || keyLower.includes('icon') || keyLower.includes('project_icon')) {
      settings.projectIcon = val;
    }
    if (keyLower.includes('логотип') || keyLower.includes('logo') || keyLower.includes('logo_url')) {
      settings.logoUrl = val;
    }

    // ═══ SUPPORT SETTINGS ═══
    if (keyLower === 'auto_calc_allgeo') {
      settings.supportAutoCalcAllGeo = parseSettingBoolean(data[i][1]);
    }
  }

  var result = {};
  for (var k in defaults) result[k] = defaults[k];
  for (var k in settings) result[k] = settings[k];
  
  return result;
}

/**
 * Получить базовый месяц для Finance (для которого нет дельты)
 * @returns {string|null} Ключ месяца в формате YYYY-MM
 */
function getBaseMonthFinance() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('⚙️ APP_SETTINGS') || ss.getSheetByName('APP_SETTINGS');
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'base_month_finance' || key === 'базовый_месяц_finance' || key === 'базовый месяц finance') {
        var value = data[i][1];
        
        // ★ Если это Date объект — конвертируем в YYYY-MM
        if (value instanceof Date) {
          var year = value.getFullYear();
          var month = value.getMonth() + 1;
          return year + '-' + String(month).padStart(2, '0');
        }
        
        // Если строка — возвращаем как есть
        return String(value || '').trim();
      }
    }
  } catch (e) {
    Logger.log('[getBaseMonthFinance] Error: ' + e.message);
  }
  return null;
}

/**
 * Получить базовый месяц для Channels (для которого нет дельты)
 * @returns {string|null} Ключ месяца в формате YYYY-MM
 */
function getBaseMonthChannels() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('⚙️ APP_SETTINGS') || ss.getSheetByName('APP_SETTINGS');
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'base_month_channels' || key === 'базовый_месяц_channels' || key === 'базовый месяц channels') {
        var value = data[i][1];
        
        // ★ Если это Date объект — конвертируем в YYYY-MM
        if (value instanceof Date) {
          var year = value.getFullYear();
          var month = value.getMonth() + 1;
          return year + '-' + String(month).padStart(2, '0');
        }
        
        // Если строка — возвращаем как есть
        return String(value || '').trim();
      }
    }
  } catch (e) {
    Logger.log('[getBaseMonthChannels] Error: ' + e.message);
  }
  return null;
}

/**
 * Получить базовый месяц (для обратной совместимости)
 * @deprecated Используйте getBaseMonthFinance() или getBaseMonthChannels()
 */
function getBaseMonth() {
  return getBaseMonthFinance();
}

/**
 * Парсинг boolean значения из настроек
 * Поддерживает: ON/OFF, TRUE/FALSE, YES/NO, 1/0
 */
function parseSettingBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  
  var str = String(value || '').trim().toUpperCase();
  
  if (str === 'ON' || str === 'TRUE' || str === 'YES' || str === '1') return true;
  if (str === 'OFF' || str === 'FALSE' || str === 'NO' || str === '0') return false;
  
  // По умолчанию — включено
  return true;
}

/**
 * Алиас для совместимости
 */
function getActiveDataSources() {
  return getActiveDataSourcesV3();
}

/**
 * Получить дефолтные источники
 */
function getDefaultSources() {
  return [
    {
      name: 'Retention',
      key: 'retention',
      spreadsheetId: DEFAULT_SOURCES.RETENTION.spreadsheetId,
      template: 'Retention',
      enabled: true
    },
    {
      name: 'Support',
      key: 'support',
      spreadsheetId: DEFAULT_SOURCES.SUPPORT.spreadsheetId,
      template: 'Support',
      enabled: true
    }
  ];
}

/**
 * Получить источник по ключу
 */
function getSourceByKey(sourceKey) {
  const sources = getActiveDataSources();
  return sources.find(s => s.key === sourceKey) || null;
}

/**
 * Определить роль листа Retention по имени.
 * Важно: "Комуникации TOTAL" всегда относится к channels,
 * а не к finance.
 */
function detectRetentionRole(sheetName) {
  var name = String(sheetName || '').toLowerCase().trim();
  if (!name) return 'unknown';

  // Сначала каналы (чтобы не было ложных попаданий в finance)
  if (
    name.includes('комуникац') ||
    name.includes('коммуникац') ||
    name.includes('channel') ||
    name.includes('канал')
  ) {
    return 'channels';
  }

  // Затем финансы
  if (
    name.includes('product stat') ||
    name.includes('product') ||
    name.includes('finance') ||
    name.includes('финанс') ||
    name.includes('stat')
  ) {
    return 'finance';
  }

  return 'unknown';
}

function getSettingsSheetByAliases(ss, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var exact = ss.getSheetByName(aliases[i]);
    if (exact) return exact;
  }

  var normalizedAliases = aliases.map(function (a) {
    return String(a || '')
      .toLowerCase()
      .replace(/[📊💰📣🎧⚙️]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  });

  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var n = String(sheets[s].getName() || '')
      .toLowerCase()
      .replace(/[📊💰📣🎧⚙️]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    for (var j = 0; j < normalizedAliases.length; j++) {
      if (n === normalizedAliases[j]) return sheets[s];
    }
  }

  return null;
}

function getRetentionSheets() {
  const sources = getActiveDataSourcesV3();
  const retentionSource = sources.find(s => s.key === 'retention' || s.name.toLowerCase() === 'retention');
  if (!retentionSource) return { finance: 'Product Stat', channels: 'Комуникации TOTAL' }; // defaults
  const sheets = String(retentionSource.sheets || '').split(',').map(s => s.trim());
  return {
    finance: sheets.find(s => s.includes('Product Stat')) || 'Product Stat',
    channels: sheets.find(s => s.includes('Комуникации TOTAL')) || 'Комуникации TOTAL'
  };
}

function getFinanceSheetNameForYear(year) {
  const sheets = getRetentionSheets();
  return sheets.finance + ' - ' + year;
}

function getChannelsSheetNameForYear(year) {
  const sheets = getRetentionSheets();
  return sheets.channels + ' - ' + year;
}

function getRetentionPeriodsFromMetricsConfig() {
  var byPeriod = {};

  function ensurePeriod(periodKey) {
    if (!byPeriod[periodKey]) {
      byPeriod[periodKey] = {
        finance: false,
        channels: false,
        enabled: false,
        financeSheet: null,
        channelsSheet: null
      };
    }
    return byPeriod[periodKey];
  }

  var ss = getSettingsSpreadsheet();
  var metricSheetsInfo = [
    { name: 'Ret. FINANCE METRICS', role: 'finance' },
    { name: 'Ret. CHANNEL METRICS', role: 'channels' }
  ];

  metricSheetsInfo.forEach(function(info) {
    var sheet = ss.getSheetByName(info.name);
    if (!sheet) return;
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 4) return;

    // ═══ СТРУКТУРА ЛИСТА ═══
    // Строка 1 (index 0): Заголовки листов: "Метрика", "Status", "Product Stat - 2025", ...
    // Строка 2 (index 1): "Включить лист" с ON/OFF для каждого блока
    // Строка 3 (index 2): "Период", "Год", "Ноя", "Дек", ...
    // Строка 4 (index 3): "Включить месяц" с ON/OFF для каждого месяца
    
    var headerRow = data[0];       // Строка 1: названия листов
    var sheetEnableRow = data[1];  // Строка 2: "Включить лист"
    var monthRow = data[2];        // Строка 3: названия месяцев
    var monthEnableRow = data[3];  // Строка 4: "Включить месяц"

    // ═══ Проверяем что строка 2 это "Включить лист" ═══
    var row2Name = String((sheetEnableRow && sheetEnableRow[0]) || '').trim().toLowerCase();
    if (row2Name !== 'включить лист' && row2Name !== 'enable sheet') {
      Logger.log('[getRetentionPeriodsFromMetricsConfig] WARNING: Row 2 is not "Включить лист", got: "' + row2Name + '"');
    }

    // ═══ Парсим блоки листов и их статус включения ═══
    // Блок = группа колонок для одного года
    var yearBlocks = []; // { sheetName, year, startCol, endCol, enabled }
    
    for (var col = 1; col < headerRow.length; col++) {
      var header = String(headerRow[col] || '').trim();
      if (!header) continue;
      
      // Ищем год в заголовке
      var yearMatch = header.match(/20\d{2}/);
      if (yearMatch) {
        var year = parseInt(yearMatch[0]);
        
        // Определяем статус листа из строки 2
        // Для merged ячеек значение будет в первой колонке блока
        var sheetEnabled = true;
        var sheetStatus = String(sheetEnableRow[col] || '').trim().toUpperCase();
        
        // Если пусто — ищем в следующих колонках этого блока
        if (!sheetStatus) {
          for (var sc = col; sc < Math.min(col + 5, headerRow.length); sc++) {
            var val = String(sheetEnableRow[sc] || '').trim().toUpperCase();
            if (val === 'ON' || val === 'OFF') {
              sheetStatus = val;
              break;
            }
          }
        }
        
        sheetEnabled = (sheetStatus !== 'OFF');
        
        yearBlocks.push({
          sheetName: header,
          year: year,
          startCol: col,
          enabled: sheetEnabled
        });
        
        Logger.log('[getRetentionPeriodsFromMetricsConfig] Block: "' + header + 
                  '" (year=' + year + ', col=' + col + ', enabled=' + sheetEnabled + ')');
      }
    }
    
    // Определяем endCol для каждого блока
    for (var i = 0; i < yearBlocks.length; i++) {
      if (i + 1 < yearBlocks.length) {
        yearBlocks[i].endCol = yearBlocks[i + 1].startCol - 1;
      } else {
        yearBlocks[i].endCol = headerRow.length - 1;
      }
    }

    // ═══ Сканируем месяцы ═══
    for (var col = 2; col < monthEnableRow.length; col++) {
      var monthStatus = String(monthEnableRow[col] || '').trim().toUpperCase();
      var monthName = String(monthRow[col] || '').trim().toLowerCase();
      var monthNum = getMonthNumberFromName(monthName);
      
      // Пропускаем если не месяц или месяц выключен
      if (!monthNum) continue;
      if (monthStatus !== 'ON') {
        Logger.log('[getRetentionPeriodsFromMetricsConfig] Month DISABLED: col=' + col + ', month=' + monthName);
        continue;
      }
      
      // ═══ Определяем к какому блоку относится эта колонка ═══
      var block = null;
      for (var bi = 0; bi < yearBlocks.length; bi++) {
        if (col >= yearBlocks[bi].startCol && col <= yearBlocks[bi].endCol) {
          block = yearBlocks[bi];
          break;
        }
      }
      
      if (!block) {
        Logger.log('[getRetentionPeriodsFromMetricsConfig] No block found for col=' + col);
        continue;
      }
      
      // ═══ ГЛАВНАЯ ПРОВЕРКА: ЛИСТ ВКЛЮЧЁН? ═══
      if (!block.enabled) {
        Logger.log('[getRetentionPeriodsFromMetricsConfig] SKIPPED (sheet disabled): ' + 
                  monthName + ' ' + block.year + ' (sheet="' + block.sheetName + '")');
        continue;
      }

      var periodKey = block.year + '-' + String(monthNum).padStart(2, '0');
      var p = ensurePeriod(periodKey);
      p.enabled = true;
      
      if (info.role === 'finance') {
        p.finance = true;
        p.financeSheet = block.sheetName;
      }
      if (info.role === 'channels') {
        p.channels = true;
        p.channelsSheet = block.sheetName;
      }
      
      Logger.log('[getRetentionPeriodsFromMetricsConfig] Period ' + periodKey + 
        ' → ' + info.role + ': "' + block.sheetName + '"');
    }
  });

  // ═══ Собираем итоговый массив ═══
  var monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 
                    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

  var periods = Object.keys(byPeriod)
    .sort()
    .map(function(periodKey) {
      var pData = byPeriod[periodKey];
      if (!pData.enabled) return null;

      var parts = periodKey.split('-');
      var year = parseInt(parts[0]);
      var monthNum = parseInt(parts[1]);
      var monthName = monthNames[monthNum - 1];

      return {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year,
        nameOnly: monthName,
        key: periodKey,
        year: year,
        monthNum: monthNum,
        enabled: true,
        roleSheets: {
          finance: pData.financeSheet || null,
          channels: pData.channelsSheet || null
        }
      };
    })
    .filter(function(p) { return !!p; });

  Logger.log('[getRetentionPeriodsFromMetricsConfig] Built ' + periods.length + ' periods');
  periods.forEach(function(p) {
    Logger.log('  ' + p.key + ': finance="' + p.roleSheets.finance + '", channels="' + p.roleSheets.channels + '"');
  });
  
  return periods;
}

/**
 * Вспомогательная функция: получить номер месяца из названия
 */
function getMonthNumberFromName(monthName) {
  var map = {
    'янв': 1, 'январь': 1,
    'фев': 2, 'февраль': 2,
    'мар': 3, 'март': 3,
    'апр': 4, 'апрель': 4,
    'май': 5,
    'июн': 6, 'июнь': 6,
    'июл': 7, 'июль': 7,
    'авг': 8, 'август': 8,
    'сен': 9, 'сентябрь': 9,
    'окт': 10, 'октябрь': 10,
    'ноя': 11, 'ноябрь': 11,
    'дек': 12, 'декабрь': 12
  };
  return map[monthName.toLowerCase()] || null;
}

/**
 * Получить активные месяцы для конкретного источника
 * v3.1 FIXED: Обработка Date объектов в колонках Год и Ключ
 */
function getActiveMonthsForSource(sourceKey) {
  const ss = getSettingsSpreadsheet();
  const source = getSourceByKey(sourceKey);

  if (!source) {
    Logger.log('[getActiveMonthsForSource] Source not found: ' + sourceKey);
    return [];
  }

  const isSupport = (sourceKey === 'support' || source.template === 'Support');

  // ВАЖНО: Для Retention периоды берём из FINANCE/CHANNEL METRICS
  if (!isSupport) {
    Logger.log('[getActiveMonthsForSource] Retention periods are resolved from FINANCE/CHANNEL METRICS only');
    return getRetentionPeriodsFromMetricsConfig();
  }

  // ═══ ДЛЯ SUPPORT: Читаем из листа 🎧 SUPPORT ═══
  // Ищем лист с разными вариантами названия
  let sheet = ss.getSheetByName(SHEETS.SUPPORT); // '🎧 SUPPORT'
  if (!sheet) sheet = ss.getSheetByName('🎧SUPPORT'); // Без пробела
  if (!sheet) sheet = ss.getSheetByName('🎧 SUPPORT'); // С пробелом
  if (!sheet) sheet = ss.getSheetByName('SUPPORT');
  if (!sheet) {
    // Поиск по частичному совпадению
    const allSheets = ss.getSheets();
    sheet = allSheets.find(s => {
      const name = s.getName().toLowerCase();
      return name.includes('support') && !name.includes('источник');
    });
  }

  if (!sheet) {
    Logger.log('[getActiveMonthsForSource] Support sheet not found (tried: 🎧 SUPPORT, 🎧SUPPORT, SUPPORT, partial match)');
    return [];
  }

  Logger.log('[getActiveMonthsForSource] Found Support sheet: "' + sheet.getName() + '"');

  const data = sheet.getDataRange().getValues();
  const headerRow = data[MONTHS_SECTION.HEADER_ROW - 1] || [];
  const baseSheets = String(source.sheets || '').split(',').map(s => s.trim()).filter(s => s);

  Logger.log('[getActiveMonthsForSource] Processing source: ' + source.name);
  Logger.log('[getActiveMonthsForSource] Base sheets: ' + JSON.stringify(baseSheets));

  // Построение маппинга колонок → листов
  const columnToSheetMap = {};

  for (let i = 3; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').trim();
    if (!header) continue;

    let fullSheetName = header;
    if (header.startsWith(source.name + ' - ')) {
      fullSheetName = header.replace(source.name + ' - ', '').trim();
    }

    const base = baseSheets.find(bs => {
      return fullSheetName === bs ||
        fullSheetName.startsWith(bs + ' ') ||
        fullSheetName.startsWith(bs + ' 20');
    });

    if (base) {
      columnToSheetMap[i] = {
        base: base,
        full: fullSheetName,
        header: header
      };
    }
  }

  const activeMonths = [];
  const startRow = MONTHS_SECTION.DATA_START_ROW - 1;
  const colIndices = Object.keys(columnToSheetMap).map(k => parseInt(k, 10));

  if (colIndices.length === 0) {
    Logger.log('[getActiveMonthsForSource] No columns found for source ' + source.name);
  }

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    const monthName = String(row[MONTHS_SECTION.COLUMNS.MONTH_NAME] || '').trim();
    const yearRaw = row[MONTHS_SECTION.COLUMNS.YEAR];
    const year = extractYear(yearRaw);

    if (!monthName || !year) continue;

    let isAnySelected = false;
    const roleSheets = {};

    colIndices.forEach(colIdx => {
      const cellValue = row[colIdx];
      const isSelected = cellValue === true || String(cellValue).toUpperCase() === 'TRUE';

      if (isSelected) {
        const meta = columnToSheetMap[colIdx];
        isAnySelected = true;

        let roleId = 'unknown';
        const baseLower = meta.base.toLowerCase();

        // Для Support определяем роль
        if (baseLower.includes('kpi')) roleId = 'livechat';
        else if (baseLower.includes('tags')) roleId = 'tags';
        else if (baseLower.includes('helpdesk')) roleId = 'helpdesk';

        var sheetYear = extractYear(meta.full);
        if (sheetYear && year) {
          if (sheetYear === year) {
            roleSheets[roleId] = meta.full;
          } else if (!roleSheets[roleId]) {
            roleSheets[roleId] = meta.full;
          }
        } else {
          roleSheets[roleId] = meta.full;
        }
      }
    });

    // ✅ Пропускаем если НИ ОДИН чекбокс не выбран
    if (!isAnySelected) continue;

    const monthNum = MONTH_NAME_TO_NUMBER[monthName.toLowerCase()] || 
                     (yearRaw instanceof Date ? yearRaw.getMonth() + 1 : 1);
    const keyString = `${year}-${String(monthNum).padStart(2, '0')}`;

    const period = {
      name: `${monthName} ${year}`,
      nameOnly: monthName.toLowerCase(),
      key: keyString,
      year: year,
      monthNum: monthNum,
      enabled: true,  // ✅ Support: всегда enabled если isAnySelected
      roleSheets: roleSheets
    };

    activeMonths.push(period);
    Logger.log('[getActiveMonthsForSource] Added period: ' + period.name + 
              ' (' + period.key + '), enabled: true, sheets: ' + JSON.stringify(roleSheets));
  }

  if (activeMonths.length === 0) {
    Logger.log('[getActiveMonthsForSource] WARNING: No active periods found for ' + sourceKey);
  }

  Logger.log('[getActiveMonthsForSource] Found ' + activeMonths.length + ' active periods for ' + sourceKey);
  return activeMonths;
}

/**
 * ✅ Извлечь год из значения ячейки
 */
function extractYear(value) {
  if (!value) return null;
  if (value instanceof Date) return value.getFullYear();
  if (typeof value === 'number') {
    if (value >= 1900 && value <= 2100) return value;
    try { return new Date(value).getFullYear(); } catch (e) { return null; }
  }
  const str = String(value).trim();
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return parseInt(yearMatch[0], 10);
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1900 && num <= 2100) return num;
  return null;
}

/**
 * Найти последнюю заполненную колонку
 */
function findLastFilledColumn(row) {
  for (let i = row.length - 1; i >= 0; i--) {
    if (row[i] && String(row[i]).trim()) {
      return i;
    }
  }
  return row.length - 1;
}

/**
 * Получить активные месяцы для Retention
 */
function getActiveMonthsForRetention() {
  return getActiveMonthsForSource('retention');
}

/**
 * Алиас для обратной совместимости
 */
function getActiveMonthsDetailed() {
  return getActiveMonthsForRetention();
}

/** 
 * Получить активные периоды для Support 
 * v2.2: Читает формат листа 🎧SUPPORT с флагами hasKPI и hasTags
 * ВАЖНО: Эта функция должна вызывать версию из DataReader_Support_Config.js
 */
function getActivePeriodsForSupport() {
  // Если есть функция из DataReader_Support_Config.js — используем её
  if (typeof getActivePeriodsForSupportFromConfig === 'function') {
    return getActivePeriodsForSupportFromConfig();
  }
  
  // Fallback — читаем напрямую
  var periods = [];
  
  try {
    var ss = getSettingsSpreadsheet();
    
    // Ищем лист Support
    var sheet = ss.getSheetByName(SHEETS.SUPPORT);
    if (!sheet) sheet = ss.getSheetByName('🎧SUPPORT');
    if (!sheet) sheet = ss.getSheetByName('🎧 SUPPORT');
    if (!sheet) sheet = ss.getSheetByName('SUPPORT');
    if (!sheet) {
      var allSheets = ss.getSheets();
      for (var si = 0; si < allSheets.length; si++) {
        var name = allSheets[si].getName().toLowerCase();
        if (name.indexOf('support') !== -1 && name.indexOf('источник') === -1) {
          sheet = allSheets[si];
          break;
        }
      }
    }
    
    if (!sheet) {
      Logger.log('[getActivePeriodsForSupport] Support sheet not found');
      return periods;
    }
    
    Logger.log('[getActivePeriodsForSupport] Found sheet: "' + sheet.getName() + '"');
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) {
      Logger.log('[getActivePeriodsForSupport] No data rows');
      return periods;
    }
    
    // Читаем данные начиная со строки 3 (строки 1-2 = заголовки)
    var data = sheet.getRange(3, 1, lastRow - 2, 7).getValues();
    
    var monthNameToNum = {
      'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4,
      'май': 5, 'июнь': 6, 'июль': 7, 'август': 8,
      'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12,
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var monthName = String(row[0] || '').trim();
      var yearRaw = row[1];
      var keyOrDate = row[2];
      
      // ═══ КОЛОНКИ D (index 3) и E (index 4) — флаги KPI и Tags ═══
      var rawKPI = row[3];
      var rawTags = row[4];
      var kpiSheetName = String(row[5] || '').trim();
      var tagsSheetName = String(row[6] || '').trim();
      
      // Парсинг флагов (поддержка: true, 'TRUE', 'true', 1)
      var kpiEnabled = (rawKPI === true) || 
                       (String(rawKPI).toUpperCase() === 'TRUE') ||
                       (rawKPI === 1);
      
      var tagsEnabled = (rawTags === true) || 
                        (String(rawTags).toUpperCase() === 'TRUE') ||
                        (rawTags === 1);
      
      // Пропускаем если месяц не указан или оба источника отключены
      if (!monthName || (!kpiEnabled && !tagsEnabled)) {
        continue;
      }
      
      // Определяем год
      var year;
      if (yearRaw instanceof Date) {
        year = yearRaw.getFullYear();
      } else {
        year = parseInt(yearRaw, 10);
      }
      
      if (!year || isNaN(year)) {
        Logger.log('[getActivePeriodsForSupport] Invalid year at row ' + (i + 3));
        continue;
      }
      
      // Определяем номер месяца
      var monthNum = monthNameToNum[monthName.toLowerCase()];
      if (!monthNum) {
        Logger.log('[getActivePeriodsForSupport] Unknown month: "' + monthName + '"');
        continue;
      }
      
      // Формируем ключ
      var key;
      if (keyOrDate instanceof Date) {
        key = keyOrDate.getFullYear() + '-' + String(keyOrDate.getMonth() + 1).padStart(2, '0');
      } else if (keyOrDate) {
        var keyStr = String(keyOrDate);
        var match = keyStr.match(/(\d{4})-(\d{2})/);
        if (match) {
          key = match[1] + '-' + match[2];
        } else {
          key = year + '-' + String(monthNum).padStart(2, '0');
        }
      } else {
        key = year + '-' + String(monthNum).padStart(2, '0');
      }
      
      var period = {
        label: monthName + ' ' + year,
        key: key,
        monthName: monthName,
        year: year,
        monthNum: monthNum,
        roleSheets: {
          livechat: kpiSheetName || null,
          tags: tagsSheetName || null,
          helpdesk: null
        },
        enabled: {
          kpi: kpiEnabled,
          tags: tagsEnabled
        },
        // ═══ ВАЖНО: эти флаги должны дойти до клиента! ═══
        hasKPI: kpiEnabled,
        hasTags: tagsEnabled
      };
      
      periods.push(period);
      Logger.log('[getActivePeriodsForSupport] Added: ' + period.label + 
                 ' (key=' + period.key + ', hasKPI=' + period.hasKPI + ', hasTags=' + period.hasTags + ')');
    }
    
    // Сортируем по дате (старые первые)
    periods.sort(function(a, b) {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
    
    Logger.log('[getActivePeriodsForSupport] Total periods: ' + periods.length);
    
  } catch (e) {
    Logger.log('[getActivePeriodsForSupport] Error: ' + e.message);
    Logger.log(e.stack);
  }
  
  return periods;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    СОЗДАНИЕ/ОБНОВЛЕНИЕ SETTINGS                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Создать или обновить мастер-таблицу Settings v3.0
 */
function createOrUpdateSettingsSheet(targetSpreadsheet) {
  const ss = targetSpreadsheet || getSettingsSpreadsheet();

  // 1. Создаем/обновляем лист ИСТОЧНИКИ ДАННЫХ
  let sourcesSheet = ss.getSheetByName(SHEETS.SOURCES);
  if (!sourcesSheet) sourcesSheet = ss.insertSheet(SHEETS.SOURCES);
  setupSourcesSheet(sourcesSheet);

  // 2. Лист RETENTION теперь опционален:
  // если уже существует — обновляем; если нет — не создаем принудительно.
  let retentionSheet = ss.getSheetByName(SHEETS.RETENTION);
  if (retentionSheet) {
    setupPeriodSheet(retentionSheet, 'Retention');
  }

  // 3. Создаем/обновляем лист SUPPORT
  let supportSheet = ss.getSheetByName(SHEETS.SUPPORT);
  if (!supportSheet) supportSheet = ss.insertSheet(SHEETS.SUPPORT);
  setupPeriodSheet(supportSheet, 'Support');

  // 4. Создаем/обновляем лист НАСТРОЙКИ ПРИЛОЖЕНИЯ
  let appSettingsSheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
  if (!appSettingsSheet) appSettingsSheet = ss.insertSheet(SHEETS.APP_SETTINGS);
  setupAppSettingsSheet(appSettingsSheet);

  // 5. Создаем/обновляем лист FINANCE METRICS (с поддержкой Ret. FINANCE METRICS)
  let financeMetricsSheet = getSettingsSheetByAliases(ss, [
    SHEETS.FINANCE_METRICS,
    'FINANCE METRICS',
    '💰 FINANCE METRICS',
    'Ret. FINANCE METRICS'
  ]);
  if (!financeMetricsSheet) financeMetricsSheet = ss.insertSheet(SHEETS.FINANCE_METRICS);
  setupFinanceMetricsSheet(financeMetricsSheet);

  // 6. Создаем/обновляем лист CHANNEL METRICS (с поддержкой Ret. CHANNEL METRICS)
  let channelMetricsSheet = getSettingsSheetByAliases(ss, [
    SHEETS.CHANNEL_METRICS,
    'CHANNEL METRICS',
    '📣 CHANNEL METRICS',
    'Ret. CHANNEL METRICS'
  ]);
  if (!channelMetricsSheet) channelMetricsSheet = ss.insertSheet(SHEETS.CHANNEL_METRICS);
  setupChannelMetricsSheet(channelMetricsSheet);

  SpreadsheetApp.getUi().alert(
    '✅ Настройки обновлены (v4.0)',
    'Создано/обновлено 5 листов для удобного управления:\n\n' +
    '1. 📊 ИСТОЧНИКИ ДАННЫХ — центральный список таблиц\n' +
    '2. 🎧 SUPPORT — периоды для KPI и чатов\n' +
    '3. ⚙️ APP_SETTINGS — название проекта и логотип\n' +
    '4. 💰 FINANCE METRICS — управление финансовыми метриками\n' +
    '5. 📣 CHANNEL METRICS — управление каналами и метриками\n\n' +
    'Лист 📊 RETENTION теперь опционален для Retention: при его отсутствии периоды берутся из FINANCE/CHANNEL METRICS.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  invalidateMetricsConfigCache();
}

function setupFinanceMetricsSheet(sheet) {
  const isExisting = sheet.getLastRow() >= 2;
  if (isExisting) return;

  function normalizeRowsToWidth(rows, width) {
    return (rows || []).map(function (row) {
      var r = (row || []).slice(0, width);
      while (r.length < width) r.push('');
      return r;
    });
  }

  const currentYear = new Date().getFullYear();
  const year1 = currentYear - 1;
  const year2 = currentYear;

  sheet.clear();
  sheet.setTabColor('#0b3d91');
  sheet.getRange('A:Z').setFontFamily('Inter');

  sheet.getRange(1, 1, 1, 11).setValues([[
    'Метрика',
    'Status',
    'Product Stat - ' + year1, '', '', '', '', '',
    'Status',
    'Product Stat - ' + year2
  ]]).setBackground('#0b3d91').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange(2, 1, 1, 11).setValues([[
    '', '', 'Год', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Год', 'Янв', 'Фев'
  ]]).setBackground('#4f81bd').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');

  const sample = [
    ['ДЕПОЗИТЫ', 'ON', 'ON', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓'],
    ['Тотал к-ство депозитов', 'ON', 'ON', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓'],
    ['Тотал сумма депозитов', 'ON', 'ON', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓'],
    ['СПОРТ', 'OFF', 'OFF', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓']
  ];
  var normalizedSample = normalizeRowsToWidth(sample, 11);
  sheet.getRange(3, 1, normalizedSample.length, 11).setValues(normalizedSample);

  sheet.getRange(3, 1, normalizedSample.length, 1).setFontWeight('bold');
  for (var r = 3; r < 3 + normalizedSample.length; r++) {
    var status1 = String(sheet.getRange(r, 2).getValue() || '').toUpperCase();
    var status2 = String(sheet.getRange(r, 9).getValue() || '').toUpperCase();
    sheet.getRange(r, 2).setBackground(status1 === 'OFF' ? '#c62828' : '#2e7d32').setFontColor('white').setFontWeight('bold');
    sheet.getRange(r, 9).setBackground(status2 === 'OFF' ? '#c62828' : '#2e7d32').setFontColor('white').setFontWeight('bold');
  }

  sheet.setFrozenRows(2);
  sheet.setColumnWidth(1, 280);
  for (var c = 2; c <= 11; c++) sheet.setColumnWidth(c, 85);
}

function setupChannelMetricsSheet(sheet) {
  const isExisting = sheet.getLastRow() >= 2;
  if (isExisting) return;

  function normalizeRowsToWidth(rows, width) {
    return (rows || []).map(function (row) {
      var r = (row || []).slice(0, width);
      while (r.length < width) r.push('');
      return r;
    });
  }

  const currentYear = new Date().getFullYear();
  const year1 = currentYear - 1;
  const year2 = currentYear;

  sheet.clear();
  sheet.setTabColor('#0b3d91');
  sheet.getRange('A:Z').setFontFamily('Inter');

  sheet.getRange(1, 1, 1, 11).setValues([[
    'Канал / Метрика',
    'Status',
    'Комуникации TOTAL ' + year1, '', '', '', '', '',
    'Status',
    'Комуникации TOTAL ' + year2
  ]]).setBackground('#0b3d91').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange(2, 1, 1, 11).setValues([[
    '', '', 'Год', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Год', 'Янв', 'Фев'
  ]]).setBackground('#4f81bd').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');

  const sample = [
    ['E-mail', 'OFF', 'OFF', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓'],
    ['Sent', 'OFF', 'OFF', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓'],
    ['Delivered', 'OFF', 'OFF', '✓', '✓', '✓', '✓', '✓', 'ON', '✓', '✓'],
    ['Push', 'ON', 'ON', '✓', '✓', '✓', '✓', '✓', 'OFF', '✓', '✓']
  ];
  var normalizedSample = normalizeRowsToWidth(sample, 11);
  sheet.getRange(3, 1, normalizedSample.length, 11).setValues(normalizedSample);

  sheet.getRange(3, 1, normalizedSample.length, 1).setFontWeight('bold');
  for (var r = 3; r < 3 + normalizedSample.length; r++) {
    var status1 = String(sheet.getRange(r, 2).getValue() || '').toUpperCase();
    var status2 = String(sheet.getRange(r, 9).getValue() || '').toUpperCase();
    sheet.getRange(r, 2).setBackground(status1 === 'OFF' ? '#c62828' : '#2e7d32').setFontColor('white').setFontWeight('bold');
    sheet.getRange(r, 9).setBackground(status2 === 'OFF' ? '#c62828' : '#2e7d32').setFontColor('white').setFontWeight('bold');
  }

  sheet.setFrozenRows(2);
  sheet.setColumnWidth(1, 280);
  for (var c = 2; c <= 11; c++) sheet.setColumnWidth(c, 85);
}

/**
 * Настройка листа источников
 */
function setupSourcesSheet(sheet) {
  const isExisting = sheet.getLastRow() >= 2;
  if (!isExisting) {
    sheet.clear();
    sheet.setTabColor('#e8eaf6');
    sheet.getRange('A:G').setFontFamily('Inter');

    sheet.getRange('A1:F1').merge().setValue('📊 ИСТОЧНИКИ ДАННЫХ (МАСТЕР-КОНФИГУРАЦИЯ)')
      .setFontWeight('bold').setFontSize(24).setBackground('#1a237e').setFontColor('white')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.setRowHeight(1, 60);

    const headers = ['Источник', 'ID таблицы', 'Листы (через запятую)', 'Иконка', 'Цвет', 'Вкл'];
    const headerRange = sheet.getRange(2, 1, 1, headers.length);
    headerRange.setValues([headers])
      .setFontWeight('bold').setFontSize(18).setBackground('#f5f5f5').setVerticalAlignment('middle');
    sheet.setRowHeight(2, 40);

    const data = [
      ['Retention', DEFAULT_SOURCES.RETENTION.spreadsheetId, DEFAULT_SOURCES.RETENTION.sheets.join(', '), '📊', '#9c27b0', true],
      ['Support', DEFAULT_SOURCES.SUPPORT.spreadsheetId, DEFAULT_SOURCES.SUPPORT.sheets.join(', '), '🎧', '#2196f3', true]
    ];
    sheet.getRange(3, 1, data.length, data[0].length).setValues(data).setFontSize(14).setVerticalAlignment('middle');
    sheet.getRange(3, 6, 20, 1).insertCheckboxes();

    sheet.setFrozenRows(2);
    sheet.getRange('A:F').setWrap(true);
    sheet.setColumnWidth(2, 450);
    sheet.setColumnWidth(3, 250);
  } else {
    Logger.log('[setupSourcesSheet] Sources sheet already exists, skipping heavy recreation');
  }
}

/**
 * Настройка листа периодов (Retention или Support)
 */
function setupPeriodSheet(sheet, type) {
  const isExisting = sheet.getLastRow() >= 2;
  const color = type === 'Retention' ? '#1a237e' : '#2e7d32';
  const prefix = type === 'Retention' ? '📊' : '🎧';

  if (!isExisting) {
    sheet.clear();
    sheet.setFrozenColumns(0);
    sheet.getRange('A:Z').setFontFamily('Inter');
  }

  const allSources = getActiveDataSourcesV3();
  const sources = allSources.filter(s => s.template === type);
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const headers = ['Месяц', 'Год', 'Ключ (YYYY-MM)'];
  const newSourceHeaders = [];

  years.forEach(year => {
    sources.forEach(src => {
      const baseSheets = String(src.sheets || '').split(',').map(s => s.trim()).filter(s => s);
      baseSheets.forEach(baseName => {
        const h = `${src.name} - ${baseName} ${year}`;
        headers.push(h);
        newSourceHeaders.push(h);
      });
    });
  });

  if (!isExisting) {
    const monthsData = [];
    years.forEach(y => {
      MONTH_NAMES_LIST.forEach((m, idx) => {
        const key = `${y}-${String(idx + 1).padStart(2, '0')}`;
        const row = [m, y, key];
        for (let j = 0; j < headers.length - 3; j++) row.push(false);
        monthsData.push(row);
      });
    });

    sheet.getRange(1, 1, 1, headers.length).merge()
      .setValue(`${prefix} ПЕРИОДЫ ДЛЯ ${type.toUpperCase()}`)
      .setFontWeight('bold').setFontSize(24).setBackground(color).setFontColor('white')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.setRowHeight(1, 60);

    sheet.getRange(2, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setFontSize(12).setBackground('#f5f5f5').setVerticalAlignment('middle')
      .setHorizontalAlignment('center')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    sheet.setRowHeight(2, 70);

    sheet.getRange(3, 1, monthsData.length, headers.length).setValues(monthsData).setFontSize(14).setVerticalAlignment('middle');
    if (headers.length > 3) {
      sheet.getRange(3, 4, monthsData.length, headers.length - 3).insertCheckboxes();
    }
  } else {
    // UPDATING: Add missing columns
    const existingHeaders = sheet.getRange(2, 1, 1, Math.max(3, sheet.getLastColumn())).getValues()[0].map(h => String(h).trim());

    newSourceHeaders.forEach(h => {
      if (!existingHeaders.includes(h)) {
        const nextCol = sheet.getLastColumn() + 1;
        sheet.getRange(2, nextCol).setValue(h)
          .setFontWeight('bold').setFontSize(12).setBackground('#f5f5f5').setVerticalAlignment('middle').setHorizontalAlignment('center');
        sheet.getRange(3, nextCol, sheet.getLastRow() - 2, 1).insertCheckboxes();
        sheet.setColumnWidth(nextCol, 150);
      }
    });
  }

  sheet.setFrozenRows(2);
  if (!isExisting) {
    sheet.autoResizeColumns(1, 3);
  }
}

/**
 * Настройка листа настроек приложения (Брендинг)
 */
function setupAppSettingsSheet(sheet) {
  const isExisting = sheet.getLastRow() >= 3;
  if (isExisting) return;

  sheet.clear();
  sheet.setTabColor('#374151');
  sheet.getRange('A:B').setFontFamily('Inter');

  sheet.getRange('A1:B1').merge().setValue('⚙️ НАСТРОЙКИ ПРИЛОЖЕНИЯ')
    .setFontWeight('bold').setFontSize(24).setBackground('#374151').setFontColor('white')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 60);

  const headers = ['Настройка', 'Значение'];
  sheet.getRange(2, 1, 1, 2).setValues([headers])
    .setFontWeight('bold').setFontSize(16).setBackground('#f3f4f6');
  sheet.setRowHeight(2, 40);

  const data = [
    ['Название проекта (Project Name)', 'Analytics'],
    ['Иконка (Emoji Icon)', '🎰'],
    ['URL Логотипа (Image URL)', ''],
    ['site_url', 'https://ваш-проект.vercel.app'],
    ['--- НАЗВАНИЯ ТАБОВ (TABS) ---', ''],
    ['Tab: Support Stats', '📊 Статистика LiveChat'],
    ['Tab: Support Tags', '🏷️ Теги обращений'],
    ['Tab: Retention Finance', '💰 Финансовый дашборд'],
    ['Tab: Retention Channels', '📈 Каналы маркетинга'],
    ['', ''],
    ['--- БАЗОВЫЕ МЕСЯЦЫ (BASE MONTHS) ---', ''],
    ['base_month_finance', '2025-11'],
    ['base_month_channels', '2025-11'],
    ['', ''],
    ['--- SUPPORT ---', ''],
    ['auto_calc_allgeo', 'ON']
  ];

  sheet.getRange(3, 1, data.length, 2).setValues(data).setFontSize(14).setVerticalAlignment('middle');
  sheet.setColumnWidth(1, 350);
  sheet.setColumnWidth(2, 450);
  sheet.setFrozenRows(2);
}

/**
 * Получить список имен листов в таблице
 */
function getSourceSheetNames(id) {
  try {
    const ss = SpreadsheetApp.openById(id);
    return ss.getSheets().map(s => s.getName());
  } catch (e) {
    Logger.log('Error getting sheet names for ' + id + ': ' + e.message);
    return [];
  }
}

/**
 * Добавить новый источник данных
 */
function addNewDataSource(name, spreadsheetId, sheets, icon, color, template) {
  const ss = getSettingsSpreadsheet();
  const sourcesSheet = ss.getSheetByName(SHEETS.SOURCES);

  if (!sourcesSheet) {
    createOrUpdateSettingsSheet(ss);
    return addNewDataSource(name, spreadsheetId, sheets, icon, color, template);
  }

  const lastRow = sourcesSheet.getLastRow();
  const newData = [name, spreadsheetId, sheets.join(', '), icon || '📊', color || '#607d8b', true];
  sourcesSheet.getRange(lastRow + 1, 1, 1, newData.length).setValues([newData]).setFontSize(14).setFontFamily('Inter').setVerticalAlignment('middle');
  sourcesSheet.getRange(lastRow + 1, 6).insertCheckboxes();

  const periodSheetName = (template && template.toLowerCase() === 'support') ? SHEETS.SUPPORT : SHEETS.RETENTION;
  const periodSheet = ss.getSheetByName(periodSheetName);

  if (periodSheet) {
    const lastCol = periodSheet.getLastColumn();
    const newCol = lastCol + 1;
    periodSheet.getRange(2, newCol).setValue(name)
      .setFontWeight('bold').setFontSize(18).setBackground('#f5f5f5').setFontFamily('Inter').setVerticalAlignment('middle');

    const totalRows = periodSheet.getLastRow();
    if (totalRows >= 3) {
      periodSheet.getRange(3, newCol, totalRows - 2, 1).insertCheckboxes().setFontSize(14).setFontFamily('Inter').setVerticalAlignment('middle');
    }
    periodSheet.autoResizeColumn(newCol);
  }

  return { name: name, key: name.toLowerCase().replace(/\s+/g, '_'), spreadsheetId: spreadsheetId };
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    УПРАВЛЕНИЕ МАСТЕР-ТАБЛИЦЕЙ                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Переключиться на мастер-таблицу Settings
 */
function switchToMasterSettings(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(SHEETS.SETTINGS);
    if (!sheet) return { success: false, message: 'Settings sheet not found' };
    setMasterSettingsSpreadsheetId(spreadsheetId);
    return { success: true, message: 'Master Settings configured successfully!' };
  } catch (e) {
    return { success: false, message: 'Cannot access spreadsheet: ' + e.message };
  }
}

/**
 * Сбросить к дефолтной мастер-таблице Settings
 */
function resetToDefaultMasterSettings() {
  try {
    setMasterSettingsSpreadsheetId(null);
    return { success: true, message: 'Reset to default master Settings.' };
  } catch (e) {
    return { success: false, message: 'Error resetting to default: ' + e.message };
  }
}

function disableMasterSettings() { return resetToDefaultMasterSettings(); }

function getFinanceTabLabelsFromSheet_() {
  var res = {};
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('Ret. FINANCE METRICS');
    if (!sheet) return res;

    var data = sheet.getDataRange().getDisplayValues();
    for (var r = 0; r < data.length; r++) {
      var name = String((data[r] && data[r][0]) || '').trim();
      if (!name) continue;

      // Метки секций определяем через существующую функцию
      var key = getFinanceSectionKey(name); // deposits/sport/casino/profit/structure
      if (!key) continue;

      if (!res[key]) res[key] = name; // берём как в листе (например "Профит и Бонусы")
    }
  } catch (e) {
    Logger.log('[getFinanceTabLabelsFromSheet_] ERROR: ' + e);
  }
  return res;
}

function getChannelTabLabelsFromSheet_() {
  var res = {};
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('Ret. CHANNEL METRICS');
    if (!sheet) return res;

    var data = sheet.getDataRange().getDisplayValues();
    for (var r = 0; r < data.length; r++) {
      var nameA = String((data[r] && data[r][0]) || '').trim();
      if (!nameA) continue;

      // ВАЖНО: normalizeChannelKeyForConfig уже есть в MetricsConfigManager_Channels.js
      var key = normalizeChannelKeyForConfig(nameA);
      if (!key) continue;

      if (!res[key]) res[key] = nameA; // берём как в листе (например "App Push")
    }
  } catch (e) {
    Logger.log('[getChannelTabLabelsFromSheet_] ERROR: ' + e);
  }
  return res;
}
