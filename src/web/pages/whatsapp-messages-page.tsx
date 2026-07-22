import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { api } from "../lib/api-client";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/language-context";
import { usePermissions } from "../hooks/use-permissions";
import type { Patient } from "../types/clinical";
import {
  applyRescheduleWaMessage,
  applyWhatsAppWebTemplate,
  buildWaMeUrl,
  DEFAULT_WHATSAPP_WEB_TEMPLATE,
  formatDisplayDate,
  getRelativeLocalDateString,
  loadWaRescheduleTemplate,
  loadWhatsAppWebTemplate,
  normalizePhoneForWaMe,
  saveWaRescheduleTemplate,
  saveWhatsAppWebTemplate,
  templateHasConfirmationLinks,
  WHATSAPP_TEMPLATE_EXAMPLES,
} from "../lib/whatsapp-web-link";
import { useTenantCountry } from "../hooks/use-tenant-country";
import { useRescheduleMessage } from "../hooks/use-reschedule-message";
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
  podiatristId?: string;
  date: string;
  time: string;
  duration?: number;
  cost?: string | null;
  notes?: string;
  status?: string;
  pendingPatientName?: string;
  pendingPatientPhone?: string;
  rescheduleStatus?: "none" | "pending" | "handled" | "resolved" | "expired";
  satisfactionRating?: "good" | "regular" | "bad" | null;
};

