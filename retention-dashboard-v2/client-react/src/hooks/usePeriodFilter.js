/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  usePeriodFilter.js - Hook для работы с выбором периода
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionStore, selectPeriods, selectCurrentPeriod } from '../store/retentionStore';

/**
 * Hook для работы с выбором периода
 */
export function usePeriodFilter() {
  const selectedPeriod = useRetentionStore((state) => state.selectedPeriod);
  const setPeriod = useRetentionStore((state) => state.setPeriod);
  const periods = useRetentionStore(selectPeriods);
  const currentPeriodData = useRetentionStore(selectCurrentPeriod);

  return {
    selectedPeriod,
    setPeriod,
    periods,
    currentPeriodData
  };
}
