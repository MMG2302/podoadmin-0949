/**
 * Diagramas clínicos — logo PodoAdmin con alteraciones por tipo.
 */
import type { ArchTypeId, FootTypeId } from "./podiatry-logo-foot";
import {
  ARCH_TYPE_LABELS,
  brandMark,
  FOOT_TYPE_LABELS,
  renderLogoFoot,
} from "./podiatry-logo-foot";
import type { DetectionMatch, PodiatryDiagramContext } from "./podiatry-print-detect";

const VB_MINI = "0 0 88 100";
const VB_ARCH = "0 0 88 100";
const VB_WIDE = "0 0 200 112";

const FOOT_MINI = { scale: 0.095, cx: 44, cy: 56 } as const;
const FOOT_STD = { scale: 0.1, cx: 0, cy: 0 } as const;

const FOOT_TYPE_IDS: FootTypeId[] = ["egyptian", "roman", "greek", "germanic", "celtic"];
const ARCH_TYPE_IDS: ArchTypeId[] = ["flat", "normal", "cavus"];

function footTypeMini(id: FootTypeId, selected: boolean): string {
  return `
    <figure class="diagram-item foot-profile${selected ? " diagram-selected" : ""}">
      <svg viewBox="${VB_MINI}" class="diagram-svg-tall" aria-hidden="true">
        ${renderLogoFoot({
          ...FOOT_MINI,
          rotation: -42,
          footType: id,
          showBrandDisc: true,
          showMark: true,
          markSelected: selected,
          markY: 11,
        })}
      </svg>
      <figcaption>${FOOT_TYPE_LABELS[id]}</figcaption>
    </figure>
  `;
}

export function svgFootTypeSelector(ctx?: PodiatryDiagramContext, meta?: DetectionMatch): string {
  const selected = ctx?.footType ?? null;
  const detected = selected
    ? `<p class="diagram-detected">Detectado en notas${meta?.footMatchedLabel ? ` («${meta.footMatchedLabel}»)` : ""}: <strong>${FOOT_TYPE_LABELS[selected]}</strong></p>`
    : "";
  return `
    <div class="diagram-row foot-types">
      ${FOOT_TYPE_IDS.map((id) => footTypeMini(id, selected === id)).join("")}
    </div>
    ${detected}
    <p class="diagram-hint">Longitud de dedos según morfología · marque con <strong>X</strong> el tipo de pie.</p>
  `;
}

function archDiagram(id: ArchTypeId, selected: boolean): string {
  return `
    <figure class="diagram-item arch-item${selected ? " diagram-selected" : ""}">
      <svg viewBox="${VB_ARCH}" class="diagram-svg-tall" aria-hidden="true">
        <text x="44" y="9" text-anchor="middle" font-size="7.5" font-weight="600" fill="#1C1B1B">${ARCH_TYPE_LABELS[id]}</text>
        ${brandMark(44, 18, selected)}
        ${renderLogoFoot({
          cx: 44,
          cy: 58,
          scale: 0.092,
          rotation: -42,
          archType: id,
          showBrandDisc: true,
        })}
        <text x="44" y="96" text-anchor="middle" font-size="5.5" fill="#9CA3AF">planta / arco</text>
      </svg>
    </figure>
  `;
}

export function svgArchTypeSelector(ctx?: PodiatryDiagramContext, meta?: DetectionMatch): string {
  const selected = ctx?.archType ?? null;
  const detected = selected
    ? `<p class="diagram-detected">Detectado en notas${meta?.archMatchedLabel ? ` («${meta.archMatchedLabel}»)` : ""}: <strong>${ARCH_TYPE_LABELS[selected]}</strong></p>`
    : "";
  return `
    <div class="diagram-row arch-types">
      ${ARCH_TYPE_IDS.map((id) => archDiagram(id, selected === id)).join("")}
    </div>
    ${detected}
    <p class="diagram-hint">Planta interior según arco · marque con <strong>X</strong> el tipo de planta.</p>
  `;
}

function footBlock(ox: number, label: string, mirror: boolean, ctx?: PodiatryDiagramContext): string {
  return `
    <g transform="translate(${ox}, 0)">
      <text x="48" y="9" text-anchor="middle" font-size="7" font-weight="600" fill="#1C1B1B">${label}</text>
      <g transform="translate(48, 62)">
        ${renderLogoFoot({
          ...FOOT_STD,
          scale: 0.1,
          rotation: -42,
          mirror,
          footType: ctx?.footType ?? undefined,
          archType: ctx?.archType ?? undefined,
          showBrandDisc: true,
        })}
      </g>
    </g>
  `;
}

export function svgDualPlantarFeet(ctx?: PodiatryDiagramContext): string {
  const note =
    ctx?.footType || ctx?.archType
      ? `<p class="diagram-detected">Anotado: ${[
          ctx.footType ? FOOT_TYPE_LABELS[ctx.footType] : null,
          ctx.archType ? `arco ${ARCH_TYPE_LABELS[ctx.archType].toLowerCase()}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}</p>`
      : "";
  return `
    <div class="diagram-box dual-feet">
      <svg viewBox="${VB_WIDE}" class="diagram-svg-wide" aria-hidden="true">
        ${footBlock(0, "PIE IZQUIERDO", false, ctx)}
        ${footBlock(100, "PIE DERECHO", true, ctx)}
      </svg>
      ${note}
      <p class="diagram-hint">Marque helomas o lesiones sobre el dibujo.</p>
    </div>
  `;
}

function numberedFootBlock(ox: number, title: string, mirror: boolean): string {
  return `
    <g transform="translate(${ox}, 0)">
      <text x="48" y="9" text-anchor="middle" font-size="7" font-weight="600" fill="#1C1B1B">${title}</text>
      <g transform="translate(48, 62)">
        ${renderLogoFoot({
          ...FOOT_STD,
          scale: 0.1,
          rotation: -42,
          mirror,
          footType: "roman",
          showBrandDisc: true,
          showToeNumbers: true,
        })}
      </g>
    </g>
  `;
}

export function svgNumberedToesReference(): string {
  return `
    <div class="diagram-box toe-ref">
      <svg viewBox="${VB_WIDE}" class="diagram-svg-wide" aria-hidden="true">
        ${numberedFootBlock(0, "PIE IZQUIERDO", false)}
        ${numberedFootBlock(100, "PIE DERECHO", true)}
      </svg>
      <p class="diagram-hint">1 = hallux · 5 = meñique. Anote en la tabla los dedos afectados.</p>
    </div>
  `;
}

export type { PodiatryDiagramContext };
