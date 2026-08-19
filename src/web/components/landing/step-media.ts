/**
 * Clips de la sección `#steps` de la landing.
 *
 * Viven acá y no dentro de `landing-page.tsx` porque los consume también
 * `scripts/seo.ts`, que corre en Node durante el build y no puede importar un `.tsx` con
 * React. Si las rutas se duplicaran, el HTML pre-renderizado apuntaría a archivos que ya
 * no existen en cuanto se renombre una captura.
 *
 * El texto alternativo no está acá: es copy y vive traducido en `stepsMediaAlt`
 * (`src/web/i18n/landing-i18n.ts`), indexado por posición igual que `steps`.
 */
export type StepMedia = { mp4: string; poster: string };

export const STEP_MEDIA: (StepMedia | null)[] = [
  { mp4: "/landing/steps/step1.mp4", poster: "/landing/steps/step1.webp" },
  { mp4: "/landing/steps/step2.mp4", poster: "/landing/steps/step2.webp" },
  { mp4: "/landing/steps/step3.mp4", poster: "/landing/steps/step3.webp" },
  { mp4: "/landing/steps/step4.mp4", poster: "/landing/steps/step4.webp" },
];
