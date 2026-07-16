import { Link } from "wouter";
import { authPage as ap } from "../../lib/auth-page-styles";
import { cn } from "../../lib/utils";

const LANDING_HREF = "/landing";
const ARIA = "PodoAdmin — ir a la página de inicio";

/** Logo + wordmark del panel izquierdo (auth / legales), siempre a la landing. */
export function AuthBrandPanel({ className }: { className?: string }) {
  return (
    <Link
      href={LANDING_HREF}
      aria-label={ARIA}
      className={cn(
        "flex flex-col items-center text-center hover:opacity-90 transition-opacity",
        className
      )}
    >
      <img src="/favicon.svg" alt="" aria-hidden className="w-40 h-40 mb-8" />
      <span className="text-white text-5xl font-light tracking-tight mb-4">
        Podo<span className="font-bold">Admin</span>
      </span>
    </Link>
  );
}

/** Wordmark móvil en pantallas de auth, siempre a la landing. */
export function AuthBrandMobile({ className }: { className?: string }) {
  return (
    <Link
      href={LANDING_HREF}
      aria-label={ARIA}
      className={cn(ap.mobileLogo, "inline-block hover:opacity-90 transition-opacity", className)}
    >
      Podo<span className="font-bold">Admin</span>
    </Link>
  );
}
