import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/language-context";
import { formatDisplayDate } from "../lib/whatsapp-web-link";

type Rating = "good" | "regular" | "bad";

type ReservationInfo = {
  patientFirstName: string | null;
  date: string;
  time: string;
  clinicName: string | null;
  podiatristName: string | null;
  logoUrl: string | null;
  clinicMapsUrl: string | null;
};

type PageState =
  | { kind: "processing" }
  | { kind: "invalid" }
  | { kind: "done"; rating: Rating; info: ReservationInfo | null }
  | { kind: "error" };

function readParams(): { token: string; rating: Rating | null } {
  try {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("v");
    const rating = v === "good" || v === "regular" || v === "bad" ? v : null;
    return { token: p.get("token") ?? "", rating };
  } catch {
    return { token: "", rating: null };
  }
}

/**
 * Página pública de opinión post-visita (sin sesión): /reserva/opinion?token=…&v=good|regular|bad
 * Abrir el enlace registra la calificación. Si es "mal" (o "regular") no se cierra: queda
 * abierto un espacio para queja/sugerencia que el paciente puede enviar, anónimo o no.
 * Si es "bien", se ofrece dejar reseña en Google. Todo con la marca de la clínica, nunca PodoAdmin.
 */
export default function SatisfactionPage() {
  const { t, language } = useLanguage();
  const r = t.reservationAction;
  const { token, rating } = readParams();
  const [state, setState] = useState<PageState>({ kind: "processing" });
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [commentSent, setCommentSent] = useState(false);
  const started = useRef(false);

  const dateLocale =
    language === "en" ? "en-US" : language === "pt" ? "pt-PT" : language === "fr" ? "fr-FR" : "es-MX";

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token || !rating) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/reservations/satisfaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, rating }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          reservation?: ReservationInfo;
        };
        if (res.status === 404 || data.error === "invalid_token") {
          setState({ kind: "invalid" });
          return;
        }
        if (!data.success) {
          setState({ kind: "error" });
          return;
        }
        if (data.reservation?.clinicName) document.title = data.reservation.clinicName;
        setState({ kind: "done", rating, info: data.reservation ?? null });
      } catch {
        setState({ kind: "error" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendComment = async () => {
    if (!comment.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/reservations/satisfaction-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, comment: comment.trim(), anonymous }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (data.success) setCommentSent(true);
    } finally {
      setSending(false);
    }
  };

  const info = state.kind === "done" ? state.info : null;
  const brandLogoUrl = info?.logoUrl ?? null;

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
            <span className="text-xl tracking-tight text-brand-ink">{info?.clinicName || ""}</span>
          </>
        ) : (
          <span className="text-xl font-semibold tracking-tight text-brand-ink">{info?.clinicName || ""}</span>
        )}
      </div>

      <div className="w-full max-w-md bg-brand-surface rounded-2xl border border-brand-border p-6 sm:p-8 space-y-5">
        <h1 className="text-xl font-semibold text-brand-ink">{r.satisfactionTitle}</h1>

        {state.kind === "processing" && <p className="text-sm text-brand-muted">{r.satisfactionProcessing}</p>}
        {state.kind === "invalid" && <p className="text-sm text-brand-muted">{r.invalidMsg}</p>}
        {state.kind === "error" && <p className="text-sm text-semantic-warning">{r.errorGeneric}</p>}

        {state.kind === "done" && (
          <>
            {info?.patientFirstName && (
              <p className="text-sm text-brand-muted">{r.greeting.replace("{name}", info.patientFirstName)}</p>
            )}

            {state.rating === "good" && (
              <>
                <p className="text-base font-medium text-semantic-success">{r.thanksGood}</p>
                {info?.clinicMapsUrl && (
                  <a
                    href={info.clinicMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-brand-ink text-brand-ink-fg py-2.5 rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors"
                  >
                    {r.reviewCta}
                  </a>
                )}
              </>
            )}

            {(state.rating === "regular" || state.rating === "bad") && (
              <>
                <p className="text-base font-medium text-brand-ink">
                  {state.rating === "bad" ? r.thanksBad : r.thanksRegular}
                </p>
                {commentSent ? (
                  <p className="text-sm text-semantic-success">{r.commentSent}</p>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-brand-ink">{r.complaintPrompt}</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                      rows={4}
                      placeholder={r.complaintPlaceholder}
                      className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-brand-muted">
                      <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                      {r.anonymousLabel}
                    </label>
                    <button
                      type="button"
                      disabled={sending || !comment.trim()}
                      onClick={sendComment}
                      className="w-full bg-brand-ink text-brand-ink-fg py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-ink-hover transition-colors"
                    >
                      {sending ? r.sending : r.sendComment}
                    </button>
                  </div>
                )}
              </>
            )}

            {info && (
              <p className="text-xs text-brand-muted pt-2 border-t border-brand-border">
                {formatDisplayDate(info.date, dateLocale)} · {info.time}
                {info.podiatristName ? ` · ${info.podiatristName}` : ""}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
