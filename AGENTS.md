# Instrucciones para agentes de IA

**Las reglas del proyecto viven en [`CLAUDE.md`](./CLAUDE.md). Leelo antes de tocar código.**
Este archivo existe solo para las herramientas que no cargan `CLAUDE.md` automáticamente; no
es un resumen alternativo ni una versión reducida, y si algo se contradice, manda `CLAUDE.md`.

Abajo van únicamente las dos reglas cuyo incumplimiento rompe producción o expone datos de
pacientes. El resto —cabeceras de seguridad, CSRF, retención clínica, convenciones de la
landing— está en `CLAUDE.md` con el detalle y el porqué.

## 1. Aislamiento de datos entre clínicas

Todo endpoint nuevo o editado que lea o escriba datos ligados a un paciente **debe** comprobar
que el dato pertenece al tenant del usuario que lo pide. Un permiso por rol
(`requirePermission`) **no alcanza**: comprueba qué puede hacer el usuario, no de quién es el
dato.

- Un registro: `getPatientAccessDeniedReason()` / `getSessionAccessDeniedReason()`
  (`src/api/utils/tenant-isolation.ts`).
- Listados: `resolveClinicalListScope()` + `mergeScopeWhere()`
  (`src/api/utils/clinical-list-scope.ts`). Nunca un `select()` sin `where` de alcance.

Esto nació de un escaneo que encontró cinco endpoints devolviendo datos de pacientes de otras
clínicas. Ver la sección completa en `CLAUDE.md`.

## 2. Rutas de la SPA: se declaran en dos archivos

Al agregar un `<Route>` en `src/web/App.tsx` o `src/web/pages/dashboard.tsx`, hay que agregar
también su entrada en **`src/spa-routes.ts`** (`EXACT` para rutas fijas, `PREFIXES` para las
que llevan parámetro).

Se pueden crear todas las rutas que hagan falta; lo único que cambia es que van en los dos
sitios. Si falta la segunda, esa pantalla devuelve un **404 real en producción**, porque el
asset handler ya no inventa un `index.html` para cualquier URL y el Worker decide con esa
lista. No se puede derivar en compilación: el Worker no puede importar `.tsx`.

`src/spa-routes.test.ts` lo verifica solo y falla nombrando la ruta que falta. Si se pone en
rojo, la solución es agregar la ruta al espejo, nunca relajar la prueba.

## Antes de dar por terminada una tarea

```bash
bun run check   # tipos + build + wrangler dry-run
bun run test    # incluye el espejo de rutas
```
