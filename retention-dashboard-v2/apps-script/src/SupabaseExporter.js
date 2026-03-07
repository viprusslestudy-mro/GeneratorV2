/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SupabaseExporter.js - Отправка данных из Google Sheets в Supabase
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SUPABASE_URL = 'https://rbtnrwdaococoveuwags.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidG5yd2Rhb2NvY292ZXV3YWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mzg3OTMsImV4cCI6MjA4ODQxNDc5M30.1ONtWm1TEaCOfrrKcmrCJoItc_S8ZV-eAYfA639Xvdg';

/**
 * Собирает Retention отчет и отправляет его в базу данных
 */
function exportRetentionToSupabase() {
  Logger.log('[Supabase] Начинаем сбор данных...');

  try {
    // 1. Собираем данные (занимает 1-2 минуты)
    invalidateMetricsConfigCache();
    var sourceConfig = getSourceByKey('retention');
    var activeMonths = getActiveMonthsForSource('retention');
    var retentionData = collectRetentionData(sourceConfig);
    var reportJSON = createReportJSON(activeMonths, retentionData);

    reportJSON.meta = {
      generatedAt: new Date().toISOString(),
      version: CONFIG.VERSION
    };

    Logger.log('[Supabase] Данные собраны. Отправляем в базу...');

    // 2. Формируем тело запроса для БД
    var payload = {
      id: 'retention_latest', // Уникальный ID отчета
      project: 'SuperSpin',
      data: reportJSON,
      updated_at: new Date().toISOString()
    };

    // 3. Настраиваем POST запрос
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'resolution=merge-duplicates' // Если ID существует -> обновляем (Upsert)
      },
      payload: JSON.stringify(payload)
    };

    // 4. Отправляем запрос
    var url = SUPABASE_URL + '/rest/v1/reports?on_conflict=id';
    var response = UrlFetchApp.fetch(url, options);

    Logger.log('[Supabase] ✅ Успешно отправлено! Ответ БД: ' + response.getContentText());

  } catch (e) {
    Logger.log('[Supabase] ❌ Ошибка: ' + e.message);
  }
}.
