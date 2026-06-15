import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useLanguage } from "../../contexts/language-context";
import { useAuth } from "../../contexts/auth-context";
import { api } from "../../lib/api-client";

type LegalHold = {
  id: string;
  resourceType: string;
  resourceId: string;
  reason: string;
  createdAt: string;
};

export function ComplianceSettingsSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const c = t.compliance;
  const [exporting, setExporting] = useState(false);
  const [deletionMsg, setDeletionMsg] = useState("");
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [holds, setHolds] = useState<LegalHold[]>([]);
  const [holdForm, setHoldForm] = useState({ resourceType: "patient", resourceId: "", reason: "" });
  const [holdMsg, setHoldMsg] = useState("");

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const loadHolds = useCallback(async () => {
    if (!isAdmin) return;
    const res = await api.get<{ success?: boolean; holds?: LegalHold[] }>("/compliance/legal-holds");
    if (res.success && res.data?.holds) setHolds(res.data.holds);
  }, [isAdmin]);

  useEffect(() => {
    void loadHolds();
  }, [loadHolds]);

  const downloadMyData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/users/me/export", { credentials: "include" });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t.errors.generic);
    } finally {
      setExporting(false);
    }
  };

  const requestDeletion = async () => {
    if (!window.confirm(c.deletionDesc)) return;
    setDeletionLoading(true);
    setDeletionMsg("");
    const res = await api.post<{ success?: boolean; message?: string }>("/compliance/data-rights/deletion-request", {});
    if (res.success) {
      setDeletionMsg(res.data?.message || c.deletionSuccess);
    } else {
      setDeletionMsg(res.message || t.errors.generic);
    }
    setDeletionLoading(false);
  };

  const createHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setHoldMsg("");
    const res = await api.post("/compliance/legal-holds", holdForm);
    if (res.success) {
      setHoldMsg(c.holdCreated);
      setHoldForm({ resourceType: "patient", resourceId: "", reason: "" });
      void loadHolds();
    } else {
      setHoldMsg(res.message || t.errors.generic);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">{c.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.subtitle}</p>
        <Link href="/privacy" className="text-sm text-[#1a1a1a] dark:text-gray-200 underline mt-2 inline-block">
          {c.privacyLink}
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <h3 className="font-medium text-[#1a1a1a] dark:text-white">{c.exportTitle}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{c.exportDesc}</p>
        <button
          type="button"
          onClick={() => void downloadMyData()}
          disabled={exporting}
          className="px-4 py-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {exporting ? t.common.loading : c.exportButton}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <h3 className="font-medium text-[#1a1a1a] dark:text-white">{c.deletionTitle}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{c.deletionDesc}</p>
        <button
          type="button"
          onClick={() => void requestDeletion()}
          disabled={deletionLoading}
          className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {deletionLoading ? t.common.loading : c.deletionButton}
        </button>
        {deletionMsg && <p className="text-sm text-green-700 dark:text-green-400">{deletionMsg}</p>}
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
        <h3 className="font-medium text-amber-950 dark:text-amber-100">{c.retentionTitle}</h3>
        <p className="text-sm text-amber-900 dark:text-amber-200 mt-1">{c.retentionNote}</p>
      </div>

      {isAdmin && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div>
            <h3 className="font-medium text-[#1a1a1a] dark:text-white">{c.legalHoldTitle}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.legalHoldDesc}</p>
          </div>
          <form onSubmit={createHold} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{c.holdResourceType}</label>
              <select
                value={holdForm.resourceType}
                onChange={(e) => setHoldForm({ ...holdForm, resourceType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white"
              >
                <option value="patient">patient</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{c.holdResourceId}</label>
              <input
                value={holdForm.resourceId}
                onChange={(e) => setHoldForm({ ...holdForm, resourceId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{c.holdReason}</label>
              <textarea
                value={holdForm.reason}
                onChange={(e) => setHoldForm({ ...holdForm, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:text-white"
                rows={2}
                required
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-2 px-4 py-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-lg text-sm font-medium"
            >
              {c.holdCreate}
            </button>
          </form>
          {holdMsg && <p className="text-sm text-green-700 dark:text-green-400">{holdMsg}</p>}
          {holds.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{c.holdsEmpty}</p>
          ) : (
            <ul className="text-xs space-y-2 text-gray-600 dark:text-gray-300">
              {holds.slice(0, 10).map((h) => (
                <li key={h.id} className="border-b border-gray-100 dark:border-gray-800 pb-2 flex justify-between gap-2">
                  <span>
                    <strong>{h.resourceType}</strong> {h.resourceId} — {h.reason}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await api.post(`/compliance/legal-holds/${h.id}/release`, {});
                      if (res.success) void loadHolds();
                    }}
                    className="text-xs underline shrink-0"
                  >
                    {c.holdRelease}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
