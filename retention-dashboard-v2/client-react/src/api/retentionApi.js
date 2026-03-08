/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  retentionApi.js - Маршрутизатор API
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { supabaseApi } from './supabaseApi';
// import { gasApi } from './gasApi'; // Оставляем закомментированным для истории

export const retentionApi = {
  /**
   * Получить полный отчёт Retention (из настоящей базы)
   */
  async getReport() {
    return supabaseApi.getRetentionReport();
  },

  /**
   * Получить отчёт Support (пока из мока через supabaseApi)
   */
  async getSupportReport() {
    return supabaseApi.getSupportReport();
  },

  /**
   * Настройки UI (Хардкодим, чтобы не делать лишний запрос в БД)
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
        webpush: "Web-Push",
        sms: "SMS",
        tg: "Telegram",
        wa: "WhatsApp",
        popup: "Pop-Up"
      }
    };
  }
};
