import type { ClinicalSession, Patient } from "../types/clinical";
import type { ClinicalLayoutConfig, CustomSectionsData } from "../types/clinical-layout";
import {
  createDefaultClinicalLayout,
  getCustomSections,
  getSectionLabel,
  isSectionActive,
} from "../types/clinical-layout";
import {
  FAMILY_ANTECEDENT_IDS,
  formatFamilyAntecedentPrintRow,
  normalizeMedicalHistory,
} from "../types/medical-history";
import { buildCustomSectionPrintBlock } from "./custom-section-print";
import {
  buildAnamnesisPrintBlock,
  buildDigitalAlterationsPrintHtml,
  buildExamPrintBlock,
  buildHelomasPrintHtml,
  buildLimbAssessmentPrintHtml,
  buildOnychopathiesPrintHtml,
  buildSweatDisordersPrintHtml,
} from "./podiatry-print-builders";
import {
  svgArchTypeSelector,
  svgDualPlantarFeet,
  svgFootTypeSelector,
  svgNumberedToesReference,
  type PodiatryDiagramContext,
} from "./podiatry-print-diagrams";
import { resolvePodiatryDiagramContext } from "./podiatry-print-detect";

export type ClinicPrintInfo = {
  clinicName?: string;
  legalName?: string;
  rfc?: string;
  clues?: string;
  cofeprisRegistration?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  licenseNumber?: string;
};

export type ProfessionalPrintInfo = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  licenseNumber?: string;
  professionalLicense?: string;
  license?: string;
};

export type PodiatryHistoryPrintInput = {
  patient: Patient;
  sessions: ClinicalSession[];
  latestSession: ClinicalSession | null;
  clinicLogo?: string;
  clinic: ClinicPrintInfo | null;
  professional: ProfessionalPrintInfo | null;
  podiatristName?: string;
  podiatristLicense?: string | null;
  layout?: ClinicalLayoutConfig;
  /** Por defecto 10 filas en evolución; exportación masiva puede usar más. */
  maxEvolutionRows?: number;
};

const esc = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Data URI seguro para atributo src (sin escapar el payload base64). */
const escAttr = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");

function resolvePrintAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || /^https?:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("r2://")) {
    const key = trimmed.slice(5);
    const clinic = key.match(/^logos\/clinic\/(.+?)\.webp$/i);
    if (clinic) return `/api/media/logo/clinic/${clinic[1]}`;
    const prof = key.match(/^logos\/professional\/(.+?)\.webp$/i);
    if (prof) return `/api/media/logo/professional/${prof[1]}`;
    const sessionImg = key.match(/^sessions\/.+\/(.+?)\.webp$/i);
    if (sessionImg) return `/api/session-images/${sessionImg[1]}/file`;
  }
  if (trimmed.startsWith("/")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}${trimmed}`;
    }
    return trimmed;
  }
  return trimmed;
}

function toAbsoluteFetchUrl(resolved: string): string {
  if (/^https?:/i.test(resolved)) return resolved;
  if (typeof window !== "undefined" && window.location?.origin && resolved.startsWith("/")) {
    return `${window.location.origin}${resolved}`;
  }
  return resolved;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convierte logo/imagen de API o r2:// a data URI para HTML descargable (file:// sin sesión).
 */
export async function embedImageAsDataUri(src: string | null | undefined): Promise<string | null> {
  if (!src?.trim()) return null;
  const trimmed = src.trim();
  if (trimmed.startsWith("data:")) return trimmed;

  const resolved = resolvePrintAssetUrl(trimmed);
  if (!resolved) return null;

  const fetchUrl = toAbsoluteFetchUrl(resolved);
  try {
    const res = await fetch(fetchUrl, { credentials: "include" });
    if (!res.ok) return resolved.startsWith("data:") ? resolved : null;
    const blob = await res.blob();
    if (!blob.size) return null;
    return await blobToDataUri(blob);
  } catch {
    return null;
  }
}

function resolveSessionImageSrc(img: unknown): string | null {
  if (img == null) return null;
  if (typeof img === "object" && "data" in (img as object)) {
    const row = img as { data?: unknown; format?: string };
    if (typeof row.data === "string") return resolveSessionImageSrc(row.data);
    return null;
  }
  if (typeof img !== "string") return null;
  const trimmed = img.trim();
  if (!trimmed) return null;
  if (/^data:image\//i.test(trimmed)) return trimmed;
  if (/^(blob:|https?:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("r2://") || trimmed.startsWith("/api/")) {
    return resolvePrintAssetUrl(trimmed);
  }
  return `data:image/webp;base64,${trimmed.replace(/\s/g, "")}`;
}

const withBreaks = (value: unknown): string =>
  esc(value).replaceAll("\n", "<br />");

const fmtDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES");
};

const fmtDateLong = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const h2 = (title: string): string => `<h2>${esc(title)}</h2>`;

function buildCustomSectionsPrintHtml(
  layout: ClinicalLayoutConfig,
  data: CustomSectionsData | undefined
): string {
  const customs = getCustomSections(layout, "print");
  if (customs.length === 0) return "";
  return customs
    .map((section) => buildCustomSectionPrintBlock(section, data?.[section.id]))
    .join("");
}

const PRINT_STYLES = `
  :root {
    --ink: #1C1B1B;
    --muted: #6b7280;
    --line: #e4e4e7;
    --panel: #fafafa;
    --brand-ring: #e4e4e7;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: var(--ink);
    margin: 0;
    padding: 0;
    background: #fff;
    font-size: 10.5px;
    line-height: 1.28;
  }
  .document {
    width: 210mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 4mm 6mm;
  }
  .head {
    border-bottom: 1.5px solid var(--ink);
    padding-bottom: 3px;
    margin-bottom: 3px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    break-inside: avoid;
  }
  .head img {
    max-height: 44px;
    max-width: 110px;
    object-fit: contain;
  }
  .head h1 { margin: 0; font-size: 16px; line-height: 1.12; }
  .meta { color: var(--muted); font-size: 8.5px; line-height: 1.2; margin-top: 1px; }
  .folio {
    margin-top: 3px;
    padding: 2px 5px;
    border: 1px solid var(--line);
    background: var(--panel);
    font-size: 9.5px;
  }
  h2 {
    margin: 3px 0 1px;
    font-size: 10px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 1px;
    text-transform: uppercase;
    letter-spacing: 0.25px;
    break-after: avoid;
  }
  .section { margin-bottom: 2px; }
  .section-tight { margin-bottom: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  th, td {
    border: 1px solid var(--line);
    padding: 2px 3px;
    vertical-align: top;
  }
  th { background: var(--panel); text-align: left; font-weight: 600; }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
    align-items: start;
  }
  .grid-2-wide-left {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 4px;
    align-items: start;
  }
  .grid-patient {
    display: grid;
    grid-template-columns: 1.35fr 0.65fr;
    gap: 4px;
    align-items: start;
  }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; }
  .muted { color: var(--muted); font-size: 8.5px; }
  .block {
    border: 1px solid var(--line);
    padding: 3px 4px;
    min-height: 0;
    font-size: 9.5px;
    background: #fff;
  }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  .document + .document {
    page-break-before: always;
    break-before: page;
    margin-top: 8mm;
  }
  .export-cover {
    margin: 0 auto 6mm;
    padding: 6px 8px;
    border: 1px solid var(--line);
    background: var(--panel);
    font-size: 9px;
    max-width: 210mm;
  }
  .diagram-row {
    display: flex;
    justify-content: space-between;
    gap: 3px;
    margin: 1px 0 2px;
  }
  .diagram-item {
    flex: 1;
    margin: 0;
    text-align: center;
    border: 1px solid var(--brand-ring);
    padding: 2px;
    background: #fff;
    border-radius: 3px;
  }
  .foot-types .diagram-item { min-width: 0; }
  .arch-types .diagram-item { flex: 1; }
  .diagram-item figcaption {
    font-size: 7px;
    margin-top: 1px;
    color: var(--ink);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: 0.2px;
  }
  .diagram-svg-tall { width: 100%; height: 88px; display: block; }
  .diagram-svg-wide { width: 100%; height: auto; max-height: 118px; display: block; }
  .foot-types .diagram-svg-tall { height: 94px; }
  .arch-types .diagram-svg-tall { height: 92px; }
  .diagram-box {
    border: 1px solid var(--brand-ring);
    padding: 4px;
    margin: 1px 0;
    background: #fff;
    border-radius: 4px;
  }
  .diagram-hint {
    margin: 2px 0 0;
    font-size: 7px;
    color: var(--muted);
    text-align: center;
    line-height: 1.15;
  }
  .diagram-detected {
    margin: 2px 0 0;
    font-size: 7.5px;
    color: var(--ink);
    text-align: center;
  }
  .diagram-selected {
    border-color: var(--ink) !important;
    box-shadow: inset 0 0 0 1px var(--ink);
  }
  .photos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
  }
  .photo-card {
    border: 1px solid var(--line);
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .photo-card img {
    width: 100%;
    height: 58px;
    object-fit: cover;
    display: block;
    background: #f3f4f6;
  }
  .photo-card figcaption {
    font-size: 7px;
    padding: 1px 3px;
    background: var(--panel);
    color: var(--muted);
    border-top: 1px solid var(--line);
  }
  .footer-note {
    margin-top: 3px;
    color: var(--muted);
    font-size: 7.5px;
  }
  .si-no { width: 18px; text-align: center; }
  .break-ok { break-inside: auto; page-break-inside: auto; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 4mm; }
    .document { padding: 0; width: auto; }
  }
