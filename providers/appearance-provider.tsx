'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  type Appearance,
} from '@/lib/appearance';

type AppearanceValue = Appearance & {
  /** Resolves `system` to what is actually on screen. */
  resolvedMode: 'light' | 'dark';
  set: (patch: Partial<Appearance>) => void;
  reset: () => void;
};

const AppearanceContext = createContext<AppearanceValue | null>(null);

const readStored = (): Appearance => {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return raw ? { ...DEFAULT_APPEARANCE, ...(JSON.parse(raw) as Partial<Appearance>) } : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
};

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  // The inline boot script already applied this to <html>; state catches up on mount.
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAppearance(readStored());
    setSystemDark(prefersDark());
    setHydrated(true);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedMode: 'light' | 'dark' =
    appearance.mode === 'system' ? (systemDark ? 'dark' : 'light') : appearance.mode;

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedMode === 'dark');
    root.style.colorScheme = resolvedMode;
    root.setAttribute('data-theme-mode', resolvedMode);
    root.setAttribute('data-theme-preset', appearance.preset);
    root.setAttribute('data-font', appearance.font);
    root.setAttribute('data-sidebar-variant', appearance.sidebarVariant);
    root.setAttribute('data-content-layout', appearance.contentLayout);
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      /* private window — the choice just will not persist */
    }
  }, [appearance, hydrated, resolvedMode]);

  const set = useCallback((patch: Partial<Appearance>) => {
    setAppearance((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setAppearance(DEFAULT_APPEARANCE), []);

  const value = useMemo<AppearanceValue>(
    () => ({ ...appearance, resolvedMode, set, reset }),
    [appearance, resolvedMode, set, reset],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export const useAppearance = (): AppearanceValue => {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return context;
};
