import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { semanticAlertInfoClass } from "../lib/form-field-classes";
import { MapPin, X, ExternalLink } from "lucide-react";

export interface LocationAnnouncement {
  id: string;
  title: string;
  body: string;
  targetState: string;
  targetCountry: string;
  externalUrl: string;
  promoCode: string | null;
  ctaLabel: string;
  advertiserName: string | null;
}

export function LocationAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<LocationAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [interestSent, setInterestSent] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const r = await api.get<{ success?: boolean; announcements?: LocationAnnouncement[] }>(
      "/location-announcements/active"
    );
    if (r.success && Array.isArray(r.data?.announcements)) {
      setAnnouncements(r.data.announcements);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const ann = visible[0];

  const handleDismiss = async () => {
    setDismissed((prev) => new Set(prev).add(ann.id));
    await api.post(`/location-announcements/${ann.id}/dismiss`);
  };

  const handleInterest = async () => {
    const r = await api.post(`/location-announcements/${ann.id}/interest`);
    if (r.success) {
      setInterestSent((prev) => new Set(prev).add(ann.id));
    }
  };

  return (
    <div className={`mb-4 ${semanticAlertInfoClass} !rounded-xl shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-semantic-info-bg text-semantic-info shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-semantic-info uppercase tracking-wide">
                Patrocinado · {ann.targetState}
                {ann.advertiserName ? ` · ${ann.advertiserName}` : ""}
              </p>
              <h3 className="text-sm font-semibold text-brand-ink mt-0.5">{ann.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => void handleDismiss()}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 dark:hover:bg-gray-800"
              aria-label="Cerrar anuncio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-brand-muted mt-1 line-clamp-3">{ann.body}</p>
          {ann.promoCode && (
            <p className="text-xs mt-2 text-brand-ink">
              Código en la web del organizador:{" "}
              <span className="font-mono font-semibold bg-white/80 dark:bg-gray-900 px-2 py-0.5 rounded">
                {ann.promoCode}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={ann.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {ann.ctaLabel || "Ver más"}
            </a>
            <button
              type="button"
              onClick={() => void handleInterest()}
              disabled={interestSent.has(ann.id)}
              className="px-3 py-1.5 text-xs font-medium border border-semantic-info text-semantic-info rounded-lg hover:bg-semantic-info-bg disabled:opacity-60"
            >
              {interestSent.has(ann.id) ? "Interés registrado ✓" : "Me interesa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
