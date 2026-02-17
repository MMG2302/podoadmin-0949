"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { getThemeSettings, saveThemeSettings } from "@/lib/storage";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const settings = getThemeSettings();
    const dark = settings.mode === "dark";
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = !isDark;
    const applyTheme = () => {
      flushSync(() => {
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark", newTheme);
        const settings = getThemeSettings();
        saveThemeSettings({ ...settings, mode: newTheme ? "dark" : "light" });
      });
    };

    if (typeof document.startViewTransition === "function") {
      await document.startViewTransition(() => {
        applyTheme();
      }).ready;

      const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top)
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } else {
      applyTheme();
    }
  }, [isDark, duration]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
        "text-[#1a1a1a] dark:text-white",
        className
      )}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      {...props}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
