import { clinicalSharedByLang, type ClinicalLayoutI18n, type PodiatryI18n, type ErrorBoundaryI18n, type ClinicalListI18n, type PatientsClinicalI18n, type SessionsClinicalI18n, type ClinicalToolsExtrasI18n, type CalendarGridI18n } from './clinical-i18n';
import {
  agendaAnalyticsByLang,
  checkoutAnalyticsByLang,
  type AgendaAnalyticsI18n,
  type CheckoutAnalyticsI18n,
} from './checkout-analytics-i18n';
export type Language = "es" | "en" | "pt" | "fr";

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    export: string;
    print: string;
    back: string;
    next: string;
    previous: string;
    confirm: string;
    close: string;
    yes: string;
    no: string;
    actions: string;
    status: string;
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    description: string;
    details: string;
    view: string;
    download: string;
    showPassword: string;
    hidePassword: string;
    showShort: string;
    hideShort: string;
    captcha: string;
    seeAll: string;
    seeAllShort: string;
    viewMore: string;
    go: string;
  };
  
  // Auth
  auth: {
    login: string;
    logout: string;
    welcome: string;
    welcomeBack: string;
    enterCredentials: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailHint: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
    loggingIn: string;
    invalidCredentials: string;
    loginError: string;
    tooManyAttempts: string;
    accountTemporarilyBlocked: string;
    testCredentials: string;
    superAdmin: string;
    podiatrist: string;
    loggedInAs: string;
    sessionExpired: string;
    // Registration
    register: string;
    registerTitle: string;
    registerSubtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    clinicCodeLabel: string;
    clinicCodePlaceholder: string;
    clinicCodeHint: string;
    passwordRequirements: string;
    passwordMinLength: string;
    passwordMustContain: string;
    passwordUppercase: string;
    passwordLowercase: string;
    passwordNumber: string;
    passwordSpecial: string;
    termsAccept: string;
    termsLink: string;
    privacyAccept: string;
    privacyLink: string;
    registerButton: string;
    registering: string;
    alreadyHaveAccount: string;
    goToLogin: string;
    dontHaveAccount: string;
    contactAdminForAccount: string;
    registrationSuccess: string;
    registrationSuccessMessage: string;
    registrationSuccessDevMessage: string;
    checkEmail: string;
    emailAlreadyRegistered: string;
    // Email Verification
    verifyEmail: string;
    verifyEmailTitle: string;
    verifyEmailSubtitle: string;
    verifyEmailSuccess: string;
    verifyEmailSuccessMessage: string;
    verifyEmailError: string;
    verifyEmailExpired: string;
    resendVerification: string;
    // CAPTCHA
    captchaRequired: string;
    captchaError: string;
    captchaNotConfigured: string;
    captchaDisabledInDev: string;
    // OAuth
    orContinueWith: string;
    loginWithGoogle: string;
    loginWithApple: string;
    // Forgot / Reset password
    forgotPassword: string;
    forgotPasswordTitle: string;
    forgotPasswordSubtitle: string;
    forgotPasswordButton: string;
    forgotPasswordSuccess: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    newPasswordLabel: string;
    resetPasswordButton: string;
    resetPasswordSuccess: string;
    backToLogin: string;
    // Forgot/Reset password errors (fallbacks for API/network)
    forgotPasswordErrorRequest: string;
    forgotPasswordErrorConnection: string;
    resetPasswordInvalidLink: string;
    resetPasswordPasswordsMismatch: string;
    resetPasswordMissingToken: string;
    resetPasswordErrorReset: string;
    resetPasswordErrorConnection: string;
    resetPasswordRedirecting: string;
    resetPasswordRepeatPassword: string;
    resetPasswordHint: string;
    requestNewLink: string;
    // Change password (first login)
    changePasswordTitle: string;
    changePasswordSubtitle: string;
    currentPasswordLabel: string;
    changePasswordButton: string;
    changePasswordSuccess: string;
    changePasswordRedirecting: string;
    contactToVerifyRecovery: string;
    // Login security notices (anti-phishing)
    securityLabel: string;
    loginOnlyOnOfficialDomainWithDomain: string;
    loginOnlyOnOfficialDomainGeneric: string;
    notOnOfficialDomain: string;
    notOnOfficialDomainNoDomain: string;
    failedAttempts: string;
    blockedUntil: string;
    retryIn: string;
    emailNotificationSent: string;
    googleNotConfigured: string;
    googleConnectFailed: string;
    googleNoCode: string;
    googleLoginError: string;
    googleCompleting: string;
    serverConnectionError: string;
    connectionErrorShort: string;
    changePasswordCurrentRequired: string;
    changePasswordError: string;
    verifyEmailMissingToken: string;
    verifyEmailFailed: string;
    recoveryVerifySubject: string;
  };
  
  // Terms and Conditions
  terms: {
    title: string;
    lastUpdated: string;
    lastUpdatedDate: string;
    backToRegister: string;
    acceptAndContinue: string;
    back: string;
    section1: {
      title: string;
      content: string;
    };
    section2: {
      title: string;
      content: string;
    };
    section3: {
      title: string;
      intro: string;
      item1: string;
      item2: string;
      item3: string;
      item4: string;
      item5: string;
    };
    section4: {
      title: string;
      intro: string;
      item1: string;
      item2: string;
      item3: string;
      item4: string;
      item5: string;
      item6: string;
    };
    section5: {
      title: string;
      content: string;
    };
    section6: {
      title: string;
      content: string;
    };
    section7: {
      title: string;
      content: string;
    };
    section8: {
      title: string;
      content: string;
    };
    section9: {
      title: string;
      content: string;
    };
    section10: {
      title: string;
      content: string;
    };
    section11: {
      title: string;
      content: string;
    };
    section12: {
      title: string;
      content: string;
    };
    section13: {
      title: string;
      content: string;
    };
  };

  privacy: {
    title: string;
    lastUpdated: string;
    backToRegister: string;
    section1: { title: string; content: string };
    section2: { title: string; content: string };
    section3: { title: string; content: string };
    section4: { title: string; content: string };
    section5: { title: string; intro: string; item1: string; item2: string; item3: string; item4: string };
    section6: { title: string; content: string };
    section7: { title: string; content: string };
    section8: { title: string; content: string };
  };

  compliance: {
    title: string;
    subtitle: string;
    exportTitle: string;
    exportDesc: string;
    exportButton: string;
    deletionTitle: string;
    deletionDesc: string;
    deletionButton: string;
    deletionSuccess: string;
    privacyLink: string;
    retentionTitle: string;
    retentionNote: string;
    legalHoldTitle: string;
    legalHoldDesc: string;
    holdResourceType: string;
    holdResourceId: string;
    holdReason: string;
    holdCreate: string;
    holdCreated: string;
    holdRelease: string;
    holdsEmpty: string;
  };

  clinicalHistoriesExport: {
    title: string;
    subtitle: string;
    desc: string;
    stats: string;
    downloadHtml: string;
    printPdf: string;
    pdfHint: string;
    popupBlocked: string;
    noPatients: string;
    buildError: string;
    downloadFailed: string;
    downloadStarted: string;
    openedInTab: string;
    invalidResponse: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    patients: string;
    clinicalSessions: string;
    clinicalTools: string;
    credits: string;
    settings: string;
    users: string;
    auditLog: string;
    systemDiagnostics: string;
    profile: string;
    clinicManagement: string;
    whatsappMessages: string;
    whatsappCampaigns: string;
    calendar: string;
    securityMetrics: string;
    checkout: string;
  };

  checkout: {
    title: string;
    receptionHint: string;
    podiatristHint: string;
    adminHint: string;
    tabPending: string;
    tabPaid: string;
    allPodiatrists: string;
    emptyPending: string;
    emptyPaid: string;
    markPaid: string;
    confirmPaid: string;
    confirmPaidTitle: string;
    paidAt: string;
    statusAwaiting: string;
    statusReady: string;
    statusPaid: string;
    modalTitle: string;
    modalSubtitle: string;
    modalHint: string;
    amountLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    skipForNow: string;
    sendToReception: string;
    invalidAmount: string;
    saveFailed: string;
    saving: string;
    quickTariffs: string;
    requestAmount: string;
    requestAmountSent: string;
    setAmount: string;
    tariffsTitle: string;
    tariffsHint: string;
    saveTariffs: string;
    tariffsSaved: string;
    addTariff: string;
    tariffLabelPlaceholder: string;
    tariffAmountAria: string;
    tariffDurationTitle: string;
    tariffDurationAria: string;
    tariffDurationPlaceholder: string;
    serverMigrateHint: string;
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
    myPractice: string;
    podiatristFallback: string;
    assignedPodiatrist: string;
    podiatristLabel: string;
    weekBucket: string;
    analytics: CheckoutAnalyticsI18n;
    agendaAnalytics: AgendaAnalyticsI18n;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    welcomeMessage: string;
    quickStats: string;
    totalPatients: string;
    sessionsThisMonth: string;
    creditsRemaining: string;
    recentActivity: string;
    upcomingAppointments: string;
    noRecentActivity: string;
    patientFallback: string;
    sessionCompletedActivity: string;
    draftActivity: string;
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
  };
  
  // Patients
  patients: {
    title: string;
    addPatient: string;
    editPatient: string;
    patientList: string;
    patientDetails: string;
    searchPatients: string;
    noPatients: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    idNumber: string;
    curp: string;
    curpHint: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    medicalHistory: string;
    allergies: string;
    medications: string;
    conditions: string;
    consent: string;
    consentGiven: string;
    consentDate: string;
    consentDocumentLink: string;
    consentLegalNotice: string;
    clinicalHistory: string;
    viewHistory: string;
    lastVisit: string;
    totalSessions: string;
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
  };
  
  // Clinical Sessions
  sessions: {
    title: string;
    newSession: string;
    editSession: string;
    sessionList: string;
    sessionDetails: string;
    sessionDate: string;
    clinicalNotes: string;
    anamnesis: string;
    physicalExamination: string;
    diagnosis: string;
    treatmentPlan: string;
    images: string;
    uploadImages: string;
    maxImages: string;
    draft: string;
    completed: string;
    complete: string;
    saveDraft: string;
    selectPatient: string;
    noSessions: string;
    startSession: string;
    creditReserved: string;
    sessionSaved: string;
    checkoutCompleteHint: string;
    allStatuses: string;
    loadingSessions: string;
    createFirstSession: string;

    reasons: {
      routine_checkup: string;
      treatment_continuation: string;
      post_procedure_review: string;
      new_symptoms: string;
      follow_up: string;
      other: string;
    };
    appointmentReason: string;
    followUpInstructions: string;
    followUpInstructionsPlaceholder: string;
    unknownPatient: string;
    podiatryExamTitle: string;
    confirmApplyTemplate: string;
    imageOnlyAllowed: string;
    imageReadError: string;
    imageProcessError: string;
    saveFailed: string;
    selectPatientAlert: string;
    gracePeriodMessage: string;
    gracePeriodTitle: string;
    saveError: string;
    confirmDelete: string;
    deleteFailed: string;
    deleteError: string;
    exportOnlyPodiatrists: string;
    exportFailed: string;
    prescriptionRequireContent: string;
    patientLoadFailed: string;
    noPhotos: string;
    imageAlt: string;
    folioLabel: string;
    medicationsLabel: string;
    noPrescriptions: string;
    patientPrefix: string;
    professionalFallback: string;
    userFallback: string;
    printTitlePrefix: string;
    weightPlaceholder: string;
    heightPlaceholder: string;
    anamnesisPlaceholder: string;
    examPlaceholder: string;
    diagnosisPlaceholder: string;
    treatmentPlaceholder: string;
    notesPlaceholder: string;
    patientData: string;
    idOrCurp: string;
    age: string;
    professionalData: string;
    professional: string;
    professionalLicense: string;
    licensePlaceholder: string;
    prescriptionIndications: string;
    prescriptionIndicationsPlaceholder: string;
    medicationsTreatments: string;
    medicationsTreatmentsPlaceholder: string;
    additionalNotes: string;
    prescriptionMinContent: string;
    loadingPatients: string;
    selectEllipsis: string;
    incompleteData: string;
    incompletePatientWarning: string;
    editPatientLink: string;
    refreshPatientData: string;
    vitalsHint: string;
    sessionTemplate: string;
    noTemplate: string;
    templateClinic: string;
    templatePersonal: string;
    noTemplatesBefore: string;
    noTemplatesAfter: string;
    clinicalToolsLink: string;
    templateApplyHint: string;
    templateFilteredView: string;
    templateNoSections: string;
    selectPatientTitle: string;
    completePatientDataTitle: string;
    completePatientDataHint: string;
    loadMoreSessions: string;
    loadingMore: string;
    reschedule: string;
    rescheduleTitle: string;
    daysOverdue: string;
    scheduleAppointment: string;
    todayRel: string;
    tomorrowRel: string;
    inDays: string;
    exportJson: string;
    yearsOld: string;
    followUp: {
      overdueBanner: string;
      upcomingBanner: string;
      overdueChip: string;
      upcomingChip: string;
      sectionTitle: string;
      nextAppointment: string;
      noSpecificReason: string;
    };
    prescriptions: {
      sectionTitle: string;
      newPrescription: string;
      create: string;
      creating: string;
    };
    vitals: {
      title: string;
      weightKg: string;
      heightCm: string;
    };
  };

  // Calendar
  calendar: {
    title: string;
    today: string;
    month: string;
    week: string;
    day: string;
    newAppointment: string;
    addAppointment: string;
    allPodiatrists: string;
    dayMon: string;
    dayTue: string;
    dayWed: string;
    dayThu: string;
    dayFri: string;
    daySat: string;
    daySun: string;
    unknown: string;
    pendingPatient: string;
    pendingShort: string;
    appointment: string;
    session: string;
    scheduled: string;
    completed: string;
    draft: string;
    noDiagnosis: string;
    noNotes: string;
    edit: string;
    cancel: string;
    more: string;
    events: string;
    noEventsForDay: string;
    podiatristLabel: string;
    minutes: string;
    tel: string;
    confirmDeleteAppointment: string;
    upcomingAppointments: string;
    upcomingSessions: string;
    noUpcomingSessions: string;
    legend: string;
    legendAppointment: string;
    legendSessionCompleted: string;
    legendSessionDraft: string;
    legendCancelled: string;
    cancelledSlotHint: string;
    formTitleNew: string;
    formTitleEdit: string;
    patientLabel: string;
    patientPendingOption: string;
    pendingPatientInfo: string;
    nameRequired: string;
    phoneRequired: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    podiatristRequired: string;
    selectPodiatrist: string;
    dateRequired: string;
    timeRequired: string;
    durationMinutes: string;
    duration15: string;
    duration30: string;
    duration45: string;
    duration60: string;
    duration90: string;
    notesPlaceholder: string;
    cancelAppointmentButton: string;
    confirmCancelAppointment: string;
    close: string;
    saveChanges: string;
    createAppointment: string;
    creating: string;
    saving: string;
    errorPendingPatientRequired: string;
    errorOverlap: string;
    errorUpdateFailed: string;
    errorCreateFailed: string;
    errorSaveFailed: string;
    errorDeleteFailed: string;
    downloadIcs: string;
    exportDateLabel: string;
    sendWhatsApp: string;
    exportIcsHint: string;
    exportWaHint: string;
    exportSelectPodiatrist: string;
    exportNoAppointments: string;
    exportBusy: string;
    exportWaHeader: string;
    exportWaLine: string;
    exportWaAttachHint: string;
    exportWaInvalidPhone: string;
    checkInWaiting: string;
    checkInInConsult: string;
    checkInDone: string;
    checkInNone: string;
    scheduledMetric: string;
    completedMetric: string;
    noShow: string;
    waitlist: string;
    agendaDemandTitle: string;
    agendaDemandDemandTotal: string;
    goToCheckoutAgendaLong: string;
    pendingBadge: string;
    confirmSaveAnyway: string;
    outsideHoursBlocked: string;
    confirmMarkNoShow: string;
    markNoShow: string;
    noPhoneShort: string;
    icsExportTitle: string;
    icsExportDescription: string;
    icsExportLabel: string;
    preferredDateShort: string;
    outsideHoursReceptionistNote: string;
    outsideHoursContinueNote: string;
  };
  
  // Credits
  credits: {
    title: string;
    currentBalance: string;
    monthlyCredits: string;
    extraCredits: string;
    purchaseCredits: string;
    creditHistory: string;
    consumption: string;
    purchase: string;
    expiration: string;
    expiresEndOfMonth: string;
    neverExpires: string;
    reserved: string;
    used: string;
    available: string;
    insufficientCredits: string;
    creditPackages: string;
    buyNow: string;
  };
  
  // Settings
  settings: {
    title: string;
    theme: string;
    language: string;
    lightMode: string;
    darkMode: string;
    accentColor: string;
    accentColorHint: string;
    preview: string;
    saveSettings: string;
    settingsSaved: string;
    general: string;
    appearance: string;
    notifications: string;
    security: string;
    paletteHint: string;
    paletteGroupBrand: string;
    paletteGroupSemantic: string;
    paletteGroupWhatsapp: string;
    changeColor: string;
    resetPaletteMode: string;
    resetPaletteAll: string;
    palettePreviewBrand: string;
    palettePreviewSemantic: string;
    palettePreviewWhatsapp: string;
    palettePreviewMessages: {
      error: string;
      warning: string;
      success: string;
      info: string;
    };
    palettePreviewLabels: {
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
    navMenuTitle: string;
    navMenuHint: string;
    navMenuMinOne: string;
    navMenuReset: string;
    paletteTokens: Record<
      | "sidebar"
      | "primary"
      | "primaryHover"
      | "canvas"
      | "surface"
      | "muted"
      | "border"
      | "error"
      | "errorBg"
      | "warning"
      | "warningBg"
      | "success"
      | "successBg"
      | "info"
      | "infoBg"
      | "whatsapp"
      | "whatsappBg"
      | "whatsappBorder"
      | "whatsappMuted",
      string
    >;
    tabs: {
      profile: string;
      clinicalHistory: string;
      integrations: string;
      clinic: string;
      billing: string;
    };
    settingsScope: {
      appliesClinic: string;
      appliesIndependent: string;
      appliesPractice: string;
    };
    watermark: {
      title: string;
      hint: string;
      show: string;
      customImage: string;
      useProfessionalLogo: string;
      logoHint: string;
      loading: string;
      imageTooLarge: string;
      invalidFormat: string;
      loadImageError: string;
      saved: string;
      saveFailed: string;
      imageLabel: string;
      noLogo: string;
      noImage: string;
      upload: string;
      formatHint: string;
      removeImage: string;
      intensity: string;
      intensityHint: string;
      size: string;
      zoom: string;
      zoomHint: string;
      positionX: string;
      positionY: string;
      left: string;
      center: string;
      right: string;
      top: string;
      bottom: string;
      saving: string;
      save: string;
    };
    billing: {
      title: string;
      subscriptionTitle: string;
      independentPlan: string;
      status: string;
      trialPeriod: string;
      trialEnd: string;
      trialActive: string;
      adminNoSub: string;
      receptionistHint: string;
      statusActive: string;
      statusPastDue: string;
      statusCancelled: string;
      paymentReceived: string;
      paymentCancelled: string;
      cardVerified: string;
      cardVerifyError: string;
      cardMockVerified: string;
      cardSetupError: string;
      trialActivated: string;
      trialActivateError: string;
      checkoutError: string;
      portalError: string;
      activateTrialTitle: string;
      activateTrialHint: string;
      stepEmail: string;
      emailVerifyHint: string;
      stepCard: string;
      verifyCard: string;
      activateMonthTrial: string;
      overLimit: string;
      overCapacityAfterDowngrade: string;
      loading: string;
      clinicPlan: string;
      activePodiatrists: string;
      stripeNotConfigured: string;
      subscribe: string;
      manageStripe: string;
      clinicManagedByAdmin: string;
      extraSeatsTitle: string;
      extraSeatsHint: string;
      extraSeatsLabel: string;
      extraSeatsSave: string;
      extraSeatsSaved: string;
      extraSeatsTotal: string;
      extraSeatsError: string;
      extraSeatsBreakdown: string;
      extraSeatsTrialNote: string;
      extraSeatsTrialSaved: string;
      growthTitle: string;
      growthHint: string;
      growthClinicBullet: string;
      growthContact: string;
    };
    dashboardLogo: {
      title: string;
      loading: string;
      saved: string;
      saveFailed: string;
      enabledByAdmin: string;
      notShown: string;
      hint: string;
      show: string;
      opacity: string;
      size: string;
      zoom: string;
      zoomHint: string;
      positionX: string;
      positionY: string;
      left: string;
      center: string;
      right: string;
      top: string;
      bottom: string;
      saving: string;
      save: string;
    };
    clinicalLayout: {
      loadingDesigner: string;
      title: string;
      hint: string;
      restoreDefault: string;
      saveDesign: string;
      addSection: string;
      editSection: string;
      previewForm: string;
      newSectionDefault: string;
      itemN: string;
      columnN: string;
      saved: string;
      saveFailed: string;
      restoreConfirm: string;
      saving: string;
      readOnlyHint: string;
      sectionsCount: string;
      sectionTitlePlaceholder: string;
      titleLabel: string;
      builtinTitleHint: string;
      onPatientCard: string;
      enabled: string;
      inSession: string;
      inPrint: string;
      patientCardHelp: string;
      printAntecedentsHelp: string;
      enabledHelp: string;
      inSessionHelp: string;
      inPrintHelp: string;
      deleteCustomSection: string;
      selectSection: string;
      systemField: string;
      noSessionSections: string;
      remove: string;
      maxColumns: string;
      checklistItems: string;
      yesNoNaRows: string;
      options: string;
      yesNoNaHint: string;
      addItem: string;
      addRow: string;
      addOption: string;
      unit: string;
      unitPlaceholder: string;
      defaultUnit: string;
      scaleMax: string;
      conditionalPrompt: string;
      conditionalPlaceholder: string;
      tableColumns: string;
      tableColumnsHint: string;
      addColumn: string;
      tableRows: string;
    };
    print: {
      title: string;
      hint: string;
      preview: string;
      loading: string;
      saved: string;
      saveFailed: string;
      readOnlyHint: string;
      generalTitle: string;
      generalDesc: string;
      headerAlign: string;
      alignLeft: string;
      alignCenter: string;
      monochrome: string;
      monochromeHint: string;
      showGeneratedBy: string;
      footerText: string;
      footerPlaceholder: string;
      historyTitle: string;
      historyDesc: string;
      showLogo: string;
      showLegalData: string;
      showLegalDataHint: string;
      includePhotos: string;
      includePhotosHint: string;
      compact: string;
      compactHistoryHint: string;
      orientation: string;
      portrait: string;
      landscape: string;
      orientationHistoryHint: string;
      evolutionRows: string;
      rxTitle: string;
      rxDesc: string;
      showWeight: string;
      showHeight: string;
      showNextVisit: string;
      showNotes: string;
      showSignatureCedula: string;
      compactRxHint: string;
      orientationRxHint: string;
      folioPosition: string;
      folioInline: string;
      folioBar: string;
      folioHint: string;
      saving: string;
      save: string;
      reset: string;
      previewSimHint: string;
      tabHistory: string;
      tabRx: string;
      statusMonochrome: string;
      statusHeaderCenter: string;
      statusHeaderLeft: string;
      statusEvolutionRows: string;
      statusCompact: string;
      statusFolioInline: string;
      demoClinicName: string;
      demoLicense: string;
      demoLegal: string;
      demoContact: string;
      demoHistoryTitle: string;
      demoPatientSection: string;
      demoPatientCells: string[];
      demoEvolutionSection: string;
      demoColDate: string;
      demoColDiagnosis: string;
      demoColTreatment: string;
      demoDiagnosis: string;
      demoTreatment: string;
      demoMoreRows: string;
      demoPhotos: string;
      demoFooter: string;
      demoDoctor: string;
      demoCedula: string;
      demoTel: string;
      demoFolio: string;
      demoFolioBar: string;
      demoPatientData: string;
      demoName: string;
      demoDni: string;
      demoAge: string;
      demoWeight: string;
      demoHeight: string;
      demoPrescription: string;
      demoPrescriptionBody: string;
      demoNextVisit: string;
      demoNextVisitDate: string;
      demoNotes: string;
      demoNotesBody: string;
      demoSignature: string;
      logoPlaceholder: string;
    };
    profileAvatar: {
      changeTitle: string;
      invalidFormat: string;
      tooLarge: string;
      saveFailed: string;
      processFailed: string;
      removeFailed: string;
      saving: string;
      changePhoto: string;
      uploadPhoto: string;
      removePhoto: string;
      hint: string;
    };
    profile: {
      title: string;
      name: string;
      email: string;
      readOnlyHint: string;
    };
    cooldown: {
      logoPolicy: string;
      logoBlocked: string;
      clinicInfoPolicy: string;
      clinicInfoBlocked: string;
      professionalInfoPolicy: string;
      professionalInfoBlocked: string;
      profilePolicy: string;
      clinicReadOnlyPolicy: string;
      genericBlocked: string;
    };
    clinic: {
      fallbackName: string;
      errors: {
        nameCodeRequired: string;
        invalidWebsite: string;
      };
    };
    consent: {
      title: string;
      sharedTitle: string;
      sharedBody: string;
      currentVersion: string;
      empty: string;
      editHint: string;
      placeholder: string;
      save: string;
      saveError: string;
    };
    logo: {
      empty: string;
      previewAlt: string;
      upload: string;
      formatHint: string;
      save: string;
      remove: string;
      errors: {
        invalidFormat: string;
        tooLarge: string;
        processFailed: string;
        cooldown: string;
        saveFailed: string;
      };
    };
    clinicLogo: {
      title: string;
      sharedTitle: string;
      sharedBody: string;
      alt: string;
      uploadHint: string;
    };
    professionalLogo: {
      title: string;
      uploadHint: string;
      alt: string;
    };
    adminLogo: {
      title: string;
      body: string;
    };
    assignedPodiatrists: {
      title: string;
      clinicHint: string;
      independentHint: string;
      emptyClinic: string;
      save: string;
      empty: string;
    };
    receptionist: {
      title: string;
      description: string;
      status: {
        blocked: string;
        disabled: string;
        active: string;
      };
      unblock: string;
      block: string;
      enable: string;
      disable: string;
      delete: string;
      oneOnlyHint: string;
      fields: {
        name: string;
        email: string;
        initialPassword: string;
      };
      createdSuccess: string;
      create: string;
      createError: string;
      confirmDelete: string;
    };
    clinicInfo: {
      title: string;
      subtitle: string;
      setupBanner: string;
      clinicName: string;
      clinicNamePlaceholder: string;
      clinicCode: string;
      clinicCodePlaceholder: string;
      clinicCodeHint: string;
      country: string;
      countryHint: string;
      phone: string;
      email: string;
      emailPlaceholder: string;
      address: string;
      addressPlaceholder: string;
      city: string;
      cityPlaceholder: string;
      postalCode: string;
      postalCodePlaceholder: string;
      mapsUrl: string;
      mapsUrlPlaceholder: string;
      mapsUrlHint: string;
      licenseNumber: string;
      licensePlaceholder: string;
      website: string;
      websitePlaceholder: string;
      legalName: string;
      rfc: string;
      clues: string;
      cofepris: string;
      readOnlyTitle: string;
      readOnlyBody: string;
      labels: {
        name: string;
        phone: string;
        email: string;
        address: string;
        maps: string;
        license: string;
        consent: string;
        web: string;
      };
      viewDocument: string;
    };
    practice: {
      title: string;
      subtitle: string;
      professionalName: string;
      namePlaceholder: string;
      country: string;
      countryHint: string;
      emailPlaceholder: string;
      sanitaryRegistry: string;
      cedula: string;
      cedulaPlaceholder: string;
    };
    credentials: {
      title: string;
      subtitle: string;
      contactPhoneTitle: string;
      contactPhoneHint: string;
      country: string;
      mobile: string;
      savePhone: string;
      registryNumber: string;
      registryPlaceholder: string;
      save: string;
      clinicInfoTitle: string;
      clinicInfoBody: string;
      clinicName: string;
    };
    common: {
      saved: string;
      readOnly: string;
      saveInfo: string;
      emDash: string;
      ellipsis: string;
    };
    errors: {
      connectionSave: string;
    };
    supportSenderLabel: string;
  };

  // Contact PodoAdmin / Support (2-way messaging)
  premium: {
    badge: string;
    baseBadge: string;
    lockedTab: string;
    upsellTitle: string;
    upsellBody: string;
    upsellCta: string;
    clinicalToolsLockedTitle: string;
    clinicalToolsLockedBody: string;
    campaignsLockedTitle: string;
    campaignsLockedBody: string;
    agendaAnalyticsLockedBody: string;
    upgradeButton: string;
    upgradeSuccess: string;
    planBase: string;
    planPremium: string;
    menuManagePlan: string;
    planPrompt: string;
    planInvalid: string;
    planUpdated: string;
  };

  reservationAction: {
    confirmTitle: string;
    cancelTitle: string;
    rescheduleTitle: string;
    loading: string;
    greeting: string;
    confirmQuestion: string;
    cancelQuestion: string;
    dateLabel: string;
    timeLabel: string;
    clinicLabel: string;
    podiatristLabel: string;
    confirmButton: string;
    cancelButton: string;
    confirmedOk: string;
    cancelledOk: string;
    rescheduledOk: string;
    alreadyConfirmed: string;
    alreadyCancelled: string;
    invalidMsg: string;
    expiredMsg: string;
    errorGeneric: string;
    processingConfirm: string;
    processingCancel: string;
    processingReschedule: string;
    changedMindToCancel: string;
    changedMindToConfirm: string;
    slotTaken: string;
    satisfactionTitle: string;
    satisfactionProcessing: string;
    thanksGood: string;
    thanksRegular: string;
    thanksBad: string;
    reviewCta: string;
    complaintPrompt: string;
    complaintPlaceholder: string;
    anonymousLabel: string;
    sendComment: string;
    commentSent: string;
    sending: string;
    bookingTitle: string;
    bookingInvalid: string;
    bookingPickDate: string;
    bookingPickTime: string;
    bookingLoadingSlots: string;
    bookingNoSlots: string;
    bookingName: string;
    bookingPhone: string;
    bookingConfirm: string;
    bookingBooking: string;
    bookingDoneTitle: string;
    bookingDoneMsg: string;
    bookingSlotTaken: string;
  };

  support: {
    title: string;
    contactPodoAdmin: string;
    contactSubtitle: string;
    newConversation: string;
    subject: string;
    subjectPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    send: string;
    myConversations: string;
    noConversations: string;
    reply: string;
    replyPlaceholder: string;
    open: string;
    closed: string;
    markAsRead: string;
    closeConversation: string;
    reopenConversation: string;
    from: string;
    sent: string;
  };

  layout: {
    brandFallback: string;
    unlockSidebarVisible: string;
    unlockSidebarHidden: string;
    lockSidebarVisible: string;
    toggleSidebarLock: string;
    hideMenu: string;
    showMenu: string;
    pendingAccessBanner: string;
    goToBilling: string;
    goToSupport: string;
    subscriptionInactiveBanner: string;
    closeMenu: string;
    sponsored: string;
    closeAnnouncement: string;
    promoCodeOnSite: string;
    seeMore: string;
    interested: string;
    interestRegistered: string;
  };

  /** WhatsApp Business (configuración y mensajes) */
  whatsapp: {
    title: string;
    subtitle: string;
    loading: string;
    setupTitle: string;
    setupStep1Prefix: string;
    setupStep1Link: string;
    setupStep1Suffix: string;
    setupStep2: string;
    setupStep3: string;
    setupStep4Prefix: string;
    setupStep4Link: string;
    setupStep4Suffix: string;
    setupStep5: string;
    statusLabel: string;
    statusConnected: string;
    statusError: string;
    statusPending: string;
    phoneNumberIdLabel: string;
    phoneNumberIdPlaceholder: string;
    wabaIdLabel: string;
    wabaIdPlaceholder: string;
    accessTokenLabel: string;
    accessTokenRequired: string;
    accessTokenKeepCurrent: string;
    accessTokenPlaceholderSaved: string;
    accessTokenPlaceholderNew: string;
    hideTokenField: string;
    changeToken: string;
    publicPhoneLabel: string;
    publicPhonePlaceholder: string;
    remindersSection: string;
    remindersAuto: string;
    reminderDaysBefore: string;
    reminderHoursBefore: string;
    reminderHourBefore: string;
    reminderDayOne: string;
    reminderDayMany: string;
    reminderSelectHour: string;
    reminderAddHour: string;
    reminderRemoveHour: string;
    reminderHoursHint: string;
    reminderScheduleHint: string;
    reminderDaysHelp: string;
    reminderHoursHelp: string;
    reminderDaysRequired: string;
    reminder48h: string;
    reminder24h: string;
    templateNameLabel: string;
    templateNamePlaceholder: string;
    templateHint: string;
    defaultExtraNoteLabel: string;
    defaultExtraNotePlaceholder: string;
    defaultExtraNoteHint: string;
    templateLanguageLabel: string;
    templateLanguagePlaceholder: string;
    integrationActive: string;
    receptionistApiEnabled: string;
    save: string;
    saving: string;
    testConnection: string;
    testing: string;
    disconnect: string;
    guidesFooter: string;
    guidesCloudApi: string;
    guidesSystemUsers: string;
    consentNote: string;
    purposeTitle: string;
    purposeDescription: string;
    errorApiUnavailable: string;
    errorLoad: string;
    errorPhoneRequired: string;
    errorTokenRequired: string;
    errorTemplateRequired: string;
    errorSave: string;
    errorTest: string;
    errorTestFailed: string;
    errorDisconnect: string;
    disconnectConfirm: string;
    successSaved: string;
    successSavedWarning: string;
    successTest: string;
    successTestWithPhone: string;
    successDisconnected: string;
    campaigns: {
      title: string;
      pageHint: string;
      webTitle: string;
      webHint: string;
      openWeb: string;
      newDraft: string;
      metaApiTitle: string;
      metaApiHint: string;
      denied: string;
      patientsLoadError: string;
      draftCreated: string;
      createError: string;
      sendConfirm: string;
      apiSendResult: string;
      apiSendError: string;
      namePlaceholder: string;
      messagePlaceholder: string;
      variablesHint: string;
      variablesList: string;
      clinicOnlyFilter: string;
      recipientsWithPhone: string;
      recipientsMismatchHint: string;
      patientsLoadFailed: string;
      noPatientsYet: string;
      saveDraft: string;
      assistantTitle: string;
      assistantPatientOf: string;
      openWhatsApp: string;
      assistantDone: string;
      finish: string;
      nextPatient: string;
      draftsToSend: string;
      loading: string;
      recipientsCount: string;
      sendAssistant: string;
      hideList: string;
      showList: string;
      deleteDraft: string;
      deleteDraftConfirm: string;
      deleteDraftError: string;
      noValidRecipients: string;
      noDrafts: string;
      connected: string;
      optional: string;
      receptionistApiHint: string;
      receptionistApiDisabled: string;
      configureApiHint: string;
      allCampaigns: string;
      sentAt: string;
      sending: string;
      sendByApi: string;
      noCampaigns: string;
    };
    messages: {
      title: string;
      webTitle: string;
      webHint: string;
      openWeb: string;
      metaApiTitle: string;
      metaApiHint: string;
      historyTitle: string;
      historyHint: string;
      denied: string;
      patientFallback: string;
      defaultExtraNote: string;
      noValidPhone: string;
      selectAppointmentFirst: string;
      reminderSendError: string;
      reminderSent: string;
      defaultMessage: string;
      variablesHint: string;
      variablesList: string;
      extraNotePlaceholder: string;
      saved: string;
      saveMessage: string;
      dayOffsetLabel: string;
      dayOffsetToday: string;
      dayOffsetTomorrow: string;
      dayOffsetIn2Days: string;
      dayOffsetIn5Days: string;
      tomorrowAppointments: string;
      loadingAppointments: string;
      noTomorrowAppointments: string;
      noPhone: string;
      sendViaWhatsApp: string;
      connected: string;
      optional: string;
      receptionistApiHint: string;
      configLoadError: string;
      connectedLabel: string;
      apiStatusLabel: string;
      templateLabel: string;
      templateUndefined: string;
      lastErrorLabel: string;
      noErrors: string;
      sendAutoReminder: string;
      selectUpcomingAppointment: string;
      sending: string;
      sendByApi: string;
      singleExtraNotePlaceholder: string;
      lastApiSends: string;
      refresh: string;
      loadingHistory: string;
      configureForHistory: string;
      noApiSends: string;
      colDate: string;
      colPatient: string;
      colPhone: string;
      colStatus: string;
      colNote: string;
      emDash: string;
      yes: string;
      no: string;
      pendingRescheduleTitle: string;
      pendingRescheduleHint: string;
      loadingPendingReschedule: string;
      noPendingReschedule: string;
      cancelledOn: string;
      sendRescheduleMessage: string;
      rescheduleWhatsAppMessage: string;
      rescheduleWaMsgTitle: string;
      rescheduleWaMsgHint: string;
      rescheduleMessageSectionTitle: string;
      rescheduleMessageHint: string;
      rescheduleMessagePlaceholder: string;
      rescheduleMessageScope: string;
      rescheduleMessageReadOnlyHint: string;
      savingRescheduleMessage: string;
      saveRescheduleMessageButton: string;
      markRescheduleHandled: string;
      reopenReschedule: string;
      rescheduleHandledBadge: string;
      dismissReschedule: string;
      dismissRescheduleConfirm: string;
      opinionSectionTitle: string;
      opinionSectionHint: string;
      loadingOpinion: string;
      noOpinionCandidates: string;
      attendedOn: string;
      requestOpinion: string;
      opinionWhatsAppMessage: string;
      bookingLinkTitle: string;
      bookingLinkHint: string;
      bookingLinkEnabled: string;
      bookingLinkDisabled: string;
      bookingLinkCopy: string;
      bookingLinkCopied: string;
    };
  };

  clinicalTools: {
    title: string;
    denied: string;
    tabTemplates: string;
    tabInventory: string;
    tabReferrals: string;
    templatesHint: string;
    newTemplate: string;
    create: string;
    creating: string;
    category: string;
    inventoryName: string;
    unit: string;
    add: string;
    emptyInventory: string;
    patientId: string;
    referTo: string;
    reason: string;
    registerReferral: string;
    emptyReferrals: string;
    nameRequired: string;
    templateCreated: string;
    createFailed: string;
    presetCreated: string;
    templateUpdated: string;
    saveFailed: string;
    deleteConfirm: string;
    templateDeleted: string;
    deleteFailed: string;
    invalidQuantity: string;
    defaultUnit: string;
    inventoryAdded: string;
    genericError: string;
    referralAdded: string;
    namePlaceholder: string;
    scopeLabel: string;
    scopePersonal: string;
    scopeClinic: string;
    clinicAdminHint: string;
    sectionsCount: string;
    close: string;
    edit: string;
    deleting: string;
    delete: string;
    nameLabel: string;
    shareWithClinic: string;
    saving: string;
    saveTemplate: string;
    emptyTemplates: string;
    quantityPlaceholder: string;
    quantityAria: string;
    patientPrefix: string;
    scopeShared: string;
    scopePersonalShort: string;
  };

  /** Estado del sistema / guía de incidencias (solo super_admin en UI) */
  systemDiagnostics: {
    title: string;
    subtitle: string;
    sectionStatus: string;
    workerLabel: string;
    databaseLabel: string;
    statusOk: string;
    statusError: string;
    latencyLabel: string;
    environmentSection: string;
    checkedAtLabel: string;
    refresh: string;
    loadError: string;
    publicHealthTitle: string;
    publicHealthDesc: string;
    sessionHealthUrlLabel: string;
    productionHealthUrlLabel: string;
    productionHealthNote: string;
    sectionGuide: string;
    guideIntro: string;
    guideItem1: string;
    guideItem2: string;
    guideItem3: string;
    guideItem4: string;
    correlationHint: string;
  };
  
  // Roles
  roles: {
    superAdmin: string;
    clinicAdmin: string;
    admin: string;
    podiatrist: string;
    receptionist: string;
    superAdminDesc: string;
    clinicAdminDesc: string;
    adminDesc: string;
    podiatristDesc: string;
    receptionistDesc: string;
    superAdminAssignWarning: string;
    superAdminAssignConfirmPrompt: string;
    superAdminAssignConfirmed: string;
  };
  
  // Errors
  errors: {
    generic: string;
    notFound: string;
    unauthorized: string;
    validationError: string;
    requiredField: string;
    invalidEmail: string;
    invalidPhone: string;
    saveFailed: string;
    loadFailed: string;
  };
  
  // Success messages
  success: {
    saved: string;
    deleted: string;
    created: string;
    updated: string;
    exported: string;
  };
  
  // Branding
  branding: {
    tagline: string;
    digital: string;
    access: string;
    secure: string;
  };
  
  // Notifications
  notifications: {
    title: string;
    all: string;
    unread: string;
    read: string;
    markAsRead: string;
    markAllAsRead: string;
    noNotifications: string;
    viewAll: string;
    delete: string;
    reassignment: string;
    appointment: string;
    credit: string;
    system: string;
    adminMessage: string;
    patientReassignedFrom: string;
    patientReassignedTo: string;
    reassignedBy: string;
    reason: string;
    agoMinutes: string;
    agoHours: string;
    agoDays: string;
    yesterday: string;
    justNow: string;
    from: string;
    to: string;
    type: string;
    patient: string;
    selectedCount: string;
  };
  
  // Messaging (Super Admin)
  messaging: {
    title: string;
    sendMessage: string;
    newMessage: string;
    sentMessages: string;
    recipient: string;
    recipients: string;
    allUsers: string;
    selectSpecific: string;
    singleUser: string;
    subject: string;
    subjectPlaceholder: string;
    messageBody: string;
    messagePlaceholder: string;
    preview: string;
    send: string;
    sending: string;
    sent: string;
    sentAt: string;
    recipientsCount: string;
    readCount: string;
    unreadCount: string;
    noMessages: string;
    selectRecipients: string;
    messageSent: string;
    messageRequired: string;
    subjectRequired: string;
    recipientRequired: string;
    fromAdmin: string;
  };
  // Clinical shared UI (layout kinds, podiatry options, component strings)
  clinicalLayout: ClinicalLayoutI18n;
  podiatry: PodiatryI18n;
  errorBoundary: ErrorBoundaryI18n;
  clinicalList: ClinicalListI18n;
  patientsClinical: PatientsClinicalI18n;
  sessionsClinical: SessionsClinicalI18n;
  clinicalToolsExtras: ClinicalToolsExtrasI18n;
  calendarGrid: CalendarGridI18n;

  // Users admin page
  usersPage: {
    fields: {
      name: string;
      email: string;
      password: string;
      role: string;
      clinic: string;
      clinicOptional: string;
    };
    create: {
      title: string;
      passwordHint: string;
      clinicModeExisting: string;
      clinicModeNew: string;
      clinicModeNone: string;
      newClinicHint: string;
      podiatristLimit: string;
      podiatristLimitPlaceholder: string;
      podiatristLimitHint: string;
      saving: string;
      success: string;
      partialClinicFail: string;
      errors: {
        nameRequired: string;
        emailInvalid: string;
        passwordMin: string;
        clinicRequiredReceptionist: string;
        clinicRequiredAdmin: string;
        createFailed: string;
      };
    };
    import: {
      title: string;
      description: string;
      optionalColumnsSuperAdmin: string;
      downloadTemplate: string;
      selectFile: string;
      defaultPassword: string;
      optionalPlaceholder: string;
      readyCount: string;
      andMore: string;
      resultsSummary: string;
      created: string;
      importing: string;
      submit: string;
      templateFilename: string;
      errors: {
        needRows: string;
        missingColumns: string;
        readFile: string;
        invalidPassword: string;
        unknown: string;
        connection: string;
      };
    };
    edit: {
      title: string;
      noClinic: string;
      errors: {
        updateFailed: string;
      };
    };
    transfer: {
      title: string;
      subtitle: string;
      successMessage: string;
      error: string;
      successTitle: string;
      errorTitle: string;
      sourceUser: string;
      targetUser: string;
      selectUser: string;
      patientsCount: string;
      warning: string;
      transferring: string;
      submit: string;
    };
    profile: {
      loading: string;
      patients: string;
      sessions: string;
      patientsHeading: string;
      andMore: string;
    };
    status: {
      banned: string;
      blocked: string;
      gracePeriod: string;
      disabled: string;
      pendingPayment: string;
      active: string;
    };
    confirm: {
      block: string;
      unblock: string;
      enable: string;
      disable: string;
      ban: string;
      unban: string;
      delete: string;
      deletePermanent: string;
    };
    errors: {
      approve: string;
      reject: string;
      block: string;
      unblock: string;
      enable: string;
      disable: string;
      ban: string;
      unban: string;
      delete: string;
    };
    actions: {
      importCsv: string;
      createUser: string;
      transferHistory: string;
      approve: string;
      reject: string;
      view: string;
      edit: string;
      ban: string;
      unban: string;
      block: string;
      unblock: string;
      enableAccount: string;
      disableAccount: string;
      delete: string;
      viewProfile: string;
      downloadJson: string;
      manageAccount: string;
    };
    table: {
      user: string;
      email: string;
      role: string;
      status: string;
      clinic: string;
      limit: string;
      data: string;
      actions: string;
      sortBy: string;
      podiatristLimit: string;
      dataSummary: string;
      currentPodiatrists: string;
      saveLimit: string;
      clinicMissing: string;
      effectiveLimitHint: string;
      overCapacityHint: string;
      patients: string;
      sessions: string;
    };
    passwordReset: {
      pendingTitle: string;
      approved: string;
      approveError: string;
      rejectReasonPrompt: string;
      rejected: string;
      rejectError: string;
      approvedModalTitle: string;
      linkHint: string;
      copied: string;
      copyFailed: string;
      copyLink: string;
    };
    regLists: {
      title: string;
      hint: string;
      byCreator: string;
      downloadCsv: string;
      createdCount: string;
      approved: string;
      errorsPrefix: string;
    };
    cooldown: {
      notApplicable: string;
      scopeClinic: string;
      scopeProfessional: string;
      reasonPrompt: string;
      confirm: string;
      applied: string;
      error: string;
    };
    export: {
      failed: string;
    };
    menu: {
      unbanAccount: string;
      banAccount: string;
      unblockAccount: string;
      blockAccount: string;
      enableAccount: string;
      disableAccount: string;
      authorizeCooldown: string;
      deleteAccount: string;
    };
    searchPlaceholder: string;
    allRoles: string;
    loading: string;
    empty: string;
    selectPlaceholder: string;
  };

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
    podiatristsLimitCta: string;
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

}

export const translations: Record<Language, Translations> = {
  es: {
    clinicalLayout: clinicalSharedByLang.es.clinicalLayout,
    podiatry: clinicalSharedByLang.es.podiatry,
    errorBoundary: clinicalSharedByLang.es.errorBoundary,
    clinicalList: clinicalSharedByLang.es.clinicalList,
    patientsClinical: clinicalSharedByLang.es.patientsClinical,
    sessionsClinical: clinicalSharedByLang.es.sessionsClinical,
    clinicalToolsExtras: clinicalSharedByLang.es.clinicalToolsExtras,
    calendarGrid: clinicalSharedByLang.es.calendarGrid,
    common: {
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Crear",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      print: "Imprimir",
      back: "Volver",
      next: "Siguiente",
      previous: "Anterior",
      confirm: "Confirmar",
      close: "Cerrar",
      yes: "Sí",
      no: "No",
      actions: "Acciones",
      status: "Estado",
      date: "Fecha",
      time: "Hora",
      name: "Nombre",
      email: "Correo electrónico",
      phone: "Teléfono",
      address: "Dirección",
      notes: "Notas",
      description: "Descripción",
      details: "Detalles",
      view: "Ver",
      download: "Descargar",
      showPassword: "Mostrar contraseña",
      hidePassword: "Ocultar contraseña",
      showShort: "Mostrar",
      hideShort: "Ocultar",
      captcha: "CAPTCHA",
      seeAll: "Ver todos",
      seeAllShort: "Ver todo",
      viewMore: "Ver más",
      go: "Ir",
    },
    auth: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      welcome: "Bienvenido",
      welcomeBack: "Bienvenido de nuevo",
      enterCredentials: "Ingresa tus credenciales para acceder al sistema",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "correo@ejemplo.com",
      emailHint: "Será tu usuario de acceso. Te enviaremos un correo para verificar la cuenta.",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "••••••••",
      loginButton: "Iniciar sesión",
      loggingIn: "Iniciando sesión...",
      invalidCredentials: "Credenciales inválidas",
      loginError: "Error al iniciar sesión",
      tooManyAttempts: "Demasiados intentos",
      accountTemporarilyBlocked: "Cuenta temporalmente bloqueada",
      testCredentials: "Credenciales de prueba",
      superAdmin: "Super Administrador",
      podiatrist: "Podólogo",
      loggedInAs: "Sesión iniciada como",
      sessionExpired: "Tu sesión ha expirado",
      // Registration
      register: "Registrarse",
      registerTitle: "Crea tu cuenta",
      registerSubtitle: "Completa el formulario para registrarte en PodoAdmin",
      nameLabel: "Nombre completo",
      namePlaceholder: "Juan Pérez",
      clinicCodeLabel: "Código de clínica (opcional)",
      clinicCodePlaceholder: "Ej. PREM",
      clinicCodeHint:
        "Déjalo vacío si eres podólogo independiente. Si tu clínica te dio un código, escríbelo aquí para unirte a ella.",
      passwordRequirements: "Requisitos de contraseña",
      passwordMinLength: "Mínimo 12 caracteres",
      passwordMustContain: "Debe contener:",
      passwordUppercase: "Al menos una mayúscula",
      passwordLowercase: "Al menos una minúscula",
      passwordNumber: "Al menos un número",
      passwordSpecial: "Al menos un carácter especial",
      termsAccept: "Acepto los términos y condiciones",
      termsLink: "Ver términos",
      privacyAccept: "Acepto la",
      privacyLink: "Política de Privacidad",
      registerButton: "Crear cuenta",
      registering: "Creando cuenta...",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      goToLogin: "Iniciar sesión",
      dontHaveAccount: "¿No tienes una cuenta?",
      contactAdminForAccount: "Contacta al administrador para crear una cuenta.",
      registrationSuccess: "¡Registro exitoso!",
      registrationSuccessMessage: "Hemos enviado un email de verificación. Por favor, revisa tu bandeja de entrada.",
      registrationSuccessDevMessage:
        "Cuenta creada en entorno de desarrollo. El email quedó verificado automáticamente; ya puedes iniciar sesión.",
      checkEmail: "Revisa tu correo electrónico",
      emailAlreadyRegistered:
        "Este correo ya está registrado. Inicia sesión con tu cuenta o usa otro email.",
      // Email Verification
      verifyEmail: "Verificar email",
      verifyEmailTitle: "Verifica tu email",
      verifyEmailSubtitle: "Hemos enviado un enlace de verificación a tu correo",
      verifyEmailSuccess: "Email verificado",
      verifyEmailSuccessMessage: "Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión.",
      verifyEmailError: "Error al verificar",
      verifyEmailExpired: "El enlace de verificación ha expirado",
      resendVerification: "Reenviar verificación",
      // CAPTCHA
      captchaRequired: "Por favor, completa el CAPTCHA",
      captchaError: "Error al verificar CAPTCHA",
      captchaNotConfigured:
        "Entorno de desarrollo: el CAPTCHA no está configurado. El registro funciona sin verificación antibot.",
      captchaDisabledInDev:
        "Entorno de desarrollo: el CAPTCHA está desactivado automáticamente. En producción será obligatorio.",
      // OAuth
      orContinueWith: "O continúa con",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
      forgotPassword: "¿Olvidaste tu contraseña?",
      forgotPasswordTitle: "Recuperar contraseña",
      forgotPasswordSubtitle: "Ingresa tu correo. Un administrador o soporte revisará tu solicitud y te contactará.",
      forgotPasswordButton: "Enviar solicitud",
      forgotPasswordSuccess: "Tu solicitud ha sido recibida. Un administrador o soporte la revisará y te contactará cuando esté disponible el enlace de recuperación.",
      resetPasswordTitle: "Nueva contraseña",
      resetPasswordSubtitle: "Elige una contraseña segura. El enlace expira en 1 hora.",
      newPasswordLabel: "Nueva contraseña",
      resetPasswordButton: "Restablecer contraseña",
      resetPasswordSuccess: "Contraseña restablecida. Ya puedes iniciar sesión.",
      backToLogin: "Volver al inicio de sesión",
      forgotPasswordErrorRequest: "Ocurrió un error al procesar la solicitud. Por favor, intenta más tarde.",
      forgotPasswordErrorConnection: "Error de conexión. Intenta de nuevo.",
      resetPasswordInvalidLink: "Enlace inválido. Solicita uno nuevo desde la pantalla de recuperación.",
      resetPasswordPasswordsMismatch: "Las contraseñas no coinciden.",
      resetPasswordMissingToken: "Falta el token. Usa el enlace que recibiste por correo.",
      resetPasswordErrorReset: "Error al restablecer la contraseña",
      resetPasswordErrorConnection: "Error de conexión. Intenta de nuevo.",
      resetPasswordRedirecting: "Redirigiendo al login...",
      resetPasswordRepeatPassword: "Repetir contraseña",
      resetPasswordHint: "Mínimo 12 caracteres, mayúscula, minúscula, número y carácter especial.",
      changePasswordTitle: "Cambiar contraseña",
      changePasswordSubtitle: "Tu contraseña temporal debe cambiarse. Elige una contraseña segura de tu preferencia.",
      currentPasswordLabel: "Contraseña actual (temporal)",
      changePasswordButton: "Cambiar contraseña",
      changePasswordSuccess: "Contraseña actualizada correctamente.",
      changePasswordRedirecting: "Redirigiendo al panel...",
      contactToVerifyRecovery: "Ponte en contacto con nosotros para verificar que eres tú quien está recuperando la cuenta.",
      requestNewLink: "Solicitar nuevo enlace",
      securityLabel: "Seguridad:",
      loginOnlyOnOfficialDomainWithDomain: "Solo inicia sesión en {domain}. No uses esta contraseña en otros sitios.",
      loginOnlyOnOfficialDomainGeneric: "Solo inicia sesión en el dominio oficial. No uses esta contraseña en otros sitios.",
      notOnOfficialDomain: "No estás en el dominio oficial. La URL actual no coincide con {domain}. No introduzcas tu contraseña aquí.",
      notOnOfficialDomainNoDomain: "No estás en el dominio oficial. No introduzcas tu contraseña aquí.",
      failedAttempts: "Intentos fallidos:",
      blockedUntil: "Bloqueado hasta:",
      retryIn: "Puedes intentar nuevamente en:",
      emailNotificationSent: "Se ha enviado una notificación por email sobre estos intentos.",
      googleNotConfigured: "Google no está configurado en este entorno",
      googleConnectFailed: "No se pudo conectar con Google",
      googleNoCode: "No se recibió código de Google",
      googleLoginError: "Error al iniciar sesión con Google",
      googleCompleting: "Completando inicio de sesión con Google…",
      serverConnectionError: "Error de conexión con el servidor",
      connectionErrorShort: "Error de conexión",
      changePasswordCurrentRequired: "Introduce tu contraseña actual.",
      changePasswordError: "Error al cambiar la contraseña",
      verifyEmailMissingToken: "No se proporcionó un token de verificación",
      verifyEmailFailed: "Error al verificar el email",
      recoveryVerifySubject: "Verificación de identidad - Recuperación de contraseña",
    },
    nav: {
      dashboard: "Panel principal",
      patients: "Pacientes",
      clinicalSessions: "Sesiones clínicas",
      clinicalTools: "Herramientas clínicas",
      credits: "Créditos",
      settings: "Configuración",
      users: "Usuarios",
      auditLog: "Registro de auditoría",
      systemDiagnostics: "Estado del sistema",
      profile: "Perfil",
      clinicManagement: "Gestión de Clínica",
      whatsappMessages: "Mensajes WhatsApp",
      whatsappCampaigns: "Campañas WhatsApp",
      calendar: "Calendario",
      securityMetrics: "Métricas de seguridad",
      checkout: "Cobros",
    },
    checkout: {
      title: "Salida de pacientes",
      receptionHint: "Pacientes que el podólogo indicó listos para cobrar. No necesitas interrumpir la consulta.",
      podiatristHint: "Importes enviados a recepción. Puedes revisar el estado de cobro aquí.",
      adminHint: "Supervisión de cobros pendientes y completados en la clínica.",
      tabPending: "Pendientes",
      tabPaid: "Cobrados",
      allPodiatrists: "Todos los podólogos",
      emptyPending: "No hay cobros pendientes.",
      emptyPaid: "No hay cobros registrados en esta pestaña.",
      markPaid: "Marcar cobrado",
      confirmPaid: "¿Confirmas que {patient} ya pagó?",
      confirmPaidTitle: "Confirmar cobro",
      paidAt: "Cobrado a las",
      statusAwaiting: "Sin importe",
      statusReady: "Listo para cobrar",
      statusPaid: "Cobrado",
      modalTitle: "Importe para recepción",
      modalSubtitle: "Paciente: {patient}",
      modalHint: "Indica cuánto debe cobrar recepción al paciente que sale de consulta. Recibirán el aviso al instante.",
      amountLabel: "Importe a cobrar",
      notesLabel: "Nota para recepción (opcional)",
      notesPlaceholder: "Ej. consulta + vendaje",
      skipForNow: "Omitir por ahora",
      sendToReception: "Enviar a recepción",
      invalidAmount: "Introduce un importe válido mayor que cero.",
      saveFailed: "No se pudo enviar el importe.",
      saving: "Enviando…",
      quickTariffs: "Tarifas rápidas",
      requestAmount: "Solicitar importe",
      requestAmountSent: "Solicitud enviada",
      setAmount: "Indicar importe",
      tariffsTitle: "Tarifas rápidas de cobro",
      tariffsHint: "Atajos al completar sesión o indicar importe. El admin de clínica define tarifas para toda la clínica; el podólogo puede personalizar las suyas.",
      saveTariffs: "Guardar tarifas",
      tariffsSaved: "Tarifas guardadas",
      addTariff: "Añadir tarifa",
            tariffLabelPlaceholder: "Nombre (ej. Consulta)",
      tariffAmountAria: "Importe",
      tariffDurationTitle: "Duración pauta (minutos)",
      tariffDurationAria: "Duración en minutos",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Error del servidor. Si acabas de actualizar el proyecto, ejecuta npm run db:migrate y reinicia npm run dev.",
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
      myPractice: "Mi consulta",
      podiatristFallback: "Podólogo",
      assignedPodiatrist: "Podólogo asignado",
      podiatristLabel: "Podólogo",
      weekBucket: "S{n}",
      analytics: checkoutAnalyticsByLang.es,
      agendaAnalytics: agendaAnalyticsByLang.es,
    },
    dashboard: {
      title: "Panel principal",
      welcomeMessage: "Bienvenido a PodoAdmin",
      quickStats: "Estadísticas rápidas",
      totalPatients: "Total de pacientes",
      sessionsThisMonth: "Sesiones este mes",
      creditsRemaining: "Créditos disponibles",
      recentActivity: "Actividad reciente",
      upcomingAppointments: "Próximas citas",
      noRecentActivity: "No hay actividad reciente",
      patientFallback: "Paciente",
      sessionCompletedActivity: "Sesión completada",
      draftActivity: "Borrador",
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
    },
    patients: {
      title: "Pacientes",
      addPatient: "Añadir paciente",
      editPatient: "Editar paciente",
      patientList: "Lista de pacientes",
      patientDetails: "Detalles del paciente",
      searchPatients: "Buscar pacientes...",
      noPatients: "No hay pacientes registrados",
      firstName: "Nombre",
      lastName: "Apellidos",
      dateOfBirth: "Fecha de nacimiento",
      gender: "Género",
      male: "Masculino",
      female: "Femenino",
      other: "Otro",
      idNumber: "DNI/NIE",
      curp: "CURP (México)",
      curpHint: "Opcional. Clave Única de Registro de Población (NOM-004 / identificación en México).",
      phone: "Teléfono",
      email: "Correo electrónico",
      address: "Dirección",
      city: "Ciudad",
      postalCode: "Código postal",
      medicalHistory: "Historial médico",
      allergies: "Alergias",
      medications: "Medicamentos",
      conditions: "Condiciones",
      consent: "Consentimiento",
      consentGiven: "Consentimiento otorgado",
      consentDate: "Fecha de consentimiento",
      consentDocumentLink: "Ver documento de consentimiento informado",
      consentLegalNotice: "Las firmas digitales aquí no tienen validez legal. Es necesario que el paciente firme el documento impreso para su validez jurídica.",
      clinicalHistory: "Historial clínico",
      viewHistory: "Ver historial",
      lastVisit: "Última visita",
      totalSessions: "Total de sesiones",
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
      },
    },
    sessions: {
      title: "Sesiones clínicas",
      newSession: "Nueva sesión",
      editSession: "Editar sesión",
      sessionList: "Lista de sesiones",
      sessionDetails: "Detalles de la sesión",
      sessionDate: "Fecha de la sesión",
      clinicalNotes: "Notas clínicas",
      anamnesis: "Anamnesis",
      physicalExamination: "Exploración física",
      diagnosis: "Diagnóstico podológico",
      treatmentPlan: "Plan de tratamiento",
      images: "Imágenes",
      uploadImages: "Subir imágenes",
      maxImages: "Máximo 2 imágenes",
      draft: "Borrador",
      completed: "Completada",
      complete: "Completar",
      saveDraft: "Guardar borrador",
      selectPatient: "Seleccionar paciente",
      noSessions: "No hay sesiones registradas",
      startSession: "Iniciar sesión",
      creditReserved: "Crédito reservado",
      sessionSaved: "Sesión guardada",
      checkoutCompleteHint:
        "El cobro a recepción solo aparece al pulsar Completar (paciente que sale de consulta). Guardar borrador solo guarda sin cerrar la visita.",
      allStatuses: "Todas",
      loadingSessions: "Cargando sesiones…",
      createFirstSession: "Crea tu primera sesión clínica",
      
      reasons: {
        routine_checkup: "Revisión rutinaria",
        treatment_continuation: "Continuación de tratamiento",
        post_procedure_review: "Revisión post-procedimiento",
        new_symptoms: "Nuevos síntomas",
        follow_up: "Seguimiento",
        other: "Otro",
      },
      appointmentReason: "Motivo de la cita",
      followUpInstructions: "Instrucciones de seguimiento",
      followUpInstructionsPlaceholder: "Instrucciones para el paciente, medicación, cuidados...",
      unknownPatient: "Paciente desconocido",
      podiatryExamTitle: "Exploración podológica",
      confirmApplyTemplate: "¿Aplicar esta plantilla? Se reemplazarán los campos clínicos actuales (texto, exploración podológica y secciones personalizadas).",
      imageOnlyAllowed: "Solo se permiten imágenes (JPEG, PNG, WebP).",
      imageReadError: "No se pudo leer la imagen",
      imageProcessError: "Error al procesar la imagen.",
      saveFailed: "No se pudo guardar la sesión.",
      selectPatientAlert: "Seleccione un paciente.",
      gracePeriodMessage: "Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevas sesiones clínicas.",
      gracePeriodTitle: "No puedes crear nuevas sesiones en este momento",
      saveError: "Ha ocurrido un error al guardar la sesión.",
      confirmDelete: "¿Eliminar esta sesión?",
      deleteFailed: "No se pudo eliminar la sesión.",
      deleteError: "Ha ocurrido un error al eliminar la sesión.",
      exportOnlyPodiatrists: "Solo los podólogos pueden exportar historias clínicas.",
      exportFailed: "No se pudo exportar la historia clínica",
      prescriptionRequireContent: "Escribe las indicaciones en «Prescripción / Indicaciones» o en «Medicamentos / Tratamientos».",
      patientLoadFailed: "No se pudieron cargar los datos del paciente. Cierra el formulario, abre la sesión de nuevo e inténtalo otra vez.",
      noPhotos: "No hay fotos en esta sesión. Súbelas al crear o editar el borrador.",
      imageAlt: "Imagen {n}",
      folioLabel: "Folio:",
      medicationsLabel: "Medicamentos:",
      noPrescriptions: "No hay recetas para esta sesión",
      patientPrefix: "Paciente:",
      professionalFallback: "Profesional",
      userFallback: "Usuario",
      printTitlePrefix: "Podólogo",
      weightPlaceholder: "Ej. 72.5",
      heightPlaceholder: "Ej. 165",
      anamnesisPlaceholder: "Motivo de consulta, antecedentes...",
      examPlaceholder: "Hallazgos de la exploración...",
      diagnosisPlaceholder: "Diagnóstico podológico...",
      treatmentPlaceholder: "Plan de tratamiento...",
      notesPlaceholder: "Notas adicionales...",
      patientData: "Datos del paciente",
      idOrCurp: "DNI / CURP",
      age: "Edad",
      professionalData: "Datos del profesional",
      professional: "Profesional",
      professionalLicense: "Cédula profesional",
      licensePlaceholder: "Número de cédula",
      prescriptionIndications: "Prescripción / Indicaciones *",
      prescriptionIndicationsPlaceholder: "Describa las indicaciones y recomendaciones para el paciente...",
      medicationsTreatments: "Medicamentos / Tratamientos",
      medicationsTreatmentsPlaceholder: "Liste los medicamentos o tratamientos recomendados...",
      additionalNotes: "Notas Adicionales",
      prescriptionMinContent: "Completa al menos «Prescripción / Indicaciones» o «Medicamentos / Tratamientos».",
      loadingPatients: "Cargando pacientes…",
      selectEllipsis: "Seleccionar...",
      incompleteData: " (datos incompletos)",
      incompletePatientWarning: "Faltan datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI). Para menores use el DNI del padre/tutor. Edite la ficha del paciente para poder guardar la sesión.",
      editPatientLink: "Editar paciente →",
      refreshPatientData: "Actualizar datos (si ya editó el paciente)",
      vitalsHint: "Se guarda en esta sesión y actualiza el expediente del paciente.",
      sessionTemplate: "Plantilla de sesión",
      noTemplate: "Sin plantilla",
      templateClinic: " (consultorio)",
      templatePersonal: " (personal)",
      noTemplatesBefore: "No hay plantillas. Créalas en",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Herramientas clínicas",
      templateApplyHint: "Al elegir una plantilla se aplican automáticamente el contenido y las secciones visibles (p. ej. sin helomas en procedimientos quirúrgicos).",
      templateFilteredView: "Vista filtrada por plantilla: {n} secciones visibles. Elige «Sin plantilla» para ver el formulario completo.",
      templateNoSections: "Esta plantilla no tiene secciones definidas. Edítala en Herramientas clínicas, marca qué incluir y guarda de nuevo.",
      selectPatientTitle: "Seleccione un paciente",
      completePatientDataTitle: "Complete los datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI)",
      completePatientDataHint: "Para guardar borrador o completar la sesión, primero complete los datos del paciente y haga clic en «Actualizar datos» arriba.",
      loadMoreSessions: "Cargar más sesiones",
      loadingMore: "Cargando…",
      reschedule: "Reprogramar",
      rescheduleTitle: "Reprogramar próxima cita",
      daysOverdue: "{n} días atrasado",
      scheduleAppointment: "Programar cita →",
      todayRel: "Hoy",
      tomorrowRel: "Mañana",
      inDays: "En {n} días",
      exportJson: "Exportar JSON",
      yearsOld: "{n} años",
      followUp: {
        overdueBanner: "Citas atrasadas",
        upcomingBanner: "Próximas citas (7 días)",
        overdueChip: "Atrasada",
        upcomingChip: "Próxima",
        sectionTitle: "Seguimiento",
        nextAppointment: "Próxima cita",
        noSpecificReason: "Sin motivo específico",
      },
      prescriptions: {
        sectionTitle: "Recetas / Prescripciones",
        newPrescription: "Nueva receta",
        create: "Crear",
        creating: "Creando…",
      },
      vitals: {
        title: "Signos vitales",
        weightKg: "Peso (kg)",
        heightCm: "Altura (cm)",
      },
    },
    calendar: {
      title: "Calendario",
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
      newAppointment: "Nueva Cita",
      addAppointment: "Añadir Cita",
      allPodiatrists: "Todos los podólogos",
      dayMon: "Lun",
      dayTue: "Mar",
      dayWed: "Mié",
      dayThu: "Jue",
      dayFri: "Vie",
      daySat: "Sáb",
      daySun: "Dom",
      unknown: "Desconocido",
      pendingPatient: "Paciente pendiente",
      pendingShort: "Pendiente",
      appointment: "Cita",
      session: "Sesión",
      scheduled: "Cita programada",
      completed: "Completada",
      draft: "Borrador",
      noDiagnosis: "Sin diagnóstico",
      noNotes: "Sin notas",
      edit: "Editar",
      cancel: "Cancelar",
      more: "más",
      events: "eventos",
      noEventsForDay: "No hay eventos para este día",
      podiatristLabel: "Podólogo:",
      minutes: "min",
      tel: "Tel:",
      confirmDeleteAppointment: "¿Eliminar esta cita del registro? Se borrará definitivamente.",
      upcomingAppointments: "Próximas citas",
      upcomingSessions: "Sesiones próximas (7 días)",
      noUpcomingSessions: "No hay sesiones próximas",
      legend: "Leyenda",
      legendAppointment: "Cita programada",
      legendSessionCompleted: "Sesión completada",
      legendSessionDraft: "Sesión borrador",
      legendCancelled: "Cancelada",
      cancelledSlotHint: "En este horario había una cita que fue cancelada. El horario está libre: puedes agendar sin problema.",
      formTitleNew: "Nueva Cita",
      formTitleEdit: "Editar Cita",
      patientLabel: "Paciente",
      patientPendingOption: "Paciente pendiente de registrar",
      pendingPatientInfo: "Información del paciente pendiente:",
      nameRequired: "Nombre *",
      phoneRequired: "Teléfono *",
      namePlaceholder: "Nombre completo del paciente",
      phonePlaceholder: "Teléfono de contacto",
      podiatristRequired: "Podólogo *",
      selectPodiatrist: "Seleccionar podólogo",
      dateRequired: "Fecha *",
      timeRequired: "Hora *",
      durationMinutes: "Duración (minutos)",
      duration15: "15 minutos",
      duration30: "30 minutos",
      duration45: "45 minutos",
      duration60: "1 hora",
      duration90: "1 hora 30 minutos",
      notesPlaceholder: "Motivo de la cita, comentarios adicionales...",
      cancelAppointmentButton: "Cancelar Cita",
      confirmCancelAppointment: "¿Cancelar esta cita?",
      close: "Cerrar",
      saveChanges: "Guardar Cambios",
      createAppointment: "Crear Cita",
      creating: "Creando…",
      saving: "Guardando…",
      errorPendingPatientRequired: "Por favor, complete el nombre y teléfono del paciente pendiente.",
      errorOverlap: "El horario se solapa con otra cita de ese podólogo. Elige otro día, otra hora u otro podólogo (si eres clínica).",
      errorUpdateFailed: "No se pudo actualizar la cita.",
      errorCreateFailed: "No se pudo crear la cita.",
      errorSaveFailed: "Error al guardar la cita.",
      errorDeleteFailed: "No se pudo eliminar la cita.",
      downloadIcs: "Descargar .ics",
      exportDateLabel: "Fecha a exportar",
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Descarga las citas programadas del día en .ics (solo citas con hora; no incluye sesiones clínicas)",
      exportWaHint: "Descarga el .ics y abre WhatsApp. Si el podólogo tiene móvil en su perfil, se abre el chat directo; si no, eliges el contacto manualmente. Adjunta el .ics.",
      exportSelectPodiatrist: "Selecciona un podólogo en el filtro para exportar la agenda.",
      exportNoAppointments: "No hay citas programadas este día.",
      exportBusy: "Exportando…",
      exportWaHeader: "📅 Agenda del {{fecha}} — {{podólogo}} ({{count}} citas)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 Se ha descargado el archivo agenda-.ics — adjúntalo en WhatsApp para importar al calendario del móvil.",
      exportWaInvalidPhone: "El teléfono del podólogo no es válido para WhatsApp. Abre WhatsApp manualmente y pega el mensaje.",
      checkInWaiting: "En espera",
      checkInInConsult: "En consulta",
      checkInDone: "Atendido",
      checkInNone: "Sin check-in",
      scheduledMetric: "Programadas",
      completedMetric: "Completadas",
      noShow: "No asistió",
      waitlist: "Lista de espera",
      agendaDemandTitle: "Demanda de agenda",
      agendaDemandDemandTotal: "Demanda total: {n}",
      goToCheckoutAgendaLong: "Ver analítica de agenda en cobros",
      pendingBadge: "Pendiente",
      confirmSaveAnyway: "¿Deseas guardar la cita de todas formas?",
      outsideHoursBlocked: "Fuera de horario: la cita no se guardará. Recepción no puede registrar citas fuera del horario permitido.",
      confirmMarkNoShow: "¿Marcar esta cita como no asistió (no-show)?",
      markNoShow: "No asistió",
      noPhoneShort: "sin tel.",
      preferredDateShort: "pref. {date}",
      outsideHoursReceptionistNote: "No se guardará la cita: recepción no puede registrar citas fuera de horario.",
      outsideHoursContinueNote: "Puedes continuar; se pedirá confirmación al guardar.",
      icsExportTitle: "Exportar Agenda (.ics)",
      icsExportDescription: "El archivo .ics es un calendario estándar que puedes importar en Outlook, Google Calendar, Apple Calendar o cualquier app de calendario. Al descargar, el archivo se guarda en tu dispositivo.",
      icsExportLabel: "Selecciona la fecha para exportar",
    },
    credits: {
      title: "Créditos",
      currentBalance: "Saldo actual",
      monthlyCredits: "Créditos mensuales",
      extraCredits: "Créditos extra",
      purchaseCredits: "Comprar créditos",
      creditHistory: "Historial de créditos",
      consumption: "Consumo",
      purchase: "Compra",
      expiration: "Vencimiento",
      expiresEndOfMonth: "Vence a fin de mes",
      neverExpires: "No expira",
      reserved: "Reservados",
      used: "Utilizados",
      available: "Disponibles",
      insufficientCredits: "Créditos insuficientes",
      creditPackages: "Paquetes de créditos",
      buyNow: "Comprar ahora",
    },
    settings: {
      title: "Configuración",
      theme: "Tema",
      language: "Idioma",
      lightMode: "Modo claro",
      darkMode: "Modo oscuro",
      accentColor: "Color de acento",
      accentColorHint: "Introduce un color hexadecimal",
      preview: "Vista previa",
      saveSettings: "Guardar configuración",
      settingsSaved: "Configuración guardada",
      general: "General",
      appearance: "Apariencia",
      notifications: "Notificaciones",
      security: "Seguridad",
      paletteHint: "Personaliza los colores de cada zona de la interfaz. Puedes definir paletas distintas para modo claro y oscuro.",
      paletteGroupBrand: "Marca e interfaz",
      paletteGroupSemantic: "Estados semánticos",
      paletteGroupWhatsapp: "WhatsApp Web",
      changeColor: "Cambiar",
      resetPaletteMode: "Restablecer este modo",
      resetPaletteAll: "Restablecer todo",
      palettePreviewBrand: "Vista previa — interfaz",
      palettePreviewSemantic: "Vista previa — estados semánticos",
      palettePreviewWhatsapp: "Vista previa — WhatsApp Web",
      palettePreviewMessages: {
        error: "No se pudo guardar el registro.",
        warning: "Revisa los datos antes de continuar.",
        success: "Cambios guardados correctamente.",
        info: "La sesión expira en 5 minutos.",
      },
            palettePreviewLabels: {
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
      navMenuTitle: "Menú lateral",
      navMenuHint: "Elige qué secciones aparecen en el menú de navegación. Los cambios se aplican al instante en este dispositivo.",
      navMenuMinOne: "Debe quedar al menos una sección visible en el menú.",
      navMenuReset: "Mostrar todas",
      paletteTokens: {
        sidebar: "Barra lateral",
        primary: "Color primario",
        primaryHover: "Hover primario",
        canvas: "Fondo general",
        surface: "Tarjetas y paneles",
        muted: "Texto secundario",
        border: "Bordes",
        error: "Error (texto)",
        errorBg: "Error (fondo)",
        warning: "Advertencia (texto)",
        warningBg: "Advertencia (fondo)",
        success: "Éxito (texto)",
        successBg: "Éxito (fondo)",
        info: "Info (texto)",
        infoBg: "Info (fondo)",
        whatsapp: "Botón WhatsApp",
        whatsappBg: "Panel (fondo)",
        whatsappBorder: "Panel (borde)",
        whatsappMuted: "Panel (texto secundario)",
      },
      tabs: {
        profile: "Perfil",
        clinicalHistory: "Historia clínica",
        integrations: "Integraciones",
        clinic: "Clínica",
        billing: "Suscripción",
      },
      settingsScope: {
        appliesClinic: "Aplica a toda la clínica.",
        appliesIndependent: "Aplica a tu consultorio independiente.",
        appliesPractice: "Aplica a tu consultorio.",
      },
      watermark: {
        title: "Marca de agua del fondo",
        hint: "Imagen sutil en el área principal. Ajusta tamaño, posición e intensidad.",
        show: "Mostrar marca de agua en el fondo",
        customImage: "Imagen personalizada",
        useProfessionalLogo: "Usar logo profesional",
        logoHint: "Si eliges el logo profesional o de clínica, se usa el configurado en esta página.",
        loading: "Cargando marca de agua…",
        imageTooLarge: "La imagen no puede superar 2 MB.",
        invalidFormat: "Formato no válido. Use PNG, JPG o WebP (máx. 2 MB).",
        loadImageError: "Error al cargar imagen.",
        saved: "Marca de agua guardada.",
        saveFailed: "Error al guardar.",
        imageLabel: "Imagen",
        noLogo: "Sin logo configurado",
        noImage: "Sin imagen",
        upload: "Subir imagen",
        formatHint: "JPEG, PNG o WebP · máx. 2 MB",
        removeImage: "Quitar imagen",
        intensity: "Intensidad ({pct}%)",
        intensityHint: "6–10% suele verse bien como marca de agua sutil.",
        size: "Tamaño ({pct}% del panel)",
        zoom: "Zoom ({pct}%)",
        zoomHint: "Sube el zoom (200% o más) para cubrir toda el área visible. Combina con posición centrada.",
        positionX: "Posición horizontal ({pct}%)",
        positionY: "Posición vertical ({pct}%)",
        left: "Izquierda",
        center: "Centro",
        right: "Derecha",
        top: "Arriba",
        bottom: "Abajo",
        saving: "Guardando…",
        save: "Guardar marca de agua",
      },
      billing: {
        title: "Suscripción",
        subscriptionTitle: "Suscripción PodoAdmin",
        independentPlan: "Plan podólogo independiente",
        status: "Estado",
        trialPeriod: "Periodo de prueba",
        trialEnd: "Fin del periodo de prueba",
        trialActive: "Periodo de prueba de 1 mes activo. Disfruta del acceso completo hasta {date}",
        adminNoSub: "Los administradores de plataforma no requieren suscripción.",
        receptionistHint: "La suscripción de la clínica la gestiona el administrador de la clínica.",
        statusActive: "Activa",
        statusPastDue: "Pago pendiente",
        statusCancelled: "Cancelada",
        paymentReceived: "Pago recibido. La suscripción se activará en unos segundos.",
        paymentCancelled: "Pago cancelado. Puedes intentarlo de nuevo cuando quieras.",
        cardVerified: "Tarjeta verificada correctamente.",
        cardVerifyError: "Error al verificar la tarjeta.",
        cardMockVerified: "Tarjeta mock verificada (solo desarrollo).",
        cardSetupError: "No se pudo iniciar verificación de tarjeta.",
        trialActivated: "Periodo de prueba activado.",
        trialActivateError: "No se pudo activar la prueba.",
        checkoutError: "No se pudo iniciar el pago.",
        portalError: "No se pudo abrir el portal de facturación.",
        activateTrialTitle: "Activar prueba gratuita (1 mes)",
        activateTrialHint: "Verifica tu correo y tarjeta. Una cuenta, una tarjeta y una conexión (IP) solo pueden usarse una vez para la prueba.",
        stepEmail: "1. Correo verificado",
        emailVerifyHint: "Revisa tu bandeja de entrada{email} y confirma el enlace de verificación. Si no lo recibiste, cierra sesión y vuelve a solicitarlo al registrarte.",
        stepCard: "2. Tarjeta",
        verifyCard: "Verificar tarjeta (sin cobro hoy)",
        activateMonthTrial: "Activar prueba de 1 mes",
        overLimit: "Tu clínica tiene {count} podólogos activos, por encima de los {limit} incluidos, y el cobro de adicionales no está configurado. Contacta a PodoAdmin.",
        overCapacityAfterDowngrade: "Tienes {count} podólogos activos, más de los {limit} que permite tu plan actual. Siguen funcionando con normalidad, pero no podrás añadir ninguno nuevo hasta que compres asientos adicionales o reduzcas tu equipo.",
        loading: "Cargando…",
        clinicPlan: "Plan clínica",
        activePodiatrists: "Podólogos activos:",
        stripeNotConfigured: "Stripe no está configurado. Define STRIPE_PRICE_CLINIC_MONTHLY_STANDARD y STRIPE_PRICE_INDEPENDENT_MONTHLY en el servidor.",
        subscribe: "Suscribirse — ${amount} USD/mes",
        manageStripe: "Gestionar facturación en Stripe",
        clinicManagedByAdmin: "La suscripción de tu clínica la gestiona el administrador de la clínica.",
        extraSeatsTitle: "Podólogos adicionales",
        extraSeatsHint: "Tu plan incluye {included} podólogos. Agrega los que necesites por ${price} USD/mes cada uno; el cambio se prorratea en tu factura.",
        extraSeatsLabel: "Podólogos adicionales",
        extraSeatsSave: "Actualizar podólogos adicionales",
        extraSeatsSaved: "Podólogos adicionales actualizados.",
        extraSeatsTotal: "Adicionales: {seats} × ${price} = ${total} USD/mes",
        extraSeatsError: "No se pudieron actualizar los podólogos adicionales.",
        extraSeatsBreakdown: "{included} incluidos en tu plan + {seats} adicionales",
        extraSeatsTrialNote: "Durante la prueba puedes ajustar tu cupo sin costo. Al activar tu suscripción se cobrarán ${price} USD/mes por cada podólogo adicional.",
        extraSeatsTrialSaved: "Cupo de podólogos actualizado. Ya puedes agregar más podólogos a tu clínica.",
        growthTitle: "¿Tu consulta crece?",
        growthHint: "Sube a Premium para desbloquear analíticas, herramientas clínicas avanzadas y campañas de WhatsApp, o pasa a un plan Clínica para sumar podólogos y recepción.",
        growthClinicBullet: "Plan Clínica: desde $100 USD/mes con 5 podólogos incluidos (8 en Premium) y podólogos adicionales por $10 USD/mes.",
        growthContact: "Quiero pasar a plan Clínica",
      },
      dashboardLogo: {
        title: "Logo en el panel",
        loading: "Cargando opciones del dashboard…",
        saved: "Configuración del logo en dashboard guardada.",
        saveFailed: "Error al guardar.",
        enabledByAdmin: "El administrador de la clínica ha activado la visualización del logo en el dashboard.",
        notShown: "El logo no se muestra en el dashboard.",
        hint: "Tarjeta en la pantalla principal. Ajusta tamaño, posición e intensidad.",
        show: "Mostrar logo en el dashboard",
        opacity: "Opacidad ({pct}%)",
        size: "Tamaño ({pct}% del área de la tarjeta)",
        zoom: "Zoom ({pct}%)",
        zoomHint: "Amplía o reduce el logo dentro del área. La tarjeta crece para evitar recortes.",
        positionX: "Posición horizontal ({pct}%)",
        positionY: "Posición vertical ({pct}%)",
        left: "Izquierda",
        center: "Centro",
        right: "Derecha",
        top: "Arriba",
        bottom: "Abajo",
        saving: "Guardando…",
        save: "Guardar logo en dashboard",
      },
            clinicalLayout: {
        loadingDesigner: "Cargando diseñador…",
        title: "Diseñador de historia clínica",
        hint: "Activa o desactiva bloques para sesiones e impresión. Añade secciones personalizadas según tu flujo clínico.",
        restoreDefault: "Restaurar predeterminado",
        saveDesign: "Guardar diseño",
        addSection: "Añadir sección",
        editSection: "Editar sección",
        previewForm: "Vista previa — formulario de sesión",
        newSectionDefault: "Nueva sección",
        itemN: "Ítem {n}",
        columnN: "Columna {n}",
        saved: "Diseño guardado correctamente.",
        saveFailed: "Error al guardar.",
        restoreConfirm: "¿Restaurar todas las secciones al diseño predeterminado? Se perderán las personalizadas.",
        saving: "Guardando…",
        readOnlyHint: "Solo lectura: el administrador de la clínica configura el diseño compartido.",
        sectionsCount: "Secciones ({count})",
        sectionTitlePlaceholder: "Título de la sección",
        titleLabel: "Título",
        builtinTitleHint: "Puedes personalizar el título visible en sesión e impresión.",
        onPatientCard: "En ficha paciente",
        enabled: "Activa",
        inSession: "En sesión",
        inPrint: "En impresión",
        patientCardHelp: "muestra u oculta el campo al crear, editar o ver un paciente.",
        printAntecedentsHelp: "incluye los antecedentes en la historia clínica podológica impresa.",
        enabledHelp: "incluye o excluye la sección del flujo clínico.",
        inSessionHelp: "visible al crear o editar una sesión.",
        inPrintHelp: "incluida en el historial imprimible (solo contenido con datos).",
        deleteCustomSection: "Eliminar sección personalizada",
        selectSection: "Selecciona una sección de la lista",
        systemField: "Campo del sistema",
        noSessionSections: "Ninguna sección visible en sesión.",
        remove: "Quitar",
        maxColumns: "Máximo {count} columnas.",
        checklistItems: "Ítems del checklist",
        yesNoNaRows: "Filas SI / NO / N/A",
        options: "Opciones",
        yesNoNaHint: "Cada fila será una pregunta en la sesión.",
        addItem: "+ Añadir ítem",
        addRow: "+ Añadir fila",
        addOption: "+ Añadir opción",
        unit: "Unidad",
        unitPlaceholder: "min, ml, mm, %…",
        defaultUnit: "unidad",
        scaleMax: "Escala máxima",
        conditionalPrompt: "Pregunta SI/NO",
        conditionalPlaceholder: "¿Hubo complicación?",
        tableColumns: "Columnas de la tabla",
        tableColumnsHint: "Nombre de cada columna (p. ej. producto, cantidad, lote).",
        addColumn: "+ Añadir columna",
        tableRows: "Filas en sesión",
      },
      print: {
        title: "Configuración de impresiones",
        hint: "Ajusta cómo se ven la historia clínica y las recetas al imprimir o guardar como PDF.",
        preview: "Vista previa",
        loading: "Cargando preferencias de impresión…",
        saved: "Preferencias de impresión guardadas.",
        saveFailed: "No se pudo guardar.",
        readOnlyHint: "Solo el administrador de la clínica puede cambiar estas opciones. Se muestran en modo lectura.",
        generalTitle: "General",
        generalDesc: "Se aplica a ambos documentos.",
        headerAlign: "Alineación de la cabecera",
        alignLeft: "Izquierda",
        alignCenter: "Centrada",
        monochrome: "Imprimir en blanco y negro",
        monochromeHint: "Escala de grises, ideal para ahorrar tinta.",
        showGeneratedBy: "Mostrar \"Generado por PodoAdmin\" en el pie",
        footerText: "Texto de pie de página personalizado",
        footerPlaceholder: "Ej. Horario de atención, aviso legal, redes sociales…",
        historyTitle: "Historia clínica",
        historyDesc: "Documento completo del paciente.",
        showLogo: "Mostrar logo en la cabecera",
        showLegalData: "Mostrar datos legales",
        showLegalDataHint: "RFC, CLUES, COFEPRIS y registro sanitario.",
        includePhotos: "Incluir fotografías clínicas",
        includePhotosHint: "Requiere que el bloque de imágenes esté activo en el diseñador.",
        compact: "Diseño compacto",
        compactHistoryHint: "Menos márgenes, tipografía y diagramas más pequeños para ahorrar páginas.",
        orientation: "Orientación de página",
        portrait: "Vertical",
        landscape: "Horizontal",
        orientationHistoryHint: "Recomendado: vertical para historias clínicas.",
        evolutionRows: "Filas de evolución clínica a imprimir",
        rxTitle: "Recetas",
        rxDesc: "Formato de las recetas / prescripciones.",
        showWeight: "Mostrar peso del paciente",
        showHeight: "Mostrar estatura del paciente",
        showNextVisit: "Mostrar próxima visita",
        showNotes: "Mostrar notas adicionales",
        showSignatureCedula: "Mostrar cédula/registro en la firma",
        compactRxHint: "Menos márgenes y tipografía más pequeña para ocupar menos espacio.",
        orientationRxHint: "Recomendado: horizontal para recetas.",
        folioPosition: "Posición del folio",
        folioInline: "En cabecera (recomendado)",
        folioBar: "Barra destacada",
        folioHint: "El folio en cabecera ahorra una línea completa y suele caber en una sola página.",
        saving: "Guardando…",
        save: "Guardar preferencias",
        reset: "Restablecer valores por defecto",
        previewSimHint: "Simulación aproximada; el documento final usa los datos reales del paciente.",
        tabHistory: "Historia clínica",
        tabRx: "Receta",
        statusMonochrome: "Modo blanco y negro activo · ",
        statusHeaderCenter: "Cabecera centrada",
        statusHeaderLeft: "Cabecera alineada a la izquierda",
        statusEvolutionRows: " · {count} filas de evolución",
        statusCompact: " · diseño compacto",
        statusFolioInline: " · folio en cabecera",
        demoClinicName: "Clínica Podológica Demo",
        demoLicense: "Lic./Cédula: 12345678",
        demoLegal: "RFC: XAXX010101000 · CLUES: DFSSA000001",
        demoContact: "555 123 4567 · demo@clinica.com",
        demoHistoryTitle: "HISTORIA CLÍNICA PODOLÓGICA · Folio: PREMIUM-001",
        demoPatientSection: "I. Datos del paciente",
        demoPatientCells: ["Nombre: Laura M.", "DNI: INE-884422", "Tel: 555…", "Nac: 12/03/1985"],
        demoEvolutionSection: "IV. Evolución clínica",
        demoColDate: "Fecha",
        demoColDiagnosis: "Diagnóstico",
        demoColTreatment: "Tratamiento",
        demoDiagnosis: "Onicocriptosis",
        demoTreatment: "Desbridamiento",
        demoMoreRows: "+ {count} filas más…",
        demoPhotos: "Fotografías",
        demoFooter: "PodoAdmin · vista previa",
        demoDoctor: "Dr. Podólogo Demo",
        demoCedula: "Cédula: 12345678",
        demoTel: "Tel: 555 123 4567",
        demoFolio: "Folio:",
        demoFolioBar: "FOLIO RECETA:",
        demoPatientData: "DATOS DEL PACIENTE",
        demoName: "Nombre: Laura M.",
        demoDni: "DNI: INE-884422",
        demoAge: "Edad: 41 años",
        demoWeight: "Peso: 72.5 kg",
        demoHeight: "Estatura: 165 cm",
        demoPrescription: "Prescripción / Indicaciones",
        demoPrescriptionBody: "Aplicar crema antimicótica 2 veces al día durante 14 días.",
        demoNextVisit: "Próxima visita",
        demoNextVisitDate: "viernes, 15 de agosto de 2026",
        demoNotes: "Notas adicionales",
        demoNotesBody: "Evitar calzado cerrado.",
        demoSignature: "Firma del profesional",
        logoPlaceholder: "LOGO",
      },
      profileAvatar: {
        changeTitle: "Cambiar foto de perfil",
        invalidFormat: "Formato no válido. Use PNG, JPG o WebP.",
        tooLarge: "La imagen no puede superar 2 MB.",
        saveFailed: "No se pudo guardar la foto.",
        processFailed: "No se pudo procesar la imagen.",
        removeFailed: "No se pudo quitar la foto.",
        saving: "Guardando…",
        changePhoto: "Cambiar foto",
        uploadPhoto: "Subir foto",
        removePhoto: "Quitar foto",
        hint: "JPG, PNG o WebP. Máx. 2 MB. Se muestra en el menú lateral.",
      },
      profile: {
        title: "Perfil de usuario",
        name: "Nombre",
        email: "Email",
        readOnlyHint: "Los datos del perfil no pueden editarse aquí. Contacte con el administrador si necesita realizar cambios.",
      },
      cooldown: {
        logoPolicy: "Tras guardar, el logo queda fijo durante 15 días. Pasado ese período podrás subirlo o cambiarlo de nuevo.",
        logoBlocked: "El logo solo puede modificarse cada 15 días.",
        clinicInfoPolicy: "Tras guardar, los datos de la clínica quedan fijos durante 15 días. Pasado ese período podrás modificarlos de nuevo.",
        clinicInfoBlocked: "Los datos solo pueden modificarse cada 15 días.",
        professionalInfoPolicy: "Tras guardar, estos datos quedan fijos durante 15 días. Pasado ese período podrás modificarlos de nuevo.",
        professionalInfoBlocked: "Los datos solo pueden modificarse cada 15 días.",
        profilePolicy: "Nombre y correo electrónico solo pueden modificarse por un administrador. Tras cada cambio deben transcurrir 15 días antes de una nueva modificación.",
        clinicReadOnlyPolicy: "La información de la clínica la gestiona tu administrador. Tras cada cambio deben transcurrir 15 días antes de una nueva modificación.",
        genericBlocked: "Los datos solo pueden modificarse cada 15 días.",
      },
      clinic: {
        fallbackName: "Clínica {id}",
        errors: {
          nameCodeRequired: "Nombre y código de la clínica son obligatorios.",
          invalidWebsite: "La URL del sitio web no es válida. Por favor, verifica que esté correctamente configurada.",
        },
      },
      consent: {
        title: "Consentimiento informado",
        sharedTitle: "Texto compartido de la clínica",
        sharedBody: "Este texto lo gestiona el administrador de la clínica y se usa en el consentimiento de pacientes.",
        currentVersion: "Versión actual: {version}",
        empty: "Sin texto configurado.",
        editHint: "Puedes editar el texto; cada guardado incrementa la versión.",
        placeholder: "Redacta aquí los términos y el consentimiento informado que el paciente debe aceptar.",
        save: "Guardar consentimiento",
        saveError: "Error al guardar el consentimiento.",
      },
      logo: {
        empty: "Sin logo",
        previewAlt: "Vista previa",
        upload: "Subir imagen",
        formatHint: "PNG, JPG o WebP · máx. 2MB",
        save: "Guardar logo",
        remove: "Quitar logo",
        errors: {
          invalidFormat: "Formato no válido. Use PNG, JPG o WebP (máx. 2MB).",
          tooLarge: "El archivo es demasiado grande. Máximo 2MB.",
          processFailed: "No se pudo procesar la imagen.",
          cooldown: "El logo solo puede modificarse cada 15 días.",
          saveFailed: "No se pudo guardar el logo. Inténtalo de nuevo.",
        },
      },
      clinicLogo: {
        title: "Logo de la clínica",
        sharedTitle: "Logo compartido de la clínica",
        sharedBody: "Este logo lo ven todos los profesionales de la clínica en documentos e impresión.",
        alt: "Logo de clínica",
        uploadHint: "Sube el logo que identificará a tu clínica en la aplicación y documentos.",
      },
      professionalLogo: {
        title: "Logo profesional",
        uploadHint: "Logo personal para documentos e impresión cuando no hay logo de clínica.",
        alt: "Logo profesional",
      },
      adminLogo: {
        title: "Logo de clínica",
        body: "Los logos de clínica son gestionados por los administradores de cada clínica. Como {role}, no necesitas un logo personal.",
      },
      assignedPodiatrists: {
        title: "Podólogos asignados",
        clinicHint: "Podólogos de tu clínica a los que puedes dar servicio. Marca o desmarca para gestionar citas y pacientes de cada uno.",
        independentHint: "Podólogo que te asignó. Puedes crear pacientes y gestionar su calendario.",
        emptyClinic: "No hay podólogos en tu clínica.",
        save: "Guardar asignación",
        empty: "Sin podólogo asignado.",
      },
      receptionist: {
        title: "Recepcionista",
        description: "Crea y gestiona la recepcionista vinculada a tu cuenta o clínica.",
        status: {
          blocked: "Bloqueada",
          disabled: "Deshabilitada",
          active: "Activa",
        },
        unblock: "Desbloquear",
        block: "Bloquear",
        enable: "Habilitar",
        disable: "Deshabilitar",
        delete: "Eliminar",
        oneOnlyHint: "Solo puedes tener una recepcionista vinculada. Elimínala para crear otra.",
        fields: {
          name: "Nombre",
          email: "Email",
          initialPassword: "Contraseña inicial",
        },
        createdSuccess: "Recepcionista creada correctamente.",
        create: "Crear recepcionista",
        createError: "Error al crear recepcionista",
        confirmDelete: "¿Eliminar a esta recepcionista? Esta acción no se puede deshacer.",
      },
      clinicInfo: {
        title: "Información de la Clínica",
        subtitle: "Datos de contacto y fiscales de tu clínica.",
        setupBanner: "Completa los datos de tu clínica. Mientras el nombre sea provisional o falten contacto y dirección, aparecerán avisos.",
        clinicName: "Nombre de la clínica *",
        clinicNamePlaceholder: "Mi Clínica Podológica",
        clinicCode: "Código (para folios) *",
        clinicCodePlaceholder: "MICP",
        clinicCodeHint: "Máx. 8 caracteres. Se usa en folios (ej: MICP-2025-001)",
        country: "País (prefijo telefónico)",
        countryHint: "Define el prefijo por defecto para teléfonos de la clínica.",
        phone: "Teléfono",
        email: "Email",
        emailPlaceholder: "clinica@ejemplo.com",
        address: "Dirección",
        addressPlaceholder: "Calle Gran Vía, 45, 2º Izquierda",
        city: "Ciudad",
        cityPlaceholder: "Madrid",
        postalCode: "Código Postal",
        postalCodePlaceholder: "28013",
        mapsUrl: "Link de Google Maps (opcional)",
        mapsUrlPlaceholder: "https://maps.app.goo.gl/...",
        mapsUrlHint: "Se usa como ubicación en WhatsApp cuando la dirección no basta para generar un enlace útil.",
        licenseNumber: "Nº Licencia/Registro",
        licensePlaceholder: "CS-28/2024-POD-001",
        website: "Sitio Web (opcional)",
        websitePlaceholder: "https://www.miclinica.com",
        legalName: "Razón social (NOM)",
        rfc: "RFC",
        clues: "CLUES",
        cofepris: "Registro COFEPRIS",
        readOnlyTitle: "Detalles de tu clínica",
        readOnlyBody: "Solo lectura. Tu administrador de clínica gestiona estos datos.",
        labels: {
          name: "Nombre:",
          phone: "Teléfono:",
          email: "Email:",
          address: "Dirección:",
          maps: "Maps:",
          license: "Licencia:",
          consent: "Consentimiento:",
          web: "Web:",
        },
        viewDocument: "Ver documento",
      },
      practice: {
        title: "Información del Consultorio",
        subtitle: "Datos de tu práctica profesional independiente.",
        professionalName: "Nombre profesional",
        namePlaceholder: "Dr. Juan Pérez García",
        country: "País (prefijo telefónico)",
        countryHint: "Prefijo por defecto para tu consulta.",
        emailPlaceholder: "consulta@ejemplo.com",
        sanitaryRegistry: "Registro sanitario",
        cedula: "Cédula profesional",
        cedulaPlaceholder: "12345678",
      },
      credentials: {
        title: "Credenciales profesionales",
        subtitle: "Teléfono de contacto y número de registro profesional.",
        contactPhoneTitle: "Teléfono de contacto",
        contactPhoneHint: "Visible para pacientes y en documentos cuando corresponda.",
        country: "País",
        mobile: "Móvil",
        savePhone: "Guardar teléfono",
        registryNumber: "Nº de registro profesional",
        registryPlaceholder: "REG-2024-001",
        save: "Guardar credenciales",
        clinicInfoTitle: "Información de la clínica",
        clinicInfoBody: "Como miembro de una clínica, estos datos los gestiona el administrador.",
        clinicName: "Nombre de la clínica",
      },
      common: {
        saved: "Guardado",
        readOnly: "Solo lectura",
        saveInfo: "Guardar información",
        emDash: "—",
        ellipsis: "...",
      },
      errors: {
        connectionSave: "Error de conexión al guardar.",
      },
      supportSenderLabel: "PodoAdmin",
    },
    premium: {
      badge: "Premium",
      baseBadge: "Base",
      lockedTab: "Disponible en Premium",
      upsellTitle: "Disponible en el plan Premium",
      upsellBody: "Las analíticas de ventas, cobros, rentabilidad y agenda están incluidas en el plan Premium. Mejora tu plan para desbloquearlas.",
      upsellCta: "Ver planes y mejorar",
      clinicalToolsLockedTitle: "Herramientas clínicas es una función Premium",
      clinicalToolsLockedBody: "El diseñador de plantillas, el inventario y las derivaciones están incluidos en el plan Premium.",
      campaignsLockedTitle: "Campañas de WhatsApp es una función Premium",
      campaignsLockedBody: "Las campañas y la reactivación de pacientes por WhatsApp están incluidas en el plan Premium. WhatsApp Web básico sigue disponible en tu plan.",
      agendaAnalyticsLockedBody: "La analítica de demanda, ocupación y cierres diarios está incluida en el plan Premium.",
      upgradeButton: "Mejorar a Premium",
      upgradeSuccess: "Tu plan se actualizó correctamente.",
      planBase: "Plan Base",
      planPremium: "Plan Premium",
      menuManagePlan: "Plan (Base/Premium)",
      planPrompt: "Plan actual: {current}. Escribe \"base\", \"premium\" o \"auto\" (auto = según lo pagado en Stripe):",
      planInvalid: "Valor inválido. Usa \"base\", \"premium\" o \"auto\".",
      planUpdated: "Plan actualizado: {tier}.",
    },

    reservationAction: {
      confirmTitle: "Confirmar cita",
      cancelTitle: "Cancelar cita",
      rescheduleTitle: "Reagendar cita",
      loading: "Cargando tu reserva…",
      greeting: "Hola {name},",
      confirmQuestion: "¿Confirmas tu asistencia a esta cita?",
      cancelQuestion: "¿Seguro que quieres cancelar esta cita?",
      dateLabel: "Fecha",
      timeLabel: "Hora",
      clinicLabel: "Clínica",
      podiatristLabel: "Profesional",
      confirmButton: "Confirmar asistencia",
      cancelButton: "Cancelar cita",
      confirmedOk: "¡Cita confirmada! Te esperamos.",
      cancelledOk: "Tu cita ha sido cancelada. Gracias por avisar.",
      rescheduledOk: "Tu cita ha sido cancelada. Pronto nos pondremos en contacto contigo para reagendarla.",
      alreadyConfirmed: "Esta cita ya estaba confirmada. ¡Te esperamos!",
      alreadyCancelled: "Esta cita ya estaba cancelada.",
      invalidMsg: "Este enlace no es válido o ya no está disponible.",
      expiredMsg: "Esta cita ya pasó; el enlace no está disponible.",
      errorGeneric: "No se pudo procesar tu solicitud. Intenta de nuevo en unos minutos.",
      processingConfirm: "Confirmando tu cita…",
      processingCancel: "Cancelando tu cita…",
      processingReschedule: "Procesando tu solicitud de reagendo…",
      changedMindToCancel: "¿Cambiaste de opinión? Cancelar esta cita",
      changedMindToConfirm: "¿Cambiaste de opinión? Confirmar asistencia",
      slotTaken: "El horario fue ocupado por otro paciente. No se pudo reconfirmar.",
      pageCloseable: "Tu confirmación se registró correctamente. Ya puedes cerrar esta página.",
      closePageNow: "Cerrar ahora",
      keepOpen: "Mantener abierta",
      cantAutoClose: "Por favor cierra esta ventana manualmente",
      satisfactionTitle: "Tu opinión",
      satisfactionProcessing: "Registrando tu opinión…",
      thanksGood: "¡Gracias! Nos alegra que tu visita fuera excelente.",
      thanksRegular: "Gracias por tu opinión. ¿Qué podríamos mejorar?",
      thanksBad: "Lamentamos que tu visita no fuera buena. Cuéntanos qué pasó para poder mejorar.",
      reviewCta: "Déjanos una reseña en Google",
      complaintPrompt: "Quejas o sugerencias (opcional)",
      complaintPlaceholder: "Cuéntanos con detalle qué podemos mejorar…",
      anonymousLabel: "Enviar de forma anónima",
      sendComment: "Enviar comentario",
      commentSent: "¡Gracias! Recibimos tu comentario y le daremos seguimiento.",
      sending: "Enviando…",
      bookingTitle: "Agenda tu cita",
      bookingInvalid: "Este enlace no está disponible.",
      bookingPickDate: "Elige un día",
      bookingPickTime: "Elige un horario",
      bookingLoadingSlots: "Cargando horarios…",
      bookingNoSlots: "No hay horarios disponibles ese día.",
      bookingName: "Tu nombre",
      bookingPhone: "Tu WhatsApp (para confirmarte)",
      bookingConfirm: "Confirmar cita",
      bookingBooking: "Agendando…",
      bookingDoneTitle: "¡Cita agendada!",
      bookingDoneMsg: "Te esperamos el {date} a las {time}. Te contactaremos para confirmar.",
      bookingSlotTaken: "Ese horario acaba de ocuparse. Elige otro, por favor.",
    },

    support: {
      title: "Contactar PodoAdmin",
      contactPodoAdmin: "Contactar PodoAdmin",
      contactSubtitle: "Envía un mensaje directo a soporte. Te responderemos lo antes posible.",
      newConversation: "Nuevo mensaje",
      subject: "Asunto",
      subjectPlaceholder: "Ej: Problema con la facturación",
      message: "Mensaje",
      messagePlaceholder: "Describe tu consulta o problema...",
      send: "Enviar",
      myConversations: "Mis conversaciones",
      noConversations: "No tienes conversaciones aún.",
      reply: "Responder",
      replyPlaceholder: "Escribe tu respuesta...",
      open: "Abierta",
      closed: "Cerrada",
      markAsRead: "Marcar como leído",
      closeConversation: "Cerrar conversación",
      reopenConversation: "Reabrir conversación",
      from: "De",
      sent: "Enviado",
    },
    layout: {
      brandFallback: "PodoAdmin",
      unlockSidebarVisible: "Desbloquear (bloqueado visible)",
      unlockSidebarHidden: "Desbloquear (bloqueado oculto)",
      lockSidebarVisible: "Bloquear sidebar visible",
      toggleSidebarLock: "Alternar bloqueo de sidebar",
      hideMenu: "Ocultar menú",
      showMenu: "Mostrar menú",
      pendingAccessBanner: "Tu acceso clínico está pendiente. Activa el pago en Facturación o espera a que un administrador habilite tu cuenta.",
      goToBilling: "Ir a facturación",
      goToSupport: "Ir a soporte",
      subscriptionInactiveBanner: "Tu suscripción no está activa. Renueva para seguir usando la plataforma.",
      closeMenu: "Cerrar menú",
      sponsored: "Patrocinado",
      closeAnnouncement: "Cerrar anuncio",
      promoCodeOnSite: "Código en la web del organizador:",
      seeMore: "Ver más",
      interested: "Me interesa",
      interestRegistered: "Interés registrado ✓",
    },
    whatsapp: {
      title: "WhatsApp Business",
      subtitle:
        "Conecta tu número de negocio de Meta para recordatorios de citas por WhatsApp. Los datos se guardan cifrados. Solo tú (podólogo o administrador de clínica) puedes configurar esta sección.",
      loading: "Cargando configuración de WhatsApp…",
      setupTitle: "Cómo configurar WhatsApp (token de larga duración)",
      setupStep1Prefix: "Entra a",
      setupStep1Link: "Business Settings → Usuarios del sistema",
      setupStep1Suffix: "y crea un usuario del sistema.",
      setupStep2: "Asigna tu app de Meta y tu cuenta de WhatsApp Business (WABA) como activos.",
      setupStep3:
        "Genera un token para ese usuario y concédele permisos de WhatsApp (mensajería/administración según tu flujo).",
      setupStep4Prefix: "Desde",
      setupStep4Link: "Meta for Developers",
      setupStep4Suffix: "copia también Phone Number ID y WABA ID.",
      setupStep5: "Pega los datos en este formulario, guarda y pulsa «Probar conexión».",
      statusLabel: "Estado:",
      statusConnected: "conectado",
      statusError: "error",
      statusPending: "pendiente",
      phoneNumberIdLabel: "Phone Number ID (Meta) *",
      phoneNumberIdPlaceholder: "Ej: 123456789012345",
      wabaIdLabel: "WhatsApp Business Account ID (opcional)",
      wabaIdPlaceholder: "WABA ID",
      accessTokenLabel: "Token de acceso permanente",
      accessTokenRequired: "*",
      accessTokenKeepCurrent: "(dejar vacío para mantener el actual)",
      accessTokenPlaceholderSaved: "•••••••• (guardado)",
      accessTokenPlaceholderNew: "Token desde Meta Business Suite",
      hideTokenField: "Ocultar campo de token",
      changeToken: "Cambiar token",
      publicPhoneLabel: "Teléfono público (opcional)",
      publicPhonePlaceholder: "+34600111222",
      remindersSection: "Recordatorios de citas",
      remindersAuto: "Activar recordatorios automáticos por WhatsApp (solo pacientes con teléfono)",
      reminderDaysBefore: "Días antes de la cita",
      reminderHoursBefore: "Horas antes de la cita",
      reminderHourBefore: "{hours} h antes",
      reminderDayOne: "{days} día antes",
      reminderDayMany: "{days} días antes",
      reminderSelectHour: "Antelación del recordatorio",
      reminderAddHour: "+ Añadir otro horario",
      reminderRemoveHour: "Quitar",
      reminderHoursHint: "Puedes añadir hasta 8 avisos por horas. Los días (5, 2 y 1) son independientes.",
      reminderScheduleHint: "Activa los recordatorios automáticos arriba para editar el calendario de avisos.",
      reminderDaysHelp: "Pulsa cada opción para activarla o desactivarla (debe quedar al menos una).",
      reminderHoursHelp: "Elige en cada desplegable cuántas horas antes avisar al paciente.",
      reminderDaysRequired: "Selecciona al menos un día de recordatorio.",
      reminder48h: "48 h antes",
      reminder24h: "24 h antes",
      templateNameLabel: "Nombre plantilla Meta (recordatorio)",
      templateNamePlaceholder: "ej: appointment_reminder",
      templateHint:
        "Debe estar aprobada en Meta Business Manager con 4 variables: {{1}} nombre, {{2}} fecha, {{3}} hora, {{4}} notas/extras.",
      defaultExtraNoteLabel: "Nota o mensaje extra por defecto",
      defaultExtraNotePlaceholder: "Ej: Trae estudios previos. Estacionamiento en calle lateral.",
      defaultExtraNoteHint:
        "Se envía como 4.º parámetro de la plantilla en recordatorios automáticos y manuales (si no escribes otra nota al enviar). Máximo 500 caracteres.",
      templateLanguageLabel: "Idioma plantilla",
      templateLanguagePlaceholder: "es",
            integrationActive: "Integración activa (envíos habilitados cuando el cron esté activo)",
      receptionistApiEnabled: "Permitir a recepción usar el envío automático por API Meta (recordatorios y historial).",
      save: "Guardar configuración",
      saving: "Guardando…",
      testConnection: "Probar conexión",
      testing: "Probando…",
      disconnect: "Desconectar",
      guidesFooter: "Guías oficiales:",
      guidesCloudApi: "Meta WhatsApp Cloud API",
      guidesSystemUsers: "System Users (token de larga duración)",
      consentNote: "Los pacientes deben haber dado consentimiento para mensajes por WhatsApp.",
      purposeTitle: "¿Para qué sirve esta sección?",
      purposeDescription:
        "Aquí conectas tu cuenta de WhatsApp Business (Meta) para enviar recordatorios de citas a tus pacientes. Guardas el token y la plantilla aprobada; luego, desde «Mensajes WhatsApp», puedes enviar recordatorios y ver si se entregaron o fallaron.",
      errorApiUnavailable:
        "No se pudo contactar el servicio de WhatsApp en el servidor. Recarga la página (Ctrl+F5). Si persiste, reinicia el servidor de desarrollo.",
      errorLoad: "No se pudo cargar la configuración",
      errorPhoneRequired: "El Phone Number ID de Meta es obligatorio.",
      errorTokenRequired: "El token de acceso permanente de Meta es obligatorio.",
      errorTemplateRequired: "Indica el nombre de la plantilla aprobada en Meta para recordatorios.",
      errorSave: "Error al guardar",
      errorTest: "Error al probar conexión",
      errorTestFailed: "La prueba de conexión falló",
      errorDisconnect: "Error al desconectar",
      disconnectConfirm:
        "¿Eliminar la configuración de WhatsApp? Los recordatorios automáticos dejarán de enviarse.",
      successSaved: "Configuración de WhatsApp guardada correctamente.",
      successSavedWarning: "Guardado. Advertencia de conexión: {warning}",
      successTest: "Conexión correcta con Meta.",
      successTestWithPhone: "Conexión correcta ({phone})",
      successDisconnected: "WhatsApp desconectado.",
      campaigns: {
        title: "Campañas WhatsApp",
        pageHint: "Difunde mensajes a pacientes con teléfono. Puedes usar WhatsApp Web (manual, sin API) o el envío automático por API Meta si lo tienes configurado.",
        webTitle: "Campañas por WhatsApp Web",
        webHint: "Crea el borrador del mensaje y envíalo paciente a paciente con wa.me. Sin configurar Meta: tú pulsas Enviar en WhatsApp.",
        openWeb: "Abrir WhatsApp Web",
        newDraft: "Nueva campaña (borrador)",
        metaApiTitle: "Envío automático por API Meta",
        metaApiHint: "Requiere WhatsApp Business configurado en Ajustes. Puedes ignorar esta sección si solo usas WhatsApp Web.",
        denied: "Sin permiso para campañas WhatsApp.",
        patientsLoadError: "Error pacientes",
        draftCreated: "Campaña creada en borrador",
        createError: "Error al crear",
        sendConfirm: "¿Enviar esta campaña por API Meta a todos los pacientes con teléfono?",
        apiSendResult: "API: enviados {sent}, fallidos {failed}",
        apiSendError: "Error al enviar por API",
        namePlaceholder: "Nombre interno (ej. Promo verano)",
        messagePlaceholder: "Mensaje con variables, ej:\nHola {{nombre}}, le informamos que...",
        variablesHint: "Variables:",
        variablesList: "{{nombre}} (nombre), {{apellido}} (apellido), {{nombre_completo}} (nombre completo)",
        clinicOnlyFilter: "Solo pacientes de mi clínica",
        recipientsWithPhone: "Destinatarios con teléfono válido:",
        recipientsMismatchHint: "Hay {count} paciente(s) en tu listado; revisa que tengan teléfono con al menos 8 dígitos o desmarca «Solo pacientes de mi clínica».",
        patientsLoadFailed: "No se pudieron cargar los pacientes. Comprueba permisos o recarga la página.",
        noPatientsYet: "No hay pacientes en el listado todavía.",
        saveDraft: "Guardar borrador",
        assistantTitle: "Asistente de envío — {name}",
        assistantPatientOf: "Paciente {current} de {total}:",
        openWhatsApp: "Abrir WhatsApp",
        assistantDone: "Asistente completado: {count} pacientes.",
        finish: "Finalizar",
        nextPatient: "Siguiente paciente",
        draftsToSend: "Borradores para enviar",
        loading: "Cargando…",
        recipientsCount: "{count} destinatario(s) con WhatsApp",
        sendAssistant: "Asistente de envío",
        deleteDraft: "Eliminar",
        deleteDraftConfirm: "¿Eliminar el borrador «{name}»? Esta acción no se puede deshacer.",
        deleteDraftError: "No se pudo eliminar el borrador.",
        hideList: "Ocultar lista",
        showList: "Ver lista",
        noValidRecipients: "Sin destinatarios válidos.",
        noDrafts: "No hay borradores. Crea una campaña arriba.",
        connected: "(conectado)",
        optional: "(opcional)",
        receptionistApiHint: "Envío automático habilitado por tu podólogo.",
        receptionistApiDisabled: "Tu podólogo aún no ha habilitado el envío automático por API Meta para recepción.",
        configureApiHint: "Configura WhatsApp Business en Ajustes para enviar campañas por API Meta.",
        allCampaigns: "Todas las campañas",
        sentAt: "enviada {date}",
        sending: "Enviando…",
        sendByApi: "Enviar por API",
        noCampaigns: "No hay campañas",
      },
      messages: {
        title: "Mensajes WhatsApp",
        webTitle: "Recordatorios por WhatsApp Web",
        webHint: "Sin configurar la API de Meta. Abre WhatsApp Web o la app con el mensaje ya escrito; tú lo envías manualmente.",
        openWeb: "Abrir WhatsApp Web",
        metaApiTitle: "Envío automático con API Meta",
        metaApiHint: "Requiere API Meta configurada en Ajustes → WhatsApp.",
        historyTitle: "Historial (API automática)",
        historyHint: "Registro de envíos automáticos por API Meta. Los recordatorios por WhatsApp Web no quedan registrados aquí.",
        denied: "No tienes permisos para ver esta sección.",
        patientFallback: "Paciente",
        defaultExtraNote: "Por favor confirme su asistencia respondiendo a este mensaje.",
        noValidPhone: "No hay teléfono válido para {name}.",
        selectAppointmentFirst: "Selecciona una cita primero.",
        reminderSendError: "No se pudo enviar el recordatorio.",
        reminderSent: "Recordatorio enviado correctamente.",
        defaultMessage: "Mensaje predeterminado",
        variablesHint: "Variables:",
        variablesList: "{{nombre}} (nombre), {{fecha}} (fecha), {{hora}} (hora), {{nota}} (nota), {{confirmar}} (enlace para confirmar), {{cancelar}} (enlace para cancelar), {{reagendar}} (enlace para reagendar)",
        extraNotePlaceholder: "Nota extra para todos los envíos de hoy (opcional)",
        saved: "Guardado",
        saveMessage: "Guardar mensaje",
        dayOffsetLabel: "Recordatorios para:",
        dayOffsetToday: "Hoy",
        dayOffsetTomorrow: "Mañana",
        dayOffsetIn2Days: "En 2 días",
        dayOffsetIn5Days: "En 5 días",
        tomorrowAppointments: "Citas de {date}",
        loadingAppointments: "Cargando citas…",
        noTomorrowAppointments: "No hay citas programadas para ese día.",
        noPhone: "Sin teléfono",
        sendViaWhatsApp: "Enviar por WhatsApp",
        connected: "(conectado)",
        optional: "(opcional)",
        receptionistApiHint: "Envío automático habilitado por tu podólogo. Los recordatorios se envían sin abrir WhatsApp Web.",
        configLoadError: "No se pudo obtener el estado de WhatsApp.",
        connectedLabel: "Conectado",
        apiStatusLabel: "Estado API",
        templateLabel: "Plantilla",
        templateUndefined: "No definida",
        lastErrorLabel: "Último error",
        noErrors: "Sin errores",
        sendAutoReminder: "Enviar recordatorio automático",
        selectUpcomingAppointment: "Selecciona una cita próxima",
        sending: "Enviando...",
        sendByApi: "Enviar por API",
        singleExtraNotePlaceholder: "Nota extra para este envío (opcional)",
        lastApiSends: "Últimos envíos por API",
        refresh: "Actualizar",
        loadingHistory: "Cargando historial...",
        configureForHistory: "Configura WhatsApp Business en Ajustes para usar el envío automático y ver el historial aquí.",
        noApiSends: "Sin envíos por API. Los recordatorios por WhatsApp Web no quedan registrados aquí.",
        colDate: "Fecha",
        colPatient: "Paciente",
        colPhone: "Teléfono",
        colStatus: "Estado",
        colNote: "Nota",
        emDash: "—",
        yes: "Sí",
        no: "No",
        pendingRescheduleTitle: "Pendientes de reagendar",
        pendingRescheduleHint: "Citas canceladas que aún no tienen una nueva cita agendada para el mismo paciente.",
        loadingPendingReschedule: "Cargando pendientes de reagendar…",
        noPendingReschedule: "No hay citas pendientes de reagendar.",
        cancelledOn: "Cancelada el {date}",
        sendRescheduleMessage: "Avisar reagendo",
        rescheduleWhatsAppMessage: "Hola {name}, tu cita del {date} fue cancelada. Pronto nos pondremos en contacto contigo para reagendarla. ¡Gracias por tu paciencia!",
        rescheduleWaMsgTitle: "Mensaje de WhatsApp al avisar reagendo",
        rescheduleWaMsgHint: "Texto que se envía al pulsar «Avisar reagendo». Variables: {nombre}, {fecha} y {reserva} (inserta tu link de reserva en línea para que el paciente agende solo).",
        rescheduleMessageSectionTitle: "Mensaje personalizado de reagendo",
        rescheduleMessageHint: "Texto que ve el paciente en la página que abre desde el enlace {{reagendar}} del mensaje de WhatsApp. Si lo dejas vacío, se usa un mensaje predeterminado.",
        rescheduleMessagePlaceholder: "Ej. Tu cita fue cancelada. Escríbenos al WhatsApp para reagendar más rápido.",
        rescheduleMessageScope: "Ámbito: {label}",
        rescheduleMessageReadOnlyHint: "Solo lectura: lo define tu podólogo o el administrador de la clínica.",
        savingRescheduleMessage: "Guardando…",
        saveRescheduleMessageButton: "Guardar mensaje",
        markRescheduleHandled: "Marcar en gestión",
        reopenReschedule: "Reabrir",
        rescheduleHandledBadge: "En gestión",
        dismissReschedule: "Borrar",
        dismissRescheduleConfirm: "¿Borrar a {name} de pendientes de reagendar? La cita no se elimina, solo sale de esta lista.",
        opinionSectionTitle: "Pedir opinión (satisfacción)",
        opinionSectionHint: "Citas atendidas en los últimos 7 días sin opinión. Envía al paciente los enlaces 👍 😐 👎 por WhatsApp.",
        loadingOpinion: "Cargando citas atendidas…",
        noOpinionCandidates: "No hay citas atendidas pendientes de opinión.",
        attendedOn: "Atendida el {date}",
        requestOpinion: "Pedir opinión",
        opinionWhatsAppMessage:
          "Hola {name}, ¿cómo estuvo tu visita en {clinica}? Tu opinión nos ayuda mucho:\n👍 Bien: {good}\n😐 Regular: {regular}\n👎 Mal: {bad}",
        bookingLinkTitle: "Reserva en línea",
        bookingLinkHint: "Comparte este enlace con tus pacientes para que agenden solos. Muestra la marca de tu clínica; ellos no ven PodoAdmin.",
        bookingLinkEnabled: "Reserva en línea activada",
        bookingLinkDisabled: "Activar reserva en línea",
        bookingLinkCopy: "Copiar enlace",
        bookingLinkCopied: "¡Copiado!",
      },
    },
    clinicalTools: {
      title: "Herramientas clínicas",
      denied: "No tienes permiso para acceder a esta sección.",
      tabTemplates: "Plantillas de sesión",
      tabInventory: "Inventario",
      tabReferrals: "Derivaciones",
      templatesHint: "Define historiales clínicos predefinidos (callosidad, uña encarnada, etc.) para cargarlos al abrir una sesión.",
      newTemplate: "Nueva plantilla",
      create: "Crear",
      creating: "Creando…",
      category: "Categoría",
      inventoryName: "Nombre del material",
      unit: "Unidad",
      add: "Añadir",
      emptyInventory: "Sin material registrado",
      patientId: "ID paciente",
      referTo: "Derivar a",
      reason: "Motivo",
      registerReferral: "Registrar derivación",
      emptyReferrals: "Sin derivaciones",
      nameRequired: "Indica un nombre para la plantilla.",
      templateCreated: "Plantilla creada. Edítala para elegir secciones y contenido.",
      createFailed: "No se pudo crear la plantilla.",
      presetCreated: "Plantilla «{name}» creada.",
      templateUpdated: "Plantilla actualizada.",
      saveFailed: "No se pudo guardar la plantilla.",
      deleteConfirm: "¿Eliminar la plantilla «{name}»? Esta acción no se puede deshacer.",
      templateDeleted: "Plantilla eliminada.",
      deleteFailed: "No se pudo eliminar la plantilla.",
      invalidQuantity: "Indique una cantidad válida (0 o más).",
      defaultUnit: "unidad",
      inventoryAdded: "Material registrado.",
      genericError: "Error",
      referralAdded: "Derivación registrada.",
      namePlaceholder: "Nombre (ej. Callosidad 1er dedo)",
      scopeLabel: "Alcance:",
      scopePersonal: "Solo yo",
      scopeClinic: "Consultorio (todos los podólogos)",
      clinicAdminHint: "Como administrador de clínica, las plantillas se comparten con todo el consultorio.",
      sectionsCount: "{count} secciones",
      close: "Cerrar",
      edit: "Editar",
      deleting: "Eliminando…",
      delete: "Eliminar",
      nameLabel: "Nombre",
      shareWithClinic: "Compartir con el consultorio",
      saving: "Guardando…",
      saveTemplate: "Guardar plantilla",
      emptyTemplates: "Sin plantillas. Crea una vacía o usa los accesos rápidos de callosidad / uña encarnada.",
      quantityPlaceholder: "Cantidad",
      quantityAria: "Cantidad",
      patientPrefix: "Paciente:",
      scopeShared: "Consultorio",
      scopePersonalShort: "Personal",
    },
    systemDiagnostics: {
      title: "Estado del sistema",
      subtitle: "Comprueba el worker, la base de datos y la URL de salud pública; guía breve ante incidencias.",
      sectionStatus: "Estado operativo",
      workerLabel: "API / Worker",
      databaseLabel: "Base de datos (D1)",
      statusOk: "Correcto",
      statusError: "Error",
      latencyLabel: "Latencia",
      environmentSection: "Entorno (NODE_ENV)",
      checkedAtLabel: "Última comprobación",
      refresh: "Actualizar",
      loadError: "No se pudo cargar el diagnóstico.",
      publicHealthTitle: "Monitorización externa",
      publicHealthDesc:
        "Puedes usar esta URL en herramientas de disponibilidad (solo comprueba que el worker responde, sin consultar D1):",
      sessionHealthUrlLabel: "Desde esta sesión (origen del navegador)",
      productionHealthUrlLabel: "URL pública para monitorización (dominio configurado en el Worker)",
      productionHealthNote:
        "En desarrollo verás localhost; es normal. En producción abre la app con tu dominio real (p. ej. https://app.tudominio.com) y esta sección mostrará esa URL. Para que aparezca aquí aunque entres por localhost, configura OFFICIAL_APP_DOMAIN o el primer valor de ALLOWED_ORIGINS en Cloudflare (Variables del Worker). Los monitores externos deben apuntar siempre a la URL de producción, no a tu PC.",
      sectionGuide: "Ante errores o caídas",
      guideIntro: "Para acotar y comunicar un problema:",
      guideItem1: "Anota la hora aproximada, la pantalla y la acción que realizabas.",
      guideItem2:
        "En errores de API, el cliente expone requestId (cuerpo JSON o cabecera X-Request-Id). Inclúyelo al reportar para cruzarlo con los logs del Worker en Cloudflare.",
      guideItem3: "Revisa el registro de auditoría para acciones recientes de usuarios.",
      guideItem4: "En Cloudflare, revisa métricas y logs del Worker asociados a ese intervalo de tiempo.",
      correlationHint:
        "Las respuestas con código HTTP de error incluyen requestId en el JSON y la cabecera X-Request-Id en todas las respuestas JSON para correlación.",
    },
    roles: {
      superAdmin: "Super Administrador",
      clinicAdmin: "Administrador de Clínica",
      admin: "Soporte",
      podiatrist: "Podólogo",
      receptionist: "Recepcionista",
      superAdminDesc: "Gestión de usuarios, créditos y configuración del sistema",
      clinicAdminDesc: "Gestión de podólogos y pacientes de la clínica",
      adminDesc: "Ajustes de créditos y soporte técnico",
      podiatristDesc: "Gestión de pacientes y sesiones clínicas",
      receptionistDesc: "Crear pacientes, citas y gestionar calendario de los podólogos asignados",
      superAdminAssignWarning:
        "Vas a otorgar el rol de Super Administrador. Tendrá acceso total al sistema, usuarios y configuración.",
      superAdminAssignConfirmPrompt: "Confirma esta acción para evitar asignaciones por error.",
      superAdminAssignConfirmed: "Rol de Super Administrador confirmado.",
    },
    errors: {
      generic: "Ha ocurrido un error",
      notFound: "No encontrado",
      unauthorized: "No autorizado",
      validationError: "Error de validación",
      requiredField: "Este campo es obligatorio",
      invalidEmail: "Correo electrónico inválido",
      invalidPhone: "Teléfono inválido",
      saveFailed: "Error al guardar",
      loadFailed: "Error al cargar",
    },
    success: {
      saved: "Guardado correctamente",
      deleted: "Eliminado correctamente",
      created: "Creado correctamente",
      updated: "Actualizado correctamente",
      exported: "Exportado correctamente",
    },
    branding: {
      tagline: "Sistema integral de gestión clínica para profesionales de la podología",
      digital: "Digital",
      access: "Acceso",
      secure: "Seguro",
    },
    notifications: {
      title: "Notificaciones",
      all: "Todas",
      unread: "No leídas",
      read: "Leídas",
      markAsRead: "Marcar como leída",
      markAllAsRead: "Marcar todas como leídas",
      noNotifications: "No hay notificaciones",
      viewAll: "Ver todas",
      delete: "Eliminar",
      reassignment: "Reasignación",
      appointment: "Cita",
      credit: "Créditos",
      system: "Sistema",
      patientReassignedFrom: "Paciente reasignado desde ti",
      patientReassignedTo: "Paciente asignado a ti",
      reassignedBy: "Reasignado por",
      reason: "Motivo",
      agoMinutes: "hace {n} min",
      agoHours: "hace {n} h",
      agoDays: "hace {n} días",
      yesterday: "Ayer",
      justNow: "Justo ahora",
      adminMessage: "Mensaje del Administrador",
      from: "De",
      to: "Para",
      type: "Tipo",
      patient: "Paciente",
      selectedCount: "{n} seleccionada(s)",
    },
    messaging: {
      title: "Mensajes",
      sendMessage: "Enviar mensaje",
      newMessage: "Nuevo mensaje",
      sentMessages: "Mensajes enviados",
      recipient: "Destinatario",
      recipients: "Destinatarios",
      allUsers: "Todos los usuarios",
      selectSpecific: "Seleccionar usuarios específicos",
      singleUser: "Usuario individual",
      subject: "Asunto",
      subjectPlaceholder: "Escribe el asunto del mensaje...",
      messageBody: "Contenido del mensaje",
      messagePlaceholder: "Escribe tu mensaje aquí...",
      preview: "Vista previa",
      send: "Enviar",
      sending: "Enviando...",
      sent: "Enviado",
      sentAt: "Enviado el",
      recipientsCount: "destinatarios",
      readCount: "leídos",
      unreadCount: "no leídos",
      noMessages: "No hay mensajes enviados",
      selectRecipients: "Selecciona los destinatarios",
      messageSent: "Mensaje enviado correctamente",
      messageRequired: "El contenido del mensaje es obligatorio",
      subjectRequired: "El asunto es obligatorio",
      recipientRequired: "Selecciona al menos un destinatario",
      fromAdmin: "Mensaje del Administrador",
    },

    clinic: {
      title: "Gestión de clínica",
      tabOverview: "Resumen",
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
      podiatristsLimit: "Podólogos: {current} de {limit} disponibles en tu plan",
      podiatristsNoLimit: "Podólogos de la clínica. Sin límite definido.",
      podiatristsLimitCta: "¿Necesitas más? Agrega podólogos adicionales por $10 USD/mes en Suscripción.",
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
      receptionistsActive: "Activas: {active} (sin límite). Deben cambiar la contraseña en el primer inicio de sesión.",
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
      emailTaken: "Ya existe una cuenta con este correo electrónico",
      createReceptionistError: "Error al crear recepcionista",
      saveAssignmentError: "Error al guardar asignación",
      createPodiatristError: "Error al crear podólogo",
      passwordMin8: "La contraseña debe tener al menos 8 caracteres",
    },
    auditLog: {
      title: "Registro de auditoría",
      actionLabels: {
        LOGIN_SUCCESS: "Inicio de sesión",
        LOGIN_FAILED: "Inicio de sesión fallido",
        LOGOUT: "Cierre de sesión",
        PASSWORD_CHANGED: "Contraseña cambiada",
        PASSWORD_RESET_REJECTED: "Restablecimiento de contraseña rechazado",
        PASSWORD_RESET_APPROVED: "Restablecimiento de contraseña aprobado",
        PASSWORD_RESET_COMPLETED: "Restablecimiento de contraseña completado",
        PASSWORD_RESET_REQUESTED: "Solicitud de restablecimiento de contraseña",
        CREATE: "Creación",
        CREATE_USER: "Usuario creado",
        UPDATE: "Actualización",
        DELETE: "Eliminación",
        DELETE_USER: "Usuario eliminado",
        COMPLETE: "Completado",
        EXPORT: "Exportación",
        PRINT: "Impresión",
        UPDATE_DRAFT: "Borrador actualizado",
        REASSIGN: "Reasignación",
        TRANSFER: "Transferencia",
        ADD_CREDITS: "Créditos añadidos",
        SUBTRACT_CREDITS: "Créditos restados",
        ADMIN_CREDIT_ADJUSTMENT: "Ajuste de créditos (admin)",
        ALERT_MULTIPLE_PRINT_VIOLATIONS: "Alerta: múltiples impresiones",
        PRINT_VIOLATION_FORM: "Intento de impresión desde formulario",
      },
      entityLabels: {
        authentication: "Autenticación",
        session: "Sesión",
        patient: "Paciente",
        prescription: "Receta",
        reassignment: "Reasignación",
        credit: "Créditos",
        user: "Usuario",
        user_data: "Datos de usuario",
        clinic: "Clínica",
        professional_info: "Datos profesionales",
        professional_credentials: "Credenciales",
        logo: "Logo",
        message: "Mensaje",
        clinical_history: "Historial clínico",
        receptionist: "Recepcionista",
        registration_list: "Lista de registro",
        support_conversation: "Conversación de soporte",
      },
      filters: {
        title: "Filtros",
        clear: "Limpiar filtros",
        search: "Buscar...",
        allActions: "Todas las acciones",
        allTypes: "Todos los tipos",
        allUsers: "Todos los usuarios",
        from: "Desde",
        to: "Hasta",
      },
      empty: {
        title: "No hay registros",
        description: "No se encontraron registros de auditoría con los filtros seleccionados",
      },
      totalRecords: "Total de registros",
      actionTypes: "Tipos de acción",
      entityTypes: "Tipos de entidad",
      activeUsers: "Usuarios activos",
      topUsers: "Usuarios más activos",
      recordsCount: "{n} registros",
      ofTotal: "(de {total} total)",
      fullDetails: "Detalles completos",
      userLinkedHint: "Cada registro está vinculado al usuario que realizó la acción. El Log ID identifica de forma única este evento.",
      userLabel: "Usuario:",
      userIdLabel: "ID de usuario:",
      logIdLabel: "ID de registro (log):",
      resourceIdLabel: "ID recurso:",
      pageOf: "Página {current} de {total}",
      summaries: {
        loginSuccess: "Inicio de sesión correcto",
        loginSuccessEmail: "Inicio de sesión correcto: {email}",
        with2fa: "(2FA activado)",
        without2fa: "(sin 2FA)",
        logout: "Cierre de sesión.",
        passwordChanged: "Contraseña cambiada por el usuario.",
        loginFailed: "Intento de inicio de sesión fallido.",
        loginFailedEmail: "Intento de inicio de sesión fallido: {email}",
        passwordResetRejected: "Solicitud de restablecimiento de contraseña rechazada.",
        passwordResetApproved: "Restablecimiento de contraseña aprobado por un administrador.",
        passwordResetCompleted: "El usuario completó el restablecimiento de contraseña.",
        passwordResetRequested: "Solicitud de restablecimiento de contraseña enviada.",
        patientPrefix: "Paciente: {name}",
        userPrefix: "Usuario: {name}",
        clinicPrefix: "Clínica: {name}",
      },
    },
    securityMetrics: {
      title: "Métricas de seguridad",
      subtitle: "Métricas de seguridad, alertas activas y eventos recientes",
      last24h: "Últimas 24 h",
      last7days: "Últimos 7 días",
      last30days: "Últimos 30 días",
      refresh: "Actualizar",
      loadError: "No se pudieron cargar las métricas",
      criticalEvents: "Eventos críticos",
      failedLogins: "Logins fallidos",
      unreadAlerts: "Alertas sin leer",
      summaryByType: "Resumen por tipo",
      loading: "Cargando...",
      noEventsInPeriod: "Sin eventos en el periodo seleccionado.",
      activeAlerts: "Alertas activas",
      noSystemAlerts: "No hay alertas de sistema recientes.",
      recentAccessGeo: "Accesos recientes (geolocalización)",
      date: "Fecha",
      event: "Evento",
      userRole: "Usuario / rol",
      ip: "IP",
      location: "Ubicación",
      noAccessYet: "Sin accesos registrados aún. Inicia sesión para generar datos.",
      loginOk: "Login OK",
      loginFailed: "Login fallido",
      recentFailedLogins: "Últimos logins fallidos",
      emailDetail: "Email / detalle",
      noRecentRecords: "Sin registros recientes.",
      attemptNumber: "Intento #{n}",
      metricLabels: {
        failed_login: "Logins fallidos",
        successful_login: "Logins exitosos",
        twoFaFailed: "2FA fallido",
        captcha_failed: "CAPTCHA fallido",
        suspicious_activity: "Actividad sospechosa",
      },
    },
    supportPage: {
      title: "Soporte",
      adminSubtitle: "Mensajes de usuarios y listas de registro para aprobación.",
      tabMessages: "Mensajes",
      tabLists: "Crear listas",
      conversations: "Conversaciones",
      noConversations: "No hay conversaciones",
      selectConversation: "Selecciona una conversación para ver los mensajes y responder.",
      supportAgent: "Soporte",
      registrationLists: "Listas de registro",
      newList: "Nueva lista",
      newListNamePlaceholder: "Nombre de la nueva lista...",
      listsEmptyHint: "Crea listas de registros (cursos, eventos) y envíalas para que el administrador las apruebe e importe.",
      deleteList: "Eliminar",
      deleteListConfirm: "¿Seguro que quieres eliminar esta lista?",
      createListError: "Error al crear la lista",
      defaultListName: "Nueva lista",
      invalidEmail: "Introduce un correo electrónico válido.",
      downloadCsv: "Descargar CSV",
      markPaidToExport: "Marca al menos un registro como pagado para exportar.",
      submitForApproval: "Enviar para aprobación",
      addEntry: "Añadir registro",
      namePlaceholder: "Nombre",
      emailPlaceholder: "Email",
      roleIndependent: "Podólogo independiente",
      roleClinicAdmin: "Admin de clínica",
      podiatristLimitLabel: "Límite podólogos:",
      podiatristLimitPlaceholder: "Ej: 5",
      add: "Añadir",
      clinicAdminLimitHint: "Los podólogos de la clínica estarán limitados a este número. Recepcionistas no cuentan en el límite.",
      noEntries: "No hay registros en esta lista.",
      paid: "Pagado",
      unpaid: "No pagado",
      pendingPayment: "Pendientes de pago ({n})",
      paidSection: "Pagados (se exportan al CSV) ({n})",
      selectOrCreateList: "Selecciona una lista o crea una nueva.",
      statusDraft: "Borrador",
      statusPending: "Pendiente",
      statusApproved: "Aprobada",
      statusRejected: "Rechazada",
      limitPodiatrists: "Límite: {n} podólogos",
    },
    sponsoredAnnouncements: {
      title: "Anuncios patrocinados",
      heading: "Anuncios por estado / provincia",
      subtitle: "Campañas pagadas por proveedores externos. Todos los usuarios en la zona ven banner y notificación.",
      newCampaign: "Nueva campaña",
      formTitle: "Nueva campaña",
      existingAdvertiser: "Proveedor existente",
      newAdvertiserOption: "— Nuevo proveedor —",
      advertiserName: "Nombre del proveedor",
      advertiserNamePlaceholder: "Ej: Instituto Podológico",
      titlePlaceholder: "Título del anuncio",
      bodyPlaceholder: "Descripción (curso, evento, etc.)",
      countryPlaceholder: "País (MX)",
      statePlaceholder: "Estado / provincia",
      audienceEstimate: "≈ {n} usuarios en zona",
      externalUrlPlaceholder: "URL del anunciante (su web)",
      promoCodePlaceholder: "Código descuento en web del anunciante (opcional)",
      createDraft: "Crear borrador",
      campaigns: "Campañas",
      loading: "Cargando...",
      noCampaigns: "Sin campañas aún.",
      advertiserCode: "Código anunciante:",
      activate: "Activar",
      pause: "Pausar",
      createAdvertiserError: "No se pudo crear el proveedor",
      selectOrCreateAdvertiser: "Selecciona o crea un proveedor",
      createCampaignError: "Error al crear campaña",
      statusError: "Error",
      statusActive: "activa",
      statusDraft: "borrador",
      statusPaused: "pausada",
      defaultCta: "Ver más",
    },
    terms: {
      title: "Términos y Condiciones",
      lastUpdated: "Última actualización",
      lastUpdatedDate: "24 de enero de 2026",
      backToRegister: "Volver al registro",
      acceptAndContinue: "Aceptar y Continuar",
      back: "Volver",
      section1: {
        title: "1. Aceptación de los Términos",
        content: "Al acceder y utilizar PodoAdmin, usted acepta cumplir y estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.",
      },
      section2: {
        title: "2. Descripción del Servicio",
        content: "PodoAdmin es una plataforma de gestión clínica diseñada para profesionales de la podología. El servicio incluye gestión de pacientes, sesiones clínicas, créditos y otras funcionalidades relacionadas con la administración de una práctica podológica.",
      },
      section3: {
        title: "3. Registro de Usuario",
        intro: "Para utilizar PodoAdmin, debe:",
        item1: "Proporcionar información precisa, actual y completa durante el registro",
        item2: "Mantener y actualizar su información de cuenta",
        item3: "Mantener la confidencialidad de su contraseña",
        item4: "Notificarnos inmediatamente de cualquier uso no autorizado de su cuenta",
        item5: "Ser responsable de todas las actividades que ocurran bajo su cuenta",
      },
      section4: {
        title: "4. Uso Aceptable",
        intro: "Usted se compromete a:",
        item1: "Utilizar el servicio únicamente para fines legales y profesionales",
        item2: "No intentar acceder a áreas restringidas del sistema",
        item3: "No interferir con el funcionamiento del servicio",
        item4: "No transmitir virus, malware o código malicioso",
        item5: "Respetar los derechos de propiedad intelectual",
        item6: "Mantener la confidencialidad de la información de los pacientes",
      },
      section5: {
        title: "5. Privacidad y Protección de Datos",
        content: "El manejo de datos personales y de pacientes se rige por nuestra Política de Privacidad. Usted es responsable de cumplir con las leyes aplicables en su país, incluyendo la LFPDPPP (México), LGPD (Brasil), leyes de Habeas Data (Colombia), Ley 25.326 (Argentina), RGPD/GDPR (Unión Europea) y la NOM-004-SSA3-2012 para expediente clínico en México.",
      },
      section6: {
        title: "6. Créditos y Facturación",
        content: "El uso de ciertas funcionalidades puede requerir créditos. Los créditos pueden tener períodos de validez y están sujetos a las políticas de facturación establecidas. No se realizarán reembolsos por créditos no utilizados, salvo en casos excepcionales determinados a nuestra discreción.",
      },
      section7: {
        title: "7. Propiedad Intelectual",
        content: "Todo el contenido, diseño, código y funcionalidades de PodoAdmin son propiedad de sus respectivos dueños y están protegidos por leyes de propiedad intelectual. No se permite la reproducción, distribución o uso comercial sin autorización previa.",
      },
      section8: {
        title: "8. Limitación de Responsabilidad",
        content: "PodoAdmin se proporciona \"tal cual\" sin garantías de ningún tipo. No garantizamos que el servicio esté libre de errores, interrupciones o defectos. No seremos responsables de ningún daño directo, indirecto, incidental o consecuente derivado del uso o imposibilidad de uso del servicio.",
      },
      section9: {
        title: "9. Modificaciones del Servicio",
        content: "Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante usted o terceros por cualquier modificación, suspensión o discontinuación.",
      },
      section10: {
        title: "10. Terminación",
        content: "Podemos terminar o suspender su acceso al servicio inmediatamente, sin previo aviso, por cualquier motivo, incluyendo pero no limitado a violación de estos términos. Tras la terminación, su derecho a utilizar el servicio cesará inmediatamente.",
      },
      section11: {
        title: "11. Modificaciones de los Términos",
        content: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación. Su uso continuado del servicio después de las modificaciones constituye su aceptación de los nuevos términos.",
      },
      section12: {
        title: "12. Ley Aplicable",
        content: "Estos términos se rigen por las leyes del país donde opera PodoAdmin. Cualquier disputa será resuelta en los tribunales competentes de dicha jurisdicción.",
      },
      section13: {
        title: "13. Contacto",
        content: "Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos a través de los canales de soporte proporcionados en la plataforma.",
      },
    },
    privacy: {
      title: "Política de Privacidad",
      lastUpdated: "Última actualización",
      backToRegister: "Volver al registro",
      section1: {
        title: "1. Responsable del tratamiento",
        content:
          "PodoAdmin actúa como encargado de plataforma tecnológica. El profesional o clínica que utiliza el servicio es responsable del tratamiento de los datos de salud de sus pacientes conforme a la normativa local (LFPDPPP, LGPD, Habeas Data, GDPR, entre otras).",
      },
      section2: {
        title: "2. Datos que tratamos",
        content:
          "Datos de cuenta (nombre, email), datos clínicos de pacientes (identificación, historial, sesiones, consentimientos), registros de auditoría, accesos al expediente y metadatos técnicos (IP, dispositivo) para seguridad.",
      },
      section3: {
        title: "3. Finalidad y base legal",
        content:
          "Prestación del servicio de gestión clínica podológica, cumplimiento de obligaciones legales de conservación de expediente (p. ej. NOM-004-SSA3-2012 en México), seguridad, facturación y soporte. El consentimiento del titular y el interés legítimo del responsable del tratamiento aplican según el marco de cada país.",
      },
      section4: {
        title: "4. Conservación",
        content:
          "Aplicamos una política global conservadora: historial clínico hasta 20 años desde el último acto clínico (cubre requisitos de México, Brasil, Chile y otros países de Latinoamérica). Auditoría hasta 10 años. Datos operativos de corto plazo según categoría documentada en docs/RETENTION_POLICY_GLOBAL.md.",
      },
      section5: {
        title: "5. Derechos del titular (ARCO / LGPD / GDPR)",
        intro: "Puede ejercer, según su legislación:",
        item1: "Acceso y portabilidad: exportar sus datos desde Configuración.",
        item2: "Rectificación: actualizar perfil o solicitar corrección al responsable del tratamiento.",
        item3: "Cancelación/supresión: solicitar borrado cuando legalmente proceda (Configuración → Privacidad).",
        item4: "Oposición y limitación: contactar soporte; puede prevalecer la obligación legal de conservar el expediente clínico.",
      },
      section6: {
        title: "6. Seguridad",
        content:
          "Cifrado en tránsito (HTTPS), control de acceso por roles, registro de auditoría, registro de accesos al expediente, autenticación segura y copias de seguridad según configuración de despliegue.",
      },
      section7: {
        title: "7. Transferencias",
        content:
          "Los datos pueden procesarse en infraestructura cloud (p. ej. Cloudflare). El responsable del tratamiento debe informar a sus pacientes si aplica transferencia internacional conforme a su país.",
      },
      section8: {
        title: "8. Contacto",
        content: "Para ejercer derechos o consultas de privacidad, use el canal de soporte de la plataforma o la sección Privacidad y datos en Configuración.",
      },
    },
    compliance: {
      title: "Privacidad y datos",
      subtitle: "Ejercicio de derechos ARCO, LGPD y GDPR sobre tu cuenta",
      exportTitle: "Exportar mis datos",
      exportDesc: "Descarga un archivo JSON con tu perfil, clínica, suscripción y últimos registros de auditoría.",
      exportButton: "Descargar mis datos",
      deletionTitle: "Solicitar supresión de cuenta",
      deletionDesc:
        "Registra una solicitud de baja y supresión. Se evaluará conforme a LFPDPPP, LGPD, GDPR y obligaciones de conservación del expediente clínico.",
      deletionButton: "Solicitar supresión",
      deletionSuccess: "Solicitud registrada. El equipo de soporte se pondrá en contacto si es necesario.",
      privacyLink: "Ver Política de Privacidad",
      retentionTitle: "Política de retención",
      retentionNote: "Expediente clínico: conservación global de hasta 20 años desde el último acto clínico.",
      legalHoldTitle: "Bloqueos legales (legal hold)",
      legalHoldDesc: "Impide el borrado de expedientes bajo litigio, auditoría o requerimiento de autoridad.",
      holdResourceType: "Tipo de recurso",
      holdResourceId: "ID del recurso",
      holdReason: "Motivo",
      holdCreate: "Crear bloqueo",
      holdCreated: "Bloqueo legal creado",
      holdRelease: "Liberar",
      holdsEmpty: "No hay bloqueos legales activos",
    },
    clinicalHistoriesExport: {
      title: "Descargar historiales clínicos",
      subtitle: "Exporta todos tus expedientes en formato imprimible (HTML → PDF)",
      desc: "Genera un archivo HTML con el mismo diseño que la impresión de sesiones. No se descarga JSON: abre el HTML en el navegador y guárdalo como PDF con Imprimir.",
      stats: "{patients} paciente(s) · {sessions} sesión(es) incluidas",
      downloadHtml: "Descargar HTML",
      printPdf: "Imprimir / guardar PDF",
      pdfHint: "En el diálogo de impresión del navegador elija «Guardar como PDF» como destino.",
      popupBlocked: "Permita ventanas emergentes para abrir la vista de impresión.",
      noPatients: "No hay pacientes en tu cuenta para exportar.",
      buildError: "No se pudo generar el HTML del expediente. Revisa la consola o contacta soporte.",
      downloadFailed: "No se pudo iniciar la descarga. Prueba «Imprimir / guardar PDF» o permite descargas del sitio.",
      downloadStarted: "Descarga iniciada: {filename}",
      openedInTab: "Se abrió el historial en una pestaña nueva. Use Imprimir → Guardar como PDF.",
      invalidResponse: "La respuesta del servidor no incluye datos de pacientes válidos.",
    },
    usersPage: {
      fields: {
        name: "Nombre",
        email: "Email",
        password: "Contraseña",
        role: "Rol",
        clinic: "Clínica",
        clinicOptional: "Clínica (opcional)",
      },
      create: {
        title: "Crear nuevo usuario",
        passwordHint: "Mínimo 8 caracteres.",
        clinicModeExisting: "Seleccionar clínica existente",
        clinicModeNew: "Crear nueva clínica",
        clinicModeNone: "Sin clínica (independiente)",
        newClinicHint: "Se creará una clínica con datos provisionales. El administrador completará nombre, código, teléfono, dirección y el resto en Configuración.",
        podiatristLimit: "Límite de podólogos (opcional)",
        podiatristLimitPlaceholder: "Ej: 5",
        podiatristLimitHint: "Los podólogos de la clínica estarán limitados a este número. Recepcionistas no cuentan.",
        saving: "Creando...",
        success: "Usuario creado correctamente.",
        partialClinicFail: "Usuario creado, pero no se pudo crear la clínica. Configúrala después desde la edición del usuario.",
        errors: {
          nameRequired: "El nombre es obligatorio.",
          emailInvalid: "Introduce un correo electrónico válido.",
          passwordMin: "La contraseña debe tener al menos 8 caracteres.",
          clinicRequiredReceptionist: "Selecciona una clínica para el recepcionista.",
          clinicRequiredAdmin: "Selecciona una clínica existente o elige crear una nueva.",
          createFailed: "No se pudo crear el usuario.",
        },
      },
      import: {
        title: "Importar usuarios (CSV)",
        description: "Columnas obligatorias: nombre, email, password (o usa la contraseña por defecto), rol.",
        optionalColumnsSuperAdmin: " Opcional: clinicMode (existing|new|none), clinicId (si existing), podiatrist_limit (solo clinic_admin).",
        downloadTemplate: "Descargar plantilla",
        selectFile: "Seleccionar archivo",
        defaultPassword: "Contraseña por defecto (si falta en CSV)",
        optionalPlaceholder: "Opcional",
        readyCount: "{count} filas listas para importar",
        andMore: "... y {count} más",
        resultsSummary: "Resultado: {ok} ok, {fail} con error",
        created: "✓ Creado",
        importing: "Importando... ({done}/{total})",
        submit: "Importar",
        templateFilename: "plantilla_usuarios.csv",
        errors: {
          needRows: "El archivo debe tener al menos una fila de encabezado y una fila de datos.",
          missingColumns: "Faltan columnas obligatorias: nombre, email, password, rol",
          readFile: "Error al leer el archivo",
          invalidPassword: "Contraseña inválida (mín. 8 caracteres)",
          unknown: "Error desconocido",
          connection: "Error de conexión",
        },
      },
      edit: {
        title: "Editar usuario",
        noClinic: "Sin clínica",
        errors: {
          updateFailed: "No se pudo actualizar el usuario.",
        },
      },
      transfer: {
        title: "Transferir historial clínico",
        subtitle: "Copiar todos los pacientes y sesiones de un usuario a otro",
        successMessage: "Transferencia completada: {patients} pacientes, {sessions} sesiones.",
        error: "Error al transferir los datos.",
        successTitle: "¡Éxito!",
        errorTitle: "Error",
        sourceUser: "Usuario origen",
        targetUser: "Usuario destino",
        selectUser: "— Seleccionar —",
        patientsCount: "{count} pacientes para transferir",
        warning: "Los datos se copiarán al usuario destino. El origen conservará su historial. Esta acción no se puede deshacer fácilmente.",
        transferring: "Transfiriendo...",
        submit: "Transferir",
      },
      profile: {
        loading: "Cargando datos clínicos...",
        patients: "Pacientes",
        sessions: "Sesiones",
        patientsHeading: "Pacientes ({count})",
        andMore: "...y {count} más",
      },
      status: {
        banned: "Baneado",
        blocked: "Bloqueado",
        gracePeriod: "Periodo de gracia",
        disabled: "Deshabilitado",
        pendingPayment: "Pago pendiente",
        active: "Activo",
      },
      confirm: {
        block: "¿Bloquear a {name}? No podrá iniciar sesión hasta desbloquearlo.",
        unblock: "¿Desbloquear a {name}?",
        enable: "¿Habilitar la cuenta de {name}?",
        disable: "¿Deshabilitar la cuenta de {name}? No podrá iniciar sesión.",
        ban: "¿Banear a {name}? Esta es una acción grave.",
        unban: "¿Quitar el baneo a {name}?",
        delete: "¿Eliminar a {name}? Esta acción puede ser irreversible.",
        deletePermanent: "¿Eliminar permanentemente a {name}? No se puede deshacer.",
      },
      errors: {
        approve: "Error al aprobar",
        reject: "Error al rechazar",
        block: "No se pudo bloquear el usuario.",
        unblock: "No se pudo desbloquear el usuario.",
        enable: "No se pudo habilitar el usuario.",
        disable: "No se pudo deshabilitar el usuario.",
        ban: "No se pudo banear el usuario.",
        unban: "No se pudo quitar el baneo.",
        delete: "No se pudo eliminar el usuario.",
      },
      actions: {
        importCsv: "Importar CSV",
        createUser: "Crear usuario",
        transferHistory: "Transferir historial",
        approve: "Aprobar",
        reject: "Rechazar",
        view: "Ver",
        edit: "Editar",
        ban: "Banear",
        unban: "Desbanear",
        block: "Bloquear",
        unblock: "Desbloquear",
        enableAccount: "Habilitar cuenta",
        disableAccount: "Deshabilitar cuenta",
        delete: "Eliminar",
        viewProfile: "Ver perfil",
        downloadJson: "Descargar JSON",
        manageAccount: "Gestionar cuenta",
      },
      table: {
        user: "Usuario",
        email: "Email",
        role: "Rol",
        status: "Estado",
        clinic: "Clínica",
        limit: "Límite",
        data: "Datos",
        actions: "Acciones",
        sortBy: "Ordenar por",
        podiatristLimit: "Límite podólogos",
        dataSummary: "{patients} pacientes · {sessions} sesiones",
        currentPodiatrists: "Actuales: {count}",
        saveLimit: "Guardar",
        clinicMissing: "Clínica no encontrada",
        effectiveLimitHint: "Cupo real aplicado (incluidos por el plan + asientos extra, o el override manual si es mayor).",
        overCapacityHint: "Esta clínica tiene más podólogos activos que su cupo actual (probable tras bajar de plan). No podrá añadir más hasta liberar cupo o comprar asientos extra.",
        patients: "pacientes",
        sessions: "sesiones",
      },
      passwordReset: {
        pendingTitle: "Solicitudes de recuperación de contraseña",
        approved: "Solicitud aprobada.",
        approveError: "No se pudo aprobar la solicitud.",
        rejectReasonPrompt: "Motivo del rechazo (opcional):",
        rejected: "Solicitud rechazada.",
        rejectError: "No se pudo rechazar la solicitud.",
        approvedModalTitle: "Solicitud aprobada",
        linkHint: "Se ha enviado el enlace al correo del usuario. Aquí tienes el enlace para que puedas reenviarlo personalmente (WhatsApp, etc.):",
        copied: "Enlace copiado al portapapeles.",
        copyFailed: "No se pudo copiar. Selecciona y copia el enlace manualmente.",
        copyLink: "Copiar enlace",
      },
      regLists: {
        title: "Listas de registro pendientes",
        hint: "Aprueba o rechaza las listas enviadas por soporte.",
        byCreator: "Por {name}",
        downloadCsv: "CSV",
        createdCount: "Se crearon {count} usuario(s).",
        approved: "Lista aprobada.",
        errorsPrefix: "Errores:",
      },
      cooldown: {
        notApplicable: "N/A",
        scopeClinic: "clínica",
        scopeProfessional: "profesional",
        reasonPrompt: "Motivo de la autorización (opcional):",
        confirm: "¿Autorizar edición anticipada de {scope} para {name}?",
        applied: "Autorización aplicada.",
        error: "No se pudo aplicar la autorización.",
      },
      export: {
        failed: "No se pudo exportar los datos del usuario.",
      },
      menu: {
        unbanAccount: "Quitar baneo",
        banAccount: "Banear cuenta",
        unblockAccount: "Desbloquear cuenta",
        blockAccount: "Bloquear cuenta",
        enableAccount: "Habilitar cuenta",
        disableAccount: "Deshabilitar cuenta",
        authorizeCooldown: "Autorizar edición (cooldown)",
        deleteAccount: "Eliminar cuenta",
      },
      searchPlaceholder: "Buscar usuarios...",
      allRoles: "Todos los roles",
      loading: "Cargando usuarios...",
      empty: "No se encontraron usuarios.",
      selectPlaceholder: "— Seleccionar —",
    },
  },
  
  en: {
    clinicalLayout: clinicalSharedByLang.en.clinicalLayout,
    podiatry: clinicalSharedByLang.en.podiatry,
    errorBoundary: clinicalSharedByLang.en.errorBoundary,
    clinicalList: clinicalSharedByLang.en.clinicalList,
    patientsClinical: clinicalSharedByLang.en.patientsClinical,
    sessionsClinical: clinicalSharedByLang.en.sessionsClinical,
    clinicalToolsExtras: clinicalSharedByLang.en.clinicalToolsExtras,
    calendarGrid: clinicalSharedByLang.en.calendarGrid,
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      filter: "Filter",
      export: "Export",
      print: "Print",
      back: "Back",
      next: "Next",
      previous: "Previous",
      confirm: "Confirm",
      close: "Close",
      yes: "Yes",
      no: "No",
      actions: "Actions",
      status: "Status",
      date: "Date",
      time: "Time",
      name: "Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      notes: "Notes",
      description: "Description",
      details: "Details",
      view: "View",
      download: "Download",
      showPassword: "Show password",
      hidePassword: "Hide password",
      showShort: "Show",
      hideShort: "Hide",
      captcha: "CAPTCHA",
      seeAll: "See all",
      seeAllShort: "See all",
      viewMore: "View more",
      go: "Go",
    },
    auth: {
      login: "Log in",
      logout: "Log out",
      welcome: "Welcome",
      welcomeBack: "Welcome back",
      enterCredentials: "Enter your credentials to access the system",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      emailHint: "This will be your login. We'll send a verification email to this address.",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      loginButton: "Log in",
      loggingIn: "Logging in...",
      invalidCredentials: "Invalid credentials",
      loginError: "Login error",
      tooManyAttempts: "Too many attempts",
      accountTemporarilyBlocked: "Account temporarily blocked",
      testCredentials: "Test credentials",
      superAdmin: "Super Admin",
      podiatrist: "Podiatrist",
      loggedInAs: "Logged in as",
      sessionExpired: "Your session has expired",
      // Registration
      register: "Sign up",
      registerTitle: "Create your account",
      registerSubtitle: "Complete the form to register in PodoAdmin",
      nameLabel: "Full name",
      namePlaceholder: "John Doe",
      clinicCodeLabel: "Clinic code (optional)",
      clinicCodePlaceholder: "e.g. PREM",
      clinicCodeHint:
        "Leave empty if you are an independent podiatrist. If your clinic gave you a code, enter it to join that clinic.",
      passwordRequirements: "Password requirements",
      passwordMinLength: "Minimum 12 characters",
      passwordMustContain: "Must contain:",
      passwordUppercase: "At least one uppercase letter",
      passwordLowercase: "At least one lowercase letter",
      passwordNumber: "At least one number",
      passwordSpecial: "At least one special character",
      termsAccept: "I accept the terms and conditions",
      termsLink: "View terms",
      privacyAccept: "I accept the",
      privacyLink: "Privacy Policy",
      registerButton: "Create account",
      registering: "Creating account...",
      alreadyHaveAccount: "Already have an account?",
      goToLogin: "Log in",
      dontHaveAccount: "Don't have an account?",
      contactAdminForAccount: "Contact the administrator to create an account.",
      registrationSuccess: "Registration successful!",
      registrationSuccessMessage: "We've sent a verification email. Please check your inbox.",
      registrationSuccessDevMessage:
        "Account created in development. Email was auto-verified; you can sign in now.",
      checkEmail: "Check your email",
      emailAlreadyRegistered:
        "This email is already registered. Sign in with your account or use a different email.",
      // Email Verification
      verifyEmail: "Verify email",
      verifyEmailTitle: "Verify your email",
      verifyEmailSubtitle: "We've sent a verification link to your email",
      verifyEmailSuccess: "Email verified",
      verifyEmailSuccessMessage: "Your account has been verified successfully. You can now log in.",
      verifyEmailError: "Verification error",
      verifyEmailExpired: "The verification link has expired",
      resendVerification: "Resend verification",
      // CAPTCHA
      captchaRequired: "Please complete the CAPTCHA",
      captchaError: "CAPTCHA verification error",
      captchaNotConfigured:
        "Development environment: CAPTCHA is not configured. Registration works without antibot verification.",
      captchaDisabledInDev:
        "Development environment: CAPTCHA is automatically disabled. It will be required in production.",
      // OAuth
      orContinueWith: "Or continue with",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
      forgotPassword: "Forgot your password?",
      forgotPasswordTitle: "Recover password",
      forgotPasswordSubtitle: "Enter your email. An administrator or support will review your request and contact you.",
      forgotPasswordButton: "Submit request",
      forgotPasswordSuccess: "Your request has been received. An administrator or support will review it and contact you when the recovery link is available.",
      resetPasswordTitle: "New password",
      resetPasswordSubtitle: "Choose a secure password. The link expires in 1 hour.",
      newPasswordLabel: "New password",
      resetPasswordButton: "Reset password",
      resetPasswordSuccess: "Password reset. You can now sign in.",
      backToLogin: "Back to sign in",
      forgotPasswordErrorRequest: "An error occurred processing your request. Please try again later.",
      forgotPasswordErrorConnection: "Connection error. Please try again.",
      resetPasswordInvalidLink: "Invalid link. Request a new one from the recovery screen.",
      resetPasswordPasswordsMismatch: "Passwords do not match.",
      resetPasswordMissingToken: "Missing token. Use the link you received by email.",
      resetPasswordErrorReset: "Error resetting password",
      resetPasswordErrorConnection: "Connection error. Please try again.",
      resetPasswordRedirecting: "Redirecting to login...",
      resetPasswordRepeatPassword: "Repeat password",
      resetPasswordHint: "Minimum 12 characters, uppercase, lowercase, number and special character.",
      changePasswordTitle: "Change password",
      changePasswordSubtitle: "Your temporary password must be changed. Choose a secure password of your choice.",
      currentPasswordLabel: "Current password (temporary)",
      changePasswordButton: "Change password",
      changePasswordSuccess: "Password updated successfully.",
      changePasswordRedirecting: "Redirecting to dashboard...",
      contactToVerifyRecovery: "Contact us to verify that you are the one recovering the account.",
      requestNewLink: "Request new link",
      securityLabel: "Security:",
      loginOnlyOnOfficialDomainWithDomain: "Only sign in at {domain}. Do not use this password on other sites.",
      loginOnlyOnOfficialDomainGeneric: "Only sign in on the official domain. Do not use this password on other sites.",
      notOnOfficialDomain: "You are not on the official domain. The current URL does not match {domain}. Do not enter your password here.",
      notOnOfficialDomainNoDomain: "You are not on the official domain. Do not enter your password here.",
      failedAttempts: "Failed attempts:",
      blockedUntil: "Blocked until:",
      retryIn: "You can try again in:",
      emailNotificationSent: "An email notification has been sent about these attempts.",
      googleNotConfigured: "Google is not configured in this environment",
      googleConnectFailed: "Could not connect to Google",
      googleNoCode: "No Google code was received",
      googleLoginError: "Error signing in with Google",
      googleCompleting: "Completing Google sign-in…",
      serverConnectionError: "Server connection error",
      connectionErrorShort: "Connection error",
      changePasswordCurrentRequired: "Enter your current password.",
      changePasswordError: "Error changing password",
      verifyEmailMissingToken: "No verification token was provided",
      verifyEmailFailed: "Error verifying email",
      recoveryVerifySubject: "Identity verification - Password recovery",
    },
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      clinicalSessions: "Clinical Sessions",
      clinicalTools: "Clinical tools",
      credits: "Credits",
      settings: "Settings",
      users: "Users",
      auditLog: "Audit Log",
      systemDiagnostics: "System status",
      profile: "Profile",
      clinicManagement: "Clinic Management",
      whatsappMessages: "WhatsApp Messages",
      whatsappCampaigns: "WhatsApp Campaigns",
      calendar: "Calendar",
      securityMetrics: "Security metrics",
      checkout: "Checkout",
    },
    checkout: {
      title: "Patient checkout",
      receptionHint: "Patients the podiatrist marked ready to pay. No need to interrupt the consultation.",
      podiatristHint: "Amounts sent to reception. Track payment status here.",
      adminHint: "Overview of pending and completed checkout handoffs in the clinic.",
      tabPending: "Pending",
      tabPaid: "Paid",
      allPodiatrists: "All podiatrists",
      emptyPending: "No pending checkouts.",
      emptyPaid: "No paid checkouts in this tab.",
      markPaid: "Mark as paid",
      confirmPaid: "Confirm that {patient} has paid?",
      confirmPaidTitle: "Confirm payment",
      paidAt: "Paid at",
      statusAwaiting: "No amount",
      statusReady: "Ready to pay",
      statusPaid: "Paid",
      modalTitle: "Amount for reception",
      modalSubtitle: "Patient: {patient}",
      modalHint: "Enter the amount reception should charge the patient leaving the room. They will be notified instantly.",
      amountLabel: "Amount to charge",
      notesLabel: "Note for reception (optional)",
      notesPlaceholder: "E.g. consultation + dressing",
      skipForNow: "Skip for now",
      sendToReception: "Send to reception",
      invalidAmount: "Enter a valid amount greater than zero.",
      saveFailed: "Could not send the amount.",
      saving: "Sending…",
      quickTariffs: "Quick rates",
      requestAmount: "Request amount",
      requestAmountSent: "Request sent",
      setAmount: "Set amount",
      tariffsTitle: "Quick checkout rates",
      tariffsHint: "Shortcuts when completing a session. Clinic admin sets clinic-wide rates; podiatrists can customize their own.",
      saveTariffs: "Save rates",
      tariffsSaved: "Rates saved",
      addTariff: "Add rate",
            tariffLabelPlaceholder: "Label (e.g. Consultation)",
      tariffAmountAria: "Amount",
      tariffDurationTitle: "Guideline duration (minutes)",
      tariffDurationAria: "Duration in minutes",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Server error. If you just updated the project, run npm run db:migrate and restart npm run dev.",
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
      myPractice: "My practice",
      podiatristFallback: "Podiatrist",
      assignedPodiatrist: "Assigned podiatrist",
      podiatristLabel: "Podiatrist",
      weekBucket: "W{n}",
      analytics: checkoutAnalyticsByLang.en,
      agendaAnalytics: agendaAnalyticsByLang.en,
    },
    dashboard: {
      title: "Dashboard",
      welcomeMessage: "Welcome to PodoAdmin",
      quickStats: "Quick Stats",
      totalPatients: "Total Patients",
      sessionsThisMonth: "Sessions This Month",
      creditsRemaining: "Credits Remaining",
      recentActivity: "Recent Activity",
      upcomingAppointments: "Upcoming Appointments",
      noRecentActivity: "No recent activity",
      patientFallback: "Patient",
      sessionCompletedActivity: "Session completed",
      draftActivity: "Draft",
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
    },
    patients: {
      title: "Patients",
      addPatient: "Add Patient",
      editPatient: "Edit Patient",
      patientList: "Patient List",
      patientDetails: "Patient Details",
      searchPatients: "Search patients...",
      noPatients: "No patients registered",
      firstName: "First Name",
      lastName: "Last Name",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      idNumber: "ID Number",
      curp: "CURP (Mexico)",
      curpHint: "Optional. Unique Population Registry Code (Mexico, NOM-004).",
      phone: "Phone",
      email: "Email",
      address: "Address",
      city: "City",
      postalCode: "Postal Code",
      medicalHistory: "Medical History",
      allergies: "Allergies",
      medications: "Medications",
      conditions: "Conditions",
      consent: "Consent",
      consentGiven: "Consent given",
      consentDate: "Consent date",
      consentDocumentLink: "View informed consent document",
      consentLegalNotice: "Digital signatures here are not legally valid. The patient must sign the printed document for legal validity.",
      clinicalHistory: "Clinical History",
      viewHistory: "View History",
      lastVisit: "Last Visit",
      totalSessions: "Total Sessions",
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
      },
    },
    sessions: {
      title: "Clinical Sessions",
      newSession: "New Session",
      editSession: "Edit Session",
      sessionList: "Session List",
      sessionDetails: "Session Details",
      sessionDate: "Session Date",
      clinicalNotes: "Clinical Notes",
      anamnesis: "Anamnesis",
      physicalExamination: "Physical Examination",
      diagnosis: "Podiatric Diagnosis",
      treatmentPlan: "Treatment Plan",
      images: "Images",
      uploadImages: "Upload Images",
      maxImages: "Maximum 2 images",
      draft: "Draft",
      completed: "Completed",
      complete: "Complete",
      saveDraft: "Save Draft",
      selectPatient: "Select Patient",
      noSessions: "No sessions registered",
      startSession: "Start Session",
      creditReserved: "Credit reserved",
      sessionSaved: "Session saved",
      checkoutCompleteHint:
        "Checkout for reception only appears when you tap Complete (patient leaving). Save draft only saves without closing the visit.",
      allStatuses: "All",
      loadingSessions: "Loading sessions…",
      createFirstSession: "Create your first clinical session",
      
      reasons: {
        routine_checkup: "Routine checkup",
        treatment_continuation: "Treatment continuation",
        post_procedure_review: "Post-procedure review",
        new_symptoms: "New symptoms",
        follow_up: "Follow-up",
        other: "Other",
      },
      appointmentReason: "Appointment reason",
      followUpInstructions: "Follow-up instructions",
      followUpInstructionsPlaceholder: "Instructions for the patient, medication, care...",
      unknownPatient: "Unknown patient",
      podiatryExamTitle: "Podiatric examination",
      confirmApplyTemplate: "Apply this template? Current clinical fields (text, podiatric exam and custom sections) will be replaced.",
      imageOnlyAllowed: "Only images are allowed (JPEG, PNG, WebP).",
      imageReadError: "Could not read the image",
      imageProcessError: "Error processing the image.",
      saveFailed: "Could not save the session.",
      selectPatientAlert: "Please select a patient.",
      gracePeriodMessage: "Your account is in a grace period due to overpayment. For 30 days you can view your data, but you cannot create new clinical sessions.",
      gracePeriodTitle: "You cannot create new sessions right now",
      saveError: "An error occurred while saving the session.",
      confirmDelete: "Delete this session?",
      deleteFailed: "Could not delete the session.",
      deleteError: "An error occurred while deleting the session.",
      exportOnlyPodiatrists: "Only podiatrists can export clinical histories.",
      exportFailed: "Could not export the clinical history",
      prescriptionRequireContent: "Enter indications in «Prescription / Instructions» or «Medications / Treatments».",
      patientLoadFailed: "Could not load patient data. Close the form, open the session again and try once more.",
      noPhotos: "No photos in this session. Upload them when creating or editing the draft.",
      imageAlt: "Image {n}",
      folioLabel: "Folio:",
      medicationsLabel: "Medications:",
      noPrescriptions: "No prescriptions for this session",
      patientPrefix: "Patient:",
      professionalFallback: "Professional",
      userFallback: "User",
      printTitlePrefix: "Podiatrist",
      weightPlaceholder: "e.g. 72.5",
      heightPlaceholder: "e.g. 165",
      anamnesisPlaceholder: "Chief complaint, history...",
      examPlaceholder: "Examination findings...",
      diagnosisPlaceholder: "Podiatric diagnosis...",
      treatmentPlaceholder: "Treatment plan...",
      notesPlaceholder: "Additional notes...",
      patientData: "Patient data",
      idOrCurp: "ID / CURP",
      age: "Age",
      professionalData: "Professional data",
      professional: "Professional",
      professionalLicense: "Professional license",
      licensePlaceholder: "License number",
      prescriptionIndications: "Prescription / Instructions *",
      prescriptionIndicationsPlaceholder: "Describe indications and recommendations for the patient...",
      medicationsTreatments: "Medications / Treatments",
      medicationsTreatmentsPlaceholder: "List recommended medications or treatments...",
      additionalNotes: "Additional notes",
      prescriptionMinContent: "Fill in at least «Prescription / Instructions» or «Medications / Treatments».",
      loadingPatients: "Loading patients…",
      selectEllipsis: "Select...",
      incompleteData: " (incomplete data)",
      incompletePatientWarning: "Required patient fields are missing (first name, last name, date of birth, gender, ID). For minors use the parent/guardian ID. Edit the patient record to save the session.",
      editPatientLink: "Edit patient →",
      refreshPatientData: "Refresh data (if you already edited the patient)",
      vitalsHint: "Saved with this session and updates the patient record.",
      sessionTemplate: "Session template",
      noTemplate: "No template",
      templateClinic: " (clinic)",
      templatePersonal: " (personal)",
      noTemplatesBefore: "No templates. Create them in",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Clinical tools",
      templateApplyHint: "Choosing a template automatically applies content and visible sections (e.g. no helomas in surgical procedures).",
      templateFilteredView: "Template-filtered view: {n} visible sections. Choose «No template» to see the full form.",
      templateNoSections: "This template has no sections defined. Edit it in Clinical tools, mark what to include and save again.",
      selectPatientTitle: "Select a patient",
      completePatientDataTitle: "Complete required patient fields (first name, last name, date of birth, gender, ID)",
      completePatientDataHint: "To save a draft or complete the session, first complete the patient data and click «Refresh data» above.",
      loadMoreSessions: "Load more sessions",
      loadingMore: "Loading…",
      reschedule: "Reschedule",
      rescheduleTitle: "Reschedule next appointment",
      daysOverdue: "{n} days overdue",
      scheduleAppointment: "Schedule appointment →",
      todayRel: "Today",
      tomorrowRel: "Tomorrow",
      inDays: "In {n} days",
      exportJson: "Export JSON",
      yearsOld: "{n} years",
      followUp: {
        overdueBanner: "Overdue appointments",
        upcomingBanner: "Upcoming appointments (7 days)",
        overdueChip: "Overdue",
        upcomingChip: "Upcoming",
        sectionTitle: "Follow-up",
        nextAppointment: "Next appointment",
        noSpecificReason: "No specific reason",
      },
      prescriptions: {
        sectionTitle: "Prescriptions",
        newPrescription: "New prescription",
        create: "Create",
        creating: "Creating…",
      },
      vitals: {
        title: "Vital signs",
        weightKg: "Weight (kg)",
        heightCm: "Height (cm)",
      },
    },
    calendar: {
      title: "Calendar",
      today: "Today",
      month: "Month",
      week: "Week",
      day: "Day",
      newAppointment: "New Appointment",
      addAppointment: "Add Appointment",
      allPodiatrists: "All podiatrists",
      dayMon: "Mon",
      dayTue: "Tue",
      dayWed: "Wed",
      dayThu: "Thu",
      dayFri: "Fri",
      daySat: "Sat",
      daySun: "Sun",
      unknown: "Unknown",
      pendingPatient: "Pending patient",
      pendingShort: "Pending",
      appointment: "Appointment",
      session: "Session",
      scheduled: "Scheduled appointment",
      completed: "Completed",
      draft: "Draft",
      noDiagnosis: "No diagnosis",
      noNotes: "No notes",
      edit: "Edit",
      cancel: "Cancel",
      more: "more",
      events: "events",
      noEventsForDay: "No events for this day",
      podiatristLabel: "Podiatrist:",
      minutes: "min",
      tel: "Tel:",
      confirmDeleteAppointment: "Remove this appointment from the record? It will be permanently deleted.",
      upcomingAppointments: "Upcoming appointments",
      upcomingSessions: "Upcoming sessions (7 days)",
      noUpcomingSessions: "No upcoming sessions",
      legend: "Legend",
      legendAppointment: "Scheduled appointment",
      legendSessionCompleted: "Session completed",
      legendSessionDraft: "Session draft",
      legendCancelled: "Cancelled",
      cancelledSlotHint: "There was a cancelled appointment in this time slot. The slot is free: you can book without issues.",
      formTitleNew: "New Appointment",
      formTitleEdit: "Edit Appointment",
      patientLabel: "Patient",
      patientPendingOption: "Patient to be registered",
      pendingPatientInfo: "Pending patient information:",
      nameRequired: "Name *",
      phoneRequired: "Phone *",
      namePlaceholder: "Full name of patient",
      phonePlaceholder: "Contact phone",
      podiatristRequired: "Podiatrist *",
      selectPodiatrist: "Select podiatrist",
      dateRequired: "Date *",
      timeRequired: "Time *",
      durationMinutes: "Duration (minutes)",
      duration15: "15 minutes",
      duration30: "30 minutes",
      duration45: "45 minutes",
      duration60: "1 hour",
      duration90: "1 hour 30 minutes",
      notesPlaceholder: "Reason for visit, additional comments...",
      cancelAppointmentButton: "Cancel Appointment",
      confirmCancelAppointment: "Cancel this appointment?",
      close: "Close",
      saveChanges: "Save Changes",
      createAppointment: "Create Appointment",
      creating: "Creating…",
      saving: "Saving…",
      errorPendingPatientRequired: "Please enter the pending patient's name and phone.",
      errorOverlap: "This time slot overlaps with another appointment for the same podiatrist. Please choose another day, time, or podiatrist (if you manage a clinic).",
      errorUpdateFailed: "Could not update the appointment.",
      errorCreateFailed: "Could not create the appointment.",
      errorSaveFailed: "Error saving the appointment.",
      errorDeleteFailed: "Could not delete the appointment.",
      downloadIcs: "Download .ics",
      exportDateLabel: "Date to export",
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Download scheduled appointments for the day as .ics (appointments with time only; clinical sessions are not included)",
      exportWaHint: "Downloads the .ics and opens WhatsApp. If the podiatrist has a mobile on their profile, the chat opens directly; otherwise pick the contact manually. Attach the .ics.",
      exportSelectPodiatrist: "Select a podiatrist in the filter to export the schedule.",
      exportNoAppointments: "No scheduled appointments for this day.",
      exportBusy: "Exporting…",
      exportWaHeader: "📅 Schedule for {{fecha}} — {{podologo}} ({{count}} appointments)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 The agenda-.ics file has been downloaded — attach it in WhatsApp to import to your mobile calendar.",
      exportWaInvalidPhone: "The podiatrist's phone is not valid for WhatsApp. Open WhatsApp manually and paste the message.",
      checkInWaiting: "Waiting",
      checkInInConsult: "In consult",
      checkInDone: "Seen",
      checkInNone: "No check-in",
      scheduledMetric: "Scheduled",
      completedMetric: "Completed",
      noShow: "No-show",
      waitlist: "Waitlist",
      agendaDemandTitle: "Agenda demand",
      agendaDemandDemandTotal: "Total demand: {n}",
      goToCheckoutAgendaLong: "View agenda analytics in checkout",
      pendingBadge: "Pending",
      confirmSaveAnyway: "Do you want to save the appointment anyway?",
      outsideHoursBlocked: "Outside hours: the appointment will not be saved. Reception cannot book appointments outside permitted hours.",
      confirmMarkNoShow: "Mark this appointment as no-show?",
      markNoShow: "No-show",
      noPhoneShort: "no phone",
      preferredDateShort: "pref. {date}",
      outsideHoursReceptionistNote: "The appointment will not be saved: reception cannot book outside hours.",
      outsideHoursContinueNote: "You can continue; confirmation will be requested on save.",
      icsExportTitle: "Export Schedule (.ics)",
      icsExportDescription: "The .ics file is a standard calendar format that you can import into Outlook, Google Calendar, Apple Calendar, or any calendar app. When you download it, the file is saved to your device.",
      icsExportLabel: "Select the date to export",
    },
    credits: {
      title: "Credits",
      currentBalance: "Current Balance",
      monthlyCredits: "Monthly Credits",
      extraCredits: "Extra Credits",
      purchaseCredits: "Purchase Credits",
      creditHistory: "Credit History",
      consumption: "Consumption",
      purchase: "Purchase",
      expiration: "Expiration",
      expiresEndOfMonth: "Expires at end of month",
      neverExpires: "Never expires",
      reserved: "Reserved",
      used: "Used",
      available: "Available",
      insufficientCredits: "Insufficient credits",
      creditPackages: "Credit Packages",
      buyNow: "Buy Now",
    },
    settings: {
      title: "Settings",
      theme: "Theme",
      language: "Language",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      accentColor: "Accent Color",
      accentColorHint: "Enter a hex color",
      preview: "Preview",
      saveSettings: "Save Settings",
      settingsSaved: "Settings saved",
      general: "General",
      appearance: "Appearance",
      notifications: "Notifications",
      security: "Security",
      paletteHint: "Customize colors for each area of the interface. You can set different palettes for light and dark mode.",
      paletteGroupBrand: "Brand & UI",
      paletteGroupSemantic: "Semantic states",
      paletteGroupWhatsapp: "WhatsApp Web",
      changeColor: "Change",
      resetPaletteMode: "Reset this mode",
      resetPaletteAll: "Reset all",
      palettePreviewBrand: "Preview — interface",
      palettePreviewSemantic: "Preview — semantic states",
      palettePreviewWhatsapp: "Preview — WhatsApp Web",
      palettePreviewMessages: {
        error: "Could not save the record.",
        warning: "Review the data before continuing.",
        success: "Changes saved successfully.",
        info: "Session expires in 5 minutes.",
      },
            palettePreviewLabels: {
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
      navMenuTitle: "Sidebar menu",
      navMenuHint: "Choose which sections appear in the navigation menu. Changes apply instantly on this device.",
      navMenuMinOne: "At least one section must remain visible in the menu.",
      navMenuReset: "Show all",
      paletteTokens: {
        sidebar: "Sidebar",
        primary: "Primary color",
        primaryHover: "Primary hover",
        canvas: "Background",
        surface: "Cards & panels",
        muted: "Secondary text",
        border: "Borders",
        error: "Error (text)",
        errorBg: "Error (background)",
        warning: "Warning (text)",
        warningBg: "Warning (background)",
        success: "Success (text)",
        successBg: "Success (background)",
        info: "Info (text)",
        infoBg: "Info (background)",
        whatsapp: "WhatsApp button",
        whatsappBg: "Panel (background)",
        whatsappBorder: "Panel (border)",
        whatsappMuted: "Panel (secondary text)",
      },
      tabs: {
        profile: "Profile",
        clinicalHistory: "Clinical history",
        integrations: "Integrations",
        clinic: "Clinic",
        billing: "Subscription",
      },
      settingsScope: {
        appliesClinic: "Applies to the whole clinic.",
        appliesIndependent: "Applies to your independent practice.",
        appliesPractice: "Applies to your practice.",
      },
      watermark: {
        title: "Background watermark",
        hint: "Subtle image in the main area. Adjust size, position and intensity.",
        show: "Show background watermark",
        customImage: "Custom image",
        useProfessionalLogo: "Use professional logo",
        logoHint: "If you choose the professional or clinic logo, the one configured on this page is used.",
        loading: "Loading watermark…",
        imageTooLarge: "The image cannot exceed 2 MB.",
        invalidFormat: "Invalid format. Use PNG, JPG or WebP (max. 2 MB).",
        loadImageError: "Error loading image.",
        saved: "Watermark saved.",
        saveFailed: "Error saving.",
        imageLabel: "Image",
        noLogo: "No logo configured",
        noImage: "No image",
        upload: "Upload image",
        formatHint: "JPEG, PNG or WebP · max. 2 MB",
        removeImage: "Remove image",
        intensity: "Intensity ({pct}%)",
        intensityHint: "6–10% usually looks good as a subtle watermark.",
        size: "Size ({pct}% of panel)",
        zoom: "Zoom ({pct}%)",
        zoomHint: "Increase zoom (200%+) to cover the visible area. Combine with centered position.",
        positionX: "Horizontal position ({pct}%)",
        positionY: "Vertical position ({pct}%)",
        left: "Left",
        center: "Center",
        right: "Right",
        top: "Top",
        bottom: "Bottom",
        saving: "Saving…",
        save: "Save watermark",
      },
      billing: {
        title: "Subscription",
        subscriptionTitle: "PodoAdmin subscription",
        independentPlan: "Independent podiatrist plan",
        status: "Status",
        trialPeriod: "Trial period",
        trialEnd: "Trial end",
        trialActive: "1-month trial active. Enjoy full access until {date}",
        adminNoSub: "Platform administrators do not require a subscription.",
        receptionistHint: "The clinic subscription is managed by the clinic administrator.",
        statusActive: "Active",
        statusPastDue: "Payment pending",
        statusCancelled: "Cancelled",
        paymentReceived: "Payment received. The subscription will activate in a few seconds.",
        paymentCancelled: "Payment cancelled. You can try again whenever you want.",
        cardVerified: "Card verified successfully.",
        cardVerifyError: "Error verifying the card.",
        cardMockVerified: "Mock card verified (development only).",
        cardSetupError: "Could not start card verification.",
        trialActivated: "Trial period activated.",
        trialActivateError: "Could not activate the trial.",
        checkoutError: "Could not start payment.",
        portalError: "Could not open the billing portal.",
        activateTrialTitle: "Activate free trial (1 month)",
        activateTrialHint: "Verify your email and card. One account, one card and one connection (IP) can only be used once for the trial.",
        stepEmail: "1. Email verified",
        emailVerifyHint: "Check your inbox{email} and confirm the verification link. If you did not receive it, sign out and request it again when registering.",
        stepCard: "2. Card",
        verifyCard: "Verify card (no charge today)",
        activateMonthTrial: "Activate 1-month trial",
        overLimit: "Your clinic has {count} active podiatrists, above the {limit} included, and extra-seat billing is not configured. Contact PodoAdmin.",
        overCapacityAfterDowngrade: "You have {count} active podiatrists, more than the {limit} your current plan allows. They keep working normally, but you won't be able to add any new one until you buy extra seats or reduce your team.",
        loading: "Loading…",
        clinicPlan: "Clinic plan",
        activePodiatrists: "Active podiatrists:",
        stripeNotConfigured: "Stripe is not configured. Set STRIPE_PRICE_CLINIC_MONTHLY_STANDARD and STRIPE_PRICE_INDEPENDENT_MONTHLY on the server.",
        extraSeatsTitle: "Additional podiatrists",
        extraSeatsHint: "Your plan includes {included} podiatrists. Add as many as you need for ${price} USD/mo each; the change is prorated on your invoice.",
        extraSeatsLabel: "Additional podiatrists",
        extraSeatsSave: "Update additional podiatrists",
        extraSeatsSaved: "Additional podiatrists updated.",
        extraSeatsTotal: "Additional: {seats} × ${price} = ${total} USD/mo",
        extraSeatsError: "Could not update additional podiatrists.",
        extraSeatsBreakdown: "{included} included in your plan + {seats} additional",
        extraSeatsTrialNote: "During the trial you can adjust your seats at no cost. When you activate your subscription you'll be charged ${price} USD/mo per additional podiatrist.",
        extraSeatsTrialSaved: "Podiatrist seats updated. You can now add more podiatrists to your clinic.",
        growthTitle: "Is your practice growing?",
        growthHint: "Upgrade to Premium to unlock analytics, advanced clinical tools and WhatsApp campaigns, or move to a Clinic plan to add podiatrists and reception.",
        growthClinicBullet: "Clinic plan: from $100 USD/mo with 5 podiatrists included (8 on Premium) and additional podiatrists for $10 USD/mo.",
        growthContact: "I want to move to a Clinic plan",
        subscribe: "Subscribe — ${amount} USD/month",
        manageStripe: "Manage billing in Stripe",
        clinicManagedByAdmin: "Your clinic subscription is managed by the clinic administrator.",
      },
      dashboardLogo: {
        title: "Dashboard logo",
        loading: "Loading dashboard options…",
        saved: "Dashboard logo settings saved.",
        saveFailed: "Error saving.",
        enabledByAdmin: "The clinic administrator has enabled the logo on the dashboard.",
        notShown: "The logo is not shown on the dashboard.",
        hint: "Card on the home screen. Adjust size, position and intensity.",
        show: "Show logo on the dashboard",
        opacity: "Opacity ({pct}%)",
        size: "Size ({pct}% of card area)",
        zoom: "Zoom ({pct}%)",
        zoomHint: "Enlarge or reduce the logo within the area. The card grows to avoid cropping.",
        positionX: "Horizontal position ({pct}%)",
        positionY: "Vertical position ({pct}%)",
        left: "Left",
        center: "Center",
        right: "Right",
        top: "Top",
        bottom: "Bottom",
        saving: "Saving…",
        save: "Save dashboard logo",
      },
            clinicalLayout: {
        loadingDesigner: "Loading designer…",
        title: "Clinical history designer",
        hint: "Enable or disable blocks for sessions and print. Add custom sections to match your clinical flow.",
        restoreDefault: "Restore default",
        saveDesign: "Save design",
        addSection: "Add section",
        editSection: "Edit section",
        previewForm: "Preview — session form",
        newSectionDefault: "New section",
        itemN: "Item {n}",
        columnN: "Column {n}",
        saved: "Design saved successfully.",
        saveFailed: "Error saving.",
        restoreConfirm: "Restore all sections to the default design? Custom ones will be lost.",
        saving: "Saving…",
        readOnlyHint: "Read-only: the clinic administrator configures the shared design.",
        sectionsCount: "Sections ({count})",
        sectionTitlePlaceholder: "Section title",
        titleLabel: "Title",
        builtinTitleHint: "You can customize the title shown in session and print.",
        onPatientCard: "On patient file",
        enabled: "Enabled",
        inSession: "In session",
        inPrint: "In print",
        patientCardHelp: "shows or hides the field when creating, editing or viewing a patient.",
        printAntecedentsHelp: "includes antecedents in the printed podiatric clinical history.",
        enabledHelp: "includes or excludes the section from the clinical flow.",
        inSessionHelp: "visible when creating or editing a session.",
        inPrintHelp: "included in the printable history (only sections with data).",
        deleteCustomSection: "Delete custom section",
        selectSection: "Select a section from the list",
        systemField: "System field",
        noSessionSections: "No sections visible in session.",
        remove: "Remove",
        maxColumns: "Maximum {count} columns.",
        checklistItems: "Checklist items",
        yesNoNaRows: "YES / NO / N/A rows",
        options: "Options",
        yesNoNaHint: "Each row will be a question in the session.",
        addItem: "+ Add item",
        addRow: "+ Add row",
        addOption: "+ Add option",
        unit: "Unit",
        unitPlaceholder: "min, ml, mm, %…",
        defaultUnit: "unit",
        scaleMax: "Maximum scale",
        conditionalPrompt: "YES/NO question",
        conditionalPlaceholder: "Was there a complication?",
        tableColumns: "Table columns",
        tableColumnsHint: "Name each column (e.g. product, quantity, lot).",
        addColumn: "+ Add column",
        tableRows: "Rows in session",
      },
      print: {
        title: "Print settings",
        hint: "Adjust how clinical history and prescriptions look when printing or saving as PDF.",
        preview: "Preview",
        loading: "Loading print preferences…",
        saved: "Print preferences saved.",
        saveFailed: "Could not save.",
        readOnlyHint: "Only the clinic administrator can change these options. Shown in read-only mode.",
        generalTitle: "General",
        generalDesc: "Applies to both documents.",
        headerAlign: "Header alignment",
        alignLeft: "Left",
        alignCenter: "Centered",
        monochrome: "Print in black and white",
        monochromeHint: "Grayscale, ideal to save ink.",
        showGeneratedBy: "Show \"Generated by PodoAdmin\" in the footer",
        footerText: "Custom footer text",
        footerPlaceholder: "E.g. Business hours, legal notice, social media…",
        historyTitle: "Clinical history",
        historyDesc: "Full patient document.",
        showLogo: "Show logo in the header",
        showLegalData: "Show legal data",
        showLegalDataHint: "RFC, CLUES, COFEPRIS and sanitary registry.",
        includePhotos: "Include clinical photographs",
        includePhotosHint: "Requires the images block to be active in the designer.",
        compact: "Compact layout",
        compactHistoryHint: "Smaller margins, type and diagrams to save pages.",
        orientation: "Page orientation",
        portrait: "Portrait",
        landscape: "Landscape",
        orientationHistoryHint: "Recommended: portrait for clinical histories.",
        evolutionRows: "Clinical evolution rows to print",
        rxTitle: "Prescriptions",
        rxDesc: "Prescription / script format.",
        showWeight: "Show patient weight",
        showHeight: "Show patient height",
        showNextVisit: "Show next visit",
        showNotes: "Show additional notes",
        showSignatureCedula: "Show license/registry on signature",
        compactRxHint: "Smaller margins and type to use less space.",
        orientationRxHint: "Recommended: landscape for prescriptions.",
        folioPosition: "Folio position",
        folioInline: "In header (recommended)",
        folioBar: "Highlighted bar",
        folioHint: "Inline folio saves a full line and usually fits on one page.",
        saving: "Saving…",
        save: "Save preferences",
        reset: "Restore defaults",
        previewSimHint: "Approximate simulation; the final document uses real patient data.",
        tabHistory: "Clinical history",
        tabRx: "Prescription",
        statusMonochrome: "Black and white mode on · ",
        statusHeaderCenter: "Centered header",
        statusHeaderLeft: "Left-aligned header",
        statusEvolutionRows: " · {count} evolution rows",
        statusCompact: " · compact layout",
        statusFolioInline: " · folio in header",
        demoClinicName: "Demo Podiatry Clinic",
        demoLicense: "License: 12345678",
        demoLegal: "RFC: XAXX010101000 · CLUES: DFSSA000001",
        demoContact: "555 123 4567 · demo@clinic.com",
        demoHistoryTitle: "PODIATRIC CLINICAL HISTORY · Folio: PREMIUM-001",
        demoPatientSection: "I. Patient data",
        demoPatientCells: ["Name: Laura M.", "ID: INE-884422", "Tel: 555…", "DOB: 12/03/1985"],
        demoEvolutionSection: "IV. Clinical evolution",
        demoColDate: "Date",
        demoColDiagnosis: "Diagnosis",
        demoColTreatment: "Treatment",
        demoDiagnosis: "Onychocryptosis",
        demoTreatment: "Debridement",
        demoMoreRows: "+ {count} more rows…",
        demoPhotos: "Photographs",
        demoFooter: "PodoAdmin · preview",
        demoDoctor: "Dr. Demo Podiatrist",
        demoCedula: "License: 12345678",
        demoTel: "Tel: 555 123 4567",
        demoFolio: "Folio:",
        demoFolioBar: "RX FOLIO:",
        demoPatientData: "PATIENT DATA",
        demoName: "Name: Laura M.",
        demoDni: "ID: INE-884422",
        demoAge: "Age: 41 years",
        demoWeight: "Weight: 72.5 kg",
        demoHeight: "Height: 165 cm",
        demoPrescription: "Prescription / Instructions",
        demoPrescriptionBody: "Apply antifungal cream twice daily for 14 days.",
        demoNextVisit: "Next visit",
        demoNextVisitDate: "Friday, August 15, 2026",
        demoNotes: "Additional notes",
        demoNotesBody: "Avoid closed footwear.",
        demoSignature: "Professional signature",
        logoPlaceholder: "LOGO",
      },
      profileAvatar: {
        changeTitle: "Change profile photo",
        invalidFormat: "Invalid format. Use PNG, JPG or WebP.",
        tooLarge: "The image cannot exceed 2 MB.",
        saveFailed: "Could not save the photo.",
        processFailed: "Could not process the image.",
        removeFailed: "Could not remove the photo.",
        saving: "Saving…",
        changePhoto: "Change photo",
        uploadPhoto: "Upload photo",
        removePhoto: "Remove photo",
        hint: "JPG, PNG or WebP. Max. 2 MB. Shown in the side menu.",
      },
      profile: {
        title: "User profile",
        name: "Name",
        email: "Email",
        readOnlyHint: "Profile details cannot be edited here. Contact an administrator if you need changes.",
      },
      cooldown: {
        logoPolicy: "After saving, the logo is locked for 15 days. After that period you can upload or change it again.",
        logoBlocked: "The logo can only be changed every 15 days.",
        clinicInfoPolicy: "After saving, clinic details are locked for 15 days. After that period you can edit them again.",
        clinicInfoBlocked: "Details can only be changed every 15 days.",
        professionalInfoPolicy: "After saving, these details are locked for 15 days. After that period you can edit them again.",
        professionalInfoBlocked: "Details can only be changed every 15 days.",
        profilePolicy: "Name and email can only be changed by an administrator. 15 days must pass between changes.",
        clinicReadOnlyPolicy: "Clinic information is managed by your administrator. 15 days must pass between changes.",
        genericBlocked: "Details can only be changed every 15 days.",
      },
      clinic: {
        fallbackName: "Clinic {id}",
        errors: {
          nameCodeRequired: "Clinic name and code are required.",
          invalidWebsite: "The website URL is not valid. Please check that it is configured correctly.",
        },
      },
      consent: {
        title: "Informed consent",
        sharedTitle: "Shared clinic text",
        sharedBody: "This text is managed by the clinic administrator and used for patient consent.",
        currentVersion: "Current version: {version}",
        empty: "No text configured.",
        editHint: "You can edit the text; each save increments the version.",
        placeholder: "Write the terms and informed consent the patient must accept.",
        save: "Save consent",
        saveError: "Error saving consent.",
      },
      logo: {
        empty: "No logo",
        previewAlt: "Preview",
        upload: "Upload image",
        formatHint: "PNG, JPG or WebP · max 2MB",
        save: "Save logo",
        remove: "Remove logo",
        errors: {
          invalidFormat: "Invalid format. Use PNG, JPG or WebP (max 2MB).",
          tooLarge: "File is too large. Maximum 2MB.",
          processFailed: "Could not process the image.",
          cooldown: "The logo can only be changed every 15 days.",
          saveFailed: "Could not save the logo. Please try again.",
        },
      },
      clinicLogo: {
        title: "Clinic logo",
        sharedTitle: "Shared clinic logo",
        sharedBody: "All clinic professionals see this logo on documents and printouts.",
        alt: "Clinic logo",
        uploadHint: "Upload the logo that identifies your clinic in the app and documents.",
      },
      professionalLogo: {
        title: "Professional logo",
        uploadHint: "Personal logo for documents and print when there is no clinic logo.",
        alt: "Professional logo",
      },
      adminLogo: {
        title: "Clinic logo",
        body: "Clinic logos are managed by each clinic's administrators. As {role}, you do not need a personal logo.",
      },
      assignedPodiatrists: {
        title: "Assigned podiatrists",
        clinicHint: "Clinic podiatrists you can serve. Check or uncheck to manage appointments and patients for each.",
        independentHint: "Podiatrist who assigned you. You can create patients and manage their calendar.",
        emptyClinic: "No podiatrists in your clinic.",
        save: "Save assignment",
        empty: "No podiatrist assigned.",
      },
      receptionist: {
        title: "Receptionist",
        description: "Create and manage the receptionist linked to your account or clinic.",
        status: {
          blocked: "Blocked",
          disabled: "Disabled",
          active: "Active",
        },
        unblock: "Unblock",
        block: "Block",
        enable: "Enable",
        disable: "Disable",
        delete: "Delete",
        oneOnlyHint: "You can only have one linked receptionist. Delete them to create another.",
        fields: {
          name: "Name",
          email: "Email",
          initialPassword: "Initial password",
        },
        createdSuccess: "Receptionist created successfully.",
        create: "Create receptionist",
        createError: "Error creating receptionist",
        confirmDelete: "Delete this receptionist? This cannot be undone.",
      },
      clinicInfo: {
        title: "Clinic information",
        subtitle: "Contact and tax details for your clinic.",
        setupBanner: "Complete your clinic details. While the name is provisional or contact and address are missing, warnings will appear.",
        clinicName: "Clinic name *",
        clinicNamePlaceholder: "My Podiatry Clinic",
        clinicCode: "Code (for folios) *",
        clinicCodePlaceholder: "MICP",
        clinicCodeHint: "Max 8 characters. Used in folios (e.g. MICP-2025-001)",
        country: "Country (phone prefix)",
        countryHint: "Default prefix for clinic phone numbers.",
        phone: "Phone",
        email: "Email",
        emailPlaceholder: "clinic@example.com",
        address: "Address",
        addressPlaceholder: "Main Street 45, 2nd floor",
        city: "City",
        cityPlaceholder: "Madrid",
        postalCode: "Postal code",
        postalCodePlaceholder: "28013",
        mapsUrl: "Google Maps link (optional)",
        mapsUrlPlaceholder: "https://maps.app.goo.gl/...",
        mapsUrlHint: "Used as the location in WhatsApp messages when the address alone isn't enough to generate a useful link.",
        licenseNumber: "License / registry no.",
        licensePlaceholder: "CS-28/2024-POD-001",
        website: "Website (optional)",
        websitePlaceholder: "https://www.myclinic.com",
        legalName: "Legal name (NOM)",
        rfc: "RFC",
        clues: "CLUES",
        cofepris: "COFEPRIS registration",
        readOnlyTitle: "Your clinic details",
        readOnlyBody: "Read only. Your clinic administrator manages these details.",
        labels: {
          name: "Name:",
          phone: "Phone:",
          email: "Email:",
          address: "Address:",
          maps: "Maps:",
          license: "License:",
          consent: "Consent:",
          web: "Web:",
        },
        viewDocument: "View document",
      },
      practice: {
        title: "Practice information",
        subtitle: "Details for your independent professional practice.",
        professionalName: "Professional name",
        namePlaceholder: "Dr. John Smith",
        country: "Country (phone prefix)",
        countryHint: "Default prefix for your practice.",
        emailPlaceholder: "practice@example.com",
        sanitaryRegistry: "Sanitary registry",
        cedula: "Professional license",
        cedulaPlaceholder: "12345678",
      },
      credentials: {
        title: "Professional credentials",
        subtitle: "Contact phone and professional registry number.",
        contactPhoneTitle: "Contact phone",
        contactPhoneHint: "Visible to patients and on documents when applicable.",
        country: "Country",
        mobile: "Mobile",
        savePhone: "Save phone",
        registryNumber: "Professional registry no.",
        registryPlaceholder: "REG-2024-001",
        save: "Save credentials",
        clinicInfoTitle: "Clinic information",
        clinicInfoBody: "As a clinic member, these details are managed by the administrator.",
        clinicName: "Clinic name",
      },
      common: {
        saved: "Saved",
        readOnly: "Read only",
        saveInfo: "Save information",
        emDash: "—",
        ellipsis: "...",
      },
      errors: {
        connectionSave: "Connection error while saving.",
      },
      supportSenderLabel: "PodoAdmin",
    },
    premium: {
      badge: "Premium",
      baseBadge: "Base",
      lockedTab: "Available in Premium",
      upsellTitle: "Available in the Premium plan",
      upsellBody: "Sales, collections, profitability and agenda analytics are included in the Premium plan. Upgrade to unlock them.",
      upsellCta: "See plans and upgrade",
      clinicalToolsLockedTitle: "Clinical tools is a Premium feature",
      clinicalToolsLockedBody: "The template designer, inventory and referrals are included in the Premium plan.",
      campaignsLockedTitle: "WhatsApp campaigns is a Premium feature",
      campaignsLockedBody: "Campaigns and patient reactivation via WhatsApp are included in the Premium plan. Basic WhatsApp Web remains available on your plan.",
      agendaAnalyticsLockedBody: "Demand, occupancy and daily close analytics are included in the Premium plan.",
      upgradeButton: "Upgrade to Premium",
      upgradeSuccess: "Your plan was updated successfully.",
      planBase: "Base plan",
      planPremium: "Premium plan",
      menuManagePlan: "Plan (Base/Premium)",
      planPrompt: "Current plan: {current}. Type \"base\", \"premium\" or \"auto\" (auto = as paid in Stripe):",
      planInvalid: "Invalid value. Use \"base\", \"premium\" or \"auto\".",
      planUpdated: "Plan updated: {tier}.",
    },

    reservationAction: {
      confirmTitle: "Confirm appointment",
      cancelTitle: "Cancel appointment",
      rescheduleTitle: "Reschedule appointment",
      loading: "Loading your reservation…",
      greeting: "Hi {name},",
      confirmQuestion: "Do you confirm your attendance to this appointment?",
      cancelQuestion: "Are you sure you want to cancel this appointment?",
      dateLabel: "Date",
      timeLabel: "Time",
      clinicLabel: "Clinic",
      podiatristLabel: "Professional",
      confirmButton: "Confirm attendance",
      cancelButton: "Cancel appointment",
      confirmedOk: "Appointment confirmed! See you there.",
      cancelledOk: "Your appointment has been cancelled. Thanks for letting us know.",
      rescheduledOk: "Your appointment has been cancelled. We'll reach out to you shortly to reschedule it.",
      alreadyConfirmed: "This appointment was already confirmed. See you there!",
      alreadyCancelled: "This appointment was already cancelled.",
      invalidMsg: "This link is not valid or is no longer available.",
      expiredMsg: "This appointment already took place; the link is no longer available.",
      errorGeneric: "We could not process your request. Please try again in a few minutes.",
      processingConfirm: "Confirming your appointment…",
      processingCancel: "Cancelling your appointment…",
      processingReschedule: "Processing your reschedule request…",
      changedMindToCancel: "Changed your mind? Cancel this appointment",
      changedMindToConfirm: "Changed your mind? Confirm attendance",
      slotTaken: "The time slot was taken by another patient. Could not reconfirm.",
      pageCloseable: "Your confirmation has been registered successfully. You can now close this page.",
      closePageNow: "Close now",
      keepOpen: "Keep open",
      cantAutoClose: "Please close this window manually",
      satisfactionTitle: "Your feedback",
      satisfactionProcessing: "Recording your feedback…",
      thanksGood: "Thank you! We're glad your visit was excellent.",
      thanksRegular: "Thanks for your feedback. What could we improve?",
      thanksBad: "We're sorry your visit wasn't good. Tell us what happened so we can improve.",
      reviewCta: "Leave us a review on Google",
      complaintPrompt: "Complaints or suggestions (optional)",
      complaintPlaceholder: "Tell us in detail what we can improve…",
      anonymousLabel: "Send anonymously",
      sendComment: "Send comment",
      commentSent: "Thank you! We received your comment and will follow up.",
      sending: "Sending…",
      bookingTitle: "Book your appointment",
      bookingInvalid: "This link isn't available.",
      bookingPickDate: "Pick a day",
      bookingPickTime: "Pick a time",
      bookingLoadingSlots: "Loading times…",
      bookingNoSlots: "No available times that day.",
      bookingName: "Your name",
      bookingPhone: "Your WhatsApp (to confirm)",
      bookingConfirm: "Confirm appointment",
      bookingBooking: "Booking…",
      bookingDoneTitle: "Appointment booked!",
      bookingDoneMsg: "See you on {date} at {time}. We'll contact you to confirm.",
      bookingSlotTaken: "That time was just taken. Please pick another.",
    },

    support: {
      title: "Contact PodoAdmin",
      contactPodoAdmin: "Contact PodoAdmin",
      contactSubtitle: "Send a direct message to support. We will respond as soon as possible.",
      newConversation: "New message",
      subject: "Subject",
      subjectPlaceholder: "E.g.: Billing issue",
      message: "Message",
      messagePlaceholder: "Describe your query or issue...",
      send: "Send",
      myConversations: "My conversations",
      noConversations: "You have no conversations yet.",
      reply: "Reply",
      replyPlaceholder: "Write your reply...",
      open: "Open",
      closed: "Closed",
      markAsRead: "Mark as read",
      closeConversation: "Close conversation",
      reopenConversation: "Reopen conversation",
      from: "From",
      sent: "Sent",
    },
    layout: {
      brandFallback: "PodoAdmin",
      unlockSidebarVisible: "Unlock (locked visible)",
      unlockSidebarHidden: "Unlock (locked hidden)",
      lockSidebarVisible: "Lock sidebar visible",
      toggleSidebarLock: "Toggle sidebar lock",
      hideMenu: "Hide menu",
      showMenu: "Show menu",
      pendingAccessBanner: "Your clinical access is pending. Activate payment in Billing or wait for an administrator to enable your account.",
      goToBilling: "Go to billing",
      goToSupport: "Go to support",
      subscriptionInactiveBanner: "Your subscription is not active. Renew to keep using the platform.",
      closeMenu: "Close menu",
      sponsored: "Sponsored",
      closeAnnouncement: "Close announcement",
      promoCodeOnSite: "Code on the organizer's website:",
      seeMore: "See more",
      interested: "I'm interested",
      interestRegistered: "Interest registered ✓",
    },
    whatsapp: {
      title: "WhatsApp Business",
      subtitle:
        "Connect your Meta business number for appointment reminders via WhatsApp. Data is stored encrypted. Only you (podiatrist or clinic admin) can configure this section.",
      loading: "Loading WhatsApp settings…",
      setupTitle: "How to set up WhatsApp (long-lived token)",
      setupStep1Prefix: "Go to",
      setupStep1Link: "Business Settings → System users",
      setupStep1Suffix: "and create a system user.",
      setupStep2: "Assign your Meta app and WhatsApp Business Account (WABA) as assets.",
      setupStep3: "Generate a token for that user and grant WhatsApp permissions (messaging/admin as needed).",
      setupStep4Prefix: "From",
      setupStep4Link: "Meta for Developers",
      setupStep4Suffix: "also copy Phone Number ID and WABA ID.",
      setupStep5: "Paste the values in this form, save, and click “Test connection”.",
      statusLabel: "Status:",
      statusConnected: "connected",
      statusError: "error",
      statusPending: "pending",
      phoneNumberIdLabel: "Phone Number ID (Meta) *",
      phoneNumberIdPlaceholder: "E.g.: 123456789012345",
      wabaIdLabel: "WhatsApp Business Account ID (optional)",
      wabaIdPlaceholder: "WABA ID",
      accessTokenLabel: "Permanent access token",
      accessTokenRequired: "*",
      accessTokenKeepCurrent: "(leave empty to keep current)",
      accessTokenPlaceholderSaved: "•••••••• (saved)",
      accessTokenPlaceholderNew: "Token from Meta Business Suite",
      hideTokenField: "Hide token field",
      changeToken: "Change token",
      publicPhoneLabel: "Public phone (optional)",
      publicPhonePlaceholder: "+34600111222",
      remindersSection: "Appointment reminders",
      remindersAuto: "Enable automatic WhatsApp reminders (patients with phone only)",
      reminderDaysBefore: "Days before appointment",
      reminderHoursBefore: "Hours before appointment",
      reminderHourBefore: "{hours} h before",
      reminderDayOne: "{days} day before",
      reminderDayMany: "{days} days before",
      reminderSelectHour: "Reminder lead time",
      reminderAddHour: "+ Add another time",
      reminderRemoveHour: "Remove",
      reminderHoursHint: "Up to 8 hour-based reminders. Day reminders (5, 2, 1) are separate.",
      reminderScheduleHint: "Turn on automatic reminders above to edit this schedule.",
      reminderDaysHelp: "Click each option to turn it on or off (at least one required).",
      reminderHoursHelp: "Use each dropdown to choose how many hours before to notify.",
      reminderDaysRequired: "Select at least one day for reminders.",
      reminder48h: "48 h before",
      reminder24h: "24 h before",
      templateNameLabel: "Meta template name (reminder)",
      templateNamePlaceholder: "e.g. appointment_reminder",
      templateHint:
        "Must be approved in Meta Business Manager with 4 variables: {{1}} name, {{2}} date, {{3}} time, {{4}} notes/extras.",
      defaultExtraNoteLabel: "Default note or extra message",
      defaultExtraNotePlaceholder: "E.g.: Bring previous studies. Parking on side street.",
      defaultExtraNoteHint:
        "Sent as the 4th template parameter in automatic and manual reminders (unless you enter another note when sending). Max 500 characters.",
      templateLanguageLabel: "Template language",
      templateLanguagePlaceholder: "en",
            integrationActive: "Integration active (sends enabled when cron is active)",
      receptionistApiEnabled: "Allow reception to use automatic Meta API sending (reminders and history).",
      save: "Save settings",
      saving: "Saving…",
      testConnection: "Test connection",
      testing: "Testing…",
      disconnect: "Disconnect",
      guidesFooter: "Official guides:",
      guidesCloudApi: "Meta WhatsApp Cloud API",
      guidesSystemUsers: "System Users (long-lived token)",
      consentNote: "Patients must have consented to WhatsApp messages.",
      purposeTitle: "What is this section for?",
      purposeDescription:
        "Connect your WhatsApp Business account (Meta) to send appointment reminders to patients. Save your token and approved template; then use «WhatsApp Messages» to send reminders and see delivery status.",
      errorApiUnavailable:
        "Could not reach the WhatsApp service on the server. Reload the page (Ctrl+F5). If it persists, restart the dev server.",
      errorLoad: "Could not load settings",
      errorPhoneRequired: "Meta Phone Number ID is required.",
      errorTokenRequired: "Meta permanent access token is required.",
      errorTemplateRequired: "Enter the approved Meta template name for reminders.",
      errorSave: "Error saving",
      errorTest: "Error testing connection",
      errorTestFailed: "Connection test failed",
      errorDisconnect: "Error disconnecting",
      disconnectConfirm: "Remove WhatsApp settings? Automatic reminders will stop.",
      successSaved: "WhatsApp settings saved successfully.",
      successSavedWarning: "Saved. Connection warning: {warning}",
      successTest: "Connection successful with Meta.",
      successTestWithPhone: "Connection successful ({phone})",
      successDisconnected: "WhatsApp disconnected.",
      campaigns: {
        title: "WhatsApp campaigns",
        pageHint: "Broadcast messages to patients with a phone number. Use WhatsApp Web (manual, no API) or automatic Meta API sending if configured.",
        webTitle: "Campaigns via WhatsApp Web",
        webHint: "Create a message draft and send it patient by patient with wa.me. Without Meta: you tap Send in WhatsApp.",
        openWeb: "Open WhatsApp Web",
        newDraft: "New campaign (draft)",
        metaApiTitle: "Automatic sending via Meta API",
        metaApiHint: "Requires WhatsApp Business configured in Settings. You can ignore this section if you only use WhatsApp Web.",
        denied: "No permission for WhatsApp campaigns.",
        patientsLoadError: "Patients error",
        draftCreated: "Campaign created as draft",
        createError: "Error creating",
        sendConfirm: "Send this campaign via Meta API to all patients with a phone number?",
        apiSendResult: "API: sent {sent}, failed {failed}",
        apiSendError: "Error sending via API",
        namePlaceholder: "Internal name (e.g. Summer promo)",
        messagePlaceholder: "Message with variables, e.g.:\nHello {{nombre}}, we would like to inform you...",
        variablesHint: "Variables:",
        variablesList: "{{nombre}} (first name), {{apellido}} (last name), {{nombre_completo}} (full name)",
        clinicOnlyFilter: "Only patients from my clinic",
        recipientsWithPhone: "Recipients with a valid phone:",
        recipientsMismatchHint: "There are {count} patient(s) in your list; check they have a phone with at least 8 digits or uncheck “Only patients from my clinic”.",
        patientsLoadFailed: "Could not load patients. Check permissions or reload the page.",
        noPatientsYet: "There are no patients in the list yet.",
        saveDraft: "Save draft",
        assistantTitle: "Send assistant — {name}",
        assistantPatientOf: "Patient {current} of {total}:",
        openWhatsApp: "Open WhatsApp",
        assistantDone: "Assistant completed: {count} patients.",
        finish: "Finish",
        nextPatient: "Next patient",
        draftsToSend: "Drafts to send",
        loading: "Loading…",
        recipientsCount: "{count} recipient(s) with WhatsApp",
        sendAssistant: "Send assistant",
        deleteDraft: "Delete",
        deleteDraftConfirm: "Delete draft «{name}»? This cannot be undone.",
        deleteDraftError: "Couldn't delete the draft.",
        hideList: "Hide list",
        showList: "View list",
        noValidRecipients: "No valid recipients.",
        noDrafts: "No drafts. Create a campaign above.",
        connected: "(connected)",
        optional: "(optional)",
        receptionistApiHint: "Automatic sending enabled by your podiatrist.",
        receptionistApiDisabled: "Your podiatrist has not yet enabled automatic Meta API sending for reception.",
        configureApiHint: "Configure WhatsApp Business in Settings to send campaigns via Meta API.",
        allCampaigns: "All campaigns",
        sentAt: "sent {date}",
        sending: "Sending…",
        sendByApi: "Send via API",
        noCampaigns: "No campaigns",
      },
      messages: {
        title: "WhatsApp messages",
        webTitle: "Reminders via WhatsApp Web",
        webHint: "Without configuring the Meta API. Open WhatsApp Web or the app with the message ready; you send it manually.",
        openWeb: "Open WhatsApp Web",
        metaApiTitle: "Automatic sending with Meta API",
        metaApiHint: "Requires Meta API configured in Settings → WhatsApp.",
        historyTitle: "History (automatic API)",
        historyHint: "Log of automatic Meta API sends. WhatsApp Web reminders are not recorded here.",
        denied: "You do not have permission to view this section.",
        patientFallback: "Patient",
        defaultExtraNote: "Please confirm your attendance by replying to this message.",
        noValidPhone: "No valid phone for {name}.",
        selectAppointmentFirst: "Select an appointment first.",
        reminderSendError: "Could not send the reminder.",
        reminderSent: "Reminder sent successfully.",
        defaultMessage: "Default message",
        variablesHint: "Variables:",
        variablesList: "{{nombre}} (first name), {{fecha}} (date), {{hora}} (time), {{nota}} (note), {{confirmar}} (confirmation link), {{cancelar}} (cancellation link), {{reagendar}} (reschedule link)",
        extraNotePlaceholder: "Extra note for all sends today (optional)",
        saved: "Saved",
        saveMessage: "Save message",
        dayOffsetLabel: "Reminders for:",
        dayOffsetToday: "Today",
        dayOffsetTomorrow: "Tomorrow",
        dayOffsetIn2Days: "In 2 days",
        dayOffsetIn5Days: "In 5 days",
        tomorrowAppointments: "Appointments on {date}",
        loadingAppointments: "Loading appointments…",
        noTomorrowAppointments: "No appointments scheduled for that day.",
        noPhone: "No phone",
        sendViaWhatsApp: "Send via WhatsApp",
        connected: "(connected)",
        optional: "(optional)",
        receptionistApiHint: "Automatic sending enabled by your podiatrist. Reminders are sent without opening WhatsApp Web.",
        configLoadError: "Could not get WhatsApp status.",
        connectedLabel: "Connected",
        apiStatusLabel: "API status",
        templateLabel: "Template",
        templateUndefined: "Not defined",
        lastErrorLabel: "Last error",
        noErrors: "No errors",
        sendAutoReminder: "Send automatic reminder",
        selectUpcomingAppointment: "Select an upcoming appointment",
        sending: "Sending...",
        sendByApi: "Send via API",
        singleExtraNotePlaceholder: "Extra note for this send (optional)",
        lastApiSends: "Latest API sends",
        refresh: "Refresh",
        loadingHistory: "Loading history...",
        configureForHistory: "Configure WhatsApp Business in Settings to use automatic sending and see history here.",
        noApiSends: "No API sends. WhatsApp Web reminders are not recorded here.",
        colDate: "Date",
        colPatient: "Patient",
        colPhone: "Phone",
        colStatus: "Status",
        colNote: "Note",
        emDash: "—",
        yes: "Yes",
        no: "No",
        pendingRescheduleTitle: "Pending reschedule",
        pendingRescheduleHint: "Cancelled appointments that don't have a new appointment scheduled for the same patient yet.",
        loadingPendingReschedule: "Loading pending reschedules…",
        noPendingReschedule: "No appointments pending reschedule.",
        cancelledOn: "Cancelled on {date}",
        sendRescheduleMessage: "Notify reschedule",
        rescheduleWhatsAppMessage: "Hi {name}, your appointment on {date} was cancelled. We'll reach out to you shortly to reschedule it. Thanks for your patience!",
        rescheduleWaMsgTitle: "WhatsApp message when notifying reschedule",
        rescheduleWaMsgHint: "Text sent when you tap “Notify reschedule”. Variables: {name}, {date} and {reserva} (inserts your online booking link so the patient can book themselves).",
        rescheduleMessageSectionTitle: "Custom reschedule message",
        rescheduleMessageHint: "Text shown to the patient on the page opened from the {{reagendar}} link in the WhatsApp message. If left empty, a default message is used.",
        rescheduleMessagePlaceholder: "E.g. Your appointment was cancelled. Message us on WhatsApp to reschedule faster.",
        rescheduleMessageScope: "Scope: {label}",
        rescheduleMessageReadOnlyHint: "Read only: set by your podiatrist or the clinic admin.",
        savingRescheduleMessage: "Saving…",
        saveRescheduleMessageButton: "Save message",
        markRescheduleHandled: "Mark as handling",
        reopenReschedule: "Reopen",
        rescheduleHandledBadge: "Handling",
        dismissReschedule: "Remove",
        dismissRescheduleConfirm: "Remove {name} from pending reschedules? The appointment isn't deleted, it just leaves this list.",
        opinionSectionTitle: "Request feedback (satisfaction)",
        opinionSectionHint: "Appointments attended in the last 7 days without feedback. Send the patient the 👍 😐 👎 links via WhatsApp.",
        loadingOpinion: "Loading attended appointments…",
        noOpinionCandidates: "No attended appointments pending feedback.",
        attendedOn: "Attended on {date}",
        requestOpinion: "Request feedback",
        opinionWhatsAppMessage:
          "Hi {name}, how was your visit at {clinica}? Your feedback helps us a lot:\n👍 Good: {good}\n😐 Okay: {regular}\n👎 Bad: {bad}",
        bookingLinkTitle: "Online booking",
        bookingLinkHint: "Share this link with your patients so they can book themselves. It shows your clinic's brand; they never see PodoAdmin.",
        bookingLinkEnabled: "Online booking enabled",
        bookingLinkDisabled: "Enable online booking",
        bookingLinkCopy: "Copy link",
        bookingLinkCopied: "Copied!",
      },
    },
    clinicalTools: {
      title: "Clinical tools",
      denied: "You do not have permission to access this section.",
      tabTemplates: "Session templates",
      tabInventory: "Inventory",
      tabReferrals: "Referrals",
      templatesHint: "Define predefined clinical histories (callus, ingrown nail, etc.) to load when opening a session.",
      newTemplate: "New template",
      create: "Create",
      creating: "Creating…",
      category: "Category",
      inventoryName: "Material name",
      unit: "Unit",
      add: "Add",
      emptyInventory: "No materials registered",
      patientId: "Patient ID",
      referTo: "Refer to",
      reason: "Reason",
      registerReferral: "Register referral",
      emptyReferrals: "No referrals",
      nameRequired: "Enter a name for the template.",
      templateCreated: "Template created. Edit it to choose sections and content.",
      createFailed: "Could not create the template.",
      presetCreated: "Template “{name}” created.",
      templateUpdated: "Template updated.",
      saveFailed: "Could not save the template.",
      deleteConfirm: "Delete template “{name}”? This cannot be undone.",
      templateDeleted: "Template deleted.",
      deleteFailed: "Could not delete the template.",
      invalidQuantity: "Enter a valid quantity (0 or more).",
      defaultUnit: "unit",
      inventoryAdded: "Material registered.",
      genericError: "Error",
      referralAdded: "Referral registered.",
      namePlaceholder: "Name (e.g. Callus 1st toe)",
      scopeLabel: "Scope:",
      scopePersonal: "Only me",
      scopeClinic: "Clinic (all podiatrists)",
      clinicAdminHint: "As clinic administrator, templates are shared with the whole practice.",
      sectionsCount: "{count} sections",
      close: "Close",
      edit: "Edit",
      deleting: "Deleting…",
      delete: "Delete",
      nameLabel: "Name",
      shareWithClinic: "Share with the practice",
      saving: "Saving…",
      saveTemplate: "Save template",
      emptyTemplates: "No templates. Create an empty one or use the callus / ingrown nail shortcuts.",
      quantityPlaceholder: "Quantity",
      quantityAria: "Quantity",
      patientPrefix: "Patient:",
      scopeShared: "Clinic",
      scopePersonalShort: "Personal",
    },
    systemDiagnostics: {
      title: "System status",
      subtitle: "Check the worker, database, and public health URL; short guide when something fails.",
      sectionStatus: "Operational status",
      workerLabel: "API / Worker",
      databaseLabel: "Database (D1)",
      statusOk: "OK",
      statusError: "Error",
      latencyLabel: "Latency",
      environmentSection: "Environment (NODE_ENV)",
      checkedAtLabel: "Last check",
      refresh: "Refresh",
      loadError: "Could not load diagnostics.",
      publicHealthTitle: "External monitoring",
      publicHealthDesc:
        "Use this URL in uptime tools (checks that the worker responds only; does not query D1):",
      sessionHealthUrlLabel: "From this session (browser origin)",
      productionHealthUrlLabel: "Public URL for monitoring (domain set on the Worker)",
      productionHealthNote:
        "In development you will see localhost; that is expected. In production open the app with your real domain and this section will show that URL. To show the production URL here even while on localhost, set OFFICIAL_APP_DOMAIN or the first ALLOWED_ORIGINS entry in Cloudflare Worker variables. External monitors must target the production URL, not your PC.",
      sectionGuide: "When errors or outages occur",
      guideIntro: "To narrow down and report an issue:",
      guideItem1: "Note the approximate time, screen, and action you were performing.",
      guideItem2:
        "On API errors, the client surfaces requestId (JSON body or X-Request-Id header). Include it when reporting to match Cloudflare Worker logs.",
      guideItem3: "Review the audit log for recent user actions.",
      guideItem4: "In Cloudflare, check Worker metrics and logs for that time window.",
      correlationHint:
        "Error responses include requestId in the JSON body; X-Request-Id is set on JSON responses for correlation.",
    },
    roles: {
      superAdmin: "Super Admin",
      clinicAdmin: "Clinic Administrator",
      admin: "Support",
      podiatrist: "Podiatrist",
      receptionist: "Receptionist",
      superAdminDesc: "User management, credits, and system configuration",
      clinicAdminDesc: "Clinic podiatrists and patients management",
      adminDesc: "Credit adjustments and technical support",
      podiatristDesc: "Patient and clinical session management",
      receptionistDesc: "Create patients, appointments and manage calendar for assigned podiatrists",
      superAdminAssignWarning:
        "You are about to grant Super Admin access. This person will have full control of the system, users, and settings.",
      superAdminAssignConfirmPrompt: "Confirm this action to avoid accidental assignments.",
      superAdminAssignConfirmed: "Super Admin role confirmed.",
    },
    errors: {
      generic: "An error occurred",
      notFound: "Not found",
      unauthorized: "Unauthorized",
      validationError: "Validation error",
      requiredField: "This field is required",
      invalidEmail: "Invalid email",
      invalidPhone: "Invalid phone",
      saveFailed: "Save failed",
      loadFailed: "Load failed",
    },
    success: {
      saved: "Saved successfully",
      deleted: "Deleted successfully",
      created: "Created successfully",
      updated: "Updated successfully",
      exported: "Exported successfully",
    },
    branding: {
      tagline: "Comprehensive clinical management system for podiatry professionals",
      digital: "Digital",
      access: "Access",
      secure: "Secure",
    },
    notifications: {
      title: "Notifications",
      all: "All",
      unread: "Unread",
      read: "Read",
      markAsRead: "Mark as read",
      markAllAsRead: "Mark all as read",
      noNotifications: "No notifications",
      viewAll: "View all",
      delete: "Delete",
      reassignment: "Reassignment",
      appointment: "Appointment",
      credit: "Credits",
      system: "System",
      patientReassignedFrom: "Patient reassigned from you",
      patientReassignedTo: "Patient assigned to you",
      reassignedBy: "Reassigned by",
      reason: "Reason",
      agoMinutes: "{n} min ago",
      agoHours: "{n}h ago",
      agoDays: "{n} days ago",
      yesterday: "Yesterday",
      justNow: "Just now",
      adminMessage: "Admin Message",
      from: "From",
      to: "To",
      type: "Type",
      patient: "Patient",
      selectedCount: "{n} selected",
    },
    messaging: {
      title: "Messages",
      sendMessage: "Send message",
      newMessage: "New message",
      sentMessages: "Sent messages",
      recipient: "Recipient",
      recipients: "Recipients",
      allUsers: "All users",
      selectSpecific: "Select specific users",
      singleUser: "Single user",
      subject: "Subject",
      subjectPlaceholder: "Write the message subject...",
      messageBody: "Message content",
      messagePlaceholder: "Write your message here...",
      preview: "Preview",
      send: "Send",
      sending: "Sending...",
      sent: "Sent",
      sentAt: "Sent on",
      recipientsCount: "recipients",
      readCount: "read",
      unreadCount: "unread",
      noMessages: "No messages sent",
      selectRecipients: "Select recipients",
      messageSent: "Message sent successfully",
      messageRequired: "Message content is required",
      subjectRequired: "Subject is required",
      recipientRequired: "Select at least one recipient",
      fromAdmin: "Admin Message",
    },

    clinic: {
      title: "Clinic management",
      tabOverview: "Overview",
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
      podiatristsLimit: "Podiatrists: {current} of {limit} available on your plan",
      podiatristsNoLimit: "Clinic podiatrists. No limit defined.",
      podiatristsLimitCta: "Need more? Add additional podiatrists for $10 USD/mo in Subscription.",
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
      receptionistsActive: "Active: {active} (no limit). They must change the password on first sign-in.",
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
      emailTaken: "An account with this email already exists",
      createReceptionistError: "Error creating receptionist",
      saveAssignmentError: "Error saving assignment",
      createPodiatristError: "Error creating podiatrist",
      passwordMin8: "Password must be at least 8 characters",
    },
    auditLog: {
      title: "Audit log",
      actionLabels: {
        LOGIN_SUCCESS: "Sign in",
        LOGIN_FAILED: "Failed sign in",
        LOGOUT: "Sign out",
        PASSWORD_CHANGED: "Password changed",
        PASSWORD_RESET_REJECTED: "Password reset rejected",
        PASSWORD_RESET_APPROVED: "Password reset approved",
        PASSWORD_RESET_COMPLETED: "Password reset completed",
        PASSWORD_RESET_REQUESTED: "Password reset requested",
        CREATE: "Create",
        CREATE_USER: "User created",
        UPDATE: "Update",
        DELETE: "Delete",
        DELETE_USER: "User deleted",
        COMPLETE: "Completed",
        EXPORT: "Export",
        PRINT: "Print",
        UPDATE_DRAFT: "Draft updated",
        REASSIGN: "Reassign",
        TRANSFER: "Transfer",
        ADD_CREDITS: "Credits added",
        SUBTRACT_CREDITS: "Credits subtracted",
        ADMIN_CREDIT_ADJUSTMENT: "Credit adjustment (admin)",
        ALERT_MULTIPLE_PRINT_VIOLATIONS: "Alert: multiple prints",
        PRINT_VIOLATION_FORM: "Print attempt from form",
      },
      entityLabels: {
        authentication: "Authentication",
        session: "Session",
        patient: "Patient",
        prescription: "Prescription",
        reassignment: "Reassignment",
        credit: "Credits",
        user: "User",
        user_data: "User data",
        clinic: "Clinic",
        professional_info: "Professional info",
        professional_credentials: "Credentials",
        logo: "Logo",
        message: "Message",
        clinical_history: "Clinical history",
        receptionist: "Receptionist",
        registration_list: "Registration list",
        support_conversation: "Support conversation",
      },
      filters: {
        title: "Filters",
        clear: "Clear filters",
        search: "Search...",
        allActions: "All actions",
        allTypes: "All types",
        allUsers: "All users",
        from: "From",
        to: "To",
      },
      empty: {
        title: "No records",
        description: "No audit log records found with the selected filters",
      },
      totalRecords: "Total records",
      actionTypes: "Action types",
      entityTypes: "Entity types",
      activeUsers: "Active users",
      topUsers: "Most active users",
      recordsCount: "{n} records",
      ofTotal: "(of {total} total)",
      fullDetails: "Full details",
      userLinkedHint: "Each record is linked to the user who performed the action. The Log ID uniquely identifies this event.",
      userLabel: "User:",
      userIdLabel: "User ID:",
      logIdLabel: "Log ID:",
      resourceIdLabel: "Resource ID:",
      pageOf: "Page {current} of {total}",
      summaries: {
        loginSuccess: "Successful sign in",
        loginSuccessEmail: "Successful sign in: {email}",
        with2fa: "(2FA enabled)",
        without2fa: "(without 2FA)",
        logout: "Signed out.",
        passwordChanged: "Password changed by the user.",
        loginFailed: "Failed sign-in attempt.",
        loginFailedEmail: "Failed sign-in attempt: {email}",
        passwordResetRejected: "Password reset request rejected.",
        passwordResetApproved: "Password reset approved by an administrator.",
        passwordResetCompleted: "The user completed the password reset.",
        passwordResetRequested: "Password reset request sent.",
        patientPrefix: "Patient: {name}",
        userPrefix: "User: {name}",
        clinicPrefix: "Clinic: {name}",
      },
    },
    securityMetrics: {
      title: "Security metrics",
      subtitle: "Security metrics, active alerts and recent events",
      last24h: "Last 24 h",
      last7days: "Last 7 days",
      last30days: "Last 30 days",
      refresh: "Refresh",
      loadError: "Could not load metrics",
      criticalEvents: "Critical events",
      failedLogins: "Failed logins",
      unreadAlerts: "Unread alerts",
      summaryByType: "Summary by type",
      loading: "Loading...",
      noEventsInPeriod: "No events in the selected period.",
      activeAlerts: "Active alerts",
      noSystemAlerts: "No recent system alerts.",
      recentAccessGeo: "Recent access (geolocation)",
      date: "Date",
      event: "Event",
      userRole: "User / role",
      ip: "IP",
      location: "Location",
      noAccessYet: "No access recorded yet. Sign in to generate data.",
      loginOk: "Login OK",
      loginFailed: "Login failed",
      recentFailedLogins: "Recent failed logins",
      emailDetail: "Email / detail",
      noRecentRecords: "No recent records.",
      attemptNumber: "Attempt #{n}",
      metricLabels: {
        failed_login: "Failed logins",
        successful_login: "Successful logins",
        twoFaFailed: "2FA failed",
        captcha_failed: "CAPTCHA failed",
        suspicious_activity: "Suspicious activity",
      },
    },
    supportPage: {
      title: "Support",
      adminSubtitle: "User messages and registration lists for approval.",
      tabMessages: "Messages",
      tabLists: "Create lists",
      conversations: "Conversations",
      noConversations: "No conversations",
      selectConversation: "Select a conversation to view messages and reply.",
      supportAgent: "Support",
      registrationLists: "Registration lists",
      newList: "New list",
      newListNamePlaceholder: "New list name...",
      listsEmptyHint: "Create registration lists (courses, events) and submit them for the administrator to approve and import.",
      deleteList: "Delete",
      deleteListConfirm: "Are you sure you want to delete this list?",
      createListError: "Error creating the list",
      defaultListName: "New list",
      invalidEmail: "Enter a valid email address.",
      downloadCsv: "Download CSV",
      markPaidToExport: "Mark at least one entry as paid to export.",
      submitForApproval: "Submit for approval",
      addEntry: "Add entry",
      namePlaceholder: "Name",
      emailPlaceholder: "Email",
      roleIndependent: "Independent podiatrist",
      roleClinicAdmin: "Clinic admin",
      podiatristLimitLabel: "Podiatrist limit:",
      podiatristLimitPlaceholder: "E.g. 5",
      add: "Add",
      clinicAdminLimitHint: "Clinic podiatrists will be limited to this number. Receptionists do not count toward the limit.",
      noEntries: "No entries in this list.",
      paid: "Paid",
      unpaid: "Unpaid",
      pendingPayment: "Pending payment ({n})",
      paidSection: "Paid (exported to CSV) ({n})",
      selectOrCreateList: "Select a list or create a new one.",
      statusDraft: "Draft",
      statusPending: "Pending",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      limitPodiatrists: "Limit: {n} podiatrists",
    },
    sponsoredAnnouncements: {
      title: "Sponsored announcements",
      heading: "Announcements by state / province",
      subtitle: "Paid campaigns from external providers. All users in the area see a banner and notification.",
      newCampaign: "New campaign",
      formTitle: "New campaign",
      existingAdvertiser: "Existing advertiser",
      newAdvertiserOption: "— New advertiser —",
      advertiserName: "Advertiser name",
      advertiserNamePlaceholder: "E.g. Podiatry Institute",
      titlePlaceholder: "Announcement title",
      bodyPlaceholder: "Description (course, event, etc.)",
      countryPlaceholder: "Country (MX)",
      statePlaceholder: "State / province",
      audienceEstimate: "≈ {n} users in area",
      externalUrlPlaceholder: "Advertiser URL (their site)",
      promoCodePlaceholder: "Discount code on advertiser site (optional)",
      createDraft: "Create draft",
      campaigns: "Campaigns",
      loading: "Loading...",
      noCampaigns: "No campaigns yet.",
      advertiserCode: "Advertiser code:",
      activate: "Activate",
      pause: "Pause",
      createAdvertiserError: "Could not create advertiser",
      selectOrCreateAdvertiser: "Select or create an advertiser",
      createCampaignError: "Error creating campaign",
      statusError: "Error",
      statusActive: "active",
      statusDraft: "draft",
      statusPaused: "paused",
      defaultCta: "Learn more",
    },
    terms: {
      title: "Terms and Conditions",
      lastUpdated: "Last updated",
      lastUpdatedDate: "January 24, 2026",
      backToRegister: "Back to registration",
      acceptAndContinue: "Accept and Continue",
      back: "Back",
      section1: {
        title: "1. Acceptance of Terms",
        content: "By accessing and using PodoAdmin, you agree to comply with and be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our service.",
      },
      section2: {
        title: "2. Service Description",
        content: "PodoAdmin is a clinical management platform designed for podiatry professionals. The service includes patient management, clinical sessions, credits, and other functionalities related to the administration of a podiatric practice.",
      },
      section3: {
        title: "3. User Registration",
        intro: "To use PodoAdmin, you must:",
        item1: "Provide accurate, current, and complete information during registration",
        item2: "Maintain and update your account information",
        item3: "Maintain the confidentiality of your password",
        item4: "Notify us immediately of any unauthorized use of your account",
        item5: "Be responsible for all activities that occur under your account",
      },
      section4: {
        title: "4. Acceptable Use",
        intro: "You agree to:",
        item1: "Use the service only for legal and professional purposes",
        item2: "Not attempt to access restricted areas of the system",
        item3: "Not interfere with the service operation",
        item4: "Not transmit viruses, malware, or malicious code",
        item5: "Respect intellectual property rights",
        item6: "Maintain confidentiality of patient information",
      },
      section5: {
        title: "5. Privacy and Data Protection",
        content: "The handling of personal and patient data is governed by our Privacy Policy. You are responsible for complying with applicable laws in your country, including LFPDPPP (Mexico), LGPD (Brazil), Habeas Data (Colombia), Law 25.326 (Argentina), GDPR, and NOM-004-SSA3-2012 for clinical records in Mexico.",
      },
      section6: {
        title: "6. Credits and Billing",
        content: "The use of certain features may require credits. Credits may have validity periods and are subject to established billing policies. No refunds will be made for unused credits, except in exceptional cases determined at our discretion.",
      },
      section7: {
        title: "7. Intellectual Property",
        content: "All content, design, code, and functionalities of PodoAdmin are the property of their respective owners and are protected by intellectual property laws. Reproduction, distribution, or commercial use is not permitted without prior authorization.",
      },
      section8: {
        title: "8. Limitation of Liability",
        content: "PodoAdmin is provided \"as is\" without warranties of any kind. We do not guarantee that the service is free from errors, interruptions, or defects. We will not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the service.",
      },
      section9: {
        title: "9. Service Modifications",
        content: "We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without prior notice. We will not be liable to you or third parties for any modification, suspension, or discontinuation.",
      },
      section10: {
        title: "10. Termination",
        content: "We may terminate or suspend your access to the service immediately, without prior notice, for any reason, including but not limited to violation of these terms. Upon termination, your right to use the service will cease immediately.",
      },
      section11: {
        title: "11. Terms Modifications",
        content: "We reserve the right to modify these terms at any time. Modifications will take effect immediately after publication. Your continued use of the service after modifications constitutes your acceptance of the new terms.",
      },
      section12: {
        title: "12. Applicable Law",
        content: "These terms are governed by the laws of the country where PodoAdmin operates. Any dispute will be resolved in the competent courts of that jurisdiction.",
      },
      section13: {
        title: "13. Contact",
        content: "If you have questions about these Terms and Conditions, you can contact us through the support channels provided on the platform.",
      },
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated",
      backToRegister: "Back to registration",
      section1: {
        title: "1. Data controller",
        content:
          "PodoAdmin is the technology platform provider. The professional or clinic using the service is the data controller for patient health data under local law (LFPDPPP, LGPD, Habeas Data, GDPR, etc.).",
      },
      section2: {
        title: "2. Data we process",
        content:
          "Account data, patient clinical data, audit logs, medical record access logs, and technical metadata for security.",
      },
      section3: {
        title: "3. Purpose and legal basis",
        content:
          "Clinical podiatry management, legal retention of medical records (e.g. NOM-004 in Mexico), security, billing and support.",
      },
      section4: {
        title: "4. Retention",
        content:
          "Global conservative policy: clinical records up to 20 years from the last clinical act. Audit logs up to 10 years.",
      },
      section5: {
        title: "5. Data subject rights",
        intro: "You may exercise, under applicable law:",
        item1: "Access and portability: export your data from Settings.",
        item2: "Rectification: update your profile or request correction.",
        item3: "Erasure: request deletion when legally permitted.",
        item4: "Objection/limitation: contact support; clinical record retention duties may apply.",
      },
      section6: {
        title: "6. Security",
        content: "HTTPS, role-based access, audit logging, record access tracking, and secure authentication.",
      },
      section7: {
        title: "7. Transfers",
        content: "Data may be processed on cloud infrastructure. The controller must inform patients about international transfers when required.",
      },
      section8: {
        title: "8. Contact",
        content: "Use platform support or Settings → Privacy and data.",
      },
    },
    compliance: {
      title: "Privacy and data",
      subtitle: "ARCO, LGPD and GDPR rights for your account",
      exportTitle: "Export my data",
      exportDesc: "Download a JSON file with your profile, clinic, subscription and recent audit logs.",
      exportButton: "Download my data",
      deletionTitle: "Request account erasure",
      deletionDesc: "Submit a deletion request evaluated under LFPDPPP, LGPD, GDPR and clinical retention duties.",
      deletionButton: "Request erasure",
      deletionSuccess: "Request registered. Support will contact you if needed.",
      privacyLink: "View Privacy Policy",
      retentionTitle: "Retention policy",
      retentionNote: "Clinical records: up to 20 years from the last clinical act.",
      legalHoldTitle: "Legal holds",
      legalHoldDesc: "Prevents deletion of records under litigation, audit or authority request.",
      holdResourceType: "Resource type",
      holdResourceId: "Resource ID",
      holdReason: "Reason",
      holdCreate: "Create hold",
      holdCreated: "Legal hold created",
      holdRelease: "Release",
      holdsEmpty: "No active legal holds",
    },
    clinicalHistoriesExport: {
      title: "Download clinical histories",
      subtitle: "Export all your records as printable HTML → PDF",
      desc: "Generates an HTML file with the same layout as session print. No JSON download: open the HTML in your browser and save as PDF via Print.",
      stats: "{patients} patient(s) · {sessions} session(s) included",
      downloadHtml: "Download HTML",
      printPdf: "Print / save PDF",
      pdfHint: "In the browser print dialog choose «Save as PDF» as the destination.",
      popupBlocked: "Allow pop-ups to open the print preview.",
      noPatients: "There are no patients in your account to export.",
      buildError: "Could not generate the record HTML. Check the console or contact support.",
      downloadFailed: "Could not start the download. Try «Print / save PDF» or allow downloads from this site.",
      downloadStarted: "Download started: {filename}",
      openedInTab: "History opened in a new tab. Use Print → Save as PDF.",
      invalidResponse: "Server response did not include valid patient data.",
    },
    usersPage: {
      fields: {
        name: "Name",
        email: "Email",
        password: "Password",
        role: "Role",
        clinic: "Clinic",
        clinicOptional: "Clinic (optional)",
      },
      create: {
        title: "Create new user",
        passwordHint: "Minimum 8 characters.",
        clinicModeExisting: "Select existing clinic",
        clinicModeNew: "Create new clinic",
        clinicModeNone: "No clinic (independent)",
        newClinicHint: "A clinic will be created with provisional data. The admin will complete name, code, phone, address and the rest in Settings.",
        podiatristLimit: "Podiatrist limit (optional)",
        podiatristLimitPlaceholder: "E.g. 5",
        podiatristLimitHint: "Podiatrists in the clinic will be limited to this number. Receptionists do not count.",
        saving: "Creating...",
        success: "User created successfully.",
        partialClinicFail: "User created, but the clinic could not be created. Configure it later from user edit.",
        errors: {
          nameRequired: "Name is required.",
          emailInvalid: "Enter a valid email address.",
          passwordMin: "Password must be at least 8 characters.",
          clinicRequiredReceptionist: "Select a clinic for the receptionist.",
          clinicRequiredAdmin: "Select an existing clinic or choose to create a new one.",
          createFailed: "Could not create the user.",
        },
      },
      import: {
        title: "Import users (CSV)",
        description: "Required columns: name, email, password (or use the default password), role.",
        optionalColumnsSuperAdmin: " Optional: clinicMode (existing|new|none), clinicId (if existing), podiatrist_limit (clinic_admin only).",
        downloadTemplate: "Download template",
        selectFile: "Select file",
        defaultPassword: "Default password (if missing in CSV)",
        optionalPlaceholder: "Optional",
        readyCount: "{count} rows ready to import",
        andMore: "... and {count} more",
        resultsSummary: "Result: {ok} ok, {fail} with error",
        created: "✓ Created",
        importing: "Importing... ({done}/{total})",
        submit: "Import",
        templateFilename: "users_template.csv",
        errors: {
          needRows: "The file must have at least a header row and one data row.",
          missingColumns: "Missing required columns: name, email, password, role",
          readFile: "Error reading the file",
          invalidPassword: "Invalid password (min. 8 characters)",
          unknown: "Unknown error",
          connection: "Connection error",
        },
      },
      edit: {
        title: "Edit user",
        noClinic: "No clinic",
        errors: {
          updateFailed: "Could not update the user.",
        },
      },
      transfer: {
        title: "Transfer clinical history",
        subtitle: "Copy all patients and sessions from one user to another",
        successMessage: "Transfer completed: {patients} patients, {sessions} sessions.",
        error: "Error transferring data.",
        successTitle: "Success!",
        errorTitle: "Error",
        sourceUser: "Source user",
        targetUser: "Target user",
        selectUser: "— Select —",
        patientsCount: "{count} patients to transfer",
        warning: "Data will be copied to the target user. The source keeps their history. This action is not easily undone.",
        transferring: "Transferring...",
        submit: "Transfer",
      },
      profile: {
        loading: "Loading clinical data...",
        patients: "Patients",
        sessions: "Sessions",
        patientsHeading: "Patients ({count})",
        andMore: "...and {count} more",
      },
      status: {
        banned: "Banned",
        blocked: "Blocked",
        gracePeriod: "Grace period",
        disabled: "Disabled",
        pendingPayment: "Pending payment",
        active: "Active",
      },
      confirm: {
        block: "Block {name}? They will not be able to sign in until unblocked.",
        unblock: "Unblock {name}?",
        enable: "Enable account for {name}?",
        disable: "Disable account for {name}? They will not be able to sign in.",
        ban: "Ban {name}? This is a serious action.",
        unban: "Remove ban from {name}?",
        delete: "Delete {name}? This may be irreversible.",
        deletePermanent: "Permanently delete {name}? This cannot be undone.",
      },
      errors: {
        approve: "Error approving",
        reject: "Error rejecting",
        block: "Could not block the user.",
        unblock: "Could not unblock the user.",
        enable: "Could not enable the user.",
        disable: "Could not disable the user.",
        ban: "Could not ban the user.",
        unban: "Could not remove the ban.",
        delete: "Could not delete the user.",
      },
      actions: {
        importCsv: "Import CSV",
        createUser: "Create user",
        transferHistory: "Transfer history",
        approve: "Approve",
        reject: "Reject",
        view: "View",
        edit: "Edit",
        ban: "Ban",
        unban: "Unban",
        block: "Block",
        unblock: "Unblock",
        enableAccount: "Enable account",
        disableAccount: "Disable account",
        delete: "Delete",
        viewProfile: "View profile",
        downloadJson: "Download JSON",
        manageAccount: "Manage account",
      },
      table: {
        user: "User",
        email: "Email",
        role: "Role",
        status: "Status",
        clinic: "Clinic",
        limit: "Limit",
        data: "Data",
        actions: "Actions",
        sortBy: "Sort by",
        podiatristLimit: "Podiatrist limit",
        dataSummary: "{patients} patients · {sessions} sessions",
        currentPodiatrists: "Current: {count}",
        saveLimit: "Save",
        clinicMissing: "Clinic not found",
        effectiveLimitHint: "Real capacity applied (plan-included seats + extra seats, or the manual override if higher).",
        overCapacityHint: "This clinic has more active podiatrists than its current capacity (likely after a plan downgrade). It won't be able to add more until seats are freed or extra seats are purchased.",
        patients: "patients",
        sessions: "sessions",
      },
      passwordReset: {
        pendingTitle: "Password reset requests",
        approved: "Request approved.",
        approveError: "Could not approve the request.",
        rejectReasonPrompt: "Rejection reason (optional):",
        rejected: "Request rejected.",
        rejectError: "Could not reject the request.",
        approvedModalTitle: "Request approved",
        linkHint: "The link was emailed to the user. Here is the link so you can resend it personally (WhatsApp, etc.):",
        copied: "Link copied to clipboard.",
        copyFailed: "Could not copy. Select and copy the link manually.",
        copyLink: "Copy link",
      },
      regLists: {
        title: "Pending registration lists",
        hint: "Approve or reject lists submitted by support.",
        byCreator: "By {name}",
        downloadCsv: "CSV",
        createdCount: "{count} user(s) created.",
        approved: "List approved.",
        errorsPrefix: "Errors:",
      },
      cooldown: {
        notApplicable: "N/A",
        scopeClinic: "clinic",
        scopeProfessional: "professional",
        reasonPrompt: "Authorization reason (optional):",
        confirm: "Authorize early edit of {scope} for {name}?",
        applied: "Authorization applied.",
        error: "Could not apply authorization.",
      },
      export: {
        failed: "Could not export user data.",
      },
      menu: {
        unbanAccount: "Remove ban",
        banAccount: "Ban account",
        unblockAccount: "Unblock account",
        blockAccount: "Block account",
        enableAccount: "Enable account",
        disableAccount: "Disable account",
        authorizeCooldown: "Authorize edit (cooldown)",
        deleteAccount: "Delete account",
      },
      searchPlaceholder: "Search users...",
      allRoles: "All roles",
      loading: "Loading users...",
      empty: "No users found.",
      selectPlaceholder: "— Select —",
    },
  },
  
  pt: {
    clinicalLayout: clinicalSharedByLang.pt.clinicalLayout,
    podiatry: clinicalSharedByLang.pt.podiatry,
    errorBoundary: clinicalSharedByLang.pt.errorBoundary,
    clinicalList: clinicalSharedByLang.pt.clinicalList,
    patientsClinical: clinicalSharedByLang.pt.patientsClinical,
    sessionsClinical: clinicalSharedByLang.pt.sessionsClinical,
    clinicalToolsExtras: clinicalSharedByLang.pt.clinicalToolsExtras,
    calendarGrid: clinicalSharedByLang.pt.calendarGrid,
    common: {
      loading: "Carregando...",
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      edit: "Editar",
      create: "Criar",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      print: "Imprimir",
      back: "Voltar",
      next: "Próximo",
      previous: "Anterior",
      confirm: "Confirmar",
      close: "Fechar",
      yes: "Sim",
      no: "Não",
      actions: "Ações",
      status: "Status",
      date: "Data",
      time: "Hora",
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      address: "Endereço",
      notes: "Notas",
      description: "Descrição",
      details: "Detalhes",
      view: "Ver",
      download: "Baixar",
      showPassword: "Mostrar senha",
      hidePassword: "Ocultar senha",
      showShort: "Mostrar",
      hideShort: "Ocultar",
      captcha: "CAPTCHA",
      seeAll: "Ver todos",
      seeAllShort: "Ver tudo",
      viewMore: "Ver mais",
      go: "Ir",
    },
    auth: {
      login: "Entrar",
      logout: "Sair",
      welcome: "Bem-vindo",
      welcomeBack: "Bem-vindo de volta",
      enterCredentials: "Digite suas credenciais para acessar o sistema",
      emailLabel: "E-mail",
      emailPlaceholder: "email@exemplo.com",
      emailHint: "Será o seu utilizador de acesso. Enviaremos um e-mail para verificar a conta.",
      passwordLabel: "Senha",
      passwordPlaceholder: "••••••••",
      loginButton: "Entrar",
      loggingIn: "Entrando...",
      invalidCredentials: "Credenciais inválidas",
      loginError: "Erro ao entrar",
      tooManyAttempts: "Muitas tentativas",
      accountTemporarilyBlocked: "Conta temporariamente bloqueada",
      testCredentials: "Credenciais de teste",
      superAdmin: "Super Administrador",
      podiatrist: "Podólogo",
      loggedInAs: "Conectado como",
      sessionExpired: "Sua sessão expirou",
      // Registration
      register: "Registrar-se",
      registerTitle: "Crie sua conta",
      registerSubtitle: "Preencha o formulário para se registrar no PodoAdmin",
      nameLabel: "Nome completo",
      namePlaceholder: "João Silva",
      clinicCodeLabel: "Código da clínica (opcional)",
      clinicCodePlaceholder: "Ex. PREM",
      clinicCodeHint:
        "Deixe vazio se for podologista independente. Se a clínica lhe deu um código, escreva-o aqui para se associar.",
      passwordRequirements: "Requisitos de senha",
      passwordMinLength: "Mínimo 12 caracteres",
      passwordMustContain: "Deve conter:",
      passwordUppercase: "Pelo menos uma letra maiúscula",
      passwordLowercase: "Pelo menos uma letra minúscula",
      passwordNumber: "Pelo menos um número",
      passwordSpecial: "Pelo menos um caractere especial",
      termsAccept: "Aceito os termos e condições",
      termsLink: "Ver termos",
      privacyAccept: "Aceito a",
      privacyLink: "Política de Privacidade",
      registerButton: "Criar conta",
      registering: "Criando conta...",
      alreadyHaveAccount: "Já tem uma conta?",
      goToLogin: "Entrar",
      dontHaveAccount: "Não tem uma conta?",
      contactAdminForAccount: "Contacte o administrador para criar uma conta.",
      registrationSuccess: "Registro bem-sucedido!",
      registrationSuccessMessage: "Enviamos um email de verificação. Por favor, verifique sua caixa de entrada.",
      registrationSuccessDevMessage:
        "Conta criada em desenvolvimento. O email foi verificado automaticamente; já pode iniciar sessão.",
      checkEmail: "Verifique seu e-mail",
      emailAlreadyRegistered:
        "Este e-mail já está registrado. Inicie sessão com sua conta ou use outro e-mail.",
      // Email Verification
      verifyEmail: "Verificar e-mail",
      verifyEmailTitle: "Verifique seu e-mail",
      verifyEmailSubtitle: "Enviamos um link de verificação para seu e-mail",
      verifyEmailSuccess: "E-mail verificado",
      verifyEmailSuccessMessage: "Sua conta foi verificada com sucesso. Agora você pode fazer login.",
      verifyEmailError: "Erro ao verificar",
      verifyEmailExpired: "O link de verificação expirou",
      resendVerification: "Reenviar verificação",
      // CAPTCHA
      captchaRequired: "Por favor, complete o CAPTCHA",
      captchaError: "Erro ao verificar CAPTCHA",
      captchaNotConfigured:
        "Ambiente de desenvolvimento: o CAPTCHA não está configurado. O registo funciona sem verificação antibot.",
      captchaDisabledInDev:
        "Ambiente de desenvolvimento: CAPTCHA desativado automaticamente. Em produção será obrigatório.",
      // OAuth
      orContinueWith: "Ou continue com",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
      forgotPassword: "Esqueceu sua senha?",
      forgotPasswordTitle: "Recuperar senha",
      forgotPasswordSubtitle: "Digite seu e-mail. Um administrador ou suporte revisará sua solicitação e entrará em contato.",
      forgotPasswordButton: "Enviar solicitação",
      forgotPasswordSuccess: "Sua solicitação foi recebida. Um administrador ou suporte a revisará e entrará em contato quando o link de recuperação estiver disponível.",
      resetPasswordTitle: "Nova senha",
      resetPasswordSubtitle: "Escolha uma senha segura. O link expira em 1 hora.",
      newPasswordLabel: "Nova senha",
      resetPasswordButton: "Redefinir senha",
      resetPasswordSuccess: "Senha redefinida. Agora você pode entrar.",
      backToLogin: "Voltar ao login",
      forgotPasswordErrorRequest: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.",
      forgotPasswordErrorConnection: "Erro de conexão. Tente novamente.",
      resetPasswordInvalidLink: "Link inválido. Solicite um novo na tela de recuperação.",
      resetPasswordPasswordsMismatch: "As senhas não coincidem.",
      resetPasswordMissingToken: "Token ausente. Use o link que você recebeu por e-mail.",
      resetPasswordErrorReset: "Erro ao redefinir a senha",
      resetPasswordErrorConnection: "Erro de conexão. Tente novamente.",
      resetPasswordRedirecting: "Redirecionando para o login...",
      resetPasswordRepeatPassword: "Repetir senha",
      resetPasswordHint: "Mínimo 12 caracteres, maiúscula, minúscula, número e caractere especial.",
      changePasswordTitle: "Alterar senha",
      changePasswordSubtitle: "Sua senha temporária deve ser alterada. Escolha uma senha segura de sua preferência.",
      currentPasswordLabel: "Senha atual (temporária)",
      changePasswordButton: "Alterar senha",
      changePasswordSuccess: "Senha atualizada com sucesso.",
      changePasswordRedirecting: "Redirecionando para o painel...",
      contactToVerifyRecovery: "Entre em contato conosco para verificar que você é quem está recuperando a conta.",
      requestNewLink: "Solicitar novo link",
      securityLabel: "Segurança:",
      loginOnlyOnOfficialDomainWithDomain: "Inicie sessão apenas em {domain}. Não use esta senha em outros sites.",
      loginOnlyOnOfficialDomainGeneric: "Inicie sessão apenas no domínio oficial. Não use esta senha em outros sites.",
      notOnOfficialDomain: "Você não está no domínio oficial. O URL atual não corresponde a {domain}. Não introduza sua senha aqui.",
      notOnOfficialDomainNoDomain: "Você não está no domínio oficial. Não introduza sua senha aqui.",
      failedAttempts: "Tentativas falhadas:",
      blockedUntil: "Bloqueado até:",
      retryIn: "Pode tentar novamente em:",
      emailNotificationSent: "Foi enviada uma notificação por e-mail sobre estas tentativas.",
      googleNotConfigured: "Google não está configurado neste ambiente",
      googleConnectFailed: "Não foi possível conectar ao Google",
      googleNoCode: "Nenhum código do Google foi recebido",
      googleLoginError: "Erro ao iniciar sessão com Google",
      googleCompleting: "Concluindo o login com Google…",
      serverConnectionError: "Erro de conexão com o servidor",
      connectionErrorShort: "Erro de conexão",
      changePasswordCurrentRequired: "Informe sua senha atual.",
      changePasswordError: "Erro ao alterar a senha",
      verifyEmailMissingToken: "Nenhum token de verificação foi fornecido",
      verifyEmailFailed: "Erro ao verificar o e-mail",
      recoveryVerifySubject: "Verificação de identidade - Recuperação de senha",
    },
    nav: {
      dashboard: "Painel",
      patients: "Pacientes",
      clinicalSessions: "Sessões Clínicas",
      clinicalTools: "Ferramentas clínicas",
      credits: "Créditos",
      settings: "Configurações",
      users: "Usuários",
      auditLog: "Log de Auditoria",
      systemDiagnostics: "Estado do sistema",
      profile: "Perfil",
      clinicManagement: "Gestão da Clínica",
      whatsappMessages: "Mensagens WhatsApp",
      whatsappCampaigns: "Campanhas WhatsApp",
      calendar: "Calendário",
      securityMetrics: "Métricas de segurança",
      checkout: "Cobranças",
    },
    checkout: {
      title: "Saída de pacientes",
      receptionHint: "Pacientes que o podologista indicou prontos para cobrar.",
      podiatristHint: "Valores enviados à recepção. Acompanhe o status aqui.",
      adminHint: "Supervisão de cobranças pendentes e concluídas na clínica.",
      tabPending: "Pendentes",
      tabPaid: "Cobrados",
      allPodiatrists: "Todos os podologistas",
      emptyPending: "Não há cobranças pendentes.",
      emptyPaid: "Não há cobranças nesta aba.",
      markPaid: "Marcar como pago",
      confirmPaid: "Confirma que {patient} já pagou?",
      confirmPaidTitle: "Confirmar cobrança",
      paidAt: "Pago às",
      statusAwaiting: "Sem valor",
      statusReady: "Pronto para cobrar",
      statusPaid: "Pago",
      modalTitle: "Valor para recepção",
      modalSubtitle: "Paciente: {patient}",
      modalHint: "Indique quanto a recepção deve cobrar. Serão notificados na hora.",
      amountLabel: "Valor a cobrar",
      notesLabel: "Nota para recepção (opcional)",
      notesPlaceholder: "Ex. consulta + curativo",
      skipForNow: "Omitir por agora",
      sendToReception: "Enviar à recepção",
      invalidAmount: "Introduza um valor válido maior que zero.",
      saveFailed: "Não foi possível enviar o valor.",
      saving: "A enviar…",
      quickTariffs: "Tarifas rápidas",
      requestAmount: "Solicitar valor",
      requestAmountSent: "Pedido enviado",
      setAmount: "Indicar valor",
      tariffsTitle: "Tarifas rápidas de cobrança",
      tariffsHint: "Atalhos ao concluir sessão. O admin define tarifas da clínica; o podologista pode personalizar as suas.",
      saveTariffs: "Guardar tarifas",
      tariffsSaved: "Tarifas guardadas",
      addTariff: "Adicionar tarifa",
            tariffLabelPlaceholder: "Nome (ex. Consulta)",
      tariffAmountAria: "Valor",
      tariffDurationTitle: "Duração da pauta (minutos)",
      tariffDurationAria: "Duração em minutos",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Erro do servidor. Se acabou de atualizar o projeto, execute npm run db:migrate e reinicie npm run dev.",
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
      myPractice: "A minha consulta",
      podiatristFallback: "Podologista",
      assignedPodiatrist: "Podologista atribuído",
      podiatristLabel: "Podólogo",
      weekBucket: "S{n}",
      analytics: checkoutAnalyticsByLang.pt,
      agendaAnalytics: agendaAnalyticsByLang.pt,
    },
    dashboard: {
      title: "Painel",
      welcomeMessage: "Bem-vindo ao PodoAdmin",
      quickStats: "Estatísticas Rápidas",
      totalPatients: "Total de Pacientes",
      sessionsThisMonth: "Sessões Este Mês",
      creditsRemaining: "Créditos Restantes",
      recentActivity: "Atividade Recente",
      upcomingAppointments: "Próximas Consultas",
      noRecentActivity: "Sem atividade recente",
      patientFallback: "Paciente",
      sessionCompletedActivity: "Sessão concluída",
      draftActivity: "Rascunho",
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
    },
    patients: {
      title: "Pacientes",
      addPatient: "Adicionar Paciente",
      editPatient: "Editar Paciente",
      patientList: "Lista de Pacientes",
      patientDetails: "Detalhes do Paciente",
      searchPatients: "Buscar pacientes...",
      noPatients: "Nenhum paciente registrado",
      firstName: "Nome",
      lastName: "Sobrenome",
      dateOfBirth: "Data de Nascimento",
      gender: "Gênero",
      male: "Masculino",
      female: "Feminino",
      other: "Outro",
      idNumber: "CPF/RG",
      curp: "CURP (México)",
      curpHint: "Opcional. Identificação mexicana (NOM-004).",
      phone: "Telefone",
      email: "E-mail",
      address: "Endereço",
      city: "Cidade",
      postalCode: "CEP",
      medicalHistory: "Histórico Médico",
      allergies: "Alergias",
      medications: "Medicamentos",
      conditions: "Condições",
      consent: "Consentimento",
      consentGiven: "Consentimento dado",
      consentDate: "Data do consentimento",
      consentDocumentLink: "Ver documento de consentimento informado",
      consentLegalNotice: "As assinaturas digitais aqui não têm validade legal. É necessário que o paciente assine o documento impresso para validade jurídica.",
      clinicalHistory: "Histórico Clínico",
      viewHistory: "Ver Histórico",
      lastVisit: "Última Visita",
      totalSessions: "Total de Sessões",
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
      },
    },
    sessions: {
      title: "Sessões Clínicas",
      newSession: "Nova Sessão",
      editSession: "Editar Sessão",
      sessionList: "Lista de Sessões",
      sessionDetails: "Detalhes da Sessão",
      sessionDate: "Data da Sessão",
      clinicalNotes: "Notas Clínicas",
      anamnesis: "Anamnese",
      physicalExamination: "Exame Físico",
      diagnosis: "Diagnóstico Podológico",
      treatmentPlan: "Plano de Tratamento",
      images: "Imagens",
      uploadImages: "Enviar Imagens",
      maxImages: "Máximo 2 imagens",
      draft: "Rascunho",
      completed: "Concluída",
      complete: "Concluir",
      saveDraft: "Salvar Rascunho",
      selectPatient: "Selecionar Paciente",
      noSessions: "Nenhuma sessão registrada",
      startSession: "Iniciar Sessão",
      creditReserved: "Crédito reservado",
      sessionSaved: "Sessão salva",
      checkoutCompleteHint:
        "O cobro na receção só aparece ao tocar em Concluir (paciente a sair). Guardar rascunho apenas guarda sem fechar a consulta.",
      allStatuses: "Todas",
      loadingSessions: "Carregando sessões…",
      createFirstSession: "Crie sua primeira sessão clínica",
      
      reasons: {
        routine_checkup: "Revisão de rotina",
        treatment_continuation: "Continuação do tratamento",
        post_procedure_review: "Revisão pós-procedimento",
        new_symptoms: "Novos sintomas",
        follow_up: "Acompanhamento",
        other: "Outro",
      },
      appointmentReason: "Motivo da consulta",
      followUpInstructions: "Instruções de acompanhamento",
      followUpInstructionsPlaceholder: "Instruções para o paciente, medicação, cuidados...",
      unknownPatient: "Paciente desconhecido",
      podiatryExamTitle: "Exploração podológica",
      confirmApplyTemplate: "Aplicar este modelo? Os campos clínicos atuais (texto, exploração podológica e secções personalizadas) serão substituídos.",
      imageOnlyAllowed: "Só são permitidas imagens (JPEG, PNG, WebP).",
      imageReadError: "Não foi possível ler a imagem",
      imageProcessError: "Erro ao processar a imagem.",
      saveFailed: "Não foi possível guardar a sessão.",
      selectPatientAlert: "Selecione um paciente.",
      gracePeriodMessage: "A sua conta está em período de graça por excesso de pagamento. Durante 30 dias pode ver os seus dados, mas não criar novas sessões clínicas.",
      gracePeriodTitle: "Não pode criar novas sessões neste momento",
      saveError: "Ocorreu um erro ao guardar a sessão.",
      confirmDelete: "Eliminar esta sessão?",
      deleteFailed: "Não foi possível eliminar a sessão.",
      deleteError: "Ocorreu um erro ao eliminar a sessão.",
      exportOnlyPodiatrists: "Só os podólogos podem exportar histórias clínicas.",
      exportFailed: "Não foi possível exportar a história clínica",
      prescriptionRequireContent: "Escreva as indicações em «Prescrição / Indicações» ou em «Medicamentos / Tratamentos».",
      patientLoadFailed: "Não foi possível carregar os dados do paciente. Feche o formulário, abra a sessão novamente e tente outra vez.",
      noPhotos: "Não há fotos nesta sessão. Carregue-as ao criar ou editar o rascunho.",
      imageAlt: "Imagem {n}",
      folioLabel: "Folio:",
      medicationsLabel: "Medicamentos:",
      noPrescriptions: "Não há receitas para esta sessão",
      patientPrefix: "Paciente:",
      professionalFallback: "Profissional",
      userFallback: "Utilizador",
      printTitlePrefix: "Podólogo",
      weightPlaceholder: "Ex. 72.5",
      heightPlaceholder: "Ex. 165",
      anamnesisPlaceholder: "Motivo da consulta, antecedentes...",
      examPlaceholder: "Achados da exploração...",
      diagnosisPlaceholder: "Diagnóstico podológico...",
      treatmentPlaceholder: "Plano de tratamento...",
      notesPlaceholder: "Notas adicionais...",
      patientData: "Dados do paciente",
      idOrCurp: "Documento / CURP",
      age: "Idade",
      professionalData: "Dados do profissional",
      professional: "Profissional",
      professionalLicense: "Cédula profissional",
      licensePlaceholder: "Número da cédula",
      prescriptionIndications: "Prescrição / Indicações *",
      prescriptionIndicationsPlaceholder: "Descreva as indicações e recomendações para o paciente...",
      medicationsTreatments: "Medicamentos / Tratamentos",
      medicationsTreatmentsPlaceholder: "Liste os medicamentos ou tratamentos recomendados...",
      additionalNotes: "Notas adicionais",
      prescriptionMinContent: "Preencha pelo menos «Prescrição / Indicações» ou «Medicamentos / Tratamentos».",
      loadingPatients: "A carregar pacientes…",
      selectEllipsis: "Selecionar...",
      incompleteData: " (dados incompletos)",
      incompletePatientWarning: "Faltam dados obrigatórios do paciente (nome, apelido, data de nascimento, género, documento). Para menores use o documento do pai/tutor. Edite a ficha do paciente para poder guardar a sessão.",
      editPatientLink: "Editar paciente →",
      refreshPatientData: "Atualizar dados (se já editou o paciente)",
      vitalsHint: "Guarda-se nesta sessão e atualiza o expediente do paciente.",
      sessionTemplate: "Modelo de sessão",
      noTemplate: "Sem modelo",
      templateClinic: " (consultório)",
      templatePersonal: " (pessoal)",
      noTemplatesBefore: "Não há modelos. Crie-os em",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Ferramentas clínicas",
      templateApplyHint: "Ao escolher um modelo aplicam-se automaticamente o conteúdo e as secções visíveis (p. ex. sem helomas em procedimentos cirúrgicos).",
      templateFilteredView: "Vista filtrada pelo modelo: {n} secções visíveis. Escolha «Sem modelo» para ver o formulário completo.",
      templateNoSections: "Este modelo não tem secções definidas. Edite-o em Ferramentas clínicas, marque o que incluir e guarde novamente.",
      selectPatientTitle: "Selecione um paciente",
      completePatientDataTitle: "Complete os dados obrigatórios do paciente (nome, apelido, data de nascimento, género, documento)",
      completePatientDataHint: "Para guardar rascunho ou concluir a sessão, primeiro complete os dados do paciente e clique em «Atualizar dados» acima.",
      loadMoreSessions: "Carregar mais sessões",
      loadingMore: "A carregar…",
      reschedule: "Reagendar",
      rescheduleTitle: "Reagendar próxima consulta",
      daysOverdue: "{n} dias de atraso",
      scheduleAppointment: "Agendar consulta →",
      todayRel: "Hoje",
      tomorrowRel: "Amanhã",
      inDays: "Em {n} dias",
      exportJson: "Exportar JSON",
      yearsOld: "{n} anos",
      followUp: {
        overdueBanner: "Consultas atrasadas",
        upcomingBanner: "Próximas consultas (7 dias)",
        overdueChip: "Atrasada",
        upcomingChip: "Próxima",
        sectionTitle: "Acompanhamento",
        nextAppointment: "Próxima consulta",
        noSpecificReason: "Sem motivo específico",
      },
      prescriptions: {
        sectionTitle: "Receitas / Prescrições",
        newPrescription: "Nova receita",
        create: "Criar",
        creating: "Criando…",
      },
      vitals: {
        title: "Sinais vitais",
        weightKg: "Peso (kg)",
        heightCm: "Altura (cm)",
      },
    },
    calendar: {
      title: "Calendário",
      today: "Hoje",
      month: "Mês",
      week: "Semana",
      day: "Dia",
      newAppointment: "Nova Consulta",
      addAppointment: "Adicionar Consulta",
      allPodiatrists: "Todos os podologistas",
      dayMon: "Seg",
      dayTue: "Ter",
      dayWed: "Qua",
      dayThu: "Qui",
      dayFri: "Sex",
      daySat: "Sáb",
      daySun: "Dom",
      unknown: "Desconhecido",
      pendingPatient: "Paciente pendente",
      pendingShort: "Pendente",
      appointment: "Consulta",
      session: "Sessão",
      scheduled: "Consulta agendada",
      completed: "Concluída",
      draft: "Rascunho",
      noDiagnosis: "Sem diagnóstico",
      noNotes: "Sem notas",
      edit: "Editar",
      cancel: "Cancelar",
      more: "mais",
      events: "eventos",
      noEventsForDay: "Não há eventos para este dia",
      podiatristLabel: "Podologista:",
      minutes: "min",
      tel: "Tel:",
      confirmDeleteAppointment: "Remover esta consulta do registo? Será eliminada permanentemente.",
      upcomingAppointments: "Próximas consultas",
      upcomingSessions: "Próximas sessões (7 dias)",
      noUpcomingSessions: "Não há sessões próximas",
      legend: "Legenda",
      legendAppointment: "Consulta agendada",
      legendSessionCompleted: "Sessão concluída",
      legendSessionDraft: "Sessão rascunho",
      legendCancelled: "Cancelada",
      cancelledSlotHint: "Havia uma consulta cancelada neste horário. O horário está livre: pode agendar sem problema.",
      formTitleNew: "Nova Consulta",
      formTitleEdit: "Editar Consulta",
      patientLabel: "Paciente",
      patientPendingOption: "Paciente a registar",
      pendingPatientInfo: "Informação do paciente pendente:",
      nameRequired: "Nome *",
      phoneRequired: "Telefone *",
      namePlaceholder: "Nome completo do paciente",
      phonePlaceholder: "Telefone de contacto",
      podiatristRequired: "Podologista *",
      selectPodiatrist: "Selecionar podologista",
      dateRequired: "Data *",
      timeRequired: "Hora *",
      durationMinutes: "Duração (minutos)",
      duration15: "15 minutos",
      duration30: "30 minutos",
      duration45: "45 minutos",
      duration60: "1 hora",
      duration90: "1 hora 30 minutos",
      notesPlaceholder: "Motivo da consulta, comentários adicionais...",
      cancelAppointmentButton: "Cancelar Consulta",
      confirmCancelAppointment: "Cancelar esta consulta?",
      close: "Fechar",
      saveChanges: "Guardar Alterações",
      createAppointment: "Criar Consulta",
      creating: "A criar…",
      saving: "A guardar…",
      errorPendingPatientRequired: "Por favor, preencha o nome e telefone do paciente pendente.",
      errorOverlap: "Este horário sobrepõe-se a outra consulta desse podologista. Escolha outro dia, outra hora ou outro podologista (se for clínica).",
      errorUpdateFailed: "Não foi possível atualizar a consulta.",
      errorCreateFailed: "Não foi possível criar a consulta.",
      errorSaveFailed: "Erro ao guardar a consulta.",
      errorDeleteFailed: "Não foi possível eliminar a consulta.",
      downloadIcs: "Descarregar .ics",
      exportDateLabel: "Data a exportar",
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Descarrega as consultas agendadas do dia em .ics (só consultas com hora; não inclui sessões clínicas)",
      exportWaHint: "Descarrega o .ics e abre o WhatsApp. Se o podologista tiver telemóvel no perfil, abre o chat direto; senão escolhe o contacto manualmente. Anexe o .ics.",
      exportSelectPodiatrist: "Selecione um podologista no filtro para exportar a agenda.",
      exportNoAppointments: "Não há consultas agendadas neste dia.",
      exportBusy: "A exportar…",
      exportWaHeader: "📅 Agenda de {{fecha}} — {{podologo}} ({{count}} consultas)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 O ficheiro agenda-.ics foi descarregado — anexe-o no WhatsApp para importar no calendário do telemóvel.",
      exportWaInvalidPhone: "O telefone do podologista não é válido para WhatsApp. Abra o WhatsApp manualmente e cole a mensagem.",
      checkInWaiting: "Em espera",
      checkInInConsult: "Em consulta",
      checkInDone: "Atendido",
      checkInNone: "Sem check-in",
      scheduledMetric: "Agendadas",
      completedMetric: "Concluídas",
      noShow: "Não compareceu",
      waitlist: "Lista de espera",
      agendaDemandTitle: "Demanda da agenda",
      agendaDemandDemandTotal: "Demanda total: {n}",
      goToCheckoutAgendaLong: "Ver análise da agenda em cobranças",
      pendingBadge: "Pendente",
      confirmSaveAnyway: "Deseja salvar a consulta mesmo assim?",
      outsideHoursBlocked: "Fora do horário: a consulta não será salva. A recepção não pode agendar fora do horário permitido.",
      confirmMarkNoShow: "Marcar esta consulta como não comparecimento (no-show)?",
      markNoShow: "Não compareceu",
      noPhoneShort: "sem tel.",
      preferredDateShort: "pref. {date}",
      outsideHoursReceptionistNote: "A consulta não será salva: a recepção não pode agendar fora do horário.",
      outsideHoursContinueNote: "Você pode continuar; será pedida confirmação ao salvar.",
      icsExportTitle: "Exportar Calendário (.ics)",
      icsExportDescription: "O ficheiro .ics é um formato de calendário padrão que pode importar no Outlook, Google Calendar, Apple Calendar ou qualquer aplicação de calendário. Ao descarregar, o ficheiro é guardado no seu dispositivo.",
      icsExportLabel: "Selecione a data para exportar",
    },
    credits: {
      title: "Créditos",
      currentBalance: "Saldo Atual",
      monthlyCredits: "Créditos Mensais",
      extraCredits: "Créditos Extras",
      purchaseCredits: "Comprar Créditos",
      creditHistory: "Histórico de Créditos",
      consumption: "Consumo",
      purchase: "Compra",
      expiration: "Vencimento",
      expiresEndOfMonth: "Vence no fim do mês",
      neverExpires: "Não expira",
      reserved: "Reservados",
      used: "Utilizados",
      available: "Disponíveis",
      insufficientCredits: "Créditos insuficientes",
      creditPackages: "Pacotes de Créditos",
      buyNow: "Comprar Agora",
    },
    settings: {
      title: "Configurações",
      theme: "Tema",
      language: "Idioma",
      lightMode: "Modo Claro",
      darkMode: "Modo Escuro",
      accentColor: "Cor de Destaque",
      accentColorHint: "Digite uma cor hexadecimal",
      preview: "Prévia",
      saveSettings: "Salvar Configurações",
      settingsSaved: "Configurações salvas",
      general: "Geral",
      appearance: "Aparência",
      notifications: "Notificações",
      security: "Segurança",
      paletteHint: "Personalize as cores de cada área da interface. Paletas distintas para modo claro e escuro.",
      paletteGroupBrand: "Marca e interface",
      paletteGroupSemantic: "Estados semânticos",
      paletteGroupWhatsapp: "WhatsApp Web",
      changeColor: "Alterar",
      resetPaletteMode: "Restaurar este modo",
      resetPaletteAll: "Restaurar tudo",
      palettePreviewBrand: "Prévia — interface",
      palettePreviewSemantic: "Prévia — estados semânticos",
      palettePreviewWhatsapp: "Prévia — WhatsApp Web",
      palettePreviewMessages: {
        error: "Não foi possível salvar o registro.",
        warning: "Revise os dados antes de continuar.",
        success: "Alterações salvas com sucesso.",
        info: "A sessão expira em 5 minutos.",
      },
            palettePreviewLabels: {
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
      navMenuTitle: "Menu lateral",
      navMenuHint: "Escolha quais seções aparecem no menu de navegação. As alterações aplicam-se instantaneamente neste dispositivo.",
      navMenuMinOne: "Pelo menos uma seção deve permanecer visível no menu.",
      navMenuReset: "Mostrar todas",
      paletteTokens: {
        sidebar: "Barra lateral",
        primary: "Cor primária",
        primaryHover: "Hover primário",
        canvas: "Fundo geral",
        surface: "Cartões e painéis",
        muted: "Texto secundário",
        border: "Bordas",
        error: "Erro (texto)",
        errorBg: "Erro (fundo)",
        warning: "Aviso (texto)",
        warningBg: "Aviso (fundo)",
        success: "Sucesso (texto)",
        successBg: "Sucesso (fundo)",
        info: "Info (texto)",
        infoBg: "Info (fundo)",
        whatsapp: "Botão WhatsApp",
        whatsappBg: "Painel (fundo)",
        whatsappBorder: "Painel (borda)",
        whatsappMuted: "Painel (texto secundário)",
      },
      tabs: {
        profile: "Perfil",
        clinicalHistory: "História clínica",
        integrations: "Integrações",
        clinic: "Clínica",
        billing: "Subscrição",
      },
      settingsScope: {
        appliesClinic: "Aplica-se a toda a clínica.",
        appliesIndependent: "Aplica-se ao seu consultório independente.",
        appliesPractice: "Aplica-se ao seu consultório.",
      },
      watermark: {
        title: "Marca de água do fundo",
        hint: "Imagem subtil na área principal. Ajuste tamanho, posição e intensidade.",
        show: "Mostrar marca de água no fundo",
        customImage: "Imagem personalizada",
        useProfessionalLogo: "Usar logótipo profissional",
        logoHint: "Se escolher o logótipo profissional ou da clínica, usa-se o configurado nesta página.",
        loading: "A carregar marca de água…",
        imageTooLarge: "A imagem não pode ultrapassar 2 MB.",
        invalidFormat: "Formato inválido. Use PNG, JPG ou WebP (máx. 2 MB).",
        loadImageError: "Erro ao carregar imagem.",
        saved: "Marca de água guardada.",
        saveFailed: "Erro ao guardar.",
        imageLabel: "Imagem",
        noLogo: "Sem logótipo configurado",
        noImage: "Sem imagem",
        upload: "Carregar imagem",
        formatHint: "JPEG, PNG or WebP · max. 2 MB",
        removeImage: "Remover imagem",
        intensity: "Intensidade ({pct}%)",
        intensityHint: "6–10% usually looks good as a subtle watermark.",
        size: "Tamanho ({pct}% do painel)",
        zoom: "Zoom ({pct}%)",
        zoomHint: "Increase zoom (200%+) to cover the visible area. Combine with centered position.",
        positionX: "Posição horizontal ({pct}%)",
        positionY: "Posição vertical ({pct}%)",
        left: "Esquerda",
        center: "Centro",
        right: "Direita",
        top: "Cima",
        bottom: "Baixo",
        saving: "A guardar…",
        save: "Guardar marca de água",
      },
      billing: {
        title: "Subscrição",
        subscriptionTitle: "Assinatura PodoAdmin",
        independentPlan: "Plano podólogo independente",
        status: "Estado",
        trialPeriod: "Período de teste",
        trialEnd: "Fim do período de teste",
        trialActive: "Período de teste de 1 mês ativo. Desfrute do acesso completo até {date}",
        adminNoSub: "Os administradores da plataforma não necessitam de assinatura.",
        receptionistHint: "A assinatura da clínica é gerida pelo administrador da clínica.",
        statusActive: "Ativa",
        statusPastDue: "Pagamento pendente",
        statusCancelled: "Cancelada",
        paymentReceived: "Pagamento recebido. A assinatura será ativada em alguns segundos.",
        paymentCancelled: "Pagamento cancelado. Pode tentar novamente quando quiser.",
        cardVerified: "Cartão verificado corretamente.",
        cardVerifyError: "Erro ao verificar o cartão.",
        cardMockVerified: "Cartão mock verificado (apenas desenvolvimento).",
        cardSetupError: "Não foi possível iniciar a verificação do cartão.",
        trialActivated: "Período de teste ativado.",
        trialActivateError: "Não foi possível ativar o teste.",
        checkoutError: "Não foi possível iniciar o pagamento.",
        portalError: "Não foi possível abrir o portal de faturação.",
        activateTrialTitle: "Ativar teste gratuito (1 mês)",
        activateTrialHint: "Verifique o seu e-mail e cartão. Uma conta, um cartão e uma ligação (IP) só podem ser usados uma vez para o teste.",
        stepEmail: "1. E-mail verificado",
        emailVerifyHint: "Verifique a sua caixa de entrada{email} e confirme o link de verificação. Se não o recebeu, termine sessão e solicite-o novamente ao registar-se.",
        stepCard: "2. Cartão",
        verifyCard: "Verificar cartão (sem cobrança hoje)",
        activateMonthTrial: "Ativar teste de 1 mês",
        overLimit: "A sua clínica tem {count} podólogos ativos, acima dos {limit} incluídos, e a cobrança de adicionais não está configurada. Contacte o PodoAdmin.",
        overCapacityAfterDowngrade: "Tem {count} podólogos ativos, mais do que os {limit} que o seu plano atual permite. Continuam a funcionar normalmente, mas não poderá adicionar nenhum novo até comprar assentos adicionais ou reduzir a sua equipa.",
        loading: "A carregar…",
        clinicPlan: "Plano clínica",
        activePodiatrists: "Podólogos ativos:",
        stripeNotConfigured: "O Stripe não está configurado. Defina STRIPE_PRICE_CLINIC_MONTHLY_STANDARD e STRIPE_PRICE_INDEPENDENT_MONTHLY no servidor.",
        subscribe: "Subscrever — ${amount} USD/mês",
        manageStripe: "Gerir faturação no Stripe",
        clinicManagedByAdmin: "A assinatura da sua clínica é gerida pelo administrador da clínica.",
        extraSeatsTitle: "Podólogos adicionais",
        extraSeatsHint: "O seu plano inclui {included} podólogos. Adicione os que precisar por ${price} USD/mês cada um; a alteração é rateada na sua fatura.",
        extraSeatsLabel: "Podólogos adicionais",
        extraSeatsSave: "Atualizar podólogos adicionais",
        extraSeatsSaved: "Podólogos adicionais atualizados.",
        extraSeatsTotal: "Adicionais: {seats} × ${price} = ${total} USD/mês",
        extraSeatsError: "Não foi possível atualizar os podólogos adicionais.",
        extraSeatsBreakdown: "{included} incluídos no seu plano + {seats} adicionais",
        extraSeatsTrialNote: "Durante o período de avaliação pode ajustar os seus lugares sem custo. Ao ativar a subscrição serão cobrados ${price} USD/mês por cada podólogo adicional.",
        extraSeatsTrialSaved: "Lugares de podólogos atualizados. Já pode adicionar mais podólogos à sua clínica.",
        growthTitle: "A sua consulta está a crescer?",
        growthHint: "Suba para Premium para desbloquear analíticas, ferramentas clínicas avançadas e campanhas de WhatsApp, ou mude para um plano Clínica para somar podólogos e receção.",
        growthClinicBullet: "Plano Clínica: desde $100 USD/mês com 5 podólogos incluídos (8 no Premium) e podólogos adicionais por $10 USD/mês.",
        growthContact: "Quero mudar para o plano Clínica",
      },
      dashboardLogo: {
        title: "Logótipo no painel",
        loading: "A carregar opções do dashboard…",
        saved: "Configuração do logótipo no dashboard guardada.",
        saveFailed: "Erro ao guardar.",
        enabledByAdmin: "O administrador da clínica ativou a visualização do logótipo no dashboard.",
        notShown: "O logótipo não é mostrado no dashboard.",
        hint: "Cartão no ecrã principal. Ajuste tamanho, posição e intensidade.",
        show: "Mostrar logótipo no dashboard",
        opacity: "Opacidade ({pct}%)",
        size: "Tamanho ({pct}% da área do cartão)",
        zoom: "Zoom ({pct}%)",
        zoomHint: "Enlarge or reduce the logo within the area. The card grows to avoid cropping.",
        positionX: "Posição horizontal ({pct}%)",
        positionY: "Posição vertical ({pct}%)",
        left: "Esquerda",
        center: "Centro",
        right: "Direita",
        top: "Cima",
        bottom: "Baixo",
        saving: "A guardar…",
        save: "Guardar logótipo no dashboard",
      },
            clinicalLayout: {
        loadingDesigner: "A carregar o designer…",
        title: "Designer de história clínica",
        hint: "Ative ou desative blocos para sessões e impressão. Adicione secções personalizadas conforme o seu fluxo clínico.",
        restoreDefault: "Restaurar predefinido",
        saveDesign: "Guardar design",
        addSection: "Adicionar secção",
        editSection: "Editar secção",
        previewForm: "Pré-visualização — formulário de sessão",
        newSectionDefault: "Nova secção",
        itemN: "Item {n}",
        columnN: "Coluna {n}",
        saved: "Design guardado corretamente.",
        saveFailed: "Erro ao guardar.",
        restoreConfirm: "Restaurar todas as secções ao design predefinido? As personalizadas serão perdidas.",
        saving: "A guardar…",
        readOnlyHint: "Só leitura: o administrador da clínica configura o design partilhado.",
        sectionsCount: "Secções ({count})",
        sectionTitlePlaceholder: "Título da secção",
        titleLabel: "Título",
        builtinTitleHint: "Pode personalizar o título visível na sessão e na impressão.",
        onPatientCard: "Na ficha do paciente",
        enabled: "Ativa",
        inSession: "Na sessão",
        inPrint: "Na impressão",
        patientCardHelp: "shows or hides the field when creating, editing or viewing a patient.",
        printAntecedentsHelp: "includes antecedents in the printed podiatric clinical history.",
        enabledHelp: "includes or excludes the section from the clinical flow.",
        inSessionHelp: "visible when creating or editing a session.",
        inPrintHelp: "included in the printable history (only sections with data).",
        deleteCustomSection: "Eliminar secção personalizada",
        selectSection: "Selecione uma secção da lista",
        systemField: "Campo do sistema",
        noSessionSections: "Nenhuma secção visível na sessão.",
        remove: "Remover",
        maxColumns: "Máximo {count} colunas.",
        checklistItems: "Itens do checklist",
        yesNoNaRows: "Linhas SIM / NÃO / N/D",
        options: "Opções",
        yesNoNaHint: "Each row will be a question in the session.",
        addItem: "+ Adicionar item",
        addRow: "+ Adicionar linha",
        addOption: "+ Adicionar opção",
        unit: "Unidade",
        unitPlaceholder: "min, ml, mm, %…",
        defaultUnit: "unidade",
        scaleMax: "Escala máxima",
        conditionalPrompt: "Pergunta SIM/NÃO",
        conditionalPlaceholder: "Was there a complication?",
        tableColumns: "Colunas da tabela",
        tableColumnsHint: "Name each column (e.g. product, quantity, lot).",
        addColumn: "+ Adicionar coluna",
        tableRows: "Linhas na sessão",
      },
      print: {
        title: "Configuração de impressões",
        hint: "Ajuste como se veem a história clínica e as receitas ao imprimir ou guardar como PDF.",
        preview: "Pré-visualização",
        loading: "A carregar preferências de impressão…",
        saved: "Preferências de impressão guardadas.",
        saveFailed: "Não foi possível guardar.",
        readOnlyHint: "Só o administrador da clínica pode alterar estas opções. Mostradas em modo de leitura.",
        generalTitle: "Geral",
        generalDesc: "Aplica-se a ambos os documentos.",
        headerAlign: "Alinhamento do cabeçalho",
        alignLeft: "Esquerda",
        alignCenter: "Centrada",
        monochrome: "Imprimir a preto e branco",
        monochromeHint: "Escala de cinzentos, ideal para poupar tinta.",
        showGeneratedBy: "Mostrar \"Gerado por PodoAdmin\" no rodapé",
        footerText: "Texto de rodapé personalizado",
        footerPlaceholder: "Ex. Horário de atendimento, aviso legal, redes sociais…",
        historyTitle: "História clínica",
        historyDesc: "Documento completo do paciente.",
        showLogo: "Mostrar logótipo no cabeçalho",
        showLegalData: "Mostrar dados legais",
        showLegalDataHint: "RFC, CLUES, COFEPRIS and sanitary registry.",
        includePhotos: "Incluir fotografias clínicas",
        includePhotosHint: "Requer que o bloco de imagens esteja ativo no designer.",
        compact: "Design compacto",
        compactHistoryHint: "Smaller margins, type and diagrams to save pages.",
        orientation: "Orientação da página",
        portrait: "Vertical",
        landscape: "Horizontal",
        orientationHistoryHint: "Recomendado: vertical para histórias clínicas.",
        evolutionRows: "Linhas de evolução clínica a imprimir",
        rxTitle: "Receitas",
        rxDesc: "Formato das receitas / prescrições.",
        showWeight: "Mostrar peso do paciente",
        showHeight: "Mostrar altura do paciente",
        showNextVisit: "Mostrar próxima visita",
        showNotes: "Mostrar notas adicionais",
        showSignatureCedula: "Mostrar cédula/registo na assinatura",
        compactRxHint: "Smaller margins and type to use less space.",
        orientationRxHint: "Recomendado: horizontal para receitas.",
        folioPosition: "Posição do folio",
        folioInline: "No cabeçalho (recomendado)",
        folioBar: "Barra destacada",
        folioHint: "Inline folio saves a full line and usually fits on one page.",
        saving: "A guardar…",
        save: "Guardar preferências",
        reset: "Repor valores predefinidos",
        previewSimHint: "Approximate simulation; the final document uses real patient data.",
        tabHistory: "História clínica",
        tabRx: "Receita",
        statusMonochrome: "Black and white mode on · ",
        statusHeaderCenter: "Centered header",
        statusHeaderLeft: "Left-aligned header",
        statusEvolutionRows: " · {count} evolution rows",
        statusCompact: " · compact layout",
        statusFolioInline: " · folio in header",
        demoClinicName: "Clínica Podológica Demo",
        demoLicense: "License: 12345678",
        demoLegal: "RFC: XAXX010101000 · CLUES: DFSSA000001",
        demoContact: "555 123 4567 · demo@clinic.com",
        demoHistoryTitle: "PODIATRIC CLINICAL HISTORY · Folio: PREMIUM-001",
        demoPatientSection: "I. Patient data",
        demoPatientCells: ["Name: Laura M.", "ID: INE-884422", "Tel: 555…", "DOB: 12/03/1985"],
        demoEvolutionSection: "IV. Clinical evolution",
        demoColDate: "Date",
        demoColDiagnosis: "Diagnosis",
        demoColTreatment: "Treatment",
        demoDiagnosis: "Onychocryptosis",
        demoTreatment: "Debridement",
        demoMoreRows: "+ {count} more rows…",
        demoPhotos: "Photographs",
        demoFooter: "PodoAdmin · preview",
        demoDoctor: "Dr. Podólogo Demo",
        demoCedula: "License: 12345678",
        demoTel: "Tel: 555 123 4567",
        demoFolio: "Folio:",
        demoFolioBar: "RX FOLIO:",
        demoPatientData: "PATIENT DATA",
        demoName: "Name: Laura M.",
        demoDni: "ID: INE-884422",
        demoAge: "Age: 41 years",
        demoWeight: "Weight: 72.5 kg",
        demoHeight: "Height: 165 cm",
        demoPrescription: "Prescription / Instructions",
        demoPrescriptionBody: "Apply antifungal cream twice daily for 14 days.",
        demoNextVisit: "Next visit",
        demoNextVisitDate: "Friday, August 15, 2026",
        demoNotes: "Additional notes",
        demoNotesBody: "Avoid closed footwear.",
        demoSignature: "Professional signature",
        logoPlaceholder: "LOGO",
      },
      profileAvatar: {
        changeTitle: "Alterar foto de perfil",
        invalidFormat: "Formato inválido. Use PNG, JPG ou WebP.",
        tooLarge: "A imagem não pode ultrapassar 2 MB.",
        saveFailed: "Não foi possível guardar a foto.",
        processFailed: "Não foi possível processar a imagem.",
        removeFailed: "Não foi possível remover a foto.",
        saving: "A guardar…",
        changePhoto: "Alterar foto",
        uploadPhoto: "Carregar foto",
        removePhoto: "Remover foto",
        hint: "JPG, PNG ou WebP. Máx. 2 MB. Mostrada no menu lateral.",
      },
      profile: {
        title: "Perfil do usuário",
        name: "Nome",
        email: "Email",
        readOnlyHint: "Os dados do perfil não podem ser editados aqui. Contate o administrador se precisar de alterações.",
      },
      cooldown: {
        logoPolicy: "Após guardar, o logo fica bloqueado por 15 dias. Depois desse período poderá carregá-lo ou alterá-lo novamente.",
        logoBlocked: "O logo só pode ser alterado a cada 15 dias.",
        clinicInfoPolicy: "Após guardar, os dados da clínica ficam bloqueados por 15 dias. Depois desse período poderá modificá-los novamente.",
        clinicInfoBlocked: "Os dados só podem ser alterados a cada 15 dias.",
        professionalInfoPolicy: "Após guardar, estes dados ficam bloqueados por 15 dias. Depois desse período poderá modificá-los novamente.",
        professionalInfoBlocked: "Os dados só podem ser alterados a cada 15 dias.",
        profilePolicy: "Nome e e-mail só podem ser alterados por um administrador. Devem decorrer 15 dias entre alterações.",
        clinicReadOnlyPolicy: "As informações da clínica são geridas pelo administrador. Devem decorrer 15 dias entre alterações.",
        genericBlocked: "Os dados só podem ser alterados a cada 15 dias.",
      },
      clinic: {
        fallbackName: "Clínica {id}",
        errors: {
          nameCodeRequired: "Nome e código da clínica são obrigatórios.",
          invalidWebsite: "A URL do site não é válida. Verifique se está corretamente configurada.",
        },
      },
      consent: {
        title: "Consentimento informado",
        sharedTitle: "Texto partilhado da clínica",
        sharedBody: "Este texto é gerido pelo administrador da clínica e usado no consentimento dos pacientes.",
        currentVersion: "Versão atual: {version}",
        empty: "Sem texto configurado.",
        editHint: "Pode editar o texto; cada gravação incrementa a versão.",
        placeholder: "Redija aqui os termos e o consentimento informado que o paciente deve aceitar.",
        save: "Guardar consentimento",
        saveError: "Erro ao guardar o consentimento.",
      },
      logo: {
        empty: "Sem logo",
        previewAlt: "Pré-visualização",
        upload: "Carregar imagem",
        formatHint: "PNG, JPG ou WebP · máx. 2MB",
        save: "Guardar logo",
        remove: "Remover logo",
        errors: {
          invalidFormat: "Formato inválido. Use PNG, JPG ou WebP (máx. 2MB).",
          tooLarge: "O ficheiro é demasiado grande. Máximo 2MB.",
          processFailed: "Não foi possível processar a imagem.",
          cooldown: "O logo só pode ser alterado a cada 15 dias.",
          saveFailed: "Não foi possível guardar o logo. Tente novamente.",
        },
      },
      clinicLogo: {
        title: "Logo da clínica",
        sharedTitle: "Logo partilhado da clínica",
        sharedBody: "Todos os profissionais da clínica veem este logo em documentos e impressões.",
        alt: "Logo da clínica",
        uploadHint: "Carregue o logo que identifica a sua clínica na aplicação e documentos.",
      },
      professionalLogo: {
        title: "Logo profissional",
        uploadHint: "Logo pessoal para documentos e impressão quando não há logo de clínica.",
        alt: "Logo profissional",
      },
      adminLogo: {
        title: "Logo da clínica",
        body: "Os logos das clínicas são geridos pelos administradores de cada clínica. Como {role}, não precisa de um logo pessoal.",
      },
      assignedPodiatrists: {
        title: "Podólogos atribuídos",
        clinicHint: "Podólogos da sua clínica a quem pode prestar serviço. Marque ou desmarque para gerir consultas e pacientes de cada um.",
        independentHint: "Podólogo que o atribuiu. Pode criar pacientes e gerir o calendário deles.",
        emptyClinic: "Não há podólogos na sua clínica.",
        save: "Guardar atribuição",
        empty: "Sem podólogo atribuído.",
      },
      receptionist: {
        title: "Recepcionista",
        description: "Crie e gira a recepcionista vinculada à sua conta ou clínica.",
        status: {
          blocked: "Bloqueada",
          disabled: "Desabilitada",
          active: "Ativa",
        },
        unblock: "Desbloquear",
        block: "Bloquear",
        enable: "Habilitar",
        disable: "Desabilitar",
        delete: "Eliminar",
        oneOnlyHint: "Só pode ter uma recepcionista vinculada. Elimine-a para criar outra.",
        fields: {
          name: "Nome",
          email: "Email",
          initialPassword: "Senha inicial",
        },
        createdSuccess: "Recepcionista criada com sucesso.",
        create: "Criar recepcionista",
        createError: "Erro ao criar recepcionista",
        confirmDelete: "Eliminar esta recepcionista? Esta ação não pode ser desfeita.",
      },
      clinicInfo: {
        title: "Informação da clínica",
        subtitle: "Dados de contacto e fiscais da sua clínica.",
        setupBanner: "Complete os dados da sua clínica. Enquanto o nome for provisório ou faltarem contacto e morada, aparecerão avisos.",
        clinicName: "Nome da clínica *",
        clinicNamePlaceholder: "A Minha Clínica Podológica",
        clinicCode: "Código (para folhas) *",
        clinicCodePlaceholder: "MICP",
        clinicCodeHint: "Máx. 8 caracteres. Usado em folhas (ex: MICP-2025-001)",
        country: "País (prefixo telefónico)",
        countryHint: "Prefixo predefinido para telefones da clínica.",
        phone: "Telefone",
        email: "Email",
        emailPlaceholder: "clinica@exemplo.com",
        address: "Morada",
        addressPlaceholder: "Rua Principal 45, 2º Esq.",
        city: "Cidade",
        cityPlaceholder: "Lisboa",
        postalCode: "Código postal",
        postalCodePlaceholder: "1000-001",
        mapsUrl: "Link do Google Maps (opcional)",
        mapsUrlPlaceholder: "https://maps.app.goo.gl/...",
        mapsUrlHint: "Usado como localização no WhatsApp quando a morada não basta para gerar um link útil.",
        licenseNumber: "Nº licença/registo",
        licensePlaceholder: "CS-28/2024-POD-001",
        website: "Site (opcional)",
        websitePlaceholder: "https://www.minhaclinica.com",
        legalName: "Razão social (NOM)",
        rfc: "RFC",
        clues: "CLUES",
        cofepris: "Registo COFEPRIS",
        readOnlyTitle: "Detalhes da sua clínica",
        readOnlyBody: "Só leitura. O administrador da clínica gere estes dados.",
        labels: {
          name: "Nome:",
          phone: "Telefone:",
          email: "Email:",
          address: "Morada:",
          maps: "Maps:",
          license: "Licença:",
          consent: "Consentimento:",
          web: "Web:",
        },
        viewDocument: "Ver documento",
      },
      practice: {
        title: "Informação do consultório",
        subtitle: "Dados da sua prática profissional independente.",
        professionalName: "Nome profissional",
        namePlaceholder: "Dr. João Silva",
        country: "País (prefixo telefónico)",
        countryHint: "Prefixo predefinido para o seu consultório.",
        emailPlaceholder: "consulta@exemplo.com",
        sanitaryRegistry: "Registo sanitário",
        cedula: "Cédula profissional",
        cedulaPlaceholder: "12345678",
      },
      credentials: {
        title: "Credenciais profissionais",
        subtitle: "Telefone de contacto e número de registo profissional.",
        contactPhoneTitle: "Telefone de contacto",
        contactPhoneHint: "Visível para pacientes e em documentos quando aplicável.",
        country: "País",
        mobile: "Telemóvel",
        savePhone: "Guardar telefone",
        registryNumber: "Nº de registo profissional",
        registryPlaceholder: "REG-2024-001",
        save: "Guardar credenciais",
        clinicInfoTitle: "Informação da clínica",
        clinicInfoBody: "Como membro de uma clínica, estes dados são geridos pelo administrador.",
        clinicName: "Nome da clínica",
      },
      common: {
        saved: "Guardado",
        readOnly: "Só leitura",
        saveInfo: "Guardar informação",
        emDash: "—",
        ellipsis: "...",
      },
      errors: {
        connectionSave: "Erro de ligação ao guardar.",
      },
      supportSenderLabel: "PodoAdmin",
    },
    premium: {
      badge: "Premium",
      baseBadge: "Base",
      lockedTab: "Disponível no Premium",
      upsellTitle: "Disponível no plano Premium",
      upsellBody: "As análises de vendas, cobranças, rentabilidade e agenda estão incluídas no plano Premium. Melhore seu plano para desbloqueá-las.",
      upsellCta: "Ver planos e melhorar",
      clinicalToolsLockedTitle: "Ferramentas clínicas é um recurso Premium",
      clinicalToolsLockedBody: "O editor de modelos, o inventário e os encaminhamentos estão incluídos no plano Premium.",
      campaignsLockedTitle: "Campanhas de WhatsApp é um recurso Premium",
      campaignsLockedBody: "As campanhas e a reativação de pacientes via WhatsApp estão incluídas no plano Premium. O WhatsApp Web básico continua disponível no seu plano.",
      agendaAnalyticsLockedBody: "A análise de demanda, ocupação e fechamentos diários está incluída no plano Premium.",
      upgradeButton: "Melhorar para Premium",
      upgradeSuccess: "Seu plano foi atualizado com sucesso.",
      planBase: "Plano Base",
      planPremium: "Plano Premium",
      menuManagePlan: "Plano (Base/Premium)",
      planPrompt: "Plano atual: {current}. Digite \"base\", \"premium\" ou \"auto\" (auto = conforme pago no Stripe):",
      planInvalid: "Valor inválido. Use \"base\", \"premium\" ou \"auto\".",
      planUpdated: "Plano atualizado: {tier}.",
    },

    reservationAction: {
      confirmTitle: "Confirmar consulta",
      cancelTitle: "Cancelar consulta",
      rescheduleTitle: "Reagendar consulta",
      loading: "A carregar a sua reserva…",
      greeting: "Olá {name},",
      confirmQuestion: "Confirma a sua presença nesta consulta?",
      cancelQuestion: "Tem a certeza de que quer cancelar esta consulta?",
      dateLabel: "Data",
      timeLabel: "Hora",
      clinicLabel: "Clínica",
      podiatristLabel: "Profissional",
      confirmButton: "Confirmar presença",
      cancelButton: "Cancelar consulta",
      confirmedOk: "Consulta confirmada! Esperamos por si.",
      cancelledOk: "A sua consulta foi cancelada. Obrigado por avisar.",
      rescheduledOk: "A sua consulta foi cancelada. Em breve entraremos em contacto para reagendá-la.",
      alreadyConfirmed: "Esta consulta já estava confirmada. Esperamos por si!",
      alreadyCancelled: "Esta consulta já estava cancelada.",
      invalidMsg: "Este link não é válido ou já não está disponível.",
      expiredMsg: "Esta consulta já passou; o link não está disponível.",
      errorGeneric: "Não foi possível processar o seu pedido. Tente novamente em alguns minutos.",
      processingConfirm: "A confirmar a sua consulta…",
      processingCancel: "A cancelar a sua consulta…",
      processingReschedule: "A processar o seu pedido de reagendamento…",
      changedMindToCancel: "Mudou de ideias? Cancelar esta consulta",
      changedMindToConfirm: "Mudou de opinião? Confirmar presença",
      slotTaken: "O horário foi ocupado por outro paciente. Não foi possível reconfirmar.",
      pageCloseable: "A sua confirmação foi registada com sucesso. Já pode fechar esta página.",
      closePageNow: "Fechar agora",
      keepOpen: "Manter aberta",
      cantAutoClose: "Por favor feche esta janela manualmente",
      satisfactionTitle: "A sua opinião",
      satisfactionProcessing: "A registar a sua opinião…",
      thanksGood: "Obrigado! Ficamos felizes que a sua visita tenha sido excelente.",
      thanksRegular: "Obrigado pela sua opinião. O que podíamos melhorar?",
      thanksBad: "Lamentamos que a sua visita não tenha sido boa. Conte-nos o que aconteceu para melhorarmos.",
      reviewCta: "Deixe-nos uma avaliação no Google",
      complaintPrompt: "Queixas ou sugestões (opcional)",
      complaintPlaceholder: "Conte-nos em detalhe o que podemos melhorar…",
      anonymousLabel: "Enviar de forma anónima",
      sendComment: "Enviar comentário",
      commentSent: "Obrigado! Recebemos o seu comentário e vamos dar seguimento.",
      sending: "A enviar…",
      bookingTitle: "Agende a sua consulta",
      bookingInvalid: "Este link não está disponível.",
      bookingPickDate: "Escolha um dia",
      bookingPickTime: "Escolha um horário",
      bookingLoadingSlots: "A carregar horários…",
      bookingNoSlots: "Não há horários disponíveis nesse dia.",
      bookingName: "O seu nome",
      bookingPhone: "O seu WhatsApp (para confirmar)",
      bookingConfirm: "Confirmar consulta",
      bookingBooking: "A agendar…",
      bookingDoneTitle: "Consulta agendada!",
      bookingDoneMsg: "Esperamos por si em {date} às {time}. Entraremos em contacto para confirmar.",
      bookingSlotTaken: "Esse horário acabou de ser ocupado. Escolha outro, por favor.",
    },

    support: {
      title: "Contactar PodoAdmin",
      contactPodoAdmin: "Contactar PodoAdmin",
      contactSubtitle: "Envie uma mensagem direta ao suporte. Responderemos o mais rápido possível.",
      newConversation: "Nova mensagem",
      subject: "Assunto",
      subjectPlaceholder: "Ex: Problema com faturamento",
      message: "Mensagem",
      messagePlaceholder: "Descreva sua consulta ou problema...",
      send: "Enviar",
      myConversations: "Minhas conversas",
      noConversations: "Você ainda não tem conversas.",
      reply: "Responder",
      replyPlaceholder: "Escreva sua resposta...",
      open: "Aberta",
      closed: "Fechada",
      markAsRead: "Marcar como lido",
      closeConversation: "Fechar conversa",
      reopenConversation: "Reabrir conversa",
      from: "De",
      sent: "Enviado",
    },
    layout: {
      brandFallback: "PodoAdmin",
      unlockSidebarVisible: "Desbloquear (bloqueado visível)",
      unlockSidebarHidden: "Desbloquear (bloqueado oculto)",
      lockSidebarVisible: "Bloquear barra lateral visível",
      toggleSidebarLock: "Alternar bloqueio da barra lateral",
      hideMenu: "Ocultar menu",
      showMenu: "Mostrar menu",
      pendingAccessBanner: "O seu acesso clínico está pendente. Ative o pagamento em Faturação ou aguarde que um administrador ative a sua conta.",
      goToBilling: "Ir para faturação",
      goToSupport: "Ir para suporte",
      subscriptionInactiveBanner: "A sua assinatura não está ativa. Renove para continuar a usar a plataforma.",
      closeMenu: "Fechar menu",
      sponsored: "Patrocinado",
      closeAnnouncement: "Fechar anúncio",
      promoCodeOnSite: "Código no site do organizador:",
      seeMore: "Ver mais",
      interested: "Tenho interesse",
      interestRegistered: "Interesse registrado ✓",
    },
    whatsapp: {
      title: "WhatsApp Business",
      subtitle:
        "Conecte seu número comercial da Meta para lembretes de consultas por WhatsApp. Os dados são armazenados criptografados. Apenas você (podólogo ou administrador da clínica) pode configurar esta seção.",
      loading: "Carregando configuração do WhatsApp…",
      setupTitle: "Como configurar o WhatsApp (token de longa duração)",
      setupStep1Prefix: "Acesse",
      setupStep1Link: "Business Settings → Usuários do sistema",
      setupStep1Suffix: "e crie um usuário do sistema.",
      setupStep2: "Atribua seu app Meta e sua conta WhatsApp Business (WABA) como ativos.",
      setupStep3: "Gere um token para esse usuário e conceda permissões de WhatsApp (mensagens/admin conforme seu fluxo).",
      setupStep4Prefix: "Em",
      setupStep4Link: "Meta for Developers",
      setupStep4Suffix: "copie também Phone Number ID e WABA ID.",
      setupStep5: "Cole os dados neste formulário, salve e clique em «Testar conexão».",
      statusLabel: "Estado:",
      statusConnected: "conectado",
      statusError: "erro",
      statusPending: "pendente",
      phoneNumberIdLabel: "Phone Number ID (Meta) *",
      phoneNumberIdPlaceholder: "Ex.: 123456789012345",
      wabaIdLabel: "WhatsApp Business Account ID (opcional)",
      wabaIdPlaceholder: "WABA ID",
      accessTokenLabel: "Token de acesso permanente",
      accessTokenRequired: "*",
      accessTokenKeepCurrent: "(deixe vazio para manter o atual)",
      accessTokenPlaceholderSaved: "•••••••• (salvo)",
      accessTokenPlaceholderNew: "Token do Meta Business Suite",
      hideTokenField: "Ocultar campo de token",
      changeToken: "Alterar token",
      publicPhoneLabel: "Telefone público (opcional)",
      publicPhonePlaceholder: "+5511999999999",
      remindersSection: "Lembretes de consultas",
      remindersAuto: "Ativar lembretes automáticos por WhatsApp (apenas pacientes com telefone)",
      reminderDaysBefore: "Dias antes da consulta",
      reminderHoursBefore: "Horas antes da consulta",
      reminderHourBefore: "{hours} h antes",
      reminderDayOne: "{days} dia antes",
      reminderDayMany: "{days} dias antes",
      reminderSelectHour: "Antecedência do lembrete",
      reminderAddHour: "+ Adicionar outro horário",
      reminderRemoveHour: "Remover",
      reminderHoursHint: "Até 8 lembretes por horas. Os dias (5, 2, 1) são independentes.",
      reminderScheduleHint: "Ative os lembretes automáticos acima para editar o calendário.",
      reminderDaysHelp: "Clique em cada opção para ativar ou desativar (mínimo uma).",
      reminderHoursHelp: "Use cada lista para escolher quantas horas antes avisar.",
      reminderDaysRequired: "Selecione pelo menos um dia de lembrete.",
      reminder48h: "48 h antes",
      reminder24h: "24 h antes",
      templateNameLabel: "Nome do modelo Meta (lembrete)",
      templateNamePlaceholder: "ex.: appointment_reminder",
      templateHint:
        "Deve estar aprovado no Meta Business Manager com 4 variáveis: {{1}} nome, {{2}} data, {{3}} hora, {{4}} notas/extras.",
      defaultExtraNoteLabel: "Nota ou mensagem extra padrão",
      defaultExtraNotePlaceholder: "Ex.: Traga exames anteriores. Estacionamento na rua lateral.",
      defaultExtraNoteHint:
        "Enviado como 4.º parâmetro do modelo em lembretes automáticos e manuais (se não escrever outra nota ao enviar). Máximo 500 caracteres.",
      templateLanguageLabel: "Idioma do modelo",
      templateLanguagePlaceholder: "pt",
            integrationActive: "Integração ativa (envios habilitados quando o cron estiver ativo)",
      receptionistApiEnabled: "Permitir à receção usar o envio automático pela API Meta (lembretes e histórico).",
      save: "Salvar configuração",
      saving: "Salvando…",
      testConnection: "Testar conexão",
      testing: "Testando…",
      disconnect: "Desconectar",
      guidesFooter: "Guias oficiais:",
      guidesCloudApi: "Meta WhatsApp Cloud API",
      guidesSystemUsers: "System Users (token de longa duração)",
      consentNote: "Os pacientes devem ter consentido mensagens por WhatsApp.",
      purposeTitle: "Para que serve esta seção?",
      purposeDescription:
        "Aqui você conecta sua conta WhatsApp Business (Meta) para enviar lembretes de consultas. Salve o token e o modelo aprovado; depois use «Mensagens WhatsApp» para enviar e ver o status.",
      errorApiUnavailable:
        "Não foi possível contactar o serviço WhatsApp no servidor. Recarregue a página (Ctrl+F5). Se persistir, reinicie o servidor de desenvolvimento.",
      errorLoad: "Não foi possível carregar a configuração",
      errorPhoneRequired: "O Phone Number ID da Meta é obrigatório.",
      errorTokenRequired: "O token de acesso permanente da Meta é obrigatório.",
      errorTemplateRequired: "Indique o nome do modelo aprovado na Meta para lembretes.",
      errorSave: "Erro ao salvar",
      errorTest: "Erro ao testar conexão",
      errorTestFailed: "O teste de conexão falhou",
      errorDisconnect: "Erro ao desconectar",
      disconnectConfirm: "Remover a configuração do WhatsApp? Os lembretes automáticos deixarão de ser enviados.",
      successSaved: "Configuração do WhatsApp salva com sucesso.",
      successSavedWarning: "Salvo. Aviso de conexão: {warning}",
      successTest: "Conexão correta com a Meta.",
      successTestWithPhone: "Conexão correta ({phone})",
      successDisconnected: "WhatsApp desconectado.",
      campaigns: {
        title: "Campanhas WhatsApp",
        pageHint: "Difunda mensagens a pacientes com telefone. Pode usar WhatsApp Web (manual, sem API) ou o envio automático pela API Meta se estiver configurado.",
        webTitle: "Campanhas por WhatsApp Web",
        webHint: "Crie o rascunho da mensagem e envie paciente a paciente com wa.me. Sem configurar a Meta: você toca em Enviar no WhatsApp.",
        openWeb: "Abrir WhatsApp Web",
        newDraft: "Nova campanha (rascunho)",
        metaApiTitle: "Envio automático pela API Meta",
        metaApiHint: "Requer WhatsApp Business configurado em Definições. Pode ignorar esta secção se só usar WhatsApp Web.",
        denied: "Sem permissão para campanhas WhatsApp.",
        patientsLoadError: "Erro pacientes",
        draftCreated: "Campanha criada em rascunho",
        createError: "Erro ao criar",
        sendConfirm: "Enviar esta campanha pela API Meta a todos os pacientes com telefone?",
        apiSendResult: "API: enviados {sent}, falhados {failed}",
        apiSendError: "Erro ao enviar pela API",
        namePlaceholder: "Nome interno (ex. Promo verão)",
        messagePlaceholder: "Mensagem com variáveis, ex:\nOlá {{nombre}}, informamos que...",
        variablesHint: "Variáveis:",
        variablesList: "{{nombre}} (nome), {{apellido}} (apelido), {{nombre_completo}} (nome completo)",
        clinicOnlyFilter: "Só pacientes da minha clínica",
        recipientsWithPhone: "Destinatários com telefone válido:",
        recipientsMismatchHint: "Há {count} paciente(s) na sua lista; verifique se têm telefone com pelo menos 8 dígitos ou desmarque «Só pacientes da minha clínica».",
        patientsLoadFailed: "Não foi possível carregar os pacientes. Verifique permissões ou recarregue a página.",
        noPatientsYet: "Ainda não há pacientes na lista.",
        saveDraft: "Guardar rascunho",
        assistantTitle: "Assistente de envio — {name}",
        assistantPatientOf: "Paciente {current} de {total}:",
        openWhatsApp: "Abrir WhatsApp",
        assistantDone: "Assistente concluído: {count} pacientes.",
        finish: "Concluir",
        nextPatient: "Próximo paciente",
        draftsToSend: "Rascunhos para enviar",
        loading: "A carregar…",
        recipientsCount: "{count} destinatário(s) com WhatsApp",
        sendAssistant: "Assistente de envio",
        deleteDraft: "Eliminar",
        deleteDraftConfirm: "Eliminar o rascunho «{name}»? Esta ação não pode ser desfeita.",
        deleteDraftError: "Não foi possível eliminar o rascunho.",
        hideList: "Ocultar lista",
        showList: "Ver lista",
        noValidRecipients: "Sem destinatários válidos.",
        noDrafts: "Não há rascunhos. Crie uma campanha acima.",
        connected: "(ligado)",
        optional: "(opcional)",
        receptionistApiHint: "Envio automático ativado pelo seu podólogo.",
        receptionistApiDisabled: "O seu podólogo ainda não ativou o envio automático pela API Meta para a receção.",
        configureApiHint: "Configure WhatsApp Business em Definições para enviar campanhas pela API Meta.",
        allCampaigns: "Todas as campanhas",
        sentAt: "enviada {date}",
        sending: "A enviar…",
        sendByApi: "Enviar pela API",
        noCampaigns: "Não há campanhas",
      },
      messages: {
        title: "Mensagens WhatsApp",
        webTitle: "Lembretes por WhatsApp Web",
        webHint: "Sem configurar a API da Meta. Abra o WhatsApp Web ou a app com a mensagem pronta; você envia manualmente.",
        openWeb: "Abrir WhatsApp Web",
        metaApiTitle: "Envio automático com API Meta",
        metaApiHint: "Requer API Meta configurada em Definições → WhatsApp.",
        historyTitle: "Histórico (API automática)",
        historyHint: "Registo de envios automáticos pela API Meta. Os lembretes por WhatsApp Web não ficam registados aqui.",
        denied: "Não tem permissão para ver esta secção.",
        patientFallback: "Paciente",
        defaultExtraNote: "Por favor confirme a sua presença respondendo a esta mensagem.",
        noValidPhone: "Não há telefone válido para {name}.",
        selectAppointmentFirst: "Selecione uma consulta primeiro.",
        reminderSendError: "Não foi possível enviar o lembrete.",
        reminderSent: "Lembrete enviado corretamente.",
        defaultMessage: "Mensagem predefinida",
        variablesHint: "Variáveis:",
        variablesList: "{{nombre}} (nome), {{fecha}} (data), {{hora}} (hora), {{nota}} (nota), {{confirmar}} (link para confirmar), {{cancelar}} (link para cancelar), {{reagendar}} (link para reagendar)",
        extraNotePlaceholder: "Nota extra para todos os envios de hoje (opcional)",
        saved: "Guardado",
        saveMessage: "Guardar mensagem",
        dayOffsetLabel: "Lembretes para:",
        dayOffsetToday: "Hoje",
        dayOffsetTomorrow: "Amanhã",
        dayOffsetIn2Days: "Em 2 dias",
        dayOffsetIn5Days: "Em 5 dias",
        tomorrowAppointments: "Consultas de {date}",
        loadingAppointments: "A carregar consultas…",
        noTomorrowAppointments: "Não há consultas agendadas para esse dia.",
        noPhone: "Sem telefone",
        sendViaWhatsApp: "Enviar por WhatsApp",
        connected: "(ligado)",
        optional: "(opcional)",
        receptionistApiHint: "Envio automático ativado pelo seu podólogo. Os lembretes são enviados sem abrir o WhatsApp Web.",
        configLoadError: "Não foi possível obter o estado do WhatsApp.",
        connectedLabel: "Ligado",
        apiStatusLabel: "Estado API",
        templateLabel: "Modelo",
        templateUndefined: "Não definido",
        lastErrorLabel: "Último erro",
        noErrors: "Sem erros",
        sendAutoReminder: "Enviar lembrete automático",
        selectUpcomingAppointment: "Selecione uma consulta próxima",
        sending: "A enviar...",
        sendByApi: "Enviar pela API",
        singleExtraNotePlaceholder: "Nota extra para este envio (opcional)",
        lastApiSends: "Últimos envios por API",
        refresh: "Atualizar",
        loadingHistory: "A carregar histórico...",
        configureForHistory: "Configure WhatsApp Business em Definições para usar o envio automático e ver o histórico aqui.",
        noApiSends: "Sem envios por API. Os lembretes por WhatsApp Web não ficam registados aqui.",
        colDate: "Data",
        colPatient: "Paciente",
        colPhone: "Telefone",
        colStatus: "Estado",
        colNote: "Nota",
        emDash: "—",
        yes: "Sim",
        no: "Não",
        pendingRescheduleTitle: "Pendentes de reagendar",
        pendingRescheduleHint: "Consultas canceladas que ainda não têm uma nova consulta agendada para o mesmo paciente.",
        loadingPendingReschedule: "A carregar pendentes de reagendar…",
        noPendingReschedule: "Não há consultas pendentes de reagendar.",
        cancelledOn: "Cancelada em {date}",
        sendRescheduleMessage: "Avisar reagendamento",
        rescheduleWhatsAppMessage: "Olá {name}, a sua consulta de {date} foi cancelada. Em breve entraremos em contacto para reagendá-la. Obrigado pela paciência!",
        rescheduleWaMsgTitle: "Mensagem de WhatsApp ao avisar reagendamento",
        rescheduleWaMsgHint: "Texto enviado ao tocar «Avisar reagendamento». Variáveis: {nombre}, {fecha} e {reserva} (insere o seu link de reserva online para o paciente agendar sozinho).",
        rescheduleMessageSectionTitle: "Mensagem personalizada de reagendamento",
        rescheduleMessageHint: "Texto que o paciente vê na página aberta a partir do link {{reagendar}} da mensagem de WhatsApp. Se deixar vazio, é usada uma mensagem predefinida.",
        rescheduleMessagePlaceholder: "Ex. A sua consulta foi cancelada. Escreva-nos no WhatsApp para reagendar mais rápido.",
        rescheduleMessageScope: "Âmbito: {label}",
        rescheduleMessageReadOnlyHint: "Só leitura: definido pelo seu podólogo ou pelo admin da clínica.",
        savingRescheduleMessage: "A guardar…",
        saveRescheduleMessageButton: "Guardar mensagem",
        markRescheduleHandled: "Marcar em gestão",
        reopenReschedule: "Reabrir",
        rescheduleHandledBadge: "Em gestão",
        dismissReschedule: "Remover",
        dismissRescheduleConfirm: "Remover {name} dos pendentes de reagendar? A consulta não é eliminada, só sai desta lista.",
        opinionSectionTitle: "Pedir opinião (satisfação)",
        opinionSectionHint: "Consultas atendidas nos últimos 7 dias sem opinião. Envie ao paciente os links 👍 😐 👎 por WhatsApp.",
        loadingOpinion: "A carregar consultas atendidas…",
        noOpinionCandidates: "Não há consultas atendidas pendentes de opinião.",
        attendedOn: "Atendida em {date}",
        requestOpinion: "Pedir opinião",
        opinionWhatsAppMessage:
          "Olá {name}, como foi a sua visita em {clinica}? A sua opinião ajuda-nos muito:\n👍 Bem: {good}\n😐 Regular: {regular}\n👎 Mal: {bad}",
        bookingLinkTitle: "Reserva online",
        bookingLinkHint: "Partilhe este link com os seus pacientes para agendarem sozinhos. Mostra a marca da sua clínica; eles não veem o PodoAdmin.",
        bookingLinkEnabled: "Reserva online ativada",
        bookingLinkDisabled: "Ativar reserva online",
        bookingLinkCopy: "Copiar link",
        bookingLinkCopied: "Copiado!",
      },
    },
    clinicalTools: {
      title: "Ferramentas clínicas",
      denied: "Não tem permissão para aceder a esta secção.",
      tabTemplates: "Modelos de sessão",
      tabInventory: "Inventário",
      tabReferrals: "Encaminhamentos",
      templatesHint: "Defina históricos clínicos predefinidos (calo, unha encravada, etc.) para os carregar ao abrir uma sessão.",
      newTemplate: "Novo modelo",
      create: "Criar",
      creating: "A criar…",
      category: "Categoria",
      inventoryName: "Nome do material",
      unit: "Unidade",
      add: "Adicionar",
      emptyInventory: "Sem material registado",
      patientId: "ID do paciente",
      referTo: "Encaminhar para",
      reason: "Motivo",
      registerReferral: "Registar encaminhamento",
      emptyReferrals: "Sem encaminhamentos",
      nameRequired: "Indique um nome para o modelo.",
      templateCreated: "Modelo criado. Edite-o para escolher secções e conteúdo.",
      createFailed: "Não foi possível criar o modelo.",
      presetCreated: "Modelo «{name}» criado.",
      templateUpdated: "Modelo atualizado.",
      saveFailed: "Não foi possível guardar o modelo.",
      deleteConfirm: "Eliminar o modelo «{name}»? Esta ação não pode ser desfeita.",
      templateDeleted: "Modelo eliminado.",
      deleteFailed: "Não foi possível eliminar o modelo.",
      invalidQuantity: "Indique uma quantidade válida (0 ou mais).",
      defaultUnit: "unidade",
      inventoryAdded: "Material registado.",
      genericError: "Erro",
      referralAdded: "Encaminhamento registado.",
      namePlaceholder: "Nome (ex. Calosidade 1.º dedo)",
      scopeLabel: "Âmbito:",
      scopePersonal: "Só eu",
      scopeClinic: "Consultório (todos os podólogos)",
      clinicAdminHint: "Como administrador de clínica, os modelos são partilhados com todo o consultório.",
      sectionsCount: "{count} secções",
      close: "Fechar",
      edit: "Editar",
      deleting: "A eliminar…",
      delete: "Eliminar",
      nameLabel: "Nome",
      shareWithClinic: "Partilhar com o consultório",
      saving: "A guardar…",
      saveTemplate: "Guardar modelo",
      emptyTemplates: "Sem modelos. Crie um vazio ou use os atalhos de calosidade / unha encravada.",
      quantityPlaceholder: "Quantidade",
      quantityAria: "Quantidade",
      patientPrefix: "Paciente:",
      scopeShared: "Consultório",
      scopePersonalShort: "Pessoal",
    },
    systemDiagnostics: {
      title: "Estado do sistema",
      subtitle: "Verifique o worker, a base de dados e o URL de saúde pública; guia breve em caso de incidentes.",
      sectionStatus: "Estado operacional",
      workerLabel: "API / Worker",
      databaseLabel: "Base de dados (D1)",
      statusOk: "OK",
      statusError: "Erro",
      latencyLabel: "Latência",
      environmentSection: "Ambiente (NODE_ENV)",
      checkedAtLabel: "Última verificação",
      refresh: "Atualizar",
      loadError: "Não foi possível carregar o diagnóstico.",
      publicHealthTitle: "Monitorização externa",
      publicHealthDesc:
        "Pode usar este URL em ferramentas de disponibilidade (apenas confirma que o worker responde, sem consultar D1):",
      sessionHealthUrlLabel: "Desta sessão (origem do navegador)",
      productionHealthUrlLabel: "URL pública para monitorização (domínio configurado no Worker)",
      productionHealthNote:
        "Em desenvolvimento verá localhost; é normal. Em produção abra a app com o domínio real. Para mostrar aqui a URL de produção mesmo em localhost, configure OFFICIAL_APP_DOMAIN ou ALLOWED_ORIGINS nas variáveis do Worker na Cloudflare. Monitores externos devem usar a URL de produção, não o seu PC.",
      sectionGuide: "Ante erros ou indisponibilidade",
      guideIntro: "Para isolar e comunicar um problema:",
      guideItem1: "Anote a hora aproximada, o ecrã e a ação que estava a realizar.",
      guideItem2:
        "Em erros da API, o cliente mostra requestId (corpo JSON ou cabeçalho X-Request-Id). Inclua ao reportar para cruzar com os logs do Worker.",
      guideItem3: "Consulte o registo de auditoria para ações recentes dos utilizadores.",
      guideItem4: "No Cloudflare, veja métricas e logs do Worker nesse intervalo.",
      correlationHint:
        "Respostas de erro incluem requestId no JSON; o cabeçalho X-Request-Id é enviado nas respostas JSON para correlação.",
    },
    roles: {
      superAdmin: "Super Administrador",
      clinicAdmin: "Administrador de Clínica",
      admin: "Suporte",
      podiatrist: "Podólogo",
      receptionist: "Recepcionista",
      superAdminDesc: "Gestão de usuários, créditos e configuração do sistema",
      clinicAdminDesc: "Gestão de podólogos e pacientes da clínica",
      adminDesc: "Ajustes de créditos e suporte técnico",
      podiatristDesc: "Gestão de pacientes e sessões clínicas",
      receptionistDesc: "Criar pacientes, agendamentos e gerir calendário dos podólogos atribuídos",
      superAdminAssignWarning:
        "Você está prestes a conceder o papel de Super Administrador. Esta pessoa terá acesso total ao sistema, usuários e configurações.",
      superAdminAssignConfirmPrompt: "Confirme esta ação para evitar atribuições por engano.",
      superAdminAssignConfirmed: "Papel de Super Administrador confirmado.",
    },
    errors: {
      generic: "Ocorreu um erro",
      notFound: "Não encontrado",
      unauthorized: "Não autorizado",
      validationError: "Erro de validação",
      requiredField: "Este campo é obrigatório",
      invalidEmail: "E-mail inválido",
      invalidPhone: "Telefone inválido",
      saveFailed: "Falha ao salvar",
      loadFailed: "Falha ao carregar",
    },
    success: {
      saved: "Salvo com sucesso",
      deleted: "Excluído com sucesso",
      created: "Criado com sucesso",
      updated: "Atualizado com sucesso",
      exported: "Exportado com sucesso",
    },
    branding: {
      tagline: "Sistema completo de gestão clínica para profissionais de podologia",
      digital: "Digital",
      access: "Acesso",
      secure: "Seguro",
    },
    notifications: {
      title: "Notificações",
      all: "Todas",
      unread: "Não lidas",
      read: "Lidas",
      markAsRead: "Marcar como lida",
      markAllAsRead: "Marcar todas como lidas",
      noNotifications: "Sem notificações",
      viewAll: "Ver todas",
      delete: "Excluir",
      reassignment: "Reatribuição",
      appointment: "Consulta",
      credit: "Créditos",
      system: "Sistema",
      patientReassignedFrom: "Paciente reatribuído de você",
      patientReassignedTo: "Paciente atribuído a você",
      reassignedBy: "Reatribuído por",
      reason: "Motivo",
      agoMinutes: "há {n} min",
      agoHours: "há {n}h",
      agoDays: "há {n} dias",
      yesterday: "Ontem",
      justNow: "Agora mesmo",
      adminMessage: "Mensagem do Administrador",
      from: "De",
      to: "Para",
      type: "Tipo",
      patient: "Paciente",
      selectedCount: "{n} selecionada(s)",
    },
    messaging: {
      title: "Mensagens",
      sendMessage: "Enviar mensagem",
      newMessage: "Nova mensagem",
      sentMessages: "Mensagens enviadas",
      recipient: "Destinatário",
      recipients: "Destinatários",
      allUsers: "Todos os usuários",
      selectSpecific: "Selecionar usuários específicos",
      singleUser: "Usuário individual",
      subject: "Assunto",
      subjectPlaceholder: "Escreva o assunto da mensagem...",
      messageBody: "Conteúdo da mensagem",
      messagePlaceholder: "Escreva sua mensagem aqui...",
      preview: "Visualizar",
      send: "Enviar",
      sending: "Enviando...",
      sent: "Enviada",
      sentAt: "Enviada em",
      recipientsCount: "destinatários",
      readCount: "lidas",
      unreadCount: "não lidas",
      noMessages: "Nenhuma mensagem enviada",
      selectRecipients: "Selecione os destinatários",
      messageSent: "Mensagem enviada com sucesso",
      messageRequired: "O conteúdo da mensagem é obrigatório",
      subjectRequired: "O assunto é obrigatório",
      recipientRequired: "Selecione pelo menos um destinatário",
      fromAdmin: "Mensagem do Administrador",
    },

    clinic: {
      title: "Gestão da clínica",
      tabOverview: "Resumo",
      tabPodiatrists: "Podólogos",
      tabPatients: "Pacientes",
      tabReceptionists: "Recepcionistas",
      statPodiatrists: "Podólogos",
      statTotalPatients: "Total de pacientes",
      statSessionsThisMonth: "Sessões este mês",
      vsPreviousMonth: "% vs. mês anterior",
      agendaTitle: "Agenda (últimos 30 dias)",
      agendaSubtitle: "Pacientes atendidos, faltas e cancelamentos registados no calendário",
      allPodiatrists: "Todos os podólogos",
      attended: "Atendidos",
      noShow: "Faltaram",
      noShowRateOfResolved: "{n}% do total resolvido",
      cancelled: "Canceladas",
      cancellationRate: "Taxa de cancelamento: {n}%",
      pending: "Pendientes",
      demandTitle: "Procura da agenda",
      demandHint: "Procura total (30 dias): {n} consultas. Detalhe de horas de pico, ocupação e fecho diário em Cobranças → Agenda.",
      openCheckoutAgenda: "Abrir Cobranças → Agenda",
      attendedPerDay: "Atendidos por dia",
      loadingAgendaMetrics: "A carregar métricas da agenda…",
      activityByPodiatrist: "Atividade por podólogo",
      sessionsCount: "{n} sessões",
      podiatristsLimit: "Podólogos: {current} de {limit} disponíveis no seu plano",
      podiatristsNoLimit: "Podólogos da clínica. Sem limite definido.",
      podiatristsLimitCta: "Precisa de mais? Adicione podólogos adicionais por $10 USD/mês em Subscrição.",
      createPodiatrist: "Criar podólogo",
      colPodiatrist: "Podólogo",
      colEmail: "Email",
      colLicense: "Licença",
      colPatients: "Pacientes",
      colSessionsMonth: "Sessões (mês)",
      licenseNotRegistered: "Não registada",
      noPodiatrists: "Não há podólogos nesta clínica",
      totalIndexed: "Total indexados",
      searchPatientPlaceholder: "Pesquisar paciente (nome, email, telefone)...",
      activityAll: "Atividade: todos",
      visitsRangeChip: "Visitas {min}–{max}",
      loadingPatients: "A carregar pacientes…",
      colPhone: "Telefone",
      colVisits: "Visitas",
      colAssignedPodiatrist: "Podólogo atribuído",
      colLastSession: "Última sessão",
      colActions: "Ações",
      reassign: "Reatribuir",
      noPatientsFound: "Nenhum paciente encontrado",
      receptionistsHint: "As recepcionistas têm acesso sem créditos para criar pacientes e criar/editar consultas no calendário dos podólogos que lhes atribuir.",
      receptionistsActive: "Ativas: {active} (sem limite). Devem alterar a palavra-passe no primeiro início de sessão.",
      createReceptionist: "Criar recepcionista",
      colName: "Nome",
      colAssignedPodiatrists: "Podólogos atribuídos",
      unassigned: "Sem atribuição",
      podiatristsAction: "Podólogos",
      unblock: "Desbloquear",
      block: "Bloquear",
      enable: "Ativar",
      disable: "Desativar",
      noReceptionists: "Não há recepcionistas. Crie uma para gerir consultas e pacientes dos podólogos da clínica.",
      reassignTitle: "Reatribuir paciente",
      reassignUseCase: "Caso de uso: Quando um podólogo não pode atender por ausência ou indisponibilidade, pode reatribuir os pacientes a outro profissional da clínica.",
      currentPodiatrist: "Podólogo atual",
      newPodiatrist: "Novo podólogo atribuído",
      selectPodiatrist: "Selecionar podólogo...",
      unknownPodiatrist: "Desconhecido",
      createPodiatristSubtitle: "O novo podólogo será atribuído à sua clínica.",
      initialPasswordMin8: "Palavra-passe inicial (mín. 8 caracteres)",
      createReceptionistSubtitle: "Serão atribuídos todos os podólogos da clínica. Deverá alterar a palavra-passe no primeiro acesso.",
      initialPassword: "Palavra-passe inicial",
      assignedPodiatristsTitle: "Podólogos atribuídos",
      noPodiatristsInClinic: "Não há podólogos na clínica.",
      confirmDeleteReceptionist: "Eliminar a recepcionista {name} ({email})? Esta ação não pode ser desfeita.",
      emailTaken: "Já existe uma conta com este email",
      createReceptionistError: "Erro ao criar recepcionista",
      saveAssignmentError: "Erro ao guardar atribuição",
      createPodiatristError: "Erro ao criar podólogo",
      passwordMin8: "A palavra-passe deve ter pelo menos 8 caracteres",
    },
    auditLog: {
      title: "Log de auditoria",
      actionLabels: {
        LOGIN_SUCCESS: "Início de sessão",
        LOGIN_FAILED: "Início de sessão falhou",
        LOGOUT: "Encerrar sessão",
        PASSWORD_CHANGED: "Senha alterada",
        PASSWORD_RESET_REJECTED: "Redefinição de senha rejeitada",
        PASSWORD_RESET_APPROVED: "Redefinição de senha aprovada",
        PASSWORD_RESET_COMPLETED: "Redefinição de senha concluída",
        PASSWORD_RESET_REQUESTED: "Solicitação de redefinição de senha",
        CREATE: "Criação",
        CREATE_USER: "Usuário criado",
        UPDATE: "Atualização",
        DELETE: "Exclusão",
        DELETE_USER: "Usuário excluído",
        COMPLETE: "Concluído",
        EXPORT: "Exportação",
        PRINT: "Impressão",
        UPDATE_DRAFT: "Rascunho atualizado",
        REASSIGN: "Reatribuição",
        TRANSFER: "Transferência",
        ADD_CREDITS: "Créditos adicionados",
        SUBTRACT_CREDITS: "Créditos subtraídos",
        ADMIN_CREDIT_ADJUSTMENT: "Ajuste de créditos (admin)",
        ALERT_MULTIPLE_PRINT_VIOLATIONS: "Alerta: múltiplas impressões",
        PRINT_VIOLATION_FORM: "Tentativa de impressão pelo formulário",
      },
      entityLabels: {
        authentication: "Autenticação",
        session: "Sessão",
        patient: "Paciente",
        prescription: "Receita",
        reassignment: "Reatribuição",
        credit: "Créditos",
        user: "Usuário",
        user_data: "Dados do usuário",
        clinic: "Clínica",
        professional_info: "Dados profissionais",
        professional_credentials: "Credenciais",
        logo: "Logo",
        message: "Mensagem",
        clinical_history: "Histórico clínico",
        receptionist: "Recepcionista",
        registration_list: "Lista de registro",
        support_conversation: "Conversa de suporte",
      },
      filters: {
        title: "Filtros",
        clear: "Limpar filtros",
        search: "Buscar...",
        allActions: "Todas as ações",
        allTypes: "Todos os tipos",
        allUsers: "Todos os usuários",
        from: "De",
        to: "Até",
      },
      empty: {
        title: "Sem registros",
        description: "Nenhum registro de auditoria encontrado com os filtros selecionados",
      },
      totalRecords: "Total de registros",
      actionTypes: "Tipos de ação",
      entityTypes: "Tipos de entidade",
      activeUsers: "Usuários ativos",
      topUsers: "Usuários mais ativos",
      recordsCount: "{n} registros",
      ofTotal: "(de {total} no total)",
      fullDetails: "Detalhes completos",
      userLinkedHint: "Cada registro está vinculado ao usuário que realizou a ação. O Log ID identifica unicamente este evento.",
      userLabel: "Usuário:",
      userIdLabel: "ID do usuário:",
      logIdLabel: "ID do registro (log):",
      resourceIdLabel: "ID do recurso:",
      pageOf: "Página {current} de {total}",
      summaries: {
        loginSuccess: "Início de sessão bem-sucedido",
        loginSuccessEmail: "Início de sessão bem-sucedido: {email}",
        with2fa: "(2FA ativado)",
        without2fa: "(sem 2FA)",
        logout: "Sessão encerrada.",
        passwordChanged: "Senha alterada pelo usuário.",
        loginFailed: "Tentativa de início de sessão falhou.",
        loginFailedEmail: "Tentativa de início de sessão falhou: {email}",
        passwordResetRejected: "Solicitação de redefinição de senha rejeitada.",
        passwordResetApproved: "Redefinição de senha aprovada por um administrador.",
        passwordResetCompleted: "O usuário concluiu a redefinição de senha.",
        passwordResetRequested: "Solicitação de redefinição de senha enviada.",
        patientPrefix: "Paciente: {name}",
        userPrefix: "Usuário: {name}",
        clinicPrefix: "Clínica: {name}",
      },
    },
    securityMetrics: {
      title: "Métricas de segurança",
      subtitle: "Métricas de segurança, alertas ativos e eventos recentes",
      last24h: "Últimas 24 h",
      last7days: "Últimos 7 dias",
      last30days: "Últimos 30 dias",
      refresh: "Atualizar",
      loadError: "Não foi possível carregar as métricas",
      criticalEvents: "Eventos críticos",
      failedLogins: "Logins falhos",
      unreadAlerts: "Alertas não lidos",
      summaryByType: "Resumo por tipo",
      loading: "Carregando...",
      noEventsInPeriod: "Sem eventos no período selecionado.",
      activeAlerts: "Alertas ativos",
      noSystemAlerts: "Não há alertas de sistema recentes.",
      recentAccessGeo: "Acessos recentes (geolocalização)",
      date: "Data",
      event: "Evento",
      userRole: "Usuário / função",
      ip: "IP",
      location: "Localização",
      noAccessYet: "Nenhum acesso registrado ainda. Faça login para gerar dados.",
      loginOk: "Login OK",
      loginFailed: "Login falhou",
      recentFailedLogins: "Últimos logins falhos",
      emailDetail: "E-mail / detalhe",
      noRecentRecords: "Sem registros recentes.",
      attemptNumber: "Tentativa #{n}",
      metricLabels: {
        failed_login: "Logins falhos",
        successful_login: "Logins bem-sucedidos",
        twoFaFailed: "2FA falhou",
        captcha_failed: "CAPTCHA falhou",
        suspicious_activity: "Atividade suspeita",
      },
    },
    supportPage: {
      title: "Suporte",
      adminSubtitle: "Mensagens de usuários e listas de registro para aprovação.",
      tabMessages: "Mensagens",
      tabLists: "Criar listas",
      conversations: "Conversas",
      noConversations: "Não há conversas",
      selectConversation: "Selecione uma conversa para ver as mensagens e responder.",
      supportAgent: "Suporte",
      registrationLists: "Listas de registro",
      newList: "Nova lista",
      newListNamePlaceholder: "Nome da nova lista...",
      listsEmptyHint: "Crie listas de registros (cursos, eventos) e envie-as para o administrador aprovar e importar.",
      deleteList: "Excluir",
      deleteListConfirm: "Tem certeza de que deseja excluir esta lista?",
      createListError: "Erro ao criar a lista",
      defaultListName: "Nova lista",
      invalidEmail: "Introduza um e-mail válido.",
      downloadCsv: "Baixar CSV",
      markPaidToExport: "Marque pelo menos um registro como pago para exportar.",
      submitForApproval: "Enviar para aprovação",
      addEntry: "Adicionar registro",
      namePlaceholder: "Nome",
      emailPlaceholder: "E-mail",
      roleIndependent: "Podólogo independente",
      roleClinicAdmin: "Admin da clínica",
      podiatristLimitLabel: "Limite de podólogos:",
      podiatristLimitPlaceholder: "Ex: 5",
      add: "Adicionar",
      clinicAdminLimitHint: "Os podólogos da clínica serão limitados a este número. Recepcionistas não contam no limite.",
      noEntries: "Não há registros nesta lista.",
      paid: "Pago",
      unpaid: "Não pago",
      pendingPayment: "Pendentes de pagamento ({n})",
      paidSection: "Pagos (exportados no CSV) ({n})",
      selectOrCreateList: "Selecione uma lista ou crie uma nova.",
      statusDraft: "Rascunho",
      statusPending: "Pendente",
      statusApproved: "Aprovada",
      statusRejected: "Rejeitada",
      limitPodiatrists: "Limite: {n} podólogos",
    },
    sponsoredAnnouncements: {
      title: "Anúncios patrocinados",
      heading: "Anúncios por estado / província",
      subtitle: "Campanhas pagas por provedores externos. Todos os usuários da zona veem banner e notificação.",
      newCampaign: "Nova campanha",
      formTitle: "Nova campanha",
      existingAdvertiser: "Provedor existente",
      newAdvertiserOption: "— Novo provedor —",
      advertiserName: "Nome do provedor",
      advertiserNamePlaceholder: "Ex: Instituto Podológico",
      titlePlaceholder: "Título do anúncio",
      bodyPlaceholder: "Descrição (curso, evento, etc.)",
      countryPlaceholder: "País (MX)",
      statePlaceholder: "Estado / província",
      audienceEstimate: "≈ {n} usuários na zona",
      externalUrlPlaceholder: "URL do anunciante (seu site)",
      promoCodePlaceholder: "Código de desconto no site do anunciante (opcional)",
      createDraft: "Criar rascunho",
      campaigns: "Campanhas",
      loading: "Carregando...",
      noCampaigns: "Ainda sem campanhas.",
      advertiserCode: "Código do anunciante:",
      activate: "Ativar",
      pause: "Pausar",
      createAdvertiserError: "Não foi possível criar o provedor",
      selectOrCreateAdvertiser: "Selecione ou crie um provedor",
      createCampaignError: "Erro ao criar campanha",
      statusError: "Erro",
      statusActive: "ativa",
      statusDraft: "rascunho",
      statusPaused: "pausada",
      defaultCta: "Ver mais",
    },
    terms: {
      title: "Termos e Condições",
      lastUpdated: "Última atualização",
      lastUpdatedDate: "24 de janeiro de 2026",
      backToRegister: "Voltar ao registro",
      acceptAndContinue: "Aceitar e Continuar",
      back: "Voltar",
      section1: {
        title: "1. Aceitação dos Termos",
        content: "Ao acessar e usar o PodoAdmin, você concorda em cumprir e estar sujeito a estes Termos e Condições. Se você não concordar com alguma parte destes termos, não deve usar nosso serviço.",
      },
      section2: {
        title: "2. Descrição do Serviço",
        content: "PodoAdmin é uma plataforma de gestão clínica projetada para profissionais de podologia. O serviço inclui gestão de pacientes, sessões clínicas, créditos e outras funcionalidades relacionadas à administração de uma prática podológica.",
      },
      section3: {
        title: "3. Registro de Usuário",
        intro: "Para usar o PodoAdmin, você deve:",
        item1: "Fornecer informações precisas, atuais e completas durante o registro",
        item2: "Manter e atualizar suas informações de conta",
        item3: "Manter a confidencialidade de sua senha",
        item4: "Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta",
        item5: "Ser responsável por todas as atividades que ocorram sob sua conta",
      },
      section4: {
        title: "4. Uso Aceitável",
        intro: "Você concorda em:",
        item1: "Usar o serviço apenas para fins legais e profissionais",
        item2: "Não tentar acessar áreas restritas do sistema",
        item3: "Não interferir no funcionamento do serviço",
        item4: "Não transmitir vírus, malware ou código malicioso",
        item5: "Respeitar os direitos de propriedade intelectual",
        item6: "Manter a confidencialidade das informações dos pacientes",
      },
      section5: {
        title: "5. Privacidade e Proteção de Dados",
        content: "O tratamento de dados pessoais e de pacientes é regido por nossa Política de Privacidade. Você é responsável por cumprir todas as leis de proteção de dados aplicáveis, incluindo, mas não limitado ao RGPD (Regulamento Geral de Proteção de Dados) e outras regulamentações locais de privacidade.",
      },
      section6: {
        title: "6. Créditos e Cobrança",
        content: "O uso de certas funcionalidades pode exigir créditos. Os créditos podem ter períodos de validade e estão sujeitos às políticas de cobrança estabelecidas. Não serão feitos reembolsos por créditos não utilizados, exceto em casos excepcionais determinados a nosso critério.",
      },
      section7: {
        title: "7. Propriedade Intelectual",
        content: "Todo o conteúdo, design, código e funcionalidades do PodoAdmin são propriedade de seus respectivos proprietários e estão protegidos por leis de propriedade intelectual. Não é permitida a reprodução, distribuição ou uso comercial sem autorização prévia.",
      },
      section8: {
        title: "8. Limitação de Responsabilidade",
        content: "O PodoAdmin é fornecido \"como está\" sem garantias de qualquer tipo. Não garantimos que o serviço esteja livre de erros, interrupções ou defeitos. Não seremos responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso do serviço.",
      },
      section9: {
        title: "9. Modificações do Serviço",
        content: "Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto do serviço a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por qualquer modificação, suspensão ou descontinuação.",
      },
      section10: {
        title: "10. Rescisão",
        content: "Podemos encerrar ou suspender seu acesso ao serviço imediatamente, sem aviso prévio, por qualquer motivo, incluindo, mas não limitado a violação destes termos. Após a rescisão, seu direito de usar o serviço cessará imediatamente.",
      },
      section11: {
        title: "11. Modificações dos Termos",
        content: "Reservamo-nos o direito de modificar estes termos a qualquer momento. As modificações entrarão em vigor imediatamente após sua publicação. Seu uso contínuo do serviço após as modificações constitui sua aceitação dos novos termos.",
      },
      section12: {
        title: "12. Lei Aplicável",
        content: "Estes termos são regidos pelas leis do país onde o PodoAdmin opera. Qualquer disputa será resolvida nos tribunais competentes dessa jurisdição.",
      },
      section13: {
        title: "13. Contato",
        content: "Se você tiver perguntas sobre estes Termos e Condições, pode entrar em contato conosco através dos canais de suporte fornecidos na plataforma.",
      },
    },
    privacy: {
      title: "Política de Privacidade",
      lastUpdated: "Última atualização",
      backToRegister: "Voltar ao registro",
      section1: { title: "1. Controlador", content: "O profissional ou clínica é responsável pelos dados de saúde conforme LGPD e demais leis locais." },
      section2: { title: "2. Dados tratados", content: "Dados de conta, clínicos, auditoria e metadados de segurança." },
      section3: { title: "3. Finalidade", content: "Gestão clínica, retenção legal de prontuários, segurança e suporte." },
      section4: { title: "4. Retenção", content: "Prontuário clínico: até 20 anos desde o último ato clínico. Auditoria: 10 anos." },
      section5: {
        title: "5. Direitos do titular",
        intro: "Conforme LGPD e leis locais:",
        item1: "Acesso e portabilidade em Configurações.",
        item2: "Retificação do perfil.",
        item3: "Eliminação quando legalmente permitido.",
        item4: "Oposição: contatar suporte; pode prevalecer retenção legal.",
      },
      section6: { title: "6. Segurança", content: "HTTPS, controle de acesso, auditoria e autenticação segura." },
      section7: { title: "7. Transferências", content: "Dados podem ser processados em nuvem; informe pacientes se necessário." },
      section8: { title: "8. Contato", content: "Suporte da plataforma ou Configurações → Privacidade e dados." },
    },
    compliance: {
      title: "Privacidade e dados",
      subtitle: "Direitos LGPD e GDPR da sua conta",
      exportTitle: "Exportar meus dados",
      exportDesc: "Baixe JSON com perfil, clínica e auditoria recente.",
      exportButton: "Baixar meus dados",
      deletionTitle: "Solicitar exclusão",
      deletionDesc: "Registre pedido de exclusão conforme LGPD e retenção clínica.",
      deletionButton: "Solicitar exclusão",
      deletionSuccess: "Solicitação registrada.",
      privacyLink: "Ver Política de Privacidade",
      retentionTitle: "Retenção",
      retentionNote: "Prontuário: até 20 anos desde o último ato clínico.",
      legalHoldTitle: "Bloqueios legais",
      legalHoldDesc: "Impede exclusão sob litígio ou auditoria.",
      holdResourceType: "Tipo de recurso",
      holdResourceId: "ID do recurso",
      holdReason: "Motivo",
      holdCreate: "Criar bloqueio",
      holdCreated: "Bloqueio criado",
      holdRelease: "Liberar",
      holdsEmpty: "Sem bloqueios ativos",
    },
    clinicalHistoriesExport: {
      title: "Baixar prontuários clínicos",
      subtitle: "Exporte todos os expedientes em HTML imprimível → PDF",
      desc: "Gera um arquivo HTML com o mesmo layout da impressão de sessões. Sem JSON: abra no navegador e salve como PDF em Imprimir.",
      stats: "{patients} paciente(s) · {sessions} sessão(ões) incluídas",
      downloadHtml: "Baixar HTML",
      printPdf: "Imprimir / salvar PDF",
      pdfHint: "No diálogo de impressão escolha «Salvar como PDF».",
      popupBlocked: "Permita pop-ups para abrir a visualização de impressão.",
      noPatients: "Não há pacientes na sua conta para exportar.",
      buildError: "Não foi possível gerar o HTML do prontuário.",
      downloadFailed: "Não foi possível iniciar o download. Tente «Imprimir / salvar PDF».",
      downloadStarted: "Download iniciado: {filename}",
      openedInTab: "Histórico aberto numa nova aba. Use Imprimir → Salvar como PDF.",
      invalidResponse: "A resposta do servidor não inclui dados de pacientes válidos.",
    },
    usersPage: {
      fields: {
        name: "Nome",
        email: "Email",
        password: "Senha",
        role: "Função",
        clinic: "Clínica",
        clinicOptional: "Clínica (opcional)",
      },
      create: {
        title: "Criar novo usuário",
        passwordHint: "Mínimo de 8 caracteres.",
        clinicModeExisting: "Selecionar clínica existente",
        clinicModeNew: "Criar nova clínica",
        clinicModeNone: "Sem clínica (independente)",
        newClinicHint: "Uma clínica será criada com dados provisórios. O administrador completará nome, código, telefone, endereço e o restante em Configurações.",
        podiatristLimit: "Limite de podólogos (opcional)",
        podiatristLimitPlaceholder: "Ex: 5",
        podiatristLimitHint: "Os podólogos da clínica ficam limitados a este número. Recepcionistas não contam.",
        saving: "Criando...",
        success: "Usuário criado com sucesso.",
        partialClinicFail: "Usuário criado, mas a clínica não pôde ser criada. Configure depois na edição do usuário.",
        errors: {
          nameRequired: "O nome é obrigatório.",
          emailInvalid: "Introduza um e-mail válido.",
          passwordMin: "A senha deve ter pelo menos 8 caracteres.",
          clinicRequiredReceptionist: "Selecione uma clínica para o recepcionista.",
          clinicRequiredAdmin: "Selecione uma clínica existente ou escolha criar uma nova.",
          createFailed: "Não foi possível criar o usuário.",
        },
      },
      import: {
        title: "Importar usuários (CSV)",
        description: "Colunas obrigatórias: nome, email, password (ou use a senha padrão), rol.",
        optionalColumnsSuperAdmin: " Opcional: clinicMode (existing|new|none), clinicId (se existing), podiatrist_limit (só clinic_admin).",
        downloadTemplate: "Baixar modelo",
        selectFile: "Selecionar arquivo",
        defaultPassword: "Senha padrão (se faltar no CSV)",
        optionalPlaceholder: "Opcional",
        readyCount: "{count} linhas prontas para importar",
        andMore: "... e mais {count}",
        resultsSummary: "Resultado: {ok} ok, {fail} com erro",
        created: "✓ Criado",
        importing: "Importando... ({done}/{total})",
        submit: "Importar",
        templateFilename: "modelo_usuarios.csv",
        errors: {
          needRows: "O arquivo deve ter pelo menos uma linha de cabeçalho e uma de dados.",
          missingColumns: "Faltam colunas obrigatórias: nome, email, password, rol",
          readFile: "Erro ao ler o arquivo",
          invalidPassword: "Senha inválida (mín. 8 caracteres)",
          unknown: "Erro desconhecido",
          connection: "Erro de conexão",
        },
      },
      edit: {
        title: "Editar usuário",
        noClinic: "Sem clínica",
        errors: {
          updateFailed: "Não foi possível atualizar o usuário.",
        },
      },
      transfer: {
        title: "Transferir histórico clínico",
        subtitle: "Copiar todos os pacientes e sessões de um usuário para outro",
        successMessage: "Transferência concluída: {patients} pacientes, {sessions} sessões.",
        error: "Erro ao transferir os dados.",
        successTitle: "Sucesso!",
        errorTitle: "Erro",
        sourceUser: "Usuário de origem",
        targetUser: "Usuário de destino",
        selectUser: "— Selecionar —",
        patientsCount: "{count} pacientes para transferir",
        warning: "Os dados serão copiados para o usuário de destino. A origem mantém o histórico. Esta ação não é facilmente desfeita.",
        transferring: "Transferindo...",
        submit: "Transferir",
      },
      profile: {
        loading: "Carregando dados clínicos...",
        patients: "Pacientes",
        sessions: "Sessões",
        patientsHeading: "Pacientes ({count})",
        andMore: "...e mais {count}",
      },
      status: {
        banned: "Banido",
        blocked: "Bloqueado",
        gracePeriod: "Período de graça",
        disabled: "Desabilitado",
        pendingPayment: "Pagamento pendente",
        active: "Ativo",
      },
      confirm: {
        block: "Bloquear {name}? Não poderá entrar até ser desbloqueado.",
        unblock: "Desbloquear {name}?",
        enable: "Habilitar a conta de {name}?",
        disable: "Desabilitar a conta de {name}? Não poderá entrar.",
        ban: "Banir {name}? Esta é uma ação grave.",
        unban: "Remover banimento de {name}?",
        delete: "Eliminar {name}? Esta ação pode ser irreversível.",
        deletePermanent: "Eliminar permanentemente {name}? Não pode ser desfeito.",
      },
      errors: {
        approve: "Erro ao aprovar",
        reject: "Erro ao rejeitar",
        block: "Não foi possível bloquear o usuário.",
        unblock: "Não foi possível desbloquear o usuário.",
        enable: "Não foi possível habilitar o usuário.",
        disable: "Não foi possível desabilitar o usuário.",
        ban: "Não foi possível banir o usuário.",
        unban: "Não foi possível remover o banimento.",
        delete: "Não foi possível eliminar o usuário.",
      },
      actions: {
        importCsv: "Importar CSV",
        createUser: "Criar usuário",
        transferHistory: "Transferir histórico",
        approve: "Aprovar",
        reject: "Rejeitar",
        view: "Ver",
        edit: "Editar",
        ban: "Banir",
        unban: "Desbanir",
        block: "Bloquear",
        unblock: "Desbloquear",
        enableAccount: "Habilitar conta",
        disableAccount: "Desabilitar conta",
        delete: "Eliminar",
        viewProfile: "Ver perfil",
        downloadJson: "Baixar JSON",
        manageAccount: "Gerir conta",
      },
      table: {
        user: "Usuário",
        email: "Email",
        role: "Função",
        status: "Estado",
        clinic: "Clínica",
        limit: "Limite",
        data: "Dados",
        actions: "Ações",
        sortBy: "Ordenar por",
        podiatristLimit: "Limite de podólogos",
        dataSummary: "{patients} pacientes · {sessions} sessões",
        currentPodiatrists: "Atuais: {count}",
        saveLimit: "Guardar",
        clinicMissing: "Clínica não encontrada",
        effectiveLimitHint: "Cupo real aplicado (incluídos pelo plano + assentos extra, ou o override manual se for maior).",
        overCapacityHint: "Esta clínica tem mais podólogos ativos do que o seu cupo atual (provavelmente após rebaixar de plano). Não poderá adicionar mais até libertar cupo ou comprar assentos extra.",
        patients: "pacientes",
        sessions: "sessões",
      },
      passwordReset: {
        pendingTitle: "Pedidos de recuperação de senha",
        approved: "Pedido aprovado.",
        approveError: "Não foi possível aprovar o pedido.",
        rejectReasonPrompt: "Motivo da rejeição (opcional):",
        rejected: "Pedido rejeitado.",
        rejectError: "Não foi possível rejeitar o pedido.",
        approvedModalTitle: "Pedido aprovado",
        linkHint: "O link foi enviado ao e-mail do usuário. Aqui está o link para reenviá-lo pessoalmente (WhatsApp, etc.):",
        copied: "Link copiado para a área de transferência.",
        copyFailed: "Não foi possível copiar. Selecione e copie o link manualmente.",
        copyLink: "Copiar link",
      },
      regLists: {
        title: "Listas de registro pendentes",
        hint: "Aprove ou rejeite as listas enviadas pelo suporte.",
        byCreator: "Por {name}",
        downloadCsv: "CSV",
        createdCount: "{count} usuário(s) criado(s).",
        approved: "Lista aprovada.",
        errorsPrefix: "Erros:",
      },
      cooldown: {
        notApplicable: "N/A",
        scopeClinic: "clínica",
        scopeProfessional: "profissional",
        reasonPrompt: "Motivo da autorização (opcional):",
        confirm: "Autorizar edição antecipada de {scope} para {name}?",
        applied: "Autorização aplicada.",
        error: "Não foi possível aplicar a autorização.",
      },
      export: {
        failed: "Não foi possível exportar os dados do usuário.",
      },
      menu: {
        unbanAccount: "Remover banimento",
        banAccount: "Banir conta",
        unblockAccount: "Desbloquear conta",
        blockAccount: "Bloquear conta",
        enableAccount: "Habilitar conta",
        disableAccount: "Desabilitar conta",
        authorizeCooldown: "Autorizar edição (cooldown)",
        deleteAccount: "Eliminar conta",
      },
      searchPlaceholder: "Buscar usuários...",
      allRoles: "Todas as funções",
      loading: "Carregando usuários...",
      empty: "Nenhum usuário encontrado.",
      selectPlaceholder: "— Selecionar —",
    },
  },
  
  fr: {
    clinicalLayout: clinicalSharedByLang.fr.clinicalLayout,
    podiatry: clinicalSharedByLang.fr.podiatry,
    errorBoundary: clinicalSharedByLang.fr.errorBoundary,
    clinicalList: clinicalSharedByLang.fr.clinicalList,
    patientsClinical: clinicalSharedByLang.fr.patientsClinical,
    sessionsClinical: clinicalSharedByLang.fr.sessionsClinical,
    clinicalToolsExtras: clinicalSharedByLang.fr.clinicalToolsExtras,
    calendarGrid: clinicalSharedByLang.fr.calendarGrid,
    common: {
      loading: "Chargement...",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      create: "Créer",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      print: "Imprimer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      confirm: "Confirmer",
      close: "Fermer",
      yes: "Oui",
      no: "Non",
      actions: "Actions",
      status: "Statut",
      date: "Date",
      time: "Heure",
      name: "Nom",
      email: "E-mail",
      phone: "Téléphone",
      address: "Adresse",
      notes: "Notes",
      description: "Description",
      details: "Détails",
      view: "Voir",
      download: "Télécharger",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      showShort: "Afficher",
      hideShort: "Masquer",
      captcha: "CAPTCHA",
      seeAll: "Tout voir",
      seeAllShort: "Tout voir",
      viewMore: "Voir plus",
      go: "Aller",
    },
    auth: {
      login: "Connexion",
      logout: "Déconnexion",
      welcome: "Bienvenue",
      welcomeBack: "Bon retour",
      enterCredentials: "Entrez vos identifiants pour accéder au système",
      emailLabel: "E-mail",
      emailPlaceholder: "email@exemple.com",
      emailHint: "Ce sera votre identifiant de connexion. Nous enverrons un e-mail de vérification à cette adresse.",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "••••••••",
      loginButton: "Se connecter",
      loggingIn: "Connexion en cours...",
      invalidCredentials: "Identifiants invalides",
      loginError: "Erreur de connexion",
      tooManyAttempts: "Trop de tentatives",
      accountTemporarilyBlocked: "Compte temporairement bloqué",
      testCredentials: "Identifiants de test",
      superAdmin: "Super Administrateur",
      podiatrist: "Podologue",
      loggedInAs: "Connecté en tant que",
      sessionExpired: "Votre session a expiré",
      // Registration
      register: "S'inscrire",
      registerTitle: "Créez votre compte",
      registerSubtitle: "Remplissez le formulaire pour vous inscrire à PodoAdmin",
      nameLabel: "Nom complet",
      namePlaceholder: "Jean Dupont",
      clinicCodeLabel: "Code clinique (facultatif)",
      clinicCodePlaceholder: "Ex. PREM",
      clinicCodeHint:
        "Laissez vide si vous êtes podologue indépendant. Si votre clinique vous a donné un code, saisissez-le pour la rejoindre.",
      passwordRequirements: "Exigences du mot de passe",
      passwordMinLength: "Minimum 12 caractères",
      passwordMustContain: "Doit contenir:",
      passwordUppercase: "Au moins une lettre majuscule",
      passwordLowercase: "Au moins une lettre minuscule",
      passwordNumber: "Au moins un chiffre",
      passwordSpecial: "Au moins un caractère spécial",
      termsAccept: "J'accepte les termes et conditions",
      termsLink: "Voir les termes",
      privacyAccept: "J'accepte la",
      privacyLink: "Politique de Confidentialité",
      registerButton: "Créer un compte",
      registering: "Création du compte...",
      alreadyHaveAccount: "Vous avez déjà un compte?",
      goToLogin: "Se connecter",
      dontHaveAccount: "Vous n'avez pas de compte?",
      contactAdminForAccount: "Contactez l'administrateur pour créer un compte.",
      registrationSuccess: "Inscription réussie!",
      registrationSuccessMessage: "Nous avons envoyé un email de vérification. Veuillez vérifier votre boîte de réception.",
      registrationSuccessDevMessage:
        "Compte créé en développement. L'email a été vérifié automatiquement ; vous pouvez vous connecter.",
      checkEmail: "Vérifiez votre e-mail",
      emailAlreadyRegistered:
        "Cet e-mail est déjà enregistré. Connectez-vous avec votre compte ou utilisez un autre e-mail.",
      // Email Verification
      verifyEmail: "Vérifier l'e-mail",
      verifyEmailTitle: "Vérifiez votre e-mail",
      verifyEmailSubtitle: "Nous avons envoyé un lien de vérification à votre e-mail",
      verifyEmailSuccess: "E-mail vérifié",
      verifyEmailSuccessMessage: "Votre compte a été vérifié avec succès. Vous pouvez maintenant vous connecter.",
      verifyEmailError: "Erreur de vérification",
      verifyEmailExpired: "Le lien de vérification a expiré",
      resendVerification: "Renvoyer la vérification",
      // CAPTCHA
      captchaRequired: "Veuillez compléter le CAPTCHA",
      captchaError: "Erreur de vérification CAPTCHA",
      captchaNotConfigured:
        "Environnement de développement : le CAPTCHA n'est pas configuré. L'inscription fonctionne sans vérification antibot.",
      captchaDisabledInDev:
        "Environnement de développement : CAPTCHA désactivé automatiquement. Obligatoire en production.",
      // OAuth
      orContinueWith: "Ou continuer avec",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
      forgotPassword: "Mot de passe oublié?",
      forgotPasswordTitle: "Récupérer le mot de passe",
      forgotPasswordSubtitle: "Entrez votre e-mail. Un administrateur ou le support examinera votre demande et vous contactera.",
      forgotPasswordButton: "Soumettre la demande",
      forgotPasswordSuccess: "Votre demande a été reçue. Un administrateur ou le support l'examinera et vous contactera lorsque le lien de récupération sera disponible.",
      resetPasswordTitle: "Nouveau mot de passe",
      resetPasswordSubtitle: "Choisissez un mot de passe sécurisé. Le lien expire dans 1 heure.",
      newPasswordLabel: "Nouveau mot de passe",
      resetPasswordButton: "Réinitialiser le mot de passe",
      resetPasswordSuccess: "Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.",
      backToLogin: "Retour à la connexion",
      forgotPasswordErrorRequest: "Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard.",
      forgotPasswordErrorConnection: "Erreur de connexion. Veuillez réessayer.",
      resetPasswordInvalidLink: "Lien invalide. Demandez-en un nouveau depuis l'écran de récupération.",
      resetPasswordPasswordsMismatch: "Les mots de passe ne correspondent pas.",
      resetPasswordMissingToken: "Jeton manquant. Utilisez le lien reçu par e-mail.",
      resetPasswordErrorReset: "Erreur lors de la réinitialisation du mot de passe",
      resetPasswordErrorConnection: "Erreur de connexion. Veuillez réessayer.",
      resetPasswordRedirecting: "Redirection vers la connexion...",
      resetPasswordRepeatPassword: "Répéter le mot de passe",
      resetPasswordHint: "Minimum 12 caractères, majuscule, minuscule, chiffre et caractère spécial.",
      changePasswordTitle: "Changer le mot de passe",
      changePasswordSubtitle: "Votre mot de passe temporaire doit être changé. Choisissez un mot de passe sécurisé de votre choix.",
      currentPasswordLabel: "Mot de passe actuel (temporaire)",
      changePasswordButton: "Changer le mot de passe",
      changePasswordSuccess: "Mot de passe mis à jour avec succès.",
      changePasswordRedirecting: "Redirection vers le tableau de bord...",
      contactToVerifyRecovery: "Contactez-nous pour vérifier que vous êtes bien la personne qui récupère le compte.",
      requestNewLink: "Demander un nouveau lien",
      securityLabel: "Sécurité :",
      loginOnlyOnOfficialDomainWithDomain: "Connectez-vous uniquement sur {domain}. N'utilisez pas ce mot de passe sur d'autres sites.",
      loginOnlyOnOfficialDomainGeneric: "Connectez-vous uniquement sur le domaine officiel. N'utilisez pas ce mot de passe sur d'autres sites.",
      notOnOfficialDomain: "Vous n'êtes pas sur le domaine officiel. L'URL actuelle ne correspond pas à {domain}. N'entrez pas votre mot de passe ici.",
      notOnOfficialDomainNoDomain: "Vous n'êtes pas sur le domaine officiel. N'entrez pas votre mot de passe ici.",
      failedAttempts: "Tentatives échouées :",
      blockedUntil: "Bloqué jusqu'à :",
      retryIn: "Vous pouvez réessayer dans :",
      emailNotificationSent: "Une notification par e-mail a été envoyée concernant ces tentatives.",
      googleNotConfigured: "Google n'est pas configuré dans cet environnement",
      googleConnectFailed: "Impossible de se connecter à Google",
      googleNoCode: "Aucun code Google n'a été reçu",
      googleLoginError: "Erreur de connexion avec Google",
      googleCompleting: "Finalisation de la connexion Google…",
      serverConnectionError: "Erreur de connexion au serveur",
      connectionErrorShort: "Erreur de connexion",
      changePasswordCurrentRequired: "Saisissez votre mot de passe actuel.",
      changePasswordError: "Erreur lors du changement de mot de passe",
      verifyEmailMissingToken: "Aucun jeton de vérification n'a été fourni",
      verifyEmailFailed: "Erreur lors de la vérification de l'e-mail",
      recoveryVerifySubject: "Vérification d'identité - Récupération de mot de passe",
    },
    nav: {
      dashboard: "Tableau de bord",
      patients: "Patients",
      clinicalSessions: "Séances Cliniques",
      clinicalTools: "Outils cliniques",
      credits: "Crédits",
      settings: "Paramètres",
      users: "Utilisateurs",
      auditLog: "Journal d'audit",
      systemDiagnostics: "État du système",
      profile: "Profil",
      clinicManagement: "Gestion de Clinique",
      whatsappMessages: "Messages WhatsApp",
      whatsappCampaigns: "Campagnes WhatsApp",
      calendar: "Calendrier",
      securityMetrics: "Métriques de sécurité",
      checkout: "Encaissements",
    },
    checkout: {
      title: "Sortie des patients",
      receptionHint: "Patients que le podologue a indiqués prêts à payer.",
      podiatristHint: "Montants envoyés à l'accueil. Suivez le statut ici.",
      adminHint: "Supervision des encaissements en attente et effectués.",
      tabPending: "En attente",
      tabPaid: "Encaissés",
      allPodiatrists: "Tous les podologues",
      emptyPending: "Aucun encaissement en attente.",
      emptyPaid: "Aucun encaissement dans cet onglet.",
      markPaid: "Marquer encaissé",
      confirmPaid: "Confirmer que {patient} a payé ?",
      confirmPaidTitle: "Confirmer l'encaissement",
      paidAt: "Encaissé à",
      statusAwaiting: "Sans montant",
      statusReady: "Prêt à encaisser",
      statusPaid: "Encaissé",
      modalTitle: "Montant pour l'accueil",
      modalSubtitle: "Patient : {patient}",
      modalHint: "Indiquez le montant à encaisser. L'accueil sera notifié immédiatement.",
      amountLabel: "Montant à encaisser",
      notesLabel: "Note pour l'accueil (optionnel)",
      notesPlaceholder: "Ex. consultation + pansement",
      skipForNow: "Passer pour l'instant",
      sendToReception: "Envoyer à l'accueil",
      invalidAmount: "Entrez un montant valide supérieur à zéro.",
      saveFailed: "Impossible d'envoyer le montant.",
      saving: "Envoi…",
      quickTariffs: "Tarifs rapides",
      requestAmount: "Demander le montant",
      requestAmountSent: "Demande envoyée",
      setAmount: "Indiquer le montant",
      tariffsTitle: "Tarifs rapides d'encaissement",
      tariffsHint: "Raccourcis à la fin de séance. L'admin définit les tarifs de la clinique ; le podologue peut personnaliser les siens.",
      saveTariffs: "Enregistrer les tarifs",
      tariffsSaved: "Tarifs enregistrés",
      addTariff: "Ajouter un tarif",
            tariffLabelPlaceholder: "Libellé (ex. Consultation)",
      tariffAmountAria: "Montant",
      tariffDurationTitle: "Durée indicative (minutes)",
      tariffDurationAria: "Durée en minutes",
      tariffDurationPlaceholder: "min",
      serverMigrateHint: "Erreur serveur. Si vous venez de mettre à jour le projet, exécutez npm run db:migrate et redémarrez npm run dev.",
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
      myPractice: "Mon cabinet",
      podiatristFallback: "Podologue",
      assignedPodiatrist: "Podologue assigné",
      podiatristLabel: "Podologue",
      weekBucket: "S{n}",
      analytics: checkoutAnalyticsByLang.fr,
      agendaAnalytics: agendaAnalyticsByLang.fr,
    },
    dashboard: {
      title: "Tableau de bord",
      welcomeMessage: "Bienvenue sur PodoAdmin",
      quickStats: "Statistiques Rapides",
      totalPatients: "Total des Patients",
      sessionsThisMonth: "Séances ce Mois",
      creditsRemaining: "Crédits Restants",
      recentActivity: "Activité Récente",
      upcomingAppointments: "Prochains Rendez-vous",
      noRecentActivity: "Aucune activité récente",
      patientFallback: "Patient",
      sessionCompletedActivity: "Séance terminée",
      draftActivity: "Brouillon",
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
    },
    patients: {
      title: "Patients",
      addPatient: "Ajouter un Patient",
      editPatient: "Modifier le Patient",
      patientList: "Liste des Patients",
      patientDetails: "Détails du Patient",
      searchPatients: "Rechercher des patients...",
      noPatients: "Aucun patient enregistré",
      firstName: "Prénom",
      lastName: "Nom",
      dateOfBirth: "Date de Naissance",
      gender: "Genre",
      male: "Masculin",
      female: "Féminin",
      other: "Autre",
      idNumber: "Numéro d'identité",
      curp: "CURP (Mexique)",
      curpHint: "Optionnel. Code d'identification mexicain (NOM-004).",
      phone: "Téléphone",
      email: "E-mail",
      address: "Adresse",
      city: "Ville",
      postalCode: "Code Postal",
      medicalHistory: "Antécédents Médicaux",
      allergies: "Allergies",
      medications: "Médicaments",
      conditions: "Conditions",
      consent: "Consentement",
      consentGiven: "Consentement donné",
      consentDate: "Date du consentement",
      consentDocumentLink: "Voir le document de consentement éclairé",
      consentLegalNotice: "Les signatures numériques ici n'ont pas de validité légale. Le patient doit signer le document imprimé pour sa validité juridique.",
      clinicalHistory: "Historique Clinique",
      viewHistory: "Voir l'Historique",
      lastVisit: "Dernière Visite",
      totalSessions: "Total des Séances",
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
      },
    },
    sessions: {
      title: "Séances Cliniques",
      newSession: "Nouvelle Séance",
      editSession: "Modifier la Séance",
      sessionList: "Liste des Séances",
      sessionDetails: "Détails de la Séance",
      sessionDate: "Date de la Séance",
      clinicalNotes: "Notes Cliniques",
      anamnesis: "Anamnèse",
      physicalExamination: "Examen Physique",
      diagnosis: "Diagnostic Podologique",
      treatmentPlan: "Plan de Traitement",
      images: "Images",
      uploadImages: "Télécharger des Images",
      maxImages: "Maximum 2 images",
      draft: "Brouillon",
      completed: "Terminée",
      complete: "Terminer",
      saveDraft: "Enregistrer le brouillon",
      selectPatient: "Sélectionner un Patient",
      noSessions: "Aucune séance enregistrée",
      startSession: "Démarrer la Séance",
      creditReserved: "Crédit réservé",
      sessionSaved: "Séance enregistrée",
      checkoutCompleteHint:
        "L'encaissement à l'accueil n'apparaît qu'en appuyant sur Terminer (patient qui part). Enregistrer le brouillon sauvegarde sans clôturer la visite.",
      allStatuses: "Toutes",
      loadingSessions: "Chargement des séances…",
      createFirstSession: "Créez votre première séance clinique",
      
      reasons: {
        routine_checkup: "Contrôle de routine",
        treatment_continuation: "Suite de traitement",
        post_procedure_review: "Contrôle post-procédure",
        new_symptoms: "Nouveaux symptômes",
        follow_up: "Suivi",
        other: "Autre",
      },
      appointmentReason: "Motif du rendez-vous",
      followUpInstructions: "Instructions de suivi",
      followUpInstructionsPlaceholder: "Instructions pour le patient, médication, soins...",
      unknownPatient: "Patient inconnu",
      podiatryExamTitle: "Examen podologique",
      confirmApplyTemplate: "Appliquer ce modèle ? Les champs cliniques actuels (texte, examen podologique et sections personnalisées) seront remplacés.",
      imageOnlyAllowed: "Seules les images sont autorisées (JPEG, PNG, WebP).",
      imageReadError: "Impossible de lire l'image",
      imageProcessError: "Erreur lors du traitement de l'image.",
      saveFailed: "Impossible d'enregistrer la séance.",
      selectPatientAlert: "Veuillez sélectionner un patient.",
      gracePeriodMessage: "Votre compte est en période de grâce pour trop-perçu. Pendant 30 jours vous pouvez consulter vos données, mais pas créer de nouvelles séances cliniques.",
      gracePeriodTitle: "Vous ne pouvez pas créer de nouvelles séances pour le moment",
      saveError: "Une erreur s'est produite lors de l'enregistrement de la séance.",
      confirmDelete: "Supprimer cette séance ?",
      deleteFailed: "Impossible de supprimer la séance.",
      deleteError: "Une erreur s'est produite lors de la suppression de la séance.",
      exportOnlyPodiatrists: "Seuls les podologues peuvent exporter les dossiers cliniques.",
      exportFailed: "Impossible d'exporter le dossier clinique",
      prescriptionRequireContent: "Saisissez les indications dans « Prescription / Indications » ou « Médicaments / Traitements ».",
      patientLoadFailed: "Impossible de charger les données du patient. Fermez le formulaire, rouvrez la séance et réessayez.",
      noPhotos: "Aucune photo dans cette séance. Ajoutez-les lors de la création ou de la modification du brouillon.",
      imageAlt: "Image {n}",
      folioLabel: "Folio :",
      medicationsLabel: "Médicaments :",
      noPrescriptions: "Aucune ordonnance pour cette séance",
      patientPrefix: "Patient :",
      professionalFallback: "Professionnel",
      userFallback: "Utilisateur",
      printTitlePrefix: "Podologue",
      weightPlaceholder: "ex. 72,5",
      heightPlaceholder: "ex. 165",
      anamnesisPlaceholder: "Motif de consultation, antécédents...",
      examPlaceholder: "Résultats de l'examen...",
      diagnosisPlaceholder: "Diagnostic podologique...",
      treatmentPlaceholder: "Plan de traitement...",
      notesPlaceholder: "Notes supplémentaires...",
      patientData: "Données du patient",
      idOrCurp: "ID / CURP",
      age: "Âge",
      professionalData: "Données du professionnel",
      professional: "Professionnel",
      professionalLicense: "Numéro d'ordre / licence",
      licensePlaceholder: "Numéro de licence",
      prescriptionIndications: "Prescription / Indications *",
      prescriptionIndicationsPlaceholder: "Décrivez les indications et recommandations pour le patient...",
      medicationsTreatments: "Médicaments / Traitements",
      medicationsTreatmentsPlaceholder: "Listez les médicaments ou traitements recommandés...",
      additionalNotes: "Notes supplémentaires",
      prescriptionMinContent: "Remplissez au moins « Prescription / Indications » ou « Médicaments / Traitements ».",
      loadingPatients: "Chargement des patients…",
      selectEllipsis: "Sélectionner...",
      incompleteData: " (données incomplètes)",
      incompletePatientWarning: "Des champs obligatoires du patient manquent (prénom, nom, date de naissance, genre, pièce d'identité). Pour les mineurs, utilisez la pièce du parent/tuteur. Modifiez la fiche patient pour pouvoir enregistrer la séance.",
      editPatientLink: "Modifier le patient →",
      refreshPatientData: "Actualiser les données (si vous avez déjà modifié le patient)",
      vitalsHint: "Enregistré avec cette séance et met à jour le dossier du patient.",
      sessionTemplate: "Modèle de séance",
      noTemplate: "Sans modèle",
      templateClinic: " (cabinet)",
      templatePersonal: " (personnel)",
      noTemplatesBefore: "Aucun modèle. Créez-les dans",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Outils cliniques",
      templateApplyHint: "Choisir un modèle applique automatiquement le contenu et les sections visibles (p. ex. sans hélomes en procédures chirurgicales).",
      templateFilteredView: "Vue filtrée par modèle : {n} sections visibles. Choisissez « Sans modèle » pour voir le formulaire complet.",
      templateNoSections: "Ce modèle n'a pas de sections définies. Modifiez-le dans Outils cliniques, cochez ce qu'il faut inclure et enregistrez à nouveau.",
      selectPatientTitle: "Sélectionnez un patient",
      completePatientDataTitle: "Complétez les champs obligatoires du patient (prénom, nom, date de naissance, genre, pièce d'identité)",
      completePatientDataHint: "Pour enregistrer un brouillon ou terminer la séance, complétez d'abord les données du patient et cliquez sur «Actualiser les données» ci-dessus.",
      loadMoreSessions: "Charger plus de séances",
      loadingMore: "Chargement…",
      reschedule: "Reprogrammer",
      rescheduleTitle: "Reprogrammer le prochain rendez-vous",
      daysOverdue: "{n} jours de retard",
      scheduleAppointment: "Planifier un rendez-vous →",
      todayRel: "Aujourd'hui",
      tomorrowRel: "Demain",
      inDays: "Dans {n} jours",
      exportJson: "Exporter JSON",
      yearsOld: "{n} ans",
      followUp: {
        overdueBanner: "Rendez-vous en retard",
        upcomingBanner: "Prochains rendez-vous (7 jours)",
        overdueChip: "En retard",
        upcomingChip: "À venir",
        sectionTitle: "Suivi",
        nextAppointment: "Prochain rendez-vous",
        noSpecificReason: "Sans motif précis",
      },
      prescriptions: {
        sectionTitle: "Ordonnances / Prescriptions",
        newPrescription: "Nouvelle ordonnance",
        create: "Créer",
        creating: "Création…",
      },
      vitals: {
        title: "Signes vitaux",
        weightKg: "Poids (kg)",
        heightCm: "Taille (cm)",
      },
    },
    calendar: {
      title: "Calendrier",
      today: "Aujourd'hui",
      month: "Mois",
      week: "Semaine",
      day: "Jour",
      newAppointment: "Nouveau rendez-vous",
      addAppointment: "Ajouter un rendez-vous",
      allPodiatrists: "Tous les podologues",
      dayMon: "Lun",
      dayTue: "Mar",
      dayWed: "Mer",
      dayThu: "Jeu",
      dayFri: "Ven",
      daySat: "Sam",
      daySun: "Dim",
      unknown: "Inconnu",
      pendingPatient: "Patient en attente",
      pendingShort: "En attente",
      appointment: "Rendez-vous",
      session: "Séance",
      scheduled: "Rendez-vous programmé",
      completed: "Terminée",
      draft: "Brouillon",
      noDiagnosis: "Sans diagnostic",
      noNotes: "Sans notes",
      edit: "Modifier",
      cancel: "Annuler",
      more: "de plus",
      events: "événements",
      noEventsForDay: "Aucun événement pour ce jour",
      podiatristLabel: "Podologue :",
      minutes: "min",
      tel: "Tél :",
      confirmDeleteAppointment: "Supprimer ce rendez-vous du registre ? Il sera définitivement effacé.",
      upcomingAppointments: "Prochains rendez-vous",
      upcomingSessions: "Prochaines séances (7 jours)",
      noUpcomingSessions: "Aucune séance à venir",
      legend: "Légende",
      legendAppointment: "Rendez-vous programmé",
      legendSessionCompleted: "Séance terminée",
      legendSessionDraft: "Séance brouillon",
      legendCancelled: "Annulée",
      cancelledSlotHint: "Il y avait un rendez-vous annulé sur ce créneau. Le créneau est libre : vous pouvez réserver sans problème.",
      formTitleNew: "Nouveau rendez-vous",
      formTitleEdit: "Modifier le rendez-vous",
      patientLabel: "Patient",
      patientPendingOption: "Patient à enregistrer",
      pendingPatientInfo: "Informations du patient en attente :",
      nameRequired: "Nom *",
      phoneRequired: "Téléphone *",
      namePlaceholder: "Nom complet du patient",
      phonePlaceholder: "Téléphone de contact",
      podiatristRequired: "Podologue *",
      selectPodiatrist: "Sélectionner un podologue",
      dateRequired: "Date *",
      timeRequired: "Heure *",
      durationMinutes: "Durée (minutes)",
      duration15: "15 minutes",
      duration30: "30 minutes",
      duration45: "45 minutes",
      duration60: "1 heure",
      duration90: "1 heure 30",
      notesPlaceholder: "Motif de la visite, commentaires...",
      cancelAppointmentButton: "Annuler le rendez-vous",
      confirmCancelAppointment: "Annuler ce rendez-vous ?",
      close: "Fermer",
      saveChanges: "Enregistrer les modifications",
      createAppointment: "Créer le rendez-vous",
      creating: "Création…",
      saving: "Enregistrement…",
      errorPendingPatientRequired: "Veuillez renseigner le nom et le téléphone du patient en attente.",
      errorOverlap: "Ce créneau chevauche un autre rendez-vous de ce podologue. Choisissez un autre jour, une autre heure ou un autre podologue (si vous gérez une clinique).",
      errorUpdateFailed: "Impossible de mettre à jour le rendez-vous.",
      errorCreateFailed: "Impossible de créer le rendez-vous.",
      errorSaveFailed: "Erreur lors de l'enregistrement du rendez-vous.",
      errorDeleteFailed: "Impossible de supprimer le rendez-vous.",
      downloadIcs: "Télécharger .ics",
      exportDateLabel: "Date à exporter",
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Télécharge les rendez-vous programmés du jour en .ics (rendez-vous avec heure uniquement ; pas les séances cliniques)",
      exportWaHint: "Télécharge le .ics et ouvre WhatsApp. Si le podologue a un mobile sur son profil, le chat s'ouvre directement ; sinon choisissez le contact manuellement. Joignez le .ics.",
      exportSelectPodiatrist: "Sélectionnez un podologue dans le filtre pour exporter l'agenda.",
      exportNoAppointments: "Aucun rendez-vous programmé ce jour.",
      exportBusy: "Export en cours…",
      exportWaHeader: "📅 Agenda du {{fecha}} — {{podologo}} ({{count}} rendez-vous)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 Le fichier agenda-.ics a été téléchargé — joignez-le dans WhatsApp pour l'importer dans le calendrier mobile.",
      exportWaInvalidPhone: "Le téléphone du podologue n'est pas valide pour WhatsApp. Ouvrez WhatsApp manuellement et collez le message.",
      checkInWaiting: "En attente",
      checkInInConsult: "En consultation",
      checkInDone: "Vu",
      checkInNone: "Sans check-in",
      scheduledMetric: "Planifiées",
      completedMetric: "Terminées",
      noShow: "Absent",
      waitlist: "Liste d'attente",
      agendaDemandTitle: "Demande d'agenda",
      agendaDemandDemandTotal: "Demande totale : {n}",
      goToCheckoutAgendaLong: "Voir l'analyse d'agenda dans les encaissements",
      pendingBadge: "En attente",
      confirmSaveAnyway: "Voulez-vous enregistrer le rendez-vous quand même ?",
      outsideHoursBlocked: "Hors horaires : le rendez-vous ne sera pas enregistré. La réception ne peut pas prendre de rendez-vous hors des horaires autorisés.",
      confirmMarkNoShow: "Marquer ce rendez-vous comme absence (no-show) ?",
      markNoShow: "Absent",
      noPhoneShort: "sans tél.",
      preferredDateShort: "préf. {date}",
      outsideHoursReceptionistNote: "Le rendez-vous ne sera pas enregistré : la réception ne peut pas réserver hors horaires.",
      outsideHoursContinueNote: "Vous pouvez continuer ; une confirmation sera demandée à l'enregistrement.",
      icsExportTitle: "Exporter l'Agenda (.ics)",
      icsExportDescription: "Le fichier .ics est un format de calendrier standard que vous pouvez importer dans Outlook, Google Calendar, Apple Calendar ou n'importe quelle application calendrier. Quand vous le téléchargez, le fichier est enregistré sur votre appareil.",
      icsExportLabel: "Sélectionnez la date à exporter",
    },
    credits: {
      title: "Crédits",
      currentBalance: "Solde Actuel",
      monthlyCredits: "Crédits Mensuels",
      extraCredits: "Crédits Supplémentaires",
      purchaseCredits: "Acheter des Crédits",
      creditHistory: "Historique des Crédits",
      consumption: "Consommation",
      purchase: "Achat",
      expiration: "Expiration",
      expiresEndOfMonth: "Expire à la fin du mois",
      neverExpires: "N'expire jamais",
      reserved: "Réservés",
      used: "Utilisés",
      available: "Disponibles",
      insufficientCredits: "Crédits insuffisants",
      creditPackages: "Forfaits de Crédits",
      buyNow: "Acheter Maintenant",
    },
    settings: {
      title: "Paramètres",
      theme: "Thème",
      language: "Langue",
      lightMode: "Mode Clair",
      darkMode: "Mode Sombre",
      accentColor: "Couleur d'Accent",
      accentColorHint: "Entrez une couleur hexadécimale",
      preview: "Aperçu",
      saveSettings: "Enregistrer les Paramètres",
      settingsSaved: "Paramètres enregistrés",
      general: "Général",
      appearance: "Apparence",
      notifications: "Notifications",
      security: "Sécurité",
      paletteHint: "Personnalisez les couleurs de chaque zone. Palettes distinctes pour les modes clair et sombre.",
      paletteGroupBrand: "Marque et interface",
      paletteGroupSemantic: "États sémantiques",
      paletteGroupWhatsapp: "WhatsApp Web",
      changeColor: "Modifier",
      resetPaletteMode: "Réinitialiser ce mode",
      resetPaletteAll: "Tout réinitialiser",
      palettePreviewBrand: "Aperçu — interface",
      palettePreviewSemantic: "Aperçu — états sémantiques",
      palettePreviewWhatsapp: "Aperçu — WhatsApp Web",
      palettePreviewMessages: {
        error: "Impossible d'enregistrer.",
        warning: "Vérifiez les données avant de continuer.",
        success: "Modifications enregistrées.",
        info: "La session expire dans 5 minutes.",
      },
            palettePreviewLabels: {
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
      navMenuTitle: "Menu latéral",
      navMenuHint: "Choisissez les sections visibles dans le menu de navigation. Les changements s'appliquent immédiatement sur cet appareil.",
      navMenuMinOne: "Au moins une section doit rester visible dans le menu.",
      navMenuReset: "Tout afficher",
      paletteTokens: {
        sidebar: "Barre latérale",
        primary: "Couleur primaire",
        primaryHover: "Survol primaire",
        canvas: "Fond général",
        surface: "Cartes et panneaux",
        muted: "Texte secondaire",
        border: "Bordures",
        error: "Erreur (texte)",
        errorBg: "Erreur (fond)",
        warning: "Avertissement (texte)",
        warningBg: "Avertissement (fond)",
        success: "Succès (texte)",
        successBg: "Succès (fond)",
        info: "Info (texte)",
        infoBg: "Info (fond)",
        whatsapp: "Bouton WhatsApp",
        whatsappBg: "Panneau (fond)",
        whatsappBorder: "Panneau (bordure)",
        whatsappMuted: "Panneau (texte secondaire)",
      },
      tabs: {
        profile: "Profil",
        clinicalHistory: "Dossier clinique",
        integrations: "Intégrations",
        clinic: "Clinique",
        billing: "Abonnement",
      },
      settingsScope: {
        appliesClinic: "S'applique à toute la clinique.",
        appliesIndependent: "S'applique à votre cabinet indépendant.",
        appliesPractice: "S'applique à votre cabinet.",
      },
      watermark: {
        title: "Filigrane d'arrière-plan",
        hint: "Image discrète dans la zone principale. Ajustez taille, position et intensité.",
        show: "Afficher le filigrane en arrière-plan",
        customImage: "Image personnalisée",
        useProfessionalLogo: "Utiliser le logo professionnel",
        logoHint: "Si vous choisissez le logo professionnel ou de clinique, celui configuré sur cette page est utilisé.",
        loading: "Chargement du filigrane…",
        imageTooLarge: "L'image ne peut pas dépasser 2 Mo.",
        invalidFormat: "Format invalide. Utilisez PNG, JPG ou WebP (max. 2 Mo).",
        loadImageError: "Erreur lors du chargement de l'image.",
        saved: "Filigrane enregistré.",
        saveFailed: "Erreur lors de l'enregistrement.",
        imageLabel: "Image",
        noLogo: "Aucun logo configuré",
        noImage: "Aucune image",
        upload: "Téléverser une image",
        formatHint: "JPEG, PNG or WebP · max. 2 MB",
        removeImage: "Retirer l'image",
        intensity: "Intensité ({pct} %)",
        intensityHint: "6–10% usually looks good as a subtle watermark.",
        size: "Taille ({pct} % du panneau)",
        zoom: "Zoom ({pct} %)",
        zoomHint: "Increase zoom (200%+) to cover the visible area. Combine with centered position.",
        positionX: "Position horizontale ({pct} %)",
        positionY: "Position verticale ({pct} %)",
        left: "Gauche",
        center: "Centre",
        right: "Droite",
        top: "Haut",
        bottom: "Bas",
        saving: "Enregistrement…",
        save: "Enregistrer le filigrane",
      },
      billing: {
        title: "Abonnement",
        subscriptionTitle: "Abonnement PodoAdmin",
        independentPlan: "Plan podologue indépendant",
        status: "État",
        trialPeriod: "Période d'essai",
        trialEnd: "Fin de la période d'essai",
        trialActive: "Période d'essai d'1 mois active. Profitez de l'accès complet jusqu'au {date}",
        adminNoSub: "Les administrateurs de la plateforme n'ont pas besoin d'abonnement.",
        receptionistHint: "L'abonnement de la clinique est géré par l'administrateur de la clinique.",
        statusActive: "Active",
        statusPastDue: "Paiement en attente",
        statusCancelled: "Annulée",
        paymentReceived: "Paiement reçu. L'abonnement s'activera dans quelques secondes.",
        paymentCancelled: "Paiement annulé. Vous pouvez réessayer quand vous voulez.",
        cardVerified: "Carte vérifiée avec succès.",
        cardVerifyError: "Erreur lors de la vérification de la carte.",
        cardMockVerified: "Carte mock vérifiée (développement uniquement).",
        cardSetupError: "Impossible de démarrer la vérification de la carte.",
        trialActivated: "Période d'essai activée.",
        trialActivateError: "Impossible d'activer l'essai.",
        checkoutError: "Impossible de démarrer le paiement.",
        portalError: "Impossible d'ouvrir le portail de facturation.",
        activateTrialTitle: "Activer l'essai gratuit (1 mois)",
        activateTrialHint: "Vérifiez votre e-mail et votre carte. Un compte, une carte et une connexion (IP) ne peuvent être utilisés qu'une seule fois pour l'essai.",
        stepEmail: "1. E-mail vérifié",
        emailVerifyHint: "Vérifiez votre boîte de réception{email} et confirmez le lien de vérification. Si vous ne l'avez pas reçu, déconnectez-vous et redemandez-le lors de l'inscription.",
        stepCard: "2. Carte",
        verifyCard: "Vérifier la carte (sans frais aujourd'hui)",
        activateMonthTrial: "Activer l'essai d'1 mois",
        overLimit: "Votre clinique a {count} podologues actifs, au-dessus des {limit} inclus, et la facturation des sièges supplémentaires n'est pas configurée. Contactez PodoAdmin.",
        overCapacityAfterDowngrade: "Vous avez {count} podologues actifs, plus que les {limit} permis par votre forfait actuel. Ils continuent de fonctionner normalement, mais vous ne pourrez en ajouter aucun tant que vous n'aurez pas acheté de sièges supplémentaires ou réduit votre équipe.",
        loading: "Chargement…",
        clinicPlan: "Plan clinique",
        activePodiatrists: "Podologues actifs :",
        stripeNotConfigured: "Stripe n'est pas configuré. Définissez STRIPE_PRICE_CLINIC_MONTHLY_STANDARD et STRIPE_PRICE_INDEPENDENT_MONTHLY sur le serveur.",
        subscribe: "S'abonner — ${amount} USD/mois",
        manageStripe: "Gérer la facturation dans Stripe",
        clinicManagedByAdmin: "L'abonnement de votre clinique est géré par l'administrateur de la clinique.",
        extraSeatsTitle: "Podologues supplémentaires",
        extraSeatsHint: "Votre forfait inclut {included} podologues. Ajoutez-en autant que nécessaire pour ${price} USD/mois chacun ; le changement est calculé au prorata sur votre facture.",
        extraSeatsLabel: "Podologues supplémentaires",
        extraSeatsSave: "Mettre à jour les podologues supplémentaires",
        extraSeatsSaved: "Podologues supplémentaires mis à jour.",
        extraSeatsTotal: "Supplémentaires : {seats} × ${price} = ${total} USD/mois",
        extraSeatsError: "Impossible de mettre à jour les podologues supplémentaires.",
        extraSeatsBreakdown: "{included} inclus dans votre forfait + {seats} supplémentaires",
        extraSeatsTrialNote: "Pendant l'essai, vous pouvez ajuster vos sièges sans frais. À l'activation de votre abonnement, ${price} USD/mois seront facturés par podologue supplémentaire.",
        extraSeatsTrialSaved: "Sièges de podologues mis à jour. Vous pouvez maintenant ajouter d'autres podologues à votre clinique.",
        growthTitle: "Votre cabinet grandit ?",
        growthHint: "Passez à Premium pour débloquer les analytiques, les outils cliniques avancés et les campagnes WhatsApp, ou passez à un forfait Clinique pour ajouter podologues et accueil.",
        growthClinicBullet: "Forfait Clinique : à partir de 100 $ USD/mois avec 5 podologues inclus (8 en Premium) et podologues supplémentaires pour 10 $ USD/mois.",
        growthContact: "Je veux passer au forfait Clinique",
      },
      dashboardLogo: {
        title: "Logo sur le tableau de bord",
        loading: "Chargement des options du tableau de bord…",
        saved: "Paramètres du logo du tableau de bord enregistrés.",
        saveFailed: "Erreur lors de l'enregistrement.",
        enabledByAdmin: "L'administrateur de la clinique a activé l'affichage du logo sur le tableau de bord.",
        notShown: "Le logo n'est pas affiché sur le tableau de bord.",
        hint: "Carte sur l'écran principal. Ajustez taille, position et intensité.",
        show: "Afficher le logo sur le tableau de bord",
        opacity: "Opacité ({pct} %)",
        size: "Taille ({pct} % de la zone de la carte)",
        zoom: "Zoom ({pct} %)",
        zoomHint: "Enlarge or reduce the logo within the area. The card grows to avoid cropping.",
        positionX: "Position horizontale ({pct} %)",
        positionY: "Position verticale ({pct} %)",
        left: "Gauche",
        center: "Centre",
        right: "Droite",
        top: "Haut",
        bottom: "Bas",
        saving: "Enregistrement…",
        save: "Enregistrer le logo du tableau de bord",
      },
            clinicalLayout: {
        loadingDesigner: "Chargement du concepteur…",
        title: "Concepteur d'histoire clinique",
        hint: "Activez ou désactivez des blocs pour les séances et l'impression. Ajoutez des sections personnalisées selon votre flux clinique.",
        restoreDefault: "Restaurer par défaut",
        saveDesign: "Enregistrer le design",
        addSection: "Ajouter une section",
        editSection: "Modifier la section",
        previewForm: "Aperçu — formulaire de séance",
        newSectionDefault: "Nouvelle section",
        itemN: "Élément {n}",
        columnN: "Colonne {n}",
        saved: "Design enregistré avec succès.",
        saveFailed: "Erreur lors de l'enregistrement.",
        restoreConfirm: "Restaurer toutes les sections au design par défaut ? Les personnalisées seront perdues.",
        saving: "Enregistrement…",
        readOnlyHint: "Lecture seule : l'administrateur de la clinique configure le design partagé.",
        sectionsCount: "Sections ({count})",
        sectionTitlePlaceholder: "Titre de la section",
        titleLabel: "Titre",
        builtinTitleHint: "Vous pouvez personnaliser le titre visible en séance et à l'impression.",
        onPatientCard: "Sur la fiche patient",
        enabled: "Active",
        inSession: "En séance",
        inPrint: "À l'impression",
        patientCardHelp: "shows or hides the field when creating, editing or viewing a patient.",
        printAntecedentsHelp: "includes antecedents in the printed podiatric clinical history.",
        enabledHelp: "includes or excludes the section from the clinical flow.",
        inSessionHelp: "visible when creating or editing a session.",
        inPrintHelp: "included in the printable history (only sections with data).",
        deleteCustomSection: "Supprimer la section personnalisée",
        selectSection: "Sélectionnez une section dans la liste",
        systemField: "Champ système",
        noSessionSections: "Aucune section visible en séance.",
        remove: "Retirer",
        maxColumns: "Maximum {count} colonnes.",
        checklistItems: "Éléments de la liste",
        yesNoNaRows: "Lignes OUI / NON / N/A",
        options: "Options",
        yesNoNaHint: "Each row will be a question in the session.",
        addItem: "+ Ajouter un élément",
        addRow: "+ Ajouter une ligne",
        addOption: "+ Ajouter une option",
        unit: "Unité",
        unitPlaceholder: "min, ml, mm, %…",
        defaultUnit: "unité",
        scaleMax: "Échelle maximale",
        conditionalPrompt: "Question OUI/NON",
        conditionalPlaceholder: "Was there a complication?",
        tableColumns: "Colonnes du tableau",
        tableColumnsHint: "Name each column (e.g. product, quantity, lot).",
        addColumn: "+ Ajouter une colonne",
        tableRows: "Lignes en séance",
      },
      print: {
        title: "Paramètres d'impression",
        hint: "Ajustez l'apparence de l'histoire clinique et des ordonnances à l'impression ou en PDF.",
        preview: "Aperçu",
        loading: "Chargement des préférences d'impression…",
        saved: "Préférences d'impression enregistrées.",
        saveFailed: "Impossible d'enregistrer.",
        readOnlyHint: "Seul l'administrateur de la clinique peut modifier ces options. Affichage en lecture seule.",
        generalTitle: "Général",
        generalDesc: "S'applique aux deux documents.",
        headerAlign: "Alignement de l'en-tête",
        alignLeft: "Gauche",
        alignCenter: "Centré",
        monochrome: "Imprimer en noir et blanc",
        monochromeHint: "Niveaux de gris, idéal pour économiser l'encre.",
        showGeneratedBy: "Afficher « Généré par PodoAdmin » dans le pied",
        footerText: "Texte de pied de page personnalisé",
        footerPlaceholder: "E.g. Business hours, legal notice, social media…",
        historyTitle: "Histoire clinique",
        historyDesc: "Document complet du patient.",
        showLogo: "Afficher le logo dans l'en-tête",
        showLegalData: "Afficher les données légales",
        showLegalDataHint: "RFC, CLUES, COFEPRIS and sanitary registry.",
        includePhotos: "Inclure les photographies cliniques",
        includePhotosHint: "Requires the images block to be active in the designer.",
        compact: "Mise en page compacte",
        compactHistoryHint: "Smaller margins, type and diagrams to save pages.",
        orientation: "Orientation de la page",
        portrait: "Portrait",
        landscape: "Paysage",
        orientationHistoryHint: "Recommended: portrait for clinical histories.",
        evolutionRows: "Lignes d'évolution clinique à imprimer",
        rxTitle: "Ordonnances",
        rxDesc: "Format des ordonnances / prescriptions.",
        showWeight: "Afficher le poids du patient",
        showHeight: "Afficher la taille du patient",
        showNextVisit: "Afficher la prochaine visite",
        showNotes: "Afficher les notes supplémentaires",
        showSignatureCedula: "Afficher le numéro d'ordre sur la signature",
        compactRxHint: "Smaller margins and type to use less space.",
        orientationRxHint: "Recommended: landscape for prescriptions.",
        folioPosition: "Position du folio",
        folioInline: "Dans l'en-tête (recommandé)",
        folioBar: "Barre mise en avant",
        folioHint: "Inline folio saves a full line and usually fits on one page.",
        saving: "Enregistrement…",
        save: "Enregistrer les préférences",
        reset: "Restaurer les valeurs par défaut",
        previewSimHint: "Approximate simulation; the final document uses real patient data.",
        tabHistory: "Histoire clinique",
        tabRx: "Ordonnance",
        statusMonochrome: "Black and white mode on · ",
        statusHeaderCenter: "Centered header",
        statusHeaderLeft: "Left-aligned header",
        statusEvolutionRows: " · {count} evolution rows",
        statusCompact: " · compact layout",
        statusFolioInline: " · folio in header",
        demoClinicName: "Clinique Podologique Démo",
        demoLicense: "License: 12345678",
        demoLegal: "RFC: XAXX010101000 · CLUES: DFSSA000001",
        demoContact: "555 123 4567 · demo@clinic.com",
        demoHistoryTitle: "PODIATRIC CLINICAL HISTORY · Folio: PREMIUM-001",
        demoPatientSection: "I. Patient data",
        demoPatientCells: ["Name: Laura M.", "ID: INE-884422", "Tel: 555…", "DOB: 12/03/1985"],
        demoEvolutionSection: "IV. Clinical evolution",
        demoColDate: "Date",
        demoColDiagnosis: "Diagnosis",
        demoColTreatment: "Treatment",
        demoDiagnosis: "Onychocryptosis",
        demoTreatment: "Debridement",
        demoMoreRows: "+ {count} more rows…",
        demoPhotos: "Photographs",
        demoFooter: "PodoAdmin · preview",
        demoDoctor: "Dr Podologue Démo",
        demoCedula: "License: 12345678",
        demoTel: "Tel: 555 123 4567",
        demoFolio: "Folio:",
        demoFolioBar: "RX FOLIO:",
        demoPatientData: "PATIENT DATA",
        demoName: "Name: Laura M.",
        demoDni: "ID: INE-884422",
        demoAge: "Age: 41 years",
        demoWeight: "Weight: 72.5 kg",
        demoHeight: "Height: 165 cm",
        demoPrescription: "Prescription / Instructions",
        demoPrescriptionBody: "Apply antifungal cream twice daily for 14 days.",
        demoNextVisit: "Next visit",
        demoNextVisitDate: "Friday, August 15, 2026",
        demoNotes: "Additional notes",
        demoNotesBody: "Avoid closed footwear.",
        demoSignature: "Professional signature",
        logoPlaceholder: "LOGO",
      },
      profileAvatar: {
        changeTitle: "Changer la photo de profil",
        invalidFormat: "Format invalide. Utilisez PNG, JPG ou WebP.",
        tooLarge: "L'image ne peut pas dépasser 2 Mo.",
        saveFailed: "Impossible d'enregistrer la photo.",
        processFailed: "Impossible de traiter l'image.",
        removeFailed: "Impossible de retirer la photo.",
        saving: "Enregistrement…",
        changePhoto: "Changer la photo",
        uploadPhoto: "Téléverser une photo",
        removePhoto: "Retirer la photo",
        hint: "JPG, PNG ou WebP. Max. 2 Mo. Affichée dans le menu latéral.",
      },
      profile: {
        title: "Profil utilisateur",
        name: "Nom",
        email: "E-mail",
        readOnlyHint: "Les données du profil ne peuvent pas être modifiées ici. Contactez un administrateur si besoin.",
      },
      cooldown: {
        logoPolicy: "Après enregistrement, le logo est verrouillé pendant 15 jours. Passé ce délai, vous pourrez le téléverser ou le changer à nouveau.",
        logoBlocked: "Le logo ne peut être modifié que tous les 15 jours.",
        clinicInfoPolicy: "Après enregistrement, les données de la clinique sont verrouillées pendant 15 jours. Passé ce délai, vous pourrez les modifier à nouveau.",
        clinicInfoBlocked: "Les données ne peuvent être modifiées que tous les 15 jours.",
        professionalInfoPolicy: "Après enregistrement, ces données sont verrouillées pendant 15 jours. Passé ce délai, vous pourrez les modifier à nouveau.",
        professionalInfoBlocked: "Les données ne peuvent être modifiées que tous les 15 jours.",
        profilePolicy: "Le nom et l'e-mail ne peuvent être modifiés que par un administrateur. 15 jours doivent s'écouler entre les modifications.",
        clinicReadOnlyPolicy: "Les informations de la clinique sont gérées par votre administrateur. 15 jours doivent s'écouler entre les modifications.",
        genericBlocked: "Les données ne peuvent être modifiées que tous les 15 jours.",
      },
      clinic: {
        fallbackName: "Clinique {id}",
        errors: {
          nameCodeRequired: "Le nom et le code de la clinique sont obligatoires.",
          invalidWebsite: "L'URL du site web n'est pas valide. Vérifiez qu'elle est correctement configurée.",
        },
      },
      consent: {
        title: "Consentement éclairé",
        sharedTitle: "Texte partagé de la clinique",
        sharedBody: "Ce texte est géré par l'administrateur de la clinique et utilisé pour le consentement des patients.",
        currentVersion: "Version actuelle : {version}",
        empty: "Aucun texte configuré.",
        editHint: "Vous pouvez modifier le texte ; chaque enregistrement incrémente la version.",
        placeholder: "Rédigez ici les conditions et le consentement éclairé que le patient doit accepter.",
        save: "Enregistrer le consentement",
        saveError: "Erreur lors de l'enregistrement du consentement.",
      },
      logo: {
        empty: "Sans logo",
        previewAlt: "Aperçu",
        upload: "Téléverser une image",
        formatHint: "PNG, JPG ou WebP · max 2 Mo",
        save: "Enregistrer le logo",
        remove: "Supprimer le logo",
        errors: {
          invalidFormat: "Format invalide. Utilisez PNG, JPG ou WebP (max 2 Mo).",
          tooLarge: "Le fichier est trop volumineux. Maximum 2 Mo.",
          processFailed: "Impossible de traiter l'image.",
          cooldown: "Le logo ne peut être modifié que tous les 15 jours.",
          saveFailed: "Impossible d'enregistrer le logo. Réessayez.",
        },
      },
      clinicLogo: {
        title: "Logo de la clinique",
        sharedTitle: "Logo partagé de la clinique",
        sharedBody: "Tous les professionnels de la clinique voient ce logo sur les documents et impressions.",
        alt: "Logo de clinique",
        uploadHint: "Téléversez le logo qui identifiera votre clinique dans l'application et les documents.",
      },
      professionalLogo: {
        title: "Logo professionnel",
        uploadHint: "Logo personnel pour documents et impression lorsqu'il n'y a pas de logo de clinique.",
        alt: "Logo professionnel",
      },
      adminLogo: {
        title: "Logo de clinique",
        body: "Les logos de clinique sont gérés par les administrateurs de chaque clinique. En tant que {role}, vous n'avez pas besoin d'un logo personnel.",
      },
      assignedPodiatrists: {
        title: "Podologues assignés",
        clinicHint: "Podologues de votre clinique que vous pouvez servir. Cochez ou décochez pour gérer rendez-vous et patients de chacun.",
        independentHint: "Podologue qui vous a assigné. Vous pouvez créer des patients et gérer son calendrier.",
        emptyClinic: "Aucun podologue dans votre clinique.",
        save: "Enregistrer l'affectation",
        empty: "Aucun podologue assigné.",
      },
      receptionist: {
        title: "Réceptionniste",
        description: "Créez et gérez la réceptionniste liée à votre compte ou clinique.",
        status: {
          blocked: "Bloquée",
          disabled: "Désactivée",
          active: "Active",
        },
        unblock: "Débloquer",
        block: "Bloquer",
        enable: "Activer",
        disable: "Désactiver",
        delete: "Supprimer",
        oneOnlyHint: "Vous ne pouvez avoir qu'une réceptionniste liée. Supprimez-la pour en créer une autre.",
        fields: {
          name: "Nom",
          email: "E-mail",
          initialPassword: "Mot de passe initial",
        },
        createdSuccess: "Réceptionniste créée avec succès.",
        create: "Créer une réceptionniste",
        createError: "Erreur lors de la création de la réceptionniste",
        confirmDelete: "Supprimer cette réceptionniste ? Action irréversible.",
      },
      clinicInfo: {
        title: "Informations de la clinique",
        subtitle: "Coordonnées et données fiscales de votre clinique.",
        setupBanner: "Complétez les données de votre clinique. Tant que le nom est provisoire ou que contact et adresse manquent, des alertes apparaîtront.",
        clinicName: "Nom de la clinique *",
        clinicNamePlaceholder: "Ma Clinique Podologique",
        clinicCode: "Code (pour folios) *",
        clinicCodePlaceholder: "MICP",
        clinicCodeHint: "Max 8 caractères. Utilisé dans les folios (ex. : MICP-2025-001)",
        country: "Pays (préfixe téléphonique)",
        countryHint: "Préfixe par défaut pour les téléphones de la clinique.",
        phone: "Téléphone",
        email: "E-mail",
        emailPlaceholder: "clinique@exemple.com",
        address: "Adresse",
        addressPlaceholder: "Rue Principale 45, 2e étage",
        city: "Ville",
        cityPlaceholder: "Madrid",
        postalCode: "Code postal",
        postalCodePlaceholder: "28013",
        mapsUrl: "Lien Google Maps (optionnel)",
        mapsUrlPlaceholder: "https://maps.app.goo.gl/...",
        mapsUrlHint: "Utilisé comme localisation dans WhatsApp quand l'adresse seule ne suffit pas à générer un lien utile.",
        licenseNumber: "N° licence / registre",
        licensePlaceholder: "CS-28/2024-POD-001",
        website: "Site web (optionnel)",
        websitePlaceholder: "https://www.maclinique.com",
        legalName: "Raison sociale (NOM)",
        rfc: "RFC",
        clues: "CLUES",
        cofepris: "Enregistrement COFEPRIS",
        readOnlyTitle: "Détails de votre clinique",
        readOnlyBody: "Lecture seule. Votre administrateur de clinique gère ces données.",
        labels: {
          name: "Nom :",
          phone: "Téléphone :",
          email: "E-mail :",
          address: "Adresse :",
          maps: "Maps :",
          license: "Licence :",
          consent: "Consentement :",
          web: "Web :",
        },
        viewDocument: "Voir le document",
      },
      practice: {
        title: "Informations du cabinet",
        subtitle: "Données de votre pratique professionnelle indépendante.",
        professionalName: "Nom professionnel",
        namePlaceholder: "Dr Jean Dupont",
        country: "Pays (préfixe téléphonique)",
        countryHint: "Préfixe par défaut pour votre cabinet.",
        emailPlaceholder: "cabinet@exemple.com",
        sanitaryRegistry: "Registre sanitaire",
        cedula: "Numéro professionnel",
        cedulaPlaceholder: "12345678",
      },
      credentials: {
        title: "Identifiants professionnels",
        subtitle: "Téléphone de contact et numéro d'enregistrement professionnel.",
        contactPhoneTitle: "Téléphone de contact",
        contactPhoneHint: "Visible pour les patients et sur les documents le cas échéant.",
        country: "Pays",
        mobile: "Mobile",
        savePhone: "Enregistrer le téléphone",
        registryNumber: "N° d'enregistrement professionnel",
        registryPlaceholder: "REG-2024-001",
        save: "Enregistrer les identifiants",
        clinicInfoTitle: "Informations de la clinique",
        clinicInfoBody: "En tant que membre d'une clinique, ces données sont gérées par l'administrateur.",
        clinicName: "Nom de la clinique",
      },
      common: {
        saved: "Enregistré",
        readOnly: "Lecture seule",
        saveInfo: "Enregistrer les informations",
        emDash: "—",
        ellipsis: "...",
      },
      errors: {
        connectionSave: "Erreur de connexion lors de l'enregistrement.",
      },
      supportSenderLabel: "PodoAdmin",
    },
    premium: {
      badge: "Premium",
      baseBadge: "Base",
      lockedTab: "Disponible en Premium",
      upsellTitle: "Disponible dans le plan Premium",
      upsellBody: "Les analyses de ventes, encaissements, rentabilité et agenda sont incluses dans le plan Premium. Passez au plan supérieur pour les débloquer.",
      upsellCta: "Voir les plans et mettre à niveau",
      clinicalToolsLockedTitle: "Outils cliniques est une fonctionnalité Premium",
      clinicalToolsLockedBody: "Le concepteur de modèles, l'inventaire et les orientations sont inclus dans le plan Premium.",
      campaignsLockedTitle: "Campagnes WhatsApp est une fonctionnalité Premium",
      campaignsLockedBody: "Les campagnes et la réactivation des patients via WhatsApp sont incluses dans le plan Premium. WhatsApp Web basique reste disponible dans votre plan.",
      agendaAnalyticsLockedBody: "L'analyse de la demande, de l'occupation et des clôtures quotidiennes est incluse dans le plan Premium.",
      upgradeButton: "Passer à Premium",
      upgradeSuccess: "Votre plan a été mis à jour avec succès.",
      planBase: "Plan Base",
      planPremium: "Plan Premium",
      menuManagePlan: "Plan (Base/Premium)",
      planPrompt: "Plan actuel : {current}. Tapez \"base\", \"premium\" ou \"auto\" (auto = selon le paiement Stripe) :",
      planInvalid: "Valeur invalide. Utilisez \"base\", \"premium\" ou \"auto\".",
      planUpdated: "Plan mis à jour : {tier}.",
    },

    reservationAction: {
      confirmTitle: "Confirmer le rendez-vous",
      cancelTitle: "Annuler le rendez-vous",
      rescheduleTitle: "Reprogrammer le rendez-vous",
      loading: "Chargement de votre réservation…",
      greeting: "Bonjour {name},",
      confirmQuestion: "Confirmez-vous votre présence à ce rendez-vous ?",
      cancelQuestion: "Voulez-vous vraiment annuler ce rendez-vous ?",
      dateLabel: "Date",
      timeLabel: "Heure",
      clinicLabel: "Clinique",
      podiatristLabel: "Praticien",
      confirmButton: "Confirmer ma présence",
      cancelButton: "Annuler le rendez-vous",
      confirmedOk: "Rendez-vous confirmé ! À bientôt.",
      cancelledOk: "Votre rendez-vous a été annulé. Merci de nous avoir prévenus.",
      rescheduledOk: "Votre rendez-vous a été annulé. Nous vous recontacterons bientôt pour le reprogrammer.",
      alreadyConfirmed: "Ce rendez-vous était déjà confirmé. À bientôt !",
      alreadyCancelled: "Ce rendez-vous était déjà annulé.",
      invalidMsg: "Ce lien n'est pas valide ou n'est plus disponible.",
      expiredMsg: "Ce rendez-vous est déjà passé ; le lien n'est plus disponible.",
      errorGeneric: "Impossible de traiter votre demande. Réessayez dans quelques minutes.",
      processingConfirm: "Confirmation de votre rendez-vous…",
      processingCancel: "Annulation de votre rendez-vous…",
      processingReschedule: "Traitement de votre demande de reprogrammation…",
      changedMindToCancel: "Vous avez changé d'avis ? Annuler ce rendez-vous",
      changedMindToConfirm: "Vous avez changé d'avis ? Confirmer ma présence",
      slotTaken: "Le créneau horaire a été occupé par un autre patient. Impossible de reconfirmer.",
      pageCloseable: "Votre confirmation a été enregistrée avec succès. Vous pouvez maintenant fermer cette page.",
      closePageNow: "Fermer maintenant",
      keepOpen: "Garder ouverte",
      cantAutoClose: "Veuillez fermer cette fenêtre manuellement",
      satisfactionTitle: "Votre avis",
      satisfactionProcessing: "Enregistrement de votre avis…",
      thanksGood: "Merci ! Nous sommes ravis que votre visite ait été excellente.",
      thanksRegular: "Merci pour votre avis. Que pourrions-nous améliorer ?",
      thanksBad: "Nous sommes désolés que votre visite n'ait pas été bonne. Dites-nous ce qui s'est passé pour nous améliorer.",
      reviewCta: "Laissez-nous un avis sur Google",
      complaintPrompt: "Réclamations ou suggestions (facultatif)",
      complaintPlaceholder: "Dites-nous en détail ce que nous pouvons améliorer…",
      anonymousLabel: "Envoyer anonymement",
      sendComment: "Envoyer le commentaire",
      commentSent: "Merci ! Nous avons reçu votre commentaire et y donnerons suite.",
      sending: "Envoi…",
      bookingTitle: "Réservez votre rendez-vous",
      bookingInvalid: "Ce lien n'est pas disponible.",
      bookingPickDate: "Choisissez un jour",
      bookingPickTime: "Choisissez une heure",
      bookingLoadingSlots: "Chargement des horaires…",
      bookingNoSlots: "Aucun horaire disponible ce jour-là.",
      bookingName: "Votre nom",
      bookingPhone: "Votre WhatsApp (pour confirmer)",
      bookingConfirm: "Confirmer le rendez-vous",
      bookingBooking: "Réservation…",
      bookingDoneTitle: "Rendez-vous réservé !",
      bookingDoneMsg: "À bientôt le {date} à {time}. Nous vous contacterons pour confirmer.",
      bookingSlotTaken: "Cet horaire vient d'être pris. Veuillez en choisir un autre.",
    },

    support: {
      title: "Contacter PodoAdmin",
      contactPodoAdmin: "Contacter PodoAdmin",
      contactSubtitle: "Envoyez un message direct au support. Nous répondrons dès que possible.",
      newConversation: "Nouveau message",
      subject: "Sujet",
      subjectPlaceholder: "Ex : Problème de facturation",
      message: "Message",
      messagePlaceholder: "Décrivez votre question ou problème...",
      send: "Envoyer",
      myConversations: "Mes conversations",
      noConversations: "Vous n'avez pas encore de conversations.",
      reply: "Répondre",
      replyPlaceholder: "Écrivez votre réponse...",
      open: "Ouverte",
      closed: "Fermée",
      markAsRead: "Marquer comme lu",
      closeConversation: "Fermer la conversation",
      reopenConversation: "Rouvrir la conversation",
      from: "De",
      sent: "Envoyé",
    },
    layout: {
      brandFallback: "PodoAdmin",
      unlockSidebarVisible: "Déverrouiller (verrouillé visible)",
      unlockSidebarHidden: "Déverrouiller (verrouillé masqué)",
      lockSidebarVisible: "Verrouiller la barre latérale visible",
      toggleSidebarLock: "Basculer le verrouillage de la barre latérale",
      hideMenu: "Masquer le menu",
      showMenu: "Afficher le menu",
      pendingAccessBanner: "Votre accès clinique est en attente. Activez le paiement dans Facturation ou attendez qu'un administrateur active votre compte.",
      goToBilling: "Aller à la facturation",
      goToSupport: "Aller au support",
      subscriptionInactiveBanner: "Votre abonnement n'est pas actif. Renouvelez pour continuer à utiliser la plateforme.",
      closeMenu: "Fermer le menu",
      sponsored: "Sponsorisé",
      closeAnnouncement: "Fermer l'annonce",
      promoCodeOnSite: "Code sur le site de l'organisateur :",
      seeMore: "Voir plus",
      interested: "Ça m'intéresse",
      interestRegistered: "Intérêt enregistré ✓",
    },
    whatsapp: {
      title: "WhatsApp Business",
      subtitle:
        "Connectez votre numéro Meta pour les rappels de rendez-vous par WhatsApp. Les données sont chiffrées. Seuls vous (podologue ou admin de clinique) pouvez configurer cette section.",
      loading: "Chargement de la configuration WhatsApp…",
      setupTitle: "Configurer WhatsApp (jeton longue durée)",
      setupStep1Prefix: "Accédez à",
      setupStep1Link: "Business Settings → Utilisateurs système",
      setupStep1Suffix: "et créez un utilisateur système.",
      setupStep2: "Assignez votre app Meta et votre compte WhatsApp Business (WABA) comme actifs.",
      setupStep3: "Générez un jeton pour cet utilisateur et accordez les permissions WhatsApp.",
      setupStep4Prefix: "Depuis",
      setupStep4Link: "Meta for Developers",
      setupStep4Suffix: "copiez aussi Phone Number ID et WABA ID.",
      setupStep5: "Collez les données dans ce formulaire, enregistrez et cliquez sur « Tester la connexion ».",
      statusLabel: "État :",
      statusConnected: "connecté",
      statusError: "erreur",
      statusPending: "en attente",
      phoneNumberIdLabel: "Phone Number ID (Meta) *",
      phoneNumberIdPlaceholder: "Ex. : 123456789012345",
      wabaIdLabel: "WhatsApp Business Account ID (optionnel)",
      wabaIdPlaceholder: "WABA ID",
      accessTokenLabel: "Jeton d'accès permanent",
      accessTokenRequired: "*",
      accessTokenKeepCurrent: "(laisser vide pour conserver l'actuel)",
      accessTokenPlaceholderSaved: "•••••••• (enregistré)",
      accessTokenPlaceholderNew: "Jeton depuis Meta Business Suite",
      hideTokenField: "Masquer le champ jeton",
      changeToken: "Changer le jeton",
      publicPhoneLabel: "Téléphone public (optionnel)",
      publicPhonePlaceholder: "+33600111222",
      remindersSection: "Rappels de rendez-vous",
      remindersAuto: "Activer les rappels automatiques WhatsApp (patients avec téléphone uniquement)",
      reminderDaysBefore: "Jours avant le rendez-vous",
      reminderHoursBefore: "Heures avant le rendez-vous",
      reminderHourBefore: "{hours} h avant",
      reminderDayOne: "{days} jour avant",
      reminderDayMany: "{days} jours avant",
      reminderSelectHour: "Délai du rappel",
      reminderAddHour: "+ Ajouter un horaire",
      reminderRemoveHour: "Retirer",
      reminderHoursHint: "Jusqu'à 8 rappels par heures. Les jours (5, 2, 1) sont indépendants.",
      reminderScheduleHint: "Activez les rappels automatiques ci-dessus pour modifier le calendrier.",
      reminderDaysHelp: "Cliquez sur chaque option pour l'activer ou la désactiver (au moins une).",
      reminderHoursHelp: "Choisissez dans chaque liste combien d'heures avant prévenir.",
      reminderDaysRequired: "Sélectionnez au moins un jour de rappel.",
      reminder48h: "48 h avant",
      reminder24h: "24 h avant",
      templateNameLabel: "Nom du modèle Meta (rappel)",
      templateNamePlaceholder: "ex. : appointment_reminder",
      templateHint:
        "Doit être approuvé dans Meta Business Manager avec 4 variables : {{1}} nom, {{2}} date, {{3}} heure, {{4}} notes/extras.",
      defaultExtraNoteLabel: "Note ou message extra par défaut",
      defaultExtraNotePlaceholder: "Ex. : Apportez vos examens. Parking rue latérale.",
      defaultExtraNoteHint:
        "Envoyé comme 4e paramètre du modèle (sauf autre note à l'envoi). Max 500 caractères.",
      templateLanguageLabel: "Langue du modèle",
      templateLanguagePlaceholder: "fr",
            integrationActive: "Intégration active (envois activés quand le cron est actif)",
      receptionistApiEnabled: "Autoriser la réception à utiliser l'envoi automatique via l'API Meta (rappels et historique).",
      save: "Enregistrer",
      saving: "Enregistrement…",
      testConnection: "Tester la connexion",
      testing: "Test…",
      disconnect: "Déconnecter",
      guidesFooter: "Guides officiels :",
      guidesCloudApi: "Meta WhatsApp Cloud API",
      guidesSystemUsers: "System Users (jeton longue durée)",
      consentNote: "Les patients doivent avoir consenti aux messages WhatsApp.",
      purposeTitle: "À quoi sert cette section ?",
      purposeDescription:
        "Connectez votre compte WhatsApp Business (Meta) pour envoyer des rappels de rendez-vous. Enregistrez le jeton et le modèle approuvé ; puis utilisez « Messages WhatsApp » pour envoyer et voir le statut.",
      errorApiUnavailable:
        "Impossible de joindre le service WhatsApp sur le serveur. Rechargez la page (Ctrl+F5). Si cela persiste, redémarrez le serveur de développement.",
      errorLoad: "Impossible de charger la configuration",
      errorPhoneRequired: "Le Phone Number ID Meta est obligatoire.",
      errorTokenRequired: "Le jeton d'accès permanent Meta est obligatoire.",
      errorTemplateRequired: "Indiquez le nom du modèle Meta approuvé pour les rappels.",
      errorSave: "Erreur lors de l'enregistrement",
      errorTest: "Erreur lors du test de connexion",
      errorTestFailed: "Le test de connexion a échoué",
      errorDisconnect: "Erreur lors de la déconnexion",
      disconnectConfirm: "Supprimer la configuration WhatsApp ? Les rappels automatiques s'arrêteront.",
      successSaved: "Configuration WhatsApp enregistrée.",
      successSavedWarning: "Enregistré. Avertissement connexion : {warning}",
      successTest: "Connexion réussie avec Meta.",
      successTestWithPhone: "Connexion réussie ({phone})",
      successDisconnected: "WhatsApp déconnecté.",
      campaigns: {
        title: "Campagnes WhatsApp",
        pageHint: "Diffusez des messages aux patients avec téléphone. Utilisez WhatsApp Web (manuel, sans API) ou l'envoi automatique via l'API Meta si configuré.",
        webTitle: "Campagnes via WhatsApp Web",
        webHint: "Créez le brouillon et envoyez patient par patient avec wa.me. Sans Meta : vous appuyez sur Envoyer dans WhatsApp.",
        openWeb: "Ouvrir WhatsApp Web",
        newDraft: "Nouvelle campagne (brouillon)",
        metaApiTitle: "Envoi automatique via l'API Meta",
        metaApiHint: "Nécessite WhatsApp Business configuré dans Paramètres. Vous pouvez ignorer cette section si vous n'utilisez que WhatsApp Web.",
        denied: "Pas d'autorisation pour les campagnes WhatsApp.",
        patientsLoadError: "Erreur patients",
        draftCreated: "Campagne créée en brouillon",
        createError: "Erreur lors de la création",
        sendConfirm: "Envoyer cette campagne via l'API Meta à tous les patients avec téléphone ?",
        apiSendResult: "API : envoyés {sent}, échoués {failed}",
        apiSendError: "Erreur d'envoi via API",
        namePlaceholder: "Nom interne (ex. Promo été)",
        messagePlaceholder: "Message avec variables, ex. :\nBonjour {{nombre}}, nous vous informons que...",
        variablesHint: "Variables :",
        variablesList: "{{nombre}} (prénom), {{apellido}} (nom), {{nombre_completo}} (nom complet)",
        clinicOnlyFilter: "Uniquement les patients de ma clinique",
        recipientsWithPhone: "Destinataires avec téléphone valide :",
        recipientsMismatchHint: "Il y a {count} patient(s) dans votre liste ; vérifiez qu'ils ont un téléphone d'au moins 8 chiffres ou décochez « Uniquement les patients de ma clinique ».",
        patientsLoadFailed: "Impossible de charger les patients. Vérifiez les permissions ou rechargez la page.",
        noPatientsYet: "Il n'y a pas encore de patients dans la liste.",
        saveDraft: "Enregistrer le brouillon",
        assistantTitle: "Assistant d'envoi — {name}",
        assistantPatientOf: "Patient {current} sur {total} :",
        openWhatsApp: "Ouvrir WhatsApp",
        assistantDone: "Assistant terminé : {count} patients.",
        finish: "Terminer",
        nextPatient: "Patient suivant",
        draftsToSend: "Brouillons à envoyer",
        loading: "Chargement…",
        recipientsCount: "{count} destinataire(s) avec WhatsApp",
        sendAssistant: "Assistant d'envoi",
        deleteDraft: "Supprimer",
        deleteDraftConfirm: "Supprimer le brouillon « {name} » ? Cette action est irréversible.",
        deleteDraftError: "Impossible de supprimer le brouillon.",
        hideList: "Masquer la liste",
        showList: "Voir la liste",
        noValidRecipients: "Aucun destinataire valide.",
        noDrafts: "Aucun brouillon. Créez une campagne ci-dessus.",
        connected: "(connecté)",
        optional: "(optionnel)",
        receptionistApiHint: "Envoi automatique activé par votre podologue.",
        receptionistApiDisabled: "Votre podologue n'a pas encore activé l'envoi automatique via l'API Meta pour la réception.",
        configureApiHint: "Configurez WhatsApp Business dans Paramètres pour envoyer des campagnes via l'API Meta.",
        allCampaigns: "Toutes les campagnes",
        sentAt: "envoyée {date}",
        sending: "Envoi…",
        sendByApi: "Envoyer via API",
        noCampaigns: "Aucune campagne",
      },
      messages: {
        title: "Messages WhatsApp",
        webTitle: "Rappels via WhatsApp Web",
        webHint: "Sans configurer l'API Meta. Ouvrez WhatsApp Web ou l'appli avec le message prêt ; vous l'envoyez manuellement.",
        openWeb: "Ouvrir WhatsApp Web",
        metaApiTitle: "Envoi automatique avec l'API Meta",
        metaApiHint: "Nécessite l'API Meta configurée dans Paramètres → WhatsApp.",
        historyTitle: "Historique (API automatique)",
        historyHint: "Journal des envois automatiques via l'API Meta. Les rappels WhatsApp Web ne sont pas enregistrés ici.",
        denied: "Vous n'avez pas l'autorisation de voir cette section.",
        patientFallback: "Patient",
        defaultExtraNote: "Veuillez confirmer votre présence en répondant à ce message.",
        noValidPhone: "Pas de téléphone valide pour {name}.",
        selectAppointmentFirst: "Sélectionnez d'abord un rendez-vous.",
        reminderSendError: "Impossible d'envoyer le rappel.",
        reminderSent: "Rappel envoyé avec succès.",
        defaultMessage: "Message par défaut",
        variablesHint: "Variables :",
        variablesList: "{{nombre}} (prénom), {{fecha}} (date), {{hora}} (heure), {{nota}} (note), {{confirmar}} (lien de confirmation), {{cancelar}} (lien d'annulation), {{reagendar}} (lien de reprogrammation)",
        extraNotePlaceholder: "Note extra pour tous les envois d'aujourd'hui (optionnel)",
        saved: "Enregistré",
        saveMessage: "Enregistrer le message",
        dayOffsetLabel: "Rappels pour :",
        dayOffsetToday: "Aujourd'hui",
        dayOffsetTomorrow: "Demain",
        dayOffsetIn2Days: "Dans 2 jours",
        dayOffsetIn5Days: "Dans 5 jours",
        tomorrowAppointments: "Rendez-vous du {date}",
        loadingAppointments: "Chargement des rendez-vous…",
        noTomorrowAppointments: "Aucun rendez-vous prévu pour ce jour.",
        noPhone: "Sans téléphone",
        sendViaWhatsApp: "Envoyer via WhatsApp",
        connected: "(connecté)",
        optional: "(optionnel)",
        receptionistApiHint: "Envoi automatique activé par votre podologue. Les rappels sont envoyés sans ouvrir WhatsApp Web.",
        configLoadError: "Impossible d'obtenir l'état de WhatsApp.",
        connectedLabel: "Connecté",
        apiStatusLabel: "État API",
        templateLabel: "Modèle",
        templateUndefined: "Non défini",
        lastErrorLabel: "Dernière erreur",
        noErrors: "Aucune erreur",
        sendAutoReminder: "Envoyer un rappel automatique",
        selectUpcomingAppointment: "Sélectionnez un rendez-vous à venir",
        sending: "Envoi...",
        sendByApi: "Envoyer via API",
        singleExtraNotePlaceholder: "Note extra pour cet envoi (optionnel)",
        lastApiSends: "Derniers envois API",
        refresh: "Actualiser",
        loadingHistory: "Chargement de l'historique...",
        configureForHistory: "Configurez WhatsApp Business dans Paramètres pour utiliser l'envoi automatique et voir l'historique ici.",
        noApiSends: "Aucun envoi API. Les rappels WhatsApp Web ne sont pas enregistrés ici.",
        colDate: "Date",
        colPatient: "Patient",
        colPhone: "Téléphone",
        colStatus: "État",
        colNote: "Note",
        emDash: "—",
        yes: "Oui",
        no: "Non",
        pendingRescheduleTitle: "En attente de reprogrammation",
        pendingRescheduleHint: "Rendez-vous annulés sans nouvelle date encore programmée pour le même patient.",
        loadingPendingReschedule: "Chargement des reprogrammations en attente…",
        noPendingReschedule: "Aucun rendez-vous en attente de reprogrammation.",
        cancelledOn: "Annulé le {date}",
        sendRescheduleMessage: "Signaler reprogrammation",
        rescheduleWhatsAppMessage: "Bonjour {name}, votre rendez-vous du {date} a été annulé. Nous vous recontacterons bientôt pour le reprogrammer. Merci de votre patience !",
        rescheduleWaMsgTitle: "Message WhatsApp pour signaler la reprogrammation",
        rescheduleWaMsgHint: "Texte envoyé en cliquant « Signaler reprogrammation ». Variables : {name}, {date} et {reserva} (insère votre lien de réservation en ligne pour que le patient réserve lui-même).",
        rescheduleMessageSectionTitle: "Message personnalisé de reprogrammation",
        rescheduleMessageHint: "Texte affiché au patient sur la page ouverte depuis le lien {{reagendar}} du message WhatsApp. S'il est vide, un message par défaut est utilisé.",
        rescheduleMessagePlaceholder: "Ex. Votre rendez-vous a été annulé. Écrivez-nous sur WhatsApp pour reprogrammer plus vite.",
        rescheduleMessageScope: "Périmètre : {label}",
        rescheduleMessageReadOnlyHint: "Lecture seule : défini par votre podologue ou l'admin de la clinique.",
        savingRescheduleMessage: "Enregistrement…",
        saveRescheduleMessageButton: "Enregistrer le message",
        markRescheduleHandled: "Marquer en gestion",
        reopenReschedule: "Rouvrir",
        rescheduleHandledBadge: "En gestion",
        dismissReschedule: "Retirer",
        dismissRescheduleConfirm: "Retirer {name} des reprogrammations en attente ? Le rendez-vous n'est pas supprimé, il quitte juste cette liste.",
        opinionSectionTitle: "Demander un avis (satisfaction)",
        opinionSectionHint: "Rendez-vous honorés ces 7 derniers jours sans avis. Envoyez au patient les liens 👍 😐 👎 via WhatsApp.",
        loadingOpinion: "Chargement des rendez-vous honorés…",
        noOpinionCandidates: "Aucun rendez-vous honoré en attente d'avis.",
        attendedOn: "Honoré le {date}",
        requestOpinion: "Demander un avis",
        opinionWhatsAppMessage:
          "Bonjour {name}, comment s'est passée votre visite à {clinica} ? Votre avis nous aide beaucoup :\n👍 Bien : {good}\n😐 Moyen : {regular}\n👎 Mauvais : {bad}",
        bookingLinkTitle: "Réservation en ligne",
        bookingLinkHint: "Partagez ce lien avec vos patients pour qu'ils réservent eux-mêmes. Il affiche la marque de votre clinique ; ils ne voient jamais PodoAdmin.",
        bookingLinkEnabled: "Réservation en ligne activée",
        bookingLinkDisabled: "Activer la réservation en ligne",
        bookingLinkCopy: "Copier le lien",
        bookingLinkCopied: "Copié !",
      },
    },
    clinicalTools: {
      title: "Outils cliniques",
      denied: "Vous n'avez pas l'autorisation d'accéder à cette section.",
      tabTemplates: "Modèles de séance",
      tabInventory: "Inventaire",
      tabReferrals: "Orientations",
      templatesHint: "Définissez des historiques cliniques prédéfinis (cor, ongle incarné, etc.) à charger à l'ouverture d'une séance.",
      newTemplate: "Nouveau modèle",
      create: "Créer",
      creating: "Création…",
      category: "Catégorie",
      inventoryName: "Nom du matériel",
      unit: "Unité",
      add: "Ajouter",
      emptyInventory: "Aucun matériel enregistré",
      patientId: "ID patient",
      referTo: "Orienter vers",
      reason: "Motif",
      registerReferral: "Enregistrer l'orientation",
      emptyReferrals: "Aucune orientation",
      nameRequired: "Indiquez un nom pour le modèle.",
      templateCreated: "Modèle créé. Modifiez-le pour choisir les sections et le contenu.",
      createFailed: "Impossible de créer le modèle.",
      presetCreated: "Modèle « {name} » créé.",
      templateUpdated: "Modèle mis à jour.",
      saveFailed: "Impossible d'enregistrer le modèle.",
      deleteConfirm: "Supprimer le modèle « {name} » ? Cette action est irréversible.",
      templateDeleted: "Modèle supprimé.",
      deleteFailed: "Impossible de supprimer le modèle.",
      invalidQuantity: "Indiquez une quantité valide (0 ou plus).",
      defaultUnit: "unité",
      inventoryAdded: "Matériel enregistré.",
      genericError: "Erreur",
      referralAdded: "Orientation enregistrée.",
      namePlaceholder: "Nom (ex. Callosité 1er orteil)",
      scopeLabel: "Portée :",
      scopePersonal: "Moi uniquement",
      scopeClinic: "Cabinet (tous les podologues)",
      clinicAdminHint: "En tant qu'administrateur de clinique, les modèles sont partagés avec tout le cabinet.",
      sectionsCount: "{count} sections",
      close: "Fermer",
      edit: "Modifier",
      deleting: "Suppression…",
      delete: "Supprimer",
      nameLabel: "Nom",
      shareWithClinic: "Partager avec le cabinet",
      saving: "Enregistrement…",
      saveTemplate: "Enregistrer le modèle",
      emptyTemplates: "Aucun modèle. Créez-en un vide ou utilisez les raccourcis callosité / ongle incarné.",
      quantityPlaceholder: "Quantité",
      quantityAria: "Quantité",
      patientPrefix: "Patient :",
      scopeShared: "Cabinet",
      scopePersonalShort: "Personnel",
    },
    systemDiagnostics: {
      title: "État du système",
      subtitle: "Vérifiez le worker, la base de données et l'URL de santé publique ; guide rapide en cas d'incident.",
      sectionStatus: "État opérationnel",
      workerLabel: "API / Worker",
      databaseLabel: "Base de données (D1)",
      statusOk: "OK",
      statusError: "Erreur",
      latencyLabel: "Latence",
      environmentSection: "Environnement (NODE_ENV)",
      checkedAtLabel: "Dernière vérification",
      refresh: "Actualiser",
      loadError: "Impossible de charger le diagnostic.",
      publicHealthTitle: "Surveillance externe",
      publicHealthDesc:
        "Vous pouvez utiliser cette URL dans des outils de disponibilité (vérifie seulement que le worker répond, sans interroger D1) :",
      sessionHealthUrlLabel: "Depuis cette session (origine du navigateur)",
      productionHealthUrlLabel: "URL publique pour la surveillance (domaine configuré sur le Worker)",
      productionHealthNote:
        "En développement vous verrez localhost ; c'est normal. En production ouvrez l'app avec votre domaine réel. Pour afficher ici l'URL de production même en localhost, définissez OFFICIAL_APP_DOMAIN ou ALLOWED_ORIGINS dans les variables du Worker Cloudflare. Les moniteurs externes doivent cibler l'URL de production, pas votre PC.",
      sectionGuide: "En cas d'erreurs ou de panne",
      guideIntro: "Pour cibler et signaler un problème :",
      guideItem1: "Notez l'heure approximative, l'écran et l'action en cours.",
      guideItem2:
        "En cas d'erreur API, le client expose requestId (corps JSON ou en-tête X-Request-Id). Indiquez-le dans le rapport pour le croiser avec les logs du Worker.",
      guideItem3: "Consultez le journal d'audit pour les actions récentes des utilisateurs.",
      guideItem4: "Dans Cloudflare, consultez les métriques et journaux du Worker sur cette plage horaire.",
      correlationHint:
        "Les réponses d'erreur incluent requestId dans le JSON ; l'en-tête X-Request-Id est envoyé sur les réponses JSON pour corrélation.",
    },
    roles: {
      superAdmin: "Super Administrateur",
      clinicAdmin: "Administrateur de Clinique",
      admin: "Support",
      podiatrist: "Podologue",
      receptionist: "Réceptionniste",
      superAdminDesc: "Gestion des utilisateurs, crédits et configuration du système",
      clinicAdminDesc: "Gestion des podologues et patients de la clinique",
      adminDesc: "Ajustements de crédits et support technique",
      podiatristDesc: "Gestion des patients et des séances cliniques",
      receptionistDesc: "Créer des patients, rendez-vous et gérer le calendrier des podologues assignés",
      superAdminAssignWarning:
        "Vous allez accorder le rôle de Super Administrateur. Cette personne aura un contrôle total du système, des utilisateurs et des paramètres.",
      superAdminAssignConfirmPrompt: "Confirmez cette action pour éviter les attributions par erreur.",
      superAdminAssignConfirmed: "Rôle de Super Administrateur confirmé.",
    },
    errors: {
      generic: "Une erreur s'est produite",
      notFound: "Non trouvé",
      unauthorized: "Non autorisé",
      validationError: "Erreur de validation",
      requiredField: "Ce champ est obligatoire",
      invalidEmail: "E-mail invalide",
      invalidPhone: "Téléphone invalide",
      saveFailed: "Échec de l'enregistrement",
      loadFailed: "Échec du chargement",
    },
    success: {
      saved: "Enregistré avec succès",
      deleted: "Supprimé avec succès",
      created: "Créé avec succès",
      updated: "Mis à jour avec succès",
      exported: "Exporté avec succès",
    },
    branding: {
      tagline: "Système complet de gestion clinique pour les professionnels de la podologie",
      digital: "Numérique",
      access: "Accès",
      secure: "Sécurisé",
    },
    notifications: {
      title: "Notifications",
      all: "Toutes",
      unread: "Non lues",
      read: "Lues",
      markAsRead: "Marquer comme lue",
      markAllAsRead: "Tout marquer comme lu",
      noNotifications: "Aucune notification",
      viewAll: "Voir tout",
      delete: "Supprimer",
      reassignment: "Réaffectation",
      appointment: "Rendez-vous",
      credit: "Crédits",
      system: "Système",
      patientReassignedFrom: "Patient réaffecté depuis vous",
      patientReassignedTo: "Patient qui vous est attribué",
      reassignedBy: "Réaffecté par",
      reason: "Raison",
      agoMinutes: "il y a {n} min",
      agoHours: "il y a {n}h",
      agoDays: "il y a {n} jours",
      yesterday: "Hier",
      justNow: "À l'instant",
      adminMessage: "Message de l'Administrateur",
      from: "De",
      to: "À",
      type: "Type",
      patient: "Patient",
      selectedCount: "{n} sélectionnée(s)",
    },
    messaging: {
      title: "Messages",
      sendMessage: "Envoyer un message",
      newMessage: "Nouveau message",
      sentMessages: "Messages envoyés",
      recipient: "Destinataire",
      recipients: "Destinataires",
      allUsers: "Tous les utilisateurs",
      selectSpecific: "Sélectionner des utilisateurs spécifiques",
      singleUser: "Utilisateur unique",
      subject: "Sujet",
      subjectPlaceholder: "Écrivez le sujet du message...",
      messageBody: "Contenu du message",
      messagePlaceholder: "Écrivez votre message ici...",
      preview: "Aperçu",
      send: "Envoyer",
      sending: "Envoi en cours...",
      sent: "Envoyé",
      sentAt: "Envoyé le",
      recipientsCount: "destinataires",
      readCount: "lus",
      unreadCount: "non lus",
      noMessages: "Aucun message envoyé",
      selectRecipients: "Sélectionnez les destinataires",
      messageSent: "Message envoyé avec succès",
      messageRequired: "Le contenu du message est obligatoire",
      subjectRequired: "Le sujet est obligatoire",
      recipientRequired: "Sélectionnez au moins un destinataire",
      fromAdmin: "Message de l'Administrateur",
    },

    clinic: {
      title: "Gestion de la clinique",
      tabOverview: "Aperçu",
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
      podiatristsLimit: "Podologues : {current} sur {limit} disponibles dans votre forfait",
      podiatristsNoLimit: "Podologues de la clinique. Aucune limite définie.",
      podiatristsLimitCta: "Besoin de plus ? Ajoutez des podologues supplémentaires pour 10 $ USD/mois dans Abonnement.",
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
      receptionistsActive: "Actives : {active} (sans limite). Elles doivent changer le mot de passe à la première connexion.",
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
      emailTaken: "Un compte avec cet e-mail existe déjà",
      createReceptionistError: "Erreur lors de la création de la réceptionniste",
      saveAssignmentError: "Erreur lors de l'enregistrement de l'assignation",
      createPodiatristError: "Erreur lors de la création du podologue",
      passwordMin8: "Le mot de passe doit comporter au moins 8 caractères",
    },
    auditLog: {
      title: "Journal d'audit",
      actionLabels: {
        LOGIN_SUCCESS: "Connexion",
        LOGIN_FAILED: "Échec de connexion",
        LOGOUT: "Déconnexion",
        PASSWORD_CHANGED: "Mot de passe modifié",
        PASSWORD_RESET_REJECTED: "Réinitialisation rejetée",
        PASSWORD_RESET_APPROVED: "Réinitialisation approuvée",
        PASSWORD_RESET_COMPLETED: "Réinitialisation terminée",
        PASSWORD_RESET_REQUESTED: "Demande de réinitialisation",
        CREATE: "Création",
        CREATE_USER: "Utilisateur créé",
        UPDATE: "Mise à jour",
        DELETE: "Suppression",
        DELETE_USER: "Utilisateur supprimé",
        COMPLETE: "Terminé",
        EXPORT: "Exportation",
        PRINT: "Impression",
        UPDATE_DRAFT: "Brouillon mis à jour",
        REASSIGN: "Réaffectation",
        TRANSFER: "Transfert",
        ADD_CREDITS: "Crédits ajoutés",
        SUBTRACT_CREDITS: "Crédits retirés",
        ADMIN_CREDIT_ADJUSTMENT: "Ajustement de crédits (admin)",
        ALERT_MULTIPLE_PRINT_VIOLATIONS: "Alerte : impressions multiples",
        PRINT_VIOLATION_FORM: "Tentative d'impression depuis le formulaire",
      },
      entityLabels: {
        authentication: "Authentification",
        session: "Session",
        patient: "Patient",
        prescription: "Ordonnance",
        reassignment: "Réaffectation",
        credit: "Crédits",
        user: "Utilisateur",
        user_data: "Données utilisateur",
        clinic: "Clinique",
        professional_info: "Infos professionnelles",
        professional_credentials: "Identifiants",
        logo: "Logo",
        message: "Message",
        clinical_history: "Historique clinique",
        receptionist: "Réceptionniste",
        registration_list: "Liste d'inscription",
        support_conversation: "Conversation support",
      },
      filters: {
        title: "Filtres",
        clear: "Effacer les filtres",
        search: "Rechercher...",
        allActions: "Toutes les actions",
        allTypes: "Tous les types",
        allUsers: "Tous les utilisateurs",
        from: "Du",
        to: "Au",
      },
      empty: {
        title: "Aucun enregistrement",
        description: "Aucun journal d'audit trouvé avec les filtres sélectionnés",
      },
      totalRecords: "Total des enregistrements",
      actionTypes: "Types d'action",
      entityTypes: "Types d'entité",
      activeUsers: "Utilisateurs actifs",
      topUsers: "Utilisateurs les plus actifs",
      recordsCount: "{n} enregistrements",
      ofTotal: "(sur {total} au total)",
      fullDetails: "Détails complets",
      userLinkedHint: "Chaque enregistrement est lié à l'utilisateur qui a effectué l'action. Le Log ID identifie cet événement de façon unique.",
      userLabel: "Utilisateur :",
      userIdLabel: "ID utilisateur :",
      logIdLabel: "ID d'enregistrement (log) :",
      resourceIdLabel: "ID ressource :",
      pageOf: "Page {current} sur {total}",
      summaries: {
        loginSuccess: "Connexion réussie",
        loginSuccessEmail: "Connexion réussie : {email}",
        with2fa: "(2FA activé)",
        without2fa: "(sans 2FA)",
        logout: "Déconnexion.",
        passwordChanged: "Mot de passe modifié par l'utilisateur.",
        loginFailed: "Tentative de connexion échouée.",
        loginFailedEmail: "Tentative de connexion échouée : {email}",
        passwordResetRejected: "Demande de réinitialisation rejetée.",
        passwordResetApproved: "Réinitialisation approuvée par un administrateur.",
        passwordResetCompleted: "L'utilisateur a terminé la réinitialisation du mot de passe.",
        passwordResetRequested: "Demande de réinitialisation envoyée.",
        patientPrefix: "Patient : {name}",
        userPrefix: "Utilisateur : {name}",
        clinicPrefix: "Clinique : {name}",
      },
    },
    securityMetrics: {
      title: "Métriques de sécurité",
      subtitle: "Métriques de sécurité, alertes actives et événements récents",
      last24h: "Dernières 24 h",
      last7days: "7 derniers jours",
      last30days: "30 derniers jours",
      refresh: "Actualiser",
      loadError: "Impossible de charger les métriques",
      criticalEvents: "Événements critiques",
      failedLogins: "Connexions échouées",
      unreadAlerts: "Alertes non lues",
      summaryByType: "Résumé par type",
      loading: "Chargement...",
      noEventsInPeriod: "Aucun événement sur la période sélectionnée.",
      activeAlerts: "Alertes actives",
      noSystemAlerts: "Aucune alerte système récente.",
      recentAccessGeo: "Accès récents (géolocalisation)",
      date: "Date",
      event: "Événement",
      userRole: "Utilisateur / rôle",
      ip: "IP",
      location: "Emplacement",
      noAccessYet: "Aucun accès enregistré. Connectez-vous pour générer des données.",
      loginOk: "Connexion OK",
      loginFailed: "Connexion échouée",
      recentFailedLogins: "Dernières connexions échouées",
      emailDetail: "E-mail / détail",
      noRecentRecords: "Aucun enregistrement récent.",
      attemptNumber: "Tentative #{n}",
      metricLabels: {
        failed_login: "Connexions échouées",
        successful_login: "Connexions réussies",
        twoFaFailed: "2FA échoué",
        captcha_failed: "CAPTCHA échoué",
        suspicious_activity: "Activité suspecte",
      },
    },
    supportPage: {
      title: "Support",
      adminSubtitle: "Messages des utilisateurs et listes d'inscription à approuver.",
      tabMessages: "Messages",
      tabLists: "Créer des listes",
      conversations: "Conversations",
      noConversations: "Aucune conversation",
      selectConversation: "Sélectionnez une conversation pour voir les messages et répondre.",
      supportAgent: "Support",
      registrationLists: "Listes d'inscription",
      newList: "Nouvelle liste",
      newListNamePlaceholder: "Nom de la nouvelle liste...",
      listsEmptyHint: "Créez des listes d'inscription (cours, événements) et envoyez-les pour approbation et import par l'administrateur.",
      deleteList: "Supprimer",
      deleteListConfirm: "Voulez-vous vraiment supprimer cette liste ?",
      createListError: "Erreur lors de la création de la liste",
      defaultListName: "Nouvelle liste",
      invalidEmail: "Saisissez une adresse e-mail valide.",
      downloadCsv: "Télécharger CSV",
      markPaidToExport: "Marquez au moins une entrée comme payée pour exporter.",
      submitForApproval: "Envoyer pour approbation",
      addEntry: "Ajouter une entrée",
      namePlaceholder: "Nom",
      emailPlaceholder: "E-mail",
      roleIndependent: "Podologue indépendant",
      roleClinicAdmin: "Admin de clinique",
      podiatristLimitLabel: "Limite podologues :",
      podiatristLimitPlaceholder: "Ex. : 5",
      add: "Ajouter",
      clinicAdminLimitHint: "Les podologues de la clinique seront limités à ce nombre. Les réceptionnistes ne comptent pas dans la limite.",
      noEntries: "Aucune entrée dans cette liste.",
      paid: "Payé",
      unpaid: "Non payé",
      pendingPayment: "En attente de paiement ({n})",
      paidSection: "Payés (exportés en CSV) ({n})",
      selectOrCreateList: "Sélectionnez une liste ou créez-en une nouvelle.",
      statusDraft: "Brouillon",
      statusPending: "En attente",
      statusApproved: "Approuvée",
      statusRejected: "Rejetée",
      limitPodiatrists: "Limite : {n} podologues",
    },
    sponsoredAnnouncements: {
      title: "Annonces sponsorisées",
      heading: "Annonces par état / province",
      subtitle: "Campagnes payées par des fournisseurs externes. Tous les utilisateurs de la zone voient une bannière et une notification.",
      newCampaign: "Nouvelle campagne",
      formTitle: "Nouvelle campagne",
      existingAdvertiser: "Annonceur existant",
      newAdvertiserOption: "— Nouvel annonceur —",
      advertiserName: "Nom de l'annonceur",
      advertiserNamePlaceholder: "Ex. : Institut Podologique",
      titlePlaceholder: "Titre de l'annonce",
      bodyPlaceholder: "Description (cours, événement, etc.)",
      countryPlaceholder: "Pays (MX)",
      statePlaceholder: "État / province",
      audienceEstimate: "≈ {n} utilisateurs dans la zone",
      externalUrlPlaceholder: "URL de l'annonceur (leur site)",
      promoCodePlaceholder: "Code promo sur le site de l'annonceur (optionnel)",
      createDraft: "Créer un brouillon",
      campaigns: "Campagnes",
      loading: "Chargement...",
      noCampaigns: "Aucune campagne pour le moment.",
      advertiserCode: "Code annonceur :",
      activate: "Activer",
      pause: "Pause",
      createAdvertiserError: "Impossible de créer l'annonceur",
      selectOrCreateAdvertiser: "Sélectionnez ou créez un annonceur",
      createCampaignError: "Erreur lors de la création de la campagne",
      statusError: "Erreur",
      statusActive: "active",
      statusDraft: "brouillon",
      statusPaused: "en pause",
      defaultCta: "En savoir plus",
    },
    terms: {
      title: "Termes et Conditions",
      lastUpdated: "Dernière mise à jour",
      lastUpdatedDate: "24 janvier 2026",
      backToRegister: "Retour à l'inscription",
      acceptAndContinue: "Accepter et Continuer",
      back: "Retour",
      section1: {
        title: "1. Acceptation des Termes",
        content: "En accédant et en utilisant PodoAdmin, vous acceptez de respecter et d'être lié par ces Termes et Conditions. Si vous n'êtes pas d'accord avec une partie de ces termes, vous ne devez pas utiliser notre service.",
      },
      section2: {
        title: "2. Description du Service",
        content: "PodoAdmin est une plateforme de gestion clinique conçue pour les professionnels de la podologie. Le service comprend la gestion des patients, les séances cliniques, les crédits et d'autres fonctionnalités liées à l'administration d'une pratique podologique.",
      },
      section3: {
        title: "3. Inscription Utilisateur",
        intro: "Pour utiliser PodoAdmin, vous devez:",
        item1: "Fournir des informations précises, actuelles et complètes lors de l'inscription",
        item2: "Maintenir et mettre à jour vos informations de compte",
        item3: "Maintenir la confidentialité de votre mot de passe",
        item4: "Nous notifier immédiatement de toute utilisation non autorisée de votre compte",
        item5: "Être responsable de toutes les activités qui se produisent sous votre compte",
      },
      section4: {
        title: "4. Utilisation Acceptable",
        intro: "Vous acceptez de:",
        item1: "Utiliser le service uniquement à des fins légales et professionnelles",
        item2: "Ne pas tenter d'accéder aux zones restreintes du système",
        item3: "Ne pas interférer avec le fonctionnement du service",
        item4: "Ne pas transmettre de virus, logiciels malveillants ou code malveillant",
        item5: "Respecter les droits de propriété intellectuelle",
        item6: "Maintenir la confidentialité des informations des patients",
      },
      section5: {
        title: "5. Confidentialité et Protection des Données",
        content: "La gestion des données personnelles et des patients est régie par notre Politique de Confidentialité. Vous êtes responsable de respecter toutes les lois de protection des données applicables, y compris mais sans s'y limiter le RGPD (Règlement Général sur la Protection des Données) et d'autres réglementations locales sur la confidentialité.",
      },
      section6: {
        title: "6. Crédits et Facturation",
        content: "L'utilisation de certaines fonctionnalités peut nécessiter des crédits. Les crédits peuvent avoir des périodes de validité et sont soumis aux politiques de facturation établies. Aucun remboursement ne sera effectué pour les crédits non utilisés, sauf dans des cas exceptionnels déterminés à notre discrétion.",
      },
      section7: {
        title: "7. Propriété Intellectuelle",
        content: "Tout le contenu, la conception, le code et les fonctionnalités de PodoAdmin sont la propriété de leurs propriétaires respectifs et sont protégés par les lois sur la propriété intellectuelle. La reproduction, la distribution ou l'utilisation commerciale n'est pas autorisée sans autorisation préalable.",
      },
      section8: {
        title: "8. Limitation de Responsabilité",
        content: "PodoAdmin est fourni \"tel quel\" sans garanties d'aucune sorte. Nous ne garantissons pas que le service soit exempt d'erreurs, d'interruptions ou de défauts. Nous ne serons pas responsables de tout dommage direct, indirect, accessoire ou consécutif résultant de l'utilisation ou de l'impossibilité d'utiliser le service.",
      },
      section9: {
        title: "9. Modifications du Service",
        content: "Nous nous réservons le droit de modifier, suspendre ou interrompre tout aspect du service à tout moment, avec ou sans préavis. Nous ne serons pas responsables envers vous ou des tiers pour toute modification, suspension ou interruption.",
      },
      section10: {
        title: "10. Résiliation",
        content: "Nous pouvons résilier ou suspendre votre accès au service immédiatement, sans préavis, pour quelque raison que ce soit, y compris mais sans s'y limiter à la violation de ces termes. Après la résiliation, votre droit d'utiliser le service cessera immédiatement.",
      },
      section11: {
        title: "11. Modifications des Termes",
        content: "Nous nous réservons le droit de modifier ces termes à tout moment. Les modifications entreront en vigueur immédiatement après leur publication. Votre utilisation continue du service après les modifications constitue votre acceptation des nouveaux termes.",
      },
      section12: {
        title: "12. Loi Applicable",
        content: "Ces termes sont régis par les lois du pays où PodoAdmin opère. Tout litige sera résolu dans les tribunaux compétents de cette juridiction.",
      },
      section13: {
        title: "13. Contact",
        content: "Si vous avez des questions concernant ces Termes et Conditions, vous pouvez nous contacter via les canaux de support fournis sur la plateforme.",
      },
    },
    privacy: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour",
      backToRegister: "Retour à l'inscription",
      section1: { title: "1. Responsable", content: "Le professionnel ou la clinique est responsable des données de santé selon le RGPD et les lois locales." },
      section2: { title: "2. Données traitées", content: "Compte, données cliniques, journaux d'audit et métadonnées de sécurité." },
      section3: { title: "3. Finalité", content: "Gestion clinique, conservation légale des dossiers, sécurité et support." },
      section4: { title: "4. Conservation", content: "Dossier clinique : jusqu'à 20 ans après le dernier acte. Audit : 10 ans." },
      section5: {
        title: "5. Droits des personnes",
        intro: "Selon le RGPD et lois locales :",
        item1: "Accès et portabilité dans Paramètres.",
        item2: "Rectification du profil.",
        item3: "Effacement lorsque légalement permis.",
        item4: "Opposition : contacter le support ; la conservation médicale peut prévaloir.",
      },
      section6: { title: "6. Sécurité", content: "HTTPS, contrôle d'accès, audit et authentification." },
      section7: { title: "7. Transferts", content: "Données pouvant être traitées dans le cloud." },
      section8: { title: "8. Contact", content: "Support ou Paramètres → Confidentialité et données." },
    },
    compliance: {
      title: "Confidentialité et données",
      subtitle: "Droits RGPD et ARCO pour votre compte",
      exportTitle: "Exporter mes données",
      exportDesc: "Télécharger JSON avec profil, clinique et audit récent.",
      exportButton: "Télécharger mes données",
      deletionTitle: "Demander la suppression",
      deletionDesc: "Demande évaluée selon RGPD et conservation clinique.",
      deletionButton: "Demander la suppression",
      deletionSuccess: "Demande enregistrée.",
      privacyLink: "Voir la Politique de Confidentialité",
      retentionTitle: "Conservation",
      retentionNote: "Dossier clinique : jusqu'à 20 ans après le dernier acte.",
      legalHoldTitle: "Blocages légaux",
      legalHoldDesc: "Empêche la suppression en cas de litige ou audit.",
      holdResourceType: "Type de ressource",
      holdResourceId: "ID de ressource",
      holdReason: "Motif",
      holdCreate: "Créer blocage",
      holdCreated: "Blocage créé",
      holdRelease: "Libérer",
      holdsEmpty: "Aucun blocage actif",
    },
    clinicalHistoriesExport: {
      title: "Télécharger les dossiers cliniques",
      subtitle: "Exporter tous les dossiers en HTML imprimable → PDF",
      desc: "Génère un fichier HTML identique à l'impression des séances. Pas de JSON : ouvrez le HTML et enregistrez en PDF via Imprimer.",
      stats: "{patients} patient(s) · {sessions} séance(s) incluses",
      downloadHtml: "Télécharger HTML",
      printPdf: "Imprimer / enregistrer PDF",
      pdfHint: "Dans la boîte d'impression choisissez « Enregistrer au format PDF ».",
      popupBlocked: "Autorisez les fenêtres pop-up pour l'aperçu avant impression.",
      noPatients: "Aucun patient dans votre compte à exporter.",
      buildError: "Impossible de générer le HTML du dossier.",
      downloadFailed: "Impossible de démarrer le téléchargement. Essayez « Imprimer / enregistrer PDF ».",
      downloadStarted: "Téléchargement démarré : {filename}",
      openedInTab: "Dossier ouvert dans un nouvel onglet. Utilisez Imprimer → Enregistrer au format PDF.",
      invalidResponse: "La réponse du serveur ne contient pas de données patients valides.",
    },
    usersPage: {
      fields: {
        name: "Nom",
        email: "E-mail",
        password: "Mot de passe",
        role: "Rôle",
        clinic: "Clinique",
        clinicOptional: "Clinique (optionnel)",
      },
      create: {
        title: "Créer un nouvel utilisateur",
        passwordHint: "Minimum 8 caractères.",
        clinicModeExisting: "Sélectionner une clinique existante",
        clinicModeNew: "Créer une nouvelle clinique",
        clinicModeNone: "Sans clinique (indépendant)",
        newClinicHint: "Une clinique sera créée avec des données provisoires. L'administrateur complétera le nom, le code, le téléphone, l'adresse et le reste dans Paramètres.",
        podiatristLimit: "Limite de podologues (optionnel)",
        podiatristLimitPlaceholder: "Ex. : 5",
        podiatristLimitHint: "Les podologues de la clinique seront limités à ce nombre. Les réceptionnistes ne comptent pas.",
        saving: "Création...",
        success: "Utilisateur créé avec succès.",
        partialClinicFail: "Utilisateur créé, mais la clinique n'a pas pu être créée. Configurez-la ensuite depuis l'édition utilisateur.",
        errors: {
          nameRequired: "Le nom est obligatoire.",
          emailInvalid: "Saisissez une adresse e-mail valide.",
          passwordMin: "Le mot de passe doit contenir au moins 8 caractères.",
          clinicRequiredReceptionist: "Sélectionnez une clinique pour le réceptionniste.",
          clinicRequiredAdmin: "Sélectionnez une clinique existante ou créez-en une nouvelle.",
          createFailed: "Impossible de créer l'utilisateur.",
        },
      },
      import: {
        title: "Importer des utilisateurs (CSV)",
        description: "Colonnes obligatoires : nombre, email, password (ou mot de passe par défaut), rol.",
        optionalColumnsSuperAdmin: " Optionnel : clinicMode (existing|new|none), clinicId (si existing), podiatrist_limit (clinic_admin uniquement).",
        downloadTemplate: "Télécharger le modèle",
        selectFile: "Sélectionner un fichier",
        defaultPassword: "Mot de passe par défaut (si manquant dans le CSV)",
        optionalPlaceholder: "Optionnel",
        readyCount: "{count} lignes prêtes à importer",
        andMore: "... et {count} de plus",
        resultsSummary: "Résultat : {ok} ok, {fail} en erreur",
        created: "✓ Créé",
        importing: "Importation... ({done}/{total})",
        submit: "Importer",
        templateFilename: "modele_utilisateurs.csv",
        errors: {
          needRows: "Le fichier doit avoir au moins une ligne d'en-tête et une ligne de données.",
          missingColumns: "Colonnes obligatoires manquantes : nombre, email, password, rol",
          readFile: "Erreur lors de la lecture du fichier",
          invalidPassword: "Mot de passe invalide (min. 8 caractères)",
          unknown: "Erreur inconnue",
          connection: "Erreur de connexion",
        },
      },
      edit: {
        title: "Modifier l'utilisateur",
        noClinic: "Sans clinique",
        errors: {
          updateFailed: "Impossible de mettre à jour l'utilisateur.",
        },
      },
      transfer: {
        title: "Transférer l'historique clinique",
        subtitle: "Copier tous les patients et séances d'un utilisateur vers un autre",
        successMessage: "Transfert terminé : {patients} patients, {sessions} séances.",
        error: "Erreur lors du transfert des données.",
        successTitle: "Succès !",
        errorTitle: "Erreur",
        sourceUser: "Utilisateur source",
        targetUser: "Utilisateur cible",
        selectUser: "— Sélectionner —",
        patientsCount: "{count} patients à transférer",
        warning: "Les données seront copiées vers l'utilisateur cible. La source conserve son historique. Cette action n'est pas facilement annulable.",
        transferring: "Transfert...",
        submit: "Transférer",
      },
      profile: {
        loading: "Chargement des données cliniques...",
        patients: "Patients",
        sessions: "Séances",
        patientsHeading: "Patients ({count})",
        andMore: "...et {count} de plus",
      },
      status: {
        banned: "Banni",
        blocked: "Bloqué",
        gracePeriod: "Période de grâce",
        disabled: "Désactivé",
        pendingPayment: "Paiement en attente",
        active: "Actif",
      },
      confirm: {
        block: "Bloquer {name} ? Il ne pourra pas se connecter jusqu'au déblocage.",
        unblock: "Débloquer {name} ?",
        enable: "Activer le compte de {name} ?",
        disable: "Désactiver le compte de {name} ? Il ne pourra pas se connecter.",
        ban: "Bannir {name} ? Action grave.",
        unban: "Lever le bannissement de {name} ?",
        delete: "Supprimer {name} ? Peut être irréversible.",
        deletePermanent: "Supprimer définitivement {name} ? Irréversible.",
      },
      errors: {
        approve: "Erreur lors de l'approbation",
        reject: "Erreur lors du rejet",
        block: "Impossible de bloquer l'utilisateur.",
        unblock: "Impossible de débloquer l'utilisateur.",
        enable: "Impossible d'activer l'utilisateur.",
        disable: "Impossible de désactiver l'utilisateur.",
        ban: "Impossible de bannir l'utilisateur.",
        unban: "Impossible de lever le bannissement.",
        delete: "Impossible de supprimer l'utilisateur.",
      },
      actions: {
        importCsv: "Importer CSV",
        createUser: "Créer un utilisateur",
        transferHistory: "Transférer l'historique",
        approve: "Approuver",
        reject: "Rejeter",
        view: "Voir",
        edit: "Modifier",
        ban: "Bannir",
        unban: "Lever le ban",
        block: "Bloquer",
        unblock: "Débloquer",
        enableAccount: "Activer le compte",
        disableAccount: "Désactiver le compte",
        delete: "Supprimer",
        viewProfile: "Voir le profil",
        downloadJson: "Télécharger JSON",
        manageAccount: "Gérer le compte",
      },
      table: {
        user: "Utilisateur",
        email: "E-mail",
        role: "Rôle",
        status: "Statut",
        clinic: "Clinique",
        limit: "Limite",
        data: "Données",
        actions: "Actions",
        sortBy: "Trier par",
        podiatristLimit: "Limite de podologues",
        dataSummary: "{patients} patients · {sessions} séances",
        currentPodiatrists: "Actuels : {count}",
        saveLimit: "Enregistrer",
        clinicMissing: "Clinique introuvable",
        effectiveLimitHint: "Capacité réelle appliquée (sièges inclus par le forfait + sièges supplémentaires, ou le dépassement manuel s'il est plus élevé).",
        overCapacityHint: "Cette clinique a plus de podologues actifs que sa capacité actuelle (probablement après une rétrogradation de forfait). Elle ne pourra pas en ajouter d'autres tant que des places ne seront pas libérées ou des sièges supplémentaires achetés.",
        patients: "patients",
        sessions: "séances",
      },
      passwordReset: {
        pendingTitle: "Demandes de réinitialisation du mot de passe",
        approved: "Demande approuvée.",
        approveError: "Impossible d'approuver la demande.",
        rejectReasonPrompt: "Motif du rejet (optionnel) :",
        rejected: "Demande rejetée.",
        rejectError: "Impossible de rejeter la demande.",
        approvedModalTitle: "Demande approuvée",
        linkHint: "Le lien a été envoyé par e-mail à l'utilisateur. Voici le lien pour le renvoyer personnellement (WhatsApp, etc.) :",
        copied: "Lien copié dans le presse-papiers.",
        copyFailed: "Impossible de copier. Sélectionnez et copiez le lien manuellement.",
        copyLink: "Copier le lien",
      },
      regLists: {
        title: "Listes d'inscription en attente",
        hint: "Approuvez ou rejetez les listes envoyées par le support.",
        byCreator: "Par {name}",
        downloadCsv: "CSV",
        createdCount: "{count} utilisateur(s) créé(s).",
        approved: "Liste approuvée.",
        errorsPrefix: "Erreurs :",
      },
      cooldown: {
        notApplicable: "N/A",
        scopeClinic: "clinique",
        scopeProfessional: "professionnel",
        reasonPrompt: "Motif de l'autorisation (optionnel) :",
        confirm: "Autoriser l'édition anticipée de {scope} pour {name} ?",
        applied: "Autorisation appliquée.",
        error: "Impossible d'appliquer l'autorisation.",
      },
      export: {
        failed: "Impossible d'exporter les données de l'utilisateur.",
      },
      menu: {
        unbanAccount: "Lever le bannissement",
        banAccount: "Bannir le compte",
        unblockAccount: "Débloquer le compte",
        blockAccount: "Bloquer le compte",
        enableAccount: "Activer le compte",
        disableAccount: "Désactiver le compte",
        authorizeCooldown: "Autoriser l'édition (cooldown)",
        deleteAccount: "Supprimer le compte",
      },
      searchPlaceholder: "Rechercher des utilisateurs...",
      allRoles: "Tous les rôles",
      loading: "Chargement des utilisateurs...",
      empty: "Aucun utilisateur trouvé.",
      selectPlaceholder: "— Sélectionner —",
    },
  },
};

export const languageNames: Record<Language, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
};
