import { useState, type ReactNode } from "react";
import type { PrintPreferencesConfig } from "../../types/print-preferences";

type PreviewTab = "history" | "prescription";

type Props = {
  config: PrintPreferencesConfig;
  logoUrl?: string | null;
  className?: string;
};

function PaperShell({
  children,
  monochrome,
  compact,
  orientation = "portrait",
}: {
  children: ReactNode;
  monochrome: boolean;
  compact?: boolean;
  orientation?: "portrait" | "landscape";
}) {
  const landscape = orientation === "landscape";
  return (
    <div
      className={`mx-auto w-full rounded-sm border border-gray-300 bg-white shadow-sm overflow-hidden ${
        monochrome ? "grayscale" : ""
      } ${compact ? "text-[6.5px]" : "text-[7px]"}`}
      style={{
        aspectRatio: landscape ? "297 / 210" : "210 / 297",
        maxWidth: landscape ? 360 : 280,
        maxHeight: landscape ? 260 : 360,
      }}
    >
      <div className={`h-full overflow-hidden flex flex-col ${compact ? "p-2 gap-1" : "p-2.5 gap-1.5"}`}>
        {children}
      </div>
    </div>
  );
}

function LogoPlaceholder({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="w-8 h-6 shrink-0 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-[5px] text-gray-400 font-medium">
      LOGO
    </div>
  );
}

function LogoImage({ show, src }: { show: boolean; src?: string | null }) {
  if (!show) return null;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-8 h-6 shrink-0 object-contain rounded border border-gray-100 bg-white"
      />
    );
  }
  return <LogoPlaceholder show />;
}

function FooterPreview({ config }: { config: PrintPreferencesConfig }) {
  const hasFooter = config.showGeneratedByFooter || config.footerText.trim();
  if (!hasFooter) return null;
  return (
    <div className="mt-auto pt-1 border-t border-gray-200 text-[5.5px] text-gray-500 leading-snug">
      {config.showGeneratedByFooter && <p>PodoAdmin · vista previa</p>}
      {config.footerText.trim() && (
        <p className="whitespace-pre-wrap line-clamp-2">{config.footerText.trim()}</p>
      )}
    </div>
  );
}

function HistoryPreview({ config, logoUrl }: { config: PrintPreferencesConfig; logoUrl?: string | null }) {
  const centered = config.headerAlign === "center";
  const rows = Math.min(config.history.evolutionRows, 4);

  return (
    <PaperShell
      monochrome={config.monochrome}
      compact={config.history.compact}
      orientation={config.history.orientation}
    >
      <div className={`flex gap-1.5 border-b border-gray-800 pb-1 ${centered ? "flex-col items-center text-center" : "items-start"}`}>
        <LogoImage show={config.history.showLogo} src={logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[8px] leading-tight">Clínica Podológica Demo</p>
          <p className="text-gray-500">Lic./Cédula: 12345678</p>
          {config.history.showLegalData && (
            <p className="text-gray-500">RFC: XAXX010101000 · CLUES: DFSSA000001</p>
          )}
          <p className="text-gray-500">555 123 4567 · demo@clinica.com</p>
          <p className="mt-0.5 px-1 py-0.5 bg-gray-50 border border-gray-200 inline-block font-semibold text-[6px]">
            HISTORIA CLÍNICA PODOLÓGICA · Folio: PREMIUM-001
          </p>
        </div>
      </div>

      <div>
        <p className="font-semibold uppercase text-[6px] border-b border-gray-200 mb-0.5">I. Datos del paciente</p>
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
          {["Nombre: Laura M.", "DNI: INE-884422", "Tel: 555…", "Nac: 12/03/1985"].map((cell) => (
            <div key={cell} className="bg-white px-1 py-0.5 text-[5.5px]">
              {cell}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold uppercase text-[6px] border-b border-gray-200 mb-0.5">IV. Evolución clínica</p>
        <div className="border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 text-[5px] font-semibold">
            <span className="px-0.5 py-0.5 border-r border-gray-200">Fecha</span>
            <span className="px-0.5 py-0.5 border-r border-gray-200">Diagnóstico</span>
            <span className="px-0.5 py-0.5">Tratamiento</span>
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="grid grid-cols-3 border-t border-gray-100 text-[5px] text-gray-600">
              <span className="px-0.5 py-0.5 border-r border-gray-100">15/06/26</span>
              <span className="px-0.5 py-0.5 border-r border-gray-100 truncate">Onicocriptosis</span>
              <span className="px-0.5 py-0.5 truncate">Desbridamiento</span>
            </div>
          ))}
        </div>
        {config.history.evolutionRows > 4 && (
          <p className="text-[5px] text-gray-400 mt-0.5">+ {config.history.evolutionRows - 4} filas más…</p>
        )}
      </div>

      {config.history.includePhotos && (
        <div>
          <p className="font-semibold uppercase text-[6px] border-b border-gray-200 mb-0.5">Fotografías</p>
          <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-square bg-gray-100 border border-gray-200 rounded-sm" />
            ))}
          </div>
        </div>
      )}

      <FooterPreview config={config} />
    </PaperShell>
  );
}

