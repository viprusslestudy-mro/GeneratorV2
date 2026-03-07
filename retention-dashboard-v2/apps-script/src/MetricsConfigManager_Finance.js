/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MetricsConfigManager_Finance.js - Конфиг финансовых метрик
 *  Tab: Ret. FINANCE METRICS
 *
 *  Парсинг листа FINANCE METRICS + API проверок isFinanceMetric*()
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Кэш динамических секций (заполняется при первом вызове _getDynamicFinanceSections)
var __dynamicFinanceSectionKeys = {};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ПОИСК ЛИСТА                                            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function getFinanceMetricsSheet(ss) {
  return getSheetByAliases(ss, [
    SHEETS.FINANCE_METRICS,
    'FINANCE METRICS',
    '💰 FINANCE METRICS',
    'Ret. FINANCE METRICS'
  ]);
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    НОРМАЛИЗАЦИЯ                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function getFinanceSectionKey(name) {
  var n = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!n) return '';

  // ═══ ТОЧНЫЕ совпадения ТОЛЬКО ═══
  var mapExact = {
    'депозиты': 'deposits',
    'deposits': 'deposits',
    'профит': 'profit',
    'профит и бонусы': 'profit',
    'профит & бонусы': 'profit',
    'profit': 'profit',
    'бонусы': 'bonuses',
    'bonuses': 'bonuses',
    'ftd и редепы': 'ftd_redep',
    'фтд и редепы': 'ftd_redep',
    'структура ставок': 'structure',
    'структура': 'structure',
    'structure': 'structure',
    'спорт': 'sport',
    'sport': 'sport',
    'казино': 'casino',
    'casino': 'casino'
  };

  if (mapExact[n]) return mapExact[n];

  // ═══ ДИНАМИЧЕСКИЕ СЕКЦИИ (из кэша) ═══
  if (typeof __dynamicFinanceSectionKeys !== 'undefined' && __dynamicFinanceSectionKeys[n]) {
    return __dynamicFinanceSectionKeys[n];
  }

  // ═══ Авто-определение из листа (один раз) ═══
  var autoKey = _tryResolveDynamicSectionKey(n);
  if (autoKey) return autoKey;

  return '';
}

/**
 * Попытка определить динамическую секцию из листа Ret. FINANCE METRICS
 * Вызывается из getFinanceSectionKey() когда кэш пуст
 * Заполняет __dynamicFinanceSectionKeys для последующих вызовов
 * 
 * @param {string} normalizedName - нормализованное имя (lowercase, trimmed)
 * @returns {string} ключ секции или ''
 */
var __dynamicSectionResolveAttempted = false;

function _tryResolveDynamicSectionKey(normalizedName) {
  if (__dynamicSectionResolveAttempted) {
    return (typeof __dynamicFinanceSectionKeys !== 'undefined' && __dynamicFinanceSectionKeys[normalizedName]) || '';
  }
  __dynamicSectionResolveAttempted = true;

  try {
    var ss = getSettingsSpreadsheet();
    var sheet = getFinanceMetricsSheet(ss);
    if (!sheet) return '';

    var data = sheet.getDataRange().getDisplayValues();
    if (!data || data.length < 3) return '';

    var systemNames = ['включить лист', 'включить месяц', 'период', 'метрика', 'enable sheet'];

    for (var r = 0; r < data.length; r++) {
      var cellName = String((data[r] && data[r][0]) || '').trim();
      if (!cellName) continue;

      var cellNorm = cellName.toLowerCase().replace(/\s+/g, ' ');

      var isSystem = false;
      for (var s = 0; s < systemNames.length; s++) {
        if (cellNorm === systemNames[s]) { isSystem = true; break; }
      }
      if (isSystem) continue;
      if (isEnableSheetRowName(cellName)) continue;

      // Пропускаем уже известные секции
      var knownKey = _getKnownSectionKeyDirect(cellNorm);
      if (knownKey) continue;

      // ═══ ПРОВЕРЯЕМ ON/OFF ПАТТЕРН (без галочек) ═══
      var row = data[r] || [];
      var hasOnOff = false;
      var allOnOff = true;
      var hasCheckmark = false;

      for (var c = 1; c < Math.min(row.length, 15); c++) {
        var v = String(row[c] || '').trim().toUpperCase();
        if (!v) continue;
        if (v === 'ON' || v === 'OFF') { hasOnOff = true; }
        else if (v === '✓' || v === '✗' || v === 'TRUE' || v === 'FALSE') { hasCheckmark = true; allOnOff = false; }
        else { allOnOff = false; }
      }

      if (hasOnOff && allOnOff && !hasCheckmark) {
        var autoKey = cellNorm.replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_|_$/g, '');
        if (typeof __dynamicFinanceSectionKeys === 'undefined') {
          __dynamicFinanceSectionKeys = {};
        }
        __dynamicFinanceSectionKeys[cellNorm] = autoKey;
        Logger.log('[_tryResolveDynamicSectionKey] Found dynamic section: "' + cellName + '" → ' + autoKey);
      }
    }
  } catch (e) {
    Logger.log('[_tryResolveDynamicSectionKey] Error: ' + e.message);
  }

  return (typeof __dynamicFinanceSectionKeys !== 'undefined' && __dynamicFinanceSectionKeys[normalizedName]) || '';
}

