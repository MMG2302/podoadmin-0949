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
    credits: string;
    settings: string;
    users: string;
    auditLog: string;
    systemDiagnostics: string;
    profile: string;
    clinicManagement: string;
    whatsappMessages: string;
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
    changeColor: string;
    resetPaletteMode: string;
    resetPaletteAll: string;
    palettePreviewBrand: string;
    palettePreviewSemantic: string;
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
      | "infoBg",
      string
    >;
  };

  // Contact PodoAdmin / Support (2-way messaging)
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
}

export const translations: Record<Language, Translations> = {
  es: {
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
    },
    nav: {
      dashboard: "Panel principal",
      patients: "Pacientes",
      clinicalSessions: "Sesiones clínicas",
      credits: "Créditos",
      settings: "Configuración",
      users: "Usuarios",
      auditLog: "Registro de auditoría",
      systemDiagnostics: "Estado del sistema",
      profile: "Perfil",
      clinicManagement: "Gestión de Clínica",
      whatsappMessages: "Mensajes WhatsApp",
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
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Descarga las citas del día en formato calendario (.ics) para iOS o Android",
      exportWaHint: "Descarga el .ics y abre WhatsApp. Si el podólogo tiene móvil en su perfil, se abre el chat directo; si no, eliges el contacto manualmente. Adjunta el .ics.",
      exportSelectPodiatrist: "Selecciona un podólogo en el filtro para exportar la agenda.",
      exportNoAppointments: "No hay citas programadas este día.",
      exportBusy: "Exportando…",
      exportWaHeader: "📅 Agenda del {{fecha}} — {{podólogo}} ({{count}} citas)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 Se ha descargado el archivo agenda-.ics — adjúntalo en WhatsApp para importar al calendario del móvil.",
      exportWaInvalidPhone: "El teléfono del podólogo no es válido para WhatsApp. Abre WhatsApp manualmente y pega el mensaje.",
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
      changeColor: "Cambiar",
      resetPaletteMode: "Restablecer este modo",
      resetPaletteAll: "Restablecer todo",
      palettePreviewBrand: "Vista previa — interfaz",
      palettePreviewSemantic: "Vista previa — estados semánticos",
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
      },
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
  },
  
  en: {
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
    },
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      clinicalSessions: "Clinical Sessions",
      credits: "Credits",
      settings: "Settings",
      users: "Users",
      auditLog: "Audit Log",
      systemDiagnostics: "System status",
      profile: "Profile",
      clinicManagement: "Clinic Management",
      whatsappMessages: "WhatsApp Messages",
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
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Download the day's appointments as a calendar file (.ics) for iOS or Android",
      exportWaHint: "Downloads the .ics and opens WhatsApp. If the podiatrist has a mobile on their profile, the chat opens directly; otherwise pick the contact manually. Attach the .ics.",
      exportSelectPodiatrist: "Select a podiatrist in the filter to export the schedule.",
      exportNoAppointments: "No scheduled appointments for this day.",
      exportBusy: "Exporting…",
      exportWaHeader: "📅 Schedule for {{fecha}} — {{podologo}} ({{count}} appointments)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 The agenda-.ics file has been downloaded — attach it in WhatsApp to import to your mobile calendar.",
      exportWaInvalidPhone: "The podiatrist's phone is not valid for WhatsApp. Open WhatsApp manually and paste the message.",
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
      changeColor: "Change",
      resetPaletteMode: "Reset this mode",
      resetPaletteAll: "Reset all",
      palettePreviewBrand: "Preview — interface",
      palettePreviewSemantic: "Preview — semantic states",
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
      },
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
  },
  
  pt: {
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
    },
    nav: {
      dashboard: "Painel",
      patients: "Pacientes",
      clinicalSessions: "Sessões Clínicas",
      credits: "Créditos",
      settings: "Configurações",
      users: "Usuários",
      auditLog: "Log de Auditoria",
      systemDiagnostics: "Estado do sistema",
      profile: "Perfil",
      clinicManagement: "Gestão da Clínica",
      whatsappMessages: "Mensagens WhatsApp",
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
      clinicalHistory: "Histórico Clínico",
      viewHistory: "Ver Histórico",
      lastVisit: "Última Visita",
      totalSessions: "Total de Sessões",
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
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Descarrega as consultas do dia em formato calendário (.ics) para iOS ou Android",
      exportWaHint: "Descarrega o .ics e abre o WhatsApp. Se o podologista tiver telemóvel no perfil, abre o chat direto; senão escolhe o contacto manualmente. Anexe o .ics.",
      exportSelectPodiatrist: "Selecione um podologista no filtro para exportar a agenda.",
      exportNoAppointments: "Não há consultas agendadas neste dia.",
      exportBusy: "A exportar…",
      exportWaHeader: "📅 Agenda de {{fecha}} — {{podologo}} ({{count}} consultas)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 O ficheiro agenda-.ics foi descarregado — anexe-o no WhatsApp para importar no calendário do telemóvel.",
      exportWaInvalidPhone: "O telefone do podologista não é válido para WhatsApp. Abra o WhatsApp manualmente e cole a mensagem.",
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
      changeColor: "Alterar",
      resetPaletteMode: "Restaurar este modo",
      resetPaletteAll: "Restaurar tudo",
      palettePreviewBrand: "Prévia — interface",
      palettePreviewSemantic: "Prévia — estados semânticos",
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
      },
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
  },
  
  fr: {
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
    },
    nav: {
      dashboard: "Tableau de bord",
      patients: "Patients",
      clinicalSessions: "Séances Cliniques",
      credits: "Crédits",
      settings: "Paramètres",
      users: "Utilisateurs",
      auditLog: "Journal d'audit",
      systemDiagnostics: "État du système",
      profile: "Profil",
      clinicManagement: "Gestion de Clinique",
      whatsappMessages: "Messages WhatsApp",
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
      sendWhatsApp: "WhatsApp Web",
      exportIcsHint: "Télécharge les rendez-vous du jour au format calendrier (.ics) pour iOS ou Android",
      exportWaHint: "Télécharge le .ics et ouvre WhatsApp. Si le podologue a un mobile sur son profil, le chat s'ouvre directement ; sinon choisissez le contact manuellement. Joignez le .ics.",
      exportSelectPodiatrist: "Sélectionnez un podologue dans le filtre pour exporter l'agenda.",
      exportNoAppointments: "Aucun rendez-vous programmé ce jour.",
      exportBusy: "Export en cours…",
      exportWaHeader: "📅 Agenda du {{fecha}} — {{podologo}} ({{count}} rendez-vous)",
      exportWaLine: "• {{hora}} — {{paciente}} ({{duracion}} min) · {{telefono}}",
      exportWaAttachHint: "📎 Le fichier agenda-.ics a été téléchargé — joignez-le dans WhatsApp pour l'importer dans le calendrier mobile.",
      exportWaInvalidPhone: "Le téléphone du podologue n'est pas valide pour WhatsApp. Ouvrez WhatsApp manuellement et collez le message.",
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
      changeColor: "Modifier",
      resetPaletteMode: "Réinitialiser ce mode",
      resetPaletteAll: "Tout réinitialiser",
      palettePreviewBrand: "Aperçu — interface",
      palettePreviewSemantic: "Aperçu — états sémantiques",
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
      },
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
  },
};

export const languageNames: Record<Language, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
};
