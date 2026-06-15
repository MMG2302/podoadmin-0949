import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { api } from "../lib/api-client";
import { useAuth } from "../contexts/auth-context";

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

export default function WhatsAppMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WhatsAppMessageRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfigPublic | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canUse = user?.role === "podiatrist" || user?.role === "clinic_admin";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [mRes, aRes, wRes] = await Promise.all([
      api.get<{ success?: boolean; messages?: WhatsAppMessageRow[] }>("/whatsapp-messages?limit=200"),
      api.get<{ success?: boolean; appointments?: AppointmentRow[] }>("/appointments"),
      api.get<{ success?: boolean; config?: WhatsAppConfigPublic }>("/integrations/whatsapp/me"),
    ]);
    if (mRes.success && Array.isArray(mRes.data?.messages)) {
      setMessages(mRes.data.messages);
    } else {
      setError(mRes.error || "No se pudo cargar el historial de WhatsApp.");
    }
    if (aRes.success && Array.isArray(aRes.data?.appointments)) {
      setAppointments(aRes.data.appointments.filter((a) => a.status !== "cancelled"));
    }
    if (wRes.success && wRes.data?.config) {
      setWhatsAppConfig(wRes.data.config);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!canUse) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse]);

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
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-3">Estado de conexión</h3>
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
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-1">Enviar recordatorio manual</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Selecciona una cita y envía un recordatorio por WhatsApp con la plantilla configurada.
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
                {upcomingAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.date} {a.time} · {a.pendingPatientName || "Paciente"}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSendReminder}
                disabled={sending || !selectedAppointmentId}
                className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium disabled:opacity-50 md:self-start"
              >
                {sending ? "Enviando..." : "Enviar recordatorio"}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nota o extra para este envío (opcional)
              </label>
              <textarea
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value.slice(0, 500))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                placeholder={
                  whatsAppConfig?.defaultExtraNote
                    ? `Por defecto: ${whatsAppConfig.defaultExtraNote}`
                    : "Ej: Recuerda traer tus estudios. Si no puedes asistir, avísanos."
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Si lo dejas vacío, se usa la nota por defecto de Ajustes → WhatsApp (si la configuraste).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">Historial de mensajes</h3>
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
            <p className="text-sm text-gray-500">Aún no hay mensajes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Paciente</th>
                    <th className="py-2 pr-4">Teléfono</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Nota extra</th>
                    <th className="py-2 pr-4">Cita</th>
                    <th className="py-2">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 dark:border-gray-900">
                      <td className="py-2 pr-4">{new Date(m.createdAt).toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4">{m.patientName || "—"}</td>
                      <td className="py-2 pr-4">{m.patientPhone || "—"}</td>
                      <td className="py-2 pr-4">{m.messageType}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 max-w-[200px] truncate" title={m.extraNote || undefined}>
                        {m.extraNote && m.extraNote !== "—" ? m.extraNote : "—"}
                      </td>
                      <td className="py-2 pr-4">{m.appointmentId || "—"}</td>
                      <td className="py-2">{m.errorMessage || m.providerMessageId || "—"}</td>
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
