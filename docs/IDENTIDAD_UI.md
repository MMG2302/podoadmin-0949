# Identidad UI — Guía para todos los proyectos

> **Cómo usar este archivo**
>
> 1. **Proyecto nuevo:** copia este `.md` a la raíz y pégalo como instrucción principal al agente o diseñador.
> 2. **Proyecto existente:** usa la sección [Prompt rápido](#prompt-rápido-copiar-y-pegar) o [Prompt de migración](#prompt-de-migración-proyecto-existente).
> 3. **Cursor / reglas persistentes:** copia la sección [Regla para Cursor](#regla-para-cursorrules) a `.cursor/rules/identidad-ui.mdc`.
> 4. **Revisión visual:** usa el [Checklist de conformidad](#checklist-de-conformidad) antes de dar por cerrada una pantalla.

Esta identidad nació en **PodoAdmin** y aplica a cualquier producto del ecosistema: SaaS clínicos, paneles admin, landings de producto y herramientas internas.

---

## Manifiesto (una frase)

**Clínico, sobrio y monocromático:** interfaces que se sienten como un cuaderno digital premium — claras, densas en información, sin ruido visual ni colores de marca innecesarios.

---

## Prompt rápido (copiar y pegar)

```
Aplica la Identidad UI del ecosistema (ver docs/IDENTIDAD_UI.md):

- Color de marca: carbón #1a1a1a (NO azul médico ni verde wellness)
- Superficies: white + gray-50 (claro) / gray-900–950 (oscuro)
- El negro ES el acento; color solo para semántica (error, aviso, éxito, integraciones)
- Tipografía: sans del sistema, sin fuentes custom. Wordmark: NombreLight + NombreBold
- Formas: rounded-lg (controles), rounded-xl (cards), rounded-2xl (modales)
- Layout: sidebar oscuro #1a1a1a + área de trabajo clara, header sticky blanco
- Navegación activa: píldora blanca sobre fondo negro (sidebar) o botón negro (tabs)
- Cards: bg-white rounded-xl border border-gray-100, padding generoso
- Formularios: labels text-sm font-medium, inputs con focus ring #1a1a1a
- Mobile-first: touch targets ≥44px, tablas → cards en móvil
- Dark mode: clase .dark en html, botón primario invertido (blanco sobre oscuro) en auth
- NO: gradientes, glassmorphism, sombras dramáticas, paleta corporativa azul/verde
```

---

## Prompt de proyecto nuevo

```
Crea [DESCRIPCIÓN DEL PROYECTO] siguiendo nuestra Identidad UI (docs/IDENTIDAD_UI.md).

Stack preferido (si no hay restricción):
- React + TypeScript + Vite
- Tailwind CSS 4 (tokens en CSS, sin tailwind.config salvo necesidad)
- Iconos: lucide-react, stroke fino (strokeWidth 1.5)
- Componentes: patrones propios con tokens compartidos; shadcn solo si aporta valor

Requisitos de identidad:
1. Crear archivo de tokens: src/lib/ui-tokens.ts (o equivalente) con clases de auth, forms y layout
2. Sidebar #1a1a1a con ítem activo en píldora blanca
3. Todas las pantallas con dark mode desde el día 1
4. Formularios usando los patrones de form-field (ver sección Componentes)
5. Mobile-first: tablas responsivas como cards en viewport pequeño

Entregables:
- Shell de layout (sidebar + header + main scrollable)
- Pantalla de auth split 50/50 (panel marca + formulario)
- Al menos una pantalla de listado (tabla/card) y una de formulario
- Variables CSS de marca en styles.css

No inventes una paleta nueva. Usa exactamente los tokens de la guía.
```

---

## Prompt de migración (proyecto existente)

```
Refactoriza la UI de este proyecto para alinearla con nuestra Identidad UI (docs/IDENTIDAD_UI.md).

Proceso:
1. Audita colores: reemplaza primarios azules/verdes/violetas por #1a1a1a
2. Unifica border-radius: lg (controles), xl (cards), 2xl (modales)
3. Extrae clases repetidas a un archivo de tokens (ui-tokens.ts o form-field-classes.ts)
4. Adapta navegación al patrón sidebar oscuro + píldora activa
5. Añade o corrige dark mode donde falte
6. Convierte tablas no responsivas a patrón mobile-card

Reglas:
- Cambios visuales únicamente; no refactorices lógica de negocio
- Mantén funcionalidad existente
- Prioriza archivos de layout, auth y páginas principales
- Usa el checklist de conformidad al terminar cada pantalla

Antes de empezar, lista los archivos que tocarás y los colores que reemplazarás.
```

---

## Regla para Cursor (.cursor/rules)

Copia esto en `.cursor/rules/identidad-ui.mdc`:

```markdown
---
description: Identidad visual del ecosistema — UI monocromática clínica
globs: **/*.{tsx,jsx,css,vue}
alwaysApply: false
---

# Identidad UI

Color de marca: #1a1a1a (carbón). Hover: #2a2a2a. NO usar azul/verde como color primario.

Superficies: bg-gray-50 (canvas), bg-white (cards), dark:bg-gray-950/900.
Bordes: border-gray-100/200 (claro), border-gray-700/800 (oscuro).
Texto principal: text-[#1a1a1a] dark:text-white. Secundario: text-gray-500.

Tipografía: sans del sistema. Labels: text-sm font-medium. Headings: font-semibold.
Wordmark: primera parte font-light, segunda font-bold.

Radios: rounded-lg (inputs/botones), rounded-xl (cards), rounded-2xl (modales).
Botón primario: bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a].
Focus: focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-gray-500.

Layout: sidebar fijo #1a1a1a w-72, header sticky blanco h-14, main con scroll.
Nav activo: bg-white text-[#1a1a1a] rounded-lg (en sidebar oscuro).

Cards: bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800.
Mobile: min-h-[44px] touch targets; tablas → cards apiladas.

Color semántico solo para: error (red), warning (amber), success (green), info puntual.
Prohibido: gradientes, glassmorphism, sombras fuertes, fuentes display.
```

---

## Tokens de marca

### Colores

| Token | Valor | Uso |
|-------|-------|-----|
| `--brand-ink` | `#1a1a1a` | Botones primarios, texto principal, focus, sidebar |
| `--brand-ink-hover` | `#2a2a2a` | Hover de primarios |
| `--brand-canvas` | `#f9fafb` | Fondo de área de trabajo (`gray-50`) |
| `--brand-surface` | `#ffffff` | Cards, header, formularios |
| `--brand-muted` | `#6b7280` | Texto secundario (`gray-500`) |
| `--brand-border` | `#e5e7eb` | Bordes de cards e inputs (`gray-200`) |

### Colores semánticos (solo con significado)

| Estado | Claro | Oscuro |
|--------|-------|--------|
| Error | `red-50` fondo, `red-600` texto/borde | `red-950/40` fondo, `red-300` texto |
| Advertencia | `amber-50` fondo, `amber-900` texto | `amber-950/30` fondo, `amber-200` texto |
| Éxito | `green-600`–`700` | `green-400`–`500` |
| Info puntual | `blue-100`–`700` (uso excepcional) | equivalente dark |

### Forma y espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-control` | `8px` / `rounded-lg` | Inputs, botones, nav items |
| `--radius-surface` | `12px` / `rounded-xl` | Cards, paneles |
| `--radius-overlay` | `16px` / `rounded-2xl` | Modales, bottom sheets |
| `--radius-pill` | `9999px` / `rounded-full` | Badges, avatares |
| Padding página | `p-3 sm:p-4 md:p-6 lg:p-8` | Área de contenido |
| Padding card | `p-4` o `p-6` | Interior de cards |
| Touch target | `min-h-[44px] min-w-[44px]` | Botones e iconos en móvil |

### CSS base (pegar en `styles.css`)

```css
:root {
  --brand-ink: #1a1a1a;
  --brand-ink-hover: #2a2a2a;
  --brand-canvas: #f9fafb;
  --brand-surface: #ffffff;
  --brand-muted: #6b7280;
  --brand-border: #e5e7eb;
  --radius-control: 0.5rem;
  --radius-surface: 0.75rem;
  --radius-overlay: 1rem;
}

.dark {
  --brand-canvas: #030712;
  --brand-surface: #111827;
  --brand-border: #374151;
}
```

---

## Tipografía

| Elemento | Clases | Notas |
|----------|--------|-------|
| Wordmark | `text-4xl font-light` + `font-bold` en segunda parte | Ej: **Podo**Admin, **Clini**Core |
| Título de página | `text-base`–`text-xl font-semibold` | Header sticky |
| Título de sección | `text-lg font-semibold` | Dentro de cards |
| Label de formulario | `text-sm font-medium text-[#1a1a1a] dark:text-gray-100` | Siempre encima del campo |
| Hint / ayuda | `text-xs text-gray-500 dark:text-gray-400` | Debajo del label |
| Cuerpo | `text-sm` | Texto general, tablas |
| Header de tabla | `text-xs font-semibold uppercase tracking-wider text-gray-500` | Admin denso |
| Stat / KPI | `text-3xl font-semibold` | Dashboard bento |

**No cargar fuentes externas** salvo requisito explícito de marca. La sans del sistema es parte de la identidad.

---

## Layout signature

```
┌─────────────────────────────────────────────────────┐
│  [≡]  Título de página          [acciones / dock]  │  header sticky, bg-white, h-14
├──────────┬──────────────────────────────────────────┤
│ SIDEBAR  │  MAIN (scroll)                           │
│ #1a1a1a  │  bg-gray-50 dark:bg-gray-950             │
│ w-72     │  cards blancas, padding responsive       │
│ fixed    │  watermark de marca (opcional)           │
└──────────┴──────────────────────────────────────────┘
```

### Sidebar
- Fondo: `bg-[#1a1a1a]`
- Texto: `text-white` / `text-gray-400` (inactivo)
- Ítem activo: `bg-white text-[#1a1a1a] rounded-lg font-medium`
- Ítem hover: `hover:bg-white/10 rounded-lg`
- Iconos: SVG stroke `strokeWidth={1.5}`, `w-5 h-5`
- Ancho: `w-72` (288px) en desktop

### Móvil
- Sidebar: overlay `w-[85%] max-w-[300px]` + backdrop `bg-black/60 backdrop-blur-sm`
- Modales: bottom sheet (`items-end`, `rounded-t-2xl`)
- Tablas: patrón `mobile-card` (ver abajo)

### Auth (pantallas públicas)
- Split 50/50 en desktop
- Panel izquierdo: `bg-[#1a1a1a]` con grid SVG decorativo sutil
- Panel derecho: formulario en `bg-white dark:bg-gray-900`
- Logo móvil arriba del formulario

---

## Componentes

### Botón primario

```
w-full py-3.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a]
font-medium rounded-lg hover:bg-[#2a2a2a] dark:hover:bg-gray-200
transition-all disabled:opacity-50
```

### Botón secundario

```
px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-[#1a1a1a] dark:text-white
rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium
```

### Input

```
w-full px-4 py-2.5 bg-white dark:bg-gray-900
text-[#1a1a1a] dark:text-white
border border-gray-200 dark:border-gray-700 rounded-lg
focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-gray-500 focus:border-transparent
placeholder:text-gray-400
```

### Input (auth — más alto)

```
w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800
border border-gray-200 dark:border-gray-700 rounded-lg
focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]
```

### Card

```
bg-white dark:bg-gray-900 rounded-xl
border border-gray-100 dark:border-gray-800
p-4 sm:p-6
```

### Card con hover (dashboard bento)

```
bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800
p-6 transition-all hover:shadow-lg
```

### Tab activo (tabs / settings)

```
px-4 py-2 rounded-lg text-sm font-medium
bg-[#1a1a1a] text-white          /* activo */
text-gray-600 hover:bg-gray-100   /* inactivo */
```

### Modal

```
Overlay: fixed inset-0 bg-black/50 z-50
Panel:   bg-white dark:bg-gray-900 rounded-2xl shadow-xl
Móvil:   rounded-t-2xl, anclado abajo
```

### Banner de error

```
bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800
text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm
```

### Banner de advertencia

```
rounded-lg border border-amber-200 dark:border-amber-800
bg-amber-50 dark:bg-amber-950/30 px-4 py-3
text-sm text-amber-900 dark:text-amber-200
```

### Tabla (desktop)

```
table w-full
thead: bg-gray-50 dark:bg-gray-800, text-xs uppercase tracking-wider text-gray-500
tbody: divide-y divide-gray-100 dark:divide-gray-800
tr hover: hover:bg-gray-50 dark:hover:bg-gray-800/50
celdas: px-6 py-4 text-sm
```

### Mobile card (sustituto de tabla)

```html
<div class="mobile-card rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-2">
  <div class="flex justify-between">
    <span class="text-xs text-gray-500">Label</span>
    <span class="text-sm font-medium">Valor</span>
  </div>
</div>
```

### Badge de rol

```
inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
bg-gray-100 text-gray-700    /* default */
bg-blue-100 text-blue-700    /* admin — excepción semántica */
```

### Spinner de carga

```
animate-spin h-8 w-8 text-[#1a1a1a] dark:text-white
```

---

## Archivo de tokens recomendado

Crear en cada proyecto `src/lib/ui-tokens.ts` (o `src/web/lib/` según estructura):

```typescript
/** Tokens de identidad UI — fuente de verdad del proyecto */

export const brand = {
  ink: "#1a1a1a",
  inkHover: "#2a2a2a",
} as const;

export const authPage = {
  shell: "min-h-screen bg-white dark:bg-gray-950 flex overflow-hidden",
  heading: "text-[#1a1a1a] dark:text-white text-3xl font-semibold mb-2",
  label: "block text-sm font-medium text-[#1a1a1a] dark:text-gray-100 mb-2",
  input: "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[#1a1a1a] dark:text-white focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]",
  primaryBtn: "w-full py-3.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] font-medium rounded-lg hover:bg-[#2a2a2a] dark:hover:bg-gray-200 transition-all disabled:opacity-50",
  error: "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm",
} as const;

export const form = {
  label: "block text-sm font-medium text-[#1a1a1a] dark:text-gray-100",
  field: "w-full px-4 py-2.5 bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] dark:focus:ring-gray-500 focus:border-transparent",
  heading: "text-lg font-semibold text-[#1a1a1a] dark:text-white",
} as const;

export const surface = {
  card: "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800",
  canvas: "bg-gray-50 dark:bg-gray-950",
} as const;

export const layout = {
  sidebar: "fixed inset-y-0 left-0 w-72 bg-[#1a1a1a] text-white z-40",
  sidebarItemActive: "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white text-[#1a1a1a] font-medium",
  sidebarItem: "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white",
  header: "sticky top-0 z-30 h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800",
} as const;
```

**Regla:** si una clase de UI se repite en 3+ sitios, va al archivo de tokens. No hardcodear `#1a1a1a` suelto en componentes nuevos.

---

## Dark mode

- Activación: clase `.dark` en `<html>`
- Persistencia: `localStorage` con clave `[appname]_theme`
- Flash prevention: script inline en `<head>` antes del paint
- `theme-color` meta: `#f9fafb` (claro), `#0f172a` (oscuro)
- En auth: botón primario **invertido** (`dark:bg-white dark:text-[#1a1a1a]`)
- Inputs en dark: nunca dejar `bg-white` sin pareja `dark:bg-gray-900`
- iOS: `font-size: 16px` en inputs móviles para evitar zoom automático

---

## Personalidad y tono

| Atributo | Nivel | Notas |
|----------|-------|-------|
| Profesional | Alto | Sin informalidad en copy de UI |
| Minimal | Alto | Densidad de datos sí, decoración no |
| Clínico | Medio-alto | Serio sin parecer hospital viejo |
| Moderno | Alto | Bento, dock, transitions — con propósito |
| Confiable | Muy alto | Prioridad sobre "bonito" |
| Cálido | Bajo | La calidez viene del contenido, no del color |

---

## Prohibiciones explícitas

No usar en ningún proyecto del ecosistema:

- [ ] Azul o verde como color primario de marca
- [ ] Gradientes en fondos, botones o headers
- [ ] Glassmorphism / backdrop-blur decorativo (blur solo en overlays móviles)
- [ ] Sombras dramáticas (`shadow-2xl` fuera de modales)
- [ ] Tipografías serif, display o "médicas"
- [ ] Iconos filled de colores vivos en navegación principal
- [ ] Bordes de 2–3px como estilo default
- [ ] Animaciones decorativas sin función
- [ ] Scroll horizontal en tablas móviles (usar mobile-card)
- [ ] Light mode sin pareja dark

---

## Checklist de conformidad

Usar antes de cerrar cualquier pantalla o PR de UI:

### Colores
- [ ] Acciones primarias usan `#1a1a1a`, no otro color
- [ ] Fondo de trabajo es `gray-50` / `gray-950`
- [ ] Cards son blancas/gris-900 con borde sutil
- [ ] Color solo aparece con significado (error, warning, success)

### Tipografía
- [ ] Labels son `text-sm font-medium`
- [ ] Sin fuentes externas innecesarias
- [ ] Jerarquía clara: heading > label > hint

### Componentes
- [ ] Botones `rounded-lg`, cards `rounded-xl`, modales `rounded-2xl`
- [ ] Inputs con focus ring negro
- [ ] Touch targets ≥ 44px en móvil

### Layout
- [ ] Sidebar oscuro con píldora activa (si aplica)
- [ ] Header sticky blanco
- [ ] Contenido scrollea independiente del shell

### Responsive
- [ ] Tablas degradan a cards en móvil
- [ ] Modales son bottom sheet en móvil
- [ ] Sidebar es overlay en móvil

### Dark mode
- [ ] Todos los `bg-white` tienen pareja `dark:`
- [ ] Texto legible en ambos modos
- [ ] Sin flash al cargar

### Tokens
- [ ] Clases repetidas extraídas a `ui-tokens.ts`
- [ ] No hay hex sueltos fuera del archivo de tokens (salvo migración en curso)

---

## Prompts por escenario

### Nueva pantalla en proyecto existente

```
Añade la pantalla [NOMBRE] siguiendo IDENTIDAD_UI.md.
Reutiliza tokens de src/lib/ui-tokens.ts. No introduzcas colores nuevos.
Patrón: [listado con tabla | formulario | dashboard bento | settings con tabs]
Incluye estados: loading (spinner), vacío, error.
Mobile-first con mobile-card si hay tabla.
```

### Componente reutilizable

```
Crea el componente [NOMBRE] siguiendo IDENTIDAD_UI.md.
Debe funcionar en light y dark mode.
Exporta variantes via class-variance-authority si tiene más de 2 estados.
Documenta en comentario qué token usa cada parte.
```

### Landing / marketing

```
Crea landing para [PRODUCTO] con IDENTIDAD_UI.md adaptada a marketing:
- Misma paleta monocromática (#1a1a1a + grises)
- Hero con split editorial (negro + blanco), no gradientes
- CTAs con botón primario estándar
- Tipografía del sistema, wordmark light+bold
- Puede tener más aire (padding) pero mismos tokens
```

### Email / PDF / impresión

```
Genera [email | PDF | vista impresión] con paleta de impresión:
- Ink: #1C1B1B
- Muted: #6b7280
- Line: #e4e4e7
- Panel: #fafafa
- Fuente: Arial, Helvetica, sans-serif
Sin colores de acento salvo links y alertas.
```

---

## Referencia de implementación

La implementación canónica vive en **PodoAdmin**:

| Qué | Dónde |
|-----|-------|
| Tokens globales CSS | `src/web/styles.css` |
| Tokens auth | `src/web/lib/auth-page-styles.ts` |
| Tokens formularios | `src/web/lib/form-field-classes.ts` |
| Sidebar | `src/web/components/layout/sidebar.tsx` |
| Layout shell | `src/web/components/layout/main-layout.tsx` |
| Login (auth split) | `src/web/pages/login.tsx` |
| Dashboard bento | `src/web/components/ui/bento-grid.tsx` |
| Modales | `src/web/components/ui/app-modal.tsx` |
| Impresión clínica | `src/web/lib/podiatry-history-print.ts` |

Al iniciar un proyecto nuevo, **copiar y adaptar** `auth-page-styles.ts` y `form-field-classes.ts` es el atajo más rápido.

---

## Versión

| Campo | Valor |
|-------|-------|
| Versión | 1.0 |
| Origen | PodoAdmin UI |
| Fecha | 2026-07-06 |
| Mantenedor | Equipo de producto |
