/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAMODEL_FINANCE.js - Модели данных Finance метрик
 *  Tab: Ret. FINANCE METRICS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Создать пустую структуру финансовых данных Retention (ПОЛНАЯ ВЕРСИЯ)
 * Включает ВСЕ 28 метрик из листа "Product Stat"
 */
function createEmptyRetentionFinance() {
  return {
    months: [],
    series: {
      // ═══ ДЕПОЗИТЫ ═══
      totalDepositsCount: createEmptyMonthlySeries(),
      totalDepositsAmount: createEmptyMonthlySeries(),
      avgDepositsPerDay: createEmptyMonthlySeries(),
      avgDepositsAmountPerDay: createEmptyMonthlySeries(),

      // ═══ ПРОФИТ ═══
      totalProfit: createEmptyMonthlySeries(),
      avgProfitPerDay: createEmptyMonthlySeries(),

      // ═══ FTD И РЕДЕПЫ ═══
      ftdAmount: createEmptyMonthlySeries(),
      redep1mAmount: createEmptyMonthlySeries(),
      redep1mRatio: createEmptyMonthlySeries(),
      redep1mPlusAmount: createEmptyMonthlySeries(),
      redep1mPlusRatio: createEmptyMonthlySeries(),

      // ═══ БОНУСЫ ═══
      bonusesIssued: createEmptyMonthlySeries(),
      bonusToDepositsRatio: createEmptyMonthlySeries(),

      // ═══ СТРУКТУРА СТАВОК ═══
      totalStakeAmount: createEmptyMonthlySeries(),
      sportStakePercent: createEmptyMonthlySeries(),
      casinoStakePercent: createEmptyMonthlySeries(),

      // ═══ СПОРТ ═══
      sport: {
        totalStakeAmount: createEmptyMonthlySeries(),
        totalStakeCount: createEmptyMonthlySeries(),
        totalBetProfit: createEmptyMonthlySeries(),
        avgStakePerDay: createEmptyMonthlySeries(),
        avgCountPerDay: createEmptyMonthlySeries(),
        avgBettorsPerDay: createEmptyMonthlySeries()
      },

      // ═══ КАЗИНО ═══
      casino: {
        totalStakeAmount: createEmptyMonthlySeries(),
        totalStakeCount: createEmptyMonthlySeries(),
        totalBetProfit: createEmptyMonthlySeries(),
        avgStakePerDay: createEmptyMonthlySeries(),
        avgCountPerDay: createEmptyMonthlySeries(),
        avgBettorsPerDay: createEmptyMonthlySeries()
      }
    }
  };
}

/**
 * Создать карточки финансовых метрик (динамически из PRODUCT_STAT_ROW_MAP)
 */
