import type { Prescription } from "../types/prescription";
import type { PrintPreferencesConfig } from "../types/print-preferences";
import { printPageSizeCss, printPageWidthCss } from "../types/print-preferences";
import { getBrandCssVar } from "./palette-preferences";
import { openHtmlForPrint } from "./podiatry-history-print";
import { computeAgeYears, formatPrescriptionAge } from "./prescription-utils";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escAttr = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");

export type PrescriptionPrintContext = {
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  clinicLicenseNumber: string;
  clinicLogo?: string;
  podiatristCedula: string;
  podiatristRegistro: string;
};

export type PrescriptionPrintInput = {
  prescription: Prescription;
  prefs: PrintPreferencesConfig;
  context: PrescriptionPrintContext;
};

function buildPrescriptionStyles(prefs: PrintPreferencesConfig): string {
  const rx = prefs.prescription;
  const compact = rx.compact;
  const pageW = printPageWidthCss(prefs.prescription.orientation);
  const brandInk = prefs.monochrome ? "#1a1a1a" : getBrandCssVar("--brand-ink", "#1a1a1a");
  const brandCanvas = prefs.monochrome ? "#f2f2f2" : getBrandCssVar("--brand-canvas", "#f9fafb");
  const brandMuted = prefs.monochrome ? "#555555" : getBrandCssVar("--brand-muted", "#6b7280");
  const headerJustify = prefs.headerAlign === "center" ? "center" : "flex-start";
  const headerTextAlign = prefs.headerAlign === "center" ? "center" : "left";
  const pageMargin = compact ? "8mm 10mm" : "10mm 12mm";

  return `
    * { box-sizing: border-box; }
    @page { size: ${printPageSizeCss(prefs.prescription.orientation)}; margin: ${pageMargin}; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0 auto;
      padding: ${compact ? "6px 8px" : "10px 12px"};
      width: 100%;
      max-width: ${pageW};
      color: ${brandInk};
      font-size: ${compact ? "11px" : "12px"};
      line-height: ${compact ? "1.3" : "1.35"};
    }
    .doc { display: flex; flex-direction: column; gap: ${compact ? "6px" : "8px"}; }
    .header {
      border-bottom: 1.5px solid ${brandInk};
      padding-bottom: ${compact ? "4px" : "6px"};
    }
    .header-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: ${compact ? "6px" : "8px"};
      justify-content: ${headerJustify};
      text-align: ${headerTextAlign};
    }
    .header-logo {
      max-height: ${compact ? "36px" : "44px"};
      max-width: ${compact ? "100px" : "120px"};
      object-fit: contain;
      flex-shrink: 0;
      ${prefs.monochrome ? "filter: grayscale(100%);" : ""}
    }
    .header-main { flex: 1; min-width: 0; }
    .header-main h1 {
      margin: 0;
      font-size: ${compact ? "15px" : "17px"};
      line-height: 1.2;
      word-break: break-word;
    }
    .header-meta { font-size: ${compact ? "9px" : "10px"}; color: #666; margin-top: 2px; line-height: 1.3; }
    .folio-inline {
      flex-shrink: 0;
      font-size: ${compact ? "9px" : "10px"};
      color: ${brandMuted};
      padding: 2px 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: ${brandCanvas};
      white-space: nowrap;
    }
    .folio-inline strong { color: ${brandInk}; letter-spacing: 0.3px; }
    .folio-bar {
      background: ${brandCanvas};
      padding: ${compact ? "4px 8px" : "6px 10px"};
      border-radius: 4px;
      text-align: center;
      font-size: ${compact ? "10px" : "11px"};
    }
    .folio-bar .label { color: ${brandMuted}; margin-right: 4px; }
    .folio-bar .value { font-weight: bold; color: ${brandInk}; }
    .patient-block {
      background: #f9f9f9;
      padding: ${compact ? "5px 7px" : "7px 9px"};
      border-radius: 4px;
      border: 1px solid #eee;
    }
    .patient-block h3 {
      margin: 0 0 ${compact ? "3px" : "4px"};
      font-size: ${compact ? "9px" : "10px"};
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .patient-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${compact ? "2px 8px" : "3px 10px"};
      font-size: ${compact ? "10px" : "11px"};
    }
    .patient-grid p { margin: 0; word-break: break-word; }
    .label { font-weight: 600; color: #555; }
    .section { margin: 0; }
    .section h2 {
      margin: 0 0 ${compact ? "2px" : "3px"};
      font-size: ${compact ? "10px" : "11px"};
      border-bottom: 1px solid #ddd;
      padding-bottom: 1px;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .section-content {
      padding: ${compact ? "4px 6px" : "5px 7px"};
      background: #fafafa;
      border-radius: 3px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: ${compact ? "10px" : "11px"};
    }
    .section-inline { font-size: ${compact ? "10px" : "11px"}; margin: 0; color: #333; }
    .signature-area {
      margin-top: ${compact ? "8px" : "12px"};
      text-align: center;
      page-break-inside: avoid;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: min(220px, 70%);
      margin: 0 auto;
      padding-top: 4px;
      font-size: ${compact ? "9px" : "10px"};
    }
    .signature-line .name { font-size: ${compact ? "11px" : "12px"}; font-weight: 600; margin: 2px 0 0; }
    .footer {
      margin-top: ${compact ? "6px" : "8px"};
      padding-top: ${compact ? "4px" : "6px"};
      border-top: 1px solid #ddd;
      font-size: ${compact ? "8px" : "9px"};
      color: #666;
      line-height: 1.35;
    }
    @media print {
      @page { size: ${printPageSizeCss(prefs.prescription.orientation)}; margin: ${pageMargin}; }
      html, body {
        width: ${pageW};
        max-width: ${pageW};
        padding: 0;
        margin: 0 auto;
        font-size: ${compact ? "10px" : "10.5px"};
      }
      .folio-bar, .patient-block, .section-content { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
      .signature-area { margin-top: ${compact ? "6px" : "10px"}; }
    }
  `;
}

