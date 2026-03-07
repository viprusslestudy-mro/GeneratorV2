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
      data: null,
      loading: false,
      error: null,
      selectedPeriod: null,
      
      // Настройки проекта
      projectSettings: {
        name: 'SuperSpin',
        logoUrl: 'https://via.placeholder.com/40/FF9800/FFFFFF?text=SS',
        icon: '🎰'
      },

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

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (для использования внутри компонентов)
// ═══════════════════════════════════════════════════════════════

/**
 * Получить значение карточки для периода
 */
export const getCardValue = (state, periodIndex, cardId) => {
  if (!state.data || periodIndex < 0 || periodIndex >= state.data.periods.length) {
    return null;
  }
  
  const period = state.data.periods[periodIndex];
  if (!period || period.enabled === false) return null;
  
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? card.value : null;
};

/**
 * Получить diff карточки для периода
 */
export const getCardDiff = (state, periodIndex, cardId) => {
  if (!state.data || periodIndex < 0 || periodIndex >= state.data.periods.length) {
    return '';
  }
  
  const period = state.data.periods[periodIndex];
  if (!period || period.enabled === false) return '';
  
  const card = (period.cards || []).find(c => c && c.id === cardId);
  return card ? (card.diff || '') : '';
};

/**
 * Получить данные метрики по всем периодам
 */
export const getDataByMetric = (state, metricId) => {
  if (!state.data || !state.data.periods) return [];
  
  return state.data.periods.map((period, i) => {
    if (!period || period.enabled === false) return null;
    const card = (period.cards || []).find(c => c && c.id === metricId);
    return card ? card.value : null;
  });
};

/**
 * Получить diff метрики по всем периодам
 */
export const getDiffsByMetric = (state, metricId) => {
  if (!state.data || !state.data.periods) return [];
  
  return state.data.periods.map((period, i) => {
    if (!period || period.enabled === false) return '';
    const card = (period.cards || []).find(c => c && c.id === metricId);
    return card ? (card.diff || '') : '';
  });
};

/**
 * Проверить наличие метрики в данных
 */
export const hasFinanceMetric = (state, metricId) => {
  if (!state.data || !metricId) return false;
  
  return state.data.periods.some(p => {
    if (!p || !p.hasFinance) return false;
    return (p.cards || []).some(c => 
      c && c.id === metricId && c.value !== null && c.value !== undefined
    );
  });
};

/**
 * Получить метки месяцев (сокращённые)
 */
export const getMonthLabels = (state) => {
  if (!state.data || !state.data.periods) return [];
  
  return state.data.periods.map(p => {
    const label = p.label || '';
    const parts = label.split(' ');
    
    if (parts.length >= 2) {
      return `${parts[0].substring(0, 3)} ${parts[1].substring(2)}`;
    }
    
    return label.substring(0, 3);
  });
};
