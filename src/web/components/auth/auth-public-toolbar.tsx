import { LanguageSwitcher } from "../language-switcher";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

/** Barra superior en pantallas públicas: idioma + tema (persiste en localStorage al cerrar sesión). */
export function AuthPublicToolbar() {
  return (
    <div className="flex justify-end items-center gap-2 p-4 shrink-0">
      <AnimatedThemeToggler />
      <LanguageSwitcher />
    </div>
  );
}
