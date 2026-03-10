/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Logger.js - Функции логирования системы
 * ═══════════════════════════════════════════════════════════════════════════
 */

function logInfo(message, details, funcName) {
  writeLog('ℹ️ INFO', message, details, funcName);
}

function logSuccess(message, details, funcName) {
  writeLog('✅ SUCCESS', message, details, funcName);
}

function logWarning(message, details, funcName) {
  writeLog('⚠️ WARNING', message, details, funcName);
}

function logError(message, details, funcName) {
  writeLog('❌ ERROR', message, details, funcName);
}

function writeLog(type, message, details, funcName) {
  var logStr = '[' + type + '] ' + (funcName ? '(' + funcName + ') ' : '') + message + ' | ' + (details || '');
  Logger.log(logStr);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    
    var sheet = ss.getSheetByName('LOGS') || ss.getSheetByName('Логи');
    if (sheet) {
      // Если лист логов существует, записываем туда
      sheet.appendRow([new Date(), type, String(message), String(details || ''), String(funcName || '')]);
    }
  } catch (e) {
    // Игнорируем ошибки при записи логов (например, если нет доступа)
  }
}
