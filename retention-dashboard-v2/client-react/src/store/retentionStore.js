/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  retentionStore.js - Store для управления данными Retention
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { retentionApi } from '../api/retentionApi';

export const useRetentionStore = create(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════
      // STATE
      // ═══════════════════════════════════════════════════════════════
      data: null, // Retention Data
      supportData: null, // Support Data
      supportPeriodsCache: [], // <-- ДОБАВЛЕНО
      sources: [], // <-- ДОБАВЛЕНО: Храним активные источники
      loading: false,
      error: null,
      selectedPeriod: null,
      selectedSupportPeriod: null, // Отдельно для Support
      
      // ДОБАВЛЕНО: Текущий язык (по умолчанию из настроек браузера или RU)
      language: 'RU',

      // Dev Mode для поиска непереведённых фраз
      devMode: false,
      missingTranslations: new Set(), // Используем Set для уникальности
      currentScreen: 'finance', // Текущая активная вкладка

      translations: { RU: {}, EN: {} }, // <-- ДОБАВЛЕНО

      projectSettings: {
        name: 'SuperSpin',
        // ВАЖНО: Вставили твою реальную ссылку на логотип!
        logoUrl: 'https://userimg-assets-eu.customeriomail.com/images/client-env-203844/1772793965054_Frame%202135561153%20(2)_01KK1C2ANEP1JRTVV437FZ913S.png',
        icon: '🎰'
      },

      // ═══════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════
      fetchData: async () => {
        set({ loading: true, error: null });
        
        try {
          // ИСПРАВЛЕНО: Добавили получение источников
          const [retentionData, supportData, translationsData, sourcesData] = await Promise.all([
            retentionApi.getReport(),
            retentionApi.getSupportReport(),
            retentionApi.getTranslations(),
            retentionApi.getSources() // Вызов нового API
          ]);
          
          console.log('[Store] Fetched translationsData:', translationsData); // <-- ЛОГИРУЕМ ЧТО ПРИШЛО
          
          console.log('[Store] Fetched sources:', sourcesData);
          
          // Вытаскиваем переводы. Иногда они могут быть обернуты еще в один объект (зависит от того, как парсится JSON)
          let actualTranslations = { RU: {}, EN: {} };
          let devMode = false;

          if (translationsData) {
            devMode = translationsData.devMode === true || translationsData.devMode === 'true';
            
            // Если структура { RU: {...}, EN: {...} }
            if (translationsData.RU) {
              actualTranslations = {
                RU: translationsData.RU || {},
                EN: translationsData.EN || {}
              };
            } 
            // Если структура { translations: { RU: {...}, EN: {...} } } (бывает при миграции старого кода)
            else if (translationsData.translations && translationsData.translations.RU) {
              actualTranslations = {
                RU: translationsData.translations.RU || {},
                EN: translationsData.translations.EN || {}
              };
            }
          }
          
          console.log('[Store] Processed translations:', actualTranslations); // <-- ЛОГИРУЕМ ЧТО ИДЕТ В СТЕЙТ
          
          // Добавляем переводы в retentionData (для обратной совместимости старых компонентов)
          if (retentionData) {
            if (!retentionData.localization) retentionData.localization = {};
            retentionData.localization.translations = actualTranslations;
          }
          
          // 1. ПЕРЕВОРАЧИВАЕМ ПЕРИОДЫ RETENTION (Новые сверху)
          if (retentionData && retentionData.periods) {
            retentionData.periods.reverse();
          }

          // 2. ПЕРЕВОРАЧИВАЕМ ПЕРИОДЫ SUPPORT
          let supportPeriodsCache = [];
          if (supportData) {
            if (Array.isArray(supportData.availablePeriods)) {
              supportPeriodsCache = [...supportData.availablePeriods].reverse();
            } else if (supportData.byPeriod) {
              const keys = Object.keys(supportData.byPeriod).sort().reverse();
              supportPeriodsCache = keys.map(key => {
                const periodObj = supportData.byPeriod[key]?.period || {};
                return {
                  key: key,
                  label: periodObj.label || key,
                  hasKPI: true,
                  hasTags: true
                };
              });
            }
          }

          // 3. Сохраняем в стейт
          const latestRetentionPeriod = retentionData.periods?.[0]?.key || null;
          const latestSupportPeriod = supportPeriodsCache[0]?.key || null;

          // Проверяем, существует ли сохраненный период в новых данных
          const savedRetention = get().selectedPeriod;
          const savedSupport = get().selectedSupportPeriod;

          const isSavedRetentionValid = retentionData.periods?.some(p => p.key === savedRetention);
          const isSavedSupportValid = supportPeriodsCache.some(p => p.key === savedSupport);
          
          // ИСПРАВЛЕНО: Сохраняем sources в стейт
          // Определяем безопасный массив источников (иногда API может вернуть строку JSON)
          const parsedSources = typeof sourcesData === 'string' ? JSON.parse(sourcesData) : (sourcesData || []);
          
          set({ 
            data: retentionData, 
            supportData: supportData,
            supportPeriodsCache: supportPeriodsCache,
            translations: actualTranslations, // <-- ИСПОЛЬЗУЕМ ОБРАБОТАННЫЙ ОБЪЕКТ
            sources: parsedSources, // <-- СОХРАНЯЕМ ИСТОЧНИКИ
            loading: false,
            devMode: devMode,
            // Если сохраненный период не найден или это первый запуск — берем САМЫЙ СВЕЖИЙ
            selectedPeriod: isSavedRetentionValid ? savedRetention : latestRetentionPeriod,
            selectedSupportPeriod: isSavedSupportValid ? savedSupport : latestSupportPeriod
          });
          
        } catch (error) {
          console.error('[Store] Error:', error);
          set({ error: error.message, loading: false });
        }
      },

      setPeriod: (periodKey) => {
        console.log('[Store] Setting period:', periodKey);
        set({ selectedPeriod: periodKey });
      },
      setSupportPeriod: (periodKey) => set({ selectedSupportPeriod: periodKey }),
      
      // ДОБАВЛЕНО: Метод переключения языка
      setLanguage: (lang) => set({ language: lang }),

      // Dev Mode actions
      addMissingTranslation: (key, screen) => {
        const state = get();
        if (!state.devMode) return;
        
        const itemString = JSON.stringify({ key, screen });
        
        // Оптимизация: если уже есть, не вызываем set() (не триггерим рендер)
        if (state.missingTranslations.has(itemString)) return;
        
        const newSet = new Set(state.missingTranslations);
        newSet.add(itemString);
        set({ missingTranslations: newSet });
      },

      setCurrentScreen: (screen) => {
        set({ currentScreen: screen });
      },

      clearMissingTranslations: () => {
        set({ missingTranslations: new Set() });
      },

      sendMissingTranslations: async () => {
        const state = get();
        const missing = Array.from(state.missingTranslations).map(item => JSON.parse(item));
        
        if (missing.length === 0) {
          alert('Нет непереведённых фраз');
          return;
        }
        
        try {
          const result = await retentionApi.addMissingTranslations(missing);
          
          if (result.success) {
            alert(`✅ Добавлено: ${result.added}\n⚠️ Пропущено (уже есть): ${result.skipped}`);
            set({ missingTranslations: new Set() });
          } else {
            alert('❌ Ошибка: ' + result.error);
          }
        } catch (error) {
          alert('❌ Ошибка отправки: ' + error.message);
        }
      },

      reset: () => {
        set({
          data: null,
          supportData: null,
          sources: [],
          loading: false,
          error: null,
          selectedPeriod: null,
          selectedSupportPeriod: null
        });
      }
    }),
    {
      name: 'retention-store',
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod,
        selectedSupportPeriod: state.selectedSupportPeriod,
        language: state.language // ДОБАВЛЕНО: Сохраняем язык при перезагрузке страницы
      })
    }
  )
);

// ═══════════════════════════════════════════════════════════════
// СЕЛЕКТОРЫ (максимально простые, без вычислений)
// ═══════════════════════════════════════════════════════════════

export const selectPeriods = (state) => state.data?.periods || [];

export const selectCurrentPeriod = (state) => {
  if (!state.data || !state.selectedPeriod) return null;
  return state.data.periods.find(p => p.key === state.selectedPeriod) || null;
};

export const selectUI = (state) => state.data?.ui || { financeTabs: {}, channelTabs: {} };

export const selectFinanceTabs = (state) => state.data?.ui?.financeTabs || {};

// Возвращаем просто кеш, который мы собрали 1 раз при загрузке!
export const selectSupportPeriods = (state) => state.supportPeriodsCache || [];
