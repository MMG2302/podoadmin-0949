/** Visibilidad de ítems del menú lateral — localStorage por usuario/dispositivo. */

const NAV_VISIBILITY_KEY = "podoadmin_nav_visibility";

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

/** path → visible (ausente = visible) */
export type NavVisibilityMap = Record<string, boolean>;

export function getNavVisibility(): NavVisibilityMap {
  const raw = safeStorage.getItem(NAV_VISIBILITY_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as NavVisibilityMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function isNavPathVisible(path: string): boolean {
  const map = getNavVisibility();
  return map[path] !== false;
}

export function saveNavVisibility(map: NavVisibilityMap): void {
  safeStorage.setItem(NAV_VISIBILITY_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("nav-visibility:updated", { detail: map }));
}

export function setNavPathVisible(path: string, visible: boolean): NavVisibilityMap {
  const next = { ...getNavVisibility(), [path]: visible };
  saveNavVisibility(next);
  return next;
}

export function resetNavVisibility(): void {
  saveNavVisibility({});
}
