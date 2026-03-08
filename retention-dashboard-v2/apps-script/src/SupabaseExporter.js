/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SupabaseExporter.js - Отправка данных из Google Sheets в Supabase
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ВСТАВЬ СВОИ РЕАЛЬНЫЕ КЛЮЧИ!
const SUPABASE_URL = 'https://rbtnrwdaococoveuwags.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidG5yd2Rhb2NvY292ZXV3YWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mzg3OTMsImV4cCI6MjA4ODQxNDc5M30.1ONtWm1TEaCOfrrKcmrCJoItc_S8ZV-eAYfA639Xvdg';

/**
 * Отправка Retention
 */
function exportRetentionToSupabase() {
  Logger.log('[Supabase] Начинаем сбор данных Retention...');
  try {
    invalidateMetricsConfigCache();
    var sourceConfig = getSourceByKey('retention');
    var activeMonths = getActiveMonthsForSource('retention');
    var retentionData = collectRetentionData(sourceConfig);
    var reportJSON = createReportJSON(activeMonths, retentionData);

    reportJSON.meta = { generatedAt: new Date().toISOString(), version: CONFIG.VERSION };

    var payload = {
      id: 'retention_latest',
      project: 'SuperSpin',
      data: reportJSON,
      updated_at: new Date().toISOString()
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/reports?on_conflict=id', options);
    Logger.log('[Supabase] ✅ Retention успешно отправлен!');
  } catch (e) {
    Logger.log('[Supabase] ❌ Ошибка Retention: ' + e.message);
  }
}

/**
 * Отправка Support
 */
function exportSupportToSupabase() {
  Logger.log('[Supabase] Начинаем сбор данных Support...');
  try {
    var sourceConfig = getSourceByKey('support');

    // Получаем JSON отчет по саппорту (твоя стандартная функция)
    var reportJSON = collectAllSupportPeriods(sourceConfig);

    var payload = {
      id: 'support_latest', // УНИКАЛЬНЫЙ ID ДЛЯ САППОРТА
      project: 'SuperSpin',
      data: reportJSON,
      updated_at: new Date().toISOString()
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/reports?on_conflict=id', options);
    Logger.log('[Supabase] ✅ Support успешно отправлен!');
  } catch (e) {
    Logger.log('[Supabase] ❌ Ошибка Support: ' + e.message);
  }
}

/**
 * Отправить всё сразу (кнопка для меню, если нужно)
 */
function exportAllToSupabase() {
  exportRetentionToSupabase();
  exportSupportToSupabase();
}