`;

function buildClinicalPhotosHtml(sessions: ClinicalSession[]): string {
  const photos = sessions.flatMap((s) =>
    (s.images ?? [])
      .map((img, idx) => {
        const src = resolveSessionImageSrc(img);
        return src ? { src, sessionDate: s.sessionDate, idx: idx + 1 } : null;
      })
      .filter((p): p is { src: string; sessionDate: string; idx: number } => p !== null)
  );

  if (photos.length === 0) {
    return `<p class="muted">No hay fotografías clínicas subidas por el podólogo en las sesiones registradas.</p>`;
  }

  return `
    <div class="photos-grid">
      ${photos
        .slice(0, 16)
        .map(
          (p) => `
        <figure class="photo-card">
          <img src="${escAttr(p.src)}" alt="Foto clínica sesión ${esc(fmtDate(p.sessionDate))}" />
          <figcaption>Sesión ${esc(fmtDate(p.sessionDate))} · Imagen ${p.idx}</figcaption>
        </figure>
      `
        )
        .join("")}
    </div>
    ${photos.length > 16 ? `<p class="muted">+ ${photos.length - 16} imagen(es) adicionales.</p>` : ""}
  `;
}

export function buildPodiatryHistoryDocumentInner(input: PodiatryHistoryPrintInput): string {
  const {
    patient,
    sessions,
    latestSession,
    clinicLogo,
    clinic,
    professional,
    podiatristName,
    podiatristLicense,
    layout: inputLayout,
  } = input;

  const layout = inputLayout ?? createDefaultClinicalLayout();
  const printOn = (id: Parameters<typeof isSectionActive>[1]) => isSectionActive(layout, id, "print");

  const clinicName =
    clinic?.legalName || clinic?.clinicName || professional?.name || podiatristName || "Consulta Podológica";
  const clinicPhone = clinic?.phone || professional?.phone || "";
  const clinicEmail = clinic?.email || professional?.email || "";
  const clinicAddress = clinic?.address
    ? `${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}${clinic.postalCode ? ` ${clinic.postalCode}` : ""}`
    : professional?.address
      ? `${professional.address}${professional.city ? `, ${professional.city}` : ""}${professional.postalCode ? ` ${professional.postalCode}` : ""}`
      : "";
  const clinicLicense = clinic?.licenseNumber || professional?.licenseNumber || "";

  const mh = normalizeMedicalHistory(patient.medicalHistory);
  const conditions = mh.conditions;
  const allergies = mh.allergies;
  const medications = mh.medications;
  const anamnesisText = latestSession?.anamnesis ?? "";
  const examText = latestSession?.physicalExamination ?? "";
  const diagnosisText = latestSession?.diagnosis ?? "";
  const treatmentText = latestSession?.treatmentPlan ?? "";

  const diagramMeta = resolvePodiatryDiagramContext(sessions);
  const diagramCtx = diagramMeta;

  const printPersonalAntecedents = printOn("patient_medical_history");
  const printFamilyAntecedents = printOn("patient_family_history");
  const printPatientCurp = printOn("patient_curp");
  const printPatientEmail = printOn("patient_email");
  const printPatientAddress = printOn("patient_address");

  const familyRows = FAMILY_ANTECEDENT_IDS.map((id) =>
    formatFamilyAntecedentPrintRow(id, mh.family[id])
  );
  const personalRows = [
    ["Alergias medicamentosas", allergies.length > 0 ? "SI" : "NO", allergies.join(", ") || "—"],
    ["Medicación habitual", medications.length > 0 ? "SI" : "NO", medications.join(", ") || "—"],
    ["Patologías crónicas", conditions.length > 0 ? "SI" : "NO", conditions.join(", ") || "—"],
  ];

  const antecedentsBlock =
    printPersonalAntecedents || printFamilyAntecedents
      ? `<div>
              ${h2("II. Antecedentes")}
              ${
                printFamilyAntecedents
                  ? `<table>
                <tr><th colspan="3">Familiares</th></tr>
                <tr><th>Enfermedad</th><th class="si-no">SI</th><th>Obs.</th></tr>
                ${familyRows.map(([label, val, obs]) => `<tr><td>${esc(label)}</td><td class="si-no">${esc(val)}</td><td>${esc(obs)}</td></tr>`).join("")}
              </table>`
                  : ""
              }
              ${
                printPersonalAntecedents
                  ? `<table style="margin-top:2px">
                <tr><th colspan="3">Personales</th></tr>
                <tr><th>Enfermedad</th><th class="si-no">SI</th><th>Obs.</th></tr>
                ${personalRows.map(([label, val, obs]) => `<tr><td>${esc(label)}</td><td class="si-no">${esc(val)}</td><td>${esc(obs)}</td></tr>`).join("")}
              </table>`
                  : ""
              }
            </div>`
      : "";

  const evolutionLimit = input.maxEvolutionRows ?? 10;
  const evolutionRows = sessions
    .slice(0, evolutionLimit)
    .map(
      (s) => `
      <tr>
        <td>${esc(fmtDate(s.sessionDate))}</td>
        <td>${withBreaks(s.diagnosis || "—")}</td>
        <td>${withBreaks(s.treatmentPlan || "—")}</td>
        <td>${withBreaks(s.followUpNotes || s.clinicalNotes || "—")}</td>
        <td>${esc(podiatristName || "—")}</td>
        <td>${esc(fmtDate(s.nextAppointmentDate))}</td>
      </tr>
    `
    )
    .join("");

  const sweatBlock = printOn("podiatry_sweat") ? buildSweatDisordersPrintHtml(latestSession) : "";
  const limbBlock = printOn("podiatry_limb") ? buildLimbAssessmentPrintHtml(latestSession) : "";
  const helomasBlock = printOn("podiatry_helomas") ? buildHelomasPrintHtml(latestSession) : "";
  const digitalBlock = printOn("podiatry_digital") ? buildDigitalAlterationsPrintHtml(latestSession) : "";
  const onychopathiesBlock = printOn("podiatry_onychopathies")
    ? buildOnychopathiesPrintHtml(latestSession)
    : "";
  const anamnesisBlock = printOn("anamnesis") ? buildAnamnesisPrintBlock(anamnesisText) : "";
  const examBlock = printOn("physical_examination") ? buildExamPrintBlock(examText) : "";
  const customSectionsBlock = buildCustomSectionsPrintHtml(layout, latestSession?.customSections);
  const morphologyPrint = printOn("podiatry_morphology");
  const showDiagnosis = printOn("diagnosis");
  const showTreatment = printOn("treatment_plan");
  const showClinicalNotes = printOn("clinical_notes");
  const showPhotos = printOn("session_images");

  const morphologySection = morphologyPrint
    ? `<div class="section grid-2 section-tight">
            <div class="avoid-break">
              ${h2("III.1 Tipo de pie")}
              ${svgFootTypeSelector(diagramCtx, diagramMeta)}
            </div>
            <div class="avoid-break">
              ${h2("III.2 Tipo de planta")}
              ${svgArchTypeSelector(diagramCtx, diagramMeta)}
            </div>
          </div>`
    : "";

  const explorationGrid =
    sweatBlock || anamnesisBlock || limbBlock || examBlock
      ? `<div class="section grid-2 section-tight">
            <div>${sweatBlock}${anamnesisBlock}</div>
            <div>${limbBlock}${examBlock}</div>
          </div>`
      : "";

  const helomasSection =
    printOn("podiatry_helomas") || digitalBlock || showClinicalNotes || showDiagnosis || showTreatment
      ? `<div class="section grid-2-wide-left section-tight">
            <div>
              ${printOn("podiatry_helomas") ? `${h2("III.5 Hiperqueratosis")}${svgDualPlantarFeet(diagramCtx)}${helomasBlock}` : ""}
            </div>
            <div>
              ${digitalBlock}
              ${showClinicalNotes ? `<div class="block" style="margin-top:3px"><strong>${esc(getSectionLabel(layout, "clinical_notes"))}:</strong> ${withBreaks(latestSession?.clinicalNotes || "—")}</div>` : ""}
              ${showDiagnosis || showTreatment
                ? `<div class="grid-2" style="margin-top:3px">
                ${showDiagnosis ? `<div>${h2(getSectionLabel(layout, "diagnosis"))}<div class="block">${withBreaks(diagnosisText || "—")}</div></div>` : ""}
                ${showTreatment ? `<div>${h2(getSectionLabel(layout, "treatment_plan"))}<div class="block">${withBreaks(treatmentText || "—")}</div></div>` : ""}
              </div>`
                : ""}
            </div>
          </div>`
      : "";

  const onychSection = onychopathiesBlock
    ? `<div class="section grid-2-wide-left section-tight">
            <div>${onychopathiesBlock}</div>
            <div>${svgNumberedToesReference()}</div>
          </div>`
    : "";

  const photosSection = showPhotos
    ? `<div class="section section-tight break-ok">
            ${h2("Registro fotográfico clínico")}
            <p class="muted">Imágenes subidas por el podólogo.</p>
            ${buildClinicalPhotosHtml(sessions)}
          </div>`
    : "";

  const resolvedClinicLogo = resolvePrintAssetUrl(clinicLogo ?? null);

  const headerBlock = `
    <header class="head">
      ${resolvedClinicLogo ? `<img src="${escAttr(resolvedClinicLogo)}" alt="Logo" />` : ""}
      <div style="flex:1">
        <h1>${esc(clinicName)}</h1>
        ${podiatristLicense ? `<div class="meta"><strong>Lic./Cédula:</strong> ${esc(podiatristLicense)}</div>` : ""}
        <div class="meta">
          ${clinicLicense ? `<span><strong>Reg. Sanitario:</strong> ${esc(clinicLicense)} · </span>` : ""}
          ${clinic?.rfc ? `<span><strong>RFC:</strong> ${esc(clinic.rfc)} · </span>` : ""}
          ${clinic?.clues ? `<span><strong>CLUES:</strong> ${esc(clinic.clues)} · </span>` : ""}
          ${clinic?.cofeprisRegistration ? `<span><strong>COFEPRIS:</strong> ${esc(clinic.cofeprisRegistration)}</span>` : ""}
        </div>
        <div class="meta">
          ${clinicPhone ? `${esc(clinicPhone)} · ` : ""}${clinicEmail ? esc(clinicEmail) : ""}
          ${clinicAddress ? `<br />${esc(clinicAddress)}` : ""}
        </div>
        <div class="folio"><strong>HISTORIA CLÍNICA PODOLÓGICA</strong> · Folio: ${esc(patient.folio || "—")}</div>
      </div>
    </header>
  `;

  return `
        <div class="document">
          ${headerBlock}

          <div class="section section-tight grid-patient avoid-break">
            <div>
              ${h2("I. Datos del paciente")}
              <table>
                <tr>
                  <th>Apellidos y nombres</th>
                  <td>${esc(`${patient.lastName} ${patient.firstName}`.trim())}</td>
                </tr>
                <tr>
                  <th>DNI/NIE</th>
                  <td>${esc(patient.idNumber || "—")}</td>
                </tr>
                <tr>
                  <th>Nacimiento</th>
                  <td>${esc(fmtDate(patient.dateOfBirth))}</td>
                </tr>
                <tr>
                  <th>Teléfono</th>
                  <td>${esc(patient.phone || "—")}</td>
                </tr>
                ${
                  printPatientCurp
                    ? `<tr>
                  <th>CURP</th>
                  <td>${esc(patient.curp || "—")}</td>
                </tr>`
                    : ""
                }
                ${
                  printPatientEmail
                    ? `<tr>
                  <th>Email</th>
                  <td>${esc(patient.email || "—")}</td>
                </tr>`
                    : ""
                }
                ${
                  printPatientAddress
                    ? `<tr>
                  <th>Dirección</th>
                  <td>${esc(`${patient.address || ""}${patient.city ? `, ${patient.city}` : ""}${patient.postalCode ? ` ${patient.postalCode}` : ""}` || "—")}</td>
                </tr>`
                    : ""
                }
              </table>
            </div>
            ${antecedentsBlock}
          </div>

          ${morphologySection}
          ${explorationGrid}
          ${helomasSection}
          ${onychSection}
          ${customSectionsBlock}
          ${photosSection}

          <div class="section section-tight break-ok">
            ${h2("IV. Evolución clínica")}
            <table>
              <tr>
                <th>Fecha</th><th>Diagnóstico</th><th>Tratamiento</th>
                <th>Indicaciones</th><th>Podólogo</th><th>Próx. cita</th>
              </tr>
              ${evolutionRows || `<tr><td colspan="6">Sin sesiones registradas.</td></tr>`}
            </table>
            <p class="footer-note">
              PodoAdmin · ${esc(new Date().toLocaleString("es-ES"))} ·
              ${esc(String(sessions.length))} sesión(es) · Última: ${esc(fmtDateLong(latestSession?.sessionDate || null))}
            </p>
          </div>
        </div>
  `;
}

export function buildPodiatryHistoryPrintHtml(input: PodiatryHistoryPrintInput): string {
  const title = `Historia Podológica - ${input.patient.firstName} ${input.patient.lastName}`;
  const inner = buildPodiatryHistoryDocumentInner(input);
  return `<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${esc(title)}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>${inner}</body>
    </html>`;
}

export function buildCombinedPodiatryHistoriesPrintHtml(
  inputs: PodiatryHistoryPrintInput[],
  meta: { podiatristName?: string; exportedAt?: string }
): string {
  const title = `Historiales clínicos — ${meta.podiatristName || "Podólogo"}`;
  const exportedLabel = meta.exportedAt
    ? new Date(meta.exportedAt).toLocaleString("es-ES")
    : new Date().toLocaleString("es-ES");
  const cover =
    inputs.length > 0
      ? `<div class="export-cover"><strong>Exportación PodoAdmin</strong> · ${esc(exportedLabel)} · <strong>${inputs.length}</strong> paciente(s). Abra este archivo en el navegador y use <em>Imprimir → Guardar como PDF</em>.</div>`
      : "";
  const docs = inputs.map((item) => buildPodiatryHistoryDocumentInner(item)).join("");
  return `<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${esc(title)}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>${cover}${docs}</body>
    </html>`;
}

export function downloadHtmlFile(html: string, filename: string): boolean {
  try {
    const safeFilename = filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() || "historiales.html";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    a.style.display = "none";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    // Revocar tarde: si se hace al instante algunos navegadores cancelan la descarga.
    window.setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 5000);
    return true;
  } catch (err) {
    console.error("downloadHtmlFile:", err);
    return false;
  }
}

/** Abre el HTML en una pestaña nueva (respaldo si falla la descarga directa). */
export function openHtmlInNewTab(html: string): boolean {
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, "_blank", "noopener,noreferrer");
    if (!tab) return false;
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return true;
  } catch (err) {
    console.error("openHtmlInNewTab:", err);
    return false;
  }
}

export function openHtmlForPrint(html: string): boolean {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  printWindow.document.write(html);
  printWindow.document.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    printWindow.focus();
    printWindow.print();
  };

  const imgs = Array.from(printWindow.document.images);
  if (imgs.length === 0) {
    triggerPrint();
    return true;
  }

  let pending = imgs.length;
  const onReady = () => {
    pending -= 1;
    if (pending <= 0) triggerPrint();
  };

  for (const img of imgs) {
    if (img.complete) onReady();
    else {
      img.addEventListener("load", onReady, { once: true });
      img.addEventListener("error", onReady, { once: true });
    }
  }

  window.setTimeout(triggerPrint, 4000);
  return true;
}

export function openPodiatryHistoryPrint(input: PodiatryHistoryPrintInput): boolean {
  return openHtmlForPrint(buildPodiatryHistoryPrintHtml(input));
}

export type PodiatryHistoriesBundleForPrint = {
  patients: Patient[];
  sessions: ClinicalSession[];
  clinicLogo?: string | null;
  clinic: ClinicPrintInfo | null;
  professional: ProfessionalPrintInfo | null;
  podiatristName?: string;
  podiatristLicense?: string | null;
  layout?: ClinicalLayoutConfig;
};

/** Convierte el bundle de la API en entradas para impresión (un documento por paciente). */
export function buildPodiatryPrintInputsFromBundle(
  bundle: PodiatryHistoriesBundleForPrint,
  options?: { maxEvolutionRows?: number }
): PodiatryHistoryPrintInput[] {
  const maxEvolutionRows = options?.maxEvolutionRows ?? 50;
  return bundle.patients.map((patient) => {
    const patientSessions = bundle.sessions
      .filter((s) => s.patientId === patient.id)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    return {
      patient,
      sessions: patientSessions,
      latestSession: patientSessions[0] ?? null,
      clinicLogo: bundle.clinicLogo ?? undefined,
      clinic: bundle.clinic,
      professional: bundle.professional,
      podiatristName: bundle.podiatristName,
      podiatristLicense: bundle.podiatristLicense,
      layout: bundle.layout,
      maxEvolutionRows,
    };
  });
}
