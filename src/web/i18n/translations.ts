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
  },
};

export const languageNames: Record<Language, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
};
