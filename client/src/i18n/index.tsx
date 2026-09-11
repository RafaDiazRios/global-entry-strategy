import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANG, LANGUAGES, pick, resolveLang, type Lang, type Localized } from "@shared/i18n";
import { UI_STRINGS, type UiKey } from "./strings";

/**
 * Idioma de la interfaz.
 *
 * La elección vive en el navegador, no en la base: es una preferencia de quien mira, no del
 * caso. Si no hay elección previa se toma la del navegador, y si tampoco, español.
 */

const STORAGE_KEY = "ges.lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Elige el idioma de un par `{ es, en }` que viene del dominio o del servidor. */
  t: (value: Localized | string | null | undefined) => string;
  /** Texto de la propia interfaz, por clave. */
  ui: (key: UiKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStored(): Lang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && (LANGUAGES as readonly string[]).includes(stored) ? (stored as Lang) : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return DEFAULT_LANG;
    return readStored() ?? resolveLang(window.navigator?.language);
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* modo privado: la elección dura la sesión */ }
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const t = useCallback((value: Localized | string | null | undefined) => pick(value, lang), [lang]);
  const ui = useCallback((key: UiKey) => pick(UI_STRINGS[key], lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, ui }), [lang, setLang, t, ui]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage necesita estar dentro de LanguageProvider");
  return context;
}
