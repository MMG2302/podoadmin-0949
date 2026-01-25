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
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
    loggingIn: string;
    invalidCredentials: string;
    loginError: string;
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
    passwordRequirements: string;
    passwordMinLength: string;
    passwordMustContain: string;
    passwordUppercase: string;
    passwordLowercase: string;
    passwordNumber: string;
    passwordSpecial: string;
    termsAccept: string;
    termsLink: string;
    registerButton: string;
    registering: string;
    alreadyHaveAccount: string;
    goToLogin: string;
    dontHaveAccount: string;
    registrationSuccess: string;
    registrationSuccessMessage: string;
    checkEmail: string;
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
    // OAuth
    orContinueWith: string;
    loginWithGoogle: string;
    loginWithApple: string;
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
  
  // Navigation
  nav: {
    dashboard: string;
    patients: string;
    clinicalSessions: string;
    credits: string;
    settings: string;
    users: string;
    auditLog: string;
    profile: string;
    clinicManagement: string;
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
  };
  
  // Roles
  roles: {
    superAdmin: string;
    clinicAdmin: string;
    admin: string;
    podiatrist: string;
    superAdminDesc: string;
    clinicAdminDesc: string;
    adminDesc: string;
    podiatristDesc: string;
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
      passwordRequirements: "Requisitos de contraseña",
      passwordMinLength: "Mínimo 12 caracteres",
      passwordMustContain: "Debe contener:",
      passwordUppercase: "Al menos una mayúscula",
      passwordLowercase: "Al menos una minúscula",
      passwordNumber: "Al menos un número",
      passwordSpecial: "Al menos un carácter especial",
      termsAccept: "Acepto los términos y condiciones",
      termsLink: "Ver términos",
      registerButton: "Crear cuenta",
      registering: "Creando cuenta...",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      goToLogin: "Iniciar sesión",
      dontHaveAccount: "¿No tienes una cuenta?",
      registrationSuccess: "¡Registro exitoso!",
      registrationSuccessMessage: "Hemos enviado un email de verificación. Por favor, revisa tu bandeja de entrada.",
      checkEmail: "Revisa tu correo electrónico",
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
      // OAuth
      orContinueWith: "O continúa con",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
    },
    nav: {
      dashboard: "Panel principal",
      patients: "Pacientes",
      clinicalSessions: "Sesiones clínicas",
      credits: "Créditos",
      settings: "Configuración",
      users: "Usuarios",
      auditLog: "Registro de auditoría",
      profile: "Perfil",
      clinicManagement: "Gestión de Clínica",
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
    },
    roles: {
      superAdmin: "Super Administrador",
      clinicAdmin: "Administrador de Clínica",
      admin: "Soporte",
      podiatrist: "Podólogo",
      superAdminDesc: "Gestión de usuarios, créditos y configuración del sistema",
      clinicAdminDesc: "Gestión de podólogos y pacientes de la clínica",
      adminDesc: "Ajustes de créditos y soporte técnico",
      podiatristDesc: "Gestión de pacientes y sesiones clínicas",
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
        content: "El manejo de datos personales y de pacientes se rige por nuestra Política de Privacidad. Usted es responsable de cumplir con todas las leyes de protección de datos aplicables, incluyendo pero no limitado al RGPD (Reglamento General de Protección de Datos) y otras regulaciones locales de privacidad.",
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
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      loginButton: "Log in",
      loggingIn: "Logging in...",
      invalidCredentials: "Invalid credentials",
      loginError: "Login error",
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
      passwordRequirements: "Password requirements",
      passwordMinLength: "Minimum 12 characters",
      passwordMustContain: "Must contain:",
      passwordUppercase: "At least one uppercase letter",
      passwordLowercase: "At least one lowercase letter",
      passwordNumber: "At least one number",
      passwordSpecial: "At least one special character",
      termsAccept: "I accept the terms and conditions",
      termsLink: "View terms",
      registerButton: "Create account",
      registering: "Creating account...",
      alreadyHaveAccount: "Already have an account?",
      goToLogin: "Log in",
      dontHaveAccount: "Don't have an account?",
      registrationSuccess: "Registration successful!",
      registrationSuccessMessage: "We've sent a verification email. Please check your inbox.",
      checkEmail: "Check your email",
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
      // OAuth
      orContinueWith: "Or continue with",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
    },
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      clinicalSessions: "Clinical Sessions",
      credits: "Credits",
      settings: "Settings",
      users: "Users",
      auditLog: "Audit Log",
      profile: "Profile",
      clinicManagement: "Clinic Management",
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
    },
    roles: {
      superAdmin: "Super Admin",
      clinicAdmin: "Clinic Administrator",
      admin: "Support",
      podiatrist: "Podiatrist",
      superAdminDesc: "User management, credits, and system configuration",
      clinicAdminDesc: "Clinic podiatrists and patients management",
      adminDesc: "Credit adjustments and technical support",
      podiatristDesc: "Patient and clinical session management",
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
        content: "The handling of personal and patient data is governed by our Privacy Policy. You are responsible for complying with all applicable data protection laws, including but not limited to GDPR (General Data Protection Regulation) and other local privacy regulations.",
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
      passwordLabel: "Senha",
      passwordPlaceholder: "••••••••",
      loginButton: "Entrar",
      loggingIn: "Entrando...",
      invalidCredentials: "Credenciais inválidas",
      loginError: "Erro ao entrar",
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
      passwordRequirements: "Requisitos de senha",
      passwordMinLength: "Mínimo 12 caracteres",
      passwordMustContain: "Deve conter:",
      passwordUppercase: "Pelo menos uma letra maiúscula",
      passwordLowercase: "Pelo menos uma letra minúscula",
      passwordNumber: "Pelo menos um número",
      passwordSpecial: "Pelo menos um caractere especial",
      termsAccept: "Aceito os termos e condições",
      termsLink: "Ver termos",
      registerButton: "Criar conta",
      registering: "Criando conta...",
      alreadyHaveAccount: "Já tem uma conta?",
      goToLogin: "Entrar",
      dontHaveAccount: "Não tem uma conta?",
      registrationSuccess: "Registro bem-sucedido!",
      registrationSuccessMessage: "Enviamos um email de verificação. Por favor, verifique sua caixa de entrada.",
      checkEmail: "Verifique seu e-mail",
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
      // OAuth
      orContinueWith: "Ou continue com",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
    },
    nav: {
      dashboard: "Painel",
      patients: "Pacientes",
      clinicalSessions: "Sessões Clínicas",
      credits: "Créditos",
      settings: "Configurações",
      users: "Usuários",
      auditLog: "Log de Auditoria",
      profile: "Perfil",
      clinicManagement: "Gestão da Clínica",
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
    },
    roles: {
      superAdmin: "Super Administrador",
      clinicAdmin: "Administrador de Clínica",
      admin: "Suporte",
      podiatrist: "Podólogo",
      superAdminDesc: "Gestão de usuários, créditos e configuração do sistema",
      clinicAdminDesc: "Gestão de podólogos e pacientes da clínica",
      adminDesc: "Ajustes de créditos e suporte técnico",
      podiatristDesc: "Gestão de pacientes e sessões clínicas",
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
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "••••••••",
      loginButton: "Se connecter",
      loggingIn: "Connexion en cours...",
      invalidCredentials: "Identifiants invalides",
      loginError: "Erreur de connexion",
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
      passwordRequirements: "Exigences du mot de passe",
      passwordMinLength: "Minimum 12 caractères",
      passwordMustContain: "Doit contenir:",
      passwordUppercase: "Au moins une lettre majuscule",
      passwordLowercase: "Au moins une lettre minuscule",
      passwordNumber: "Au moins un chiffre",
      passwordSpecial: "Au moins un caractère spécial",
      termsAccept: "J'accepte les termes et conditions",
      termsLink: "Voir les termes",
      registerButton: "Créer un compte",
      registering: "Création du compte...",
      alreadyHaveAccount: "Vous avez déjà un compte?",
      goToLogin: "Se connecter",
      dontHaveAccount: "Vous n'avez pas de compte?",
      registrationSuccess: "Inscription réussie!",
      registrationSuccessMessage: "Nous avons envoyé un email de vérification. Veuillez vérifier votre boîte de réception.",
      checkEmail: "Vérifiez votre e-mail",
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
      // OAuth
      orContinueWith: "Ou continuer avec",
      loginWithGoogle: "Google",
      loginWithApple: "Apple",
    },
    nav: {
      dashboard: "Tableau de bord",
      patients: "Patients",
      clinicalSessions: "Séances Cliniques",
      credits: "Crédits",
      settings: "Paramètres",
      users: "Utilisateurs",
      auditLog: "Journal d'audit",
      profile: "Profil",
      clinicManagement: "Gestion de Clinique",
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
    },
    roles: {
      superAdmin: "Super Administrateur",
      clinicAdmin: "Administrateur de Clinique",
      admin: "Support",
      podiatrist: "Podologue",
      superAdminDesc: "Gestion des utilisateurs, crédits et configuration du système",
      clinicAdminDesc: "Gestion des podologues et patients de la clinique",
      adminDesc: "Ajustements de crédits et support technique",
      podiatristDesc: "Gestion des patients et des séances cliniques",
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
  },
};

export const languageNames: Record<Language, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
};
