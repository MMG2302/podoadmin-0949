import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { api } from "../lib/api-client";
import { fetchAllClinicalPages } from "../lib/clinical-list-fetch";
import { useAuth } from "../contexts/auth-context";
import type { Patient } from "../types/clinical";
import {
  applyWhatsAppWebTemplate,
  buildWaMeUrl,
  DEFAULT_WHATSAPP_WEB_TEMPLATE,
  formatDisplayDate,
  getTomorrowLocalDateString,
  loadWhatsAppWebTemplate,
  normalizePhoneForWaMe,
  saveWhatsAppWebTemplate,
} from "../lib/whatsapp-web-link";
import { useTenantCountry } from "../hooks/use-tenant-country";

type WhatsAppMessageRow = {
  id: string;
  appointmentId?: string | null;
  patientId?: string | null;
  patientPhone?: string | null;
  patientName?: string | null;
  messageType: string;
  direction: string;
  status: "pending" | "sent" | "failed" | "delivered" | "read";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  extraNote?: string | null;
  createdAt: string;
};

type AppointmentRow = {
  id: string;
  patientId?: string | null;
  date: string;
  time: string;
  notes?: string;
  status?: string;
  pendingPatientName?: string;
  pendingPatientPhone?: string;
};

type WhatsAppConfigPublic = {
  configured: boolean;
  enabled: boolean;
  remindersEnabled: boolean;
  status: string;
  lastError: string | null;
  updatedAt: string | null;
  templateName: string | null;
  templateLanguage: string;
  businessPhoneE164: string | null;
  defaultExtraNote: string | null;
};

type TomorrowRow = {
  id: string;
  patientName: string;
  phone: string | null;
  waPhone: string | null;
  time: string;
  dateLabel: string;
};

