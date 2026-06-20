import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { usePermissions } from "../hooks/use-permissions";
import { useAuth } from "../contexts/auth-context";
import { api } from "../lib/api-client";
import type { Patient } from "../types/clinical";
import {
  applyCampaignWebMessage,
  buildWaMeUrl,
  filterCampaignWebRecipients,
  parseCampaignFilterJson,
  type CampaignWebRecipient,
} from "../lib/whatsapp-web-link";

interface Campaign {
  id: string;
  name: string;
  messageBody: string;
  filterJson: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

const WhatsAppCampaignsPage = () => {
  const { canViewWhatsAppMessages } = usePermissions();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [filterClinicOnly, setFilterClinicOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedWebId, setExpandedWebId] = useState<string | null>(null);
  const [webAssistant, setWebAssistant] = useState<{ campaignId: string; index: number } | null>(null);
  const [showApiSection, setShowApiSection] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      api.get<{ success?: boolean; campaigns?: Campaign[] }>("/whatsapp-campaigns"),
      api.get<{ success?: boolean; patients?: Patient[] }>("/patients"),
    ]);
    if (cRes.success && cRes.data?.campaigns) setCampaigns(cRes.data.campaigns);
    if (pRes.success && Array.isArray(pRes.data?.patients)) setPatients(pRes.data.patients);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (canViewWhatsAppMessages) load();
  }, [canViewWhatsAppMessages, load]);

  const previewRecipients = useMemo(
    () =>
      filterCampaignWebRecipients(patients, {
        clinicOnly: filterClinicOnly,
        userClinicId: user?.clinicId,
      }),
    [patients, filterClinicOnly, user?.clinicId]
  );

  const recipientsForCampaign = useCallback(
    (campaign: Campaign): CampaignWebRecipient[] => {
      const { clinicOnly } = parseCampaignFilterJson(campaign.filterJson);
      return filterCampaignWebRecipients(patients, {
        clinicOnly,
        userClinicId: user?.clinicId,
      });
    },
    [patients, user?.clinicId]
  );

  const openWaMe = (campaign: Campaign, recipient: CampaignWebRecipient) => {
    const text = applyCampaignWebMessage(campaign.messageBody, recipient);
    window.open(buildWaMeUrl(recipient.waPhone, text), "_blank", "noopener,noreferrer");
  };

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

  const sendCampaignApi = async (id: string) => {
    if (!confirm("¿Enviar esta campaña por API Meta a todos los pacientes con teléfono?")) return;
    setSendingId(id);
    const res = await api.post<{ success?: boolean; sent?: number; failed?: number }>(
      `/whatsapp-campaigns/${id}/send`
    );
    setSendingId(null);
    if (res.success && res.data) {
      setFeedback(`API: enviados ${res.data.sent ?? 0}, fallidos ${res.data.failed ?? 0}`);
      load();
    } else {
      setFeedback(res.error || "Error al enviar por API");
    }
  };

  const activeAssistantCampaign = webAssistant
    ? campaigns.find((c) => c.id === webAssistant.campaignId)
    : null;
  const assistantRecipients = activeAssistantCampaign
    ? recipientsForCampaign(activeAssistantCampaign)
    : [];
  const assistantCurrent =
    webAssistant && assistantRecipients.length > 0
      ? assistantRecipients[Math.min(webAssistant.index, assistantRecipients.length - 1)]
      : null;

  return (
    <MainLayout title="Campañas WhatsApp">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Difunde mensajes a pacientes con teléfono. Puedes usar WhatsApp Web (manual, sin API) o el envío
        automático por API Meta si lo tienes configurado.
      </p>

      {feedback && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 rounded-lg text-sm border border-blue-100 dark:border-blue-900/60">
          {feedback}
        </div>
      )}

      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-6 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#1a1a1a] dark:text-white">Campañas por WhatsApp Web</h3>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 mt-1 max-w-2xl">
              Crea el borrador del mensaje y envíalo paciente a paciente con{" "}
              <code className="text-xs">wa.me</code>. Sin configurar Meta: tú pulsas Enviar en WhatsApp.
            </p>
          </div>
          <a
            href="https://web.whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:opacity-90"
          >
            Abrir WhatsApp Web
          </a>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/50 rounded-lg border border-emerald-100 dark:border-emerald-900/40 p-4 space-y-3">
          <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">Nueva campaña (borrador)</h4>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre interno (ej. Promo verano)"
            className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-900/60 rounded-lg bg-white dark:bg-gray-950 text-[#1a1a1a] dark:text-white"
          />
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder={`Mensaje con variables, ej:\nHola {{nombre}}, le informamos que...`}
            rows={5}
            className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-900/60 rounded-lg bg-white dark:bg-gray-950 text-sm text-[#1a1a1a] dark:text-white"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Variables: <code>{"{{nombre}}"}</code>, <code>{"{{apellido}}"}</code>,{" "}
            <code>{"{{nombre_completo}}"}</code>
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={filterClinicOnly}
              onChange={(e) => setFilterClinicOnly(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Solo pacientes de mi clínica
          </label>
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            Destinatarios con teléfono válido: <strong>{previewRecipients.length}</strong>
            {previewRecipients.length === 0 && patients.length > 0 && (
              <span className="block text-xs text-amber-700 dark:text-amber-300 mt-1">
                Hay {patients.length} paciente(s) en tu listado; revisa que tengan teléfono con al menos 8
                dígitos o desmarca «Solo pacientes de mi clínica».
              </span>
            )}
            {patients.length === 0 && !loading && (
              <span className="block text-xs text-amber-700 dark:text-amber-300 mt-1">
                No se cargaron pacientes. Comprueba permisos o recarga la página.
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={createCampaign}
            disabled={!name.trim() || !messageBody.trim()}
            className="px-4 py-2 bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Guardar borrador
          </button>
        </div>

        {webAssistant && activeAssistantCampaign && assistantCurrent && (
          <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">
              Asistente de envío — {activeAssistantCampaign.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Paciente {webAssistant.index + 1} de {assistantRecipients.length}:{" "}
              <strong>
                {assistantCurrent.firstName} {assistantCurrent.lastName}
              </strong>{" "}
              · {assistantCurrent.phone}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap border border-gray-100 dark:border-gray-800 rounded p-2 max-h-32 overflow-y-auto">
              {applyCampaignWebMessage(activeAssistantCampaign.messageBody, assistantCurrent)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openWaMe(activeAssistantCampaign, assistantCurrent)}
                className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium"
              >
                Abrir WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = webAssistant.index + 1;
                  if (next >= assistantRecipients.length) {
                    setWebAssistant(null);
                    setFeedback(`Asistente completado: ${assistantRecipients.length} pacientes.`);
                  } else {
                    setWebAssistant({ campaignId: webAssistant.campaignId, index: next });
                  }
                }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {webAssistant.index + 1 >= assistantRecipients.length ? "Finalizar" : "Siguiente paciente"}
              </button>
              <button
                type="button"
                onClick={() => setWebAssistant(null)}
                className="px-4 py-2 text-sm text-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-2">Borradores para enviar</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando…</p>
          ) : (
            <ul className="divide-y divide-emerald-100 dark:divide-emerald-900/40 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-900/40 overflow-hidden">
              {campaigns
                .filter((c) => c.status === "draft")
                .map((c) => {
                  const recipients = recipientsForCampaign(c);
                  const expanded = expandedWebId === c.id;
                  return (
                    <li key={c.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#1a1a1a] dark:text-white">{c.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{c.messageBody}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {recipients.length} destinatario(s) con WhatsApp
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={recipients.length === 0}
                            onClick={() => setWebAssistant({ campaignId: c.id, index: 0 })}
                            className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-sm disabled:opacity-40"
                          >
                            Asistente de envío
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedWebId(expanded ? null : c.id)}
                            className="px-3 py-1.5 border border-emerald-300 dark:border-emerald-800 rounded-lg text-sm"
                          >
                            {expanded ? "Ocultar lista" : "Ver lista"}
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <ul className="mt-4 max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg">
                          {recipients.length === 0 ? (
                            <li className="p-3 text-sm text-gray-500">Sin destinatarios válidos.</li>
                          ) : (
                            recipients.map((r) => (
                              <li
                                key={r.id}
                                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                              >
                                <span>
                                  {r.firstName} {r.lastName} · {r.phone}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openWaMe(c, r)}
                                  className="px-3 py-1 bg-[#25D366] text-white rounded text-xs font-medium"
                                >
                                  WhatsApp
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </li>
                  );
                })}
              {campaigns.filter((c) => c.status === "draft").length === 0 && (
                <li className="p-4 text-sm text-gray-500">No hay borradores. Crea una campaña arriba.</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
        <button
          type="button"
          onClick={() => setShowApiSection((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-semibold text-[#1a1a1a] dark:text-white">
              Envío automático por API Meta (opcional)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Requiere WhatsApp Business configurado en Ajustes. Puedes ignorar esta sección.
            </p>
          </div>
          <span className="text-gray-400 text-sm ml-4">{showApiSection ? "▲" : "▼"}</span>
        </button>

        {showApiSection && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="font-semibold mb-3 text-[#1a1a1a] dark:text-white">Todas las campañas</h4>
            {loading ? (
              <p className="text-gray-500 text-sm">Cargando…</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {campaigns.map((c) => (
                  <li key={c.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#1a1a1a] dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {c.status}
                        {c.sentAt ? ` · enviada ${new Date(c.sentAt).toLocaleString("es-ES")}` : ""}
                      </p>
                    </div>
                    {c.status === "draft" && (
                      <button
                        type="button"
                        disabled={sendingId === c.id}
                        onClick={() => sendCampaignApi(c.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {sendingId === c.id ? "Enviando…" : "Enviar por API"}
                      </button>
                    )}
                  </li>
                ))}
                {campaigns.length === 0 && (
                  <li className="py-4 text-sm text-gray-400">No hay campañas</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WhatsAppCampaignsPage;
