/**
 * Patch translations.ts with remaining settings/checkout/hook i18n keys.
 * node scripts/patch-settings-checkout-i18n.mjs
 */
import fs from "fs";

const path = "src/web/i18n/translations.ts";
let src = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

function mustReplace(label, re, next) {
  if (!re.test(src)) throw new Error(`Missing: ${label}`);
  src = src.replace(re, next);
}

// --- Import ---
mustReplace(
  "import clinical-i18n",
  /import \{ clinicalSharedByLang, type ClinicalLayoutI18n, type PodiatryI18n, type ErrorBoundaryI18n, type ClinicalListI18n, type PatientsClinicalI18n, type SessionsClinicalI18n, type ClinicalToolsExtrasI18n, type CalendarGridI18n \} from '\.\/clinical-i18n';/,
  `import { clinicalSharedByLang, type ClinicalLayoutI18n, type PodiatryI18n, type ErrorBoundaryI18n, type ClinicalListI18n, type PatientsClinicalI18n, type SessionsClinicalI18n, type ClinicalToolsExtrasI18n, type CalendarGridI18n } from './clinical-i18n';
import {
  agendaAnalyticsByLang,
  checkoutAnalyticsByLang,
  type AgendaAnalyticsI18n,
  type CheckoutAnalyticsI18n,
} from './checkout-analytics-i18n';`
);

// --- checkout interface ---
if (!src.includes("analytics: CheckoutAnalyticsI18n")) {
  mustReplace(
    "checkout iface end",
    /tariffLabelPlaceholder: string;\n  \};/,
    `tariffLabelPlaceholder: string;
    tariffAmountAria: string;
    tariffDurationTitle: string;
    tariffDurationAria: string;
    tariffDurationPlaceholder: string;
    serverMigrateHint: string;
    analytics: CheckoutAnalyticsI18n;
    agendaAnalytics: AgendaAnalyticsI18n;
  };`
  );
}

// --- settings interface paint + palette preview + loadingDesigner ---
if (!src.includes("paintColorPicker:")) {
  mustReplace(
    "settings palettePreviewLabels iface",
    /palettePreviewLabels: \{\n      error: string;\n      warning: string;\n      success: string;\n      info: string;\n    \};\n    navMenuTitle: string;/,
    `palettePreviewLabels: {
      error: string;
      warning: string;
      success: string;
      info: string;
    };
    palettePreviewUi: {
      brandShort: string;
      home: string;
      patients: string;
      preview: string;
      sampleCard: string;
      secondaryText: string;
      action: string;
      button: string;
    };
    paletteWhatsappPreviewDesc: string;
    paintColorPicker: {
      ariaLabel: string;
      basicColors: string;
      customColors: string;
      hideCustom: string;
      defineCustom: string;
      colorSolid: string;
      hue: string;
      sat: string;
      lum: string;
      addToCustom: string;
      accept: string;
    };
    navMenuTitle: string;`
  );
}

