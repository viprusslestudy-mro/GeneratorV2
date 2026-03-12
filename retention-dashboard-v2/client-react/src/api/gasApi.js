/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  gasApi.js - Обертка над google.script.run с поддержкой Embedded режима
 *  Путь: client-react/src/api/gasApi.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

class GASApi {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    
    // Проверяем Embedded режим (данные встроены в HTML при экспорте)
    this.isEmbeddedMode = typeof window !== 'undefined' && window.__EMBEDDED_MODE__ === true;
    
    if (this.isEmbeddedMode) {
      console.log('[GASApi] 📦 Embedded Mode: using pre-loaded data');
    }
  }

  /**
   * Маппинг имён функций на ключи в __EMBEDDED_DATA__
   */
  getEmbeddedDataKey(functionName) {
    const mapping = {
      'api_getRetentionReport': 'retentionReport',
      'api_getSupportReport': 'supportReport',
      'api_getUISettings': 'uiSettings',
      'api_getTranslations': 'translations',
      'api_getSources': 'sources'
    };
    return mapping[functionName] || null;
  }

  /**
   * Вызвать серверную функцию Google Apps Script
   * @param {string} functionName - имя функции (напр. 'api_getRetentionReport')
   * @param {...any} args - аргументы для функции
   * @returns {Promise}
   */
  async call(functionName, ...args) {
    // 1. Embedded режим - данные уже встроены в HTML
    if (this.isEmbeddedMode) {
      return this.embeddedCall(functionName);
    }
    
    // 2. Проверяем наличие google.script.run
    const hasGoogleScript = typeof google !== 'undefined' && google?.script?.run;

    // 3. Локальная разработка или браузер без GAS
    if (!hasGoogleScript) {
      console.log(`[GASApi] 🖥️ Local Browser Mode: using mock for ${functionName}`);
      return this.mockCall(functionName, ...args);
    }

    // 4. Реальный вызов GAS
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
   * Получение данных из встроенного объекта (Embedded режим)
   */
  async embeddedCall(functionName) {
    const dataKey = this.getEmbeddedDataKey(functionName);
    
    if (!dataKey) {
      console.warn(`[GASApi Embedded] Unknown function: ${functionName}`);
      return null;
    }
    
    const data = window.__EMBEDDED_DATA__?.[dataKey];
    
    if (data === undefined) {
      console.warn(`[GASApi Embedded] No data for: ${dataKey}`);
      return null;
    }
    
    console.log(`[GASApi] 📦 Embedded: loaded ${functionName}`);
    
    // Имитируем небольшую задержку для плавности UI
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return data;
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