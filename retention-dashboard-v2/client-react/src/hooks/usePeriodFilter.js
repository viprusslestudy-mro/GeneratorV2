import { useRetentionStore } from '../store/retentionStore';

/**
 * Hook для работы с выбором периода
 */
export function usePeriodFilter() {
  const selectedPeriod = useRetentionStore((state) => state.selectedPeriod);
  const setPeriod = useRetentionStore((state) => state.setPeriod);
  const periods = useRetentionStore((state) => state.periods);
  const currentPeriod = useRetentionStore((state) => state.currentPeriod);

  return {
    selectedPeriod,
    setPeriod,
    periods,
    currentPeriodData: currentPeriod
  };
}
