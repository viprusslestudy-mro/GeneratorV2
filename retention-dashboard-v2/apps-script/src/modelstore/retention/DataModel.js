/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAMODEL.js - SHARED модели данных (ядро + оркестратор)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        БАЗОВЫЕ СТРУКТУРЫ                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Создать пустую структуру месячной серии
 */
function createEmptyMonthlySeries() {
  return {
    values: [],
    diffs: []
  };
}

/**
 * Создать пустую структуру всех данных Retention
 */
function createEmptyRetentionData() {
  return {
    finance: createEmptyRetentionFinance(),
    channels: createEmptyRetentionChannels()
  };
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        СТРУКТУРА JSON ДЛЯ ОТЧЕТА                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Создать структуру отчета для JSON
 */
function createReportJSON(activeMonths, retentionData) {
  const now = new Date();

  // ✅ Собираем UI-лейблы вкладок Finance (и опционально Channels) из Settings
  var ui = {};
  try {
    if (typeof getFinanceTabLabelsFromSheet_ === 'function') {
      ui.financeTabs = getFinanceTabLabelsFromSheet_();
    }
    // Если захочешь, можно добавить и channelTabs:
    // if (typeof getChannelTabLabelsFromSheet_ === 'function') {
    //   ui.channelTabs = getChannelTabLabelsFromSheet_();
    // }
  } catch (e) {
    Logger.log('[createReportJSON] UI labels error: ' + e);
    ui = {};
  }

  // ★ ДОБАВЛЕНО: Получаем базовые месяцы
  var baseMonths = {
    finance: null,
    channels: null
  };
  try {
    if (typeof getBaseMonthFinance === 'function') {
      baseMonths.finance = getBaseMonthFinance();
    }
    if (typeof getBaseMonthChannels === 'function') {
      baseMonths.channels = getBaseMonthChannels();
    }
    Logger.log('[createReportJSON] Base months: finance=' + baseMonths.finance + ', channels=' + baseMonths.channels);
  } catch (e) {
    Logger.log('[createReportJSON] Base months error: ' + e.message);
  }

  const report = {
    project: "RETENZA",
    reportTitle: "Retention Dashboard",
    description: "Аналитика ретеншена по месяцам",
    generatedAt: now.toISOString(),
    periodsCount: activeMonths.length,
    periods: [],
    ui: ui,  // 🔥 ВАЖНО: сюда кладём ui
    // ✅ ДОБАВЛЕНО: локализация
    localization: getLocalizationSettings(),
    baseMonths: baseMonths,  // ★ ДОБАВЛЕНО
    summary: {
      totalDepositsCount: 0,
      totalDepositsAmount: 0,
      totalProfit: 0
    }
  };

  activeMonths.forEach(function(month, index) {
    var period = createPeriodData(month, index, retentionData);
    report.periods.push(period);

    period.cards.forEach(function(card) {
      if (card.id === 'total_deposits_count') {
        report.summary.totalDepositsCount += card.value || 0;
      } else if (card.id === 'total_deposits_amount') {
        report.summary.totalDepositsAmount += card.value || 0;
      } else if (card.id === 'total_profit') {
        report.summary.totalProfit += card.value || 0;
      }
    });
  });

  return report;
}

/**
 * Создать данные для одного периода
 */
function createPeriodData(month, index, retentionData) {
  var finance = retentionData.finance;
  var channels = retentionData.channels;

  var label = month.name || (capitalizeFirstLetter(month.nameOnly || '') + ' ' + (month.year || '')).trim();

  var period = {
    key: month.key || (month.year + '-' + String(month.monthNum).padStart(2, '0')),
    label: label,
    enabled: month.enabled !== false && month.enabled !== 'OFF' && month.enabled !== 0,
    cards: [],
    channelCards: {},
    hasFinance: month.roleSheets && !!month.roleSheets.finance,
    hasChannels: month.roleSheets && !!month.roleSheets.channels
  };

  console.log('[DataModel] Period created:', label, 'enabled:', period.enabled, 'source month.enabled:', month.enabled);

  var financeIndex = finance.months.indexOf(month.name);
  var channelsIndex = channels.months.indexOf(month.name);

  // Finance cards — из DataModel_Finance.js
  period.cards = period.hasFinance && financeIndex !== -1
    ? createFinanceCards(finance, financeIndex, month.key) // ✅ передаём periodKey (YYYY-MM)
    : [];

  // Channel cards — из DataModel_Channels.js
  period.channelCards = period.hasChannels && channelsIndex !== -1
    ? createChannelCards(channels, channelsIndex)
    : createDisabledChannelCards(channels);

  period.totalChannels = calculateTotalChannelMetrics(period.channelCards);

  return period;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ                            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Получить значение из серии по индексу
 */
function getSeriesValue(series, index) {
  if (!series || !series.values || index >= series.values.length || index < 0) {
    return null;
  }
  var value = series.values[index];
  return value;
}

/**
 * Получить дельту из серии по индексу
 */
function getSeriesDiff(series, index) {
  if (!series || !series.diffs || index >= series.diffs.length || index < 0) {
    return '';
  }
  var diff = series.diffs[index];
  return (diff === null || diff === undefined) ? '' : diff;
}

/**
 * Делает первую букву заглавной
 */
function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getFinanceTabLabelsFromSheet_() {
  var res = {};
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName('Ret. FINANCE METRICS');
    if (!sheet) return res;

    var data = sheet.getDataRange().getDisplayValues();

    // Системные строки
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

      // Сначала пробуем известные секции
      var key = getFinanceSectionKey(name);

      // Если не нашли — проверяем, является ли строка секцией (ON/OFF паттерн)
      if (!key) {
        var hasOnOff = false;
        var allOnOff = true;
        var row = data[r] || [];
        for (var c = 1; c < Math.min(row.length, 15); c++) {
          var v = String(row[c] || '').trim().toUpperCase();
          if (v === 'ON' || v === 'OFF') { hasOnOff = true; }
          else if (v && v !== '') { allOnOff = false; }
        }

        if (hasOnOff && allOnOff) {
          // Это динамическая секция — генерируем ключ
          key = nameLower.replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_|_$/g, '');
          Logger.log('[getFinanceTabLabelsFromSheet_] Dynamic tab: "' + name + '" → ' + key);
        }
      }

      if (key && !res[key]) {
        res[key] = name;
      }
    }
  } catch (e) {
    Logger.log('[getFinanceTabLabelsFromSheet_] ERROR: ' + e);
  }

  Logger.log('[getFinanceTabLabelsFromSheet_] Result: ' + JSON.stringify(res));
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

      // normalizeChannelKeyForConfig() уже есть в MetricsConfigManager_Channels.js
      var key = normalizeChannelKeyForConfig(nameA);
      if (!key) continue;

      // Берём как есть из листа (например "App Push")
      if (!res[key]) res[key] = nameA;
    }
  } catch (e) {
    Logger.log('[getChannelTabLabelsFromSheet_] ERROR: ' + e);
  }
  return res;
}