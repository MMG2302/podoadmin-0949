import { useEffect } from "react";

/**
 * Lleva la vista al `#ancla` de la URL en las páginas públicas.
 *
 * El navegador no lo hace solo por dos motivos que se suman: la landing scrollea dentro de
 * un contenedor propio (`div.h-full.max-h-dvh`), no el documento, y al llegar desde otra
 * ruta (`/faq` → `/#steps`) el HTML todavía no tiene la sección cuando el navegador intenta
 * saltar. Resultado sin esto: se abre la landing arriba del todo, como si el enlace fallara.
 */
export function useHashScroll(): void {
  useEffect(() => {
    const scrollToHash = (behavior: ScrollBehavior) => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
    };

    // Dos frames: el primero deja pintar el árbol recién montado, el segundo ya mide bien.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => scrollToHash("auto"));
    });

    const onHashChange = () => scrollToHash("smooth");
    window.addEventListener("hashchange", onHashChange);

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
}
