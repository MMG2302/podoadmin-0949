import { useLocation } from "wouter";
import { useAuth } from "../contexts/auth-context";

/**
 * Salida de las páginas legales (/terms, /privacy).
 *
 * Sin sesión el visitante llega desde el alta, así que volver a login o a registro es
 * correcto. Con sesión no: esas dos rutas cuelgan de PublicRoute, que rebota al usuario
 * autenticado a su cuenta — por eso "Volver" desde los términos acababa en el panel.
 *
 * @param anonymousTarget ruta a la que volver cuando no hay sesión ("/login", "/register").
 */
export function useLegalExit(anonymousTarget: string): {
  hasSession: boolean;
  exit: () => void;
} {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const exit = () => {
    if (!user) {
      setLocation(anonymousTarget);
      return;
    }
    // Con sesión, devolver a la página de origen (footer de la landing, sidebar…).
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  };

  return { hasSession: Boolean(user), exit };
}
