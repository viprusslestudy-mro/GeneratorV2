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
      loading: false,
      error: null,
      selectedPeriod: null,
      selectedSupportPeriod: null, // Отдельно для Support
      
      // ДОБАВЛЕНО: Текущий язык (по умолчанию из настроек браузера или RU)
      language: 'RU',

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
          // Загружаем Retention и Support параллельно!
          const [retentionData, supportData] = await Promise.all([
            retentionApi.getReport(),
            retentionApi.getSupportReport()
          ]);
          
          console.log('[Store] Retention loaded:', retentionData);
          console.log('[Store] Support loaded:', supportData);
          
          // Дефолтные периоды
          const lastRetentionPeriod = retentionData.periods?.[retentionData.periods.length - 1]?.key || null;
          const lastSupportPeriod = supportData.availablePeriods?.[supportData.availablePeriods.length - 1]?.key || null;
          
          set({ 
            data: retentionData, 
            supportData: supportData,
            loading: false,
            // Если периоды еще не были выбраны (из persist), ставим дефолтные
            selectedPeriod: get().selectedPeriod || lastRetentionPeriod,
            selectedSupportPeriod: get().selectedSupportPeriod || lastSupportPeriod
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
// СЕЛЕКТОРЫ (отдельные функции для получения данных)
// ═══════════════════════════════════════════════════════════════

export const selectPeriods = (state) => state.data?.periods || [];

export const selectCurrentPeriod = (state) => {
  if (!state.data || !state.selectedPeriod) return null;
  return state.data.periods.find(p => p.key === state.selectedPeriod) || null;
};

export const selectUI = (state) => state.data?.ui || { financeTabs: {}, channelTabs: {} };

export const selectFinanceTabs = (state) => state.data?.ui?.financeTabs || {};

// Селекторы для Support
export const selectSupportPeriods = (state) => state.supportData?.availablePeriods || [];

export const selectCurrentSupportPeriod = (state) => {
  if (!state.supportData || !state.selectedSupportPeriod) return null;
  return state.supportData.availablePeriods.find(p => p.key === state.selectedSupportPeriod) || null;
};
