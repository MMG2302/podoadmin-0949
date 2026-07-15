import { translations } from "../src/web/i18n/translations";

function get(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

const critical = [
  "dashboard.title",
  "dashboard.actions",
  "dashboard.actions.calendarDesc",
  "dashboard.actions.addPatientDesc",
  "patients.engagement",
  "patients.engagement.segmentNew",
  "checkout.views",
  "checkout.views.operations",
  "checkout.analytics",
  "checkout.analytics.cash",
  "checkout.agendaAnalytics",
  "settings.profile.title",
  "settings.clinicalLayout.title",
  "settings.dashboardLogo.title",
  "settings.watermark.title",
  "settings.print.title",
  "settings.billing",
  "settings.billing.subscriptionTitle",
  "settings.billing.title",
  "settings.tabs.billing",
  "whatsapp.campaigns.title",
  "whatsapp.messages.title",
  "clinicalTools.title",
  "errorBoundary.title",
  "usersPage.create.title",
  "clinic.title",
  "auditLog.title",
  "securityMetrics.title",
  "supportPage.title",
  "sponsoredAnnouncements.title",
];

for (const lang of ["es", "en", "pt", "fr"] as const) {
  console.log("\n==", lang);
  for (const p of critical) {
    const v = get(translations[lang], p);
    const status = v === undefined ? "MISSING" : typeof v === "object" ? "obj" : JSON.stringify(String(v).slice(0, 40));
    if (v === undefined || status === "MISSING") console.log(" ", p, "MISSING");
  }
}

// Sample crash paths used in dashboard
console.log("\nDashboard actions keys es:", translations.es.dashboard && Object.keys((translations.es.dashboard as any).actions || {}));
console.log("patients keys es sample:", Object.keys(translations.es.patients).slice(0, 20));
console.log("has engagement?", !!(translations.es.patients as any).engagement);
console.log("checkout keys:", Object.keys(translations.es.checkout).slice(0, 30));
console.log("settings keys:", Object.keys(translations.es.settings).slice(0, 40));