export function buildPrescriptionPrintHtml(input: PrescriptionPrintInput): string {
  const { prescription, prefs, context } = input;
  const rx = prefs.prescription;
  const compact = rx.compact;

  const patientAgeDisplay = formatPrescriptionAge(
    prescription.patientAgeYears ?? computeAgeYears(prescription.patientDob)
  );
  const patientWeightDisplay = prescription.patientWeightKg?.trim()
    ? `${prescription.patientWeightKg.trim()} kg`
    : "";
  const patientHeightDisplay = prescription.patientHeightCm?.trim()
    ? `${prescription.patientHeightCm.trim()} cm`
    : "";

  const folioInline = `<div class="folio-inline">Folio: <strong>${esc(prescription.folio)}</strong></div>`;
  const folioBar = `<div class="folio-bar"><span class="label">FOLIO RECETA:</span><span class="value">${esc(prescription.folio)}</span></div>`;

  const nextVisitFormatted = prescription.nextVisitDate
    ? compact
      ? new Date(prescription.nextVisitDate).toLocaleDateString("es-ES")
      : new Date(prescription.nextVisitDate).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    : "";

  const contactLines = [
    context.clinicPhone ? `Tel: ${esc(context.clinicPhone)}` : "",
    context.clinicEmail ? esc(context.clinicEmail) : "",
    context.clinicAddress ? esc(context.clinicAddress) : "",
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Receta - ${esc(prescription.patientName)}</title>
  <style>${buildPrescriptionStyles(prefs)}</style>
</head>
<body>
  <div class="doc">
    <header class="header">
      <div class="header-row">
        ${rx.showLogo && context.clinicLogo ? `<img src="${escAttr(context.clinicLogo)}" alt="Logo" class="header-logo" />` : ""}
        <div class="header-main">
          <h1>${esc(context.clinicName)}</h1>
          ${context.podiatristCedula ? `<p class="header-meta">Cédula: ${esc(context.podiatristCedula)}</p>` : ""}
          ${context.podiatristRegistro ? `<p class="header-meta">Registro: ${esc(context.podiatristRegistro)}</p>` : ""}
          ${context.clinicLicenseNumber ? `<p class="header-meta">Reg. Sanitario: ${esc(context.clinicLicenseNumber)}</p>` : ""}
          ${contactLines.length > 0 ? `<p class="header-meta">${contactLines.join(" · ")}</p>` : ""}
        </div>
        ${rx.folioPosition === "inline" ? folioInline : ""}
      </div>
    </header>

    ${rx.folioPosition === "bar" ? folioBar : ""}

    <section class="patient-block">
      <h3>Datos del paciente</h3>
      <div class="patient-grid">
        <p><span class="label">Nombre:</span> ${esc(prescription.patientName)}</p>
        <p><span class="label">DNI/NIE:</span> ${esc(prescription.patientDni || "—")}</p>
        <p><span class="label">Edad:</span> ${esc(patientAgeDisplay)}</p>
        ${rx.showWeight && patientWeightDisplay ? `<p><span class="label">Peso:</span> ${esc(patientWeightDisplay)}</p>` : ""}
        ${rx.showHeight && patientHeightDisplay ? `<p><span class="label">Estatura:</span> ${esc(patientHeightDisplay)}</p>` : ""}
        <p><span class="label">Nacimiento:</span> ${prescription.patientDob ? esc(new Date(prescription.patientDob).toLocaleDateString("es-ES")) : "—"}</p>
        <p><span class="label">Fecha receta:</span> ${esc(new Date(prescription.prescriptionDate).toLocaleDateString("es-ES"))}</p>
      </div>
    </section>

    <section class="section">
      <h2>Prescripción / Indicaciones</h2>
      <div class="section-content">${esc(prescription.prescriptionText || "—")}</div>
    </section>

    ${prescription.medications?.trim() ? `
    <section class="section">
      <h2>Medicamentos / Tratamientos</h2>
      <div class="section-content">${esc(prescription.medications)}</div>
    </section>` : ""}

    ${rx.showNextVisit && prescription.nextVisitDate ? `
    <section class="section">
      <h2>Próxima visita</h2>
      <p class="section-inline">${esc(nextVisitFormatted)}</p>
    </section>` : ""}

    ${rx.showNotes && prescription.notes?.trim() ? `
    <section class="section">
      <h2>Notas adicionales</h2>
      <div class="section-content">${esc(prescription.notes)}</div>
    </section>` : ""}

    <div class="signature-area">
      <div class="signature-line">
        <p style="margin:0;">Firma del profesional</p>
        <p class="name">${esc(prescription.podiatristName)}</p>
        ${rx.showSignatureCedula && context.podiatristCedula ? `<p style="margin:0;color:#666;">Cédula: ${esc(context.podiatristCedula)}</p>` : ""}
        ${rx.showSignatureCedula && context.podiatristRegistro ? `<p style="margin:0;color:#666;">Registro: ${esc(context.podiatristRegistro)}</p>` : ""}
      </div>
    </div>

    <footer class="footer">
      ${prefs.showGeneratedByFooter ? `<span><strong>PodoAdmin</strong></span> · ` : ""}
      <span>Impreso: ${esc(new Date().toLocaleString("es-ES"))}</span>
      ${prefs.footerText.trim() ? `<br /><span style="white-space:pre-wrap;">${esc(prefs.footerText.trim())}</span>` : ""}
    </footer>
  </div>
</body>
</html>`;
}

export function openPrescriptionPrint(input: PrescriptionPrintInput): boolean {
  return openHtmlForPrint(buildPrescriptionPrintHtml(input));
}
