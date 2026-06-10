import { useCallback, useEffect, useState } from 'react';
import { HSK_EXAMS_UPDATED_EVENT, loadHskStore, saveHskStore } from '../stores/hskExams';
import type { HskExamStoreSnapshot } from '../types/hskExams';

export function useHskStore() {
  const [store, setStore] = useState<HskExamStoreSnapshot>(() => loadHskStore());

  useEffect(() => {
    const sync = () => setStore(loadHskStore());
    window.addEventListener(HSK_EXAMS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HSK_EXAMS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const refresh = useCallback(() => setStore(loadHskStore()), []);

  const patchStore = useCallback((next: HskExamStoreSnapshot) => {
    saveHskStore(next);
    setStore(next);
  }, []);

  return { store, refresh, patchStore };
}
