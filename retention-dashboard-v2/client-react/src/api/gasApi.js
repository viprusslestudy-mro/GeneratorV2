/**
 * Базовый wrapper для google.script.run
 * Превращает callback-based API в Promise-based
 */

class GASApi {
  constructor() {
    // Упрощённая логика: если DEV режим — используем моки
    this.isDevelopment = import.meta.env.DEV; // Vite встроенная переменная
  }

  /**
   * Вызвать серверную функцию
   * @param {string} functionName - имя функции в Apps Script
   * @param {...any} args - аргументы
   * @returns {Promise}
   */
  async call(functionName, ...args) {
    // В DEV режиме ВСЕГДА используем моки
    if (this.isDevelopment) {
      console.log(`[DEV MODE] Using mock for ${functionName}`);
      return this.mockCall(functionName, ...args);
    }

    // В production используем реальный API
    return new Promise((resolve, reject) => {
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
        throw new Error(`Mock not found: ${functionName}.json`);
      }
      const data = await response.json();
      console.log(`[MOCK] Loaded ${functionName}:`, data);
      return data;
    } catch (error) {
      console.error(`[MOCK ERROR] ${functionName}:`, error);
      throw error;
    }
  }
}

export const gasApi = new GASApi();
