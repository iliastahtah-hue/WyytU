import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Flags = { tutoDone: boolean; permissionsDone: boolean };
type OnboardingValue = Flags & {
  ready: boolean;
  markTutoDone: () => Promise<void>;
  resetTuto: () => Promise<void>;
  markPermissionsDone: () => Promise<void>;
};

const KEY = 'wyytu.onboarding';
const OnboardingContext = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flags>({ tutoDone: false, permissionsDone: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setFlags((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<Flags>) }));
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const update = useCallback(async (patch: Partial<Flags>) => {
    setFlags((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ...flags,
      ready,
      markTutoDone: () => update({ tutoDone: true }),
      resetTuto: () => update({ tutoDone: false }),
      markPermissionsDone: () => update({ permissionsDone: true }),
    }),
    [flags, ready, update],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding doit être utilisé dans <OnboardingProvider>');
  return ctx;
}
