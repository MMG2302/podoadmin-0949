import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { usePermissions } from "../hooks/use-permissions";
import { api } from "../lib/api-client";

interface Campaign {
  id: string;
  name: string;
  messageBody: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

const WhatsAppCampaignsPage = () => {
  const { canViewWhatsAppMessages } = usePermissions();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [filterClinicOnly, setFilterClinicOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ success?: boolean; campaigns?: Campaign[] }>("/whatsapp-campaigns");
    if (res.success && res.data?.campaigns) setCampaigns(res.data.campaigns);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (canViewWhatsAppMessages) load();
  }, [canViewWhatsAppMessages, load]);

  if (!canViewWhatsAppMessages) {
    return (
      <MainLayout title="Campañas WhatsApp">
        <p className="text-gray-500 dark:text-gray-400">Sin permiso para campañas WhatsApp.</p>
      </MainLayout>
    );
  }

  const createCampaign = async () => {
    if (!name.trim() || !messageBody.trim()) return;
    const filterJson = JSON.stringify({
      hasPhone: true,
      clinicOnly: filterClinicOnly,
    });
    const res = await api.post<{ success?: boolean; id?: string }>("/whatsapp-campaigns", {
      name: name.trim(),
      messageBody: messageBody.trim(),
      filterJson,
    });
    if (res.success) {
      setName("");
      setMessageBody("");
      setFeedback("Campaña creada en borrador");
      load();
    } else {
      setFeedback(res.error || "Error al crear");
    }
  };

  const sendCampaign = async (id: string) => {
    if (!confirm("¿Enviar esta campaña por WhatsApp a todos los pacientes con teléfono?")) return;
    setSendingId(id);
    const res = await api.post<{ success?: boolean; sent?: number; failed?: number }>(
      `/whatsapp-campaigns/${id}/send`
    );
    setSendingId(null);
    if (res.success && res.data) {
      setFeedback(`Enviados: ${res.data.sent ?? 0}, fallidos: ${res.data.failed ?? 0}`);
      load();
    } else {
      setFeedback(res.error || "Error al enviar");
    }
  };

  return (
    <MainLayout title="Campañas WhatsApp">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Mensajes masivos solo a pacientes con número de teléfono registrado. Requiere WhatsApp configurado en ajustes.
      </p>

      {feedback && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 rounded-lg text-sm border border-blue-100 dark:border-blue-900/60">
          {feedback}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 mb-6 space-y-3">
        <h3 className="font-semibold text-[#1a1a1a] dark:text-white">Nueva campaña</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre interno"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <textarea
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          placeholder="Texto del mensaje (parámetro de plantilla)"
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-sm text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={filterClinicOnly}
            onChange={(e) => setFilterClinicOnly(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-950"
          />
          Solo pacientes de mi clínica
        </label>
        <button
          type="button"
          onClick={createCampaign}
          className="px-4 py-2 bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          Guardar borrador
        </button>
      </div>

      <h3 className="font-semibold mb-3 text-[#1a1a1a] dark:text-white">Campañas</h3>
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando…</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          {campaigns.map((c) => (
            <li key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[#1a1a1a] dark:text-white">{c.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{c.messageBody}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {c.status}
                  {c.sentAt ? ` · enviada ${new Date(c.sentAt).toLocaleString("es-ES")}` : ""}
                </p>
              </div>
              {c.status === "draft" && (
                <button
                  type="button"
                  disabled={sendingId === c.id}
                  onClick={() => sendCampaign(c.id)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {sendingId === c.id ? "Enviando…" : "Enviar"}
                </button>
              )}
            </li>
          ))}
          {campaigns.length === 0 && (
            <li className="p-4 text-sm text-gray-400 dark:text-gray-500">No hay campañas</li>
          )}
        </ul>
      )}
    </MainLayout>
  );
};

export default WhatsAppCampaignsPage;
