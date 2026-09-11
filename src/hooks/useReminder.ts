import { useState, useEffect, useCallback } from 'react';
import { SessionSummary } from '../lib/types';

const DISMISS_KEY = 'emosense_reminder_dismissed';

export function useReminder(entries: SessionSummary[]) {
  const [visible, setVisible] = useState<boolean>(false);
  const [daysSinceLast, setDaysSinceLast] = useState<number | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;

    const lastDismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // If dismissed in the last 24 hours, don't show
    if (lastDismissed && now - lastDismissed < oneDayMs) {
      return;
    }

    // Find the latest session
    const latest = entries.reduce((prev, curr) =>
      new Date(curr.date) > new Date(prev.date) ? curr : prev
    );

    const diffDays = (now - new Date(latest.date).getTime()) / oneDayMs;
    if (diffDays >= 1) {
      setDaysSinceLast(Math.floor(diffDays));
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    }
  }, [entries]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  }, []);

  return {
    visible,
    daysSinceLast,
    dismiss,
  };
}
