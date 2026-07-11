import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { api } from "../lib/api-client";
import { MapPin, Plus, Play, Pause, Users } from "lucide-react";

interface Advertiser {
  id: string;
  name: string;
  contactEmail?: string | null;
  status: string;
}

interface Campaign {
  id: string;
  title: string;
  body: string;
  targetCountry: string;
  targetState: string;
  externalUrl: string;
  promoCode?: string | null;
  ctaLabel: string;
  status: string;
  advertiserName?: string | null;
  startsAt: number;
  endsAt: number;
}

const SponsoredAnnouncementsPage = () => {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [audienceEstimate, setAudienceEstimate] = useState<number | null>(null);
  const [form, setForm] = useState({
    advertiserId: "",
    newAdvertiserName: "",
    title: "",
    body: "",
    targetCountry: "MX",
    targetState: "",
    externalUrl: "",
    promoCode: "",
    ctaLabel: "Ver más",
    startsAt: "",
    endsAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [advRes, campRes] = await Promise.all([
      api.get<{ success?: boolean; advertisers?: Advertiser[] }>("/location-announcements/admin/advertisers"),
      api.get<{ success?: boolean; campaigns?: Campaign[] }>("/location-announcements/admin/campaigns"),
    ]);
    if (advRes.success && advRes.data?.advertisers) setAdvertisers(advRes.data.advertisers);
    if (campRes.success && campRes.data?.campaigns) setCampaigns(campRes.data.campaigns);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form.targetState.trim()) {
      setAudienceEstimate(null);
      return;
    }
    const t = setTimeout(async () => {
      const r = await api.get<{ success?: boolean; count?: number }>(
        `/location-announcements/admin/audience-estimate?country=${encodeURIComponent(form.targetCountry)}&state=${encodeURIComponent(form.targetState)}`
      );
      if (r.success) setAudienceEstimate(r.data?.count ?? 0);
    }, 400);
    return () => clearTimeout(t);
  }, [form.targetCountry, form.targetState]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let advertiserId = form.advertiserId;
    if (!advertiserId && form.newAdvertiserName.trim()) {
      const advRes = await api.post<{ success?: boolean; advertiser?: Advertiser }>(
        "/location-announcements/admin/advertisers",
        { name: form.newAdvertiserName.trim() }
      );
      if (!advRes.success || !advRes.data?.advertiser) {
        alert(advRes.error || "No se pudo crear el proveedor");
        return;
      }
      advertiserId = advRes.data.advertiser.id;
    }
    if (!advertiserId) {
      alert("Selecciona o crea un proveedor");
      return;
    }
    const startsAt = form.startsAt ? new Date(form.startsAt).getTime() : Date.now();
    const endsAt = form.endsAt ? new Date(form.endsAt).getTime() : Date.now() + 14 * 24 * 60 * 60 * 1000;
    const res = await api.post("/location-announcements/admin/campaigns", {
      advertiserId,
      title: form.title,
      body: form.body,
      targetCountry: form.targetCountry,
      targetState: form.targetState,
      externalUrl: form.externalUrl,
      promoCode: form.promoCode || undefined,
      ctaLabel: form.ctaLabel,
      startsAt,
      endsAt,
    });
    if (res.success) {
      setShowForm(false);
      setForm((f) => ({ ...f, title: "", body: "", targetState: "", externalUrl: "", promoCode: "" }));
      await load();
    } else {
      alert(res.error || "Error al crear campaña");
    }
  };

  const setStatus = async (id: string, status: string) => {
    const r = await api.post(`/location-announcements/admin/campaigns/${id}/status`, { status });
    if (r.success) await load();
    else alert(r.error || "Error");
  };

  return (
    <MainLayout title="Anuncios patrocinados">
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Anuncios por estado / provincia
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              Campañas pagadas por proveedores externos. Todos los usuarios en la zona ven banner y notificación.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva campaña
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-brand-ink">Nueva campaña</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Proveedor existente</label>
                <select
                  value={form.advertiserId}
                  onChange={(e) => setForm({ ...form, advertiserId: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-sm"
                >
                  <option value="">— Nuevo proveedor —</option>
                  {advertisers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {!form.advertiserId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del proveedor</label>
                  <input
                    value={form.newAdvertiserName}
                    onChange={(e) => setForm({ ...form, newAdvertiserName: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
                    placeholder="Ej: Instituto Podológico"
                  />
                </div>
              )}
            </div>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Título del anuncio"
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
            />
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Descripción (curso, evento, etc.)"
              rows={3}
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                value={form.targetCountry}
                onChange={(e) => setForm({ ...form, targetCountry: e.target.value.toUpperCase() })}
                placeholder="País (MX)"
                className="px-3 py-2 border border-brand-border rounded-lg text-sm"
              />
              <input
                required
                value={form.targetState}
                onChange={(e) => setForm({ ...form, targetState: e.target.value })}
                placeholder="Estado / provincia"
                className="px-3 py-2 border border-brand-border rounded-lg text-sm"
              />
              {audienceEstimate != null && (
                <p className="text-sm text-brand-muted flex items-center gap-1 self-center">
                  <Users className="w-4 h-4" /> ≈ {audienceEstimate} usuarios en zona
                </p>
              )}
            </div>
            <input
              required
              type="url"
              value={form.externalUrl}
              onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              placeholder="URL del anunciante (su web)"
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
            />
            <input
              value={form.promoCode}
              onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
              placeholder="Código descuento en web del anunciante (opcional)"
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="px-3 py-2 border border-brand-border rounded-lg text-sm"
              />
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="px-3 py-2 border border-brand-border rounded-lg text-sm"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium">
              Crear borrador
            </button>
          </form>
        )}

        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-brand-border font-medium text-brand-ink">Campañas</div>
          {loading ? (
            <p className="p-4 text-sm text-brand-muted">Cargando...</p>
          ) : campaigns.length === 0 ? (
            <p className="p-4 text-sm text-brand-muted">Sin campañas aún.</p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {campaigns.map((c) => (
                <li key={c.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-brand-ink">{c.title}</p>
                    <p className="text-xs text-brand-muted mt-1">
                      {c.targetState}, {c.targetCountry} · {c.advertiserName} ·{" "}
                      <span className={
                        c.status === "active" ? "text-green-600" : c.status === "draft" ? "text-gray-500" : "text-amber-600"
                      }>{c.status}</span>
                    </p>
                    {c.promoCode && (
                      <p className="text-xs mt-1">Código anunciante: <code>{c.promoCode}</code></p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {c.status !== "active" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(c.id, "active")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg"
                      >
                        <Play className="w-3 h-3" /> Activar
                      </button>
                    )}
                    {c.status === "active" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(c.id, "paused")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-brand-border rounded-lg"
                      >
                        <Pause className="w-3 h-3" /> Pausar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SponsoredAnnouncementsPage;
