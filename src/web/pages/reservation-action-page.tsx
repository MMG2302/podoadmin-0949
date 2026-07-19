import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/language-context";
import { formatDisplayDate } from "../lib/whatsapp-web-link";

type ReservationInfo = {
  patientFirstName: string | null;
  date: string;
  time: string;
  status: string;
  clinicName: string | null;
  podiatristName: string | null;
  logoUrl: string | null;
};

type PageState =
  | { kind: "processing" }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "done"; action: "confirm" | "cancel"; info: ReservationInfo | null; showClosePopup?: boolean }
  | { kind: "slotTaken"; info: ReservationInfo | null }
  | { kind: "error" };

function getTokenFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get("token") ?? "";
  } catch {
    return "";
  }
}

async function postAction(
  action: "confirm" | "cancel",
  token: string
): Promise<{ status: number; data: { success?: boolean; error?: string; reservation?: ReservationInfo } }> {
  const res = await fetch(`/api/reservations/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    reservation?: ReservationInfo;
  };
  return { status: res.status, data };
}

/**
 * Página pública a la que llega el paciente desde WhatsApp:
 * /reserva/confirmar?token=... | /reserva/cancelar?token=...
 *
 * Abrir el enlace EJECUTA la acción (sin botón): la página lanza el POST al montar.
 * Los bots de vista previa de WhatsApp no ejecutan JavaScript, así que una preview
 * del enlace no confirma ni cancela nada. Tras la acción se ofrece deshacer
 * ("¿Cambiaste de opinión?") por si el toque fue accidental.
 */
export default function ReservationActionPage({ mode }: { mode: "confirm" | "cancel" }) {
  const { t, language } = useLanguage();
  const r = t.reservationAction;
  const [state, setState] = useState<PageState>({ kind: "processing" });
  const [busy, setBusy] = useState(false);
  const [closeHint, setCloseHint] = useState(false);
  const started = useRef(false);
  const token = getTokenFromUrl();

  const dateLocale =
    language === "en" ? "en-US" : language === "pt" ? "pt-PT" : language === "fr" ? "fr-FR" : "es-MX";

  const runAction = async (action: "confirm" | "cancel") => {
    try {
      const { status, data } = await postAction(action, token);
      if (status === 410 || data.error === "expired") {
        setState({ kind: "expired" });
        return;
      }
      if (data.error === "slot_taken") {
        setState({ kind: "slotTaken", info: data.reservation ?? null });
        return;
      }
      if (status === 404 || data.error === "invalid_token") {
        setState({ kind: "invalid" });
        return;
      }
      if (!data.success) {
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "done", action, info: data.reservation ?? null });
    } catch {
      setState({ kind: "error" });
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    void runAction(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.kind !== "done") return;
    const timer = setTimeout(() => {
      setState((s) => (s.kind === "done" ? { ...s, showClosePopup: true } : s));
    }, 3000);
    return () => clearTimeout(timer);
  }, [state.kind]);

  const undo = async () => {
    if (state.kind !== "done" || busy) return;
    setBusy(true);
    const opposite = state.action === "confirm" ? "cancel" : "confirm";
    await runAction(opposite);
    setBusy(false);
  };

  const closeWindow = () => {
    // Intenta cerrar la pestaña. Si el navegador lo permite (la abrió el propio enlace),
    // la página desaparece y el temporizador nunca llega a ejecutarse.
    window.close();
    // Si sigue abierta (pestaña abierta manualmente por el usuario), en vez de un alert
    // bloqueante mostramos un aviso discreto en línea.
    setTimeout(() => setCloseHint(true), 500);
  };

  const title = mode === "confirm" ? r.confirmTitle : r.cancelTitle;

  const brandInfo = state.kind === "done" || state.kind === "slotTaken" ? state.info : null;
  const brandLogoUrl = brandInfo?.logoUrl ?? null;

  const detailsCard = (info: ReservationInfo | null) =>
    info ? (
      <div className="rounded-xl bg-brand-canvas p-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-brand-muted">{r.dateLabel}</span>
          <span className="font-medium text-brand-ink text-right">
            {formatDisplayDate(info.date, dateLocale)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-brand-muted">{r.timeLabel}</span>
          <span className="font-medium text-brand-ink">{info.time}</span>
        </div>
        {info.clinicName && (
          <div className="flex justify-between gap-4">
            <span className="text-brand-muted">{r.clinicLabel}</span>
            <span className="font-medium text-brand-ink text-right">{info.clinicName}</span>
          </div>
        )}
        {info.podiatristName && (
          <div className="flex justify-between gap-4">
            <span className="text-brand-muted">{r.podiatristLabel}</span>
            <span className="font-medium text-brand-ink text-right">{info.podiatristName}</span>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className="min-h-dvh bg-brand-canvas flex flex-col items-center justify-center px-4 py-10">
      <div className="flex items-center gap-2.5 mb-6">
        {brandLogoUrl ? (
          <>
            <img
              src={brandLogoUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-contain border border-brand-border bg-brand-surface"
            />
            <span className="text-xl tracking-tight text-brand-ink">
              {brandInfo?.clinicName || (
                <>
                  Podo<span className="font-bold">Admin</span>
                </>
              )}
            </span>
          </>
        ) : (
          <>
            <img src="/favicon.svg" alt="" className="h-9 w-9" />
            <span className="text-xl tracking-tight text-brand-ink">
              Podo<span className="font-bold">Admin</span>
            </span>
          </>
        )}
      </div>

      <div className="w-full max-w-md bg-brand-surface rounded-2xl border border-brand-border p-6 sm:p-8 space-y-5">
        <h1 className="text-xl font-semibold text-brand-ink">{title}</h1>

        {state.kind === "processing" && (
          <p className="text-sm text-brand-muted">
            {mode === "confirm" ? r.processingConfirm : r.processingCancel}
          </p>
        )}

        {state.kind === "invalid" && <p className="text-sm text-brand-muted">{r.invalidMsg}</p>}

        {state.kind === "expired" && <p className="text-sm text-brand-muted">{r.expiredMsg}</p>}

        {state.kind === "error" && <p className="text-sm text-semantic-warning">{r.errorGeneric}</p>}

        {state.kind === "slotTaken" && (
          <>
            <p className="text-sm text-semantic-warning">{r.slotTaken}</p>
            {detailsCard(state.info)}
          </>
        )}

        {state.kind === "done" && (
          <>
            {state.info?.patientFirstName && (
              <p className="text-sm text-brand-muted">
                {r.greeting.replace("{name}", state.info.patientFirstName)}
              </p>
            )}
            <p
              className={`text-base font-medium ${
                state.action === "confirm" ? "text-semantic-success" : "text-brand-ink"
              }`}
            >
              {state.action === "confirm" ? r.confirmedOk : r.cancelledOk}
            </p>
            {detailsCard(state.info)}
            {state.showClosePopup && (
              <div className="bg-brand-canvas border border-brand-border rounded-lg p-4 space-y-3">
                <p className="text-sm text-brand-ink font-medium">{r.pageCloseable}</p>
                {closeHint ? (
                  <p className="text-sm text-brand-muted">
                    {r.cantAutoClose || "Ya puedes cerrar esta pestaña."}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeWindow}
                      className="flex-1 bg-brand-ink text-brand-ink-fg py-2 rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors"
                    >
                      {r.closePageNow}
                    </button>
                    <button
                      type="button"
                      onClick={() => setState((s) => (s.kind === "done" ? { ...s, showClosePopup: false } : s))}
                      className="flex-1 border border-brand-border text-brand-ink py-2 rounded-lg text-sm font-medium hover:bg-brand-canvas transition-colors"
                    >
                      {r.keepOpen}
                    </button>
                  </div>
                )}
              </div>
            )}
            {!state.showClosePopup && (
              <button
                type="button"
                disabled={busy}
                onClick={undo}
                className="text-sm text-brand-muted underline hover:text-brand-ink disabled:opacity-50"
              >
                {state.action === "confirm" ? r.changedMindToCancel : r.changedMindToConfirm}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
