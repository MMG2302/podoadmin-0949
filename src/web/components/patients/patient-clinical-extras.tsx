import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api-client";
import {
  semanticAlertErrorClass,
  semanticAlertWarningClass,
} from "../../lib/form-field-classes";
import type { Patient, ClinicalAlert } from "../../types/clinical";
import { useLanguage } from "../../contexts/language-context";

export function PatientClinicalAlertsSection({
  patient,
  onUpdated,
}: {
  patient: Patient;
  onUpdated: (alerts: ClinicalAlert[]) => void;
}) {
  const { t } = useLanguage();
  const pc = t.patientsClinical;
  const [alerts, setAlerts] = useState<ClinicalAlert[]>(patient.clinicalAlerts ?? []);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("allergy");
  const [severity, setSeverity] = useState<ClinicalAlert["severity"]>("high");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAlerts(patient.clinicalAlerts ?? []);
  }, [patient.id, patient.clinicalAlerts]);

  const save = async (next: ClinicalAlert[]) => {
    setSaving(true);
    const res = await api.patch<{ success?: boolean }>(
      `/clinical/patients/${patient.id}/alerts`,
      { alerts: next }
    );
    setSaving(false);
    if (res.success) {
      setAlerts(next);
      onUpdated(next);
      void api.post("/compliance/record-access", {
        patientId: patient.id,
        action: "view",
      });
    }
  };

  const addAlert = () => {
    if (!msg.trim()) return;
    const next = [...alerts, { type, message: msg.trim(), severity }];
    setMsg("");
    void save(next);
  };

  const removeAlert = (index: number) => {
    const next = alerts.filter((_, i) => i !== index);
    void save(next);
  };

  const alertItemClass = (severity: ClinicalAlert["severity"]) => {
    const base = "text-sm flex justify-between gap-2";
    if (severity === "high") return `${semanticAlertErrorClass} ${base} !py-2`;
    if (severity === "medium") return `${semanticAlertWarningClass} ${base} !py-2`;
    return `${base} px-3 py-2 rounded-lg bg-brand-canvas text-brand-muted border border-brand-border`;
  };

  const typeLabel = (alertType: string) => {
    switch (alertType) {
      case "allergy":
        return pc.alertTypeAllergy;
      case "diabetes":
        return pc.alertTypeDiabetes;
      case "anticoagulant":
        return pc.alertTypeAnticoagulant;
      case "other":
        return pc.alertTypeOther;
      default:
        return alertType;
    }
  };

  return (
    <div>
      <h4 className="font-medium text-brand-ink mb-3">{pc.alertsTitle}</h4>
      <ul className="space-y-2 mb-3">
        {alerts.map((a, i) => (
          <li key={`${a.type}-${i}`} className={alertItemClass(a.severity)}>
            <span>
              <strong>{typeLabel(a.type)}:</strong> {a.message}
            </span>
            <button type="button" className="text-xs underline" onClick={() => removeAlert(i)}>
              {pc.removeAlert}
            </button>
          </li>
        ))}
        {alerts.length === 0 && (
          <li className="text-sm text-gray-400">{pc.noAlerts}</li>
        )}
      </ul>
      <div className="flex flex-wrap gap-2 items-end">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-sm border rounded px-2 py-1.5"
        >
          <option value="allergy">{pc.alertTypeAllergy}</option>
          <option value="diabetes">{pc.alertTypeDiabetes}</option>
          <option value="anticoagulant">{pc.alertTypeAnticoagulant}</option>
          <option value="other">{pc.alertTypeOther}</option>
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as ClinicalAlert["severity"])}
          className="text-sm border rounded px-2 py-1.5"
        >
          <option value="high">{pc.severityHigh}</option>
          <option value="medium">{pc.severityMedium}</option>
          <option value="low">{pc.severityLow}</option>
        </select>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={pc.alertDescPlaceholder}
          className="flex-1 min-w-[120px] text-sm border rounded px-2 py-1.5"
        />
        <button
          type="button"
          disabled={saving}
          onClick={addAlert}
          className="px-3 py-1.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm disabled:opacity-50"
        >
          {pc.addAlert}
        </button>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PatientLabAttachmentsSection({ patientId }: { patientId: string }) {
  const { t } = useLanguage();
  const pc = t.patientsClinical;
  const [items, setItems] = useState<
    Array<{ id: string; title: string; mimeType: string; createdAt: string; downloadPath: string }>
  >([]);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await api.get<{
      success?: boolean;
      attachments?: Array<{
        id: string;
        title: string;
        mimeType: string;
        createdAt: string;
        downloadPath: string;
      }>;
    }>(`/lab-attachments?patientId=${encodeURIComponent(patientId)}`);
    if (res.success && res.data?.attachments) setItems(res.data.attachments);
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const upload = async (file: File) => {
    if (!title.trim()) {
      alert(pc.labsTitleRequired);
      return;
    }
    setUploading(true);
    const fileBase64 = await readFileAsDataUrl(file);
    const res = await api.post<{ success?: boolean }>("/lab-attachments/upload", {
      patientId,
      title: title.trim(),
      mimeType: file.type || "application/pdf",
      fileBase64,
    });
    setUploading(false);
    if (res.success) {
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } else {
      alert(res.message || res.error || pc.uploadError);
    }
  };

  return (
    <div className="mt-6">
      <h4 className="font-medium text-brand-ink mb-3">{pc.labsTitle}</h4>
      <p className="text-xs text-gray-500 mb-2">{pc.labsHint}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={pc.labsTitlePlaceholder}
          className="text-sm border rounded px-2 py-1.5 flex-1 min-w-[140px]"
        />
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="text-sm"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </div>
      {uploading && <p className="text-xs text-gray-500 mb-2">{pc.uploading}</p>}
      <ul className="space-y-1 text-sm">
        {items.map((a) => (
          <li key={a.id} className="flex justify-between border-b py-1">
            <span>{a.title}</span>
            <a href={a.downloadPath} className="text-blue-600 underline text-xs" target="_blank" rel="noreferrer">
              {t.common.download}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
