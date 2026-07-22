import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../contexts/language-context";
import { formatDisplayDate } from "../lib/whatsapp-web-link";

type BookingInfo = {
  clinicName: string | null;
  podiatristName: string | null;
  mapsUrl: string | null;
  logoUrl: string | null;
  windowDays: number;
  today: string;
};

function readToken(): string {
  try {
    return new URLSearchParams(window.location.search).get("t") ?? "";
  } catch {
    return "";
  }
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Reserva en línea white-label: /reserva/agendar?t=<token>
 * Todo con la marca de la clínica; el paciente no ve PodoAdmin. Elige día → horario →
 * deja nombre y teléfono → queda agendado (el staff recibe la notificación).
 */
export default function BookingPage() {
  const { t, language } = useLanguage();
  const r = t.reservationAction;
  const token = readToken();
  const dateLocale =
    language === "en" ? "en-US" : language === "pt" ? "pt-PT" : language === "fr" ? "fr-FR" : "es-MX";

  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setInvalid(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/reservations/booking-info?t=${encodeURIComponent(token)}`);
        const data = (await res.json().catch(() => ({}))) as { success?: boolean; booking?: BookingInfo };
        if (!data.success || !data.booking) {
          setInvalid(true);
          return;
        }
        setInfo(data.booking);
        setSelectedDate(data.booking.today);
        // White-label: el paciente nunca ve "PodoAdmin", ni en la pestaña.
        if (data.booking.clinicName) document.title = data.booking.clinicName;
      } catch {
        setInvalid(true);
      }
    })();
  }, [token]);

  const dateOptions = useMemo(() => {
    if (!info) return [];
    const out: string[] = [];
    for (let i = 0; i < info.windowDays; i++) out.push(addDaysIso(info.today, i));
    return out;
  }, [info]);

  useEffect(() => {
    if (!token || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime("");
    (async () => {
      try {
        const res = await fetch(
          `/api/reservations/slots?t=${encodeURIComponent(token)}&date=${selectedDate}`
        );
        const data = (await res.json().catch(() => ({}))) as { success?: boolean; slots?: string[] };
        setSlots(data.success && Array.isArray(data.slots) ? data.slots : []);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [token, selectedDate]);

  const submit = async () => {
    if (!selectedDate || !selectedTime || name.trim().length < 2 || phone.replace(/\D/g, "").length < 8) return;
    setBooking(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, date: selectedDate, time: selectedTime, name: name.trim(), phone: phone.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (data.error === "slot_taken") {
        setError(r.bookingSlotTaken);
        // refrescar slots
        const s = await fetch(`/api/reservations/slots?t=${encodeURIComponent(token)}&date=${selectedDate}`);
        const sd = (await s.json().catch(() => ({}))) as { slots?: string[] };
        setSlots(Array.isArray(sd.slots) ? sd.slots : []);
        setSelectedTime("");
        return;
      }
      if (!data.success) {
        setError(r.errorGeneric);
        return;
      }
      setDone({ date: selectedDate, time: selectedTime });
    } catch {
      setError(r.errorGeneric);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-dvh bg-brand-canvas flex flex-col items-center justify-center px-4 py-10">
      <div className="flex items-center gap-2.5 mb-6">
        {info?.logoUrl ? (
          <>
            <img
              src={info.logoUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-contain border border-brand-border bg-brand-surface"
            />
            <span className="text-xl tracking-tight text-brand-ink">{info?.clinicName || ""}</span>
          </>
        ) : (
          <span className="text-xl font-semibold tracking-tight text-brand-ink">{info?.clinicName || ""}</span>
        )}
      </div>

      <div className="w-full max-w-md bg-brand-surface rounded-2xl border border-brand-border p-6 sm:p-8 space-y-5">
        <h1 className="text-xl font-semibold text-brand-ink">{r.bookingTitle}</h1>

        {invalid && <p className="text-sm text-brand-muted">{r.bookingInvalid}</p>}

        {done && (
          <div className="space-y-2">
            <p className="text-base font-medium text-semantic-success">{r.bookingDoneTitle}</p>
            <p className="text-sm text-brand-muted">
              {r.bookingDoneMsg
                .replace("{date}", formatDisplayDate(done.date, dateLocale))
                .replace("{time}", done.time)}
            </p>
          </div>
        )}

        {!invalid && !done && info && (
          <>
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1">{r.bookingPickDate}</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-sm"
              >
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDisplayDate(d, dateLocale)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1">{r.bookingPickTime}</label>
              {loadingSlots ? (
                <p className="text-sm text-brand-muted">{r.bookingLoadingSlots}</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-brand-muted">{r.bookingNoSlots}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedTime(s)}
                      className={`py-2 rounded-lg text-sm border transition-colors ${
                        selectedTime === s
                          ? "bg-brand-ink text-brand-ink-fg border-brand-ink"
                          : "border-brand-border bg-brand-canvas text-brand-ink hover:border-brand-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedTime && (
              <div className="space-y-3 pt-1">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 120))}
                  placeholder={r.bookingName}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-sm"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.slice(0, 40))}
                  placeholder={r.bookingPhone}
                  inputMode="tel"
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-sm"
                />
                {error && <p className="text-sm text-semantic-warning">{error}</p>}
                <button
                  type="button"
                  disabled={booking || name.trim().length < 2 || phone.replace(/\D/g, "").length < 8}
                  onClick={submit}
                  className="w-full bg-brand-ink text-brand-ink-fg py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-ink-hover transition-colors"
                >
                  {booking ? r.bookingBooking : r.bookingConfirm}
                </button>
              </div>
            )}
          </>
        )}

        {info?.podiatristName && !done && (
          <p className="text-xs text-brand-muted pt-2 border-t border-brand-border">{info.podiatristName}</p>
        )}
      </div>
    </div>
  );
}
