/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SourceUtils.js — Утилиты для работы с источниками данных
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Получить ID таблицы для источника по ключу
 * @param {string} sourceKey - 'retention', 'support', etc.
 * @returns {string|null} - ID таблицы или null
 */
function getSpreadsheetIdForSource(sourceKey) {
  try {
    const sources = getActiveDataSourcesV3();
    const keyLower = sourceKey.toLowerCase();
    
    const source = sources.find(function(s) {
      return s.key === keyLower || 
             s.name.toLowerCase() === keyLower ||
             (keyLower === 'support' && s.template === 'Support') ||
             (keyLower === 'retention' && s.template === 'Retention');
    });
    
    if (source && source.spreadsheetId) {
      Logger.log('[getSpreadsheetIdForSource] ' + sourceKey + ' → ' + source.spreadsheetId);
      return source.spreadsheetId;
    }
    
    Logger.log('[getSpreadsheetIdForSource] Source not found: ' + sourceKey);
    return null;
    
  } catch (e) {
    Logger.log('[getSpreadsheetIdForSource] Error: ' + e.message);
    return null;
  }
}

/**
 * Получить ID таблицы Support
 * @returns {string} - ID таблицы
 */
function getSupportSpreadsheetId() {
  const id = getSpreadsheetIdForSource('support');
  if (id) return id;
  
  // Fallback на константу
  if (typeof SUPPORT_CONFIG !== 'undefined' && SUPPORT_CONFIG.SPREADSHEET_ID) {
    return SUPPORT_CONFIG.SPREADSHEET_ID;
  }
  
  // Последний fallback
  return '1dZuMm0NDwigtUWHkZ2KRukZU_ljIMdVEnfdeeQOzhjs';
}

/**
 * Получить ID таблицы Retention
 * @returns {string} - ID таблицы
 */
function getRetentionSpreadsheetId() {
  const id = getSpreadsheetIdForSource('retention');
  if (id) return id;
  
  // Fallback
  if (typeof CONFIG !== 'undefined' && CONFIG.SOURCE_SPREADSHEET_ID) {
    return CONFIG.SOURCE_SPREADSHEET_ID;
  }
  
  return '1e-Z4_bvD9v8Ki7nXfUfDA5hO-m-tN0n_Ps9EJpGPQKQ';
}