export default function WhatsAppMessagesPage() {
  const { user } = useAuth();
  const tenantCountry = useTenantCountry(user);
  const [messages, setMessages] = useState<WhatsAppMessageRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfigPublic | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [webTemplate, setWebTemplate] = useState(DEFAULT_WHATSAPP_WEB_TEMPLATE);
  const [webExtraNote, setWebExtraNote] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showApiSection, setShowApiSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canUse = user?.role === "podiatrist" || user?.role === "clinic_admin";
  const tomorrowIso = useMemo(() => getTomorrowLocalDateString(), []);
  const tomorrowLabel = useMemo(() => formatDisplayDate(tomorrowIso), [tomorrowIso]);

  const apiConnected =
    Boolean(whatsAppConfig?.configured && whatsAppConfig?.enabled && whatsAppConfig?.templateName);

  useEffect(() => {
    if (!user?.id) return;
    setWebTemplate(loadWhatsAppWebTemplate(user.id));
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [mRes, appointmentsList, patientsList, wRes] = await Promise.all([
      api.get<{ success?: boolean; messages?: WhatsAppMessageRow[] }>("/whatsapp-messages?limit=200"),
      fetchAllClinicalPages<AppointmentRow>("/appointments", "appointments", () => "Error citas"),
      fetchAllClinicalPages<Patient>("/patients", "patients", () => "Error pacientes"),
      api.get<{ success?: boolean; config?: WhatsAppConfigPublic }>("/integrations/whatsapp/me"),
    ]);
    if (mRes.success && Array.isArray(mRes.data?.messages)) {
      setMessages(mRes.data.messages);
    }
    setAppointments(appointmentsList.filter((a) => a.status !== "cancelled"));
    setPatients(patientsList);
    if (wRes.success && wRes.data?.config) {
      setWhatsAppConfig(wRes.data.config);
      setShowApiSection(Boolean(wRes.data.config.configured && wRes.data.config.enabled));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!canUse) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse]);

  const patientById = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const resolveAppointmentContact = (a: AppointmentRow) => {
    let patientName = a.pendingPatientName?.trim() || "Paciente";
    let phone = a.pendingPatientPhone?.trim() || null;
    if (a.patientId) {
      const p = patientById.get(a.patientId);
      if (p) {
        patientName = `${p.firstName} ${p.lastName}`.trim() || patientName;
        phone = p.phone?.trim() || phone;
      }
    }
    return { patientName, phone, waPhone: normalizePhoneForWaMe(phone, tenantCountry) };
  };

  const tomorrowAppointments = useMemo((): TomorrowRow[] => {
    return appointments
      .filter((a) => a.date === tomorrowIso && a.status !== "cancelled" && a.status !== "completed")
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((a) => {
        const { patientName, phone, waPhone } = resolveAppointmentContact(a);
        return {
          id: a.id,
          patientName,
          phone,
          waPhone,
          time: a.time,
          dateLabel: tomorrowLabel,
        };
      });
  }, [appointments, tomorrowIso, tomorrowLabel, patientById, tenantCountry]);

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter((a) => {
        const dt = new Date(a.date);
        return dt >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 50);
  }, [appointments]);

  const buildWebMessage = (row: TomorrowRow) => {
    const note =
      webExtraNote.trim() ||
      whatsAppConfig?.defaultExtraNote?.trim() ||
      "Por favor confirme su asistencia respondiendo a este mensaje.";
    return applyWhatsAppWebTemplate(webTemplate, {
      nombre: row.patientName,
      fecha: row.dateLabel,
      hora: row.time,
      nota: note,
    });
  };

  const openWhatsAppForRow = (row: TomorrowRow) => {
    if (!row.waPhone) {
      setError(`No hay teléfono válido para ${row.patientName}.`);
      return;
    }
    setError(null);
    const url = buildWaMeUrl(row.waPhone, buildWebMessage(row));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const saveWebTemplate = () => {
    if (!user?.id) return;
    saveWhatsAppWebTemplate(user.id, webTemplate.trim() || DEFAULT_WHATSAPP_WEB_TEMPLATE);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  const handleSendReminder = async () => {
    if (!selectedAppointmentId) {
      setError("Selecciona una cita primero.");
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    const res = await api.post<{ success?: boolean; message?: string }>("/whatsapp-messages/send-reminder", {
      appointmentId: selectedAppointmentId,
      extraNote: extraNote.trim() || null,
    });
    setSending(false);
    if (!res.success) {
      setError(res.error || (res.data as { message?: string })?.message || "No se pudo enviar el recordatorio.");
      return;
    }
    setSuccess("Recordatorio enviado correctamente.");
    setSelectedAppointmentId("");
    setExtraNote("");
    await loadData();
    setTimeout(() => setSuccess(null), 4000);
  };

  const statusClass = (status: string) => {
    if (status === "sent" || status === "delivered" || status === "read") return "bg-green-100 text-green-700";
    if (status === "failed") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  if (!canUse) {
    return (
      <MainLayout title="Mensajes WhatsApp">
        <div className="max-w-2xl p-6 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10">
          <p className="text-sm text-red-600">No tienes permisos para ver esta sección.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Mensajes WhatsApp">
      <div className="max-w-5xl space-y-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
                Recordatorios por WhatsApp Web
              </h3>
              <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 mt-1 max-w-2xl">
                Sin configurar la API de Meta. Abre WhatsApp Web o la app con el mensaje ya escrito para cada
                paciente. Tú envías el mensaje manualmente desde tu número.
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

          <div className="space-y-3 mb-5">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              Mensaje predeterminado
            </label>
            <textarea
              value={webTemplate}
              onChange={(e) => setWebTemplate(e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border border-emerald-200 dark:border-emerald-900/60 rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Variables:{" "}
              <code className="text-xs">{"{{nombre}}"}</code>,{" "}
              <code className="text-xs">{"{{fecha}}"}</code>,{" "}
              <code className="text-xs">{"{{hora}}"}</code>,{" "}
              <code className="text-xs">{"{{nota}}"}</code>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={webExtraNote}
                onChange={(e) => setWebExtraNote(e.target.value.slice(0, 500))}
                placeholder="Nota extra para todos los envíos de hoy (opcional)"
                className="flex-1 px-4 py-2.5 border border-emerald-200 dark:border-emerald-900/60 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
              <button
                type="button"
                onClick={saveWebTemplate}
                className="px-4 py-2.5 border border-emerald-300 dark:border-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
              >
                {templateSaved ? "Guardado" : "Guardar mensaje"}
              </button>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-2">
            Citas de mañana ({tomorrowLabel})
          </h4>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando citas…</p>
          ) : tomorrowAppointments.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-900/40 rounded-lg p-4">
              No hay citas programadas para mañana.
            </p>
          ) : (
            <ul className="divide-y divide-emerald-100 dark:divide-emerald-900/40 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-900/40 overflow-hidden">
              {tomorrowAppointments.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#1a1a1a] dark:text-white">{row.patientName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {row.time}
                      {row.phone ? ` · ${row.phone}` : " · Sin teléfono"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsAppForRow(row)}
                    disabled={!row.waPhone}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  >
                    <span aria-hidden>💬</span>
                    Enviar por WhatsApp
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <button
            type="button"
            onClick={() => setShowApiSection((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
                Envío automático con API Meta {apiConnected ? "(conectado)" : "(opcional)"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Solo si configuraste WhatsApp Business en Ajustes. Puedes ignorar esta sección.
              </p>
            </div>
            <span className="text-gray-400 text-sm ml-4">{showApiSection ? "▲" : "▼"}</span>
          </button>

          {showApiSection && (
            <div className="mt-5 space-y-6 border-t border-gray-100 dark:border-gray-800 pt-5">
              {!whatsAppConfig ? (
                <p className="text-sm text-gray-500">No se pudo obtener el estado de WhatsApp.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">Conectado</p>
                    <p className="font-semibold">{whatsAppConfig.configured && whatsAppConfig.enabled ? "Sí" : "No"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">Estado API</p>
                    <p className="font-semibold">{whatsAppConfig.status || "pending"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">Plantilla</p>
                    <p className="font-semibold">{whatsAppConfig.templateName || "No definida"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">Último error</p>
                    <p className="font-semibold truncate">{whatsAppConfig.lastError || "Sin errores"}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-[#1a1a1a] dark:text-white mb-1">Enviar recordatorio automático</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Requiere API Meta configurada en Ajustes → WhatsApp.
                </p>

                {error && <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                {success && <div className="mb-3 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                    >
                      <option value="">Selecciona una cita próxima</option>
                      {upcomingAppointments.map((a) => {
                        const { patientName } = resolveAppointmentContact(a);
                        return (
                          <option key={a.id} value={a.id}>
                            {a.date} {a.time} · {patientName}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      onClick={handleSendReminder}
                      disabled={sending || !selectedAppointmentId || !apiConnected}
                      className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium disabled:opacity-50 md:self-start"
                    >
                      {sending ? "Enviando..." : "Enviar por API"}
                    </button>
                  </div>
                  <textarea
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value.slice(0, 500))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                    placeholder="Nota extra para este envío (opcional)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">Historial (API automática)</h3>
            <button
              onClick={loadData}
              className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando historial...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-500">
              Sin envíos por API. Los recordatorios por WhatsApp Web no quedan registrados aquí.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Paciente</th>
                    <th className="py-2 pr-4">Teléfono</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 dark:border-gray-900">
                      <td className="py-2 pr-4">{new Date(m.createdAt).toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4">{m.patientName || "—"}</td>
                      <td className="py-2 pr-4">{m.patientPhone || "—"}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 max-w-[200px] truncate">{m.extraNote || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