/**
 * Проверить известные (hardcoded) секции БЕЗ вызова getFinanceSectionKey
 * (чтобы избежать рекурсии)
 */
function _getKnownSectionKeyDirect(n) {
  var mapExact = {
    'депозиты': 'deposits',
    'deposits': 'deposits',
    'профит': 'profit',
    'профит и бонусы': 'profit',
    'профит & бонусы': 'profit',
    'profit': 'profit',
    'бонусы': 'bonuses',
    'bonuses': 'bonuses',
    'ftd и редепы': 'ftd_redep',
    'фтд и редепы': 'ftd_redep',
    'структура ставок': 'structure',
    'структура': 'structure',
    'structure': 'structure',
    'спорт': 'sport',
    'sport': 'sport',
    'казино': 'casino',
    'casino': 'casino'
  };
  return mapExact[n] || '';
}

/**
 * Нормализация названий finance-метрик для устойчивого сравнения
 */
function normalizeFinanceMetricNameForCompare(name) {
  // ✅ убираем числовой суффикс в конце: "Тотал к-ство депозитов1" → "Тотал к-ство депозитов"
  var base = String(name || '').replace(/\d+$/g, '').trim();

  return base
    .replace(/\u00A0/g, ' ')
    .replace(/[её]/gi, 'е')
    .replace(/[«»"'`]/g, '')
    .replace(/%/g, ' percent ')
    .replace(/[.,:;]+/g, ' ')
    .replace(/спорт|sport/gi, ' sport ')
    .replace(/казино|casino/gi, ' casino ')
    .replace(/профит|profit/gi, ' profit ')
    .replace(/тотал|total/gi, ' total ')
    .replace(/ср\.?|avg/gi, ' avg ')
    .replace(/день|day/gi, ' day ')
    .replace(/сумма|amount|sum/gi, ' amount ')
    .replace(/ставоч\w*|bettors?/gi, ' bettors ')
    .replace(/став\w*|stake/gi, ' stake ')
    .replace(/bet\s*profit/gi, ' betprofit ')
    .replace(/кол\s*-\s*во/gi, ' qty ')
    .replace(/к\s*-\s*во/gi, ' qty ')
    .replace(/к\s*-\s*ство/gi, ' qty ')
    .replace(/количество/gi, ' qty ')
    .replace(/\s+/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
    .toLowerCase();
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ПАРСИНГ ЛИСТА FINANCE METRICS                          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function parseFinanceMetricsSheetConfig(sheet) {
  var result = { byYear: {}, sheetByYear: {} };
  if (!sheet) return result;

  var data = sheet.getDataRange().getDisplayValues();
  if (!data || data.length < 3) return result;

  var resolved = resolveYearBlocksFromSheetData(data);
  var blocks = resolved.blocks || [];
  var dataStart = resolved.dataStartRowIndex;
  if (!blocks.length) return result;

  // Уровень 1: "Включить лист" (sheet-level toggle)
  for (var sr = 0; sr < data.length; sr++) {
    var sheetRow = data[sr] || [];
    var sheetRowName = String(sheetRow[0] || '').trim();
    if (!isEnableSheetRowName(sheetRowName)) continue;

    blocks.forEach(function (b) {
      var yearStatus = parseOnOff(sheetRow[b.statusCol], true);
      var yearFlag = getYearBlockFlag(sheetRow, b, true);
      var enabledForYear = !!(yearStatus && yearFlag);

      var monthMap = {};
      b.monthCols.forEach(function (m) {
        monthMap[m.periodKey] = enabledForYear && parseMonthFlagWithDefault(sheetRow[m.col], true);
      });

      result.sheetByYear[b.year] = {
        enabled: enabledForYear,
        months: monthMap
      };
    });

    break;
  }

  for (var r = dataStart; r < data.length; r++) {
    var row = data[r] || [];
    var metricName = String(row[0] || '').trim();
    if (!metricName) continue;
    if (isEnableSheetRowName(metricName)) continue;

    var sectionKey = getFinanceSectionKey(metricName);
    if (sectionKey) continue;

    var hasSignalsAnyYear = blocks.some(function (b) {
      if (row[b.statusCol] !== '' && row[b.statusCol] !== undefined) return true;
      if (b.yearCol != null && row[b.yearCol] !== '' && row[b.yearCol] !== undefined) return true;
      if (b.groupStartCol != null && row[b.groupStartCol] !== '' && row[b.groupStartCol] !== undefined) return true;
      return b.monthCols.some(function (m) { return row[m.col] !== '' && row[m.col] !== undefined; });
    });

    if (!hasSignalsAnyYear) continue;

    blocks.forEach(function (b) {
      var sheetState = result.sheetByYear[b.year] || { enabled: true, months: {} };
      var yearStatus = parseOnOff(row[b.statusCol], true);
      var yearFlag = getYearBlockFlag(row, b, true);
      var enabledForYear = !!(sheetState.enabled && yearStatus && yearFlag);

      if (!result.byYear[b.year]) result.byYear[b.year] = {};

      var key = normalizeFinanceMetricNameForCompare(metricName);
      if (!result.byYear[b.year][key]) {
        result.byYear[b.year][key] = {
          name: metricName,
          enabled: enabledForYear,
          months: {}
        };
      } else {
        result.byYear[b.year][key].enabled = result.byYear[b.year][key].enabled && enabledForYear;
      }

      b.monthCols.forEach(function (m) {
        var sheetMonthEnabled = sheetState.months[m.periodKey];
        if (sheetMonthEnabled === undefined) sheetMonthEnabled = true;
        var monthEnabled = enabledForYear && sheetMonthEnabled && parseMonthFlag(row[m.col]);
        result.byYear[b.year][key].months[m.periodKey] = monthEnabled;
      });
    });
  }

  return result;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    API ПРОВЕРОК FINANCE                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function isFinanceMetricEnabledForPeriod(metricRowName, periodKey, sheetName) {
  var config = loadMetricsConfig();
  var year = extractYearFromSheetName(sheetName || periodKey || '');
  if (!year || !config.financeByYear || !config.financeByYear[year]) {
    return isFinanceMetricEnabled(metricRowName);
  }

  var yearCfg = config.financeByYear[year];
  var norm = normalizeFinanceMetricNameForCompare(metricRowName);
  var metric = yearCfg[norm];
  if (!metric) return true;
  if (!metric.enabled) return false;
  if (!periodKey) return true;
  if (!metric.months || metric.months[periodKey] === undefined) return true;
  return metric.months[periodKey] === true;
}

/**
 * Проверить, включена ли финансовая метрика (глобально)
 */
function isFinanceMetricEnabled(metricRowName) {
  var config = loadMetricsConfig();
  var keys = Object.keys(config.finance || {});
  if (keys.length === 0) return true;

  var normalizedTarget = normalizeFinanceMetricNameForCompare(metricRowName);
  var hasAnyNormalizedMatch = false;
  var hasNormalizedFalse = false;
  var hasNormalizedTrue = false;
  var isSportTarget = normalizedTarget.indexOf('sport') !== -1;

  for (var i = 0; i < keys.length; i++) {
    var cfgKey = keys[i];
    if (normalizeFinanceMetricNameForCompare(cfgKey) === normalizedTarget) {
      hasAnyNormalizedMatch = true;
      var cfgEnabled = config.finance[cfgKey] && config.finance[cfgKey].show !== false;
      if (cfgEnabled) {
        hasNormalizedTrue = true;
      } else {
        hasNormalizedFalse = true;
      }
    }
  }

  if (hasNormalizedFalse) {
    if (isSportTarget) {
      Logger.log('[isFinanceMetricEnabled][SPORT] DISABLED by normalized FALSE match: ' +
        JSON.stringify({ metricRowName: metricRowName, normalizedTarget: normalizedTarget }));
    }
    return false;
  }

  if (config.finance[metricRowName] !== undefined) {
    var directEnabled = config.finance[metricRowName].show !== false;
    if (isSportTarget) {
      Logger.log('[isFinanceMetricEnabled][SPORT] DIRECT match: ' +
        JSON.stringify({ metricRowName: metricRowName, directEnabled: directEnabled }));
    }
    return directEnabled;
  }

  if (hasAnyNormalizedMatch && hasNormalizedTrue) {
    if (isSportTarget) {
      Logger.log('[isFinanceMetricEnabled][SPORT] ENABLED by normalized TRUE match: ' +
        JSON.stringify({ metricRowName: metricRowName, normalizedTarget: normalizedTarget }));
    }
    return true;
  }

  // Sport-stake group fallback
  var isTargetSportStake = normalizedTarget.indexOf('sport') !== -1 &&
    normalizedTarget.indexOf('percent') === -1 &&
    (
      normalizedTarget.indexOf('stake') !== -1 ||
      normalizedTarget.indexOf('betprofit') !== -1 ||
      normalizedTarget.indexOf('bettors') !== -1
    );

  if (isTargetSportStake) {
    var sportStakeRows = keys.filter(function(k) {
      var nk = normalizeFinanceMetricNameForCompare(k);
      return nk.indexOf('sport') !== -1 &&
        nk.indexOf('percent') === -1 &&
        (
          nk.indexOf('stake') !== -1 ||
          nk.indexOf('betprofit') !== -1 ||
          nk.indexOf('bettors') !== -1
        );
    });

    if (sportStakeRows.length > 0) {
      var anyFalse = sportStakeRows.some(function(k) {
        return config.finance[k] && config.finance[k].show === false;
      });
      var anyTrue = sportStakeRows.some(function(k) {
        return config.finance[k] && config.finance[k].show !== false;
      });

      Logger.log('[isFinanceMetricEnabled][SPORT] group fallback: ' + JSON.stringify({
        metricRowName: metricRowName, sportStakeRows: sportStakeRows,
        anyFalse: anyFalse, anyTrue: anyTrue
      }));

      if (anyFalse && !anyTrue) return false;
    }
  }

  // Hard fallback: все sport non-percent выключены
  if (isSportTarget && normalizedTarget.indexOf('percent') === -1) {
    var allSportNonPercent = keys.filter(function(k) {
      var nk = normalizeFinanceMetricNameForCompare(k);
      return nk.indexOf('sport') !== -1 &&
        nk.indexOf('percent') === -1 &&
        (nk.indexOf('stake') !== -1 || nk.indexOf('betprofit') !== -1 || nk.indexOf('bettors') !== -1);
    });

    if (allSportNonPercent.length > 0) {
      var hasAtLeastOneEnabled = allSportNonPercent.some(function(k) {
        return config.finance[k] && config.finance[k].show !== false;
      });

      if (!hasAtLeastOneEnabled) {
        Logger.log('[isFinanceMetricEnabled][SPORT] DISABLED by hard fallback');
        return false;
      }
    }
  }

  if (isSportTarget) {
    Logger.log('[isFinanceMetricEnabled][SPORT] DEFAULT=true fallback: ' +
      JSON.stringify({ metricRowName: metricRowName }));
  }

  return true;
}

/**
 * Проверить, включен ли месяц для финансового листа (уровень "Включить месяц")
 * Читает строку "Включить месяц" из конфига Ret. FINANCE METRICS
 * 
 * @param {string} periodKey - Ключ периода (например "2025-11", "2026-01")
 * @param {string} sheetName - Имя листа (например "Product Stat - 2025")
 * @returns {boolean} true если месяц включён
 */
function isFinanceMonthEnabled(periodKey, sheetName) {
  var config = loadMetricsConfig();
  var year = extractYearFromSheetName(sheetName || periodKey || '');
  
  if (!year || !config.financeByYear || !config.financeByYear[year]) {
    Logger.log('[isFinanceMonthEnabled] Year not found in config: ' + year);
    return true; // По умолчанию включено
  }
  
  var yearCfg = config.financeByYear[year];
  
  // Проверяем уровень листа (sheetByYear)
  var parsed = parseFinanceMetricsSheetConfig(getFinanceMetricsSheet(getSettingsSpreadsheet()));
  if (!parsed || !parsed.sheetByYear || !parsed.sheetByYear[year]) {
    return true;
  }
  
  var sheetState = parsed.sheetByYear[year];
  
  // Если сам лист выключен — все месяцы выключены
  if (!sheetState.enabled) {
    Logger.log('[isFinanceMonthEnabled] Sheet DISABLED for year ' + year + ' → month ' + periodKey + ' = false');
    return false;
  }
  
  // Проверяем конкретный месяц
  if (sheetState.months && sheetState.months[periodKey] !== undefined) {
    var enabled = sheetState.months[periodKey];
    Logger.log('[isFinanceMonthEnabled] Month ' + periodKey + ' for year ' + year + ' = ' + enabled);
    return enabled;
  }
  
  // По умолчанию включено
  return true;
}