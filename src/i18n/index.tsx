import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import dar from './dar';
import en from './en';
import fr, { type Dictionary } from './fr';

export type Lang = 'dar' | 'fr' | 'en';

/** Ordre voulu sur l'écran de choix : darija, français, anglais */
export const LANGS: { id: Lang; label: string; native: string; flag: string }[] = [
  { id: 'dar', label: 'Darija', native: 'الدارجة', flag: '🇲🇦' },
  { id: 'fr', label: 'Français', native: 'Français', flag: '🇫🇷' },
  { id: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
];

const DICTS: Record<Lang, Dictionary> = { dar, fr, en };
const STORAGE_KEY = 'wyytu.lang';

type Vars = Record<string, string | number>;

type I18nValue = {
  lang: Lang | null;
  ready: boolean;
  isRTL: boolean;
  setLang: (lang: Lang) => Promise<void>;
  t: (path: string, vars?: Vars) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function lookup(dict: Dictionary, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[key];
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dar' || stored === 'fr' || stored === 'en') setLangState(stored);
      })
      .finally(() => setReady(true));
  }, []);

  const setLang = useCallback(async (next: Lang) => {
    setLangState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (path: string, vars?: Vars) => {
      const text = lookup(DICTS[lang ?? 'fr'], path) ?? lookup(fr, path) ?? path;
      if (!vars) return text;
      return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, ready, isRTL: lang === 'dar', setLang, t }),
    [lang, ready, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>');
  return ctx;
}
