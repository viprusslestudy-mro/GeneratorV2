import { useEffect } from 'react';
import { useRetentionStore } from '../store/retentionStore';

/**
 * Главный hook для работы с Retention данными
 * Автоматически загружает данные при монтировании
 */
export function useRetentionData() {
  const data = useRetentionStore((state) => state.data);
  const loading = useRetentionStore((state) => state.loading);
  const error = useRetentionStore((state) => state.error);
  const fetchData = useRetentionStore((state) => state.fetchData);

  useEffect(() => {
    if (!data && !loading && !error) {
      fetchData();
    }
  }, [data, loading, error, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
