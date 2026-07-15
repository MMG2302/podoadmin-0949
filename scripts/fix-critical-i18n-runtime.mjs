/**
 * Restores runtime i18n keys that crash the app (dashboard.actions, patients.engagement,
 * checkout.views, clinic/auditLog/securityMetrics/supportPage/sponsoredAnnouncements, etc.)
 * Run: node scripts/fix-critical-i18n-runtime.mjs
 */
import fs from "fs";

const path = "src/web/i18n/translations.ts";
let src = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

function mustReplace(label, re, next) {
  if (!re.test(src)) throw new Error(`Missing marker: ${label}`);
  src = src.replace(re, next);
}

function insertOnce(label, needle, insert, { before = true } = {}) {
  if (src.includes(insert.trim().slice(0, 40))) {
    console.log(`skip (already): ${label}`);
    return;
  }
  const i = src.indexOf(needle);
  if (i < 0) throw new Error(`Needle not found: ${label}`);
  src = before
    ? src.slice(0, i) + insert + src.slice(i)
    : src.slice(0, i + needle.length) + insert + src.slice(i + needle.length);
}

// ─── Interface: common ───
if (!src.includes("seeAll: string;")) {
  mustReplace(
    "common iface",
    /captcha: string;\n  };/,
    `captcha: string;
    seeAll: string;
    seeAllShort: string;
  };`
  );
}

// ─── Interface: checkout views + hints ───
if (!src.includes("views: {\n      operations: string;")) {
  mustReplace(
    "checkout iface views",
    /serverMigrateHint: string;\n    analytics: CheckoutAnalyticsI18n;/,
    `serverMigrateHint: string;
    views: {
      operations: string;
      sales: string;
      collections: string;
      profit: string;
      agenda: string;
    };
    viewHintOperations: string;
    viewHintAgenda: string;
    viewHintCollections: string;
    viewHintProfit: string;
    viewHintClinicSales: string;
    viewHintSales: string;
    viewDataOf: string;
    entireClinic: string;
    podiatristLabel: string;
    analytics: CheckoutAnalyticsI18n;`
  );
}

// ─── Interface: dashboard ───
if (!src.includes("actions: {\n      addPatientDesc: string;")) {
  mustReplace(
    "dashboard iface",
    /draftActivity: string;\n  };/,
    `draftActivity: string;
    podiatrists: string;
    clinicAdmins: string;
    sponsoredAnnouncements: string;
    systemUsers: string;
    assignedClinic: string;
    assignedPodiatrists: string;
    attendedAppointments: string;
    agendaOccupancy: string;
    salesThisMonth: string;
    pendingCollections: string;
    newPatients: string;
    inactivePatients: string;
    podiatristsCount: string;
    last30Days: string;
    relativeMinutesAgo: string;
    relativeHoursAgo: string;
    relativeYesterday: string;
    relativeDaysAgo: string;
    actions: {
      addPatientDesc: string;
      newSessionDesc: string;
      calendarDesc: string;
      settingsDesc: string;
      clinicDesc: string;
      patientsDesc: string;
      sessionsDesc: string;
      checkoutDesc: string;
      usersDesc: string;
      securityDesc: string;
      sponsoredDesc: string;
    };
  };`
  );
}

// ─── Interface: patients.engagement ───
if (!src.includes("engagement: {\n      segmentNew: string;")) {
  mustReplace(
    "patients engagement iface",
    /totalSessions: string;\n  };/,
    `totalSessions: string;
    engagement: {
      segmentNew: string;
      segmentRecurrent: string;
      segmentRecovered: string;
      inactive3m: string;
      inactive6m: string;
      ageAll: string;
      age0_17: string;
      age18_35: string;
      age36_55: string;
      age56Plus: string;
      ltvDay: string;
      ltvWeek: string;
      ltvMonth: string;
      ltvYear: string;
      ltvLifetime: string;
      visitSingular: string;
      visitPlural: string;
      paymentSingular: string;
      paymentPlural: string;
      noSessions: string;
      daysInactive: string;
      daysWithoutVisit: string;
      lastAgoDays: string;
      minVisits: string;
      maxVisits: string;
      ltvLabel: string;
      ltvPeriodAria: string;
      agendaDemandTitle: string;
      agendaDemandHint: string;
      goToCheckoutAgenda: string;
      tablePatient: string;
      tableAge: string;
      tableSegment: string;
      yearsSuffix: string;
    };
  };`
  );
}

