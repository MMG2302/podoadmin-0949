import { useState, type ReactNode } from "react";
import type { PrintPreferencesConfig } from "../../types/print-preferences";
import { useLanguage } from "../../contexts/language-context";

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
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <div className="w-8 h-6 shrink-0 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-[5px] text-gray-400 font-medium">
      {t.settings.print.logoPlaceholder}
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
  const { t } = useLanguage();
  const hasFooter = config.showGeneratedByFooter || config.footerText.trim();
  if (!hasFooter) return null;
  return (
    <div className="mt-auto pt-1 border-t border-gray-200 text-[5.5px] text-gray-500 leading-snug">
      {config.showGeneratedByFooter && <p>{t.settings.print.demoFooter}</p>}
      {config.footerText.trim() && (
        <p className="whitespace-pre-wrap line-clamp-2">{config.footerText.trim()}</p>
      )}
    </div>
  );
}

function HistoryPreview({ config, logoUrl }: { config: PrintPreferencesConfig; logoUrl?: string | null }) {
  const { t } = useLanguage();
  const d = t.settings.print;
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
          <p className="font-bold text-[8px] leading-tight">{d.demoClinicName}</p>
          <p className="text-gray-500">{d.demoLicense}</p>
          {config.history.showLegalData && (
            <p className="text-gray-500">{d.demoLegal}</p>
          )}
          <p className="text-gray-500">{d.demoContact}</p>
          <p className="mt-0.5 px-1 py-0.5 bg-gray-50 border border-gray-200 inline-block font-semibold text-[6px]">
            {d.demoHistoryTitle}
          </p>
        </div>
      </div>

      <div>
        <p className="font-semibold uppercase text-[6px] border-b border-gray-200 mb-0.5">{d.demoPatientSection}</p>
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
          {d.demoPatientCells.map((cell) => (
            <div key={cell} className="bg-white px-1 py-0.5 text-[5.5px]">
              {cell}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold uppercase text-[6px] border-b border-gray-200 mb-0.5">{d.demoEvolutionSection}</p>
        <div className="border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 text-[5px] font-semibold">
            <span className="px-0.5 py-0.5 border-r border-gray-200">{d.demoColDate}</span>
            <span className="px-0.5 py-0.5 border-r border-gray-200">{d.demoColDiagnosis}</span>
            <span className="px-0.5 py-0.5">{d.demoColTreatment}</span>
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="grid grid-cols-3 border-t border-gray-100 text-[5px] text-gray-600">
              <span className="px-0.5 py-0.5 border-r border-gray-100">15/06/26</span>
              <span className="px-0.5 py-0.5 border-r border-gray-100 truncate">{d.demoDiagnosis}</span>
              <span className="px-0.5 py-0.5 truncate">{d.demoTreatment}</span>
            </div>
          ))}
        </div>
        {config.history.evolutionRows > 4 && (
          <p className="text-[5px] text-gray-400 mt-0.5">{d.demoMoreRows.replace("{count}", String(config.history.evolutionRows - 4))}</p>
        )}
      </div>

      {config.history.includePhotos && (
        <div>
          <p className="font-semibold uppercase text-[6px] border-b border-gray-200 mb-0.5">{d.demoPhotos}</p>
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
  const { t } = useLanguage();
  const d = t.settings.print;
  const centered = config.headerAlign === "center";
  const rx = config.prescription;

  return (
    <PaperShell monochrome={config.monochrome} compact={rx.compact} orientation={config.prescription.orientation}>
      <div className={`flex gap-1.5 border-b-2 border-gray-800 pb-1 ${centered ? "flex-col items-center text-center" : "items-start"}`}>
        <LogoImage show={rx.showLogo} src={logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[8px] leading-tight">{d.demoDoctor}</p>
          <p className="text-gray-500">{d.demoCedula}</p>
          <p className="text-gray-500">{d.demoTel}</p>
        </div>
        {rx.folioPosition === "inline" && (
          <div className="shrink-0 text-[5.5px] text-gray-500 border border-gray-200 rounded px-1 py-0.5 bg-gray-50 whitespace-nowrap">
            {d.demoFolio} <span className="font-bold text-gray-800">RX-2026-00001</span>
          </div>
        )}
      </div>

      {rx.folioPosition === "bar" && (
        <div className="text-center bg-gray-50 border border-gray-200 rounded px-1 py-0.5">
          <span className="text-gray-500">{d.demoFolioBar} </span>
          <span className="font-bold tracking-wide">RX-2026-00001</span>
        </div>
      )}

      <div className="bg-gray-50 rounded border border-gray-200 p-1 space-y-0.5">
        <p className="font-semibold text-gray-500 text-[5.5px]">{d.demoPatientData}</p>
        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
          <p>{d.demoName}</p>
          <p>{d.demoDni}</p>
          <p>{d.demoAge}</p>
          {rx.showWeight && <p>{d.demoWeight}</p>}
          {rx.showHeight && <p>{d.demoHeight}</p>}
        </div>
      </div>

      <div>
        <p className="font-semibold border-b border-gray-200 mb-0.5">{d.demoPrescription}</p>
        <div className="bg-gray-50 rounded p-1 text-gray-600 leading-snug">
          {d.demoPrescriptionBody}
        </div>
      </div>

      {rx.showNextVisit && (
        <div>
          <p className="font-semibold border-b border-gray-200 mb-0.5">{d.demoNextVisit}</p>
          <p className="text-gray-600">{d.demoNextVisitDate}</p>
        </div>
      )}

      {rx.showNotes && (
        <div>
          <p className="font-semibold border-b border-gray-200 mb-0.5">{d.demoNotes}</p>
          <div className="bg-gray-50 rounded p-1 text-gray-600">{d.demoNotesBody}</div>
        </div>
      )}

      <div className="text-center pt-1">
        <div className="border-t border-gray-800 w-20 mx-auto pt-0.5">
          <p className="text-gray-500">{d.demoSignature}</p>
          <p className="font-medium">{d.demoDoctor}</p>
          {rx.showSignatureCedula && <p className="text-gray-500">{d.demoCedula}</p>}
        </div>
      </div>

      <FooterPreview config={config} />
    </PaperShell>
  );
}

/** Vista previa en miniatura de historia clínica y receta según preferencias. */
export function PrintSettingsPreviewMockup({ config, logoUrl, className = "" }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<PreviewTab>("history");

  return (
    <div className={`rounded-xl border border-brand-border bg-brand-canvas p-4 space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-ink">{t.settings.print.preview}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t.settings.print.previewSimHint}
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
            {t.settings.print.tabHistory}
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
            {t.settings.print.tabRx}
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
        {config.monochrome && t.settings.print.statusMonochrome}
        {config.headerAlign === "center" ? t.settings.print.statusHeaderCenter : t.settings.print.statusHeaderLeft}
        {tab === "history" && ` · ${config.history.orientation === "landscape" ? t.settings.print.landscape : t.settings.print.portrait}`}
        {tab === "prescription" && ` · ${config.prescription.orientation === "landscape" ? t.settings.print.landscape : t.settings.print.portrait}`}
        {tab === "history" && t.settings.print.statusEvolutionRows.replace("{count}", String(config.history.evolutionRows))}
        {tab === "history" && config.history.compact && t.settings.print.statusCompact}
        {tab === "prescription" && config.prescription.compact && t.settings.print.statusCompact}
        {tab === "prescription" && config.prescription.folioPosition === "inline" && t.settings.print.statusFolioInline}
      </p>
    </div>
  );
}