function PrescriptionPreview({ config, logoUrl }: { config: PrintPreferencesConfig; logoUrl?: string | null }) {
  const centered = config.headerAlign === "center";
  const rx = config.prescription;

  return (
    <PaperShell monochrome={config.monochrome} compact={rx.compact} orientation={config.prescription.orientation}>
      <div className={`flex gap-1.5 border-b-2 border-gray-800 pb-1 ${centered ? "flex-col items-center text-center" : "items-start"}`}>
        <LogoImage show={rx.showLogo} src={logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[8px] leading-tight">Dr. Podólogo Demo</p>
          <p className="text-gray-500">Cédula: 12345678</p>
          <p className="text-gray-500">Tel: 555 123 4567</p>
        </div>
        {rx.folioPosition === "inline" && (
          <div className="shrink-0 text-[5.5px] text-gray-500 border border-gray-200 rounded px-1 py-0.5 bg-gray-50 whitespace-nowrap">
            Folio: <span className="font-bold text-gray-800">RX-2026-00001</span>
          </div>
        )}
      </div>

      {rx.folioPosition === "bar" && (
        <div className="text-center bg-gray-50 border border-gray-200 rounded px-1 py-0.5">
          <span className="text-gray-500">FOLIO RECETA: </span>
          <span className="font-bold tracking-wide">RX-2026-00001</span>
        </div>
      )}

      <div className="bg-gray-50 rounded border border-gray-200 p-1 space-y-0.5">
        <p className="font-semibold text-gray-500 text-[5.5px]">DATOS DEL PACIENTE</p>
        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
          <p>Nombre: Laura M.</p>
          <p>DNI: INE-884422</p>
          <p>Edad: 41 años</p>
          {rx.showWeight && <p>Peso: 72.5 kg</p>}
          {rx.showHeight && <p>Estatura: 165 cm</p>}
        </div>
      </div>

      <div>
        <p className="font-semibold border-b border-gray-200 mb-0.5">Prescripción / Indicaciones</p>
        <div className="bg-gray-50 rounded p-1 text-gray-600 leading-snug">
          Aplicar crema antimicótica 2 veces al día durante 14 días.
        </div>
      </div>

      {rx.showNextVisit && (
        <div>
          <p className="font-semibold border-b border-gray-200 mb-0.5">Próxima visita</p>
          <p className="text-gray-600">viernes, 15 de agosto de 2026</p>
        </div>
      )}

      {rx.showNotes && (
        <div>
          <p className="font-semibold border-b border-gray-200 mb-0.5">Notas adicionales</p>
          <div className="bg-gray-50 rounded p-1 text-gray-600">Evitar calzado cerrado.</div>
        </div>
      )}

      <div className="text-center pt-1">
        <div className="border-t border-gray-800 w-20 mx-auto pt-0.5">
          <p className="text-gray-500">Firma del profesional</p>
          <p className="font-medium">Dr. Podólogo Demo</p>
          {rx.showSignatureCedula && <p className="text-gray-500">Cédula: 12345678</p>}
        </div>
      </div>

      <FooterPreview config={config} />
    </PaperShell>
  );
}

/** Vista previa en miniatura de historia clínica y receta según preferencias. */
export function PrintSettingsPreviewMockup({ config, logoUrl, className = "" }: Props) {
  const [tab, setTab] = useState<PreviewTab>("history");

  return (
    <div className={`rounded-xl border border-brand-border bg-brand-canvas p-4 space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-ink">Vista previa</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Simulación aproximada; el documento final usa los datos reales del paciente.
          </p>
        </div>
        <div className="flex gap-1 p-0.5 bg-brand-surface border border-brand-border rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              tab === "history"
                ? "bg-brand-ink text-brand-ink-fg"
                : "text-brand-muted hover:bg-brand-canvas"
            }`}
          >
            Historia clínica
          </button>
          <button
            type="button"
            onClick={() => setTab("prescription")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              tab === "prescription"
                ? "bg-brand-ink text-brand-ink-fg"
                : "text-brand-muted hover:bg-brand-canvas"
            }`}
          >
            Receta
          </button>
        </div>
      </div>

      <div className="flex justify-center py-2 bg-gray-100/80 dark:bg-gray-800/50 rounded-lg min-h-[200px]">
        {tab === "history" ? (
          <HistoryPreview config={config} logoUrl={logoUrl} />
        ) : (
          <PrescriptionPreview config={config} logoUrl={logoUrl} />
        )}
      </div>

      <p className="text-[10px] text-center text-gray-400">
        {config.monochrome && "Modo blanco y negro activo · "}
        Cabecera {config.headerAlign === "center" ? "centrada" : "alineada a la izquierda"}
        {tab === "history" && ` · ${config.history.orientation === "landscape" ? "horizontal" : "vertical"}`}
        {tab === "prescription" && ` · ${config.prescription.orientation === "landscape" ? "horizontal" : "vertical"}`}
        {tab === "history" && ` · ${config.history.evolutionRows} filas de evolución`}
        {tab === "history" && config.history.compact && " · diseño compacto"}
        {tab === "prescription" && config.prescription.compact && " · diseño compacto"}
        {tab === "prescription" && config.prescription.folioPosition === "inline" && " · folio en cabecera"}
      </p>
    </div>
  );
}
