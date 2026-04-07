import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { api } from "../lib/api-client";

type DiagnosticsPayload = {
  success?: boolean;
  checkedAt?: string;
  worker?: { ok?: boolean };
  database?: { ok?: boolean; latencyMs?: number | null; error?: string | null };
  environment?: { nodeEnv?: string };
  publicHealthPath?: string;
};

function toAbsoluteOrigin(domainish: string): string {
  const t = domainish.trim().replace(/\/$/, "");
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

const SystemDiagnosticsPage = () => {
  const { t } = useLanguage();
  const d = t.systemDiagnostics;
  const [payload, setPayload] = useState<DiagnosticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officialDomain, setOfficialDomain] = useState<string | null>(null);

  const healthPath = "/api/health";

  const sessionHealthUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${healthPath}`;
  }, []);

  const configuredHealthUrl = useMemo(() => {
    if (!officialDomain) return null;
    const base = toAbsoluteOrigin(officialDomain);
    if (!base) return null;
    return `${base}${healthPath}`;
  }, [officialDomain]);

  useEffect(() => {
    void (async () => {
      const r = await api.get<{ officialDomain?: string | null }>("/public/config");
      if (r.success && r.data?.officialDomain) {
        setOfficialDomain(r.data.officialDomain);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<DiagnosticsPayload>("/system/diagnostics");
    if (res.success && res.data?.success) {
      setPayload(res.data);
    } else {
      setError(res.error || res.message || d.loadError);
      setPayload(null);
    }
    setLoading(false);
  }, [d.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusBadge = (ok: boolean | undefined) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
      }`}
    >
      {ok ? d.statusOk : d.statusError}
    </span>
  );

  const showBothUrls =
    configuredHealthUrl && configuredHealthUrl.replace(/\/$/, "") !== sessionHealthUrl.replace(/\/$/, "");

  return (
    <MainLayout title={d.title}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] dark:text-white">{d.title}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{d.subtitle}</p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] disabled:opacity-50"
          >
            {loading ? t.common.loading : d.refresh}
          </button>
        </div>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">{d.publicHealthTitle}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{d.publicHealthDesc}</p>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{d.sessionHealthUrlLabel}</p>
              <code className="block text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 break-all">
                {sessionHealthUrl || "—"}
              </code>
            </div>

            {showBothUrls && configuredHealthUrl && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{d.productionHealthUrlLabel}</p>
                <code className="block text-xs font-mono bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-lg px-3 py-2 break-all text-emerald-900 dark:text-emerald-100">
                  {configuredHealthUrl}
                </code>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{d.productionHealthNote}</p>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && payload && (
          <>
            <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-4">{d.sectionStatus}</h2>
              <dl className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">{d.workerLabel}</dt>
                  <dd>{statusBadge(payload.worker?.ok)}</dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">{d.databaseLabel}</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {statusBadge(payload.database?.ok)}
                    {payload.database?.ok && payload.database.latencyMs != null && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {d.latencyLabel}: {payload.database.latencyMs} ms
                      </span>
                    )}
                  </dd>
                </div>
                {payload.database?.error && (
                  <div className="text-xs font-mono text-red-600 dark:text-red-400 break-all">{payload.database.error}</div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">{d.environmentSection}</dt>
                  <dd className="text-sm font-mono text-gray-800 dark:text-gray-200">
                    {payload.environment?.nodeEnv ?? "—"}
                  </dd>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {d.checkedAtLabel}: {payload.checkedAt ? new Date(payload.checkedAt).toLocaleString() : "—"}
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">{d.sectionGuide}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{d.guideIntro}</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>{d.guideItem1}</li>
                <li>{d.guideItem2}</li>
                <li>{d.guideItem3}</li>
                <li>{d.guideItem4}</li>
              </ul>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-4">
                {d.correlationHint}
              </p>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SystemDiagnosticsPage;
