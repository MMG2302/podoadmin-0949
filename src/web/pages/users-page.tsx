import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, User, UserRole } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { postAuditLog } from "../lib/audit-client";
import type { Patient } from "../types/clinical";
import { api } from "../lib/api-client";
import {
  fetchClinicalStats,
  fetchUserClinicalProfile,
  transferClinicalHistory,
  downloadUserClinicalExport,
} from "../lib/clinical-api";
import type { ClinicalStatsMap } from "../types/clinical";
import {
  formErrorClass,
  formSuccessClass,
  semanticAlertErrorClass,
  semanticAlertInfoClass,
  semanticAlertSuccessClass,
  semanticAlertWarningClass,
  semanticChipErrorClass,
  semanticChipInfoClass,
  semanticChipSuccessClass,
  semanticChipWarningClass,
} from "../lib/form-field-classes";

interface UserWithData extends User {
  patientCount: number;
  sessionCount: number;
}

interface ClinicOption {
  clinicId: string;
  clinicName: string;
  clinicCode: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

interface NewClinicPayload {
  /** Vacío = la API genera placeholders, el clinic_admin completa en Configuración */
  podiatristLimit?: number | null;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  clinicId?: string;
  newClinic?: NewClinicPayload;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Create User Modal
const CreateUserModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  clinics = [],
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (payload: CreateUserPayload) => void | Promise<boolean | string>;
  clinics?: ClinicOption[];
}) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "podiatrist" as UserRole,
    clinicId: "",
    clinicMode: "none" as "existing" | "new" | "none",
    newClinic: { podiatristLimit: null as number | null } as NewClinicPayload,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "podiatrist",
      clinicId: "",
      clinicMode: "none",
      newClinic: { podiatristLimit: null } as NewClinicPayload,
    });
  };

  if (!isOpen) return null;

  const needsClinic = formData.role === "podiatrist" || formData.role === "clinic_admin" || formData.role === "receptionist";
  const showClinicSelector = needsClinic && (formData.clinicMode === "existing" || formData.role === "receptionist");
  const showNewClinicForm = needsClinic && formData.clinicMode === "new" && formData.role !== "receptionist";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!name) {
      alert(t.usersPage.create.errors.nameRequired);
      return;
    }
    if (!email || !isValidEmail(email)) {
      alert(t.usersPage.create.errors.emailInvalid);
      return;
    }
    if (!password || password.length < 8) {
      alert(t.usersPage.create.errors.passwordMin);
      return;
    }
    if (formData.role === "receptionist" && !formData.clinicId) {
      alert(t.usersPage.create.errors.clinicRequiredReceptionist);
      return;
    }
    if (formData.role === "clinic_admin" && formData.clinicMode === "existing" && !formData.clinicId) {
      alert(t.usersPage.create.errors.clinicRequiredAdmin);
      return;
    }
    const payload: CreateUserPayload = {
      name,
      email,
      password,
      role: formData.role,
    };
    if ((formData.clinicMode === "existing" || formData.role === "receptionist") && formData.clinicId) {
      payload.clinicId = formData.clinicId;
    } else if (formData.clinicMode === "new") {
      payload.newClinic = {
        podiatristLimit: formData.role === "clinic_admin" && formData.newClinic?.podiatristLimit != null && formData.newClinic.podiatristLimit >= 1
          ? formData.newClinic.podiatristLimit
          : undefined,
      };
    }
    setIsSaving(true);
    try {
      const ok = await onSave(payload);
      if (ok !== false) {
        resetForm();
        onClose();
        if (typeof ok === "string") {
          alert(ok);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl my-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-brand-ink">{t.usersPage.create.title}</h3>
        </div>
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.fields.name}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.fields.email}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.fields.password}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">{t.usersPage.create.passwordHint}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.fields.role}</label>
            <select
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value as UserRole;
                setFormData({
                  ...formData,
                  role,
                  clinicId: "",
                  clinicMode:
                    role === "podiatrist"
                      ? "none"
                      : role === "receptionist" || role === "clinic_admin"
                        ? "existing"
                        : "existing",
                });
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
            >
              <option value="podiatrist">{t.roles.podiatrist}</option>
              <option value="clinic_admin">{t.roles.clinicAdmin}</option>
              <option value="receptionist">{t.roles.receptionist}</option>
              <option value="admin">{t.roles.admin}</option>
              <option value="super_admin">{t.roles.superAdmin}</option>
            </select>
          </div>

          {needsClinic && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">
                  {formData.role === "clinic_admin" || formData.role === "receptionist" ? t.usersPage.fields.clinic : t.usersPage.fields.clinicOptional}
                </label>
                {formData.role !== "receptionist" && (
                  <select
                    value={formData.clinicMode}
                    onChange={(e) => setFormData({ ...formData, clinicMode: e.target.value as "existing" | "new" | "none", clinicId: "" })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  >
                    <option value="existing">{t.usersPage.create.clinicModeExisting}</option>
                    <option value="new">{t.usersPage.create.clinicModeNew}</option>
                    {formData.role === "podiatrist" && <option value="none">{t.usersPage.create.clinicModeNone}</option>}
                  </select>
                )}
              </div>

              {showClinicSelector && (
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.fields.clinic}</label>
                  <select
                    value={formData.clinicId}
                    onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  >
                    <option value="">{t.usersPage.selectPlaceholder}</option>
                    {clinics.map((c) => (
                      <option key={c.clinicId} value={c.clinicId}>
                        {c.clinicName} ({c.clinicCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showNewClinicForm && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t.usersPage.create.newClinicHint}
                  </p>
                  {formData.role === "clinic_admin" && (
                    <div>
                      <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.create.podiatristLimit}</label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        placeholder={t.usersPage.create.podiatristLimitPlaceholder}
                        value={formData.newClinic?.podiatristLimit ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = parseInt(v, 10);
                          setFormData({
                            ...formData,
                            newClinic: { ...(formData.newClinic || {}), podiatristLimit: v === "" || Number.isNaN(n) ? null : n },
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t.usersPage.create.podiatristLimitHint}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? t.usersPage.create.saving : t.common.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// CSV template for bulk import (semicolon delimiter - works well with Spanish names)
const BULK_IMPORT_TEMPLATE = `nombre;email;password;rol;clinicMode;clinicId;podiatrist_limit
Juan Pérez;juan@ejemplo.com;TempPass123!;podiatrist;existing;clinic_001;
María García;maria@ejemplo.com;TempPass123!;clinic_admin;new;;5
Pedro López;pedro@ejemplo.com;TempPass123!;podiatrist;none;;`;

// Bulk Import Modal
const BulkImportModal = ({
  isOpen,
  onClose,
  onImportComplete,
  clinics = [],
  isSuperAdmin,
  currentUserClinicId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  clinics?: ClinicOption[];
  isSuperAdmin: boolean;
  currentUserClinicId?: string;
}) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [parsedRows, setParsedRows] = useState<Array<{ name: string; email: string; password: string; role: UserRole; clinicMode: string; clinicId: string; podiatristLimit?: number | null }>>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<Array<{ index: number; name: string; email: string; success: boolean; error?: string }>>([]);
  const [importDone, setImportDone] = useState(false);

  const resetState = () => {
    setFile(null);
    setDefaultPassword("");
    setParsedRows([]);
    setParseError(null);
    setImportResults([]);
    setImportDone(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob([BULK_IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t.usersPage.import.templateFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    const rows: string[][] = [];
    for (const line of lines) {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if ((c === ";" || c === ",") && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += c;
        }
      }
      cells.push(current.trim());
      rows.push(cells);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setParseError(null);
    setParsedRows([]);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const rows = parseCSV(text);
        if (rows.length < 2) {
          setParseError(t.usersPage.import.errors.needRows);
          return;
        }
        const header = rows[0].map((h) => h.toLowerCase().replace(/\s/g, ""));
        const nameIdx = header.findIndex((h) => h === "nombre" || h === "name");
        const emailIdx = header.findIndex((h) => h === "email");
        const passIdx = header.findIndex((h) => h === "password" || h === "contraseña");
        const roleIdx = header.findIndex((h) => h === "rol" || h === "role");
        const clinicModeIdx = header.findIndex((h) => h === "clinicmode" || h === "clinic_mode");
        const clinicIdIdx = header.findIndex((h) => h === "clinicid" || h === "clinic_id");
        const podiatristLimitIdx = header.findIndex((h) => h === "podiatristlimit" || h === "podiatrist_limit");

        if (nameIdx < 0 || emailIdx < 0 || passIdx < 0 || roleIdx < 0) {
          setParseError(t.usersPage.import.errors.missingColumns);
          return;
        }

        const validRoles = ["super_admin", "clinic_admin", "admin", "podiatrist", "receptionist"];
        const parsed: typeof parsedRows = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const name = (row[nameIdx] ?? "").trim();
          const email = (row[emailIdx] ?? "").trim();
          let password = (row[passIdx] ?? "").trim();
          const roleRaw = (row[roleIdx] ?? "").trim().toLowerCase();
          const role = (validRoles.includes(roleRaw) ? roleRaw : "podiatrist") as UserRole;
          const clinicMode = clinicModeIdx >= 0 ? (row[clinicModeIdx] ?? "").trim().toLowerCase() : "existing";
          const clinicId = clinicIdIdx >= 0 ? (row[clinicIdIdx] ?? "").trim() : "";
          let podiatristLimit: number | null = null;
          if (podiatristLimitIdx >= 0 && role === "clinic_admin") {
            const raw = (row[podiatristLimitIdx] ?? "").trim();
            const n = parseInt(raw, 10);
            if (!Number.isNaN(n) && n >= 1) podiatristLimit = Math.min(999, Math.floor(n));
          }

          if (!name || !email) continue;
          parsed.push({
            name,
            email,
            password,
            role,
            clinicMode: clinicMode || "existing",
            clinicId,
            podiatristLimit: role === "clinic_admin" ? podiatristLimit : undefined,
          });
        }
        setParsedRows(parsed);
        setFile(f);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : t.usersPage.import.errors.readFile);
      }
    };
    reader.readAsText(f, "UTF-8");
  };

  const runImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setImportResults([]);
    const results: typeof importResults = [];
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      let password = row.password;
      if (!password && defaultPassword) password = defaultPassword;
      if (!password || password.length < 8) {
        results.push({ index: i + 1, name: row.name, email: row.email, success: false, error: t.usersPage.import.errors.invalidPassword });
        continue;
      }
      try {
        const userPayload: Record<string, unknown> = {
          email: row.email.toLowerCase(),
          name: row.name,
          role: row.role,
          password,
        };
        if (isSuperAdmin) {
          if (row.clinicMode === "existing" && row.clinicId) {
            userPayload.clinicId = row.clinicId;
          }
          // Si clinicMode === "new", creamos usuario sin clínica, luego clínica, luego actualizamos
        } else if (currentUserClinicId) {
          userPayload.clinicId = currentUserClinicId;
        }

        const response = await api.post<{ success: boolean; user: User }>("/users", userPayload);
        if (response.success && response.data?.success) {
          const newUser = response.data.user;
          if (isSuperAdmin && row.clinicMode === "new" && (row.role === "clinic_admin" || row.role === "podiatrist")) {
            const clinicPayload: Record<string, unknown> = { ownerId: newUser.id };
            if (row.role === "clinic_admin" && row.podiatristLimit != null && row.podiatristLimit >= 1) {
              clinicPayload.podiatristLimit = row.podiatristLimit;
            }
            const clinicRes = await api.post<{ success?: boolean; clinic?: { clinicId: string } }>("/clinics", clinicPayload);
            if (clinicRes.success && clinicRes.data?.clinic) {
              await api.put(`/users/${newUser.id}`, { clinicId: clinicRes.data.clinic.clinicId });
            }
          }
          results.push({ index: i + 1, name: row.name, email: row.email, success: true });
        } else {
          const msg = (response.data as { message?: string })?.message || response.error || t.usersPage.import.errors.unknown;
          results.push({ index: i + 1, name: row.name, email: row.email, success: false, error: msg });
        }
      } catch (err) {
        results.push({
          index: i + 1,
          name: row.name,
          email: row.email,
          success: false,
          error: err instanceof Error ? err.message : t.usersPage.import.errors.connection,
        });
      }
      setImportResults([...results]);
    }
    setIsImporting(false);
    setImportDone(true);
    onImportComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-brand-ink flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t.usersPage.import.title}
          </h3>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600">
            {t.usersPage.import.description}
            {isSuperAdmin && t.usersPage.import.optionalColumnsSuperAdmin}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-brand-ink hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.usersPage.import.downloadTemplate}
            </button>
            <label className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors cursor-pointer flex items-center gap-2">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t.usersPage.import.selectFile}
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.import.defaultPassword}</label>
            <input
              type="password"
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              placeholder={t.usersPage.import.optionalPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
            />
          </div>
          {parseError && <div className={semanticAlertErrorClass}>{parseError}</div>}
          {parsedRows.length > 0 && !importDone && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <p className="p-3 bg-brand-canvas text-sm font-medium text-brand-ink">
                {t.usersPage.import.readyCount.replace("{count}", String(parsedRows.length))}
              </p>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-2">{t.usersPage.fields.name}</th>
                      <th className="text-left p-2">{t.usersPage.fields.email}</th>
                      <th className="text-left p-2">{t.usersPage.fields.role}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.email}</td>
                        <td className="p-2">{r.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 10 && <p className="p-2 text-xs text-gray-500">{t.usersPage.import.andMore.replace("{count}", String(parsedRows.length - 10))}</p>}
              </div>
            </div>
          )}
          {importDone && importResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <p className="p-3 bg-brand-canvas text-sm font-medium text-brand-ink">
                {t.usersPage.import.resultsSummary
                  .replace("{ok}", String(importResults.filter((r) => r.success).length))
                  .replace("{fail}", String(importResults.filter((r) => !r.success).length))}
              </p>
              <div className="max-h-48 overflow-y-auto">
                {importResults.map((r) => (
                  <div key={r.index} className={`flex items-center justify-between p-2 text-sm border-b border-gray-100 ${r.success ? "bg-semantic-success-bg" : "bg-semantic-error-bg"}`}>
                    <span className="font-medium">{r.name}</span>
                    <span className={r.success ? formSuccessClass : formErrorClass}>{r.success ? t.usersPage.import.created : r.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {importDone ? t.common.close : t.common.cancel}
          </button>
          {!importDone && parsedRows.length > 0 && (
            <button
              type="button"
              onClick={runImport}
              disabled={isImporting}
              className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50"
            >
              {isImporting ? t.usersPage.import.importing.replace("{done}", String(importResults.length)).replace("{total}", String(parsedRows.length)) : t.usersPage.import.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Edit User Modal
const EditUserModal = ({
  isOpen,
  onClose,
  user,
  onSave,
  clinics = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, updates: Partial<User>) => void;
  clinics?: ClinicOption[];
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const isEditorSuperAdmin = currentUser?.role === "super_admin";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "podiatrist" as UserRole,
    clinicId: "",
  });
  const [superAdminRoleConfirmed, setSuperAdminRoleConfirmed] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId || "",
      });
      setSuperAdminRoleConfirmed(user.role === "super_admin");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isPromotingToSuperAdmin =
    isEditorSuperAdmin && formData.role === "super_admin" && user.role !== "super_admin";
  const needsSuperAdminConfirmation = isPromotingToSuperAdmin && !superAdminRoleConfirmed;

  const handleRoleChange = (newRole: UserRole) => {
    setFormData({ ...formData, role: newRole });
    if (newRole !== "super_admin" || user.role === "super_admin") {
      setSuperAdminRoleConfirmed(newRole === "super_admin");
    } else if (isEditorSuperAdmin) {
      setSuperAdminRoleConfirmed(false);
    }
  };

  const handleConfirmSuperAdminRole = () => {
    setSuperAdminRoleConfirmed(true);
  };

  const handleCancelSuperAdminRole = () => {
    setFormData({ ...formData, role: user.role });
    setSuperAdminRoleConfirmed(user.role === "super_admin");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsSuperAdminConfirmation) return;
    onSave(user.id, formData);
    onClose();
  };

  const needsClinic = formData.role === "podiatrist" || formData.role === "clinic_admin";

  const labelCls = "block text-sm font-medium text-brand-ink mb-1";
  const fieldCls =
    "w-full px-4 py-2.5 rounded-lg border border-brand-border bg-brand-surface text-brand-ink placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors";
  const selectCls = `${fieldCls} [&_option]:bg-white [&_option]:text-brand-ink dark:[&_option]:bg-gray-800 dark:[&_option]:text-white`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-2xl w-full max-w-md shadow-xl dark:shadow-black/40">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-brand-ink">{t.usersPage.edit.title}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>{t.usersPage.fields.name}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={fieldCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>{t.usersPage.fields.email}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={fieldCls}
              pattern="[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}"
              title={t.errors.invalidEmail}
              required
            />
          </div>
          <div>
            <label className={labelCls}>{t.usersPage.fields.role}</label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className={selectCls}
            >
              <option value="podiatrist">{t.roles.podiatrist}</option>
              <option value="clinic_admin">{t.roles.clinicAdmin}</option>
              <option value="admin">{t.roles.admin}</option>
              {isEditorSuperAdmin && (
                <option value="super_admin">{t.roles.superAdmin}</option>
              )}
            </select>
            {isPromotingToSuperAdmin && (
              <div
                className={`mt-3 ${semanticAlertWarningClass}`}
                role="alert"
              >
                <p className="font-medium">
                  {t.roles.superAdminAssignWarning}
                </p>
                <p className="mt-1 opacity-90">
                  {t.roles.superAdminAssignConfirmPrompt}
                </p>
                {superAdminRoleConfirmed ? (
                  <p className={`mt-3 ${formSuccessClass} text-xs font-medium`}>
                    ✓ {t.roles.superAdminAssignConfirmed}
                  </p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmSuperAdminRole}
                      className="flex-1 px-3 py-2 rounded-lg bg-brand-ink text-brand-ink-fg font-medium transition-colors hover:bg-brand-ink-hover"
                    >
                      {t.common.confirm}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSuperAdminRole}
                      className="flex-1 px-3 py-2 rounded-lg border border-semantic-warning bg-brand-surface text-semantic-warning font-medium hover:bg-semantic-warning-bg transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {needsClinic && (
            <div>
              <label className={labelCls}>{t.usersPage.fields.clinic}</label>
              <select
                value={formData.clinicId}
                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                className={selectCls}
              >
                <option value="">{t.usersPage.edit.noClinic}</option>
                {clinics.map((c) => (
                  <option key={c.clinicId} value={c.clinicId}>
                    {c.clinicName} ({c.clinicCode})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={needsSuperAdminConfirmation}
              className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Transfer History Modal
const TransferHistoryModal = ({ 
  isOpen, 
  onClose, 
  allUsers,
  clinicalStats,
  onTransferred,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  allUsers: User[];
  clinicalStats: ClinicalStatsMap;
  onTransferred: () => void;
}) => {
  const { t } = useLanguage();
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const sourcePatientCount = clinicalStats[sourceUserId]?.patientCount ?? 0;

  const handleTransfer = async () => {
    if (!sourceUserId || !targetUserId || sourceUserId === targetUserId) return;
    
    setIsTransferring(true);
    
    try {
      const transferResult = await transferClinicalHistory(sourceUserId, targetUserId);
      
      if (transferResult.success) {
        onTransferred();
        setResult({
          success: true,
          message: transferResult.message ?? t.usersPage.transfer.successMessage
            .replace("{patients}", String(transferResult.patientsTransferred ?? 0))
            .replace("{sessions}", "0"),
        });
      } else {
        setResult({
          success: false,
          message: transferResult.error ?? t.usersPage.transfer.error,
        });
      }
    } catch {
      setResult({
        success: false,
        message: t.usersPage.transfer.error,
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-brand-ink">{t.usersPage.transfer.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{t.usersPage.transfer.subtitle}</p>
        </div>
        <div className="p-6 space-y-4">
          {result ? (
            <div className={result.success ? semanticAlertSuccessClass : semanticAlertErrorClass}>
              <p className="font-medium">{result.success ? t.usersPage.transfer.successTitle : t.usersPage.transfer.errorTitle}</p>
              <p className="text-sm mt-1">{result.message}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.transfer.sourceUser}</label>
                <select
                  value={sourceUserId}
                  onChange={(e) => setSourceUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                >
                  <option value="">{t.usersPage.transfer.selectUser}</option>
                  {allUsers.filter(u => u.role === "podiatrist").map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {sourceUserId && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">
                    {t.usersPage.transfer.patientsCount.replace("{count}", String(sourcePatientCount))}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.usersPage.transfer.targetUser}</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                >
                  <option value="">{t.usersPage.transfer.selectUser}</option>
                  {allUsers.filter(u => u.role === "podiatrist" && u.id !== sourceUserId).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className={semanticAlertWarningClass}>
                <p>
                  {t.usersPage.transfer.warning}
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setSourceUserId("");
                setTargetUserId("");
                onClose();
              }}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {result ? t.common.close : t.common.cancel}
            </button>
            {!result && (
              <button
                onClick={handleTransfer}
                disabled={!sourceUserId || !targetUserId || sourceUserId === targetUserId || isTransferring}
                className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? t.usersPage.transfer.transferring : t.usersPage.transfer.submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Profile/Details Modal
const UserProfileModal = ({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
}) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<{ patientCount: number; sessionCount: number; patients: Patient[] } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    fetchUserClinicalProfile(user.id)
      .then((data) => setProfile(data))
      .finally(() => setProfileLoading(false));
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const patients = profile?.patients ?? [];
  const patientCount = profile?.patientCount ?? 0;
  const sessionCount = profile?.sessionCount ?? 0;

  const roleLabel = {
    super_admin: t.roles.superAdmin,
    clinic_admin: t.roles.clinicAdmin,
    admin: t.roles.admin,
    podiatrist: t.roles.podiatrist,
    receptionist: t.roles.receptionist,
  }[user.role] ?? user.role;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto form-modal-scroll">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-ink rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-medium">{user.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-ink">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "super_admin" ? "bg-brand-ink text-brand-ink-fg" :
            user.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
            user.role === "admin" ? "bg-orange-100 text-orange-700" :
            user.role === "receptionist" ? "bg-teal-100 text-teal-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {roleLabel}
          </span>
        </div>
        
        <div className="p-6 space-y-6">
          {profileLoading ? (
            <p className="text-sm text-gray-500">{t.usersPage.profile.loading}</p>
          ) : (
          <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">{t.usersPage.profile.patients}</p>
              <p className="text-2xl font-semibold text-brand-ink">{patientCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">{t.usersPage.profile.sessions}</p>
              <p className="text-2xl font-semibold text-brand-ink">{sessionCount}</p>
            </div>
          </div>

          {/* Patients list */}
          {patients.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-brand-ink mb-3">{t.usersPage.profile.patientsHeading.replace("{count}", String(patientCount))}</h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto form-modal-scroll">
                {patients.slice(0, 10).map((patient) => (
                  <div key={patient.id} className="p-3 flex items-center justify-between">
                    <span className="text-sm text-brand-ink">{patient.firstName} {patient.lastName}</span>
                    <span className="text-xs text-gray-500">{patient.email}</span>
                  </div>
                ))}
                {patientCount > 10 && (
                  <div className="p-3 text-center">
                    <span className="text-xs text-gray-500">{t.usersPage.profile.andMore.replace("{count}", String(patientCount - 10))}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
          )}

        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Users Page
const UsersPage = () => {
  const { t } = useLanguage();
  const { user: currentUser, users: allUsers, usersLoading, fetchUsers } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [passwordResetRequests, setPasswordResetRequests] = useState<Array<{
    id: string;
    email: string;
    userName: string | null;
    status: string;
    requestedAt: string;
    ipAddress?: string;
  }>>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  type SortKey = "name" | "email" | "role" | "status" | "clinic" | "data";
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [approvedResetLink, setApprovedResetLink] = useState<string | null>(null);
  const [openAccountMenuId, setOpenAccountMenuId] = useState<string | null>(null);
  const [accountMenuPosition, setAccountMenuPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [clinicsForLimits, setClinicsForLimits] = useState<Array<{
    clinicId: string; clinicName: string; clinicCode: string; podiatristLimit: number | null; podiatristCount: number;
    effectivePlanTier: "base" | "premium" | null;
  }>>([]);
  const [clinicLimitEdits, setClinicLimitEdits] = useState<Record<string, string>>({});
  const [clinicLimitSaving, setClinicLimitSaving] = useState<string | null>(null);
  const [clinicalStats, setClinicalStats] = useState<ClinicalStatsMap>({});
  const [pendingRegistrationLists, setPendingRegistrationLists] = useState<Array<{
    id: string;
    name: string;
    createdBy: string;
    status: string;
    submittedAt?: string | null;
    creatorName?: string | null;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    if (!currentUser || !["super_admin", "admin", "clinic_admin"].includes(currentUser.role)) return;
    void fetchUsers();
  }, [currentUser, fetchUsers]);

  const loadClinicalStats = useCallback(async () => {
    if (!currentUser || !["super_admin", "admin", "clinic_admin"].includes(currentUser.role)) return;
    const stats = await fetchClinicalStats();
    setClinicalStats(stats);
  }, [currentUser]);

  useEffect(() => {
    loadClinicalStats();
  }, [loadClinicalStats]);

  const loadClinics = useCallback(async () => {
    if (!isSuperAdmin && currentUser?.role !== "admin") return;
    try {
      const r = await api.get<{
        success?: boolean;
        clinics?: Array<{
          clinicId: string;
          clinicName: string;
          clinicCode: string;
          podiatristLimit?: number | null;
          podiatristCount?: number;
          effectivePlanTier?: "base" | "premium" | null;
        }>;
      }>("/clinics");
      if (r.success && Array.isArray(r.data?.clinics)) {
        const mapped = r.data.clinics.map((c) => ({
          clinicId: c.clinicId,
          clinicName: c.clinicName,
          clinicCode: c.clinicCode,
          podiatristLimit: c.podiatristLimit ?? null,
          podiatristCount: c.podiatristCount ?? 0,
          effectivePlanTier: c.effectivePlanTier ?? null,
        }));
        setClinics(
          mapped.map((c) => ({
            clinicId: c.clinicId,
            clinicName: c.clinicName,
            clinicCode: c.clinicCode,
          }))
        );
        setClinicsForLimits(mapped);
      }
    } catch {
      setClinics([]);
      setClinicsForLimits([]);
    }
  }, [isSuperAdmin, currentUser?.role]);

  useEffect(() => {
    void loadClinics();
  }, [loadClinics]);

  // Cargar solicitudes de recuperación de contraseña (solo super_admin, admin)
  useEffect(() => {
    if (!isSuperAdmin && currentUser?.role !== "admin") return;
    const loadRequests = async () => {
      try {
        const r = await api.get<{ success: boolean; requests?: typeof passwordResetRequests }>("/auth/password-reset-requests");
        if (r.success && Array.isArray(r.data?.requests)) {
          setPasswordResetRequests(r.data.requests);
        }
      } catch {
        // Silenciar si no tiene permiso
      }
    };
    loadRequests();
  }, [isSuperAdmin, currentUser?.role]);

  // Cargar listas de registro pendientes (solo super_admin)
  useEffect(() => {
    if (!isSuperAdmin) return;
    const loadLists = async () => {
      try {
        const r = await api.get<{ success?: boolean; lists?: Array<{ id: string; name: string; createdBy: string; status: string; submittedAt?: string | null; creatorName?: string | null; createdAt: string }> }>("/registration-lists?status=pending");
        if (r.success && Array.isArray(r.data?.lists)) {
          setPendingRegistrationLists(r.data.lists);
        }
      } catch {
        // Silenciar
      }
    };
    loadLists();
  }, [isSuperAdmin]);

  const loadPendingLists = useCallback(async () => {
    if (!isSuperAdmin) return;
    const r = await api.get<{ success?: boolean; lists?: typeof pendingRegistrationLists }>("/registration-lists?status=pending");
    if (r.success && Array.isArray(r.data?.lists)) setPendingRegistrationLists(r.data.lists);
  }, [isSuperAdmin]);

  const handleApproveRegistrationList = async (listId: string) => {
    const r = await api.post<{ success?: boolean; created?: number; skipped?: string[]; errors?: Array<{ email: string; error: string }>; message?: string }>(`/registration-lists/${listId}/approve`);
    if (r.success) {
      await loadPendingLists();
      await fetchUsers();
      await loadClinics();
      const msg = r.data?.message ?? (r.data?.created ? t.usersPage.regLists.createdCount.replace("{count}", String(r.data.created)) : t.usersPage.regLists.approved);
      if (r.data?.errors?.length) {
        alert(`${msg}\n\n${t.usersPage.regLists.errorsPrefix}\n${r.data.errors.map((e) => `${e.email}: ${e.error}`).join("\n")}`);
      } else {
        alert(msg);
      }
    } else {
      alert(r.error || t.usersPage.errors.approve);
    }
  };

  const handleRejectRegistrationList = async (listId: string) => {
    const r = await api.post(`/registration-lists/${listId}/reject`);
    if (r.success) {
      await loadPendingLists();
    } else {
      alert(r.error || t.usersPage.errors.reject);
    }
  };

  const handleDownloadRegistrationListCsv = async (listId: string) => {
    try {
      const res = await fetch(`/api/registration-lists/${listId}/csv`, { credentials: "include" });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lista_${listId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const pendingPasswordResets = passwordResetRequests.filter((r) => r.status === "pending");

  const usersWithData: UserWithData[] = allUsers.map((u) => {
    const counts = clinicalStats[u.id] ?? { patientCount: 0, sessionCount: 0 };
    return {
      ...u,
      patientCount: counts.patientCount,
      sessionCount: counts.sessionCount,
    };
  });

  // Filter users
  const filteredUsers = usersWithData.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleLabels = {
    super_admin: t.roles.superAdmin,
    clinic_admin: t.roles.clinicAdmin,
    admin: t.roles.admin,
    podiatrist: t.roles.podiatrist,
    receptionist: t.roles.receptionist,
  };

  // Mapa clínica -> info (para mostrar nombre y límite en cada fila)
  const clinicMap = useMemo(() => {
    const m = new Map<string, { clinicName: string; clinicCode: string; podiatristLimit: number | null; podiatristCount: number; effectivePlanTier: "base" | "premium" | null }>();
    for (const c of clinicsForLimits) {
      m.set(c.clinicId, { clinicName: c.clinicName, clinicCode: c.clinicCode, podiatristLimit: c.podiatristLimit, podiatristCount: c.podiatristCount, effectivePlanTier: c.effectivePlanTier });
    }
    return m;
  }, [clinicsForLimits]);

  // Orden de rol para ordenar (clínica/subalternos: clinic_admin primero, luego podiatrist, etc.)
  const roleOrder: Record<string, number> = { super_admin: 0, clinic_admin: 1, admin: 2, receptionist: 3, podiatrist: 4 };
  const statusOrder = (u: User): number => {
    if (u.isBanned) return 4;
    if (u.isBlocked) return 3;
    if (u.isEnabled === false) return 2;
    return 0;
  };

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
          break;
        case "email":
          cmp = (a.email || "").localeCompare(b.email || "", undefined, { sensitivity: "base" });
          break;
        case "role":
          cmp = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
          if (cmp === 0) cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
          break;
        case "status":
          cmp = statusOrder(a) - statusOrder(b);
          if (cmp === 0) cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
          break;
        case "clinic": {
          const nameA = a.clinicId ? (clinicMap.get(a.clinicId)?.clinicName ?? "") : "";
          const nameB = b.clinicId ? (clinicMap.get(b.clinicId)?.clinicName ?? "") : "";
          cmp = nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
          if (cmp === 0) cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
          break;
        }
        case "data": {
          const totalA = a.patientCount + a.sessionCount;
          const totalB = b.patientCount + b.sessionCount;
          cmp = totalA - totalB;
          if (cmp === 0) cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
          break;
        }
        default:
          cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      }
      return mult * cmp;
    });
    return list;
  }, [filteredUsers, sortBy, sortDir, clinicMap]);

  const handleSort = (key: SortKey) => {
    setSortBy(key);
    setSortDir((prev) => (sortBy === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
  };

  const SortableTh = ({ sortKey, label, align = "left" }: { sortKey: SortKey; label: string; align?: "left" | "right" }) => (
    <th
      className={`${align === "right" ? "text-right" : "text-left"} px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider truncate cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors`}
      onClick={() => handleSort(sortKey)}
      title={t.usersPage.table.sortBy.replace("{label}", label)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === sortKey ? (
          sortDir === "asc" ? (
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          )
        ) : (
          <span className="w-3.5 h-3.5 inline-block opacity-30" aria-hidden><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg></span>
        )}
      </span>
    </th>
  );

  // Etiqueta de estado (suscripción, trial, baja admin, etc.)
  const getUserStatusBadge = (user: User) => {
    const toneClasses: Record<
      NonNullable<User['accessBadge']>['tone'],
      string
    > = {
      green: semanticChipSuccessClass,
      blue: semanticChipInfoClass,
      amber: semanticChipWarningClass,
      yellow: semanticChipWarningClass,
      orange: semanticChipWarningClass,
      red: semanticChipErrorClass,
      gray: "inline-flex items-center rounded-full border border-brand-border bg-brand-canvas px-2 py-0.5 text-xs font-medium text-brand-muted",
    };

    if (user.accessBadge) {
      const cls = toneClasses[user.accessBadge.tone] ?? toneClasses.gray;
      return (
        <span className={cls}>
          {user.accessBadge.label}
        </span>
      );
    }

    if (user.isBanned) {
      return (
        <span className={`${semanticChipErrorClass} gap-1`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          {t.usersPage.status.banned}
        </span>
      );
    }
    if (user.isBlocked) {
      return (
        <span className={`${semanticChipWarningClass} gap-1`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {t.usersPage.status.blocked}
        </span>
      );
    }
    if (user.isEnabled === false && user.disabledAt != null) {
      const disabledAt = user.disabledAt;
      const daysSinceDisabled = (Date.now() - disabledAt) / (24 * 60 * 60 * 1000);
      const isGracePeriod = daysSinceDisabled < 30;
      const graceDays = Math.max(0, Math.floor(daysSinceDisabled));
      const graceLabel = `${t.usersPage.status.gracePeriod} (${graceDays})`;
      return (
        <span className={`${semanticChipWarningClass} gap-1`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isGracePeriod ? graceLabel : t.usersPage.status.disabled}
        </span>
      );
    }
    if (user.isEnabled === false && (user.role === "clinic_admin" || user.role === "podiatrist")) {
      return (
        <span className={semanticChipWarningClass}>
          {t.usersPage.status.pendingPayment}
        </span>
      );
    }
    return (
      <span className={`${semanticChipSuccessClass} gap-1`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t.usersPage.status.active}
      </span>
    );
  };

  // Verificar si el usuario actual puede gestionar (bloquear, banear, eliminar) al usuario objetivo
  const canManageUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.id === targetUser.id) return false; // No gestionar a sí mismo
    if (currentUser.role === "super_admin") return true; // Super admin puede gestionar a todos
    if (currentUser.role === "clinic_admin" && targetUser.role === "receptionist" && targetUser.clinicId === currentUser.clinicId) return true;
    return false;
  };

  const handleCreateUser = async (payload: CreateUserPayload): Promise<boolean | string> => {
    const email = (payload.email || "").trim();
    if (!email) {
      alert(t.usersPage.create.errors.emailInvalid);
      return false;
    }

    const emailExists = allUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      alert(t.usersPage.create.errors.createFailed);
      return false;
    }

    if (!payload.password || payload.password.length < 8) {
      alert(t.usersPage.create.errors.passwordMin);
      return false;
    }

    try {
      const userPayload: Record<string, unknown> = {
        email,
        name: payload.name || "",
        role: payload.role || "podiatrist",
        password: payload.password,
      };
      if (payload.clinicId) userPayload.clinicId = payload.clinicId;

      const response = await api.post<{ success: boolean; user: User }>("/users", userPayload);

      if (!response.success || !response.data?.success) {
        const msg = response.data?.message || response.error || t.usersPage.create.errors.createFailed;
        const issues = (response.data as any)?.issues as Array<{ message?: string; path?: (string | number)[] }> | undefined;
        const details = issues?.length ? issues.map((i) => i.message || i.path?.join(".")).join(". ") : "";
        alert(details ? `${msg}\n\n${t.common.details}: ${details}` : msg);
        return false;
      }

      let newUser = response.data.user;
      let createdClinic: { clinicId: string; clinicName: string; clinicCode: string } | null = null;

      if (payload.newClinic) {
        const clinicPayload: Record<string, unknown> = { ownerId: newUser.id };
        if (payload.newClinic.podiatristLimit != null && payload.newClinic.podiatristLimit >= 1) {
          clinicPayload.podiatristLimit = payload.newClinic.podiatristLimit;
        }
        const clinicRes = await api.post<{ success?: boolean; clinic?: { clinicId: string; clinicName: string; clinicCode: string } }>("/clinics", clinicPayload);

        if (!clinicRes.success || !clinicRes.data?.clinic) {
          await fetchUsers();
          return t.usersPage.create.partialClinicFail;
        }

        createdClinic = clinicRes.data.clinic;
        const updateRes = await api.put<{ success?: boolean; user?: User }>(`/users/${newUser.id}`, {
          clinicId: clinicRes.data.clinic.clinicId,
        });
        if (updateRes.success && updateRes.data?.user) {
          newUser = updateRes.data.user;
        }
      }

      if (createdClinic) {
        setClinics((prev) => [...prev, { clinicId: createdClinic!.clinicId, clinicName: createdClinic!.clinicName, clinicCode: createdClinic!.clinicCode }]);
        void loadClinics();
      }

      await fetchUsers();

      void postAuditLog({
        action: "CREATE",
        resourceType: "user",
        resourceId: newUser.id,
        details: {
          action: "user_create",
          newUserName: newUser.name,
          newUserEmail: newUser.email,
          newUserRole: newUser.role,
          newUserClinicId: newUser.clinicId,
        },
      });
      return t.usersPage.create.success;
    } catch (error) {
      console.error("Error creando usuario:", error);
      alert(t.usersPage.create.errors.createFailed);
      return false;
    }
  };

  const handleEditUser = (userId: string, updates: Partial<User>) => {
    (async () => {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.role !== undefined) payload.role = updates.role;
        if (updates.clinicId !== undefined) payload.clinicId = updates.clinicId || null;

        const response = await api.put<{ success?: boolean; user?: User }>(`/users/${userId}`, payload);
        if (response.success && response.data?.user) {
          await fetchUsers();
          void postAuditLog({
            action: "UPDATE",
            resourceType: "user",
            resourceId: userId,
            details: { action: "user_update", targetUserId: userId, targetUserName: updates.name },
          });
        } else {
          alert(response.error || response.data?.message || t.usersPage.edit.errors.updateFailed);
        }
      } catch (error) {
        console.error("Error actualizando usuario:", error);
        alert(t.usersPage.edit.errors.updateFailed);
      }
    })();
  };

  const loadPasswordResetRequests = async () => {
    try {
      const r = await api.get<{ success: boolean; requests?: typeof passwordResetRequests }>("/auth/password-reset-requests");
      if (r.success && Array.isArray(r.data?.requests)) {
        setPasswordResetRequests(r.data.requests);
      }
    } catch {
      // Silenciar
    }
  };

  const handleApprovePasswordReset = async (requestId: string) => {
    try {
      const r = await api.post<{ success: boolean; message?: string; resetUrl?: string }>(`/auth/password-reset-requests/${requestId}/approve`);
      if (r.success) {
        await loadPasswordResetRequests();
        const resetUrl = r.data?.resetUrl;
        if (resetUrl) {
          setApprovedResetLink(resetUrl);
          try {
            await navigator.clipboard.writeText(resetUrl);
          } catch {
            // Si falla clipboard, el modal mostrará el enlace para copiarlo
          }
        } else {
          alert(r.data?.message || t.usersPage.passwordReset.approved);
        }
      } else {
        alert(r.error || r.data?.message || t.usersPage.passwordReset.approveError);
      }
    } catch (e) {
      alert(t.usersPage.passwordReset.approveError);
    }
  };

  const handleRejectPasswordReset = async (requestId: string) => {
    const reason = window.prompt(t.usersPage.passwordReset.rejectReasonPrompt);
    try {
      const r = await api.post<{ success: boolean; message?: string }>(`/auth/password-reset-requests/${requestId}/reject`, { reason: reason || "" });
      if (r.success) {
        await loadPasswordResetRequests();
        alert(r.data?.message || t.usersPage.passwordReset.rejected);
      } else {
        alert(r.error || r.data?.message || t.usersPage.passwordReset.rejectError);
      }
    } catch (e) {
      alert(t.usersPage.passwordReset.rejectError);
    }
  };

  const handleExportUserData = async (user: User) => {
    const ok = await downloadUserClinicalExport(user.id, `user_${user.id}_clinical_history.json`);
    if (!ok) {
      alert(t.usersPage.export.failed);
    }
  };

  const handleBlockUser = (user: User) => {
    if (!window.confirm(t.usersPage.confirm.block.replace("{name}", user.name))) {
      return;
    }
    
    (async () => {
      try {
        const response = await api.post<{ success: boolean; message?: string }>(`/users/${user.id}/block`);
        if (response.success && response.data?.success) {
          await fetchUsers();

          void postAuditLog({
            action: "BLOCK_USER",
            resourceType: "user",
            resourceId: user.id,
            details: {
              action: "block_user",
              targetUserId: user.id,
              targetUserName: user.name,
              targetUserEmail: user.email,
            },
          });
        } else {
          alert(response.error || response.data?.message || t.usersPage.errors.block);
        }
      } catch (error) {
        console.error("Error bloqueando usuario:", error);
        alert(t.usersPage.errors.block);
      }
    })();
  };

  const handleUnblockUser = (user: User) => {
    if (!window.confirm(t.usersPage.confirm.unblock.replace("{name}", user.name))) {
      return;
    }
    
    (async () => {
      try {
        const response = await api.post<{ success: boolean; message?: string }>(`/users/${user.id}/unblock`);
        if (response.success && response.data?.success) {
          await fetchUsers();

          void postAuditLog({
            action: "UNBLOCK_USER",
            resourceType: "user",
            resourceId: user.id,
            details: {
              action: "unblock_user",
              targetUserId: user.id,
              targetUserName: user.name,
              targetUserEmail: user.email,
            },
          });
        } else {
          alert(response.error || response.data?.message || t.usersPage.errors.unblock);
        }
      } catch (error) {
        console.error("Error desbloqueando usuario:", error);
        alert(t.usersPage.errors.unblock);
      }
    })();
  };

  const handleEnableUser = async (user: User) => {
    if (!window.confirm(t.usersPage.confirm.enable.replace("{name}", user.name))) {
      return;
    }
    
    try {
      const response = await api.post<{ success: boolean; message?: string }>(`/users/${user.id}/enable`);
      
      if (response.success && response.data?.success) {
        await fetchUsers();

        void postAuditLog({
          action: "ENABLE_USER",
          resourceType: "user",
          resourceId: user.id,
          details: {
            action: "enable_user",
            targetUserId: user.id,
            targetUserName: user.name,
            targetUserEmail: user.email,
          },
        });
      } else {
        alert(response.error || response.data?.message || t.usersPage.errors.enable);
      }
    } catch (error) {
      console.error("Error habilitando usuario:", error);
      alert(t.usersPage.errors.enable);
    }
  };

  const handleDisableUser = async (user: User) => {
    if (!window.confirm(t.usersPage.confirm.disable.replace("{name}", user.name))) {
      return;
    }

    try {
      const response = await api.post<{ success: boolean; message?: string }>(`/users/${user.id}/disable`);

      if (response.success && response.data?.success) {
        await fetchUsers();

        void postAuditLog({
          action: "DISABLE_USER",
          resourceType: "user",
          resourceId: user.id,
          details: {
            action: "disable_user",
            targetUserId: user.id,
            targetUserName: user.name,
            targetUserEmail: user.email,
          },
        });
      } else {
        alert(response.error || response.data?.message || t.usersPage.errors.disable);
      }
    } catch (error) {
      console.error("Error deshabilitando usuario:", error);
      alert(t.usersPage.errors.disable);
    }
  };

  const handleBanUser = (user: User) => {
    if (!window.confirm(t.usersPage.confirm.ban.replace("{name}", user.name))) {
      return;
    }
    
    (async () => {
      try {
        const response = await api.post<{ success: boolean; message?: string }>(`/users/${user.id}/ban`);
        if (response.success && response.data?.success) {
          await fetchUsers();

          void postAuditLog({
            action: "BAN_USER",
            resourceType: "user",
            resourceId: user.id,
            details: {
              action: "ban_user",
              targetUserId: user.id,
              targetUserName: user.name,
              targetUserEmail: user.email,
            },
          });
        } else {
          alert(response.error || response.data?.message || t.usersPage.errors.ban);
        }
      } catch (error) {
        console.error("Error baneando usuario:", error);
        alert(t.usersPage.errors.ban);
      }
    })();
  };

  const handleUnbanUser = (user: User) => {
    if (!window.confirm(t.usersPage.confirm.unban.replace("{name}", user.name))) {
      return;
    }
    
    (async () => {
      try {
        const response = await api.post<{ success: boolean; message?: string }>(`/users/${user.id}/unban`);
        if (response.success && response.data?.success) {
          await fetchUsers();

          void postAuditLog({
            action: "UNBAN_USER",
            resourceType: "user",
            resourceId: user.id,
            details: {
              action: "unban_user",
              targetUserId: user.id,
              targetUserName: user.name,
              targetUserEmail: user.email,
            },
          });
        } else {
          alert(response.error || response.data?.message || t.usersPage.errors.unban);
        }
      } catch (error) {
        console.error("Error desbaneando usuario:", error);
        alert(t.usersPage.errors.unban);
      }
    })();
  };

  const handleResetEditCooldown = (user: User) => {
    const appliesToClinic = user.role === "clinic_admin" && !!user.clinicId;
    const appliesToProfessional = user.role === "podiatrist";
    if (!appliesToClinic && !appliesToProfessional) {
      alert(t.usersPage.cooldown.notApplicable);
      return;
    }

    const scopeLabel = appliesToClinic ? t.usersPage.cooldown.scopeClinic : t.usersPage.cooldown.scopeProfessional;
    const reason = window.prompt(
      t.usersPage.cooldown.reasonPrompt
        .replace("{name}", user.name)
        .replace("{scope}", scopeLabel)
    );
    if (reason === null) {
      return;
    }
    if (
      !window.confirm(
        t.usersPage.cooldown.confirm.replace("{name}", user.name).replace("{scope}", scopeLabel)
      )
    ) {
      return;
    }

    (async () => {
      try {
        const payload = { scopes: ["info", "logo"] as const, reason: reason.trim() || undefined };
        const response = appliesToClinic
          ? await api.post<{ success: boolean; message?: string }>(`/clinics/${user.clinicId}/reset-edit-cooldown`, payload)
          : await api.post<{ success: boolean; message?: string }>(`/professionals/${user.id}/reset-edit-cooldown`, payload);

        if (response.success && response.data?.success) {
          void postAuditLog({
            action: "RESET_EDIT_COOLDOWN",
            resourceType: appliesToClinic ? "clinic" : "user",
            resourceId: appliesToClinic ? user.clinicId! : user.id,
            details: {
              action: appliesToClinic ? "reset_clinic_edit_cooldown" : "reset_professional_edit_cooldown",
              targetUserId: user.id,
              targetUserName: user.name,
              targetUserEmail: user.email,
              reason: reason.trim() || null,
            },
          });
          alert(response.data.message || t.usersPage.cooldown.applied);
        } else {
          alert(response.error || response.data?.message || t.usersPage.cooldown.error);
        }
      } catch (error) {
        console.error("Error autorizando cambio excepcional:", error);
        alert(t.usersPage.cooldown.error);
      }
    })();
  };

  const handleDeleteUser = (user: User) => {
    if (!window.confirm(t.usersPage.confirm.delete.replace("{name}", user.name))) {
      return;
    }
    
    if (!window.confirm(t.usersPage.confirm.deletePermanent.replace("{name}", user.name))) {
      return;
    }
    
    (async () => {
      try {
        const response = await api.delete<{ success: boolean; message?: string }>(`/users/${user.id}`);
        if (response.success && response.data?.success) {
          await fetchUsers();

          void postAuditLog({
            action: "DELETE_USER",
            resourceType: "user",
            resourceId: user.id,
            details: {
              action: "delete_user",
              targetUserId: user.id,
              targetUserName: user.name,
              targetUserEmail: user.email,
            },
          });
        } else {
          alert(response.error || response.data?.message || t.usersPage.errors.delete);
        }
      } catch (error) {
        console.error("Error eliminando usuario:", error);
        alert(t.usersPage.errors.delete);
      }
    })();
  };

  /** Override de plan (Base/Premium) por super_admin sobre clínica o podólogo independiente. */
  const handleManagePlanTier = (user: User) => {
    const subjectType = user.clinicId ? "clinic" : "user";
    const subjectId = user.clinicId ?? user.id;
    (async () => {
      const cur = await api.get<{ success?: boolean; effectiveTier?: "base" | "premium" | null }>(
        `/subscriptions/subject/${subjectType}/${subjectId}`
      );
      const current = cur.data?.effectiveTier ?? "auto";
      const raw = window.prompt(t.premium.planPrompt.replace("{current}", current), current);
      if (raw === null) return;
      const value = raw.trim().toLowerCase();
      if (value !== "auto" && value !== "base" && value !== "premium") {
        alert(t.premium.planInvalid);
        return;
      }
      const tierOverride = value === "auto" ? null : value;
      const res = await api.post<{ success?: boolean; effectiveTier?: string; message?: string }>(
        "/subscriptions/set-tier",
        { subjectType, subjectId, tierOverride }
      );
      if (res.success) {
        alert(t.premium.planUpdated.replace("{tier}", res.data?.effectiveTier ?? value));
        void loadClinics();
      } else {
        alert(res.message || res.error || t.premium.planInvalid);
      }
    })();
  };

  const handleSavePodiatristLimit = async (clinicId: string) => {
    const raw = clinicLimitEdits[clinicId];
    setClinicLimitSaving(clinicId);
    try {
      const value = raw === "" || raw === undefined ? null : parseInt(String(raw), 10);
      if (value !== null && (Number.isNaN(value) || value < 0)) {
        setClinicLimitSaving(null);
        return;
      }
      const res = await api.patch<{ success?: boolean }>(`/clinics/${clinicId}`, { podiatristLimit: value });
      if (res.success) {
        setClinicsForLimits((prev) =>
          prev.map((c) => (c.clinicId === clinicId ? { ...c, podiatristLimit: value } : c))
        );
        setClinicLimitEdits((prev) => {
          const next = { ...prev };
          delete next[clinicId];
          return next;
        });
      }
    } finally {
      setClinicLimitSaving(null);
    }
  };

  // Cerrar menú de cuenta al hacer clic fuera (portal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-account-menu]') && !target.closest('button[data-account-menu-trigger]')) {
        setOpenAccountMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <MainLayout title={t.nav.users}>
      <div className="space-y-6 w-full max-w-full min-w-0">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(isSuperAdmin || currentUser?.role === "clinic_admin") && (
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200/80 bg-gradient-to-b from-gray-50 to-gray-100 text-brand-ink hover:from-gray-100 hover:to-gray-200 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 text-brand-ink dark:hover:from-gray-700 dark:hover:to-gray-800 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t.usersPage.actions.importCsv}
              </button>
            )}
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.usersPage.actions.createUser}
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200/80 bg-gradient-to-b from-gray-50 to-gray-100 text-brand-ink hover:from-gray-100 hover:to-gray-200 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 text-brand-ink dark:hover:from-gray-700 dark:hover:to-gray-800 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {t.usersPage.actions.transferHistory}
                </button>
              </>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t.usersPage.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:w-64 px-4 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-ink placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors text-sm"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
              className="px-4 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors text-sm [&_option]:bg-white [&_option]:text-brand-ink dark:[&_option]:bg-gray-800 dark:[&_option]:text-white"
            >
              <option value="all">{t.usersPage.allRoles}</option>
              <option value="super_admin">{t.roles.superAdmin}</option>
              <option value="clinic_admin">{t.roles.clinicAdmin}</option>
              <option value="admin">{t.roles.admin}</option>
              <option value="podiatrist">{t.roles.podiatrist}</option>
              <option value="receptionist">{t.roles.receptionist}</option>
            </select>
          </div>
        </div>

        {/* Solicitudes de recuperación de contraseña (solo super_admin, admin) */}
        {(isSuperAdmin || currentUser?.role === "admin") && pendingPasswordResets.length > 0 && (
          <div className={`${semanticAlertWarningClass} !p-4 mb-6`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t.usersPage.passwordReset.pendingTitle}
            </h3>
            <div className="space-y-2">
              {pendingPasswordResets.map((req) => (
                <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 bg-brand-surface rounded-lg p-3 border border-brand-border">
                  <div>
                    <span className="font-medium text-brand-ink">{req.userName || "—"}</span>
                    <span className="text-gray-500 text-sm ml-2">({req.email})</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(req.requestedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprovePasswordReset(req.id)}
                      className="px-3 py-1.5 bg-brand-ink text-brand-ink-fg text-sm font-medium rounded-lg hover:bg-brand-ink-hover"
                    >
                      {t.usersPage.actions.approve}
                    </button>
                    <button
                      onClick={() => handleRejectPasswordReset(req.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border border-semantic-error bg-semantic-error-bg text-semantic-error hover:opacity-90`}
                    >
                      {t.usersPage.actions.reject}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listas de registro pendientes (solo super_admin) - enviadas por vendedores/soporte */}
        {isSuperAdmin && pendingRegistrationLists.length > 0 && (
          <div className={`${semanticAlertInfoClass} !p-4 mb-6`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t.usersPage.regLists.title}
            </h3>
            <p className="text-xs text-blue-700 mb-3">
              {t.usersPage.regLists.hint}
            </p>
            <div className="space-y-2">
              {pendingRegistrationLists.map((list) => (
                <div key={list.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-lg p-3 border border-blue-100">
                  <div>
                    <span className="font-medium text-brand-ink">{list.name}</span>
                    {list.creatorName && (
                      <span className="text-gray-500 text-sm ml-2">{t.usersPage.regLists.byCreator.replace("{name}", list.creatorName)}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-2">
                      {list.submittedAt && new Date(list.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadRegistrationListCsv(list.id)}
                      className="px-3 py-1.5 border border-brand-border text-brand-ink text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {t.usersPage.regLists.downloadCsv}
                    </button>
                    <button
                      onClick={() => handleApproveRegistrationList(list.id)}
                      className="px-3 py-1.5 bg-brand-ink text-brand-ink-fg text-sm font-medium rounded-lg hover:bg-brand-ink-hover"
                    >
                      {t.usersPage.actions.approve}
                    </button>
                    <button
                      onClick={() => handleRejectRegistrationList(list.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border border-semantic-error bg-semantic-error-bg text-semantic-error hover:opacity-90`}
                    >
                      {t.usersPage.actions.reject}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Enlace de recuperación aprobado para reenvío manual */}
        {approvedResetLink && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-brand-ink flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.usersPage.passwordReset.approvedModalTitle}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  {t.usersPage.passwordReset.linkHint}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={approvedResetLink}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900 text-sm font-mono text-brand-ink dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(approvedResetLink);
                        alert(t.usersPage.passwordReset.copied);
                      } catch {
                        alert(t.usersPage.passwordReset.copyFailed);
                      }
                    }}
                    className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    {t.usersPage.passwordReset.copyLink}
                  </button>
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => setApprovedResetLink(null)}
                  className="px-4 py-2.5 bg-brand-canvas text-brand-ink rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >{t.common.close}</button>
              </div>
            </div>
          </div>
        )}

        {/* Users List - Mobile: Cards, Desktop: Table */}
        
        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {sortedUsers.map((u) => (
            <div key={u.id} className="mobile-card">
              <div className="mobile-card-header">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-medium text-brand-ink">{u.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <div className="mt-1">
                      {getUserStatusBadge(u)}
                    </div>
                  </div>
                </div>
                <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  u.role === "super_admin" ? "bg-brand-ink text-brand-ink-fg" :
                  u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                  u.role === "admin" ? "bg-orange-100 text-orange-700" :
                  u.role === "receptionist" ? "bg-teal-100 text-teal-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {roleLabels[u.role] ?? u.role}
                </span>
              </div>
              
              <div className="space-y-1">
                {u.clinicId && (
                  <>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t.usersPage.table.clinic}</span>
                      <span className="mobile-card-value">{clinicMap.get(u.clinicId)?.clinicName ?? u.clinicId}</span>
                    </div>
                    {clinicMap.get(u.clinicId) && (
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">{t.usersPage.table.podiatristLimit}</span>
                        {isSuperAdmin && u.role === "clinic_admin" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={clinicLimitEdits[u.clinicId] ?? (clinicMap.get(u.clinicId)!.podiatristLimit === null ? "" : String(clinicMap.get(u.clinicId)!.podiatristLimit))}
                              onChange={(e) => setClinicLimitEdits((prev) => ({ ...prev, [u.clinicId!]: e.target.value }))}
                              placeholder="∞"
                              className="w-20 px-3 py-2.5 text-base rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-ink focus:border-brand-ink outline-none min-h-[44px] touch-manipulation"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePodiatristLimit(u.clinicId!)}
                              disabled={clinicLimitSaving === u.clinicId}
                              className="px-3 py-2 text-sm font-medium bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover disabled:opacity-50 min-h-[44px]"
                            >
                              {clinicLimitSaving === u.clinicId ? t.settings.common.ellipsis : t.usersPage.table.saveLimit}
                            </button>
                          </div>
                        ) : (
                          <span className="mobile-card-value">
                            {clinicMap.get(u.clinicId)!.podiatristCount}/
                            {clinicMap.get(u.clinicId)!.podiatristLimit === null ? "∞" : clinicMap.get(u.clinicId)!.podiatristLimit}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t.usersPage.table.data}</span>
                  <span className="mobile-card-value">{t.usersPage.table.dataSummary.replace("{patients}", String(u.patientCount)).replace("{sessions}", String(u.sessionCount))}</span>
                </div>
              </div>
              
              <div className="mobile-card-actions">
                <button
                  onClick={() => { setSelectedUser(u); setShowProfileModal(true); }}
                  className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                >{t.usersPage.actions.view}</button>
                {isSuperAdmin && (
                  <button
                    onClick={() => { setSelectedUser(u); setShowEditModal(true); }}
                    className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                  >{t.usersPage.actions.edit}</button>
                )}
                {/* Estado de cuenta: super_admin gestiona todos; clinic_admin solo recepcionistas de su clínica */}
                {(isSuperAdmin || currentUser?.role === "clinic_admin") && canManageUser(u) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                    {isSuperAdmin && (u.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(u)}
                        className="w-full py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors text-xs font-medium"
                      >{t.usersPage.actions.unban}</button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(u)}
                        className="w-full py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors text-xs font-medium"
                      >{t.usersPage.actions.ban}</button>
                    ))}
                    {u.isBlocked ? (
                      <button
                        onClick={() => handleUnblockUser(u)}
                        className="w-full py-2 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors text-xs font-medium"
                      >{t.usersPage.actions.unblock}</button>
                    ) : (
                      <button
                        onClick={() => handleBlockUser(u)}
                        className="w-full py-2 px-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 active:bg-orange-200 transition-colors text-xs font-medium"
                      >{t.usersPage.actions.block}</button>
                    )}
                    {u.isEnabled === false ? (
                      <button
                        onClick={() => handleEnableUser(u)}
                        className="w-full py-2.5 px-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors text-xs font-semibold border border-green-200"
                      >
                        ✅ {t.usersPage.actions.enableAccount}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDisableUser(u)}
                        className="w-full py-2.5 px-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 active:bg-yellow-200 transition-colors text-xs font-semibold border border-yellow-200"
                      >
                        ⚠️ {t.usersPage.actions.disableAccount}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="w-full py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors text-xs font-medium"
                    >{t.usersPage.actions.delete}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Table Layout */}
        <div className="hidden md:block w-full max-w-full min-w-0 bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full min-w-0">
            <table className="w-full min-w-[720px] table-fixed">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-brand-border bg-brand-canvas">
                  <SortableTh sortKey="name" label={t.usersPage.table.user} />
                  <SortableTh sortKey="email" label={t.usersPage.table.email} />
                  <SortableTh sortKey="role" label={t.usersPage.table.role} />
                  <SortableTh sortKey="status" label={t.usersPage.table.status} />
                  <SortableTh sortKey="clinic" label={t.usersPage.table.clinic} />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider truncate">{t.usersPage.table.limit}</th>
                  <SortableTh sortKey="data" label={t.usersPage.table.data} />
                  <th className="text-right px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wider truncate">{t.usersPage.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-medium text-brand-ink text-sm">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-brand-ink truncate text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted truncate" title={u.email}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === "super_admin" ? "bg-brand-ink text-brand-ink-fg" :
                        u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                        u.role === "admin" ? "bg-orange-100 text-orange-700" :
                        u.role === "receptionist" ? "bg-teal-100 text-teal-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getUserStatusBadge(u)}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted truncate" title={u.clinicId || undefined}>
                      {u.clinicId ? (clinicMap.get(u.clinicId)?.clinicName ?? u.clinicId) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {u.clinicId ? (() => {
                        const info = clinicMap.get(u.clinicId);
                        const isClinicAdminRow = isSuperAdmin && u.role === "clinic_admin";
                        const editVal = clinicLimitEdits[u.clinicId] ?? (info?.podiatristLimit === null ? "" : String(info?.podiatristLimit ?? ""));
                        const hasChange = editVal !== (info?.podiatristLimit === null ? "" : String(info?.podiatristLimit ?? ""));
                        if (info) {
                          const display = `${info.podiatristCount}/${info.podiatristLimit === null ? "∞" : info.podiatristLimit}`;
                          const tierBadge = info.effectivePlanTier ? (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                info.effectivePlanTier === "premium"
                                  ? "bg-brand-ink text-brand-ink-fg"
                                  : "border border-gray-300 text-gray-500"
                              }`}
                              title={t.premium.menuManagePlan}
                            >
                              {info.effectivePlanTier === "premium" ? t.premium.badge : t.premium.baseBadge}
                            </span>
                          ) : null;
                          if (isClinicAdminRow) {
                            return (
                              <div className="flex items-center gap-2">
                                {tierBadge}
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  value={editVal}
                                  onChange={(e) => setClinicLimitEdits((prev) => ({ ...prev, [u.clinicId!]: e.target.value }))}
                                  placeholder="∞"
                                  className="w-16 min-w-[44px] min-h-[44px] px-2 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-ink focus:border-brand-ink outline-none touch-manipulation"
                                  title={t.usersPage.table.currentPodiatrists.replace("{count}", String(info.podiatristCount))}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSavePodiatristLimit(u.clinicId!)}
                                  disabled={!hasChange || clinicLimitSaving === u.clinicId}
                                  className="px-3 py-2 min-h-[44px] text-sm font-medium bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                  title={t.usersPage.table.saveLimit}
                                >
                                  {clinicLimitSaving === u.clinicId ? "..." : "✓"}
                                </button>
                              </div>
                            );
                          }
                          return (
                            <span className="text-xs text-gray-600 inline-flex items-center gap-1.5">
                              {display}
                              {tierBadge}
                            </span>
                          );
                        }
                        return <span className="text-xs text-gray-400" title={t.usersPage.table.clinicMissing}>-</span>;
                      })() : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <span>{u.patientCount} {t.usersPage.table.patients}</span>
                        <span>{u.sessionCount} {t.usersPage.table.sessions}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 flex-shrink-0">
                        {/* View Profile */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowProfileModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-brand-ink dark:hover:text-white hover:bg-gray-100 rounded-lg transition-colors"
                          title={t.usersPage.actions.viewProfile}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {/* Edit */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-brand-ink dark:hover:text-white hover:bg-gray-100 rounded-lg transition-colors"
                            title={t.common.edit}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        
                        {/* Export JSON */}
                        {isSuperAdmin && u.role === "podiatrist" && u.patientCount > 0 && (
                          <button
                            onClick={() => handleExportUserData(u)}
                            className="p-2 text-gray-400 hover:text-brand-ink dark:hover:text-white hover:bg-gray-100 rounded-lg transition-colors"
                            title={t.usersPage.actions.downloadJson}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Account Management Actions - Solo para superadmin y usuarios creados */}
                        {(isSuperAdmin || currentUser?.role === "clinic_admin") && canManageUser(u) && (
                          <div className="inline-block">
                            <button
                              className="p-2 text-gray-400 hover:text-brand-ink dark:hover:text-white hover:bg-gray-100 rounded-lg transition-colors"
                              title={t.usersPage.actions.manageAccount} data-account-menu-trigger
                              onClick={(e) => {
                                e.stopPropagation();
                                const btn = e.currentTarget as HTMLElement;
                                const rect = btn.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const menuHeight = 280;
                                if (spaceBelow < menuHeight) {
                                  setAccountMenuPosition({ bottom: window.innerHeight - rect.top + 4, left: rect.right - 192 });
                                } else {
                                  setAccountMenuPosition({ top: rect.bottom + 4, left: rect.right - 192 });
                                }
                                setOpenAccountMenuId(openAccountMenuId === u.id ? null : u.id);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {usersLoading && (
            <div className="p-12 text-center">
              <svg className="w-6 h-6 text-gray-400 mx-auto mb-3 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <p className="text-gray-500 text-sm">{t.usersPage.loading}</p>
            </div>
          )}

          {!usersLoading && sortedUsers.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">{t.usersPage.empty}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateUser}
        clinics={clinics}
      />

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={fetchUsers}
        clinics={clinics}
        isSuperAdmin={!!isSuperAdmin}
        currentUserClinicId={currentUser?.clinicId}
      />
      
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        clinics={clinics}
        onSave={handleEditUser}
      />
      
      <TransferHistoryModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        allUsers={allUsers}
        clinicalStats={clinicalStats}
        onTransferred={loadClinicalStats}
      />
      
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
      />

      {/* Portal: menú de 3 puntos (evita scrollbar por overflow) */}
      {openAccountMenuId && accountMenuPosition && (() => {
        const u = sortedUsers.find(usr => usr.id === openAccountMenuId);
        if (!u) return null;
        const pos = accountMenuPosition.top !== undefined
          ? { top: accountMenuPosition.top, left: accountMenuPosition.left }
          : { bottom: accountMenuPosition.bottom, left: accountMenuPosition.left };
        const closeMenu = () => { setOpenAccountMenuId(null); setAccountMenuPosition(null); };
        return createPortal(
          <div
            data-account-menu
            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
            style={pos}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {isSuperAdmin && (u.isBanned ? (
                <button onClick={() => { handleUnbanUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-semantic-success hover:bg-semantic-success-bg">{t.usersPage.menu.unbanAccount}</button>
              ) : (
                <button onClick={() => { handleBanUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-semantic-error hover:bg-semantic-error-bg">{t.usersPage.menu.banAccount}</button>
              ))}
              {u.isBlocked ? (
                <button onClick={() => { handleUnblockUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-semantic-success hover:bg-semantic-success-bg">{t.usersPage.menu.unblockAccount}</button>
              ) : (
                <button onClick={() => { handleBlockUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50">{t.usersPage.menu.blockAccount}</button>
              )}
              {u.isEnabled === false ? (
                <button onClick={() => { handleEnableUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-semantic-success hover:bg-semantic-success-bg font-medium">✅ {t.usersPage.actions.enableAccount}</button>
              ) : (
                <button onClick={() => { handleDisableUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 font-medium">⚠️ {t.usersPage.actions.disableAccount}</button>
              )}
              {isSuperAdmin && ((u.role === "clinic_admin" && u.clinicId) || u.role === "podiatrist") && (
                <button
                  onClick={() => { handleResetEditCooldown(u); closeMenu(); }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                >
                  {t.usersPage.menu.authorizeCooldown}
                </button>
              )}
              {isSuperAdmin &&
                ((u.role === "clinic_admin" && u.clinicId) || (u.role === "podiatrist" && !u.clinicId)) && (
                  <button
                    onClick={() => { handleManagePlanTier(u); closeMenu(); }}
                    className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                  >
                    {t.premium.menuManagePlan}
                  </button>
                )}
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { handleDeleteUser(u); closeMenu(); }} className="w-full text-left px-4 py-2 text-sm text-semantic-error hover:bg-semantic-error-bg">{t.usersPage.menu.deleteAccount}</button>
            </div>
          </div>,
          document.body
        );
      })()}
    </MainLayout>
  );
};

export default UsersPage;
