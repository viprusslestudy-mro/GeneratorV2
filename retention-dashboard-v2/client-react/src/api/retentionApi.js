import { gasApi } from './gasApi';

/**
 * API для работы с Retention данными
 */
export const retentionApi = {
  /**
   * Получить полный отчёт Retention
   */
  async getReport() {
    return gasApi.call('api_getRetentionReport');
  },

  /**
   * Получить настройки UI
   */
  async getUISettings() {
    return gasApi.call('api_getUISettings');
  },

  /**
   * Получить список источников
   */
  async getSources() {
    return gasApi.call('api_getSources');
  }
};
