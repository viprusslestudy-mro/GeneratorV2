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
   * Получить последний сохраненный отчет Support (РЕАЛЬНАЯ БАЗА!)
   */
  async getSupportReport() {
    console.log('[Supabase] Запрашиваю данные Support...');
    
    try {
      // Идем в Supabase за ID = support_latest
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/reports?id=eq.support_latest&select=data`,
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
        throw new Error('Данные Support не найдены в базе. Запусти экспорт из Google Sheets.');
      }

      console.log('[Supabase] ✅ Данные Support успешно загружены!');
      return rows[0].data;
      
    } catch (error) {
      console.error('[Supabase] ❌ Ошибка Support:', error);
      throw error;
    }
  },

  /**
   * Получить переводы из базы данных
   */
  async getTranslations() {
    try {
      console.log(`[Supabase] 📥 Загрузка Переводов...`);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/report_cache?report_key=eq.translations&select=report_data`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}` 
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log(`[Supabase] ✅ Переводы успешно загружены!`);
        return data[0].report_data;
      }
      return null;
    } catch (error) {
      console.error('[Supabase] ❌ Ошибка загрузки Переводов:', error);
      return null;
    }
  }
};
