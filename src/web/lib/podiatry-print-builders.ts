import type { ClinicalSession } from "../types/clinical";
import type {
  DigitalAlterationEntry,
  HelomaEntry,
  LimbAssessmentEntry,
  OnychopathyEntry,
  SweatDisorderEntry,
} from "../types/podiatry";
import {
  PODIATRY_DIGITAL_OPTIONS,
  PODIATRY_HELOMA_OPTIONS,
  PODIATRY_LIMB_OPTIONS,
  PODIATRY_ONYCHOPATHY_OPTIONS,
  PODIATRY_SWEAT_OPTIONS,
  normalizeDigitalAlterations,
  normalizeHelomas,
  normalizeLimbAssessment,
  normalizeOnychopathies,
  normalizeSweatDisorders,
} from "../types/podiatry";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const h2 = (title: string): string => `<h2>${esc(title)}</h2>`;

const siNo = (present: boolean | null | undefined): { si: string; no: string } => ({
  si: present === true ? "X" : "",
  no: present === false ? "X" : "",
});

const sideSiNo = (v: boolean | null | undefined): string =>
  v === true ? "SI" : v === false ? "NO" : "—";

function notEvaluatedBlock(title: string, label = "No evaluado en consulta."): string {
  return `${h2(title)}<p class="muted">${esc(label)}</p>`;
}

export function buildSweatDisordersPrintHtml(session: ClinicalSession | null): string {
  const entries = normalizeSweatDisorders(session?.sweatDisorders);
  const rows = entries.filter((e) => e.present !== null || e.notes.trim());
  if (rows.length === 0) return notEvaluatedBlock("III.3 Patología del sudor");

  const body = rows
    .map((row) => {
      const label = PODIATRY_SWEAT_OPTIONS.find((o) => o.id === row.id)?.label ?? row.id;
      const { si, no } = siNo(row.present);
      return `<tr><td>${esc(label)}</td><td class="si-no">${si}</td><td class="si-no">${no}</td><td>${esc(row.notes || "—")}</td></tr>`;
    })
    .join("");

  return `${h2("III.3 Patología del sudor")}
    <table>
      <tr><th>Trastorno</th><th class="si-no">SI</th><th class="si-no">NO</th><th>Obs.</th></tr>
      ${body}
    </table>`;
}

export function buildLimbAssessmentPrintHtml(session: ClinicalSession | null): string {
  const entries = normalizeLimbAssessment(session?.limbAssessment);
  const rows = entries.filter(
    (e) => e.left !== null || e.right !== null || e.notes.trim()
  );
  if (rows.length === 0) return notEvaluatedBlock("III.4 Valoración pie y pierna");

  const body = rows
    .map((row) => {
      const label = PODIATRY_LIMB_OPTIONS.find((o) => o.id === row.id)?.label ?? row.id;
      return `<tr><td>${esc(label)}</td><td class="si-no">${sideSiNo(row.left) === "SI" ? "X" : ""}</td><td class="si-no">${sideSiNo(row.left) === "NO" ? "X" : ""}</td><td class="si-no">${sideSiNo(row.right) === "SI" ? "X" : ""}</td><td class="si-no">${sideSiNo(row.right) === "NO" ? "X" : ""}</td><td>${esc(row.notes || "—")}</td></tr>`;
    })
    .join("");

  return `${h2("III.4 Valoración pie y pierna")}
    <table>
      <tr><th></th><th colspan="2">Izq.</th><th colspan="2">Der.</th><th>Obs.</th></tr>
      <tr><th></th><th class="si-no">SI</th><th class="si-no">NO</th><th class="si-no">SI</th><th class="si-no">NO</th><th></th></tr>
      ${body}
    </table>`;
}

export function buildHelomasPrintHtml(session: ClinicalSession | null): string {
  const entries = normalizeHelomas(session?.helomas);
  const rows = entries.filter(
    (e) =>
      e.present !== null ||
      e.locationLeft.trim() ||
      e.locationRight.trim() ||
      e.notes.trim()
  );
  if (rows.length === 0) {
    return `<p class="muted" style="margin-top:2px">Helomas: no evaluados en consulta.</p>`;
  }

  return `<table style="margin-top:2px">
    <tr><th>Helomas</th><th class="si-no">SI</th><th class="si-no">NO</th><th>Izq.</th><th>Der.</th><th>Obs.</th></tr>
    ${rows
      .map((row) => {
        const label = PODIATRY_HELOMA_OPTIONS.find((o) => o.id === row.id)?.label ?? row.id;
        const { si, no } = siNo(row.present);
        return `<tr><td>${esc(label)}</td><td class="si-no">${si}</td><td class="si-no">${no}</td><td>${esc(row.locationLeft || "—")}</td><td>${esc(row.locationRight || "—")}</td><td>${esc(row.notes || "—")}</td></tr>`;
      })
      .join("")}
  </table>`;
}

export function buildDigitalAlterationsPrintHtml(session: ClinicalSession | null): string {
  const entries = normalizeDigitalAlterations(session?.digitalAlterations);
  const rows = entries.filter(
    (e) => e.present !== null || e.locationLeft.trim() || e.locationRight.trim()
  );
  if (rows.length === 0) return notEvaluatedBlock("III.6 Alteraciones digitales");

  const body = rows
    .map((row) => {
      const label = PODIATRY_DIGITAL_OPTIONS.find((o) => o.id === row.id)?.label ?? row.id;
      const { si, no } = siNo(row.present);
      return `<tr><td>${esc(label)}</td><td class="si-no">${si}</td><td class="si-no">${no}</td><td>${esc(row.locationLeft || "—")}</td><td>${esc(row.locationRight || "—")}</td></tr>`;
    })
    .join("");

  return `${h2("III.6 Alteraciones digitales")}
    <table>
      <tr><th></th><th class="si-no">SI</th><th class="si-no">NO</th><th>Izq.</th><th>Der.</th></tr>
      ${body}
    </table>`;
}

export function buildOnychopathiesPrintHtml(session: ClinicalSession | null): string {
  const entries = normalizeOnychopathies(session?.onychopathies);
  const rows = entries.filter(
    (e) => e.present !== null || e.toesLeft.trim() || e.toesRight.trim()
  );
  if (rows.length === 0) {
    return `${h2("III.7 Onicopatías")}<p class="muted">No visto en consulta.</p>`;
  }

  const body = rows
    .map((row) => {
      const label = PODIATRY_ONYCHOPATHY_OPTIONS.find((o) => o.id === row.id)?.label ?? row.id;
      const { si, no } = siNo(row.present);
      return `<tr><td>${esc(label)}</td><td class="si-no">${si}</td><td class="si-no">${no}</td><td>${esc(row.toesLeft || "—")}</td><td>${esc(row.toesRight || "—")}</td></tr>`;
    })
    .join("");

  return `${h2("III.7 Onicopatías")}
    <table>
      <tr><th>Onicopatía</th><th class="si-no">SI</th><th class="si-no">NO</th><th>Dedos izq.</th><th>Dedos der.</th></tr>
      ${body}
    </table>`;
}

export function buildAnamnesisPrintBlock(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return `${h2("Anamnesis")}<div class="block">${esc(t).replaceAll("\n", "<br />")}</div>`;
}

export function buildExamPrintBlock(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return `${h2("Exploración física")}<div class="block">${esc(t).replaceAll("\n", "<br />")}</div>`;
}
