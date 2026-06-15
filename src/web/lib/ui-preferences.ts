/** Preferencias de UI — único uso permitido de localStorage (tema, sidebar). */

const THEME_KEY = "podoadmin_theme";
const SIDEBAR_KEY = "podoadmin_sidebar";

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

export interface ThemeSettings {
  mode: "light" | "dark" | "system";
}

export interface SidebarSettings {
  collapsed: boolean;
}

export const getThemeSettings = (): ThemeSettings => {
  const raw = safeStorage.getItem(THEME_KEY);
  if (!raw) return { mode: "light" };
  try {
    return JSON.parse(raw) as ThemeSettings;
  } catch {
    return { mode: "light" };
  }
};

export const saveThemeSettings = (settings: ThemeSettings): void => {
  safeStorage.setItem(THEME_KEY, JSON.stringify(settings));
};

export const getSidebarSettings = (): SidebarSettings => {
  const raw = safeStorage.getItem(SIDEBAR_KEY);
  if (!raw) return { collapsed: false };
  try {
    return JSON.parse(raw) as SidebarSettings;
  } catch {
    return { collapsed: false };
  }
};

export const saveSidebarSettings = (settings: SidebarSettings): void => {
  safeStorage.setItem(SIDEBAR_KEY, JSON.stringify(settings));
};
