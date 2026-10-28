import { createContext, useContext } from "react";
import type { TranslationKey } from "../i18n/dictionaries";

export type Lang = "ar" | "en";
export type Mode = "day" | "dark" | "men" | "women";

export const MODES: Mode[] = ["day", "dark", "men", "women"];

export interface PreferencesValue {
    lang: Lang;
    dir: "rtl" | "ltr";
    mode: Mode;
    setLang: (lang: Lang) => void;
    setMode: (mode: Mode) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    formatMoney: (value: number | string) => string;
    formatDate: (value: string) => string;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);

export function usePreferences() {
    const value = useContext(PreferencesContext);

    if (!value) {
        throw new Error("usePreferences must be used inside PreferencesProvider");
    }

    return value;
}
