import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ar, en, type TranslationKey } from "../i18n/dictionaries";
import { MODES, PreferencesContext, type Lang, type Mode } from "./preferences";

const LANG_KEY = "durra.lang";
const MODE_KEY = "durra.mode";

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
    try {
        const value = localStorage.getItem(key);
        return allowed.includes(value as T) ? value as T : fallback;
    } catch {
        return fallback;
    }
}

function store(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Storage may be unavailable (private mode); preferences then last for the session.
    }
}

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export default function PreferencesProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => readStored(LANG_KEY, ["ar", "en"], "ar"));
    const [mode, setModeState] = useState<Mode>(() => readStored(MODE_KEY, MODES, "day"));

    const dir = lang === "ar" ? "rtl" : "ltr";

    // Keep <html> in sync so CSS (direction, theme tokens) follows the preferences.
    useEffect(() => {
        const root = document.documentElement;
        root.lang = lang;
        root.dir = dir;
        root.dataset.mode = mode;
    }, [lang, dir, mode]);

    const setLang = useCallback((value: Lang) => {
        setLangState(value);
        store(LANG_KEY, value);
    }, []);

    const setMode = useCallback((value: Mode) => {
        setModeState(value);
        store(MODE_KEY, value);
    }, []);

    const value = useMemo(() => {
        const dictionary = lang === "ar" ? ar : en;

        const t = (key: TranslationKey, vars?: Record<string, string | number>) => {
            let text: string = dictionary[key] ?? key;

            for (const [name, replacement] of Object.entries(vars ?? {})) {
                text = text.replaceAll(`{${name}}`, String(replacement));
            }

            return text;
        };

        const formatMoney = (amount: number | string) => {
            const formatted = numberFormat.format(Number(amount) || 0);
            return lang === "ar" ? `${formatted} د.م` : `MAD ${formatted}`;
        };

        const dateFormat = new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "en-GB", {
            dateStyle: "medium",
            numberingSystem: "latn",
        });

        const formatDate = (iso: string) => dateFormat.format(new Date(iso));

        return { lang, dir, mode, setLang, setMode, t, formatMoney, formatDate } as const;
    }, [lang, dir, mode, setLang, setMode]);

    return (
        <PreferencesContext.Provider value={value}>
            {children}
        </PreferencesContext.Provider>
    );
}
