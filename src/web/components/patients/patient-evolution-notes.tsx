import { useEffect, useState } from "react";
import { api } from "../../lib/api-client";
import { useAuth } from "../../contexts/auth-context";
import type { Patient } from "../../types/clinical";

type EvolutionNote = {
  id: string;
  entryDate: string;
  note: string;
  professionalName: string;
  professionalLicense?: string | null;
};

export function PatientEvolutionNotesSection({ patient }: { patient: Patient }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<EvolutionNote[]>([]);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get<{ success?: boolean; notes?: EvolutionNote[] }>(
      `/clinical/patients/${patient.id}/evolution-notes`
    );
    if (res.success && res.data?.notes) setNotes(res.data.notes);
  };

  useEffect(() => {
    void load();
  }, [patient.id]);

  const addNote = async () => {
    if (!note.trim() || !user?.name) return;
    setSaving(true);
    const res = await api.post(`/clinical/patients/${patient.id}/evolution-notes`, {
      entryDate,
      note: note.trim(),
      professionalName: user.name,
    });
    setSaving(false);
    if (res.success) {
      setNote("");
      void load();
    }
  };

  const printReport = async () => {
    const res = await api.get<{ success?: boolean; html?: string }>(
      `/clinical/patients/${patient.id}/evolution-report`
    );
    if (!res.success || !res.data?.html) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(res.data.html);
    w.document.close();
    void api.post("/compliance/record-access", { patientId: patient.id, action: "print" });
  };

  return (
    <div className="mt-6 border-t border-brand-border pt-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="font-medium text-brand-ink">Notas de evolución (NOM-004)</h4>
        <button
          type="button"
          onClick={() => void printReport()}
          className="text-xs underline text-brand-ink"
        >
          Imprimir informe
        </button>
      </div>
      <ul className="space-y-2 mb-3 text-sm">
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg bg-brand-canvas p-3">
            <div className="text-xs text-brand-muted mb-1">
              {n.entryDate} · {n.professionalName}
              {n.professionalLicense ? ` · ${n.professionalLicense}` : ""}
            </div>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{n.note}</p>
          </li>
        ))}
        {notes.length === 0 && <li className="text-gray-400 text-sm">Sin notas de evolución</li>}
      </ul>
      <div className="space-y-2">
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-sm text-brand-ink"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Nota de evolución clínica..."
          className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-sm text-brand-ink"
        />
        <button
          type="button"
          disabled={saving || !note.trim()}
          onClick={() => void addNote()}
          className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Añadir nota"}
        </button>
      </div>
    </div>
  );
}
