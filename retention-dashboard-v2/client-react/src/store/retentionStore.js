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
          const [retentionData, supportData, translationsData] = await Promise.all([
            retentionApi.getReport(),
            retentionApi.getSupportReport(),
            retentionApi.getTranslations()
          ]);
          
          // Сохраняем флаг devMode
          const devMode = translationsData?.devMode || false;
          
          // Добавляем переводы в retentionData
          if (retentionData) {
            retentionData.localization = translationsData;
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
          
          set({ 
            data: retentionData, 
            supportData: supportData,
            supportPeriodsCache: supportPeriodsCache,
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
        
        const newSet = new Set(state.missingTranslations);
        newSet.add(JSON.stringify({ key, screen }));
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
