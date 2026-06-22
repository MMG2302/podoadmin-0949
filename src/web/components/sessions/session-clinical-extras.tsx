import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api-client";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function SessionChecklistPanel({ sessionId }: { sessionId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<{ items?: ChecklistItem[] }>(
      `/clinical/sessions/${sessionId}/checklist`
    );
    if (res.success && res.data?.items) setItems(res.data.items);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (id: string) => {
    const next = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    setItems(next);
    setSaving(true);
    await api.put(`/clinical/sessions/${sessionId}/checklist`, { items: next });
    setSaving(false);
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-gray-100 mb-2">Protocolo / checklist</h4>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.done}
              disabled={saving}
              onChange={() => toggle(item.id)}
              className="rounded"
            />
            <span className={item.done ? "line-through text-gray-400" : ""}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SessionPatientSignature({
  sessionId,
  patientId,
  consentVersion,
}: {
  sessionId: string;
  patientId: string;
  consentVersion: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{
      success?: boolean;
      signature?: { signatureData: string; signedAt: string } | null;
    }>(`/compliance/consent-signatures/session/${sessionId}`);
    if (res.success && res.data?.signature?.signatureData) {
      setSavedImage(res.data.signature.signatureData);
      setSavedAt(res.data.signature.signedAt);
      setSaved(true);
    } else {
      setSavedImage(null);
      setSavedAt(null);
      setSaved(false);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [savedImage]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setDrawing(true);
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = getPoint(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSaved(false);
    setSavedImage(null);
    setSavedAt(null);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL("image/png");
    const res = await api.post("/compliance/consent-signatures", {
      patientId,
      sessionId,
      consentVersion,
      signatureData,
      deviceInfo: navigator.userAgent.slice(0, 200),
    });
    if (res.success) await loadExisting();
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-1">Firma del paciente</h4>
      <p className="text-xs text-gray-500 mb-2">
        Se guarda en el expediente (tabla de consentimientos, vinculada a esta sesión).
      </p>
      {loading ? (
        <p className="text-xs text-gray-400">Cargando firma…</p>
      ) : savedImage ? (
        <div className="space-y-2">
          <img
            src={savedImage}
            alt="Firma del paciente"
            className="max-w-md border border-gray-200 rounded-lg bg-white p-2"
          />
          {savedAt && (
            <p className="text-xs text-gray-500">
              Guardada: {new Date(savedAt).toLocaleString("es-ES")}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Dibuje de nuevo abajo para reemplazar la firma.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-2">Aún no hay firma para esta sesión.</p>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="border border-gray-200 rounded-lg w-full max-w-md touch-none bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex gap-2 mt-2">
        <button type="button" className="text-xs underline" onClick={clear}>
          Borrar
        </button>
        <button
          type="button"
          onClick={save}
          className="px-3 py-1 bg-[#1a1a1a] text-white rounded text-xs"
        >
          Guardar firma
        </button>
        {saved && <span className="text-xs text-green-700">Guardada</span>}
      </div>
    </div>
  );
}

export function PatientEvolutionReportButton({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false);

  const openReport = async () => {
    setLoading(true);
    const res = await api.get<{ html?: string }>(
      `/clinical/patients/${patientId}/evolution-report`
    );
    setLoading(false);
    if (res.success && res.data?.html) {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(res.data.html);
        w.document.close();
      }
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={openReport}
      className="text-sm text-blue-600 underline disabled:opacity-50"
    >
      {loading ? "Generando…" : "Informe de evolución (PDF / imprimir)"}
    </button>
  );
}
