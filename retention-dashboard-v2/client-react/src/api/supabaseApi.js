/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  supabaseApi.js - Прямое подключение к базе данных
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SUPABASE_URL = 'https://rbtnrwdaococoveuwags.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidG5yd2Rhb2NvY292ZXV3YWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mzg3OTMsImV4cCI6MjA4ODQxNDc5M30.1ONtWm1TEaCOfrrKcmrCJoItc_S8ZV-eAYfA639Xvdg';


export const supabaseApi = {
  /**
   * Получить последний сохраненный отчет Retention
   */
  async getRetentionReport() {
    console.log('[Supabase] Запрашиваю данные...');
    
    try {
      // Делаем GET запрос. id=eq.retention_latest означает "Где ID равен retention_latest"
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/reports?id=eq.retention_latest&select=data`,
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const rows = await response.json();
      
      if (!rows || rows.length === 0) {
        throw new Error('Данные не найдены в базе. Запусти экспорт из Google Sheets.');
      }

      console.log('[Supabase] ✅ Данные успешно загружены за миллисекунды!');
      
      // Supabase возвращает массив строк. Берем первую строку и из нее колонку 'data'
      return rows[0].data;
      
    } catch (error) {
      console.error('[Supabase] ❌ Ошибка:', error);
      throw error;
    }
  }
};
