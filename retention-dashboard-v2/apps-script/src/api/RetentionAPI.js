/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RETENTION API - Endpoints для React приложения
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Получить JSON данные Retention отчёта
 * @returns {Object} { periods, ui, localization, summary }
 */
function api_getRetentionReport() {
  try {
    Logger.log('[API] getRetentionReport called');
    
    // Инвалидируем кэш для актуальных данных
    invalidateMetricsConfigCache();
    
    // Получаем конфиг источника
    var sourceConfig = getSourceByKey('retention');
    
    // Получаем активные месяцы
    var activeMonths = getActiveMonthsForSource('retention');
    
    // Собираем данные (используем существующую логику)
    var retentionData = collectRetentionData(sourceConfig);
    
    // Создаём JSON отчёт
    var reportJSON = createReportJSON(activeMonths, retentionData);
    
    // Добавляем метаданные
    reportJSON.meta = {
      generatedAt: new Date().toISOString(),
      version: CONFIG.VERSION
    };
    
    Logger.log('[API] Report generated: ' + reportJSON.periodsCount + ' periods');
    
    // Возвращаем строку! React (в gasApi.js) её сам распарсит.
    // Это предотвращает потерю данных при передаче сложных объектов.
    return JSON.stringify(reportJSON);
    
  } catch (e) {
    Logger.log('[API] ERROR: ' + e.message);
    throw new Error('Failed to load retention data: ' + e.message);
  }
}

/**
 * Получить JSON данные Support отчёта
 * @returns {Object} { periods, kpi, tags, ... }
 */
function api_getSupportReport() {
  try {
    Logger.log('[API] getSupportReport called');
    
    // Получаем конфиг источника Support
    var sourceConfig = getSourceByKey('support');
    
    if (!sourceConfig) {
      Logger.log('[API] Support source not found, returning empty data');
      return JSON.stringify({ periods: [], error: 'Support source not configured' });
    }
    
    // Собираем данные Support (используем существующую функцию)
    var supportData = collectAllSupportPeriods(sourceConfig);
    
    Logger.log('[API] Support data generated: ' + (supportData.periods ? supportData.periods.length : 0) + ' periods');
    
    // Возвращаем строку JSON
    return JSON.stringify(supportData);
    
  } catch (e) {
    Logger.log('[API] getSupportReport ERROR: ' + e.message);
    return JSON.stringify({ 
      periods: [], 
      error: 'Failed to load support data: ' + e.message 
    });
  }
}

/**
 * Получить настройки UI (табы, лейблы)
 * @returns {Object} { financeTabs, channelTabs, showEmptyMetrics, disabledLabel }
 */
function api_getUISettings() {
  try {
    return JSON.stringify({
      financeTabs: getFinanceTabLabelsFromSheet_(),
      channelTabs: getChannelTabLabelsFromSheet_(),
      showEmptyMetrics: getShowEmptyMetrics(),
      disabledLabel: getDisabledMetricLabel(),
      autoCalcChannelTotals: getAutoCalcChannelTotals()
    });
  } catch (e) {
    Logger.log('[API] getUISettings error: ' + e.message);
    return JSON.stringify({
      financeTabs: {},
      channelTabs: {},
      showEmptyMetrics: false,
      disabledLabel: '—',
      autoCalcChannelTotals: true
    });
  }
}

/**
 * Получить список активных источников
 * @returns {Array} [{ key, name, template, icon, color }]
 */
function api_getSources() {
  try {
    var sources = getActiveDataSourcesV3();
    return JSON.stringify(sources.map(function(s) {
      return {
        key: s.key,
        name: s.name,
        template: s.template,
        icon: s.icon,
        color: s.color
      };
    }));
  } catch (e) {
    Logger.log('[API] getSources error: ' + e.message);
    return JSON.stringify([]);
  }
}

/**
 * API: Получить переводы
 */
function api_getTranslations() {
  try {
    return JSON.stringify(getTranslations());
  } catch (e) {
    Logger.log('[API] getTranslations error: ' + e.message);
    return JSON.stringify({ RU: {}, EN: {}, devMode: false });
  }
}

/**
 * API: Добавить пропущенные переводы
 */
function api_addMissingTranslations(missingKeysJson) {
  // Вызываем функцию из TranslationsManager.js
  return api_addMissingTranslations_internal(missingKeysJson);
}