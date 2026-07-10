import { useEffect, useState } from "react";
import { getNavVisibility, type NavVisibilityMap } from "../lib/nav-preferences";

export function useNavVisibility() {
  const [map, setMap] = useState<NavVisibilityMap>(() => getNavVisibility());

  useEffect(() => {
    const onUpdate = (e: Event) => {
      setMap((e as CustomEvent<NavVisibilityMap>).detail ?? getNavVisibility());
    };
    window.addEventListener("nav-visibility:updated", onUpdate);
    return () => window.removeEventListener("nav-visibility:updated", onUpdate);
  }, []);

  return map;
}
