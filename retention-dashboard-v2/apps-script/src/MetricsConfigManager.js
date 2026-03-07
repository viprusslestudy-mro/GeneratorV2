/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MetricsConfigManager.js v4.0 - SHARED ядро конфига метрик
 *
 *  Парсеры, загрузчик, year-блоки, кэш.
 *  Finance-логика → MetricsConfigManager_Finance.js
 *  Channel-логика → MetricsConfigManager_Channels.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Runtime-cache только на время одного выполнения скрипта
var __metricsConfigRuntimeCache = null;

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ПАРСЕРЫ ЗНАЧЕНИЙ                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function parseMetricsBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  var s = String(value || '').trim().toLowerCase();
  return ['y', 'yes', 'да', 'true', '1', 'on', 'вкл'].indexOf(s) !== -1;
}

function parseOnOff(value, defaultValue) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return defaultValue;
  }
  var s = String(value).trim().toLowerCase();
  if (['on', 'true', '1', 'yes', 'да', 'вкл', '✓', '✔', '✅', 'y', 'x'].indexOf(s) !== -1) return true;
  if (['off', 'false', '0', 'no', 'нет', 'выкл', 'n', '—', '-'].indexOf(s) !== -1) return false;
  return defaultValue;
}

function parseMonthFlag(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === 'number') return value !== 0;
  var s = String(value || '').trim().toLowerCase();
  if (!s) return false;
  return ['✓', '✔', '✅', 'true', '1', 'on', 'yes', 'да', 'y', 'x'].indexOf(s) !== -1;
}

function parseMonthFlagWithDefault(value, defaultValue) {
  if (value === null || value === undefined) return defaultValue;
  var s = String(value).trim();
  if (!s) return defaultValue;
  return parseMonthFlag(value);
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    УТИЛИТЫ ИЗВЛЕЧЕНИЯ / НОРМАЛИЗАЦИИ                      ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function extractYearFromAny(text) {
  var m = String(text || '').match(/\b(19|20)\d{2}\b/);
  return m ? String(m[0]) : '';
}

function extractYearFromSheetName(name) {
  return extractYearFromAny(name);
}

function monthHeaderToNumber(header) {
  var h = String(header || '').trim().toLowerCase();
  if (!h) return null;

  var map = {
    'янв': 1, 'январ': 1, 'jan': 1,
    'фев': 2, 'феврал': 2, 'feb': 2,
    'мар': 3, 'март': 3, 'mar': 3,
    'апр': 4, 'апрел': 4, 'apr': 4,
    'май': 5, 'мая': 5, 'may': 5,
    'июн': 6, 'июнь': 6, 'jun': 6,
    'июл': 7, 'июль': 7, 'jul': 7,
    'авг': 8, 'август': 8, 'aug': 8,
    'сен': 9, 'сент': 9, 'sep': 9,
    'окт': 10, 'октя': 10, 'oct': 10,
    'ноя': 11, 'нояб': 11, 'nov': 11,
    'дек': 12, 'дека': 12, 'dec': 12
  };

  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) {
    if (h.indexOf(keys[i]) === 0) return map[keys[i]];
  }
  return null;
}

function normalizeMetricKey(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isEnableSheetRowName(name) {
  var n = String(name || '').trim().toLowerCase();
  if (!n) return false;
  return n === 'включить лист' || n === 'enable sheet' || n === 'sheet enabled';
}

function normalizeSettingsSheetNameForLookup(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[📊💰📣🎧⚙️]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSheetByAliases(ss, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var exact = ss.getSheetByName(aliases[i]);
    if (exact) return exact;
  }

  var wanted = aliases.map(normalizeSettingsSheetNameForLookup);
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var current = normalizeSettingsSheetNameForLookup(sheets[s].getName());
    for (var j = 0; j < wanted.length; j++) {
      if (current === wanted[j]) return sheets[s];
    }
  }

  return null;
}

/**
 * Нормализация имени для сравнения (убираем дефисы, лишние пробелы)
 */
function normalizeSheetNameForCompare(name) {
  return String(name || '')
    .replace(/📋/g, '')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[её]/gi, 'e')
    .replace(/комуникаци[ияй]/gi, 'komunikaci')
    .trim()
    .toLowerCase();
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    YEAR-БЛОКИ (SHARED)                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function detectYearBlocks(headerTop, headerBottom) {
  var blocks = [];
  for (var c = 0; c < headerTop.length; c++) {
    var year = extractYearFromAny(headerTop[c]);
    if (!year) continue;

    var nextStart = headerTop.length;
    for (var n = c + 1; n < headerTop.length; n++) {
      if (extractYearFromAny(headerTop[n])) {
        nextStart = n;
        break;
      }
    }

    var monthCols = [];
    var yearCol = null;
    for (var j = c; j < nextStart; j++) {
      var sub = String(headerBottom[j] || '').trim();
      if (!sub) continue;
      if (sub.toLowerCase().indexOf('год') === 0 || sub.toLowerCase() === 'year') {
        yearCol = j;
        continue;
      }
      var mNum = monthHeaderToNumber(sub);
      if (mNum) {
        monthCols.push({
          col: j,
          periodKey: year + '-' + String(mNum).padStart(2, '0')
        });
      }
    }

    blocks.push({
      year: year,
      groupStartCol: c,
      statusCol: c - 1,
      yearCol: yearCol,
      monthCols: monthCols
    });

    c = nextStart - 1;
  }
  return blocks;
}

