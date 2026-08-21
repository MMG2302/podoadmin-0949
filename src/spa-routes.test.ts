import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { isKnownSpaRoute, SPA_ROUTES_FOR_TESTS } from './spa-routes';

/**
 * `src/spa-routes.ts` es un espejo manual de los `<Route>` de la SPA, y de él depende que
 * una pantalla cargue o devuelva un 404 real en producción. Un comentario pidiendo que se
 * mantenga sincronizado no basta: esta prueba lo comprueba sola.
 *
 * Lee los `.tsx` como texto a propósito. Importarlos traería React y todo el árbol de
 * componentes a un test unitario que solo necesita mirar las rutas declaradas.
 */

const ROUTER_FILES = ['web/App.tsx', 'web/pages/dashboard.tsx'];

/** El comodín no es una ruta: es el que absorbía todo y por el que existe este archivo. */
const CATCH_ALL = '/:rest*';

function declaredRoutes(): { file: string; route: string }[] {
  const found: { file: string; route: string }[] = [];

  for (const relative of ROUTER_FILES) {
    const source = fs.readFileSync(path.join(__dirname, relative), 'utf8');
    for (const match of source.matchAll(/path="([^"]+)"/g)) {
      const route = match[1]!;
      if (route === CATCH_ALL) continue;
      found.push({ file: relative, route });
    }
  }

  return found;
}

/** `/patients/:id` no se puede consultar tal cual: se prueba con un valor concreto. */
function sampleUrl(route: string): string {
  return route.replace(/:[A-Za-z0-9_]+\*?/g, 'valor-de-ejemplo');
}

describe('spa-routes es espejo del router de la SPA', () => {
  it('encuentra rutas declaradas en los dos archivos', () => {
    const routes = declaredRoutes();
    expect(routes.length).toBeGreaterThan(20);
    for (const file of ROUTER_FILES) {
      expect(routes.some((r) => r.file === file)).toBe(true);
    }
  });

  it('reconoce todas las rutas que declara el router', () => {
    const noCubiertas = declaredRoutes()
      .filter(({ route }) => !isKnownSpaRoute(sampleUrl(route)))
      .map(({ file, route }) => `${route}  (${file})`);

    expect(
      noCubiertas,
      'Estas rutas existen en el router pero no en src/spa-routes.ts, así que en ' +
        'producción devolverían un 404 real. Agregalas a EXACT o a PREFIXES.'
    ).toEqual([]);
  });

  it('no conserva rutas que el router ya no declara', () => {
    const enElRouter = new Set(declaredRoutes().map(({ route }) => route));
    const sobran = [...SPA_ROUTES_FOR_TESTS.EXACT].filter((route) => !enElRouter.has(route));

    expect(
      sobran,
      'Estas rutas están en src/spa-routes.ts pero ya no existen en el router. No rompen ' +
        'nada, pero sirven la SPA con 200 en URLs que deberían dar 404.'
    ).toEqual([]);
  });

  it('devuelve 404 para lo que no es una ruta de la app', () => {
    for (const path of ['/loquesea', '/wp-admin', '/admin', '/patients-falso', '/reserva/inventado']) {
      expect(isKnownSpaRoute(path), path).toBe(false);
    }
  });

  it('acepta los enlaces con token, que llevan el dato en la query y no en la ruta', () => {
    for (const path of [
      '/reserva/confirmar',
      '/reserva/cancelar',
      '/reserva/reagendar',
      '/reserva/opinion',
      '/reserva/agendar',
    ]) {
      expect(isKnownSpaRoute(path), path).toBe(true);
    }
  });

  it('acepta las rutas con parámetro y rechaza el prefijo suelto mal formado', () => {
    expect(isKnownSpaRoute('/patients/9f2a-1234')).toBe(true);
    expect(isKnownSpaRoute('/sessions/abc-999')).toBe(true);
    // `/patients` sin id es ruta exacta; `/patientsfalso` no debe colarse por el prefijo.
    expect(isKnownSpaRoute('/patients')).toBe(true);
    expect(isKnownSpaRoute('/patientsfalso')).toBe(false);
  });

  it('ignora la barra final', () => {
    expect(isKnownSpaRoute('/settings/')).toBe(true);
    expect(isKnownSpaRoute('/')).toBe(true);
  });
});
