"use client";

import { useCallback, useRef, useState } from "react";

/** Ignore repeat activations for a short window (double-tap / rage-click). */
export function useClickLock(lockMs = 2000) {
  const untilRef = useRef(0);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (action: () => void) => {
      const now = Date.now();
      if (now < untilRef.current) return false;
      untilRef.current = now + lockMs;
      setLocked(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLocked(false), lockMs);
      action();
      return true;
    },
    [lockMs],
  );

  return { run, locked };
}