// ─── Interface: settings.billing.title ───
if (!src.includes("billing: {\n      title: string;")) {
  mustReplace(
    "billing title iface",
    /billing: \{\n      subscriptionTitle: string;/,
    `billing: {
      title: string;
      subscriptionTitle: string;`
  );
}

// ─── Interface: page namespaces ───
const pageNamespacesIface = `
  // Clinic management page
  clinic: {
    title: string;
    tabOverview: string;
    tabPodiatrists: string;
    tabPatients: string;
    tabReceptionists: string;
    statPodiatrists: string;
    statTotalPatients: string;
    statSessionsThisMonth: string;
    vsPreviousMonth: string;
    agendaTitle: string;
    agendaSubtitle: string;
    allPodiatrists: string;
    attended: string;
    noShow: string;
    noShowRateOfResolved: string;
    cancelled: string;
    cancellationRate: string;
    pending: string;
    demandTitle: string;
    demandHint: string;
    openCheckoutAgenda: string;
    attendedPerDay: string;
    loadingAgendaMetrics: string;
    activityByPodiatrist: string;
    sessionsCount: string;
    podiatristsLimit: string;
    podiatristsNoLimit: string;
    createPodiatrist: string;
    colPodiatrist: string;
    colEmail: string;
    colLicense: string;
    colPatients: string;
    colSessionsMonth: string;
    licenseNotRegistered: string;
    noPodiatrists: string;
    totalIndexed: string;
    searchPatientPlaceholder: string;
    activityAll: string;
    visitsRangeChip: string;
    loadingPatients: string;
    colPhone: string;
    colVisits: string;
    colAssignedPodiatrist: string;
    colLastSession: string;
    colActions: string;
    reassign: string;
    noPatientsFound: string;
    receptionistsHint: string;
    receptionistsActive: string;
    createReceptionist: string;
    colName: string;
    colAssignedPodiatrists: string;
    unassigned: string;
    podiatristsAction: string;
    unblock: string;
    block: string;
    enable: string;
    disable: string;
    noReceptionists: string;
    reassignTitle: string;
    reassignUseCase: string;
    currentPodiatrist: string;
    newPodiatrist: string;
    selectPodiatrist: string;
    unknownPodiatrist: string;
    createPodiatristSubtitle: string;
    initialPasswordMin8: string;
    createReceptionistSubtitle: string;
    initialPassword: string;
    assignedPodiatristsTitle: string;
    noPodiatristsInClinic: string;
    confirmDeleteReceptionist: string;
    maxActiveReceptionists: string;
    emailTaken: string;
    createReceptionistError: string;
    saveAssignmentError: string;
    createPodiatristError: string;
    passwordMin8: string;
  };

  // Audit log (admin)
  auditLog: {
    title: string;
    actionLabels: {
      LOGIN_SUCCESS: string;
      LOGIN_FAILED: string;
      LOGOUT: string;
      PASSWORD_CHANGED: string;
      PASSWORD_RESET_REJECTED: string;
      PASSWORD_RESET_APPROVED: string;
      PASSWORD_RESET_COMPLETED: string;
      PASSWORD_RESET_REQUESTED: string;
      CREATE: string;
      CREATE_USER: string;
      UPDATE: string;
      DELETE: string;
      DELETE_USER: string;
      COMPLETE: string;
      EXPORT: string;
      PRINT: string;
      UPDATE_DRAFT: string;
      REASSIGN: string;
      TRANSFER: string;
      ADD_CREDITS: string;
      SUBTRACT_CREDITS: string;
      ADMIN_CREDIT_ADJUSTMENT: string;
      ALERT_MULTIPLE_PRINT_VIOLATIONS: string;
      PRINT_VIOLATION_FORM: string;
    };
    entityLabels: {
      authentication: string;
      session: string;
      patient: string;
      prescription: string;
      reassignment: string;
      credit: string;
      user: string;
      user_data: string;
      clinic: string;
      professional_info: string;
      professional_credentials: string;
      logo: string;
      message: string;
      clinical_history: string;
      receptionist: string;
      registration_list: string;
      support_conversation: string;
    };
    filters: {
      title: string;
      clear: string;
      search: string;
      allActions: string;
      allTypes: string;
      allUsers: string;
      from: string;
      to: string;
    };
    empty: {
      title: string;
      description: string;
    };
    totalRecords: string;
    actionTypes: string;
    entityTypes: string;
    activeUsers: string;
    topUsers: string;
    recordsCount: string;
    ofTotal: string;
    fullDetails: string;
    userLinkedHint: string;
    userLabel: string;
    userIdLabel: string;
    logIdLabel: string;
    resourceIdLabel: string;
    pageOf: string;
    summaries: {
      loginSuccess: string;
      loginSuccessEmail: string;
      with2fa: string;
      without2fa: string;
      logout: string;
      passwordChanged: string;
      loginFailed: string;
      loginFailedEmail: string;
      passwordResetRejected: string;
      passwordResetApproved: string;
      passwordResetCompleted: string;
      passwordResetRequested: string;
      patientPrefix: string;
      userPrefix: string;
      clinicPrefix: string;
    };
  };

  // Security metrics (super_admin)
  securityMetrics: {
    title: string;
    subtitle: string;
    last24h: string;
    last7days: string;
    last30days: string;
    refresh: string;
    loadError: string;
    criticalEvents: string;
    failedLogins: string;
    unreadAlerts: string;
    summaryByType: string;
    loading: string;
    noEventsInPeriod: string;
    activeAlerts: string;
    noSystemAlerts: string;
    recentAccessGeo: string;
    date: string;
    event: string;
    userRole: string;
    ip: string;
    location: string;
    noAccessYet: string;
    loginOk: string;
    loginFailed: string;
    recentFailedLogins: string;
    emailDetail: string;
    noRecentRecords: string;
    attemptNumber: string;
    metricLabels: {
      failed_login: string;
      successful_login: string;
      twoFaFailed: string;
      captcha_failed: string;
      suspicious_activity: string;
    };
  };

  // Support page admin extras
  supportPage: {
    title: string;
    adminSubtitle: string;
    tabMessages: string;
    tabLists: string;
    conversations: string;
    noConversations: string;
    selectConversation: string;
    supportAgent: string;
    registrationLists: string;
    newList: string;
    newListNamePlaceholder: string;
    listsEmptyHint: string;
    deleteList: string;
    deleteListConfirm: string;
    createListError: string;
    defaultListName: string;
    invalidEmail: string;
    downloadCsv: string;
    markPaidToExport: string;
    submitForApproval: string;
    addEntry: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    roleIndependent: string;
    roleClinicAdmin: string;
    podiatristLimitLabel: string;
    podiatristLimitPlaceholder: string;
    add: string;
    clinicAdminLimitHint: string;
    noEntries: string;
    paid: string;
    unpaid: string;
    pendingPayment: string;
    paidSection: string;
    selectOrCreateList: string;
    statusDraft: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
    limitPodiatrists: string;
  };

  // Sponsored announcements admin
  sponsoredAnnouncements: {
    title: string;
    heading: string;
    subtitle: string;
    newCampaign: string;
    formTitle: string;
    existingAdvertiser: string;
    newAdvertiserOption: string;
    advertiserName: string;
    advertiserNamePlaceholder: string;
    titlePlaceholder: string;
    bodyPlaceholder: string;
    countryPlaceholder: string;
    statePlaceholder: string;
    audienceEstimate: string;
    externalUrlPlaceholder: string;
    promoCodePlaceholder: string;
    createDraft: string;
    campaigns: string;
    loading: string;
    noCampaigns: string;
    advertiserCode: string;
    activate: string;
    pause: string;
    createAdvertiserError: string;
    selectOrCreateAdvertiser: string;
    createCampaignError: string;
    statusError: string;
    statusActive: string;
    statusDraft: string;
    statusPaused: string;
    defaultCta: string;
  };
`;

if (!src.includes("\n  auditLog: {")) {
  insertOnce(
    "page namespaces iface",
    "\n}\n\nexport const translations:",
    pageNamespacesIface
  );
}

// ─── Locale value helpers ───
const commonExtra = {
  es: `      captcha: "CAPTCHA",
      seeAll: "Ver todos",
      seeAllShort: "Ver todo",
    },`,
  en: `      captcha: "CAPTCHA",
      seeAll: "See all",
      seeAllShort: "See all",
    },`,
  pt: `      captcha: "CAPTCHA",
      seeAll: "Ver todos",
      seeAllShort: "Ver tudo",
    },`,
  fr: `      captcha: "CAPTCHA",
      seeAll: "Tout voir",
      seeAllShort: "Tout voir",
    },`,
};

const commonOld = {
  es: `      captcha: "CAPTCHA",
    },`,
  en: `      captcha: "CAPTCHA",
    },`,
  pt: `      captcha: "CAPTCHA",
    },`,
  fr: `      captcha: "CAPTCHA",
    },`,
};

const dashboardExtra = {
  es: {
    after: `      draftActivity: "Borrador",
    },`,
    block: `      draftActivity: "Borrador",
      podiatrists: "Podólogos",
      clinicAdmins: "Admins de clínica",
      sponsoredAnnouncements: "Anuncios patrocinados",
      systemUsers: "Usuarios del sistema",
      assignedClinic: "Clínica asignada",
      assignedPodiatrists: "Podólogos asignados",
      attendedAppointments: "Citas atendidas",
      agendaOccupancy: "Ocupación de agenda",
      salesThisMonth: "Ventas del mes",
      pendingCollections: "Cobros pendientes",
      newPatients: "Pacientes nuevos",
      inactivePatients: "Pacientes inactivos",
      podiatristsCount: "Podólogos",
      last30Days: "Últimos 30 días",
      relativeMinutesAgo: "Hace menos de 1 hora",
      relativeHoursAgo: "Hace {n} h",
      relativeYesterday: "Ayer",
      relativeDaysAgo: "Hace {n} días",
      actions: {
        addPatientDesc: "Registrar un nuevo paciente",
        newSessionDesc: "Abrir una sesión clínica",
        calendarDesc: "Ver y gestionar la agenda",
        settingsDesc: "Configurar tu espacio de trabajo",
        clinicDesc: "Gestionar podólogos, pacientes y recepción",
        patientsDesc: "Consultar y filtrar pacientes",
        sessionsDesc: "Revisar historial de sesiones",
        checkoutDesc: "Cobros, ventas y agenda",
        usersDesc: "Administrar usuarios de la plataforma",
        securityDesc: "Métricas y alertas de seguridad",
        sponsoredDesc: "Campañas geolocalizadas",
      },
    },`,
  },
  en: {
    after: `      draftActivity: "Draft",
    },`,
    block: `      draftActivity: "Draft",
      podiatrists: "Podiatrists",
      clinicAdmins: "Clinic admins",
      sponsoredAnnouncements: "Sponsored announcements",
      systemUsers: "System users",
      assignedClinic: "Assigned clinic",
      assignedPodiatrists: "Assigned podiatrists",
      attendedAppointments: "Appointments attended",
      agendaOccupancy: "Agenda occupancy",
      salesThisMonth: "Sales this month",
      pendingCollections: "Pending collections",
      newPatients: "New patients",
      inactivePatients: "Inactive patients",
      podiatristsCount: "Podiatrists",
      last30Days: "Last 30 days",
      relativeMinutesAgo: "Less than 1 hour ago",
      relativeHoursAgo: "{n}h ago",
      relativeYesterday: "Yesterday",
      relativeDaysAgo: "{n} days ago",
      actions: {
        addPatientDesc: "Register a new patient",
        newSessionDesc: "Start a clinical session",
        calendarDesc: "View and manage the calendar",
        settingsDesc: "Configure your workspace",
        clinicDesc: "Manage podiatrists, patients and reception",
        patientsDesc: "Browse and filter patients",
        sessionsDesc: "Review session history",
        checkoutDesc: "Collections, sales and agenda",
        usersDesc: "Manage platform users",
        securityDesc: "Security metrics and alerts",
        sponsoredDesc: "Geolocated campaigns",
      },
    },`,
  },
  pt: {
    after: `      draftActivity: "Rascunho",
    },`,
    block: `      draftActivity: "Rascunho",
      podiatrists: "Podólogos",
      clinicAdmins: "Admins de clínica",
      sponsoredAnnouncements: "Anúncios patrocinados",
      systemUsers: "Utilizadores do sistema",
      assignedClinic: "Clínica atribuída",
      assignedPodiatrists: "Podólogos atribuídos",
      attendedAppointments: "Consultas atendidas",
      agendaOccupancy: "Ocupação da agenda",
      salesThisMonth: "Vendas do mês",
      pendingCollections: "Cobranças pendentes",
      newPatients: "Pacientes novos",
      inactivePatients: "Pacientes inativos",
      podiatristsCount: "Podólogos",
      last30Days: "Últimos 30 dias",
      relativeMinutesAgo: "Há menos de 1 hora",
      relativeHoursAgo: "Há {n} h",
      relativeYesterday: "Ontem",
      relativeDaysAgo: "Há {n} dias",
      actions: {
        addPatientDesc: "Registar um novo paciente",
        newSessionDesc: "Abrir uma sessão clínica",
        calendarDesc: "Ver e gerir a agenda",
        settingsDesc: "Configurar o espaço de trabalho",
        clinicDesc: "Gerir podólogos, pacientes e receção",
        patientsDesc: "Consultar e filtrar pacientes",
        sessionsDesc: "Rever histórico de sessões",
        checkoutDesc: "Cobranças, vendas e agenda",
        usersDesc: "Administrar utilizadores da plataforma",
        securityDesc: "Métricas e alertas de segurança",
        sponsoredDesc: "Campanhas geolocalizadas",
      },
    },`,
  },
  fr: {
    after: `      draftActivity: "Brouillon",
    },`,
    block: `      draftActivity: "Brouillon",
      podiatrists: "Podologues",
      clinicAdmins: "Admins de clinique",
      sponsoredAnnouncements: "Annonces sponsorisées",
      systemUsers: "Utilisateurs du système",
      assignedClinic: "Clinique assignée",
      assignedPodiatrists: "Podologues assignés",
      attendedAppointments: "Rendez-vous honorés",
      agendaOccupancy: "Occupation de l'agenda",
      salesThisMonth: "Ventes du mois",
      pendingCollections: "Encaissements en attente",
      newPatients: "Nouveaux patients",
      inactivePatients: "Patients inactifs",
      podiatristsCount: "Podologues",
      last30Days: "30 derniers jours",
      relativeMinutesAgo: "Il y a moins d'1 heure",
      relativeHoursAgo: "Il y a {n} h",
      relativeYesterday: "Hier",
      relativeDaysAgo: "Il y a {n} jours",
      actions: {
        addPatientDesc: "Enregistrer un nouveau patient",
        newSessionDesc: "Ouvrir une séance clinique",
        calendarDesc: "Voir et gérer l'agenda",
        settingsDesc: "Configurer votre espace de travail",
        clinicDesc: "Gérer podologues, patients et réception",
        patientsDesc: "Consulter et filtrer les patients",
        sessionsDesc: "Revoir l'historique des séances",
        checkoutDesc: "Encaissements, ventes et agenda",
        usersDesc: "Administrer les utilisateurs",
        securityDesc: "Métriques et alertes de sécurité",
        sponsoredDesc: "Campagnes géolocalisées",
      },
    },`,
  },
};

// Fix French/Portuguese draftActivity if different - check
function patchDashboard(lang) {
  const d = dashboardExtra[lang];
  if (src.includes(`actions: {\n        addPatientDesc:`)) {
    // may already be partial - check per lang
  }
  if (!src.includes(d.after) && !src.includes(d.block.slice(0, 60))) {
    // try alternate draft strings
    const alts = {
      es: null,
      en: [`      draftActivity: "Draft",\n    },`],
      pt: [`      draftActivity: "Rascunho",\n    },`, `      draftActivity: "Draft",\n    },`],
      fr: [`      draftActivity: "Brouillon",\n    },`, `      draftActivity: "Draft",\n    },`],
    };
    let found = false;
    const tryList = [d.after, ...(alts[lang] || [])];
    for (const old of tryList) {
      if (old && src.includes(old) && !src.includes("addPatientDesc:")) {
        // Only replace first occurrence in this language block - use replace once carefully
        // Better: find language-scoped
        found = true;
        break;
      }
    }
  }
}

const engagement = {
  es: `
      engagement: {
        segmentNew: "Nuevos",
        segmentRecurrent: "Recurrentes",
        segmentRecovered: "Recuperados",
        inactive3m: "Inactivos 3 meses",
        inactive6m: "Inactivos 6 meses",
        ageAll: "Todas las edades",
        age0_17: "0–17 años",
        age18_35: "18–35 años",
        age36_55: "36–55 años",
        age56Plus: "56+ años",
        ltvDay: "Día",
        ltvWeek: "Semana",
        ltvMonth: "Mes",
        ltvYear: "Año",
        ltvLifetime: "Histórico",
        visitSingular: "visita",
        visitPlural: "visitas",
        paymentSingular: "cobro",
        paymentPlural: "cobros",
        noSessions: "Sin sesiones",
        daysInactive: "{n} días inactivo",
        daysWithoutVisit: "{n} días sin visita",
        lastAgoDays: "Última hace {n} días",
        minVisits: "Mín. visitas",
        maxVisits: "Máx. visitas",
        ltvLabel: "LTV",
        ltvPeriodAria: "Periodo de valor de vida del paciente",
        agendaDemandTitle: "Demanda de agenda",
        agendaDemandHint: "Revisa horas pico, ocupación y cierre diario en Cobros → Agenda.",
        goToCheckoutAgenda: "Ir a Cobros → Agenda",
        tablePatient: "Paciente",
        tableAge: "Edad",
        tableSegment: "Segmento",
        yearsSuffix: "años",
      },`,
  en: `
      engagement: {
        segmentNew: "New",
        segmentRecurrent: "Recurring",
        segmentRecovered: "Recovered",
        inactive3m: "Inactive 3 months",
        inactive6m: "Inactive 6 months",
        ageAll: "All ages",
        age0_17: "0–17 years",
        age18_35: "18–35 years",
        age36_55: "36–55 years",
        age56Plus: "56+ years",
        ltvDay: "Day",
        ltvWeek: "Week",
        ltvMonth: "Month",
        ltvYear: "Year",
        ltvLifetime: "Lifetime",
        visitSingular: "visit",
        visitPlural: "visits",
        paymentSingular: "payment",
        paymentPlural: "payments",
        noSessions: "No sessions",
        daysInactive: "{n} days inactive",
        daysWithoutVisit: "{n} days without a visit",
        lastAgoDays: "Last {n} days ago",
        minVisits: "Min visits",
        maxVisits: "Max visits",
        ltvLabel: "LTV",
        ltvPeriodAria: "Patient lifetime value period",
        agendaDemandTitle: "Agenda demand",
        agendaDemandHint: "Review peak hours, occupancy and daily close in Checkout → Agenda.",
        goToCheckoutAgenda: "Go to Checkout → Agenda",
        tablePatient: "Patient",
        tableAge: "Age",
        tableSegment: "Segment",
        yearsSuffix: "years",
      },`,
  pt: `
      engagement: {
        segmentNew: "Novos",
        segmentRecurrent: "Recorrentes",
        segmentRecovered: "Recuperados",
        inactive3m: "Inativos 3 meses",
        inactive6m: "Inativos 6 meses",
        ageAll: "Todas as idades",
        age0_17: "0–17 anos",
        age18_35: "18–35 anos",
        age36_55: "36–55 anos",
        age56Plus: "56+ anos",
        ltvDay: "Dia",
        ltvWeek: "Semana",
        ltvMonth: "Mês",
        ltvYear: "Ano",
        ltvLifetime: "Histórico",
        visitSingular: "visita",
        visitPlural: "visitas",
        paymentSingular: "cobrança",
        paymentPlural: "cobranças",
        noSessions: "Sem sessões",
        daysInactive: "{n} dias inativo",
        daysWithoutVisit: "{n} dias sem visita",
        lastAgoDays: "Última há {n} dias",
        minVisits: "Mín. visitas",
        maxVisits: "Máx. visitas",
        ltvLabel: "LTV",
        ltvPeriodAria: "Período do valor de vida do paciente",
        agendaDemandTitle: "Procura da agenda",
        agendaDemandHint: "Veja horas de pico, ocupação e fecho diário em Cobranças → Agenda.",
        goToCheckoutAgenda: "Ir a Cobranças → Agenda",
        tablePatient: "Paciente",
        tableAge: "Idade",
        tableSegment: "Segmento",
        yearsSuffix: "anos",
      },`,
  fr: `
      engagement: {
        segmentNew: "Nouveaux",
        segmentRecurrent: "Récurrents",
        segmentRecovered: "Récupérés",
        inactive3m: "Inactifs 3 mois",
        inactive6m: "Inactifs 6 mois",
        ageAll: "Tous les âges",
        age0_17: "0–17 ans",
        age18_35: "18–35 ans",
        age36_55: "36–55 ans",
        age56Plus: "56+ ans",
        ltvDay: "Jour",
        ltvWeek: "Semaine",
        ltvMonth: "Mois",
        ltvYear: "Année",
        ltvLifetime: "Historique",
        visitSingular: "visite",
        visitPlural: "visites",
        paymentSingular: "paiement",
        paymentPlural: "paiements",
        noSessions: "Aucune séance",
        daysInactive: "{n} jours inactif",
        daysWithoutVisit: "{n} jours sans visite",
        lastAgoDays: "Dernière il y a {n} jours",
        minVisits: "Visites min.",
        maxVisits: "Visites max.",
        ltvLabel: "LTV",
        ltvPeriodAria: "Période de valeur vie patient",
        agendaDemandTitle: "Demande d'agenda",
        agendaDemandHint: "Consultez heures de pointe, occupation et clôture dans Encaissements → Agenda.",
        goToCheckoutAgenda: "Aller à Encaissements → Agenda",
        tablePatient: "Patient",
        tableAge: "Âge",
        tableSegment: "Segment",
        yearsSuffix: "ans",
      },`,
};

const checkoutViews = {
  es: `
      views: {
        operations: "Operaciones",
        sales: "Ventas",
        collections: "Cobros",
        profit: "Rentabilidad",
        agenda: "Agenda",
      },
      viewHintOperations: "Cola de cobros pendientes y completados.",
      viewHintAgenda: "Ocupación, demanda, horario y cierre diario de caja.",
      viewHintCollections: "Cobrado vs pendiente, métodos de pago y cuentas por cobrar.",
      viewHintProfit: "Metas, gastos y margen estimado.",
      viewHintClinicSales: "Ventas agregadas de toda la clínica.",
      viewHintSales: "Ingresos, ticket medio y desglose por servicio.",
      viewDataOf: "Datos de",
      entireClinic: "Toda la clínica",
      podiatristLabel: "Podólogo",
      analytics: checkoutAnalyticsByLang.es,`,
  en: `
      views: {
        operations: "Operations",
        sales: "Sales",
        collections: "Collections",
        profit: "Profit",
        agenda: "Agenda",
      },
      viewHintOperations: "Pending and completed payment queue.",
      viewHintAgenda: "Occupancy, demand, schedule and daily cash close.",
      viewHintCollections: "Paid vs pending, payment methods and receivables.",
      viewHintProfit: "Goals, expenses and estimated margin.",
      viewHintClinicSales: "Aggregated clinic-wide sales.",
      viewHintSales: "Revenue, average ticket and service breakdown.",
      viewDataOf: "Data for",
      entireClinic: "Entire clinic",
      podiatristLabel: "Podiatrist",
      analytics: checkoutAnalyticsByLang.en,`,
  pt: `
      views: {
        operations: "Operações",
        sales: "Vendas",
        collections: "Cobranças",
        profit: "Rentabilidade",
        agenda: "Agenda",
      },
      viewHintOperations: "Fila de cobranças pendentes e concluídas.",
      viewHintAgenda: "Ocupação, procura, horário e fecho diário de caixa.",
      viewHintCollections: "Cobrado vs pendente, métodos de pagamento e contas a receber.",
      viewHintProfit: "Metas, despesas e margem estimada.",
      viewHintClinicSales: "Vendas agregadas de toda a clínica.",
      viewHintSales: "Receitas, ticket médio e detalhe por serviço.",
      viewDataOf: "Dados de",
      entireClinic: "Toda a clínica",
      podiatristLabel: "Podólogo",
      analytics: checkoutAnalyticsByLang.pt,`,
  fr: `
      views: {
        operations: "Opérations",
        sales: "Ventes",
        collections: "Encaissements",
        profit: "Rentabilité",
        agenda: "Agenda",
      },
      viewHintOperations: "File d'encaissements en attente et terminés.",
      viewHintAgenda: "Occupation, demande, horaires et clôture de caisse.",
      viewHintCollections: "Encaissé vs en attente, modes de paiement et créances.",
      viewHintProfit: "Objectifs, dépenses et marge estimée.",
      viewHintClinicSales: "Ventes agrégées de toute la clinique.",
      viewHintSales: "Revenus, ticket moyen et détail par service.",
      viewDataOf: "Données de",
      entireClinic: "Toute la clinique",
      podiatristLabel: "Podologue",
      analytics: checkoutAnalyticsByLang.fr,`,
};

const billingTitle = {
  es: { old: `      billing: {\n        subscriptionTitle: "Suscripción PodoAdmin",`, neu: `      billing: {\n        title: "Facturación",\n        subscriptionTitle: "Suscripción PodoAdmin",` },
  en: { old: `      billing: {\n        subscriptionTitle: "PodoAdmin subscription",`, neu: `      billing: {\n        title: "Billing",\n        subscriptionTitle: "PodoAdmin subscription",` },
  pt: { old: `      billing: {\n        subscriptionTitle: "Assinatura PodoAdmin",`, neu: `      billing: {\n        title: "Faturação",\n        subscriptionTitle: "Assinatura PodoAdmin",` },
  fr: { old: `      billing: {\n        subscriptionTitle: "Abonnement PodoAdmin",`, neu: `      billing: {\n        title: "Facturation",\n        subscriptionTitle: "Abonnement PodoAdmin",` },
};

// Load clinic blocks from patch-pages style (with title)
function clinicBlock(lang) {
  const titles = { es: "Gestión de clínica", en: "Clinic management", pt: "Gestão da clínica", fr: "Gestion de la clinique" };
  const bodies = {
    es: clinicEsBody,
    en: clinicEnBody,
    pt: clinicPtBody,
    fr: clinicFrBody,
  };
  return `
    clinic: {
      title: ${JSON.stringify(titles[lang])},
${bodies[lang]}
    },`;
}

const clinicEsBody = `      tabOverview: "Resumen",
      tabPodiatrists: "Podólogos",
      tabPatients: "Pacientes",
      tabReceptionists: "Recepcionistas",
      statPodiatrists: "Podólogos",
      statTotalPatients: "Total Pacientes",
      statSessionsThisMonth: "Sesiones este mes",
      vsPreviousMonth: "% vs. mes anterior",
      agendaTitle: "Agenda (últimos 30 días)",
      agendaSubtitle: "Pacientes atendidos, no-show y cancelaciones registradas en el calendario",
      allPodiatrists: "Todos los podólogos",
      attended: "Atendidos",
      noShow: "No asistieron",
      noShowRateOfResolved: "{n}% del total resuelto",
      cancelled: "Canceladas",
      cancellationRate: "Tasa cancelación: {n}%",
      pending: "Pendientes",
      demandTitle: "Demanda de agenda",
      demandHint: "Total demanda (30 días): {n} citas. Detalle de horas pico, ocupación y cierre diario en Cobros → Agenda.",
      openCheckoutAgenda: "Abrir Cobros → Agenda",
      attendedPerDay: "Atendidos por día",
      loadingAgendaMetrics: "Cargando métricas de agenda…",
      activityByPodiatrist: "Actividad por podólogo",
      sessionsCount: "{n} sesiones",
      podiatristsLimit: "Podólogos: {current} de {limit} (límite definido por PodoAdmin)",
      podiatristsNoLimit: "Podólogos de la clínica. Sin límite definido.",
      createPodiatrist: "Crear podólogo",
      colPodiatrist: "Podólogo",
      colEmail: "Email",
      colLicense: "Licencia",
      colPatients: "Pacientes",
      colSessionsMonth: "Sesiones (mes)",
      licenseNotRegistered: "No registrada",
      noPodiatrists: "No hay podólogos en esta clínica",
      totalIndexed: "Total indexados",
      searchPatientPlaceholder: "Buscar paciente (nombre, email, teléfono)...",
      activityAll: "Actividad: todos",
      visitsRangeChip: "Visitas {min}–{max}",
      loadingPatients: "Cargando pacientes…",
      colPhone: "Teléfono",
      colVisits: "Visitas",
      colAssignedPodiatrist: "Podólogo asignado",
      colLastSession: "Última sesión",
      colActions: "Acciones",
      reassign: "Reasignar",
      noPatientsFound: "No se encontraron pacientes",
      receptionistsHint: "Las recepcionistas tienen acceso sin créditos a crear pacientes, crear y editar citas en el calendario de los podólogos que les asignes.",
      receptionistsActive: "Activas: {active} / {max}. Deben cambiar la contraseña en el primer inicio de sesión.",
      createReceptionist: "Crear recepcionista",
      colName: "Nombre",
      colAssignedPodiatrists: "Podólogos asignados",
      unassigned: "Sin asignar",
      podiatristsAction: "Podólogos",
      unblock: "Desbloquear",
      block: "Bloquear",
      enable: "Habilitar",
      disable: "Deshabilitar",
      noReceptionists: "No hay recepcionistas. Crear una para que gestione citas y pacientes de los podólogos de la clínica.",
      reassignTitle: "Reasignar paciente",
      reassignUseCase: "Caso de uso: Cuando un podólogo no puede atender citas por ausencia o indisponibilidad, puede reasignar sus pacientes a otro profesional de la clínica.",
      currentPodiatrist: "Podólogo actual",
      newPodiatrist: "Nuevo podólogo asignado",
      selectPodiatrist: "Seleccionar podólogo...",
      unknownPodiatrist: "Desconocido",
      createPodiatristSubtitle: "El nuevo podólogo será asignado a tu clínica.",
      initialPasswordMin8: "Contraseña inicial (mín. 8 caracteres)",
      createReceptionistSubtitle: "Se asignarán todos los podólogos de la clínica. Deberá cambiar la contraseña en su primer acceso.",
      initialPassword: "Contraseña inicial",
      assignedPodiatristsTitle: "Podólogos asignados",
      noPodiatristsInClinic: "No hay podólogos en la clínica.",
      confirmDeleteReceptionist: "¿Eliminar a la recepcionista {name} ({email})? Esta acción no se puede deshacer.",
      maxActiveReceptionists: "Máximo {max} recepcionistas activas en la clínica.",
      emailTaken: "Ya existe una cuenta con este correo electrónico",
      createReceptionistError: "Error al crear recepcionista",
      saveAssignmentError: "Error al guardar asignación",
      createPodiatristError: "Error al crear podólogo",
      passwordMin8: "La contraseña debe tener al menos 8 caracteres",`;

const clinicEnBody = `      tabOverview: "Overview",
      tabPodiatrists: "Podiatrists",
      tabPatients: "Patients",
      tabReceptionists: "Receptionists",
      statPodiatrists: "Podiatrists",
      statTotalPatients: "Total patients",
      statSessionsThisMonth: "Sessions this month",
      vsPreviousMonth: "% vs. previous month",
      agendaTitle: "Agenda (last 30 days)",
      agendaSubtitle: "Patients seen, no-shows and cancellations recorded in the calendar",
      allPodiatrists: "All podiatrists",
      attended: "Attended",
      noShow: "No-shows",
      noShowRateOfResolved: "{n}% of resolved total",
      cancelled: "Cancelled",
      cancellationRate: "Cancellation rate: {n}%",
      pending: "Pending",
      demandTitle: "Agenda demand",
      demandHint: "Total demand (30 days): {n} appointments. Peak hours, occupancy and daily close details are in Checkout → Agenda.",
      openCheckoutAgenda: "Open Checkout → Agenda",
      attendedPerDay: "Attended per day",
      loadingAgendaMetrics: "Loading agenda metrics…",
      activityByPodiatrist: "Activity by podiatrist",
      sessionsCount: "{n} sessions",
      podiatristsLimit: "Podiatrists: {current} of {limit} (limit set by PodoAdmin)",
      podiatristsNoLimit: "Clinic podiatrists. No limit defined.",
      createPodiatrist: "Create podiatrist",
      colPodiatrist: "Podiatrist",
      colEmail: "Email",
      colLicense: "License",
      colPatients: "Patients",
      colSessionsMonth: "Sessions (month)",
      licenseNotRegistered: "Not registered",
      noPodiatrists: "No podiatrists in this clinic",
      totalIndexed: "Total indexed",
      searchPatientPlaceholder: "Search patient (name, email, phone)...",
      activityAll: "Activity: all",
      visitsRangeChip: "Visits {min}–{max}",
      loadingPatients: "Loading patients…",
      colPhone: "Phone",
      colVisits: "Visits",
      colAssignedPodiatrist: "Assigned podiatrist",
      colLastSession: "Last session",
      colActions: "Actions",
      reassign: "Reassign",
      noPatientsFound: "No patients found",
      receptionistsHint: "Receptionists can create patients and create/edit appointments on the calendars of assigned podiatrists, without using credits.",
      receptionistsActive: "Active: {active} / {max}. They must change the password on first sign-in.",
      createReceptionist: "Create receptionist",
      colName: "Name",
      colAssignedPodiatrists: "Assigned podiatrists",
      unassigned: "Unassigned",
      podiatristsAction: "Podiatrists",
      unblock: "Unblock",
      block: "Block",
      enable: "Enable",
      disable: "Disable",
      noReceptionists: "No receptionists. Create one to manage appointments and patients for clinic podiatrists.",
      reassignTitle: "Reassign patient",
      reassignUseCase: "Use case: When a podiatrist cannot take appointments due to absence or unavailability, you can reassign their patients to another professional at the clinic.",
      currentPodiatrist: "Current podiatrist",
      newPodiatrist: "New assigned podiatrist",
      selectPodiatrist: "Select podiatrist...",
      unknownPodiatrist: "Unknown",
      createPodiatristSubtitle: "The new podiatrist will be assigned to your clinic.",
      initialPasswordMin8: "Initial password (min. 8 characters)",
      createReceptionistSubtitle: "All clinic podiatrists will be assigned. They must change the password on first access.",
      initialPassword: "Initial password",
      assignedPodiatristsTitle: "Assigned podiatrists",
      noPodiatristsInClinic: "No podiatrists in the clinic.",
      confirmDeleteReceptionist: "Delete receptionist {name} ({email})? This cannot be undone.",
      maxActiveReceptionists: "Maximum {max} active receptionists in the clinic.",
      emailTaken: "An account with this email already exists",
      createReceptionistError: "Error creating receptionist",
      saveAssignmentError: "Error saving assignment",
      createPodiatristError: "Error creating podiatrist",
      passwordMin8: "Password must be at least 8 characters",`;

const clinicPtBody = clinicEsBody
  .replace(/"Resumen"/, '"Resumo"')
  .replace(/"Total Pacientes"/, '"Total de pacientes"')
  .replace(/"Sesiones este mes"/, '"Sessões este mês"')
  .replace(/% vs\. mes anterior/, "% vs. mês anterior")
  .replace(/últimos 30 días/, "últimos 30 dias")
  .replace(/Pacientes atendidos, no-show y cancelaciones registradas en el calendario/, "Pacientes atendidos, faltas e cancelamentos registados no calendário")
  .replace(/"Todos los podólogos"/g, '"Todos os podólogos"')
  .replace(/"No asistieron"/, '"Faltaram"')
  .replace(/del total resuelto/, "do total resolvido")
  .replace(/"Canceladas"/, '"Canceladas"')
  .replace(/Tasa cancelación/, "Taxa de cancelamento")
  .replace(/"Demanda de agenda"/, '"Procura da agenda"')
  .replace(/Total demanda \(30 días\): \{n\} citas\. Detalle de horas pico, ocupación y cierre diario en Cobros → Agenda\./, "Procura total (30 dias): {n} consultas. Detalhe de horas de pico, ocupação e fecho diário em Cobranças → Agenda.")
  .replace(/Abrir Cobros → Agenda/, "Abrir Cobranças → Agenda")
  .replace(/"Atendidos por día"/, '"Atendidos por dia"')
  .replace(/Cargando métricas de agenda…/, "A carregar métricas da agenda…")
  .replace(/"Actividad por podólogo"/, '"Atividade por podólogo"')
  .replace(/sesiones"/g, 'sessões"')
  .replace(/de \{limit\} \(límite definido por PodoAdmin\)/, "de {limit} (limite definido pela PodoAdmin)")
  .replace(/Sin límite definido\./, "Sem limite definido.")
  .replace(/"Crear podólogo"/g, '"Criar podólogo"')
  .replace(/"Licencia"/, '"Licença"')
  .replace(/"Sesiones \(mes\)"/, '"Sessões (mês)"')
  .replace(/"No registrada"/, '"Não registada"')
  .replace(/No hay podólogos en esta clínica/, "Não há podólogos nesta clínica")
  .replace(/"Total indexados"/, '"Total indexados"')
  .replace(/Buscar paciente \(nombre, email, teléfono\)\.\.\./, "Pesquisar paciente (nome, email, telefone)...")
  .replace(/"Actividad: todos"/, '"Atividade: todos"')
  .replace(/Cargando pacientes…/, "A carregar pacientes…")
  .replace(/"Teléfono"/, '"Telefone"')
  .replace(/"Podólogo asignado"/, '"Podólogo atribuído"')
  .replace(/"Última sesión"/, '"Última sessão"')
  .replace(/"Acciones"/g, '"Ações"')
  .replace(/"Reasignar"/g, '"Reatribuir"')
  .replace(/No se encontraron pacientes/, "Nenhum paciente encontrado")
  .replace(/Las recepcionistas tienen acceso sin créditos a crear pacientes, crear y editar citas en el calendario de los podólogos que les asignes\./, "As recepcionistas têm acesso sem créditos para criar pacientes e criar/editar consultas no calendário dos podólogos que lhes atribuir.")
  .replace(/Activas: \{active\} \/ \{max\}\. Deben cambiar la contraseña en el primer inicio de sesión\./, "Ativas: {active} / {max}. Devem alterar a palavra-passe no primeiro início de sessão.")
  .replace(/"Crear recepcionista"/g, '"Criar recepcionista"')
  .replace(/"Nombre"/, '"Nome"')
  .replace(/"Podólogos asignados"/g, '"Podólogos atribuídos"')
  .replace(/"Sin asignar"/, '"Sem atribuição"')
  .replace(/"Desbloquear"/, '"Desbloquear"')
  .replace(/"Bloquear"/, '"Bloquear"')
  .replace(/"Habilitar"/, '"Ativar"')
  .replace(/"Deshabilitar"/, '"Desativar"')
  .replace(/No hay recepcionistas\. Crear una para que gestione citas y pacientes de los podólogos de la clínica\./, "Não há recepcionistas. Crie uma para gerir consultas e pacientes dos podólogos da clínica.")
  .replace(/"Reasignar paciente"/, '"Reatribuir paciente"')
  .replace(/Caso de uso: Cuando un podólogo no puede atender citas por ausencia o indisponibilidad, puede reasignar sus pacientes a otro profesional de la clínica\./, "Caso de uso: Quando um podólogo não pode atender por ausência ou indisponibilidade, pode reatribuir os pacientes a outro profissional da clínica.")
  .replace(/"Podólogo actual"/, '"Podólogo atual"')
  .replace(/"Nuevo podólogo asignado"/, '"Novo podólogo atribuído"')
  .replace(/Seleccionar podólogo\.\.\./, "Selecionar podólogo...")
  .replace(/"Desconocido"/, '"Desconhecido"')
  .replace(/El nuevo podólogo será asignado a tu clínica\./, "O novo podólogo será atribuído à sua clínica.")
  .replace(/Contraseña inicial \(mín\. 8 caracteres\)/, "Palavra-passe inicial (mín. 8 caracteres)")
  .replace(/Se asignarán todos los podólogos de la clínica\. Deberá cambiar la contraseña en su primer acceso\./, "Serão atribuídos todos os podólogos da clínica. Deverá alterar a palavra-passe no primeiro acesso.")
  .replace(/"Contraseña inicial"/, '"Palavra-passe inicial"')
  .replace(/No hay podólogos en la clínica\./, "Não há podólogos na clínica.")
  .replace(/¿Eliminar a la recepcionista \{name\} \(\{email\}\)\? Esta acción no se puede deshacer\./, "Eliminar a recepcionista {name} ({email})? Esta ação não pode ser desfeita.")
  .replace(/Máximo \{max\} recepcionistas activas en la clínica\./, "Máximo de {max} recepcionistas ativas na clínica.")
  .replace(/Ya existe una cuenta con este correo electrónico/, "Já existe uma conta com este email")
  .replace(/Error al crear recepcionista/, "Erro ao criar recepcionista")
  .replace(/Error al guardar asignación/, "Erro ao guardar atribuição")
  .replace(/Error al crear podólogo/, "Erro ao criar podólogo")
  .replace(/La contraseña debe tener al menos 8 caracteres/, "A palavra-passe deve ter pelo menos 8 caracteres");

const clinicFrBody = `      tabOverview: "Aperçu",
      tabPodiatrists: "Podologues",
      tabPatients: "Patients",
      tabReceptionists: "Réceptionnistes",
      statPodiatrists: "Podologues",
      statTotalPatients: "Total patients",
      statSessionsThisMonth: "Séances ce mois",
      vsPreviousMonth: "% vs. mois précédent",
      agendaTitle: "Agenda (30 derniers jours)",
      agendaSubtitle: "Patients vus, absences et annulations enregistrées dans le calendrier",
      allPodiatrists: "Tous les podologues",
      attended: "Vus",
      noShow: "Absents",
      noShowRateOfResolved: "{n}% du total résolu",
      cancelled: "Annulés",
      cancellationRate: "Taux d'annulation : {n}%",
      pending: "En attente",
      demandTitle: "Demande d'agenda",
      demandHint: "Demande totale (30 jours) : {n} rendez-vous. Détail des heures de pointe, occupation et clôture quotidienne dans Encaissements → Agenda.",
      openCheckoutAgenda: "Ouvrir Encaissements → Agenda",
      attendedPerDay: "Vus par jour",
      loadingAgendaMetrics: "Chargement des métriques d'agenda…",
      activityByPodiatrist: "Activité par podologue",
      sessionsCount: "{n} séances",
      podiatristsLimit: "Podologues : {current} sur {limit} (limite définie par PodoAdmin)",
      podiatristsNoLimit: "Podologues de la clinique. Aucune limite définie.",
      createPodiatrist: "Créer un podologue",
      colPodiatrist: "Podologue",
      colEmail: "E-mail",
      colLicense: "Licence",
      colPatients: "Patients",
      colSessionsMonth: "Séances (mois)",
      licenseNotRegistered: "Non enregistrée",
      noPodiatrists: "Aucun podologue dans cette clinique",
      totalIndexed: "Total indexés",
      searchPatientPlaceholder: "Rechercher un patient (nom, e-mail, téléphone)...",
      activityAll: "Activité : tous",
      visitsRangeChip: "Visites {min}–{max}",
      loadingPatients: "Chargement des patients…",
      colPhone: "Téléphone",
      colVisits: "Visites",
      colAssignedPodiatrist: "Podologue assigné",
      colLastSession: "Dernière séance",
      colActions: "Actions",
      reassign: "Réassigner",
      noPatientsFound: "Aucun patient trouvé",
      receptionistsHint: "Les réceptionnistes peuvent créer des patients et créer/modifier des rendez-vous sur les calendriers des podologues assignés, sans utiliser de crédits.",
      receptionistsActive: "Actives : {active} / {max}. Elles doivent changer le mot de passe à la première connexion.",
      createReceptionist: "Créer une réceptionniste",
      colName: "Nom",
      colAssignedPodiatrists: "Podologues assignés",
      unassigned: "Non assigné",
      podiatristsAction: "Podologues",
      unblock: "Débloquer",
      block: "Bloquer",
      enable: "Activer",
      disable: "Désactiver",
      noReceptionists: "Aucune réceptionniste. Créez-en une pour gérer les rendez-vous et patients des podologues de la clinique.",
      reassignTitle: "Réassigner le patient",
      reassignUseCase: "Cas d'usage : lorsqu'un podologue ne peut pas assurer les rendez-vous en raison d'une absence ou indisponibilité, vous pouvez réassigner ses patients à un autre professionnel de la clinique.",
      currentPodiatrist: "Podologue actuel",
      newPodiatrist: "Nouveau podologue assigné",
      selectPodiatrist: "Sélectionner un podologue...",
      unknownPodiatrist: "Inconnu",
      createPodiatristSubtitle: "Le nouveau podologue sera assigné à votre clinique.",
      initialPasswordMin8: "Mot de passe initial (min. 8 caractères)",
      createReceptionistSubtitle: "Tous les podologues de la clinique seront assignés. Le mot de passe devra être changé au premier accès.",
      initialPassword: "Mot de passe initial",
      assignedPodiatristsTitle: "Podologues assignés",
      noPodiatristsInClinic: "Aucun podologue dans la clinique.",
      confirmDeleteReceptionist: "Supprimer la réceptionniste {name} ({email}) ? Cette action est irréversible.",
      maxActiveReceptionists: "Maximum {max} réceptionnistes actives dans la clinique.",
      emailTaken: "Un compte avec cet e-mail existe déjà",
      createReceptionistError: "Erreur lors de la création de la réceptionniste",
      saveAssignmentError: "Erreur lors de l'enregistrement de l'assignation",
      createPodiatristError: "Erreur lors de la création du podologue",
      passwordMin8: "Le mot de passe doit comporter au moins 8 caractères",`;

// Reuse namespaces from _tmp_i18n_inject (auditLog etc.) - read file content via dynamic import of string in locales
function pageNamespacesValues(lang) {
  // Pull from the inject script content by evaluating known structure - inline condensed
  const titles = {
    es: {
      audit: "Registro de auditoría",
      security: "Métricas de seguridad",
      support: "Soporte",
      sponsored: "Anuncios patrocinados",
    },
    en: {
      audit: "Audit log",
      security: "Security metrics",
      support: "Support",
      sponsored: "Sponsored announcements",
    },
    pt: {
      audit: "Log de auditoria",
      security: "Métricas de segurança",
      support: "Suporte",
      sponsored: "Anúncios patrocinados",
    },
    fr: {
      audit: "Journal d'audit",
      security: "Métriques de sécurité",
      support: "Support",
      sponsored: "Annonces sponsorisées",
    },
  };
  const t = titles[lang];
  // Import full namespace strings from tmp inject by reading and extracting - simplest: exec extract
  return null; // filled below after reading inject
}

// Apply common (only first occurrence per lang is tricky - captcha appears once per locale near start)
for (const lang of ["es", "en", "pt", "fr"]) {
  if (!src.includes(`seeAll:`)) {
    // replace all 4 - use replaceAll carefully: each captcha closing is unique enough once per locale
  }
}

// Replace each captcha block once - there should be 4 identical? en/es same "CAPTCHA"
// Use scoped replace via language starts
function localeBounds(lang) {
  const starts = { es: "\n  es: {", en: "\n  en: {", pt: "\n  pt: {", fr: "\n  fr: {" };
  const ends = {
    es: "\n  en: {",
    en: "\n  pt: {",
    pt: "\n  fr: {",
    fr: "\n};\n\nexport const languageNames",
  };
  const a = src.indexOf(starts[lang]);
  const b = src.indexOf(ends[lang], a + 1);
  if (a < 0 || b < 0) throw new Error(`locale bounds ${lang}`);
  return { a, b, slice: src.slice(a, b) };
}

function replaceInLocale(lang, oldStr, newStr, label) {
  const { a, b, slice } = localeBounds(lang);
  if (!slice.includes(oldStr)) {
    if (slice.includes(newStr.trim().slice(0, 30)) || (label.includes("dashboard") && slice.includes("addPatientDesc:"))) {
      console.log(`skip ${label} ${lang}`);
      return;
    }
    throw new Error(`${label} missing in ${lang}`);
  }
  const nextSlice = slice.replace(oldStr, newStr);
  src = src.slice(0, a) + nextSlice + src.slice(b);
}

// Apply locale patches
for (const lang of ["es", "en", "pt", "fr"]) {
  replaceInLocale(lang, commonOld[lang], commonExtra[lang], "common seeAll");

  // dashboard: find draftActivity closing
  const dashMarkers = {
    es: [`      draftActivity: "Borrador",\n    },`],
    en: [`      draftActivity: "Draft",\n    },`],
    pt: [`      draftActivity: "Rascunho",\n    },`, `      draftActivity: "Borrador",\n    },`],
    fr: [`      draftActivity: "Brouillon",\n    },`, `      draftActivity: "Borrador",\n    },`],
  };
  let applied = false;
  for (const old of dashMarkers[lang]) {
    const { slice } = localeBounds(lang);
    if (slice.includes("addPatientDesc:")) {
      applied = true;
      break;
    }
    if (slice.includes(old)) {
      replaceInLocale(lang, old, dashboardExtra[lang].block, "dashboard");
      applied = true;
      break;
    }
  }
  if (!applied) {
    // probe actual draftActivity line
    const { slice } = localeBounds(lang);
    const m = slice.match(/      draftActivity: "[^"]*",\n    },/);
    if (!m) throw new Error(`dashboard draftActivity not found in ${lang}`);
    replaceInLocale(lang, m[0], dashboardExtra[lang].block, "dashboard-probe");
  }

  // patients engagement before sessions
  const totalSessions = {
    es: `      totalSessions: "Total de sesiones",\n    },\n    sessions: {`,
    en: `      totalSessions: "Total Sessions",\n    },\n    sessions: {`,
    pt: `      totalSessions: "Total de Sessões",\n    },\n    sessions: {`,
    fr: `      totalSessions: "Total des Séances",\n    },\n    sessions: {`,
  };
  const engInsert = {
    es: `      totalSessions: "Total de sesiones",${engagement.es}\n    },\n    sessions: {`,
    en: `      totalSessions: "Total Sessions",${engagement.en}\n    },\n    sessions: {`,
    pt: `      totalSessions: "Total de Sessões",${engagement.pt}\n    },\n    sessions: {`,
    fr: `      totalSessions: "Total des Séances",${engagement.fr}\n    },\n    sessions: {`,
  };
  {
    const { slice } = localeBounds(lang);
    if (!slice.includes("segmentNew:")) {
      replaceInLocale(lang, totalSessions[lang], engInsert[lang], "engagement");
    } else console.log(`skip engagement ${lang}`);
  }

  // checkout views - replace analytics line assignment
  const analyticsLine = {
    es: `      analytics: checkoutAnalyticsByLang.es,`,
    en: `      analytics: checkoutAnalyticsByLang.en,`,
    pt: `      analytics: checkoutAnalyticsByLang.pt,`,
    fr: `      analytics: checkoutAnalyticsByLang.fr,`,
  };
  {
    const { slice } = localeBounds(lang);
    if (!slice.includes("views: {")) {
      replaceInLocale(lang, analyticsLine[lang], checkoutViews[lang].trimStart(), "checkout views");
    } else console.log(`skip checkout views ${lang}`);
  }

  // billing title
  {
    const { slice } = localeBounds(lang);
    if (!slice.includes('billing: {\n        title:')) {
      replaceInLocale(lang, billingTitle[lang].old, billingTitle[lang].neu, "billing title");
    } else console.log(`skip billing title ${lang}`);
  }
}

// Insert page namespaces before terms in each locale - load from inject file
const injectPath = "_tmp_i18n_inject.mjs";
const injectSrc = fs.readFileSync(injectPath, "utf8").replace(/\r\n/g, "\n");

function extractNamespaces(lang) {
  // Find `namespaces: \`...`,\n  },` inside localeBlocks for lang
  const marker = lang === "es"
    ? "es: {\n    notificationsExtra:"
    : `${lang}: {\n    notificationsExtra:`;
  // Better: find namespaces: ` within that lang block of localeBlocks
  const langIdx = injectSrc.indexOf(`\n  ${lang}: {`);
  if (langIdx < 0) throw new Error(`inject lang ${lang}`);
  const nsIdx = injectSrc.indexOf("namespaces: `", langIdx);
  if (nsIdx < 0) throw new Error(`namespaces in inject ${lang}`);
  const start = nsIdx + "namespaces: `".length;
  const end = injectSrc.indexOf("`,\n  },", start);
  if (end < 0) {
    // try alternate
    const end2 = injectSrc.indexOf("`,\n  },\n  en:", start);
    const end3 = injectSrc.indexOf("`,\n  },\n  pt:", start);
    const end4 = injectSrc.indexOf("`,\n  },\n  fr:", start);
    const end5 = injectSrc.indexOf("`,\n  },\n};", start);
    const candidates = [end2, end3, end4, end5].filter((x) => x > start);
    if (!candidates.length) throw new Error(`ns end ${lang}`);
    return injectSrc.slice(start, Math.min(...candidates));
  }
  return injectSrc.slice(start, end);
}

function withTitles(ns, lang) {
  const titles = {
    es: { auditLog: "Registro de auditoría", securityMetrics: "Métricas de seguridad", supportPage: "Soporte", clinic: "Gestión de clínica" },
    en: { auditLog: "Audit log", securityMetrics: "Security metrics", supportPage: "Support", clinic: "Clinic management" },
    pt: { auditLog: "Log de auditoria", securityMetrics: "Métricas de segurança", supportPage: "Suporte", clinic: "Gestão da clínica" },
    fr: { auditLog: "Journal d'audit", securityMetrics: "Métriques de sécurité", supportPage: "Support", clinic: "Gestion de la clinique" },
  };
  const t = titles[lang];
  let out = ns;
  // Prepend clinic block + title fields into auditLog/securityMetrics/supportPage
  out = out.replace(
    "    auditLog: {\n      actionLabels:",
    `    auditLog: {\n      title: ${JSON.stringify(t.auditLog)},\n      actionLabels:`
  );
  out = out.replace(
    "    securityMetrics: {\n      subtitle:",
    `    securityMetrics: {\n      title: ${JSON.stringify(t.securityMetrics)},\n      subtitle:`
  );
  out = out.replace(
    "    supportPage: {\n      adminSubtitle:",
    `    supportPage: {\n      title: ${JSON.stringify(t.supportPage)},\n      adminSubtitle:`
  );
  return clinicBlock(lang) + "\n" + out;
}

const messagingClose = {
  es: `      fromAdmin: "Mensaje del Administrador",\n    },\n    terms: {`,
  en: `      fromAdmin: "Admin Message",\n    },\n    terms: {`,
  pt: `      fromAdmin: "Mensagem do Administrador",\n    },\n    terms: {`,
  fr: `      fromAdmin: "Message de l'Administrateur",\n    },\n    terms: {`,
};

for (const lang of ["es", "en", "pt", "fr"]) {
  const { slice } = localeBounds(lang);
  if (slice.includes("\n    auditLog: {")) {
    console.log(`skip page namespaces ${lang}`);
    continue;
  }
  const ns = withTitles(extractNamespaces(lang), lang);
  const neu = `      fromAdmin: ${messagingClose[lang].match(/fromAdmin: "[^"]*"/)[0].slice("fromAdmin: ".length)},\n    },\n${ns}    terms: {`;
  // Fix neu construction
  const fromAdminLine = messagingClose[lang].split("\n")[0];
  const neu2 = `${fromAdminLine}\n    },\n${ns}    terms: {`;
  replaceInLocale(lang, messagingClose[lang], neu2, "page namespaces");
}

fs.writeFileSync(path, src);
console.log("Fixed critical i18n. lines=", src.split("\n").length);
console.log({
  dashboardActions: src.includes("addPatientDesc:"),
  engagement: src.includes("segmentNew:"),
  views: src.includes("operations: \"Operaciones\"") || src.includes('operations: "Operations"'),
  auditLog: src.includes("\n  auditLog: {") || src.includes("\n    auditLog: {"),
  billingTitle: src.includes('title: "Facturación"') || src.includes('title: "Billing"'),
});