function createFinanceCards(finance, monthIndex, periodKey) {
  var cards = [];
  var order = 1;

  // ✅ Используем переключатели месяцев из Ret. FINANCE METRICS
  // ✅ ВАЖНО: отключаем ТОЛЬКО по ГРУППЕ (например "ДЕПОЗИТЫ"),
  // чтобы случайно не занулить profit/sport/casino из-за несовпадения rowName.
  var toggleMap = getFinanceMetricMonthToggleMap_();

  function isGroupEnabledForPeriod(groupRowNames, periodKey) {
    if (!periodKey) return true;
    if (!Array.isArray(groupRowNames)) groupRowNames = [groupRowNames];

    for (var i = 0; i < groupRowNames.length; i++) {
      var rn = String(groupRowNames[i] || '').trim();
      if (!rn) continue;

      // если строки группы нет в map — НЕ блокируем
      if (!toggleMap[rn]) continue;

      // если колонка периода есть — используем true/false
      if (toggleMap[rn].hasOwnProperty(periodKey)) {
        return toggleMap[rn][periodKey] === true;
      }
    }
    return true;
  }

  // Маппинг category → возможные названия строки-группы в Ret. FINANCE METRICS
  var CATEGORY_GROUP_ROW = {
    deposits: ['ДЕПОЗИТЫ'],
    sport: ['СПОРТ'],
    casino: ['КАЗИНО'],
    profit: ['ПРОФИТ', 'ПРОФИТ И БОНУСЫ'],
    structure: ['СТРУКТУРА']
  };

  // ═══ Добавляем динамические секции ═══
  // Источник 1: кэш из DataReader
  if (typeof __dynamicFinanceSectionsCache !== 'undefined' && __dynamicFinanceSectionsCache) {
    __dynamicFinanceSectionsCache.forEach(function(s) {
      if (!CATEGORY_GROUP_ROW[s.key]) {
        CATEGORY_GROUP_ROW[s.key] = [s.name];
      }
    });
  }

  // Источник 2: пересканировать если кэш пуст (вызов при createReportJSON)
  var dynSections = _getDynamicFinanceSections();
  if (dynSections && dynSections.length > 0) {
    dynSections.forEach(function(s) {
      if (!CATEGORY_GROUP_ROW[s.key]) {
        CATEGORY_GROUP_ROW[s.key] = [s.name];
      }
    });
  }

  var META = {
    'totalDepositsCount':       { title: 'Тотал кол-во депозитов',           icon: '💰', format: 'integer',  category: 'deposits' },
    'totalDepositsAmount':      { title: 'Тотал сумма депозитов',            icon: '💳', format: 'currency', category: 'deposits' },
    'avgDepositsPerDay':        { title: 'Ср. кол-во депозитов / день',      icon: '📊', format: 'decimal',  category: 'deposits' },
    'avgDepositsAmountPerDay':  { title: 'Ср. сумма депозитов / день',       icon: '💵', format: 'currency', category: 'deposits' },
    'totalProfit':              { title: 'Тотал профит',                     icon: '📈', format: 'currency', category: 'profit' },
    'avgProfitPerDay':          { title: 'Ср. профит / день',                icon: '💹', format: 'currency', category: 'profit' },
    'sport.totalStakeAmount':   { title: 'Ставки СПОРТ (Сумма)',            icon: '⚽', format: 'currency', category: 'sport' },
    'sport.totalStakeCount':    { title: 'Ставки СПОРТ (Кол-во)',           icon: '🎯', format: 'integer',  category: 'sport' },
    'sport.totalBetProfit':     { title: 'Bet Profit СПОРТ',                icon: '🏆', format: 'currency', category: 'sport' },
    'sport.avgStakePerDay':     { title: 'Ср. сумма ставок СПОРТ / день',   icon: '📊', format: 'currency', category: 'sport' },
    'sport.avgCountPerDay':     { title: 'Ср. кол-во ставок СПОРТ / день',  icon: '📈', format: 'decimal',  category: 'sport' },
    'sport.avgBettorsPerDay':   { title: 'Ср. ставочников СПОРТ / день',    icon: '👥', format: 'decimal',  category: 'sport' },
    'casino.totalStakeAmount':  { title: 'Ставки КАЗИНО (Сумма)',           icon: '🎰', format: 'currency', category: 'casino' },
    'casino.totalStakeCount':   { title: 'Ставки КАЗИНО (Кол-во)',          icon: '🃏', format: 'integer',  category: 'casino' },
    'casino.totalBetProfit':    { title: 'Bet Profit КАЗИНО',               icon: '💎', format: 'currency', category: 'casino' },
    'casino.avgStakePerDay':    { title: 'Ср. сумма ставок КАЗИНО / день',  icon: '📊', format: 'currency', category: 'casino' },
    'casino.avgCountPerDay':    { title: 'Ср. кол-во ставок КАЗИНО / день', icon: '📈', format: 'decimal',  category: 'casino' },
    'casino.avgBettorsPerDay':  { title: 'Ср. ставочников КАЗИНО / день',   icon: '👥', format: 'decimal',  category: 'casino' },
    'totalStakeAmount':         { title: 'Тотал сумма ставок',              icon: '📊', format: 'currency', category: 'structure' },
    'sportStakePercent':        { title: '% сумма СПОРТ',                   icon: '⚽', format: 'percent',  category: 'structure' },
    'casinoStakePercent':       { title: '% сумма КАЗИНО',                  icon: '🎰', format: 'percent',  category: 'structure' },
    'ftdAmount':                { title: 'Сумма ФТД',                       icon: '🆕', format: 'currency', category: 'deposits' },
    'redep1mAmount':            { title: 'Сумма редеп 1м',                  icon: '🔄', format: 'currency', category: 'deposits' },
    'redep1mRatio':             { title: 'Редеп 1м / ФТД',                  icon: '📈', format: 'percent',  category: 'deposits' },
    'redep1mPlusAmount':        { title: 'Сумма редеп 1м+',                 icon: '➕', format: 'currency', category: 'deposits' },
    'redep1mPlusRatio':         { title: 'Редеп 1м+ / Тотал',              icon: '📊', format: 'percent',  category: 'deposits' },
    'bonusesIssued':            { title: 'Выданные бонусы',                 icon: '🎁', format: 'currency', category: 'profit' },
    'bonusToDepositsRatio':     { title: '% бонусов к депозитам',           icon: '📉', format: 'percent',  category: 'profit' }
  };

  var PATH_TO_ID = {
    'totalDepositsCount':       'total_deposits_count',
    'totalDepositsAmount':      'total_deposits_amount',
    'avgDepositsPerDay':        'avg_deposits_per_day',
    'avgDepositsAmountPerDay':  'avg_deposits_amount_per_day',
    'totalProfit':              'total_profit',
    'avgProfitPerDay':          'avg_profit_per_day',
    'sport.totalStakeAmount':   'sport_stake_amount',
    'sport.totalStakeCount':    'sport_stake_count',
    'sport.totalBetProfit':     'sport_bet_profit',
    'sport.avgStakePerDay':     'sport_avg_stake_per_day',
    'sport.avgCountPerDay':     'sport_avg_count_per_day',
    'sport.avgBettorsPerDay':   'sport_avg_bettors_per_day',
    'casino.totalStakeAmount':  'casino_stake_amount',
    'casino.totalStakeCount':   'casino_stake_count',
    'casino.totalBetProfit':    'casino_bet_profit',
    'casino.avgStakePerDay':    'casino_avg_stake_per_day',
    'casino.avgCountPerDay':    'casino_avg_count_per_day',
    'casino.avgBettorsPerDay':  'casino_avg_bettors_per_day',
    'totalStakeAmount':         'total_stake_amount',
    'sportStakePercent':        'sport_stake_percent',
    'casinoStakePercent':       'casino_stake_percent',
    'ftdAmount':                'ftd_amount',
    'redep1mAmount':            'redep_1m_amount',
    'redep1mRatio':             'redep_1m_ratio',
    'redep1mPlusAmount':        'redep_1m_plus_amount',
    'redep1mPlusRatio':         'redep_1m_plus_ratio',
    'bonusesIssued':            'bonuses_issued',
    'bonus_to_deposits_ratio':  'bonus_to_deposits_ratio'
  };

  Object.keys(PRODUCT_STAT_ROW_MAP).forEach(function(rowName) {
    if (!isFinanceMetricEnabled(rowName)) return;

    var mapping = PRODUCT_STAT_ROW_MAP[rowName];
    var path = mapping.path;

    // ═══ Для динамических метрик — автогенерация meta ═══
    var meta;
    var id;

    if (mapping.dynamic) {
      var dynCategory = mapping.category || 'other';
      meta = {
        title: mapping.title || rowName,
        icon: '📊',
        format: _guessFormat(rowName),
        category: dynCategory
      };
      id = path.replace(/\./g, '_');
    } else {
      meta = META[path] || { title: rowName, icon: '📊', format: 'decimal', category: 'other' };
      id = PATH_TO_ID[path] || path.replace(/\./g, '_');
    }

    // ═══ Получаем series (с fallback для dynamic) ═══
    var series;
    try {
      series = getSeriesByPath(finance.series, path);
    } catch (e) {
      series = null;
    }

    if (!series) return;

    var rawValue = getSeriesValue(series, monthIndex);
    var rawDiff = getSeriesDiff(series, monthIndex);

    // ═══ Группа ON/OFF ═══
    var groupNames = CATEGORY_GROUP_ROW[meta.category] || null;

    // Для динамических категорий — добавляем имя секции
    if (!groupNames && mapping.dynamic && mapping.category) {
      var dynSections = _getDynamicFinanceSections();
      for (var ds = 0; ds < dynSections.length; ds++) {
        if (dynSections[ds].key === mapping.category) {
          groupNames = [dynSections[ds].name];
          break;
        }
      }
    }

    if (groupNames && !isGroupEnabledForPeriod(groupNames, periodKey)) {
      rawValue = null;
      rawDiff = '';
    }

    cards.push({
      id: id,
      title: meta.title,
      value: rawValue,
      diff: rawDiff,
      valueFormat: meta.format,
      icon: meta.icon,
      category: meta.category,
      order: order++
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ДИНАМИЧЕСКИЕ МЕТРИКИ (из __DYNAMIC_FINANCE_METRICS__)
  // ═══════════════════════════════════════════════════════════════════════
  if (typeof __DYNAMIC_FINANCE_METRICS__ !== 'undefined' && Array.isArray(__DYNAMIC_FINANCE_METRICS__)) {
    __DYNAMIC_FINANCE_METRICS__.forEach(function(dm) {
      var series = getSeriesByPath(finance.series, dm.path);
      if (!series) return;

      var rawValue = getSeriesValue(series, monthIndex);
      var rawDiff = getSeriesDiff(series, monthIndex);

      cards.push({
        id: dm.jsKey,                      // например dynamic_summa_тест
        title: dm.label,                   // "Сумма ТЕСТ"
        value: rawValue,
        diff: rawDiff,
        valueFormat: dm.format || 'currency',
        icon: '📊',
        category: dm.categoryKey || 'other',  // для вкладки
        order: order++
      });
    });
  }

  return cards;
}

var __FINANCE_MONTH_TOGGLE_CACHE__ = null;

/**
 * map[rowName][periodKey] = true/false
 * rowName — точное имя строки в Ret. FINANCE METRICS (например "ДЕПОЗИТЫ")
 * periodKey — "2025-11"
 */
function getFinanceMetricMonthToggleMap_() {
  if (__FINANCE_MONTH_TOGGLE_CACHE__) return __FINANCE_MONTH_TOGGLE_CACHE__;

  var res = {};
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('Ret. FINANCE METRICS');
    if (!sheet) {
      __FINANCE_MONTH_TOGGLE_CACHE__ = res;
      return res;
    }

    var data = sheet.getDataRange().getValues();
    if (!data || data.length < 5) {
      __FINANCE_MONTH_TOGGLE_CACHE__ = res;
      return res;
    }

    // Структура:
    // data[0] — заголовки с "Product Stat - 2025", "Product Stat - 2026"
    // data[2] — "Период | Год | Ноя | Дек | Год | Янв | Фев"
    var yearRow = data[0];
    var monthRow = data[2];

    var colToPeriodKey = {};
    for (var col = 0; col < monthRow.length; col++) {
      var mName = String(monthRow[col] || '').trim().toLowerCase();
      var monthNum = getMonthNumberFromName(mName);
      if (!monthNum) continue;

      var year = null;
      for (var c = col; c >= 0; c--) {
        var match = String(yearRow[c] || '').match(/\b(20\d{2})\b/);
        if (match) { year = match[1]; break; }
      }
      if (!year) continue;

      colToPeriodKey[col] = year + '-' + String(monthNum).padStart(2, '0');
    }

    // Строки метрик начинаются с data[4]
    for (var r = 4; r < data.length; r++) {
      var rowName = String(data[r][0] || '').trim();
      if (!rowName) continue;

      if (!res[rowName]) res[rowName] = {};

      Object.keys(colToPeriodKey).forEach(function(colStr) {
        var col = parseInt(colStr, 10);
        var periodKey = colToPeriodKey[col];
        var cell = data[r][col];

        // ★ Ищем Status (ON/OFF) для этого блока года — ближайший ON/OFF слева от месяца
        var statusEnabled = true;
        for (var sc = col - 1; sc >= 0; sc--) {
          var sv = String(data[r][sc] || '').trim().toUpperCase();
          if (sv === 'ON' || sv === 'OFF') {
            statusEnabled = (sv === 'ON');
            break;
          }
        }

        // Если Status = OFF → вся группа выключена для этого блока года
        if (!statusEnabled) {
          res[rowName][periodKey] = false;
          return;
        }

        var s = String(cell || '').trim();

        var enabled =
          cell === true ||
          s === '✓' ||
          s.toUpperCase() === 'TRUE' ||
          s.toUpperCase() === 'ON';

        if (s === '' || s === '✗' || s.toUpperCase() === 'OFF') {
          enabled = false;
        }

        res[rowName][periodKey] = enabled;
      });
    }
  } catch (e) {
    Logger.log('[getFinanceMetricMonthToggleMap_] ERROR: ' + e);
  }

  __FINANCE_MONTH_TOGGLE_CACHE__ = res;
  return res;
}

/**
 * Угадать формат по названию метрики
 */
function _guessFormat(name) {
  var n = String(name || '').toLowerCase();
  if (n.indexOf('%') !== -1 || n.indexOf('процент') !== -1 || n.indexOf('rate') !== -1) return 'percent';
  if (n.indexOf('к-ство') !== -1 || n.indexOf('кол-во') !== -1 || n.indexOf('количество') !== -1 || n.indexOf('count') !== -1) return 'integer';
  if (n.indexOf('сумма') !== -1 || n.indexOf('amount') !== -1 || n.indexOf('profit') !== -1 || n.indexOf('профит') !== -1) return 'currency';
  if (n.indexOf('ср.') !== -1 || n.indexOf('avg') !== -1) return 'decimal';
  return 'currency';
}

/**
 * Получить динамические секции из конфига FINANCE METRICS
 * Возвращает массив { name, key, rowIndex }
 */
function _getDynamicFinanceSections() {
  var sections = [];
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('Ret. FINANCE METRICS');
    if (!sheet) return sections;

    var data = sheet.getDataRange().getDisplayValues();

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

      // ═══ ПРОВЕРЯЕМ ON/OFF ПАТТЕРН (секция = строка где ВСЕ значения ON/OFF) ═══
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

      // ═══ СЕКЦИЯ = есть ON/OFF, НЕТ галочек (✓), ВСЁ ON/OFF ═══
      var isSection = hasOnOff && allOnOff && !hasCheckmark;

      if (!isSection) continue;

      // Определяем ключ секции
      var sectionKey = getFinanceSectionKey(name);
      if (!sectionKey) {
        // Новая динамическая секция
        sectionKey = nameLower.replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_|_$/g, '');

        // Заполняем кэш
        if (typeof __dynamicFinanceSectionKeys !== 'undefined') {
          __dynamicFinanceSectionKeys[nameLower] = sectionKey;
        }

        Logger.log('[_getDynamicFinanceSections] Dynamic section: "' + name + '" → ' + sectionKey);
      }

      sections.push({ name: name, key: sectionKey, rowIndex: r });
    }
  } catch (e) {
    Logger.log('[_getDynamicFinanceSections] Error: ' + e.message);
  }
  return sections;
}