function getYearBlockFlag(row, block, defaultValue) {
  // 1) Пробуем явную колонку "Год"
  var directVal = (block && block.yearCol != null) ? row[block.yearCol] : '';
  var hasDirect = !(directVal === '' || directVal === null || directVal === undefined);
  if (hasDirect) return parseOnOff(directVal, defaultValue);

  // 2) ★ ИСПРАВЛЕНО: Если нет "Год", используем statusCol (колонка Status перед блоком)
  //    Это правильно для блоков без отдельной колонки "Год"
  if (block && block.statusCol != null) {
    var statusVal = row[block.statusCol];
    if (statusVal !== '' && statusVal !== null && statusVal !== undefined) {
      return parseOnOff(statusVal, defaultValue);
    }
  }

  // 3) Fallback: если нет ни "Год", ни "Status" — возвращаем defaultValue (безопасно)
  return defaultValue;
}

function resolveYearBlocksFromSheetData(data) {
  var result = {
    blocks: [],
    headerTopRowIndex: 0,
    headerBottomRowIndex: 1,
    dataStartRowIndex: 2
  };

  if (!data || !data.length) return result;

  var topIdx = 0;
  for (var r = 0; r < Math.min(data.length, 5); r++) {
    var row = data[r] || [];
    var hasYear = row.some(function (cell) { return !!extractYearFromAny(cell); });
    if (hasYear) {
      topIdx = r;
      break;
    }
  }

  var bestBottomIdx = Math.min(topIdx + 1, Math.max(0, data.length - 1));
  var bestScore = -1;
  var maxProbe = Math.min(data.length - 1, topIdx + 5);

  for (var b = topIdx + 1; b <= maxProbe; b++) {
    var br = data[b] || [];
    var score = 0;
    for (var c = 0; c < br.length; c++) {
      var sub = String(br[c] || '').trim().toLowerCase();
      if (!sub) continue;
      if (sub.indexOf('год') === 0 || sub === 'year') {
        score += 2;
        continue;
      }
      if (monthHeaderToNumber(sub)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestBottomIdx = b;
    }
  }

  var blocks = detectYearBlocks(data[topIdx] || [], data[bestBottomIdx] || []);
  result.blocks = blocks;
  result.headerTopRowIndex = topIdx;
  result.headerBottomRowIndex = bestBottomIdx;
  result.dataStartRowIndex = bestBottomIdx + 1;
  return result;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ЗАГРУЗЧИК КОНФИГА (ОРКЕСТРАТОР)                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Загрузить конфиг метрик из листов Settings
 * Вызывает парсеры из MetricsConfigManager_Finance.js и MetricsConfigManager_Channels.js
 */
function loadMetricsConfig() {
  if (__metricsConfigRuntimeCache) {
    return __metricsConfigRuntimeCache;
  }

  var config = {
    sheets: {},
    finance: {},
    channels: {},
    financeByYear: {},
    channelByYear: {}
  };

  try {
    var ss = getSettingsSpreadsheet();

    // Finance — из MetricsConfigManager_Finance.js
    var financeSheet = getFinanceMetricsSheet(ss);
    var financeParsed = parseFinanceMetricsSheetConfig(financeSheet);

    // Channels — из MetricsConfigManager_Channels.js
    var channelSheet = getChannelMetricsSheet(ss);
    var channelsParsed = parseChannelMetricsSheetConfig(channelSheet);

    config.financeByYear = financeParsed.byYear || {};
    config.channelByYear = channelsParsed.byYear || {};

    // Плоский фолбэк для старых вызовов
    Object.keys(config.financeByYear).forEach(function (year) {
      var yearCfg = config.financeByYear[year] || {};
      Object.keys(yearCfg).forEach(function (metricNorm) {
        var m = yearCfg[metricNorm];
        if (!config.finance[m.name]) config.finance[m.name] = { show: false };
        config.finance[m.name].show = config.finance[m.name].show || !!m.enabled;
      });
    });

    // Совместимость для каналов: собираем per-sheet по годам
    Object.keys(config.channelByYear).forEach(function (year) {
      var sheetName = 'Комуникации TOTAL ' + year;
      if (!config.channels[sheetName]) config.channels[sheetName] = {};
      var yearCfg = config.channelByYear[year] || {};
      Object.keys(yearCfg).forEach(function (channelKey) {
        if (!config.channels[sheetName][channelKey]) config.channels[sheetName][channelKey] = {};
        var metricMap = yearCfg[channelKey] || {};
        Object.keys(metricMap).forEach(function (metricNorm) {
          var metricCfg = metricMap[metricNorm];
          config.channels[sheetName][channelKey][metricCfg.name] = { show: !!metricCfg.enabled };
        });
      });
    });

  } catch (e) {
    Logger.log('[loadMetricsConfig] Error: ' + e.message);
  }

  Logger.log('[loadMetricsConfig] Channels config keys: ' + Object.keys(config.channels).join(', '));

  if (config.channels['Комуникации TOTAL 2025'] && config.channels['Комуникации TOTAL 2025']['mail']) {
    Logger.log('[loadMetricsConfig] Mail 2025 config: ' + JSON.stringify(config.channels['Комуникации TOTAL 2025']['mail']));
  }

  __metricsConfigRuntimeCache = config;
  return config;
}

function invalidateMetricsConfigCache() {
  try {
    CacheService.getScriptCache().remove('METRICS_CONFIG_V3');
    Logger.log('[invalidateMetricsConfigCache] Cache cleared');
  } catch (e) { }
  __metricsConfigRuntimeCache = null;
}

/**
 * Проверить, включен ли лист (для Retention всегда true)
 */
function isSheetEnabled(sheetName) {
  return true;
}