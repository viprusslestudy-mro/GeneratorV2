/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  supabaseApi.js - Прямое подключение к базе данных
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ЗАМЕНИ НА СВОИ РЕАЛЬНЫЕ ДАННЫЕ ИЗ НАСТРОЕК SUPABASE (Settings -> API)
const SUPABASE_URL = 'https://rbtnrwdaococoveuwags.supabase.co'; // Например: 'https://qwertyuiop.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidG5yd2Rhb2NvY292ZXV3YWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mzg3OTMsImV4cCI6MjA4ODQxNDc5M30.1ONtWm1TEaCOfrrKcmrCJoItc_S8ZV-eAYfA639Xvdg';

export const supabaseApi = {
  /**
   * Получить последний сохраненный отчет Retention (из настоящей базы!)
   */
  async getRetentionReport() {
    console.log('[Supabase] Запрашиваю данные Retention...');
    
    try {
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
        throw new Error('Данные Retention не найдены в базе. Запусти экспорт из Google Sheets.');
      }

      console.log('[Supabase] ✅ Данные Retention успешно загружены!');
      return rows[0].data;
      
    } catch (error) {
      console.error('[Supabase] ❌ Ошибка Retention:', error);
      throw error;
    }
  },

  /**
   * Получить последний сохраненный отчет Support
   * (Пока возвращаем мок, так как экспорт Support-данных в базу мы еще не написали)
   */
  async getSupportReport() {
    console.log('[Supabase] Запрашиваю данные Support (пока используем мок)...');
    
    try {
      // Эмулируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(`/mocks/api_getSupportReport.json`);
      if (!response.ok) {
        throw new Error('Файл мока Support не найден!');
      }
      
      const data = await response.json();
      console.log('[Supabase] ✅ Моковые данные Support успешно загружены!');
      return data;
    } catch (error) {
      console.error('[Supabase] ❌ Ошибка загрузки мока Support:', error);
      throw error;
    }
  }
};
