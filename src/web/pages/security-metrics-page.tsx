import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { api } from "../lib/api-client";
import { Shield, AlertTriangle, LogIn, Lock, RefreshCw } from "lucide-react";

type SecurityStats = Record<string, number>;

interface SecurityMetricRow {
  id: string;
  ipAddress: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AlertNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const METRIC_LABELS: Record<string, string> = {
  failed_login: "Logins fallidos",
  successful_login: "Logins exitosos",
  "2fa_failed": "2FA fallido",
  captcha_failed: "CAPTCHA fallido",
  suspicious_activity: "Actividad sospechosa",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

const SecurityMetricsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState<SecurityStats>({});
  const [recentFailedLogins, setRecentFailedLogins] = useState<SecurityMetricRow[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const loadData = async () => {
    if (!user || user.role !== "super_admin") return;
    setLoading(true);
    setError(null);

    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    const [statsRes, failedRes, notifRes] = await Promise.all([
      api.get<{ success: boolean; stats: SecurityStats }>(
        `/security-metrics/stats?startTime=${encodeURIComponent(start.toISOString())}&endTime=${encodeURIComponent(end.toISOString())}`
      ),
      api.get<{ success: boolean; metrics: SecurityMetricRow[] }>(
        "/security-metrics/by-type/failed_login?limit=15"
      ),
      api.get<{ success: boolean; notifications: AlertNotification[] }>("/notifications?limit=50"),
    ]);

    if (statsRes.success && statsRes.data?.success) {
      setStats(statsRes.data.stats || {});
    } else {
      setError(statsRes.error || "No se pudieron cargar las métricas");
    }

    if (failedRes.success && failedRes.data?.success) {
      setRecentFailedLogins(failedRes.data.metrics || []);
    }

    if (notifRes.success && notifRes.data?.success) {
      setAlerts(
        (notifRes.data.notifications || []).filter(
          (n) =>
            n.title.includes("⚠️") ||
            n.title.toLowerCase().includes("alerta") ||
            n.title.toLowerCase().includes("incumplimiento")
        )
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id, days]);

  const topStats = useMemo(
    () => Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [stats]
  );

  const criticalCount =
    (stats.failed_login || 0) +
    (stats["2fa_failed"] || 0) +
    (stats.captcha_failed || 0) +
    (stats.suspicious_activity || 0);

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <MainLayout title={t.nav.securityMetrics}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t.nav.securityMetrics}
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              Métricas de seguridad, alertas activas y eventos recientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface"
            >
              <option value={1}>Últimas 24 h</option>
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
            </select>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-[#333] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-semantic-error text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100 dark:bg-amber-900/30" label="Eventos críticos" value={criticalCount} />
          <StatCard icon={<LogIn className="w-5 h-5 text-red-600" />} iconBg="bg-red-100 dark:bg-red-900/30" label="Logins fallidos" value={stats.failed_login || 0} />
          <StatCard icon={<Lock className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100 dark:bg-blue-900/30" label="Alertas sin leer" value={unreadAlerts} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Resumen por tipo">
            {loading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : topStats.length === 0 ? (
              <p className="text-sm text-gray-500">Sin eventos en el periodo seleccionado.</p>
            ) : (
              <ul className="space-y-2">
                {topStats.map(([type, count]) => (
                  <li key={type} className="flex justify-between text-sm">
                    <span className="text-brand-muted">{METRIC_LABELS[type] || type}</span>
                    <span className="font-medium text-brand-ink">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Alertas activas">
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto -mx-4">
              {alerts.length === 0 ? (
                <p className="px-4 text-sm text-gray-500">No hay alertas de sistema recientes.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`px-4 py-3 ${!alert.read ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}>
                    <p className="text-sm font-medium text-brand-ink">{alert.title}</p>
                    <p className="text-xs text-brand-muted mt-1 line-clamp-2">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(alert.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Últimos logins fallidos">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-sm">
              <thead className="bg-brand-canvas/50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-left p-3 font-medium text-gray-500">IP</th>
                  <th className="text-left p-3 font-medium text-gray-500">Email / detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentFailedLogins.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-gray-500">Sin registros recientes.</td>
                  </tr>
                ) : (
                  recentFailedLogins.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                      <td className="p-3 font-mono text-xs">{row.ipAddress || "—"}</td>
                      <td className="p-3">
                        {(row.details?.email as string) ||
                          (row.details?.attemptCount != null ? `Intento #${String(row.details.attemptCount)}` : "—")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </MainLayout>
  );
};

function StatCard({ icon, iconBg, label, value }: { icon: ReactNode; iconBg: string; label: string; value: number }) {
  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-brand-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
      <div className="p-4 border-b border-gray-50 dark:border-gray-800">
        <h3 className="font-semibold text-brand-ink">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default SecurityMetricsPage;
