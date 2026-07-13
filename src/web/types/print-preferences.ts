/** Preferencias de impresión de historia clínica y recetas (clínica / profesional). */

export type PrintHeaderAlign = "left" | "center";

export type PrintPageOrientation = "portrait" | "landscape";

export type PrescriptionFolioPosition = "inline" | "bar";

export type PrintPreferencesConfig = {
  /** Alineación de la cabecera (logo + datos) */
  headerAlign: PrintHeaderAlign;
  /** Impresión en escala de grises (sin colores de marca) */
  monochrome: boolean;
  /** Texto de pie de página personalizado (ambos documentos) */
  footerText: string;
  /** Mostrar "Generado por PodoAdmin" en el pie */
  showGeneratedByFooter: boolean;
  history: {
    showLogo: boolean;
    /** RFC, CLUES, COFEPRIS, registro sanitario */
    showLegalData: boolean;
    /** Nº de filas de evolución clínica a imprimir */
    evolutionRows: number;
    /** Incluir fotografías clínicas */
    includePhotos: boolean;
    /** Diseño compacto (menos márgenes y tipografía) */
    compact: boolean;
    /** Orientación del papel al imprimir */
    orientation: PrintPageOrientation;
  };
  prescription: {
    showLogo: boolean;
    showWeight: boolean;
    showHeight: boolean;
    showNextVisit: boolean;
    showNotes: boolean;
    /** Mostrar cédula/registro en el área de firma */
    showSignatureCedula: boolean;
    /** Diseño compacto (menos márgenes y tipografía) */
    compact: boolean;
    /** Folio en cabecera (inline) o en barra separada (bar) */
    folioPosition: PrescriptionFolioPosition;
    /** Orientación del papel al imprimir */
    orientation: PrintPageOrientation;
  };
};

export const EVOLUTION_ROWS_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_PRINT_PREFERENCES: PrintPreferencesConfig = {
  headerAlign: "left",
  monochrome: false,
  footerText: "",
  showGeneratedByFooter: true,
  history: {
    showLogo: true,
    showLegalData: true,
    evolutionRows: 10,
    includePhotos: true,
    compact: true,
    orientation: "portrait",
  },
  prescription: {
    showLogo: true,
    showWeight: true,
    showHeight: true,
    showNextVisit: true,
    showNotes: true,
    showSignatureCedula: true,
    compact: true,
    folioPosition: "inline",
    orientation: "landscape",
  },
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizePrintPreferences(raw: unknown): PrintPreferencesConfig {
  if (!raw || typeof raw !== "object") return structuredCloneConfig(DEFAULT_PRINT_PREFERENCES);
  const row = raw as Partial<PrintPreferencesConfig>;
  const d = DEFAULT_PRINT_PREFERENCES;

  const history = (row.history ?? {}) as Partial<PrintPreferencesConfig["history"]>;
  const prescription = (row.prescription ?? {}) as Partial<PrintPreferencesConfig["prescription"]>;

  const evolutionRows =
    typeof history.evolutionRows === "number"
      ? clamp(Math.round(history.evolutionRows), 5, 100)
      : d.history.evolutionRows;

  const footerText =
    typeof row.footerText === "string" ? row.footerText.slice(0, 300) : d.footerText;

  return {
    headerAlign: row.headerAlign === "center" ? "center" : "left",
    monochrome: bool(row.monochrome, d.monochrome),
    footerText,
    showGeneratedByFooter: bool(row.showGeneratedByFooter, d.showGeneratedByFooter),
    history: {
      showLogo: bool(history.showLogo, d.history.showLogo),
      showLegalData: bool(history.showLegalData, d.history.showLegalData),
      evolutionRows,
      includePhotos: bool(history.includePhotos, d.history.includePhotos),
      compact: bool(history.compact, d.history.compact),
      orientation:
        history.orientation === "landscape" || history.orientation === "portrait"
          ? history.orientation
          : d.history.orientation,
    },
    prescription: {
      showLogo: bool(prescription.showLogo, d.prescription.showLogo),
      showWeight: bool(prescription.showWeight, d.prescription.showWeight),
      showHeight: bool(prescription.showHeight, d.prescription.showHeight),
      showNextVisit: bool(prescription.showNextVisit, d.prescription.showNextVisit),
      showNotes: bool(prescription.showNotes, d.prescription.showNotes),
      showSignatureCedula: bool(prescription.showSignatureCedula, d.prescription.showSignatureCedula),
      compact: bool(prescription.compact, d.prescription.compact),
      folioPosition: prescription.folioPosition === "bar" ? "bar" : "inline",
      orientation:
        prescription.orientation === "landscape" || prescription.orientation === "portrait"
          ? prescription.orientation
          : d.prescription.orientation,
    },
  };
}

export function printPageSizeCss(orientation: PrintPageOrientation): string {
  return orientation === "landscape" ? "A4 landscape" : "A4 portrait";
}

export function printPageWidthCss(orientation: PrintPageOrientation): string {
  return orientation === "landscape" ? "297mm" : "210mm";
}

function structuredCloneConfig(config: PrintPreferencesConfig): PrintPreferencesConfig {
  return {
    ...config,
    history: { ...config.history },
    prescription: { ...config.prescription },
  };
}
