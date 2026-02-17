import { useEffect, useRef, useState } from 'react';

export function useMinimumLoader(isLoading: boolean, minDurationMs = 800): boolean {
  const [visible, setVisible] = useState(isLoading);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (!startedAtRef.current) {
        startedAtRef.current = Date.now();
      }
      setVisible(true);
      return;
    }

    const startedAt = startedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(minDurationMs - elapsed, 0);

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
      startedAtRef.current = null;
    }, remaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoading, minDurationMs]);

  return visible;
}

