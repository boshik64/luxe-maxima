"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isWinterTheme } from "@/lib/site-theme";

const STORAGE_KEY = "karo-winter-effects";

type WinterEffectsContextValue = {
  enabled: boolean;
  available: boolean;
  setEnabled: (next: boolean) => void;
  toggle: () => void;
};

const WinterEffectsContext = createContext<WinterEffectsContextValue | null>(
  null,
);

function readStoredEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    // ignore
  }
  return true;
}

export function WinterEffectsProvider({ children }: { children: ReactNode }) {
  const available = isWinterTheme();
  const [enabled, setEnabledState] = useState(readStoredEnabled);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const value = useMemo(
    () => ({ enabled: available && enabled, available, setEnabled, toggle }),
    [available, enabled, setEnabled, toggle],
  );

  return (
    <WinterEffectsContext.Provider value={value}>
      {children}
    </WinterEffectsContext.Provider>
  );
}

export function useWinterEffects() {
  const ctx = useContext(WinterEffectsContext);
  if (!ctx) {
    return {
      enabled: false,
      available: false,
      setEnabled: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
}
