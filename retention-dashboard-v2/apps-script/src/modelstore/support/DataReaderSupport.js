/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DataReader_Support.js — Главный оркестратор сбора данных Support
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *  Зависимости:
 *    - DataModel_Support.js (модели)
 *    - DataReader_Support_Config.js (конфиг, периоды, поиск листов)
 *    - DataReader_Support_KPI.js (чтение KPI)
 *    - DataReader_Support_Tags.js (чтение Tags + HelpDesk)
 *    - DataReader_Support_Utils.js (утилиты, диагностика)
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  НОВЫЙ СБОРЩИК SUPPORT ДЛЯ REACT & SUPABASE
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Собрать данные Support для выбранного периода
 * @param {Object} sourceConfig - Конфигурация источника (опционально)
 * @param {string} requestedPeriodKey - Период "YYYY-MM" (опционально)
 */
function collectSupportData(sourceConfig, requestedPeriodKey) {
  const data = createEmptySupportData();
  
  try {
    // Получаем ID из настроек или fallback
    let ssId;
    if (sourceConfig && sourceConfig.spreadsheetId) {
      ssId = sourceConfig.spreadsheetId;
    } else {
      ssId = getSupportSpreadsheetId();
    }
    
    Logger.log(`[collectSupportData] Starting. Spreadsheet: ${ssId}`);
    Logger.log(`[collectSupportData] Requested period: ${requestedPeriodKey || '(auto)'}`);
    
    // 1. Получаем периоды (ВАЖНО: сохраняем флаги hasKPI и hasTags!)
    const activePeriods = getActivePeriodsForSupport();
    data.availablePeriods = activePeriods.map(function(p) {
      return { 
        label: p.label, 
        key: p.key,
        hasKPI: p.hasKPI === true,
        hasTags: p.hasTags === true
      };
    });

    Logger.log('[collectSupportData] Periods with flags: ' + JSON.stringify(data.availablePeriods));
    
    Logger.log(`[collectSupportData] Found ${activePeriods.length} periods`);
    
    // 2. Выбираем период
    let currentPeriod;
    
    if (requestedPeriodKey) {
      currentPeriod = activePeriods.find(p => p.key === requestedPeriodKey);
    }
    
    if (!currentPeriod && activePeriods.length > 0) {
      currentPeriod = activePeriods[0];
    }
    
    if (!currentPeriod) {
      currentPeriod = getDefaultPeriod();
    }
    
    Logger.log(`[collectSupportData] Using period: ${currentPeriod.label}`);
    
    data.period = {
      label: currentPeriod.label,
      key: currentPeriod.key,
      monthNum: currentPeriod.monthNum,
      year: currentPeriod.year
    };
    
    // 3. Определяем листы
    const kpiSheetName = getKpiSheetName(ssId, currentPeriod);
    const tagsSheetName = getTagsSheetName(ssId, currentPeriod);
    const helpdeskSheetName = (currentPeriod.roleSheets && currentPeriod.roleSheets.helpdesk) 
      || SUPPORT_CONFIG.SHEETS.HELPDESK;

    Logger.log(`[collectSupportData] Sheets: KPI="${kpiSheetName}", Tags="${tagsSheetName}"`);

    // 4. Читаем Tags
    if (tagsSheetName) {
      const tagsData = readTagsStatisticSmart(currentPeriod, ssId, tagsSheetName);
      data.tags = tagsData.tags;
      
      // ИСПРАВЛЕНИЕ: Копируем weeklyTotals в tags
      if (tagsData.weeklyTotals) {
        data.tags.weeklyTotals = tagsData.weeklyTotals;
        data.helpDesk.byWeek = tagsData.weeklyTotals;
      }
      
      // ИСПРАВЛЕНИЕ: Копируем даты из периода Tags (если они точнее)
      if (tagsData.period) {
        if (tagsData.period.startDate && tagsData.period.endDate) {
          data.period.startDate = tagsData.period.startDate;
          data.period.endDate = tagsData.period.endDate;
        }
        // Копируем monthNum и year если есть
        if (tagsData.period.monthNum) {
          data.period.monthNum = tagsData.period.monthNum;
        }
        if (tagsData.period.year) {
          data.period.year = tagsData.period.year;
        }
      }
      
      Logger.log('[collectSupportData] Tags weeklyTotals: ' + JSON.stringify(data.tags.weeklyTotals));
    }
    
    // 5. Читаем KPI
    if (kpiSheetName) {
      data.liveChat = readLiveChatKPI(ssId, kpiSheetName, data.period);
    }
    
    // 6. Читаем HelpDesk
    data.helpDesk = Object.assign(data.helpDesk, readHelpDeskStats(ssId, helpdeskSheetName));
    
    // Собираем список локалей для UI
    var allLocales = [];
    var localeSet = {};
    
    // Из KPI
    if (data.liveChat && data.liveChat.byLocale) {
      Object.keys(data.liveChat.byLocale).forEach(function(loc) {
        if (!localeSet[loc]) {
          localeSet[loc] = true;
          allLocales.push(loc);
        }
      });
    }
    
    // Из Tags
    if (data.tags && data.tags.byGeo) {
      Object.keys(data.tags.byGeo).forEach(function(loc) {
        if (!localeSet[loc]) {
          localeSet[loc] = true;
          allLocales.push(loc);
        }
      });
    }
    
    data.locales = allLocales;
    Logger.log('[collectSupportData] Locales: ' + allLocales.join(', '));
    
    Logger.log(`[collectSupportData] Done. Chats: ${data.liveChat.totalChats}`);
    
  } catch (e) {
    Logger.log(`[collectSupportData] Error: ${e.message}`);
    Logger.log(e.stack);
  }
  return data;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  НОВЫЙ СБОРЩИК SUPPORT ДЛЯ REACT & SUPABASE
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Собирает данные по ВСЕМ активным месяцам Support в один большой JSON.
 * @param {Object} sourceConfig - Конфигурация источника из Мастера
 * @returns {Object} { availablePeriods: [...], byPeriod: { "2026-01": {...}, "2026-02": {...} } }
 */
function collectAllSupportPeriods(sourceConfig) {
  Logger.log('[collectAllSupportPeriods] Starting. Spreadsheet ID: ' + (sourceConfig ? sourceConfig.spreadsheetId : 'default'));
  
  var periods = getActivePeriodsForSupport();
  
  if (!periods || periods.length === 0) {
    Logger.log('[collectAllSupportPeriods] No active periods found in Master Table.');
    return { availablePeriods: [], byPeriod: {} };
  }

  // Сортируем: старые периоды первыми (Январь -> Февраль)
  periods.sort(function(a, b) {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNum - b.monthNum;
  });

  var result = {
    availablePeriods: periods.map(function(p) {
      return {
        label: p.label,
        key: p.key,
        hasKPI: p.hasKPI,
        hasTags: p.hasTags
      };
    }),
    byPeriod: {}
  };

  // Открываем таблицу-источник Support один раз, чтобы не дергать API гугла постоянно
  var ss;
  try {
    ss = SpreadsheetApp.openById(sourceConfig.spreadsheetId);
  } catch (e) {
    throw new Error('Не удалось открыть таблицу Support (ID: ' + sourceConfig.spreadsheetId + '): ' + e.message);
  }

  // Собираем данные для каждого включенного месяца
  periods.forEach(function(period) {
    Logger.log('[collectAllSupportPeriods] --------- Processing Period: ' + period.label + ' ---------');
    
    var periodData = {
      period: {
        label: period.label,
        monthNum: period.monthNum,
        year: period.year,
        key: period.key
      },
      liveChat: null,
      tags: null
    };

    // 1. Читаем LiveChat KPI
    if (period.hasKPI) {
      var kpiSheetName = period.roleSheets.livechat || findSupportSheetSmart(ss, 'LiveChat - KPI', period);
      var kpiSheet = kpiSheetName ? ss.getSheetByName(kpiSheetName) : null;
      
      if (kpiSheet) {
        Logger.log('[collectAllSupportPeriods] Reading KPI from sheet: "' + kpiSheetName + '"');
        periodData.liveChat = readLiveChatKPI(kpiSheet); // Твоя старая функция из DataReader_Support_KPI.js
      } else {
        Logger.log('[collectAllSupportPeriods] KPI Sheet not found for ' + period.label);
      }
    }

    // 2. Читаем Tags Analytics
    if (period.hasTags) {
      var tagsSheetName = period.roleSheets.tags || findSupportSheetSmart(ss, 'Tags Statistic', period);
      var tagsSheet = tagsSheetName ? ss.getSheetByName(tagsSheetName) : null;
      
      if (tagsSheet) {
        Logger.log('[collectAllSupportPeriods] Reading Tags from sheet: "' + tagsSheetName + '"');
        periodData.tags = readTagsStatistic(tagsSheet); // Твоя старая функция из DataReader_Support_Tags.js
      } else {
        Logger.log('[collectAllSupportPeriods] Tags Sheet not found for ' + period.label);
      }
    }

    result.byPeriod[period.key] = periodData;
    Logger.log('[collectAllSupportPeriods] Finished processing ' + period.label);
  });

  return result;
}

/**
 * Умный поиск листа (если имя не задано жестко в настройках)
 */
function findSupportSheetSmart(ss, prefix, period) {
  var sheets = ss.getSheets();
  
  // Ищем точное совпадение: "LiveChat - KPI - Январь"
  var exactName = prefix + ' - ' + period.monthName.charAt(0).toUpperCase() + period.monthName.slice(1);
  var exactSheet = ss.getSheetByName(exactName);
  if (exactSheet) return exactName;
  
  // Ищем английское совпадение: "LiveChat - KPI - Jan"
  var engMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var engName = prefix + ' - ' + engMonths[period.monthNum - 1];
  var engSheet = ss.getSheetByName(engName);
  if (engSheet) return engName;

  return null;
}

/**
 * Серверная функция для переключения периода Support (вызывается из UI Shell)
 * @param {string} periodKey - Ключ периода (YYYY-MM)
 * @returns {Object} - Полный reportJSON для Support
 */
function collectSupportDataForPeriod(periodKey) {
  Logger.log('[collectSupportDataForPeriod] Requested period: ' + periodKey);
  
  try {
    var sources = getActiveDataSourcesV3();
    var supportSource = sources.find(function(s) { return s.template === 'Support'; }) || null;
    
    var supportData = collectSupportData(supportSource, periodKey);
    var reportJSON = createSupportReportJSON(supportData);
    
    Logger.log('[collectSupportDataForPeriod] Success. Period: ' + reportJSON.period.label + 
               ', Chats: ' + (reportJSON.liveChat ? reportJSON.liveChat.totalChats : 0));
    
    return reportJSON;
  } catch (e) {
    Logger.log('[collectSupportDataForPeriod] Error: ' + e.message);
    Logger.log(e.stack);
    throw new Error('Не удалось загрузить данные за период ' + periodKey + ': ' + e.message);
  }
}

/**
 * Серверная функция для генерации HTML секции Support
 * Вызывается из rebuildSupportSection() в Shell
 * @param {string} tabType - 'stats' или 'tags'
 * @returns {string} HTML фрагмент
 */
function buildSupportSectionHTML(tabType) {
  Logger.log('[buildSupportSectionHTML] Building HTML for tab: ' + tabType);
  
  try {
    var sources = getActiveDataSourcesV3();
    var supportSource = sources.find(function(s) { return s.template === 'Support'; }) || null;
    
    // Используем текущие данные из последнего запроса
    var supportData = collectSupportData(supportSource);
    var reportJSON = createSupportReportJSON(supportData);
    
    var html = buildSupportBody(reportJSON, tabType, true);
    
    Logger.log('[buildSupportSectionHTML] Done. HTML length: ' + html.length);
    return html;
  } catch (e) {
    Logger.log('[buildSupportSectionHTML] Error: ' + e.message);
    return '<div style="padding:24px;text-align:center;color:#dc2626;">Ошибка: ' + e.message + '</div>';
  }
}

/**
 * Собрать данные Support для ВСЕХ активных периодов
 * Используется в buildAppShell для предзагрузки
 * 
 * @param {Object} sourceConfig - Конфигурация источника
 * @returns {Object} { currentReport: reportJSON, byPeriod: { 'YYYY-MM': reportJSON, ... } }
 */
function collectAllSupportPeriods(sourceConfig) {
  Logger.log('[collectAllSupportPeriods] Starting...');
  
  var result = {
    currentReport: null,
    byPeriod: {}
  };
  
  try {
    // Получаем все активные периоды
    var activePeriods = getActivePeriodsForSupport();
    Logger.log('[collectAllSupportPeriods] Found ' + activePeriods.length + ' periods');
    
    if (activePeriods.length === 0) {
      // Нет периодов — возвращаем пустые данные
      var emptyData = collectSupportData(sourceConfig, null);
      result.currentReport = createSupportReportJSON(emptyData);
      return result;
    }
    
    // Собираем данные для каждого периода
    activePeriods.forEach(function(period, index) {
      Logger.log('[collectAllSupportPeriods] Loading period ' + (index + 1) + '/' + activePeriods.length + ': ' + period.label);
      
      try {
        var periodData = collectSupportData(sourceConfig, period.key);
        var periodReport = createSupportReportJSON(periodData);
        
        // Сохраняем по ключу
        result.byPeriod[period.key] = periodReport;
        
        // Первый период — текущий по умолчанию
        if (index === 0) {
          result.currentReport = periodReport;
        }
        
        Logger.log('[collectAllSupportPeriods] Period ' + period.key + ': ' + 
                   (periodReport.liveChat ? periodReport.liveChat.totalChats : 0) + ' chats');
                   
      } catch (periodError) {
        Logger.log('[collectAllSupportPeriods] Error loading period ' + period.key + ': ' + periodError.message);
        // Создаём пустой отчёт для этого периода
        result.byPeriod[period.key] = createSupportReportJSON(createEmptySupportData());
      }
    });
    
    // Если currentReport не установлен — берём первый из byPeriod
    if (!result.currentReport) {
      var keys = Object.keys(result.byPeriod);
      if (keys.length > 0) {
        result.currentReport = result.byPeriod[keys[0]];
      } else {
        result.currentReport = createSupportReportJSON(createEmptySupportData());
      }
    }
    
    Logger.log('[collectAllSupportPeriods] Done. Loaded ' + Object.keys(result.byPeriod).length + ' periods');
    
  } catch (e) {
    Logger.log('[collectAllSupportPeriods] Error: ' + e.message);
    Logger.log(e.stack);
    
    // Fallback — пустые данные
    result.currentReport = createSupportReportJSON(createEmptySupportData());
  }
  
  return result;
}