type ClinicInfo = {
  clinicName?: string;
  address?: string;
  mapsUrl?: string;
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

type ReminderTargetRow = {
  id: string;
  patientName: string;
  phone: string | null;
  waPhone: string | null;
  time: string;
  dateLabel: string;
  // Nuevas variables para templates enriquecidos
  doctorName?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicMapsUrl?: string;
  appointmentCost?: string;
  appointmentDuration?: string;
  rescheduleStatus?: "pending" | "handled";
};

type WhatsAppWorkspace = {
  canUseWeb?: boolean;
  canUseApi?: boolean;
  apiConnected?: boolean;
  receptionistApiEnabled?: boolean;
  config?: WhatsAppConfigPublic;
};

const DAY_OFFSET_OPTIONS: Array<{
  value: number;
  labelKey: "dayOffsetToday" | "dayOffsetTomorrow" | "dayOffsetIn2Days" | "dayOffsetIn5Days";
}> = [
  { value: 0, labelKey: "dayOffsetToday" },
  { value: 1, labelKey: "dayOffsetTomorrow" },
  { value: 2, labelKey: "dayOffsetIn2Days" },
  { value: 5, labelKey: "dayOffsetIn5Days" },
];

export default function WhatsAppMessagesPage() {
  const { t, language } = useLanguage();
  const { user, getAllUsers } = useAuth();
  const { canViewWhatsAppWeb, isReceptionist, canConfigureWhatsApp } = usePermissions();
  const tenantCountry = useTenantCountry(user);
  const m = t.whatsapp.messages;
  const dateLocale =
    language === "en" ? "en-US" : language === "pt" ? "pt-PT" : language === "fr" ? "fr-FR" : "es-MX";
  const [messages, setMessages] = useState<WhatsAppMessageRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [pendingReschedule, setPendingReschedule] = useState<AppointmentRow[]>([]);
  const [completedForOpinion, setCompletedForOpinion] = useState<AppointmentRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfigPublic | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [webTemplate, setWebTemplate] = useState(DEFAULT_WHATSAPP_WEB_TEMPLATE);
  const [webExtraNote, setWebExtraNote] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [rescheduleWaTemplate, setRescheduleWaTemplate] = useState("");
  const [rescheduleWaSaved, setRescheduleWaSaved] = useState(false);
  const [workspace, setWorkspace] = useState<WhatsAppWorkspace | null>(null);
  const [showApiSection, setShowApiSection] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(1); // 0 = hoy, 1 = mañana, 2, 5...

  const {
    message: rescheduleMessage,
    editable: rescheduleMessageEditable,
    scopeLabel: rescheduleMessageScopeLabel,
    saving: savingRescheduleMessage,
    save: saveRescheduleMessage,
  } = useRescheduleMessage(canViewWhatsAppWeb);
  const [rescheduleMessageDraft, setRescheduleMessageDraft] = useState("");
  const [rescheduleMessageSavedHint, setRescheduleMessageSavedHint] = useState(false);

  const isPodiatrist = user?.role === "podiatrist";
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingCopied, setBookingCopied] = useState(false);

  useEffect(() => {
    if (!isPodiatrist) return;
    api
      .get<{ success?: boolean; url?: string; enabled?: boolean }>("/clinical-dashboard/booking-link")
      .then((res) => {
        if (res.success) {
          setBookingUrl(res.data?.url ?? null);
          setBookingEnabled(res.data?.enabled === true);
        }
      });
  }, [isPodiatrist]);

  const toggleBooking = async (enabled: boolean) => {
    const res = await api.put<{ success?: boolean; url?: string; enabled?: boolean }>(
      "/clinical-dashboard/booking-link",
      { enabled }
    );
    if (res.success) {
      setBookingEnabled(res.data?.enabled === true);
      setBookingUrl(res.data?.url ?? bookingUrl);
    }
  };

  const copyBookingUrl = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setBookingCopied(true);
      setTimeout(() => setBookingCopied(false), 2000);
    } catch {
      /* clipboard bloqueado */
    }
  };

  useEffect(() => {
    setRescheduleMessageDraft(rescheduleMessage ?? "");
  }, [rescheduleMessage]);

  const handleSaveRescheduleMessage = async () => {
    const ok = await saveRescheduleMessage(rescheduleMessageDraft.trim() || null);
    if (ok) {
      setRescheduleMessageSavedHint(true);
      setTimeout(() => setRescheduleMessageSavedHint(false), 2500);
    }
  };

  const targetDateIso = useMemo(() => getRelativeLocalDateString(dayOffset), [dayOffset]);
  const targetDateLabel = useMemo(
    () => formatDisplayDate(targetDateIso, dateLocale),
    [targetDateIso, dateLocale]
  );

  const apiConnected = Boolean(workspace?.apiConnected);
  const canUseApi = Boolean(workspace?.canUseApi && apiConnected);

  useEffect(() => {
    if (!user?.id) return;
    setWebTemplate(loadWhatsAppWebTemplate(user.id));
    setRescheduleWaTemplate(loadWaRescheduleTemplate(user.id, m.rescheduleWhatsAppMessage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [mRes, aptRes, wRes, clinicRes, prRes, hrRes, coRes] = await Promise.all([
      api.get<{ success?: boolean; messages?: WhatsAppMessageRow[] }>("/whatsapp-messages?limit=200"),
      api.get<{ success?: boolean; appointments?: AppointmentRow[] }>(
        `/appointments?from=${targetDateIso}&to=${targetDateIso}&limit=200`
      ),
      api.get<{ success?: boolean } & WhatsAppWorkspace>("/integrations/whatsapp/workspace"),
      user?.clinicId
        ? api.get<{ success?: boolean; clinic?: { clinicName?: string; address?: string; mapsUrl?: string } }>(
            `/clinics/${encodeURIComponent(user.clinicId)}`
          )
        : Promise.resolve({ success: false as const, data: undefined }),
      api.get<{ success?: boolean; appointments?: AppointmentRow[] }>(
        "/appointments?rescheduleStatus=pending&includeCancelled=1&limit=100"
      ),
      api.get<{ success?: boolean; appointments?: AppointmentRow[] }>(
        "/appointments?rescheduleStatus=handled&includeCancelled=1&limit=100"
      ),
      api.get<{ success?: boolean; appointments?: AppointmentRow[] }>(
        `/appointments?from=${getRelativeLocalDateString(-7)}&to=${getRelativeLocalDateString(0)}&limit=200`
      ),
    ]);
    if (mRes.success && Array.isArray(mRes.data?.messages)) {
      setMessages(mRes.data.messages);
    }
    if (clinicRes.success && clinicRes.data?.clinic) {
      setClinicInfo({
        clinicName: clinicRes.data.clinic.clinicName,
        address: clinicRes.data.clinic.address,
        mapsUrl: clinicRes.data.clinic.mapsUrl,
      });
    } else {
      setClinicInfo(null);
    }
    const appointmentsList = aptRes.success && Array.isArray(aptRes.data?.appointments)
      ? aptRes.data.appointments
      : [];
    setAppointments(appointmentsList.filter((a) => a.status !== "cancelled"));

    const pendingOnly = prRes.success && Array.isArray(prRes.data?.appointments)
      ? prRes.data.appointments.map((a) => ({ ...a, rescheduleStatus: "pending" as const }))
      : [];
    const handledOnly = hrRes.success && Array.isArray(hrRes.data?.appointments)
      ? hrRes.data.appointments.map((a) => ({ ...a, rescheduleStatus: "handled" as const }))
      : [];
    // Pendientes primero (necesitan acción), luego los que ya están en gestión.
    const pendingRescheduleList = [...pendingOnly, ...handledOnly];
    setPendingReschedule(pendingRescheduleList);

    // Citas atendidas en los últimos 7 días que aún no dejaron opinión.
    const completedList =
      coRes.success && Array.isArray(coRes.data?.appointments)
        ? coRes.data.appointments.filter((a) => a.status === "completed" && !a.satisfactionRating)
        : [];
    setCompletedForOpinion(completedList);

    const patientIds = [
      ...new Set(
        [...appointmentsList, ...pendingRescheduleList, ...completedList]
          .filter((a) => a.patientId)
          .map((a) => a.patientId as string)
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
  }, [canViewWhatsAppWeb, dayOffset]);

  const patientById = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const doctorById = useMemo(() => {
    const allUsers = getAllUsers();
    return new Map(allUsers.map((u) => [u.id, u]));
  }, [getAllUsers]);

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

  const targetDateAppointments = useMemo((): ReminderTargetRow[] => {
    return appointments
      .filter((a) => a.date === targetDateIso && a.status !== "cancelled" && a.status !== "completed")
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((a) => {
        const { patientName, phone, waPhone } = resolveAppointmentContact(a);
        // Nombre del doctor: desde el appointment (podiatristId), no del usuario actual
        const doctor = a.podiatristId ? doctorById.get(a.podiatristId) : null;
        const doctorName = doctor?.name ? `${doctor.name}`.trim() : undefined;
        // Datos de la clínica: vienen de /clinics/:id, no del objeto user (que no los tiene)
        const clinicName = clinicInfo?.clinicName?.trim() || undefined;
        const clinicAddress = clinicInfo?.address?.trim() || undefined;
        // Prioridad: link de Maps configurado manualmente (más preciso) → URL de búsqueda
        // generada desde la dirección de texto libre (fallback si no hay link).
        const clinicMapsUrl =
          clinicInfo?.mapsUrl?.trim() ||
          (clinicAddress ? `https://www.google.com/maps/search/${encodeURIComponent(clinicAddress)}` : undefined);
        // Duración en minutos (si existe)
        const appointmentDuration = a.duration ? `${a.duration} min` : undefined;
        // Costo de la cita (si existe en los datos)
        const appointmentCost = a.cost ? `$${a.cost}` : undefined;

        return {
          id: a.id,
          patientName,
          phone,
          waPhone,
          time: a.time,
          dateLabel: targetDateLabel,
          doctorName,
          clinicName,
          clinicAddress,
          clinicMapsUrl,
          appointmentDuration,
          appointmentCost,
        };
      });
  }, [appointments, targetDateIso, targetDateLabel, patientById, doctorById, tenantCountry, clinicInfo]);

  const pendingRescheduleRows = useMemo((): ReminderTargetRow[] => {
    return pendingReschedule
      .map((a) => {
        const { patientName, phone, waPhone } = resolveAppointmentContact(a);
        return {
          id: a.id,
          patientName,
          phone,
          waPhone,
          time: a.time,
          dateLabel: formatDisplayDate(a.date, dateLocale),
          rescheduleStatus: a.rescheduleStatus === "handled" ? ("handled" as const) : ("pending" as const),
        };
      })
      // Pendientes (necesitan acción) antes que los que ya están en gestión.
      .sort((a, b) => {
        if (a.rescheduleStatus !== b.rescheduleStatus) return a.rescheduleStatus === "pending" ? -1 : 1;
        return b.dateLabel.localeCompare(a.dateLabel);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReschedule, patientById, tenantCountry, dateLocale]);

  const markRescheduleHandled = async (row: ReminderTargetRow, handled: boolean) => {
    const res = await api.post<{ success?: boolean }>(`/appointments/${row.id}/reschedule-handled`, { handled });
    if (!res.success) {
      setError(res.error || m.reminderSendError);
      return;
    }
    await loadData();
  };

  const dismissReschedule = async (row: ReminderTargetRow) => {
    if (!confirm(m.dismissRescheduleConfirm.replace("{name}", row.patientName))) return;
    const res = await api.post<{ success?: boolean }>(`/appointments/${row.id}/reschedule-dismiss`);
    if (!res.success) {
      setError(res.error || m.reminderSendError);
      return;
    }
    await loadData();
  };

  const opinionRows = useMemo((): ReminderTargetRow[] => {
    return completedForOpinion
      .map((a) => {
        const { patientName, phone, waPhone } = resolveAppointmentContact(a);
        return { id: a.id, patientName, phone, waPhone, time: a.time, dateLabel: formatDisplayDate(a.date, dateLocale) };
      })
      .sort((a, b) => b.dateLabel.localeCompare(a.dateLabel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedForOpinion, patientById, tenantCountry, dateLocale]);

  // Abre una pestaña "puente" DENTRO del gesto del clic (así el navegador no la bloquea
  // como popup) y le escribe un aviso de carga para que nunca se quede en blanco (about:blank).
  // Luego se redirige a wa.me al tener la URL, o se cierra si algo falla.
  const openBridgeTab = (): Window | null => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        '<!doctype html><meta charset="utf-8"><title>WhatsApp</title>' +
          '<body style="font-family:system-ui,-apple-system,sans-serif;padding:2rem;color:#374151;background:#f9fafb">' +
          "<p>Preparando el mensaje de WhatsApp…</p></body>"
      );
    }
    return win;
  };

  const requestOpinion = async (row: ReminderTargetRow) => {
    if (!row.waPhone) {
      setError(m.noValidPhone.replace("{name}", row.patientName));
      return;
    }
    setError(null);
    // Pre-abrir la pestaña dentro del gesto (evita el bloqueador de popups en túnel/producción).
    const win = openBridgeTab();
    try {
      const res = await api.post<{ goodUrl?: string; regularUrl?: string; badUrl?: string }>(
        `/appointments/${row.id}/satisfaction-link`
      );
      if (!res.success || !res.data?.goodUrl) {
        win?.close();
        setError(res.error || m.reminderSendError);
        return;
      }
      const text = m.opinionWhatsAppMessage
        .replace("{name}", row.patientName)
        .replace("{clinica}", clinicInfo?.clinicName || "")
        .replace("{good}", res.data.goodUrl)
        .replace("{regular}", res.data.regularUrl || "")
        .replace("{bad}", res.data.badUrl || "");
      const url = buildWaMeUrl(row.waPhone, text);
      if (win) win.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      win?.close();
      setError(m.reminderSendError);
      console.error("Error requesting opinion:", err);
    }
  };

  const saveRescheduleWaTemplate = () => {
    if (!user?.id) return;
    saveWaRescheduleTemplate(user.id, rescheduleWaTemplate.trim() || m.rescheduleWhatsAppMessage);
    setRescheduleWaSaved(true);
    setTimeout(() => setRescheduleWaSaved(false), 2500);
  };

  const sendRescheduleMessage = (row: ReminderTargetRow) => {
    if (!row.waPhone) {
      setError(m.noValidPhone.replace("{name}", row.patientName));
      return;
    }
    setError(null);
    const template = rescheduleWaTemplate.trim() || m.rescheduleWhatsAppMessage;
    const text = applyRescheduleWaMessage(template, {
      name: row.patientName,
      date: row.dateLabel,
      reserva: (bookingEnabled && bookingUrl) ? bookingUrl : "",
    });
    window.open(buildWaMeUrl(row.waPhone, text), "_blank", "noopener,noreferrer");
  };

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

  const buildWebMessage = (row: ReminderTargetRow, extraVars: Record<string, string> = {}) => {
    const note =
      webExtraNote.trim() ||
      whatsAppConfig?.defaultExtraNote?.trim() ||
      m.defaultExtraNote;
    return applyWhatsAppWebTemplate(webTemplate, {
      // Variables básicas
      nombre: row.patientName,
      fecha: row.dateLabel,
      hora: row.time,
      nota: note,
      // Variables del doctor
      doctor: row.doctorName || '',
      // Variables de la clínica
      clinica: row.clinicName || '',
      ubicacion: row.clinicAddress || '',
      maps: row.clinicMapsUrl || '',
      // Variables de la cita
      duracion: row.appointmentDuration || '',
      costo: row.appointmentCost || '',
      // Variables dinámicas (confirmar, cancelar)
      ...extraVars,
    });
  };

  const openWhatsAppForRow = async (row: ReminderTargetRow) => {
    if (!row.waPhone) {
      setError(m.noValidPhone.replace("{name}", row.patientName));
      return;
    }
    setError(null);

    const needsLinks = templateHasConfirmationLinks(webTemplate);
    // Solo pre-abrimos la pestaña puente si hay que esperar al backend (enlaces de confirmación).
    // Si el mensaje no lleva enlaces, abrimos directo al final (sin await, sin bloqueo de popup).
    const win = needsLinks ? openBridgeTab() : null;
    try {
      let extraVars: Record<string, string> = {};

      if (needsLinks) {
        const res = await api.post<{ confirmUrl?: string; cancelUrl?: string; rescheduleUrl?: string }>(
          `/appointments/${row.id}/confirmation-link`
        );
        if (res.success && res.data?.confirmUrl && res.data?.cancelUrl) {
          extraVars = {
            confirmar: res.data.confirmUrl,
            cancelar: res.data.cancelUrl,
            reagendar: res.data.rescheduleUrl || '',
          };
        } else {
          win?.close();
          setError(res.message || res.error || m.reminderSendError);
          return;
        }
      }

      const url = buildWaMeUrl(row.waPhone, buildWebMessage(row, extraVars));
      if (win) win.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      win?.close();
      setError(m.reminderSendError);
      console.error("Error opening WhatsApp:", err);
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
                  <p>{'{{confirmar}}, {{cancelar}}, {{reagendar}}'}</p>
                </div>
                <div>
                  <strong className="text-brand-ink">Doctor:</strong>
                  <p>{'{{doctor}}'}</p>
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <span className="text-sm font-medium text-brand-ink">{m.dayOffsetLabel}</span>
            <div className="flex flex-wrap gap-2">
              {DAY_OFFSET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDayOffset(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    dayOffset === opt.value
                      ? "bg-brand-ink text-brand-ink-fg border-brand-ink"
                      : "border-brand-border bg-brand-canvas text-brand-ink hover:bg-brand-ink hover:text-brand-ink-fg"
                  }`}
                >
                  {m[opt.labelKey]}
                </button>
              ))}
            </div>
          </div>

          <h4 className="text-sm font-semibold text-brand-ink mb-2">
            {m.tomorrowAppointments.replace("{date}", targetDateLabel)}
          </h4>

          {loading ? (
            <p className="text-sm text-gray-500">{m.loadingAppointments}</p>
          ) : targetDateAppointments.length === 0 ? (
            <p className="text-sm text-brand-muted bg-white/60 dark:bg-gray-900/40 rounded-lg p-4">
              {m.noTomorrowAppointments}
            </p>
          ) : (
            <ul className={whatsappListClass}>
              {targetDateAppointments.map((row) => (
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

        <div className={whatsappPanelClass}>
          <h3 className="text-lg font-semibold text-brand-ink">{m.pendingRescheduleTitle}</h3>
          <p className={`text-sm mt-1 mb-4 max-w-2xl opacity-90 ${whatsappMutedTextClass}`}>
            {m.pendingRescheduleHint}
          </p>

          {/* Mensaje editable que envía el botón "Avisar reagendo" (soporta {reserva} = link de reserva en línea). */}
          <div className="mb-5 rounded-lg border border-whatsapp-border/60 bg-brand-canvas/40 p-4">
            <label className="block text-sm font-semibold text-brand-ink">{m.rescheduleWaMsgTitle}</label>
            <p className={`text-xs mt-1 mb-2 ${whatsappMutedTextClass}`}>{m.rescheduleWaMsgHint}</p>
            <textarea
              value={rescheduleWaTemplate}
              onChange={(e) => setRescheduleWaTemplate(e.target.value.slice(0, 700))}
              rows={3}
              placeholder={m.rescheduleWhatsAppMessage}
              className={`w-full px-4 py-2.5 ${whatsappInputBorderClass} bg-brand-surface text-sm`}
            />
            <div className="mt-2">
              <button
                type="button"
                onClick={saveRescheduleWaTemplate}
                className={`px-4 py-2 ${whatsappOutlineButtonClass} font-medium`}
              >
                {rescheduleWaSaved ? m.saved : m.saveMessage}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">{m.loadingPendingReschedule}</p>
          ) : pendingRescheduleRows.length === 0 ? (
            <p className="text-sm text-brand-muted bg-white/60 dark:bg-gray-900/40 rounded-lg p-4">
              {m.noPendingReschedule}
            </p>
          ) : (
            <ul className={whatsappListClass}>
              {pendingRescheduleRows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink flex items-center gap-2">
                      {row.patientName}
                      {row.rescheduleStatus === "handled" && (
                        <span className={semanticChipWarningClass}>{m.rescheduleHandledBadge}</span>
                      )}
                    </p>
                    <p className="text-sm text-brand-muted">
                      {m.cancelledOn.replace("{date}", row.dateLabel)}
                      {row.phone ? ` · ${row.phone}` : ` · ${m.noPhone}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void markRescheduleHandled(row, row.rescheduleStatus !== "handled")}
                      className={`px-3 py-2 text-sm font-medium ${whatsappOutlineButtonClass}`}
                    >
                      {row.rescheduleStatus === "handled" ? m.reopenReschedule : m.markRescheduleHandled}
                    </button>
                    <button
                      type="button"
                      onClick={() => void dismissReschedule(row)}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                    >
                      {m.dismissReschedule}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendRescheduleMessage(row)}
                      disabled={!row.waPhone}
                      className={`gap-2 ${whatsappButtonClass}`}
                    >
                      <span aria-hidden>💬</span>
                      {m.sendRescheduleMessage}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Mensaje personalizado de la página de reagendo (enlace {{reagendar}}), unificado aquí */}
          <div className="mt-6 border-t border-whatsapp-border/60 pt-5">
            <h4 className="text-sm font-semibold text-brand-ink">{m.rescheduleMessageSectionTitle}</h4>
            <p className={`text-sm mt-1 mb-3 max-w-2xl opacity-90 ${whatsappMutedTextClass}`}>
              {m.rescheduleMessageHint}
            </p>
            {rescheduleMessageScopeLabel && (
              <p className={`text-xs mb-2 ${whatsappMutedTextClass}`}>
                {m.rescheduleMessageScope.replace("{label}", rescheduleMessageScopeLabel)}
              </p>
            )}
            <textarea
              value={rescheduleMessageDraft}
              onChange={(e) => setRescheduleMessageDraft(e.target.value.slice(0, 500))}
              disabled={!rescheduleMessageEditable}
              rows={3}
              placeholder={m.rescheduleMessagePlaceholder}
              className={`w-full px-4 py-2.5 ${whatsappInputBorderClass} bg-brand-surface text-sm disabled:opacity-60`}
            />
            {rescheduleMessageEditable ? (
              <div className="flex flex-wrap gap-2 items-center mt-3">
                <button
                  type="button"
                  disabled={savingRescheduleMessage}
                  onClick={() => void handleSaveRescheduleMessage()}
                  className={`px-4 py-2.5 ${whatsappOutlineButtonClass} font-medium`}
                >
                  {savingRescheduleMessage ? m.savingRescheduleMessage : m.saveRescheduleMessageButton}
                </button>
                {rescheduleMessageSavedHint && (
                  <span className="text-sm text-semantic-success">{m.saved}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-muted mt-2">{m.rescheduleMessageReadOnlyHint}</p>
            )}
          </div>
        </div>

        <div className={whatsappPanelClass}>
          <h3 className="text-lg font-semibold text-brand-ink">{m.opinionSectionTitle}</h3>
          <p className={`text-sm mt-1 mb-4 max-w-2xl opacity-90 ${whatsappMutedTextClass}`}>
            {m.opinionSectionHint}
          </p>

          {loading ? (
            <p className="text-sm text-gray-500">{m.loadingOpinion}</p>
          ) : opinionRows.length === 0 ? (
            <p className="text-sm text-brand-muted bg-white/60 dark:bg-gray-900/40 rounded-lg p-4">
              {m.noOpinionCandidates}
            </p>
          ) : (
            <ul className={whatsappListClass}>
              {opinionRows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink">{row.patientName}</p>
                    <p className="text-sm text-brand-muted">
                      {m.attendedOn.replace("{date}", row.dateLabel)}
                      {row.phone ? ` · ${row.phone}` : ` · ${m.noPhone}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void requestOpinion(row)}
                    disabled={!row.waPhone}
                    className={`shrink-0 gap-2 ${whatsappButtonClass}`}
                  >
                    <span aria-hidden>⭐</span>
                    {m.requestOpinion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isPodiatrist && (
          <div className={whatsappPanelClass}>
            <h3 className="text-lg font-semibold text-brand-ink">{m.bookingLinkTitle}</h3>
            <p className={`text-sm mt-1 mb-4 max-w-2xl opacity-90 ${whatsappMutedTextClass}`}>
              {m.bookingLinkHint}
            </p>
            <label className="flex items-center gap-2 text-sm text-brand-ink mb-3">
              <input
                type="checkbox"
                checked={bookingEnabled}
                onChange={(e) => void toggleBooking(e.target.checked)}
              />
              {bookingEnabled ? m.bookingLinkEnabled : m.bookingLinkDisabled}
            </label>
            {bookingEnabled && bookingUrl && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={bookingUrl}
                  onFocus={(e) => e.target.select()}
                  className={`flex-1 px-4 py-2.5 ${whatsappInputBorderClass} bg-brand-surface text-sm`}
                />
                <button
                  type="button"
                  onClick={() => void copyBookingUrl()}
                  className={`px-4 py-2.5 ${whatsappOutlineButtonClass} font-medium`}
                >
                  {bookingCopied ? m.bookingLinkCopied : m.bookingLinkCopy}
                </button>
              </div>
            )}
          </div>
        )}

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
