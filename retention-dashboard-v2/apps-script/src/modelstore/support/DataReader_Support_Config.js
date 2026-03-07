/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DataReader_Support_Config.js — Конфигурация, периоды, поиск листов
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SUPPORT_CONFIG = {
  SPREADSHEET_ID: '12yYxA10pZZe7_2BNGjplkvOAS6D_PsUnMy7m1ygny3Y',
  SHEETS: {
    KPI_LIVECHAT: 'LiveChat - KPI LiveChat',
    TAGS_STATISTIC: 'LiveChat - Tags Statistic',
    HELPDESK: 'HelpDesk STATS'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  ПОИСК ЛИСТОВ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Короткое название месяца
 */
function getMonthShortName(monthNum) {
  const shorts = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return shorts[monthNum] || '';
}

/**
 * Найти лист по списку паттернов
 */
function findSheetByPattern(spreadsheetId, patterns) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheets = ss.getSheets();
    
    for (const pattern of patterns) {
      if (!pattern) continue;
      const patternLower = pattern.toLowerCase();
      
      const exactMatch = sheets.find(s => s.getName().toLowerCase() === patternLower);
      if (exactMatch) return exactMatch.getName();
      
      const partialMatch = sheets.find(s => s.getName().toLowerCase().includes(patternLower));
      if (partialMatch) return partialMatch.getName();
    }
    
    return null;
  } catch (e) {
    Logger.log(`[findSheetByPattern] Error: ${e.message}`);
    return null;
  }
}

/**
 * Получить имя листа KPI для периода
 */
function getKpiSheetName(ssId, period) {
  if (period.roleSheets && period.roleSheets.livechat) {
    return period.roleSheets.livechat;
  }
  
  const monthShort = getMonthShortName(period.monthNum);
  return findSheetByPattern(ssId, [
    `LiveChat - KPI - ${monthShort}`,
    `LiveChat - KPI LiveChat - ${monthShort}`,
    `LiveChat - KPI - ${period.monthName}`,
    `KPI - ${monthShort}`,
    SUPPORT_CONFIG.SHEETS.KPI_LIVECHAT
  ]);
}

/**
 * Получить имя листа Tags для периода
 */
function getTagsSheetName(ssId, period) {
  if (period.roleSheets && period.roleSheets.tags) {
    return period.roleSheets.tags;
  }
  
  const monthShort = getMonthShortName(period.monthNum);
  return findSheetByPattern(ssId, [
    `LiveChat - Tags Statistic - ${monthShort}`,
    `LiveChat - Tags - ${monthShort}`,
    `Tags Statistic - ${monthShort}`,
    `Tags - ${monthShort}`,
    SUPPORT_CONFIG.SHEETS.TAGS_STATISTIC
  ]);
}