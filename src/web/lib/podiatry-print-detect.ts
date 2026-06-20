/**
 * Detección de tipo de pie / arco desde texto clínico libre.
 *
 * - Concatena todos los campos (anamnesis, exploración, etc.): el orden entre campos no importa.
 * - Usa patrones multilingües (ES, EN, PT, FR) y expresiones con palabras en distinto orden.
 * - Puntuación: gana la coincidencia más específica (p. ej. "tipo de pie: griego" > solo "griego").
 * - Negaciones: ignora "no tiene pie plano", "no es griego"; respeta "sino normal", "es romano".
 */
import type { ArchTypeId, FootTypeId } from "./podiatry-logo-foot";
import type { ClinicalSession } from "../types/clinical";
import { podiatryArchLabel, podiatryFootLabel } from "../types/podiatry";

export type PodiatryDiagramContext = {
  footType: FootTypeId | null;
  archType: ArchTypeId | null;
};

export type DetectionMatch = {
  footType: FootTypeId | null;
  archType: ArchTypeId | null;
  footMatchedLabel: string | null;
  archMatchedLabel: string | null;
};

type ScoredRule<T extends string> = { id: T; score: number; re: RegExp; label: string };

/** Normaliza texto: minúsculas, sin tildes, guiones unificados */
export function normalizeClinicalText(texts: (string | null | undefined)[]): string {
  return texts
    .filter((t): t is string => Boolean(t && t.trim()))
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[_\-–—/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const AFFIRMATIVE_TAIL =
  /\b(es|son|era|fue|sino|sino\s+que|si\s+no|mas|más|pero\s+es|but|however|porém|porem)\s+$/i;

/** ¿La coincidencia va precedida de una afirmación explícita? (p. ej. "... es romano") */
function hasAffirmativeTail(before: string): boolean {
  const tail = before.slice(-40);
  if (AFFIRMATIVE_TAIL.test(tail)) return true;
  if (/\bes\s+(?:un\s+)?(?:pie\s+|pe\s+)?$/i.test(tail)) return true;
  return false;
}

/**
 * ¿Esta coincidencia está negada en contexto?
 * Ej.: "no es griego" → griego negado; "es romano" → romano no negado.
 */
export function isNegatedMatch(text: string, start: number, matched: string): boolean {
  const before = text.slice(Math.max(0, start - 140), start);

  if (hasAffirmativeTail(before)) {
    return false;
  }

  const tail = before.slice(-55);

  // "no es griego" — el término va justo tras "no es"
  const noEsIdx = before.lastIndexOf("no es ");
  if (noEsIdx >= 0) {
    const afterNoEs = before.slice(noEsIdx + 6);
    if (!/\bes\s+(?:un\s+)?(?:pie\s+)?/i.test(afterNoEs)) {
      const gap = before.length - noEsIdx;
      if (gap < 55) return true;
    }
  }

  // "no tiene pie plano", "no presenta arco cavo"
  if (/\bno\s+(?:tiene|presenta|muestra|hay|padece|posee)\s+(?:\w+\s+){0,5}$/i.test(tail)) {
    return true;
  }

  // "ni arco cavo", "ni pie plano"
  if (/\bni\s+(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }

  // "sin pie plano", "sin arco cavo"
  if (/\bsin\s+(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }

  // EN: "not flat", "does not have", "without cavus"
  if (/\b(?:does\s+)?not\s+(?:have|a|an)?\s*(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }
  if (/\bwithout\s+(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }
  if (/\bnon\s+$/i.test(tail)) {
    return true;
  }

  // FR: "n'est pas", "pas de pied plat"
  if (/\bn['']?est\s+pas\s+(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }
  if (/\bpas\s+(?:de\s+)?(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }

  // PT: "não é", "nao tem"
  if (/\bn[aã]o\s+(?:é|e|tem|possui)\s+(?:\w+\s+){0,4}$/i.test(tail)) {
    return true;
  }

  void matched;
  return false;
}

function pickBest<T extends string>(text: string, rules: ScoredRule<T>[]): { id: T; label: string } | null {
  let best: { id: T; score: number; label: string } | null = null;

  for (const rule of rules) {
    const globalRe = new RegExp(rule.re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = globalRe.exec(text)) !== null) {
      if (isNegatedMatch(text, m.index, m[0])) continue;
      if (!best || rule.score > best.score) {
        best = { id: rule.id, score: rule.score, label: rule.label };
      }
    }
  }

  return best ? { id: best.id, label: best.label } : null;
}

const FOOT_RULES: ScoredRule<FootTypeId>[] = [
  // —— Egipcio / Egyptian ——
  { id: "egyptian", score: 100, re: /tipo\s+de\s+pie\s*[:\-]?\s*egipc/i, label: "tipo de pie: egipcio" },
  { id: "egyptian", score: 100, re: /foot\s+type\s*[:\-]?\s*egypt/i, label: "foot type: egyptian" },
  { id: "egyptian", score: 100, re: /type\s+de\s+pied\s*[:\-]?\s*egypt/i, label: "type de pied: égyptien" },
  { id: "egyptian", score: 95, re: /pie\s+egipcio|egipcio\s+pie|pe\s+egipcio|pes\s+egipcio/i, label: "pie egipcio" },
  { id: "egyptian", score: 95, re: /egyptian\s+foot|foot\s+egyptian|egyptian\s+type/i, label: "egyptian foot" },
  { id: "egyptian", score: 95, re: /pied\s+egyptien|egyptien\s+pied|pe\s+egyptien/i, label: "pied égyptien" },
  { id: "egyptian", score: 90, re: /pe\s+egipcio|pes\s+egipcio|tipo\s+egipcio/i, label: "egípcio (PT)" },
  { id: "egyptian", score: 70, re: /\begipcio\b|\begyptian\b|\begyptien\b|\begipcio\b/i, label: "egipcio / egyptian" },
  { id: "egyptian", score: 55, re: /\bmorton\b/i, label: "morton" },

  // —— Romano / Roman ——
  { id: "roman", score: 100, re: /tipo\s+de\s+pie\s*[:\-]?\s*roman/i, label: "tipo de pie: romano" },
  { id: "roman", score: 100, re: /foot\s+type\s*[:\-]?\s*roman/i, label: "foot type: roman" },
  { id: "roman", score: 95, re: /pie\s+romano|romano\s+pie|pe\s+romano|pes\s+romano/i, label: "pie romano" },
  { id: "roman", score: 95, re: /roman\s+foot|foot\s+roman|roman\s+type/i, label: "roman foot" },
  { id: "roman", score: 95, re: /pied\s+romain|romain\s+pied|pe\s+romain/i, label: "pied romain" },
  { id: "roman", score: 85, re: /pie\s+cuadrado|square\s+foot|pe\s+quadrado/i, label: "pie cuadrado" },
  { id: "roman", score: 70, re: /\bromano\b|\bromain\b/i, label: "romano" },
  { id: "roman", score: 110, re: /(?:sino|mas|pero)\s+(?:es\s+)?(?:un\s+)?(?:pie\s+)?roman/i, label: "sino romano" },
  { id: "roman", score: 108, re: /no\s+es\s+grieg\w*[^,.]{0,25}\s+es\s+roman/i, label: "no es griego, es romano" },

  // —— Griego / Greek ——
  { id: "greek", score: 100, re: /tipo\s+de\s+pie\s*[:\-]?\s*grieg/i, label: "tipo de pie: griego" },
  { id: "greek", score: 100, re: /foot\s+type\s*[:\-]?\s*greek/i, label: "foot type: greek" },
  { id: "greek", score: 95, re: /pie\s+grieg|grieg\w*\s+pie|pe\s+grego|pes\s+grego/i, label: "pie griego" },
  { id: "greek", score: 95, re: /greek\s+foot|foot\s+greek|greek\s+type/i, label: "greek foot" },
  { id: "greek", score: 95, re: /pied\s+grec|grec\s+pied|pe\s+grec/i, label: "pied grec" },
  { id: "greek", score: 90, re: /hel[eé]nico|hellenic|index\s+plus/i, label: "helénico / index plus" },
  { id: "greek", score: 70, re: /\bgrieg\w*\b|\bgreek\b|\bgrec\b|\bgrego\b/i, label: "griego / greek" },

  // —— Germánico / Germanic ——
  { id: "germanic", score: 100, re: /tipo\s+de\s+pie\s*[:\-]?\s*german/i, label: "tipo de pie: germánico" },
  { id: "germanic", score: 100, re: /foot\s+type\s*[:\-]?\s*german/i, label: "foot type: germanic" },
  { id: "germanic", score: 95, re: /pie\s+german|german\w*\s+pie|pe\s+germanico/i, label: "pie germánico" },
  { id: "germanic", score: 95, re: /germanic\s+foot|german\s+foot|pied\s+allemand/i, label: "germanic foot" },
  { id: "germanic", score: 85, re: /pie\s+cu[nñ]a|wedge\s+foot|pe\s+em\s+cunha/i, label: "pie en cuña" },
  { id: "germanic", score: 70, re: /\bgermanic\w*\b|\bgermanico\b|\ballemand\b/i, label: "germánico" },

  // —— Celta / Celtic ——
  { id: "celtic", score: 100, re: /tipo\s+de\s+pie\s*[:\-]?\s*celt/i, label: "tipo de pie: celta" },
  { id: "celtic", score: 100, re: /foot\s+type\s*[:\-]?\s*celt/i, label: "foot type: celtic" },
  { id: "celtic", score: 95, re: /pie\s+celt|celt\w*\s+pie|pe\s+celta|pes\s+celta/i, label: "pie celta" },
  { id: "celtic", score: 95, re: /celtic\s+foot|foot\s+celtic|pied\s+celte/i, label: "celtic foot" },
  { id: "celtic", score: 70, re: /\bcelt\w*\b|\bcelta\b|\bcelte\b/i, label: "celta / celtic" },
];

const ARCH_RULES: ScoredRule<ArchTypeId>[] = [
  // —— Plano / Flat (antes que "normal") ——
  { id: "flat", score: 100, re: /tipo\s+de\s+(?:planta|arco)\s*[:\-]?\s*plan/i, label: "tipo de planta: plano" },
  { id: "flat", score: 100, re: /arch\s+type\s*[:\-]?\s*flat|flat\s+foot\s+type/i, label: "arch type: flat" },
  { id: "flat", score: 95, re: /pie\s+plano|plano\s+pie|pe\s+plano|pes\s+plano|pied\s+plat|plat\s+pied/i, label: "pie plano" },
  { id: "flat", score: 95, re: /flat\s+foot|foot\s+flat|fallen\s+arch|pes\s+plano/i, label: "flat foot" },
  { id: "flat", score: 90, re: /arco\s+plano|plano\s+arco|planta\s+plana|plana\s+planta/i, label: "arco/planta plana" },
  { id: "flat", score: 90, re: /arco\s+caido|arco\s+ca[ií]do|low\s+arch|arco\s+bajo/i, label: "arco caído / bajo" },
  { id: "flat", score: 85, re: /plano\s+valgo|planovalg|planus\b/i, label: "plano valgo / planus" },
  { id: "flat", score: 75, re: /pe\s+plano|pé\s+plano|arche\s+plat/i, label: "pé plano (PT/FR)" },

  // —— Cavo / Cavus ——
  { id: "cavus", score: 100, re: /tipo\s+de\s+(?:planta|arco)\s*[:\-]?\s*cav/i, label: "tipo de arco: cavo" },
  { id: "cavus", score: 100, re: /arch\s+type\s*[:\-]?\s*cav/i, label: "arch type: cavus" },
  { id: "cavus", score: 95, re: /pie\s+cav|cav\w*\s+pie|pe\s+cavo|pes\s+cavo|pied\s+creux/i, label: "pie cavo" },
  { id: "cavus", score: 95, re: /cavus\s+foot|foot\s+cavus|high\s+arch|arched\s+foot/i, label: "cavus / high arch" },
  { id: "cavus", score: 90, re: /arco\s+cav|cav\w*\s+arco|arco\s+alto|alto\s+arco|arco\s+excavad/i, label: "arco cavo / alto" },
  { id: "cavus", score: 85, re: /cavo\s+varo|cavovarus|pes\s+cavus/i, label: "cavo varo" },
  { id: "cavus", score: 70, re: /\bcavus\b|\bcavo\b(?!\s*varo\s*plano)/i, label: "cavus / cavo" },

  // —— Normal (menor prioridad; frases explícitas) ——
  { id: "normal", score: 100, re: /tipo\s+de\s+(?:planta|arco)\s*[:\-]?\s*normal/i, label: "tipo de arco: normal" },
  { id: "normal", score: 95, re: /arco\s+normal|normal\s+arco|planta\s+normal|normal\s+planta/i, label: "arco/planta normal" },
  { id: "normal", score: 95, re: /normal\s+arch|arch\s+normal|physiolog\w*\s+arch/i, label: "normal arch" },
  { id: "normal", score: 90, re: /pie\s+normal|normal\s+pie|arco\s+fisiolog/i, label: "pie/arco fisiológico" },
  { id: "normal", score: 110, re: /(?:sino|sino\s+que|si\s+no|mas|pero)\s+(?:es\s+)?(?:arco\s+|planta\s+)?normal\b/i, label: "sino normal" },
  { id: "normal", score: 60, re: /arco\s+conservado|arco\s+mantenido/i, label: "arco conservado" },
];

export function detectPodiatryDiagramContext(
  texts: (string | null | undefined)[]
): PodiatryDiagramContext {
  return detectPodiatryDiagramWithMeta(texts);
}

/** Incluye qué frase disparó la detección (útil para la leyenda en impresión) */
export function detectPodiatryDiagramWithMeta(
  texts: (string | null | undefined)[]
): DetectionMatch {
  const text = normalizeClinicalText(texts);
  if (!text) {
    return { footType: null, archType: null, footMatchedLabel: null, archMatchedLabel: null };
  }

  const foot = pickBest(text, FOOT_RULES);
  const arch = pickBest(text, ARCH_RULES);

  return {
    footType: foot?.id ?? null,
    archType: arch?.id ?? null,
    footMatchedLabel: foot?.label ?? null,
    archMatchedLabel: arch?.label ?? null,
  };
}

/** Prioridad: campos estructurados en sesiones → detección en texto libre */
export function resolvePodiatryDiagramContext(sessions: ClinicalSession[]): DetectionMatch {
  const sorted = [...sessions].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  const structuredFoot = sorted.find((s) => s.footType)?.footType ?? null;
  const structuredArch = sorted.find((s) => s.archType)?.archType ?? null;

  const textDetected = detectPodiatryDiagramWithMeta(
    sessions.flatMap((s) => [
      s.anamnesis,
      s.physicalExamination,
      s.diagnosis,
      s.clinicalNotes,
      s.treatmentPlan,
      s.followUpNotes,
    ])
  );

  return {
    footType: structuredFoot ?? textDetected.footType,
    archType: structuredArch ?? textDetected.archType,
    footMatchedLabel: structuredFoot
      ? `selector sesión: ${podiatryFootLabel(structuredFoot)}`
      : textDetected.footMatchedLabel,
    archMatchedLabel: structuredArch
      ? `selector sesión: ${podiatryArchLabel(structuredArch)}`
      : textDetected.archMatchedLabel,
  };
}
