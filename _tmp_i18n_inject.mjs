import fs from "fs";

const path = "src/web/i18n/translations.ts";
let s = fs.readFileSync(path, "utf8");

if (s.includes("\n  auditLog: {")) {
  console.error("Already patched interface?");
  process.exit(1);
}

// --- 1) Extend notifications interface ---
s = s.replace(
  `    justNow: string;
    from: string;
  };
  
  // Messaging (Super Admin)
  messaging: {`,
  `    justNow: string;
    from: string;
    selectedCount: string;
    type: string;
    patient: string;
    to: string;
  };
  
  // Messaging (Super Admin)
  messaging: {`
);

// --- 2) Extend messaging interface ---
s = s.replace(
  `    recipientRequired: string;
    fromAdmin: string;
  };
}`,
  `    recipientRequired: string;
    fromAdmin: string;
    searchUsersPlaceholder: string;
    selectFiltered: string;
    clearSelection: string;
    showingUsers: string;
    selectedCount: string;
    selected: string;
    showingUsersCount: string;
    selectedUser: string;
    sendError: string;
  };

  // Audit log (admin)
  auditLog: {
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
}`
);

const localeBlocks = {
  es: {
    notificationsExtra: `      from: "De",
      selectedCount: "{n} seleccionadas",
      type: "Tipo",
      patient: "Paciente",
      to: "A",
    },`,
    messagingExtra: `      fromAdmin: "Mensaje del Administrador",
      searchUsersPlaceholder: "Buscar por nombre, email o rol...",
      selectFiltered: "Seleccionar filtrados",
      clearSelection: "Limpiar selección",
      showingUsers: "Mostrando {n} usuarios",
      selectedCount: "Seleccionados: {n}",
      selected: "Seleccionado",
      showingUsersCount: "Mostrando {n} usuarios",
      selectedUser: "Seleccionado: {name}",
      sendError: "Error al enviar",
    },`,
    namespaces: `    auditLog: {
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
`,
  },
  en: {
    notificationsExtra: `      from: "From",
      selectedCount: "{n} selected",
      type: "Type",
      patient: "Patient",
      to: "To",
    },`,
    messagingExtra: `      fromAdmin: "Admin Message",
      searchUsersPlaceholder: "Search by name, email or role...",
      selectFiltered: "Select filtered",
      clearSelection: "Clear selection",
      showingUsers: "Showing {n} users",
      selectedCount: "Selected: {n}",
      selected: "Selected",
      showingUsersCount: "Showing {n} users",
      selectedUser: "Selected: {name}",
      sendError: "Failed to send",
    },`,
    namespaces: `    auditLog: {
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
`,
  },
  pt: {
    notificationsExtra: `      from: "De",
      selectedCount: "{n} selecionadas",
      type: "Tipo",
      patient: "Paciente",
      to: "Para",
    },`,
    messagingExtra: `      fromAdmin: "Mensagem do Administrador",
      searchUsersPlaceholder: "Buscar por nome, e-mail ou função...",
      selectFiltered: "Selecionar filtrados",
      clearSelection: "Limpar seleção",
      showingUsers: "Mostrando {n} usuários",
      selectedCount: "Selecionados: {n}",
      selected: "Selecionado",
      showingUsersCount: "Mostrando {n} usuários",
      selectedUser: "Selecionado: {name}",
      sendError: "Erro ao enviar",
    },`,
    namespaces: `    auditLog: {
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
`,
  },
  fr: {
    notificationsExtra: `      from: "De",
      selectedCount: "{n} sélectionnées",
      type: "Type",
      patient: "Patient",
      to: "À",
    },`,
    messagingExtra: `      fromAdmin: "Message de l'Administrateur",
      searchUsersPlaceholder: "Rechercher par nom, e-mail ou rôle...",
      selectFiltered: "Sélectionner les filtrés",
      clearSelection: "Effacer la sélection",
      showingUsers: "Affichage de {n} utilisateurs",
      selectedCount: "Sélectionnés : {n}",
      selected: "Sélectionné",
      showingUsersCount: "Affichage de {n} utilisateurs",
      selectedUser: "Sélectionné : {name}",
      sendError: "Échec de l'envoi",
    },`,
    namespaces: `    auditLog: {
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
`,
  },
};

// Apply per-locale patches
for (const [lang, block] of Object.entries(localeBlocks)) {
  const fromMarkers = {
    es: `      from: "De",
    },
    messaging: {`,
    en: `      from: "From",
    },
    messaging: {`,
    pt: `      from: "De",
    },
    messaging: {`,
    fr: `      from: "De",
    },
    messaging: {`,
  };

  // notifications: adminMessage then from - need unique replacements
  // Actually looking at file, order is adminMessage then from in some, justNow then adminMessage then from in es
}

// More reliable: replace each locale's notifications from + messaging fromAdmin closing

const notifsFrom = {
  es: {
    old: `      adminMessage: "Mensaje del Administrador",
      from: "De",
    },
    messaging: {`,
    neu: `      adminMessage: "Mensaje del Administrador",
      from: "De",
      selectedCount: "{n} seleccionadas",
      type: "Tipo",
      patient: "Paciente",
      to: "A",
    },
    messaging: {`,
  },
  en: {
    old: `      adminMessage: "Admin Message",
      from: "From",
    },
    messaging: {`,
    neu: `      adminMessage: "Admin Message",
      from: "From",
      selectedCount: "{n} selected",
      type: "Type",
      patient: "Patient",
      to: "To",
    },
    messaging: {`,
  },
  pt: {
    old: `      adminMessage: "Mensagem do Administrador",
      from: "De",
    },
    messaging: {`,
    neu: `      adminMessage: "Mensagem do Administrador",
      from: "De",
      selectedCount: "{n} selecionadas",
      type: "Tipo",
      patient: "Paciente",
      to: "Para",
    },
    messaging: {`,
  },
  fr: {
    old: `      adminMessage: "Message de l'Administrateur",
      from: "De",
    },
    messaging: {`,
    neu: `      adminMessage: "Message de l'Administrateur",
      from: "De",
      selectedCount: "{n} sélectionnées",
      type: "Type",
      patient: "Patient",
      to: "À",
    },
    messaging: {`,
  },
};

for (const [lang, { old, neu }] of Object.entries(notifsFrom)) {
  if (!s.includes(old)) {
    // try alternate adminMessage casing
    console.warn(`notifications extra not found for ${lang}, trying alt`);
  } else {
    s = s.replace(old, neu);
  }
}

const messagingClose = {
  es: {
    old: `      fromAdmin: "Mensaje del Administrador",
    },
    terms: {`,
    neu: null, // build below
  },
  en: {
    old: `      fromAdmin: "Admin Message",
    },
    terms: {`,
  },
  pt: {
    old: `      fromAdmin: "Mensagem do Administrador",
    },
    terms: {`,
  },
  fr: {
    old: `      fromAdmin: "Message de l'Administrateur",
    },
    terms: {`,
  },
};

for (const lang of ["es", "en", "pt", "fr"]) {
  const { old } = messagingClose[lang];
  const b = localeBlocks[lang];
  const neu = b.messagingExtra + "\n" + b.namespaces + "    terms: {";
  if (!s.includes(old)) throw new Error(`messaging close not found for ${lang}`);
  s = s.replace(old, neu);
}

fs.writeFileSync(path, s);
console.log("OK, length", s.length);
