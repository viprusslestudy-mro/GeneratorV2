/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  retentionApi.js - Маршрутизатор API
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { gasApi } from './gasApi';
// import { supabaseApi } from './supabaseApi'; // Временно отключили, пока делаем моки Support

export const retentionApi = {
  /**
   * Получить полный отчёт Retention
   */
  async getReport() {
    return gasApi.call('api_getRetentionReport');
  },

  /**
   * Получить отчёт Support
   */
  async getSupportReport() {
    return gasApi.call('api_getSupportReport');
  },

  /**
   * Настройки UI
   */
  async getUISettings() {
    return {
      financeTabs: { deposits: "ДЕПОЗИТЫ", sport: "СПОРТ", casino: "КАЗИНО", profit: "ПРОФИТ И БОНУСЫ" },
      channelTabs: { mail: "E-mail", push: "App Push", sms: "SMS", tg: "Telegram" }
    };
  }
};
