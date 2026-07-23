import { useCallback, useEffect, useState } from 'react';
import { HSK_EXAMS_UPDATED_EVENT, loadHskStore, loadHskStoreFromServer, saveHskStore } from '../stores/hskExams';
import type { HskExamStoreSnapshot } from '../types/hskExams';

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'HSK 数据同步失败';
}

export function useHskStore(options: { initialServerRefresh?: boolean } = {}) {
  const [store, setStore] = useState<HskExamStoreSnapshot>(() => loadHskStore());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFromServer = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadHskStoreFromServer();
      setStore(next);
      setError(null);
      return next;
    } catch (err) {
      const fallback = loadHskStore();
      setStore(fallback);
      setError(toMessage(err));
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => setStore(loadHskStore());
    window.addEventListener(HSK_EXAMS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    if (options.initialServerRefresh === false) {
      setLoading(false);
    } else {
      void refreshFromServer();
    }
    return () => {
      window.removeEventListener(HSK_EXAMS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [options.initialServerRefresh, refreshFromServer]);

  const refresh = useCallback(() => {
    const next = loadHskStore();
    setStore(next);
    return next;
  }, []);

  const patchStore = useCallback((next: HskExamStoreSnapshot) => {
    setStore(next);
    setSaving(true);
    setError(null);
    void saveHskStore(next)
      .catch((err) => {
        setError(toMessage(err));
      })
      .finally(() => {
        setSaving(false);
      });
  }, []);

  return { store, refresh, patchStore, loading, saving, error };
}
