import { create } from "zustand";

export type Theme = "light" | "dark";
export type Locale = "zh" | "en";

const THEME_KEY = "clark-theme";
const LOCALE_KEY = "clark-locale";

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function readLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

interface SettingsState {
  theme: Theme;
  locale: Locale;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
}

const initialTheme = readTheme();
const initialLocale = readLocale();

// 模块加载即应用，减少切主题时的闪烁
applyTheme(initialTheme);

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: initialTheme,
  locale: initialLocale,
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    applyTheme(theme);
    set({ theme });
  },
  setLocale: (locale) => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // ignore
    }
    set({ locale });
  },
}));