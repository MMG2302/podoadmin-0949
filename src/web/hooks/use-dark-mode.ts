import { useEffect, useState } from "react";
import { getThemeSettings } from "../lib/ui-preferences";

/** Sincronizado con la clase `dark` en `<html>` (AnimatedThemeToggler). */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return getThemeSettings().mode === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
