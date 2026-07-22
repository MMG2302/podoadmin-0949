import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { usePermissions } from "../hooks/use-permissions";
import { useEntitlements } from "../hooks/use-entitlements";
import { PremiumUpsellBanner } from "../components/premium/premium-upsell";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/language-context";
import { api } from "../lib/api-client";
import { fetchAllClinicalPages } from "../lib/clinical-list-fetch";
import type { Patient } from "../types/clinical";
import {
  applyCampaignWebMessage,
  buildWaMeUrl,
  filterCampaignWebRecipients,
  parseCampaignFilterJson,
  type CampaignWebRecipient,
} from "../lib/whatsapp-web-link";
import { useTenantCountry } from "../hooks/use-tenant-country";
import {
  whatsappButtonClass,
  whatsappButtonSmClass,
  whatsappButtonXsClass,
  whatsappInputBorderClass,
  whatsappListClass,
  whatsappMutedTextClass,
  whatsappOutlineButtonClass,
  whatsappPanelClass,
  whatsappPanelInnerClass,
} from "../lib/form-field-classes";

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
  const { t } = useLanguage();
  const { canViewWhatsAppWeb, isReceptionist, canConfigureWhatsApp } = usePermissions();
  const { has: hasFeature } = useEntitlements();
  const hasCampaigns = hasFeature("whatsapp_campaigns");
  const { user } = useAuth();
  const tenantCountry = useTenantCountry(user);
  const c = t.whatsapp.campaigns;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patientsLoadError, setPatientsLoadError] = useState(false);
  const [name, setName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [filterClinicOnly, setFilterClinicOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedWebId, setExpandedWebId] = useState<string | null>(null);
  const [webAssistant, setWebAssistant] = useState<{ campaignId: string; index: number } | null>(null);
  const [showApiSection, setShowApiSection] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [canUseApi, setCanUseApi] = useState(false);

  const loadPatients = useCallback(async () => {
    setPatientsLoadError(false);
    try {
      const patientList = await fetchAllClinicalPages<Patient>(
        "/patients",
        "patients",
        () => c.patientsLoadError
      );
      setPatients(patientList);
      setPatientsLoaded(true);
    } catch {
      setPatients([]);
      setPatientsLoaded(true);
      setPatientsLoadError(true);
    }
  }, [c.patientsLoadError]);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, wRes] = await Promise.all([
      api.get<{ success?: boolean; campaigns?: Campaign[] }>("/whatsapp-campaigns"),
      api.get<{ success?: boolean; apiConnected?: boolean; canUseApi?: boolean }>("/integrations/whatsapp/workspace"),
    ]);
    if (cRes.success && cRes.data?.campaigns) setCampaigns(cRes.data.campaigns);
    const connected = Boolean(wRes.data?.apiConnected);
    const apiAccess = Boolean(wRes.data?.canUseApi && connected);
    setApiConnected(connected);
    setCanUseApi(apiAccess);
    if (isReceptionist) {
      setShowApiSection(apiAccess);
    } else {
      setShowApiSection(connected);
    }
    setLoading(false);
  }, [isReceptionist]);

  useEffect(() => {
    if (!canViewWhatsAppWeb || !hasCampaigns) return;
    void load();
    void loadPatients();
  }, [canViewWhatsAppWeb, hasCampaigns, load, loadPatients]);

  const previewRecipients = useMemo(
    () =>
      filterCampaignWebRecipients(patients, {
        clinicOnly: filterClinicOnly,
        userClinicId: user?.clinicId,
        defaultCountry: tenantCountry,
      }),
    [patients, filterClinicOnly, user?.clinicId, tenantCountry]
  );

  const recipientsForCampaign = useCallback(
    (campaign: Campaign): CampaignWebRecipient[] => {
      const { clinicOnly } = parseCampaignFilterJson(campaign.filterJson);
      return filterCampaignWebRecipients(patients, {
        clinicOnly,
        userClinicId: user?.clinicId,
        defaultCountry: tenantCountry,
      });
    },
    [patients, user?.clinicId, tenantCountry]
  );

  const openWaMe = (campaign: Campaign, recipient: CampaignWebRecipient) => {
    const text = applyCampaignWebMessage(campaign.messageBody, recipient);
    window.open(buildWaMeUrl(recipient.waPhone, text), "_blank", "noopener,noreferrer");
  };

  if (!canViewWhatsAppWeb) {
    return (
      <MainLayout title={c.title}>
        <p className="text-brand-muted">{c.denied}</p>
      </MainLayout>
    );
  }

  if (!hasCampaigns) {
    return (
      <MainLayout title={c.title}>
        <PremiumUpsellBanner
          title={t.premium.campaignsLockedTitle}
          body={t.premium.campaignsLockedBody}
        />
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
      setFeedback(c.draftCreated);
      load();
    } else {
      setFeedback(res.error || c.createError);
    }
  };

  const deleteDraft = async (campaign: Campaign) => {
    if (!confirm(c.deleteDraftConfirm.replace("{name}", campaign.name))) return;
    const res = await api.delete<{ success?: boolean }>(`/whatsapp-campaigns/${campaign.id}`);
    if (!res.success) {
      setFeedback(res.error || c.deleteDraftError);
      return;
    }
    if (webAssistant?.campaignId === campaign.id) setWebAssistant(null);
    if (expandedWebId === campaign.id) setExpandedWebId(null);
    setCampaigns((prev) => prev.filter((item) => item.id !== campaign.id));
  };

  const sendCampaignApi = async (id: string) => {
    if (!confirm(c.sendConfirm)) return;
    setSendingId(id);
    const res = await api.post<{ success?: boolean; sent?: number; failed?: number }>(
      `/whatsapp-campaigns/${id}/send`
    );
    setSendingId(null);
    if (res.success && res.data) {
      setFeedback(c.apiSendResult.replace("{sent}", String(res.data.sent ?? 0)).replace("{failed}", String(res.data.failed ?? 0)));
      load();
    } else {
      setFeedback(res.error || c.apiSendError);
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
    <MainLayout title={c.title}>
      <p className="text-sm text-brand-muted mb-4">{c.pageHint}</p>

      {feedback && (
        <div className="mb-4 p-3 bg-semantic-info-bg text-blue-900 dark:text-blue-200 rounded-lg text-sm border border-blue-100 dark:border-blue-900/60">
          {feedback}
        </div>
      )}

      <div className={`${whatsappPanelClass} mb-6 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-brand-ink">{c.webTitle}</h3>
            <p className={`text-sm mt-1 max-w-2xl opacity-90 ${whatsappMutedTextClass}`}>{c.webHint}</p>
          </div>
          <a
            href="https://web.whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 ${whatsappButtonClass}`}
          >
            {c.openWeb}
          </a>
        </div>

        <div className={`${whatsappPanelInnerClass} space-y-3`}>
          <h4 className="text-sm font-medium text-brand-ink">{c.newDraft}</h4>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={c.namePlaceholder}
            className={`w-full px-3 py-2 ${whatsappInputBorderClass} bg-brand-surface text-brand-ink`}
          />
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder={c.messagePlaceholder}
            rows={5}
            className={`w-full px-3 py-2 ${whatsappInputBorderClass} bg-brand-surface text-sm text-brand-ink`}
          />
          <p className="text-xs text-brand-muted">
            {c.variablesHint} {c.variablesList}
          </p>
          <label className="flex items-center gap-2 text-sm text-brand-muted">
            <input
              type="checkbox"
              checked={filterClinicOnly}
              onChange={(e) => setFilterClinicOnly(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            {c.clinicOnlyFilter}
          </label>
          <p className={`text-sm ${whatsappMutedTextClass}`}>
            {c.recipientsWithPhone} <strong>{previewRecipients.length}</strong>
            {previewRecipients.length === 0 && patients.length > 0 && (
              <span className="block text-xs text-amber-700 dark:text-amber-300 mt-1">
                {c.recipientsMismatchHint.replace("{count}", String(patients.length))}
              </span>
            )}
            {patientsLoaded && patients.length === 0 && !loading && (
              <span className="block text-xs text-amber-700 dark:text-amber-300 mt-1">
                {patientsLoadError
                  ? c.patientsLoadFailed
                  : c.noPatientsYet}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={createCampaign}
            disabled={!name.trim() || !messageBody.trim()}
            className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {c.saveDraft}
          </button>
        </div>

        {webAssistant && activeAssistantCampaign && assistantCurrent && (
          <div className={`${whatsappPanelInnerClass} space-y-3`}>
            <p className="text-sm font-medium text-brand-ink">
              {c.assistantTitle.replace("{name}", activeAssistantCampaign.name)}
            </p>
            <p className="text-sm text-brand-muted">
              {c.assistantPatientOf.replace("{current}", String(webAssistant.index + 1)).replace("{total}", String(assistantRecipients.length))}{" "}
              <strong>
                {assistantCurrent.firstName} {assistantCurrent.lastName}
              </strong>{" "}
              · {assistantCurrent.phone}
            </p>
            <p className="text-xs text-brand-muted whitespace-pre-wrap border border-brand-border rounded p-2 max-h-32 overflow-y-auto">
              {applyCampaignWebMessage(activeAssistantCampaign.messageBody, assistantCurrent)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openWaMe(activeAssistantCampaign, assistantCurrent)}
                className={whatsappButtonClass}
              >
                {c.openWhatsApp}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = webAssistant.index + 1;
                  if (next >= assistantRecipients.length) {
                    setWebAssistant(null);
                    setFeedback(c.assistantDone.replace("{count}", String(assistantRecipients.length)));
                  } else {
                    setWebAssistant({ campaignId: webAssistant.campaignId, index: next });
                  }
                }}
                className="px-4 py-2 border border-brand-border rounded-lg text-sm"
              >
                {webAssistant.index + 1 >= assistantRecipients.length ? c.finish : c.nextPatient}
              </button>
              <button
                type="button"
                onClick={() => setWebAssistant(null)}
                className="px-4 py-2 text-sm text-gray-500"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-brand-ink mb-2">{c.draftsToSend}</h4>
          {loading ? (
            <p className="text-sm text-gray-500">{c.loading}</p>
          ) : (
            <ul className={whatsappListClass}>
              {campaigns
                .filter((campaign) => campaign.status === "draft")
                .map((campaign) => {
                  const recipients = recipientsForCampaign(campaign);
                  const expanded = expandedWebId === campaign.id;
                  return (
                    <li key={campaign.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-brand-ink">{campaign.name}</p>
                          <p className="text-sm text-brand-muted line-clamp-2">{campaign.messageBody}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {c.recipientsCount.replace("{count}", String(recipients.length))}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={recipients.length === 0}
                            onClick={() => setWebAssistant({ campaignId: campaign.id, index: 0 })}
                            className={whatsappButtonSmClass}
                          >
                            {c.sendAssistant}
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedWebId(expanded ? null : campaign.id)}
                            className={whatsappOutlineButtonClass}
                          >
                            {expanded ? c.hideList : c.showList}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteDraft(campaign)}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                          >
                            {c.deleteDraft}
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <ul className="mt-4 max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-brand-border rounded-lg">
                          {recipients.length === 0 ? (
                            <li className="p-3 text-sm text-gray-500">{c.noValidRecipients}</li>
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
                                  onClick={() => openWaMe(campaign, r)}
                                  className={whatsappButtonXsClass}
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
              {campaigns.filter((campaign) => campaign.status === "draft").length === 0 && (
                <li className="p-4 text-sm text-gray-500">{c.noDrafts}</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {(canConfigureWhatsApp || canUseApi) && (
      <div className="bg-brand-surface rounded-xl border border-brand-border p-6 mb-6">
        <button
          type="button"
          onClick={() => !isReceptionist && setShowApiSection((v) => !v)}
          className={`w-full flex items-center justify-between text-left ${isReceptionist ? "cursor-default" : ""}`}
        >
          <div>
            <h3 className="font-semibold text-brand-ink">
              {c.metaApiTitle} {apiConnected ? c.connected : c.optional}
            </h3>
            <p className="text-sm text-brand-muted mt-0.5">
              {isReceptionist
                ? c.receptionistApiHint
                : c.metaApiHint}
            </p>
          </div>
          {!isReceptionist && (
            <span className="text-gray-400 text-sm ml-4">{showApiSection ? "▲" : "▼"}</span>
          )}
        </button>

        {showApiSection && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            {!canUseApi ? (
              <p className="text-sm text-gray-500">
                {isReceptionist
                  ? c.receptionistApiDisabled
                  : c.configureApiHint}
              </p>
            ) : (
              <>
            <h4 className="font-semibold mb-3 text-brand-ink">{c.allCampaigns}</h4>
            {loading ? (
              <p className="text-gray-500 text-sm">{c.loading}</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-ink">{campaign.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {campaign.status}
                        {campaign.sentAt
                          ? ` · ${c.sentAt.replace("{date}", new Date(campaign.sentAt).toLocaleString())}`
                          : ""}
                      </p>
                    </div>
                    {campaign.status === "draft" && (
                      <button
                        type="button"
                        disabled={sendingId === campaign.id}
                        onClick={() => sendCampaignApi(campaign.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {sendingId === campaign.id ? c.sending : c.sendByApi}
                      </button>
                    )}
                  </li>
                ))}
                {campaigns.length === 0 && (
                  <li className="py-4 text-sm text-gray-400">{c.noCampaigns}</li>
                )}
              </ul>
            )}
              </>
            )}
          </div>
        )}
      </div>
      )}
    </MainLayout>
  );
};

export default WhatsAppCampaignsPage;
