import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/auth-context";

export type PodiatristOption = { id: string; name: string };

/**
 * Podólogos entre los que el usuario actual puede filtrar.
 *
 * - podólogo: solo él mismo (no hay nada que elegir → `hasChoice` false)
 * - recepcionista: los que tiene asignados (`/users/visible` ya devuelve solo esos)
 * - admin de clínica: los podólogos de su clínica
 *
 * El backend siempre reaplica el scope del rol, así que el filtro es una comodidad de
 * lectura: elegir un id fuera del alcance no expone datos ajenos.
 */
export function usePodiatristOptions(enabled = true) {
  const { user, users, ensureVisibleUsers } = useAuth();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !user) return;
    void ensureVisibleUsers().finally(() => setLoaded(true));
  }, [enabled, user, ensureVisibleUsers]);

  const options = useMemo((): PodiatristOption[] => {
    if (!user) return [];
    if (user.role === "podiatrist") {
      return [{ id: user.id, name: user.name }];
    }

    // `/users/visible` ya devuelve solo lo que el rol puede ver (a la recepcionista, sus
    // podólogos asignados). Un id asignado cuya cuenta ya no existe no aparece aquí: mejor
    // omitirlo que mostrar un identificador suelto en el desplegable.
    return users
      .filter((u) => u.role === "podiatrist")
      .filter((u) => (user.role === "clinic_admin" ? u.clinicId === user.clinicId : true))
      .map((u) => ({ id: u.id, name: u.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [user, users]);

  return {
    options,
    /** Hay más de un podólogo: merece la pena mostrar el selector. */
    hasChoice: options.length > 1,
    loaded,
  };
}
