/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  gasApi.js - Обертка над google.script.run
 * ═══════════════════════════════════════════════════════════════════════════
 */

class GASApi {
  constructor() {
    // В Vite импорт `import.meta.env.DEV` указывает, запущен ли проект локально
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Вызвать серверную функцию Google Apps Script
   * @param {string} functionName - имя функции (напр. 'api_getRetentionReport')
   * @param {...any} args - аргументы для функции
   * @returns {Promise}
   */
  async call(functionName, ...args) {
    // Проверяем наличие глобального объекта google.script.run
    const hasGoogleScript = typeof google !== 'undefined' && google?.script?.run;

    // Если мы НЕ в среде Google (например, просто открыли localhost в браузере)
    // ИЛИ мы принудительно хотим моки (можно раскомментить this.isDevelopment)
    if (!hasGoogleScript) {
      console.log(`[GASApi] 🖥️ Local Browser Mode: using mock for ${functionName}`);
      return this.mockCall(functionName, ...args);
    }

    console.log(`[GASApi] ☁️ GAS Mode: calling ${functionName}`);

    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result) => {
          console.log(`[GASApi] ✅ Success ${functionName}`);
          if (typeof result === 'string') {
            try {
              resolve(JSON.parse(result));
              return;
            } catch (e) {
              resolve(result);
              return;
            }
          }
          resolve(result);
        })
        .withFailureHandler((error) => {
          console.error(`[GASApi] ❌ Error in ${functionName}:`, error);
          reject(error);
        })
        [functionName](...args);
    });
  }

  /**
   * Загрузка моков при локальной разработке
   */
  async mockCall(functionName) {
    try {
      // Имитация сетевой задержки для реалистичности
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await fetch(`/mocks/${functionName}.json`);
      if (!response.ok) {
        throw new Error(`Mock file not found: /mocks/${functionName}.json`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[GASApi Mock] Failed to load ${functionName}:`, error);
      throw error;
    }
  }
}

export const gasApi = new GASApi();