if (!src.includes("loadingDesigner: string")) {
  mustReplace(
    "clinicalLayout iface loadingDesigner",
    /clinicalLayout: \{\n      title: string;\n      hint: string;/,
    `clinicalLayout: {
      loadingDesigner: string;
      title: string;
      hint: string;`
  );
}

if (!src.includes("receptionistApiEnabled: string")) {
  mustReplace(
    "whatsapp iface receptionistApiEnabled",
    /integrationActive: string;\n    save: string;/,
    `integrationActive: string;
    receptionistApiEnabled: string;
    save: string;`
  );
}

const localeBlocks = {
  es: {
    tariff: `      tariffLabelPlaceholder: "Nombre (ej. Consulta)",
      tariffAmountAria: "Importe",
      tariffDurationTitle: "Duración pauta (minutos)",
      tariffDurationAria: "Duración en minutos",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Error del servidor. Si acabas de actualizar el proyecto, ejecuta npm run db:migrate y reinicia npm run dev.",
      analytics: checkoutAnalyticsByLang.es,
      agendaAnalytics: agendaAnalyticsByLang.es,`,
    tariffOld: /tariffLabelPlaceholder: "Nombre \(ej\. Consulta\)",\n    \},/,
    palette: `      palettePreviewLabels: {
        error: "Error",
        warning: "Advertencia",
        success: "Éxito",
        info: "Info",
      },
      palettePreviewUi: {
        brandShort: "Podo",
        home: "Inicio",
        patients: "Pacientes",
        preview: "Vista previa",
        sampleCard: "Tarjeta de ejemplo",
        secondaryText: "Texto secundario",
        action: "Acción",
        button: "Botón",
      },
      paletteWhatsappPreviewDesc: "Envía mensajes manualmente desde tu número.",
      paintColorPicker: {
        ariaLabel: "Selector de color",
        basicColors: "Colores básicos:",
        customColors: "Colores personalizados:",
        hideCustom: "« Ocultar colores personalizados",
        defineCustom: "Definir colores personalizados »",
        colorSolid: "Color | Sólido",
        hue: "Matiz",
        sat: "Sat.",
        lum: "Lum.",
        addToCustom: "Agregar a personalizados",
        accept: "Aceptar",
      },
      navMenuTitle: "Menú lateral",`,
    paletteOld: /palettePreviewLabels: \{\n        error: "Error",\n        warning: "Advertencia",\n        success: "Éxito",\n        info: "Info",\n      \},\n      navMenuTitle: "Menú lateral",/,
    clinicalLoading: `      clinicalLayout: {
        loadingDesigner: "Cargando diseñador…",
        title: "Diseñador de historia clínica",`,
    clinicalOld: /clinicalLayout: \{\n        title: "Diseñador de historia clínica",/,
    receptionist: `      integrationActive: "Integración activa (envíos habilitados cuando el cron esté activo)",
      receptionistApiEnabled: "Permitir a recepción usar el envío automático por API Meta (recordatorios y historial).",
      save: "Guardar configuración",`,
    receptionistOld:
      /integrationActive: "Integración activa \(envíos habilitados cuando el cron esté activo\)",\n      save: "Guardar configuración",/,
  },
  en: {
    tariff: `      tariffLabelPlaceholder: "Label (e.g. Consultation)",
      tariffAmountAria: "Amount",
      tariffDurationTitle: "Guideline duration (minutes)",
      tariffDurationAria: "Duration in minutes",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Server error. If you just updated the project, run npm run db:migrate and restart npm run dev.",
      analytics: checkoutAnalyticsByLang.en,
      agendaAnalytics: agendaAnalyticsByLang.en,`,
    tariffOld: /tariffLabelPlaceholder: "Label \(e\.g\. Consultation\)",\n    \},/,
    palette: `      palettePreviewLabels: {
        error: "Error",
        warning: "Warning",
        success: "Success",
        info: "Info",
      },
      palettePreviewUi: {
        brandShort: "Podo",
        home: "Home",
        patients: "Patients",
        preview: "Preview",
        sampleCard: "Sample card",
        secondaryText: "Secondary text",
        action: "Action",
        button: "Button",
      },
      paletteWhatsappPreviewDesc: "Send messages manually from your number.",
      paintColorPicker: {
        ariaLabel: "Color picker",
        basicColors: "Basic colors:",
        customColors: "Custom colors:",
        hideCustom: "« Hide custom colors",
        defineCustom: "Define custom colors »",
        colorSolid: "Color | Solid",
        hue: "Hue",
        sat: "Sat.",
        lum: "Lum.",
        addToCustom: "Add to custom",
        accept: "OK",
      },
      navMenuTitle: "Sidebar menu",`,
    paletteOld: /palettePreviewLabels: \{\n        error: "Error",\n        warning: "Warning",\n        success: "Success",\n        info: "Info",\n      \},\n      navMenuTitle: "Sidebar menu",/,
    clinicalLoading: `      clinicalLayout: {
        loadingDesigner: "Loading designer…",
        title: "Clinical history designer",`,
    clinicalOld: /clinicalLayout: \{\n        title: "Clinical history designer",/,
    receptionist: `      integrationActive: "Integration active (sends enabled when cron is active)",
      receptionistApiEnabled: "Allow reception to use automatic Meta API sending (reminders and history).",
      save: "Save settings",`,
    receptionistOld:
      /integrationActive: "Integration active \(sends enabled when cron is active\)",\n      save: "Save settings",/,
  },
  pt: {
    tariff: `      tariffLabelPlaceholder: "Nome (ex. Consulta)",
      tariffAmountAria: "Valor",
      tariffDurationTitle: "Duração da pauta (minutos)",
      tariffDurationAria: "Duração em minutos",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Erro do servidor. Se acabou de atualizar o projeto, execute npm run db:migrate e reinicie npm run dev.",
      analytics: checkoutAnalyticsByLang.pt,
      agendaAnalytics: agendaAnalyticsByLang.pt,`,
    tariffOld: /tariffLabelPlaceholder: "Nome \(ex\. Consulta\)",\n    \},/,
    palette: `      palettePreviewLabels: {
        error: "Erro",
        warning: "Aviso",
        success: "Sucesso",
        info: "Info",
      },
      palettePreviewUi: {
        brandShort: "Podo",
        home: "Início",
        patients: "Pacientes",
        preview: "Prévia",
        sampleCard: "Cartão de exemplo",
        secondaryText: "Texto secundário",
        action: "Ação",
        button: "Botão",
      },
      paletteWhatsappPreviewDesc: "Envie mensagens manualmente a partir do seu número.",
      paintColorPicker: {
        ariaLabel: "Seletor de cor",
        basicColors: "Cores básicas:",
        customColors: "Cores personalizadas:",
        hideCustom: "« Ocultar cores personalizadas",
        defineCustom: "Definir cores personalizadas »",
        colorSolid: "Cor | Sólido",
        hue: "Matiz",
        sat: "Sat.",
        lum: "Lum.",
        addToCustom: "Adicionar aos personalizados",
        accept: "Aceitar",
      },
      navMenuTitle: "Menu lateral",`,
    paletteOld: /palettePreviewLabels: \{\n        error: "Erro",\n        warning: "Aviso",\n        success: "Sucesso",\n        info: "Info",\n      \},\n      navMenuTitle: "Menu lateral",/,
    clinicalLoading: `      clinicalLayout: {
        loadingDesigner: "A carregar o designer…",
        title: "Designer de história clínica",`,
    clinicalOld: /clinicalLayout: \{\n        title: "Designer de história clínica",/,
    receptionist: `      integrationActive: "Integração ativa (envios habilitados quando o cron estiver ativo)",
      receptionistApiEnabled: "Permitir à receção usar o envio automático pela API Meta (lembretes e histórico).",
      save: "Salvar configuração",`,
    receptionistOld:
      /integrationActive: "Integração ativa \(envios habilitados quando o cron estiver ativo\)",\n      save: "Salvar configuração",/,
  },
  fr: {
    tariff: `      tariffLabelPlaceholder: "Libellé (ex. Consultation)",
      tariffAmountAria: "Montant",
      tariffDurationTitle: "Durée indicative (minutes)",
      tariffDurationAria: "Durée en minutes",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Erreur serveur. Si vous venez de mettre à jour le projet, exécutez npm run db:migrate et redémarrez npm run dev.",
      analytics: checkoutAnalyticsByLang.fr,
      agendaAnalytics: agendaAnalyticsByLang.fr,`,
    tariffOld: /tariffLabelPlaceholder: "Libellé \(ex\. Consultation\)",\n    \},/,
    palette: `      palettePreviewLabels: {
        error: "Erreur",
        warning: "Avertissement",
        success: "Succès",
        info: "Info",
      },
      palettePreviewUi: {
        brandShort: "Podo",
        home: "Accueil",
        patients: "Patients",
        preview: "Aperçu",
        sampleCard: "Carte d'exemple",
        secondaryText: "Texte secondaire",
        action: "Action",
        button: "Bouton",
      },
      paletteWhatsappPreviewDesc: "Envoyez des messages manuellement depuis votre numéro.",
      paintColorPicker: {
        ariaLabel: "Sélecteur de couleur",
        basicColors: "Couleurs de base :",
        customColors: "Couleurs personnalisées :",
        hideCustom: "« Masquer les couleurs personnalisées",
        defineCustom: "Définir des couleurs personnalisées »",
        colorSolid: "Couleur | Uni",
        hue: "Teinte",
        sat: "Sat.",
        lum: "Lum.",
        addToCustom: "Ajouter aux personnalisées",
        accept: "OK",
      },
      navMenuTitle: "Menu latéral",`,
    paletteOld: /palettePreviewLabels: \{\n        error: "Erreur",\n        warning: "Avertissement",\n        success: "Succès",\n        info: "Info",\n      \},\n      navMenuTitle: "Menu latéral",/,
    clinicalLoading: `      clinicalLayout: {
        loadingDesigner: "Chargement du concepteur…",
        title: "Concepteur d'histoire clinique",`,
    clinicalOld: /clinicalLayout: \{\n        title: "Concepteur d'histoire clinique",/,
    receptionist: `      integrationActive: "Intégration active (envois activés quand le cron est actif)",
      receptionistApiEnabled: "Autoriser la réception à utiliser l'envoi automatique via l'API Meta (rappels et historique).",
      save: "Enregistrer",`,
    receptionistOld:
      /integrationActive: "Intégration active \(envois activés quand le cron est actif\)",\n      save: "Enregistrer",/,
  },
};

for (const [lang, b] of Object.entries(localeBlocks)) {
  if (!src.includes(`analytics: checkoutAnalyticsByLang.${lang}`)) {
    mustReplace(`${lang} tariff`, b.tariffOld, b.tariff + "\n    },");
  }
  if (!src.includes(lang === "es" ? 'palettePreviewUi: {\n        brandShort: "Podo",\n        home: "Inicio"' : `paintColorPicker:`)) {
    // safer: only if paintColorPicker not yet in that locale slice
  }
}

// Palette / paint / clinical / receptionist — apply if paintColorPicker missing near each locale
for (const [lang, b] of Object.entries(localeBlocks)) {
  const marker =
    lang === "es"
      ? 'paintColorPicker: {\n        ariaLabel: "Selector de color"'
      : lang === "en"
        ? 'paintColorPicker: {\n        ariaLabel: "Color picker"'
        : lang === "pt"
          ? 'paintColorPicker: {\n        ariaLabel: "Seletor de cor"'
          : 'paintColorPicker: {\n        ariaLabel: "Sélecteur de couleur"';
  if (!src.includes(marker)) {
    mustReplace(`${lang} palette`, b.paletteOld, b.palette);
  }
  if (!src.includes(b.clinicalLoading.split("\n")[1].trim())) {
    mustReplace(`${lang} clinicalLoading`, b.clinicalOld, b.clinicalLoading);
  }
  if (!src.includes("receptionistApiEnabled:")) {
    // first locale only would fail — check per locale string
  }
  const recvMarker =
    lang === "es"
      ? "Permitir a recepción usar el envío automático por API Meta"
      : lang === "en"
        ? "Allow reception to use automatic Meta API sending"
        : lang === "pt"
          ? "Permitir à receção usar o envio automático pela API Meta"
          : "Autoriser la réception à utiliser l'envoi automatique via l'API Meta";
  if (!src.includes(recvMarker)) {
    mustReplace(`${lang} receptionist`, b.receptionistOld, b.receptionist);
  }
}

fs.writeFileSync(path, src);
console.log("Patched", path);
