/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  supabaseApi.js - Прямое подключение к базе данных
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ЗАМЕНИ НА СВОИ РЕАЛЬНЫЕ ДАННЫЕ ИЗ НАСТРОЕК SUPABASE (Settings -> API)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_TABLE = import.meta.env.VITE_SUPABASE_TABLE || 'reports'; // <-- ДОБАВЛЕНО

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
      console.log(`[Supabase] 📥 Загрузка Переводов из таблицы ${SUPABASE_TABLE}...`);
      
      // ИЩЕМ по колонке id (значение translations_latest), берем колонку data
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.translations_latest&select=data`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}` 
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const jsonResponse = await response.json();
      
      if (jsonResponse && jsonResponse.length > 0 && jsonResponse[0].data) {
        console.log(`[Supabase] ✅ Переводы успешно загружены!`);
        return jsonResponse[0].data;
      }
      return null;
    } catch (error) {
      console.error('[Supabase] ❌ Ошибка загрузки Переводов:', error);
      return null;
    }
  }
};
