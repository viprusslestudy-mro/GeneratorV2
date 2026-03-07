/**
 * Базовый wrapper для google.script.run
 * Превращает callback-based API в Promise-based
 */

class GASApi {
  constructor() {
    this.isDevelopment = import.meta.env.VITE_DEV_MODE === 'true';
    this.useMocks = import.meta.env.VITE_MOCK_API === 'true';
  }

  /**
   * Вызвать серверную функцию
   * @param {string} functionName - имя функции в Apps Script
   * @param {...any} args - аргументы
   * @returns {Promise}
   */
  async call(functionName, ...args) {
    if (this.isDevelopment && this.useMocks) {
      return this.mockCall(functionName, ...args);
    }

    return new Promise((resolve, reject) => {
      // Проверяем наличие google.script.run
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run недоступен. Запустите в Google Apps Script.'));
        return;
      }

      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](...args);
    });
  }

  /**
   * Моки для разработки (без Apps Script)
   */
  async mockCall(functionName, ...args) {
    console.log(`[MOCK] ${functionName}(${JSON.stringify(args)})`);
    
    // Эмулируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Загружаем моки из /public/mocks/
    try {
      const response = await fetch(`/mocks/${functionName}.json`);
      if (!response.ok) {
        throw new Error(`Mock not found: ${functionName}`);
      }
      return response.json();
    } catch (error) {
      console.error(`[MOCK ERROR] ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Инвалидация кэша (для force refresh)
   */
  clearCache() {
    // Можно добавить кэширование позже
  }
}

export const gasApi = new GASApi();
