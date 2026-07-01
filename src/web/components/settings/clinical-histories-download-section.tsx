import { useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import { api } from "../../lib/api-client";
import { postAuditLog } from "../../lib/audit-client";
import { normalizeClinicalLayout } from "../../types/clinical-layout";
import type { ClinicalLayoutConfig } from "../../types/clinical-layout";
import type { ClinicalSession, Patient } from "../../types/clinical";
import {
  buildCombinedPodiatryHistoriesPrintHtml,
  buildPodiatryPrintInputsFromBundle,
  downloadHtmlFile,
  embedImageAsDataUri,
  openHtmlForPrint,
  openHtmlInNewTab,
} from "../../lib/podiatry-history-print";

type ClinicalHistoriesExportResponse = {
  success?: boolean;
  exportedAt: string;
  podiatristName: string;
  podiatristLicense: string | null;
  clinic: Record<string, string | undefined> | null;
  clinicLogo: string | null;
  professional: Record<string, string | undefined> | null;
  layout: ClinicalLayoutConfig;
  patients: Patient[];
  sessions: ClinicalSession[];
  statistics: { patientCount: number; sessionCount: number };
};

function safeExportFilename(podiatristName: string, exportedAt: string): string {
  const safeName =
    podiatristName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "podologo";
  const date = exportedAt.slice(0, 10);
  return `historiales-${safeName}-${date}.html`;
}

export function ClinicalHistoriesDownloadSection() {
  const { t } = useLanguage();
  const c = t.clinicalHistoriesExport;
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ patients: number; sessions: number } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBundle = async (): Promise<ClinicalHistoriesExportResponse | null> => {
    setError("");
    setSuccess("");
    const res = await api.get<ClinicalHistoriesExportResponse>("/users/me/clinical-histories-export");
    if (!res.success || !res.data) {
      setError(res.message || res.error || t.errors.generic);
      return null;
    }
    const bundle = res.data;
    if (!Array.isArray(bundle.patients) || !Array.isArray(bundle.sessions)) {
      setError(c.invalidResponse);
      return null;
    }
    setStats({
      patients: bundle.statistics?.patientCount ?? bundle.patients.length,
      sessions: bundle.statistics?.sessionCount ?? bundle.sessions.length,
    });
    return bundle;
  };

  const buildHtmlFromBundle = async (
    bundle: ClinicalHistoriesExportResponse,
    options?: { embedLogo?: boolean }
  ): Promise<string> => {
    const layout = bundle.layout ? normalizeClinicalLayout(bundle.layout) : undefined;
    let clinicLogo = bundle.clinicLogo;
    if (options?.embedLogo && clinicLogo) {
      clinicLogo = (await embedImageAsDataUri(clinicLogo)) ?? clinicLogo;
    }
    const inputs = buildPodiatryPrintInputsFromBundle({
      patients: bundle.patients,
      sessions: bundle.sessions,
      clinicLogo,
      clinic: bundle.clinic,
      professional: bundle.professional,
      podiatristName: bundle.podiatristName,
      podiatristLicense: bundle.podiatristLicense,
      layout,
    });
    return buildCombinedPodiatryHistoriesPrintHtml(inputs, {
      podiatristName: bundle.podiatristName,
      exportedAt: bundle.exportedAt,
    });
  };

  const auditExport = (action: "download_html" | "print_pdf", bundle: ClinicalHistoriesExportResponse) => {
    void postAuditLog({
      action: "EXPORT",
      resourceType: "clinical_history",
      resourceId: bundle.podiatristName,
      details: {
        exportType: "podiatry_histories_bulk",
        format: action,
        patientCount: bundle.statistics?.patientCount ?? bundle.patients.length,
        sessionCount: bundle.statistics?.sessionCount ?? bundle.sessions.length,
      },
    });
  };

  const downloadHtml = async () => {
    setLoading(true);
    try {
      const bundle = await fetchBundle();
      if (!bundle) return;

      if (bundle.patients.length === 0) {
        setError(c.noPatients);
        return;
      }

      let html: string;
      try {
        html = await buildHtmlFromBundle(bundle, { embedLogo: true });
      } catch (buildErr) {
        console.error("Error generando HTML de historiales:", buildErr);
        setError(c.buildError);
        return;
      }

      const filename = safeExportFilename(bundle.podiatristName, bundle.exportedAt);
      const downloaded = downloadHtmlFile(html, filename);
      if (!downloaded) {
        const opened = openHtmlInNewTab(html);
        if (!opened) {
          setError(c.downloadFailed);
          return;
        }
        setSuccess(c.openedInTab);
      } else {
        setSuccess(c.downloadStarted.replace("{filename}", filename));
      }
      auditExport("download_html", bundle);
    } catch (err) {
      console.error("Exportación de historiales:", err);
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const printAsPdf = async () => {
    setLoading(true);
    try {
      const bundle = await fetchBundle();
      if (!bundle) return;

      if (bundle.patients.length === 0) {
        setError(c.noPatients);
        return;
      }

      let html: string;
      try {
        html = await buildHtmlFromBundle(bundle);
      } catch (buildErr) {
        console.error("Error generando HTML de historiales:", buildErr);
        setError(c.buildError);
        return;
      }

      const opened = openHtmlForPrint(html);
      if (!opened) {
        const tab = openHtmlInNewTab(html);
        if (!tab) {
          setError(c.popupBlocked);
          return;
        }
        setSuccess(c.openedInTab);
      }
      auditExport("print_pdf", bundle);
    } catch (err) {
      console.error("Impresión de historiales:", err);
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">{c.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.subtitle}</p>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">{c.desc}</p>

      {stats && (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {c.stats
            .replace("{patients}", String(stats.patients))
            .replace("{sessions}", String(stats.sessions))}
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-700 dark:text-green-400">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void downloadHtml()}
          disabled={loading}
          className="px-4 py-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? t.common.loading : c.downloadHtml}
        </button>
        <button
          type="button"
          onClick={() => void printAsPdf()}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-[#1a1a1a] dark:text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? t.common.loading : c.printPdf}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{c.pdfHint}</p>
    </div>
  );
}
