/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAREADER_FINANCE.js - Чтение финансовых данных из Product Stat
 *  Tab: Ret. FINANCE METRICS
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   МАППИНГ МЕТРИК PRODUCT STAT                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Динамические finance-метрики (заполняется при чтении)
var __DYNAMIC_FINANCE_METRICS__ = __DYNAMIC_FINANCE_METRICS__ || [];

var PRODUCT_STAT_ROW_MAP = PRODUCT_STAT_ROW_MAP || {
  'Тотал к-ство депозитов':                   { path: 'totalDepositsCount' },
  'Тотал сумма депозитов':                    { path: 'totalDepositsAmount' },
  'Ср. к-ство депозитов / день':              { path: 'avgDepositsPerDay' },
  'Ср. сумма депозитов / день':               { path: 'avgDepositsAmountPerDay' },
  'Тотал профит':                             { path: 'totalProfit' },
  'Ср. профит / день':                        { path: 'avgProfitPerDay' },
  'Тотал сумма ставок СПОРТ':                 { path: 'sport.totalStakeAmount' },
  'Тотал к-ство ставок СПОРТ':                { path: 'sport.totalStakeCount' },
  'Тотал Bet Profit СПОРТ':                   { path: 'sport.totalBetProfit' },
  'Ср. сумма ставок СПОРТ / день':            { path: 'sport.avgStakePerDay' },
  'Ср. к-ство ставок СПОРТ / день':           { path: 'sport.avgCountPerDay' },
  'Ср. к-ство ставочников СПОРТ / день':      { path: 'sport.avgBettorsPerDay' },
  'Тотал сумма ставок КАЗИНО':                { path: 'casino.totalStakeAmount' },
  'Тотал к-ство ставок КАЗИНО':               { path: 'casino.totalStakeCount' },
  'Тотал Bet Profit КАЗИНО':                  { path: 'casino.totalBetProfit' },
  'Ср. сумма ставок КАЗИНО / день':           { path: 'casino.avgStakePerDay' },
  'Ср. к-ство ставок КАЗИНО / день':          { path: 'casino.avgCountPerDay' },
  'Ср. к-ство ставочников КАЗИНО / день':     { path: 'casino.avgBettorsPerDay' },
  'Тотал сумма ставок':                       { path: 'totalStakeAmount' },
  'Тотал сумма ставок (все)':                 { path: 'totalStakeAmount' },
  '% сумма СПОРТ':                            { path: 'sportStakePercent' },
  '% сумма КАЗИНО':                           { path: 'casinoStakePercent' },
  'Сумма ФТД':                                { path: 'ftdAmount' },
  'Сумма редеп 1м':                           { path: 'redep1mAmount' },
  'Редеп 1м / ФТД':                           { path: 'redep1mRatio' },
  'Сумма редеп 1м+':                          { path: 'redep1mPlusAmount' },
  'Редеп 1м+ / к Тотал сумма деп':            { path: 'redep1mPlusRatio' },
  'Выданные бонусы':                          { path: 'bonusesIssued' },
  '% бонусов к депозитам':                    { path: 'bonusToDepositsRatio' }
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   ЧТЕНИЕ PRODUCT STAT                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function readRetentionFinance(sourceConfig) {
  var activeMonths = getActiveMonthsForSource(sourceConfig ? sourceConfig.key : 'retention');
  if (activeMonths.length === 0) return createEmptyRetentionFinance();

  var financeMonths = activeMonths.filter(function(m) {
    var hasFinance = m.roleSheets && m.roleSheets.finance;
    if (!hasFinance) Logger.log('[readRetentionFinance] Month SKIPPED: ' + m.name);
    return hasFinance;
  });

  if (financeMonths.length === 0) return createEmptyRetentionFinance();

  var ss = SpreadsheetApp.openById(sourceConfig ? sourceConfig.spreadsheetId : getRetentionSpreadsheetId());
  var finance = createEmptyRetentionFinance();

  // Сбрасываем динамические метрики перед новым чтением
  __DYNAMIC_FINANCE_METRICS__ = [];

  // ★ Получаем базовый месяц Finance ОДИН РАЗ (для него нет дельты)
  var baseMonthFinance = null;
  try {
    baseMonthFinance = getBaseMonthFinance();
    if (baseMonthFinance) {
      Logger.log('[readRetentionFinance] ★ Base month Finance (no delta): ' + baseMonthFinance);
    }
  } catch (e) {
    Logger.log('[readRetentionFinance] getBaseMonthFinance error: ' + e.message);
  }

  // ═══ Предзагрузка динамических секций и метрик (один API-вызов) ═══
  var dynamicSections = _getDynamicFinanceSections();
  var dynamicMetricNames = _getDynamicFinanceMetricNames(dynamicSections);
  Logger.log('[readRetentionFinance] Dynamic sections: ' + dynamicSections.map(function(s){return s.name}).join(', '));
  Logger.log('[readRetentionFinance] Dynamic metrics: ' + dynamicMetricNames.join(', '));

  var sheetsMap = new Map();
  financeMonths.forEach(function(m) {
    var manualSheet = m.roleSheets ? m.roleSheets.finance : null;
    if (!manualSheet) return;
    if (!sheetsMap.has(manualSheet)) sheetsMap.set(manualSheet, []);
    sheetsMap.get(manualSheet).push(m);
  });

  // ★ Хелпер: проверка базового месяца
  function isBaseMonthPeriod(periodKey) {
    if (!baseMonthFinance) return false;
    return (periodKey || '').toLowerCase() === baseMonthFinance.toLowerCase();
  }

  // ★ Хелпер: получить дельту с учётом базового месяца
  function getDiffValue(row, diffCol, periodKey) {
    if (diffCol == null || diffCol >= row.length) return '';
    if (isBaseMonthPeriod(periodKey)) return ''; // Базовый месяц — без дельты
    return String(row[diffCol] || '').trim();
  }

  sheetsMap.forEach(function(months, sheetName) {
    // ═══ ПРОВЕРКА: ЛИСТ ВКЛЮЧЁН? ═══
    if (!isSheetEnabled(sheetName)) {
      Logger.log('[readRetentionFinance] Sheet DISABLED: "' + sheetName + '" — all months SKIPPED');
      return;
    }

    var sheet = findSheetSmart(ss, sheetName);
    if (!sheet) return;

    var data = sheet.getDataRange().getDisplayValues();
    if (!data.length) return;

    // ═══ Ищем строку с месяцами (может быть row 0 или row 1) ═══
    var headerRow = data[0];
    var sheetMonths = createMonthDescriptors(headerRow, 1);
    
    // Если в первой строке не нашли месяцы — пробуем вторую
    if (sheetMonths.length === 0 && data.length > 1) {
      headerRow = data[1];
      sheetMonths = createMonthDescriptors(headerRow, 1);
      Logger.log('[readRetentionFinance] Months found in row 2 instead of row 1');
    }
    
    // ═══ Новый формат: первая колонка может содержать название секции ═══
    var firstCell = String((data[0] && data[0][0]) || '').trim().toUpperCase();
    var knownSections = ['ДЕПОЗИТЫ', 'КАЗИНО', 'СПОРТ', 'ПРОФИТ', 'DEPOSITS', 'CASINO', 'SPORT', 'PROFIT'];
    var isNewFormat = knownSections.some(function(s) { return firstCell.indexOf(s) !== -1; });
    
    if (isNewFormat) {
      Logger.log('[readRetentionFinance] Detected NEW format (section in A1: "' + firstCell + '")');
    }
    
    Logger.log('[readRetentionFinance] Sheet "' + sheetName + '": found ' + sheetMonths.length + ' months');

    var rowMap = {};
    for (var i = 0; i < data.length; i++) {
      var key = String((data[i] && data[i][0]) || '').trim();
      if (key && !rowMap[key]) rowMap[key] = i;
    }

    var targetIndices = [];
    months.forEach(function(targetMonth) {
      // ═══ ПРОВЕРКА: МЕСЯЦ ВКЛЮЧЁН ДЛЯ ЭТОГО ЛИСТА? ═══
      if (!isFinanceMonthEnabled(targetMonth.key, sheetName)) {
        Logger.log('[readRetentionFinance] Month DISABLED for sheet "' + sheetName + '": ' + targetMonth.name);
        return;
      }

      var sheetMonth = sheetMonths.find(function(sm) {
        return sm.name.toLowerCase().startsWith(targetMonth.nameOnly);
      });
      if (sheetMonth) {
        var resultIndex = financeMonths.findIndex(function(am) { return am.key === targetMonth.key; });
        if (resultIndex !== -1) {
          targetIndices.push({
            resultIndex: resultIndex,
            valueCol: sheetMonth.valueCol,
            diffCol: sheetMonth.diffCol,
            periodKey: targetMonth.key,
            sheetName: sheetName
          });
          
          // ★ Логируем если это базовый месяц
          if (isBaseMonthPeriod(targetMonth.key)) {
            Logger.log('[readRetentionFinance] ★ BASE MONTH detected: ' + targetMonth.name + ' — delta will be skipped');
          }
        }
      }
    });

    // ═══ ЧИТАЕМ ИЗВЕСТНЫЕ МЕТРИКИ (PRODUCT_STAT_ROW_MAP) ═══
    Object.keys(PRODUCT_STAT_ROW_MAP).forEach(function(rowName) {
      if (!isFinanceMetricEnabled(rowName)) return;

      var mapping = PRODUCT_STAT_ROW_MAP[rowName];
      var rowIndex = rowMap[rowName];
      if (rowIndex == null) return;
      
      // Пропускаем строки-разделители секций
      var rowFirstCell = String((data[rowIndex] && data[rowIndex][0]) || '').trim();
      if (isFinanceSectionHeader(rowFirstCell)) {
        Logger.log('[readRetentionFinance] Skipping section header: "' + rowFirstCell + '"');
        return;
      }

      var row = data[rowIndex];
      targetIndices.forEach(function(idx) {
        var isEnabled = isFinanceMetricEnabledForPeriod(rowName, idx.periodKey, idx.sheetName);
        var series = getSeriesByPath(finance.series, mapping.path);

        while (series.values.length <= idx.resultIndex) {
          series.values.push(null);
          series.diffs.push(null);
        }

        if (!isEnabled) {
          series.values[idx.resultIndex] = null;
          series.diffs[idx.resultIndex] = null;
        } else {
          series.values[idx.resultIndex] = parseNumber(idx.valueCol < row.length ? row[idx.valueCol] : 0);
          // ★ Используем хелпер для получения дельты
          series.diffs[idx.resultIndex] = getDiffValue(row, idx.diffCol, idx.periodKey);
        }
      });
    });

    // ═══ ЧИТАЕМ ДИНАМИЧЕСКИЕ МЕТРИКИ (из конфига, не в PRODUCT_STAT_ROW_MAP) ═══
    var knownRowNames = {};
    Object.keys(PRODUCT_STAT_ROW_MAP).forEach(function(rn) { knownRowNames[rn] = true; });

    dynamicMetricNames.forEach(function(metricName) {
      if (knownRowNames[metricName]) return;

      var rowIndex = rowMap[metricName];
      if (rowIndex == null) {
        Logger.log('[readRetentionFinance] Dynamic metric NOT found in source: "' + metricName + '"');
        return;
      }

      if (!isFinanceMetricEnabled(metricName)) return;

      var row = data[rowIndex];
      var category = _findDynamicCategory(metricName, rowIndex, data, dynamicSections);
      var dynKey = _makeDynamicKey(metricName);
      var dynamicPath = 'dynamic.' + dynKey;

      if (!finance.series.dynamic) finance.series.dynamic = {};
      if (!finance.series.dynamic[dynKey]) {
        finance.series.dynamic[dynKey] = createEmptyMonthlySeries();
      }

      if (!PRODUCT_STAT_ROW_MAP[metricName]) {
        PRODUCT_STAT_ROW_MAP[metricName] = {
          path: dynamicPath,
          dynamic: true,
          category: category,
          title: metricName
        };
        Logger.log('[readRetentionFinance] Dynamic metric: "' + metricName + '" → ' + dynamicPath + ' (cat: ' + category + ')');
      }

      var series = finance.series.dynamic[dynKey];

      targetIndices.forEach(function(idx) {
        var isEnabled = isFinanceMetricEnabledForPeriod(metricName, idx.periodKey, idx.sheetName);

        while (series.values.length <= idx.resultIndex) {
          series.values.push(null);
          series.diffs.push(null);
        }

        if (!isEnabled) {
          series.values[idx.resultIndex] = null;
          series.diffs[idx.resultIndex] = null;
        } else {
          series.values[idx.resultIndex] = parseNumber(idx.valueCol < row.length ? row[idx.valueCol] : 0);
          // ★ Используем хелпер для получения дельты
          series.diffs[idx.resultIndex] = getDiffValue(row, idx.diffCol, idx.periodKey);
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ДИНАМИЧЕСКИЕ МЕТРИКИ (второй проход — из конфига)
  // ═══════════════════════════════════════════════════════════════════════
  try {
    var dynSections = _getDynamicFinanceSections();
    var dynMetricNames = _getDynamicFinanceMetricNamesFinance_();

    Logger.log('[readRetentionFinance] Dynamic finance metrics (pass 2): ' + dynMetricNames.join(', '));

    dynMetricNames.forEach(function(metricName) {
      var categoryKey = _findDynamicFinanceCategory_(metricName, dynSections);

      sheetsMap.forEach(function(monthsForSheet, sheetName) {
        var sheet = findSheetSmart(ss, sheetName);
        if (!sheet) return;

        var dataSheet = sheet.getDataRange().getDisplayValues();
        if (!dataSheet.length) return;

        var rowMapLocal = {};
        for (var r = 0; r < dataSheet.length; r++) {
          var key = String((dataSheet[r] && dataSheet[r][0]) || '').trim();
          if (key && !rowMapLocal[key]) rowMapLocal[key] = r;
        }

        var rowIndex = rowMapLocal[metricName];
        if (rowIndex == null) return;

        var row = dataSheet[rowIndex];

        var safeKey = _makeDynamicFinanceKey_(metricName);
        var path = 'dynamic.' + safeKey;

        if (!finance.series.dynamic) finance.series.dynamic = {};
        if (!finance.series.dynamic[safeKey]) {
          finance.series.dynamic[safeKey] = createEmptyMonthlySeries();
        }
        var series = finance.series.dynamic[safeKey];

        // Нужно заново определить targetIndices для этого листа
        var localTargetIndices = [];
        monthsForSheet.forEach(function(targetMonth) {
          if (!isFinanceMonthEnabled(targetMonth.key, sheetName)) return;
          
          var headerRow = dataSheet[0];
          var sheetMonthsLocal = createMonthDescriptors(headerRow, 1);
          if (sheetMonthsLocal.length === 0 && dataSheet.length > 1) {
            sheetMonthsLocal = createMonthDescriptors(dataSheet[1], 1);
          }
          
          var sheetMonth = sheetMonthsLocal.find(function(sm) {
            return sm.name.toLowerCase().startsWith(targetMonth.nameOnly);
          });
          
          if (sheetMonth) {
            var resultIndex = financeMonths.findIndex(function(am) { return am.key === targetMonth.key; });
            if (resultIndex !== -1) {
              localTargetIndices.push({
                resultIndex: resultIndex,
                valueCol: sheetMonth.valueCol,
                diffCol: sheetMonth.diffCol,
                periodKey: targetMonth.key,
                sheetName: sheetName
              });
            }
          }
        });

        localTargetIndices.forEach(function(idx) {
          while (series.values.length <= idx.resultIndex) {
            series.values.push(null);
            series.diffs.push(null);
          }

          var isEnabled = isFinanceMetricEnabledForPeriod(metricName, idx.periodKey, idx.sheetName);

          if (!isEnabled) {
            series.values[idx.resultIndex] = null;
            series.diffs[idx.resultIndex] = null;
          } else {
            var val = idx.valueCol < row.length ? row[idx.valueCol] : '';
            series.values[idx.resultIndex] = parseNumber(val || 0);
            
            // ★ Проверяем базовый месяц
            if (isBaseMonthPeriod(idx.periodKey)) {
              series.diffs[idx.resultIndex] = '';
            } else {
              var diff = idx.diffCol != null && idx.diffCol < row.length ? row[idx.diffCol] : '';
              series.diffs[idx.resultIndex] = String(diff || '').trim();
            }
          }
        });

        // Регистрируем описание метрики один раз
        if (!__DYNAMIC_FINANCE_METRICS__.some(function(m) { return m.rowName === metricName; })) {
          __DYNAMIC_FINANCE_METRICS__.push({
            rowName: metricName,
            path: path,
            jsKey: path.replace(/\./g, '_'),
            label: metricName,
            format: _guessFinanceFormat_(metricName),
            categoryKey: categoryKey || 'other'
          });
          Logger.log('[readRetentionFinance] Registered dynamic metric: ' +
            metricName + ' → ' + path + ' (category: ' + categoryKey + ')');
        }
      });
    });

  } catch (e) {
    Logger.log('[readRetentionFinance] ERROR dynamic metrics: ' + e.message);
  }

  finance.months = financeMonths.map(function(m) { return m.name; });
  return finance;
}

/**
 * Генерирует safe-ключ из названия метрики
 */
function _makeDynamicKey(name) {
  return String(name || '')
    .replace(/[^a-zа-яё0-9\s]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 60);
}
/**
 * Получить динамические секции из конфига FINANCE METRICS
 * Возвращает массив { name, key, rowIndex }
 */
var __dynamicFinanceSectionsCache = null;
var __dynamicFinanceMetricNamesCache = null;
var __dynamicFinanceCfgDataCache = null;

function _getDynamicFinanceCfgData() {
  if (__dynamicFinanceCfgDataCache !== null) return __dynamicFinanceCfgDataCache;
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('Ret. FINANCE METRICS');
    if (!sheet) { __dynamicFinanceCfgDataCache = []; return []; }
    __dynamicFinanceCfgDataCache = sheet.getDataRange().getDisplayValues();
  } catch (e) {
    Logger.log('[_getDynamicFinanceCfgData] Error: ' + e.message);
    __dynamicFinanceCfgDataCache = [];
  }
  return __dynamicFinanceCfgDataCache;
}

function _getDynamicFinanceSections() {
  if (__dynamicFinanceSectionsCache) return __dynamicFinanceSectionsCache;

  var sections = [];
  var data = _getDynamicFinanceCfgData();
  if (!data.length) { __dynamicFinanceSectionsCache = sections; return sections; }

  var systemNames = ['включить лист', 'включить месяц', 'период', 'метрика', 'enable sheet'];

  for (var r = 0; r < data.length; r++) {
    var name = String((data[r] && data[r][0]) || '').trim();
    if (!name) continue;

    var nameLower = name.toLowerCase().replace(/\s+/g, ' ');

    // Пропускаем системные
    var isSystem = false;
    for (var s = 0; s < systemNames.length; s++) {
      if (nameLower === systemNames[s]) { isSystem = true; break; }
    }
    if (isSystem) continue;
    if (isEnableSheetRowName(name)) continue;

    // ═══ ПРОВЕРЯЕМ ON/OFF ПАТТЕРН ═══
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

    // ═══ СЕКЦИЯ = есть ON/OFF, НЕТ галочек, ВСЁ ON/OFF ═══
    var isSection = hasOnOff && allOnOff && !hasCheckmark;
    if (!isSection) continue;

    var sectionKey = getFinanceSectionKey(name);
    if (!sectionKey) {
      sectionKey = nameLower.replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_|_$/g, '');

      if (typeof __dynamicFinanceSectionKeys !== 'undefined') {
        __dynamicFinanceSectionKeys[nameLower] = sectionKey;
      }

      Logger.log('[_getDynamicFinanceSections] Dynamic section: "' + name + '" → ' + sectionKey);
    }

    sections.push({ name: name, key: sectionKey, rowIndex: r });
  }

  __dynamicFinanceSectionsCache = sections;
  return sections;
}

/**
 * Получить имена динамических метрик из конфига Ret. FINANCE METRICS
 * Это подметрики, которые находятся МЕЖДУ секциями-заголовками
 * и НЕ входят в PRODUCT_STAT_ROW_MAP
 */
function _getDynamicFinanceMetricNames(dynamicSections) {
  if (__dynamicFinanceMetricNamesCache) return __dynamicFinanceMetricNamesCache;

  var names = [];
  var data = _getDynamicFinanceCfgData();
  if (!data.length) { __dynamicFinanceMetricNamesCache = names; return names; }

  try {
    // Собираем все известные секции (и встроенные, и динамические)
    var sectionRows = {};
    for (var r = 0; r < data.length; r++) {
      var name = String((data[r] && data[r][0]) || '').trim();
      if (!name) continue;
      if (getFinanceSectionKey(name)) { sectionRows[r] = true; continue; }
      // Динамические секции
      for (var ds = 0; ds < dynamicSections.length; ds++) {
        if (dynamicSections[ds].name === name) { sectionRows[r] = true; break; }
      }
    }

    // Системные строки
    var systemNames = ['включить лист', 'включить месяц', 'период', 'метрика'];

    for (var r2 = 0; r2 < data.length; r2++) {
      if (sectionRows[r2]) continue;

      var metricName = String((data[r2] && data[r2][0]) || '').trim();
      if (!metricName) continue;

      var nameLower = metricName.toLowerCase();
      if (systemNames.indexOf(nameLower) !== -1) continue;
      if (isEnableSheetRowName(metricName)) continue;

      // Пропускаем уже известные метрики
      if (PRODUCT_STAT_ROW_MAP[metricName]) continue;

      // Проверяем: строка имеет ON/OFF + галочки → это метрика
      var hasSignals = false;
      for (var c = 1; c < Math.min((data[r2] || []).length, 15); c++) {
        var v = String(data[r2][c] || '').trim().toUpperCase();
        if (v === 'ON' || v === 'OFF' || v === '✓' || v === '✗') {
          hasSignals = true;
          break;
        }
      }

      if (hasSignals) {
        names.push(metricName);
      }
    }
  } catch (e) {
    Logger.log('[_getDynamicFinanceMetricNames] Error: ' + e.message);
  }

  Logger.log('[_getDynamicFinanceMetricNames] Found: ' + names.join(', '));
  return names;
}

/**
 * Определить категорию динамической метрики по её позиции в исходных данных
 */
function _findDynamicCategory(rowName, rowIndex, data, dynamicSections) {
  if (!dynamicSections || dynamicSections.length === 0) return 'other';

  var cfgData = _getDynamicFinanceCfgData();
  if (!cfgData.length) return 'other';

  var metricRowInCfg = -1;
  for (var cr = 0; cr < cfgData.length; cr++) {
    var cfgName = String((cfgData[cr] && cfgData[cr][0]) || '').trim();
    if (cfgName === rowName) { metricRowInCfg = cr; break; }
  }

  if (metricRowInCfg > 0) {
    for (var si = dynamicSections.length - 1; si >= 0; si--) {
      if (dynamicSections[si].rowIndex < metricRowInCfg) {
        return dynamicSections[si].key;
      }
    }
  }

  return 'other';
}

/**
 * Имена динамических finance-метрик из Ret. FINANCE METRICS
 * (строки, не попавшие в PRODUCT_STAT_ROW_MAP, но имеющие ON/✓)
 */
function _getDynamicFinanceMetricNamesFinance_() {
  var names = [];
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = getFinanceMetricsSheet(ss);
    if (!sheet) return names;

    var data = sheet.getDataRange().getDisplayValues();
    if (!data || data.length < 5) return names;

    for (var r = 4; r < data.length; r++) {
      var name = String((data[r] && data[r][0]) || '').trim();
      if (!name) continue;

      if (getFinanceSectionKey(name)) continue;      // это секция
      if (isEnableSheetRowName(name)) continue;      // "Включить лист" и т.п.
      if (PRODUCT_STAT_ROW_MAP[name]) continue;      // уже известная статика

      var row = data[r] || [];
      var hasSignals = false;
      for (var c = 1; c < row.length; c++) {
        var v = String(row[c] || '').trim().toUpperCase();
        if (!v) continue;
        if (v === 'ON' || v === 'OFF' || v === '✓' || v === '✗' || v === 'TRUE' || v === 'FALSE') {
          hasSignals = true;
          break;
        }
      }
      if (hasSignals) names.push(name);
    }
  } catch (e) {
    Logger.log('[_getDynamicFinanceMetricNamesFinance_] ERROR: ' + e.message);
  }
  return names;
}

/**
 * Safe-key для динамических finance-метрик
 */
function _makeDynamicFinanceKey_(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 60);
}

/**
 * Угадать формат finance-метрики
 */
function _guessFinanceFormat_(name) {
  var n = String(name || '').toLowerCase();
  if (n.indexOf('%') !== -1 || n.indexOf('процент') !== -1 || n.indexOf('ratio') !== -1) return 'percent';
  if (n.indexOf('к-ство') !== -1 || n.indexOf('кол-во') !== -1 || n.indexOf('количество') !== -1 || n.indexOf('count') !== -1) return 'integer';
  if (n.indexOf('сумма') !== -1 || n.indexOf('amount') !== -1 || n.indexOf('профит') !== -1 || n.indexOf('profit') !== -1) return 'currency';
  if (n.indexOf('ср.') !== -1 || n.indexOf('avg') !== -1) return 'decimal';
  return 'currency';
}

/**
 * Категория (секция) динамической метрики по конфигу Ret. FINANCE METRICS
 * rowName = "Сумма ТЕСТ" → вернёт key секции "Тест" (например "тест")
 */
function _findDynamicFinanceCategory_(rowName, dynamicSections) {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = getFinanceMetricsSheet(ss);
    if (!sheet) return 'other';

    var data = sheet.getDataRange().getDisplayValues();
    if (!data || !data.length) return 'other';

    var rowIndex = -1;
    for (var r = 0; r < data.length; r++) {
      var name = String((data[r] && data[r][0]) || '').trim();
      if (name === rowName) { rowIndex = r; break; }
    }
    if (rowIndex < 0) return 'other';

    // Найти ближайшую секцию ВЫШЕ этой строки
    var best = null;
    dynamicSections.forEach(function(s) {
      if (s.rowIndex < rowIndex) {
        if (!best || s.rowIndex > best.rowIndex) best = s;
      }
    });

    return best ? best.key : 'other';
  } catch (e) {
    Logger.log('[_findDynamicFinanceCategory_] ERROR: ' + e.message);
    return 'other';
  }
}

/**
 * Проверяет, является ли строка заголовком секции (ДЕПОЗИТЫ, КАЗИНО, etc.)
 */
function isFinanceSectionHeader(cellValue) {
  if (!cellValue) return false;
  var val = String(cellValue).trim().toUpperCase();
  var sections = ['ДЕПОЗИТЫ', 'КАЗИНО', 'СПОРТ', 'ПРОФИТ И БОНУСЫ', 'ПРОФИТ', 'СТРУКТУРА', 'ТЕСТ',
                  'DEPOSITS', 'CASINO', 'SPORT', 'PROFIT', 'STRUCTURE', 'TEST'];
  return sections.indexOf(val) !== -1;
}