import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { retentionApi } from '../api/retentionApi';

export const useRetentionStore = create(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════
      // STATE
      // ═══════════════════════════════════════════════════════════════
      data: null,
      loading: false,
      error: null,
      selectedPeriod: null,

      // ═══════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════
      fetchData: async () => {
        set({ loading: true, error: null });
        
        try {
          const data = await retentionApi.getReport();
          console.log('[Store] Data loaded:', data);
          
          // Выбираем последний период по умолчанию
          const lastPeriod = data.periods?.[data.periods.length - 1]?.key || null;
          
          set({ 
            data, 
            loading: false,
            selectedPeriod: lastPeriod
          });
          
          console.log('[Store] Selected period:', lastPeriod);
        } catch (error) {
          console.error('[Store] Error:', error);
          set({ 
            error: error.message, 
            loading: false 
          });
        }
      },

      setPeriod: (periodKey) => {
        console.log('[Store] Setting period:', periodKey);
        set({ selectedPeriod: periodKey });
      },

      reset: () => {
        set({
          data: null,
          loading: false,
          error: null,
          selectedPeriod: null
        });
      }
    }),
    {
      name: 'retention-store',
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod
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
