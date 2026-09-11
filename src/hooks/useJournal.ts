import { useState, useEffect, useCallback } from 'react';
import { SessionSummary } from '../lib/types';

const STORAGE_KEY = 'emosense_journal_entries';

export function useJournal() {
  const [entries, setEntries] = useState<SessionSummary[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to read journal entries from storage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save journal entries to storage', e);
    }
  }, [entries]);

  const addEntry = useCallback((entry: SessionSummary) => {
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    addEntry,
    removeEntry,
    clearAll,
  };
}
