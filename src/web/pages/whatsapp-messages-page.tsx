import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { api } from "../lib/api-client";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/language-context";
import { usePermissions } from "../hooks/use-permissions";
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
  templateHasConfirmationLinks,
  WHATSAPP_TEMPLATE_EXAMPLES,
} from "../lib/whatsapp-web-link";
import { useTenantCountry } from "../hooks/use-tenant-country";
import {
  formErrorClass,
  semanticAlertErrorClass,
  semanticAlertSuccessClass,
  semanticChipErrorClass,
  semanticChipSuccessClass,
  semanticChipWarningClass,
  whatsappButtonClass,
  whatsappInputBorderClass,
  whatsappListClass,
  whatsappMutedTextClass,
  whatsappOutlineButtonClass,
  whatsappPanelClass,
} from "../lib/form-field-classes";

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

type WhatsAppWorkspace = {
  canUseWeb?: boolean;
  canUseApi?: boolean;
  apiConnected?: boolean;
  receptionistApiEnabled?: boolean;
  config?: WhatsAppConfigPublic;
};

export default function WhatsAppMessagesPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { canViewWhatsAppWeb, isReceptionist, canConfigureWhatsApp } = usePermissions();
  const tenantCountry = useTenantCountry(user);
  const m = t.whatsapp.messages;
  const dateLocale =
    language === "en" ? "en-US" : language === "pt" ? "pt-PT" : language === "fr" ? "fr-FR" : "es-MX";
  const [messages, setMessages] = useState<WhatsAppMessageRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfigPublic | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [webTemplate, setWebTemplate] = useState(DEFAULT_WHATSAPP_WEB_TEMPLATE);
  const [webExtraNote, setWebExtraNote] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [workspace, setWorkspace] = useState<WhatsAppWorkspace | null>(null);
  const [showApiSection, setShowApiSection] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tomorrowIso = useMemo(() => getTomorrowLocalDateString(), []);
  const tomorrowLabel = useMemo(
    () => formatDisplayDate(tomorrowIso, dateLocale),
    [tomorrowIso, dateLocale]
  );

  const apiConnected = Boolean(workspace?.apiConnected);
  const canUseApi = Boolean(workspace?.canUseApi && apiConnected);

  useEffect(() => {
    if (!user?.id) return;
    setWebTemplate(loadWhatsAppWebTemplate(user.id));
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [mRes, aptRes, wRes] = await Promise.all([
      api.get<{ success?: boolean; messages?: WhatsAppMessageRow[] }>("/whatsapp-messages?limit=200"),
      api.get<{ success?: boolean; appointments?: AppointmentRow[] }>(
        `/appointments?from=${tomorrowIso}&to=${tomorrowIso}&limit=200`
      ),
      api.get<{ success?: boolean } & WhatsAppWorkspace>("/integrations/whatsapp/workspace"),
    ]);
    if (mRes.success && Array.isArray(mRes.data?.messages)) {
      setMessages(mRes.data.messages);
    }
    const appointmentsList = aptRes.success && Array.isArray(aptRes.data?.appointments)
      ? aptRes.data.appointments
      : [];
    setAppointments(appointmentsList.filter((a) => a.status !== "cancelled"));

    const patientIds = [
      ...new Set(
        appointmentsList.filter((a) => a.patientId).map((a) => a.patientId as string)
      ),
    ];
    if (patientIds.length > 0) {
      const pRes = await api.get<{ success?: boolean; patients?: Patient[] }>(
        `/patients?ids=${patientIds.join(",")}&limit=100`
      );
      if (pRes.success && Array.isArray(pRes.data?.patients)) {
        setPatients(pRes.data.patients);
      } else {
        setPatients([]);
      }
    } else {
      setPatients([]);
    }
    if (wRes.success && wRes.data) {
      const ws = wRes.data;
      setWorkspace(ws);
      setWhatsAppConfig(ws.config ?? null);
      const connected = Boolean(ws.apiConnected);
      if (isReceptionist) {
        setShowApiSection(connected);
        setShowHistorySection(connected);
      } else {
        setShowApiSection(connected);
        setShowHistorySection(connected && (mRes.data?.messages?.length ?? 0) > 0);
      }
    } else {
      setWorkspace(null);
      setShowApiSection(false);
      setShowHistorySection(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!canViewWhatsAppWeb) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewWhatsAppWeb]);

  const patientById = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const resolveAppointmentContact = (a: AppointmentRow) => {
    let patientName = a.pendingPatientName?.trim() || m.patientFallback;
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

  const buildWebMessage = (row: TomorrowRow, extraVars: Record<string, string> = {}) => {
    const note =
      webExtraNote.trim() ||
      whatsAppConfig?.defaultExtraNote?.trim() ||
      m.defaultExtraNote;
    return applyWhatsAppWebTemplate(webTemplate, {
      nombre: row.patientName,
      fecha: row.dateLabel,
      hora: row.time,
      nota: note,
      ...extraVars,
    });
  };

  const openWhatsAppForRow = async (row: TomorrowRow) => {
    if (!row.waPhone) {
      setError(m.noValidPhone.replace("{name}", row.patientName));
      return;
    }
    setError(null);

    // Pre-abrir la pestaña dentro del gesto del usuario (evita el bloqueador de popups
    // cuando hay que esperar al backend por los enlaces de confirmación).
    const needsLinks = templateHasConfirmationLinks(webTemplate);
    const win = needsLinks ? window.open("about:blank", "_blank") : null;

    let extraVars: Record<string, string> = {};
    if (needsLinks) {
      const res = await api.post<{ confirmUrl?: string; cancelUrl?: string }>(
        `/appointments/${row.id}/confirmation-link`
      );
      if (res.success && res.data?.confirmUrl && res.data?.cancelUrl) {
        extraVars = { confirmar: res.data.confirmUrl, cancelar: res.data.cancelUrl };
      } else {
        win?.close();
        setError(res.message || res.error || m.reminderSendError);
        return;
      }
    }

    const url = buildWaMeUrl(row.waPhone, buildWebMessage(row, extraVars));
    if (win) {
      win.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const saveWebTemplate = () => {
    if (!user?.id) return;
    saveWhatsAppWebTemplate(user.id, webTemplate.trim() || DEFAULT_WHATSAPP_WEB_TEMPLATE);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  const handleSendReminder = async () => {
    if (!selectedAppointmentId) {
      setError(m.selectAppointmentFirst);
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
      setError(res.error || (res.data as { message?: string })?.message || m.reminderSendError);
      return;
    }
    setSuccess(m.reminderSent);
    setSelectedAppointmentId("");
    setExtraNote("");
    await loadData();
    setTimeout(() => setSuccess(null), 4000);
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "sent" || status === "delivered" || status === "read") return semanticChipSuccessClass;
    if (status === "failed") return semanticChipErrorClass;
    return semanticChipWarningClass;
  };

  if (!canViewWhatsAppWeb) {
    return (
      <MainLayout title={m.title}>
        <div className="max-w-2xl p-6 bg-brand-surface rounded-xl border border-brand-border">
          <p className={formErrorClass}>{m.denied}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={m.title}>
      <div className="max-w-5xl space-y-6">
        <div className={whatsappPanelClass}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-ink">{m.webTitle}</h3>
              <p className={`text-sm mt-1 max-w-2xl opacity-90 ${whatsappMutedTextClass}`}>{m.webHint}</p>
            </div>
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`shrink-0 ${whatsappButtonClass}`}
            >
              {m.openWeb}
            </a>
          </div>

          <div className="space-y-3 mb-5">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              {m.defaultMessage}
            </label>

            {/* Templates predefinidos para inspiración */}
            <details className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 cursor-pointer">
              <summary className="font-medium text-sm text-blue-900 dark:text-blue-200 cursor-pointer hover:text-blue-700 dark:hover:text-blue-100">
                💡 Ver templates de ejemplo (mejores prácticas de engagement)
              </summary>
              <div className="mt-4 space-y-3">
                {WHATSAPP_TEMPLATE_EXAMPLES.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900 rounded p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-medium text-sm text-brand-ink">{ex.name}</h5>
                      <button
                        type="button"
                        onClick={() => setWebTemplate(ex.template)}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        Usar este
                      </button>
                    </div>
                    <p className="text-xs text-brand-muted whitespace-pre-wrap font-mono">{ex.template}</p>
                  </div>
                ))}
              </div>
            </details>

            <textarea
              value={webTemplate}
              onChange={(e) => setWebTemplate(e.target.value)}
              rows={5}
              className={`w-full px-4 py-2.5 ${whatsappInputBorderClass} bg-brand-surface text-sm`}
            />
            <details className="bg-gray-50 dark:bg-gray-900/50 rounded p-3 text-xs text-brand-muted">
              <summary className="cursor-pointer font-medium text-brand-ink hover:text-blue-600 dark:hover:text-blue-400">
                📝 Variables disponibles (haz clic para ver todas)
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <strong className="text-brand-ink">Básicas:</strong>
                  <p>{'{{nombre}}, {{fecha}}, {{hora}}, {{nota}}'}</p>
                </div>
                <div>
                  <strong className="text-brand-ink">Confirmación:</strong>
                  <p>{'{{confirmar}}, {{cancelar}}'}</p>
                </div>
                <div>
                  <strong className="text-brand-ink">Doctor:</strong>
                  <p>{'{{doctor}}, {{especialidad}}'}</p>
                </div>
                <div>
                  <strong className="text-brand-ink">Ubicación:</strong>
                  <p>{'{{ubicacion}}, {{maps}}'}</p>
                </div>
                <div>
                  <strong className="text-brand-ink">Detalles:</strong>
                  <p>{'{{costo}}, {{duracion}}, {{clinica}}'}</p>
                </div>
              </div>
            </details>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={webExtraNote}
                onChange={(e) => setWebExtraNote(e.target.value.slice(0, 500))}
                placeholder={m.extraNotePlaceholder}
                className={`flex-1 px-4 py-2.5 ${whatsappInputBorderClass} bg-brand-surface text-sm`}
              />
              <button
                type="button"
                onClick={saveWebTemplate}
                className={`px-4 py-2.5 ${whatsappOutlineButtonClass} font-medium`}
              >
                {templateSaved ? m.saved : m.saveMessage}
              </button>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-brand-ink mb-2">
            {m.tomorrowAppointments.replace("{date}", tomorrowLabel)}
          </h4>

          {loading ? (
            <p className="text-sm text-gray-500">{m.loadingAppointments}</p>
          ) : tomorrowAppointments.length === 0 ? (
            <p className="text-sm text-brand-muted bg-white/60 dark:bg-gray-900/40 rounded-lg p-4">
              {m.noTomorrowAppointments}
            </p>
          ) : (
            <ul className={whatsappListClass}>
              {tomorrowAppointments.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink">{row.patientName}</p>
                    <p className="text-sm text-brand-muted">
                      {row.time}
                      {row.phone ? ` · ${row.phone}` : ` · ${m.noPhone}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsAppForRow(row)}
                    disabled={!row.waPhone}
                    className={`shrink-0 gap-2 ${whatsappButtonClass}`}
                  >
                    <span aria-hidden>💬</span>
                    {m.sendViaWhatsApp}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(canConfigureWhatsApp || canUseApi) && (
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
          <button
            type="button"
            onClick={() => !isReceptionist && setShowApiSection((v) => !v)}
            className={`w-full flex items-center justify-between text-left ${isReceptionist ? "cursor-default" : ""}`}
          >
            <div>
              <h3 className="text-lg font-semibold text-brand-ink">
                {m.metaApiTitle} {apiConnected ? m.connected : m.optional}
              </h3>
              <p className="text-sm text-brand-muted mt-0.5">
                {isReceptionist
                  ? m.receptionistApiHint
                  : m.metaApiHint}
              </p>
            </div>
            {!isReceptionist && (
              <span className="text-gray-400 text-sm ml-4">{showApiSection ? "▲" : "▼"}</span>
            )}
          </button>

          {showApiSection && (
            <div className="mt-5 space-y-6 border-t border-brand-border pt-5">
              {!whatsAppConfig ? (
                <p className="text-sm text-gray-500">{m.configLoadError}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-brand-muted">{m.connectedLabel}</p>
                    <p className="font-semibold">{whatsAppConfig.configured && whatsAppConfig.enabled ? m.yes : m.no}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-brand-muted">{m.apiStatusLabel}</p>
                    <p className="font-semibold">{whatsAppConfig.status || "pending"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-brand-muted">{m.templateLabel}</p>
                    <p className="font-semibold">{whatsAppConfig.templateName || m.templateUndefined}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-brand-muted">{m.lastErrorLabel}</p>
                    <p className="font-semibold truncate">{whatsAppConfig.lastError || m.noErrors}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-brand-ink mb-1">{m.sendAutoReminder}</h4>
                <p className="text-sm text-brand-muted mb-4">{m.metaApiHint}</p>

                {error && <div className={`mb-3 ${semanticAlertErrorClass}`}>{error}</div>}
                {success && <div className={`mb-3 ${semanticAlertSuccessClass}`}>{success}</div>}

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface"
                    >
                      <option value="">{m.selectUpcomingAppointment}</option>
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
                      className="px-5 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium disabled:opacity-50 md:self-start"
                    >
                      {sending ? m.sending : m.sendByApi}
                    </button>
                  </div>
                  <textarea
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value.slice(0, 500))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-sm"
                    placeholder={m.singleExtraNotePlaceholder}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {(canConfigureWhatsApp || canUseApi) && (
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
          <button
            type="button"
            onClick={() => !isReceptionist && setShowHistorySection((v) => !v)}
            className={`w-full flex items-center justify-between text-left ${isReceptionist ? "cursor-default" : ""}`}
          >
            <div>
              <h3 className="text-lg font-semibold text-brand-ink">
                {m.historyTitle} {apiConnected ? "" : m.optional}
              </h3>
              <p className="text-sm text-brand-muted mt-0.5">{m.historyHint}</p>
            </div>
            {!isReceptionist && (
              <span className="text-gray-400 text-sm ml-4 shrink-0">
                {showHistorySection ? "▲" : "▼"}
              </span>
            )}
          </button>

          {showHistorySection && (
            <div className="mt-5 border-t border-brand-border pt-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-brand-muted">{m.lastApiSends}</p>
                <button
                  onClick={loadData}
                  className="text-sm px-3 py-1.5 border border-brand-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {m.refresh}
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">{m.loadingHistory}</p>
              ) : !apiConnected ? (
                <p className="text-sm text-gray-500">
                  {m.configureForHistory}
                </p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {m.noApiSends}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-brand-border">
                        <th className="py-2 pr-4">{m.colDate}</th>
                        <th className="py-2 pr-4">{m.colPatient}</th>
                        <th className="py-2 pr-4">{m.colPhone}</th>
                        <th className="py-2 pr-4">{m.colStatus}</th>
                        <th className="py-2 pr-4">{m.colNote}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 dark:border-gray-900">
                          <td className="py-2 pr-4">{new Date(row.createdAt).toLocaleString()}</td>
                          <td className="py-2 pr-4">{row.patientName || m.emDash}</td>
                          <td className="py-2 pr-4">{row.patientPhone || m.emDash}</td>
                          <td className="py-2 pr-4">
                            <span className={getStatusBadgeClass(row.status)}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 max-w-[200px] truncate">{row.extraNote || m.emDash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </MainLayout>
  );
}
