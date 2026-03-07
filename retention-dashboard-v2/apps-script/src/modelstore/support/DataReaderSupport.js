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
      
      // ✅ ИСПРАВЛЕНИЕ: Копируем weeklyTotals в tags
      if (tagsData.weeklyTotals) {
        data.tags.weeklyTotals = tagsData.weeklyTotals;
        data.helpDesk.byWeek = tagsData.weeklyTotals;
      }
      
      // ✅ ИСПРАВЛЕНИЕ: Копируем даты из периода Tags (если они точнее)
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