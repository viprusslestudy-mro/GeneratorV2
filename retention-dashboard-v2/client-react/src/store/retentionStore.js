import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { retentionApi } from '../api/retentionApi';

export const useRetentionStore = create(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════
      // STATE
      // ═════════════════════════════════════════════════════════════
      data: null,
      loading: false,
      error: null,
      selectedPeriod: null,

      // ═════════════════════════════════════════════════════════════
      // ACTIONS
      // ═════════════════════════════════════════════════════════════
      async fetchData() {
        set({ loading: true, error: null });
        
        try {
          const data = await retentionApi.getReport();
          
          set({ 
            data, 
            loading: false,
            // Выбираем последний период по умолчанию
            selectedPeriod: data.periods[data.periods.length - 1]?.key || null
          });
        } catch (error) {
          set({ 
            error: error.message, 
            loading: false 
          });
          console.error('[retentionStore] fetchData error:', error);
        }
      },

      setPeriod(periodKey) {
        set({ selectedPeriod: periodKey });
      },

      reset() {
        set({
          data: null,
          loading: false,
          error: null,
          selectedPeriod: null
        });
      },

      // ═══════════════════════════════════════════════════════════════
      // COMPUTED VALUES (getters)
      // ═════════════════════════════════════════════════════════════
      get periods() {
        return get().data?.periods || [];
      },

      get currentPeriod() {
        const { data, selectedPeriod } = get();
        if (!data || !selectedPeriod) return null;
        return data.periods.find(p => p.key === selectedPeriod) || null;
      },

      get ui() {
        return get().data?.ui || { financeTabs: {}, channelTabs: {} };
      }
    }),
    {
      name: 'retention-store',
      // Сохраняем только выбранный период
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod
      })
    }
  )
);
