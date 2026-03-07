/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  retentionApi.js - Маршрутизатор API
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { supabaseApi } from './supabaseApi';
// import { gasApi } from './gasApi'; // Google Apps Script нам пока больше не нужен!

export const retentionApi = {
  /**
   * Получить полный отчёт Retention
   */
  async getReport() {
    // Берем реальные данные из Supabase со скоростью света ⚡
    return supabaseApi.getRetentionReport();
  },

  /**
   * Настройки UI (Временно возвращаем захардкоженные, чтобы не делать лишних запросов)
   */
  async getUISettings() {
    return {
      financeTabs: {
        deposits: "ДЕПОЗИТЫ",
        sport: "СПОРТ",
        casino: "КАЗИНО",
        profit: "ПРОФИТ И БОНУСЫ"
      },
      channelTabs: {
        mail: "E-mail",
        push: "App Push",
        sms: "SMS",
        tg: "Telegram"
      }
    };
  }
};
