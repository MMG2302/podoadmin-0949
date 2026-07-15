/**
 * Patch translations.ts: checkout.confirmPaidTitle, full usersPage, settings extensions.
 * Run once: node scripts/_i18n-patch-users-settings.mjs
 */
import fs from "fs";

const path = "src/web/i18n/translations.ts";
let src = fs.readFileSync(path, "utf8");

if (src.includes("\n  usersPage: {")) {
  console.error("Already patched (usersPage exists). Aborting.");
  process.exit(1);
}

function toTs(obj, indent = 4) {
  const sp = " ".repeat(indent);
  const sp2 = " ".repeat(indent + 2);
  if (typeof obj === "string") return JSON.stringify(obj);
  if (obj === null || typeof obj !== "object") return String(obj);
  const lines = ["{"];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      lines.push(`${sp2}${k}: ${JSON.stringify(v)},`);
    } else {
      lines.push(`${sp2}${k}: ${toTs(v, indent + 2)},`);
    }
  }
  lines.push(`${sp}}`);
  return lines.join("\n");
}

function toIface(obj, indent = 2) {
  const sp = " ".repeat(indent);
  const sp2 = " ".repeat(indent + 2);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      lines.push(`${sp2}${k}: string;`);
    } else {
      lines.push(`${sp2}${k}: {`);
      lines.push(toIface(v, indent + 2));
      lines.push(`${sp2}};`);
    }
  }
  return lines.join("\n");
}

// --- Inventory shapes (values used for ES; other locales derived) ---
const usersPageEs = {
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
    newClinicHint:
      "Se creará una clínica con datos provisionales. El administrador completará nombre, código, teléfono, dirección y el resto en Configuración.",
    podiatristLimit: "Límite de podólogos (opcional)",
    podiatristLimitPlaceholder: "Ej: 5",
    podiatristLimitHint:
      "Los podólogos de la clínica estarán limitados a este número. Recepcionistas no cuentan.",
    saving: "Creando...",
    success: "Usuario creado correctamente.",
    partialClinicFail:
      "Usuario creado, pero no se pudo crear la clínica. Configúrala después desde la edición del usuario.",
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
    description:
      "Columnas obligatorias: nombre, email, password (o usa la contraseña por defecto), rol.",
    optionalColumnsSuperAdmin:
      " Opcional: clinicMode (existing|new|none), clinicId (si existing), podiatrist_limit (solo clinic_admin).",
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
    warning:
      "Los datos se copiarán al usuario destino. El origen conservará su historial. Esta acción no se puede deshacer fácilmente.",
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
    linkHint:
      "Se ha enviado el enlace al correo del usuario. Aquí tienes el enlace para que puedas reenviarlo personalmente (WhatsApp, etc.):",
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
};

const usersPageEn = {
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
    newClinicHint:
      "A clinic will be created with provisional data. The admin will complete name, code, phone, address and the rest in Settings.",
    podiatristLimit: "Podiatrist limit (optional)",
    podiatristLimitPlaceholder: "E.g. 5",
    podiatristLimitHint:
      "Podiatrists in the clinic will be limited to this number. Receptionists do not count.",
    saving: "Creating...",
    success: "User created successfully.",
    partialClinicFail:
      "User created, but the clinic could not be created. Configure it later from user edit.",
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
    description:
      "Required columns: name, email, password (or use the default password), role.",
    optionalColumnsSuperAdmin:
      " Optional: clinicMode (existing|new|none), clinicId (if existing), podiatrist_limit (clinic_admin only).",
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
    errors: { updateFailed: "Could not update the user." },
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
    warning:
      "Data will be copied to the target user. The source keeps their history. This action is not easily undone.",
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
    linkHint:
      "The link was emailed to the user. Here is the link so you can resend it personally (WhatsApp, etc.):",
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
  export: { failed: "Could not export user data." },
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
};

const usersPagePt = {
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
    newClinicHint:
      "Uma clínica será criada com dados provisórios. O administrador completará nome, código, telefone, endereço e o restante em Configurações.",
    podiatristLimit: "Limite de podólogos (opcional)",
    podiatristLimitPlaceholder: "Ex: 5",
    podiatristLimitHint:
      "Os podólogos da clínica ficam limitados a este número. Recepcionistas não contam.",
    saving: "Criando...",
    success: "Usuário criado com sucesso.",
    partialClinicFail:
      "Usuário criado, mas a clínica não pôde ser criada. Configure depois na edição do usuário.",
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
    description:
      "Colunas obrigatórias: nome, email, password (ou use a senha padrão), rol.",
    optionalColumnsSuperAdmin:
      " Opcional: clinicMode (existing|new|none), clinicId (se existing), podiatrist_limit (só clinic_admin).",
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
    errors: { updateFailed: "Não foi possível atualizar o usuário." },
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
    warning:
      "Os dados serão copiados para o usuário de destino. A origem mantém o histórico. Esta ação não é facilmente desfeita.",
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
    linkHint:
      "O link foi enviado ao e-mail do usuário. Aqui está o link para reenviá-lo pessoalmente (WhatsApp, etc.):",
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
  export: { failed: "Não foi possível exportar os dados do usuário." },
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
};

const usersPageFr = {
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
    newClinicHint:
      "Une clinique sera créée avec des données provisoires. L'administrateur complétera le nom, le code, le téléphone, l'adresse et le reste dans Paramètres.",
    podiatristLimit: "Limite de podologues (optionnel)",
    podiatristLimitPlaceholder: "Ex. : 5",
    podiatristLimitHint:
      "Les podologues de la clinique seront limités à ce nombre. Les réceptionnistes ne comptent pas.",
    saving: "Création...",
    success: "Utilisateur créé avec succès.",
    partialClinicFail:
      "Utilisateur créé, mais la clinique n'a pas pu être créée. Configurez-la ensuite depuis l'édition utilisateur.",
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
    description:
      "Colonnes obligatoires : nombre, email, password (ou mot de passe par défaut), rol.",
    optionalColumnsSuperAdmin:
      " Optionnel : clinicMode (existing|new|none), clinicId (si existing), podiatrist_limit (clinic_admin uniquement).",
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
    errors: { updateFailed: "Impossible de mettre à jour l'utilisateur." },
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
    warning:
      "Les données seront copiées vers l'utilisateur cible. La source conserve son historique. Cette action n'est pas facilement annulable.",
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
    linkHint:
      "Le lien a été envoyé par e-mail à l'utilisateur. Voici le lien pour le renvoyer personnellement (WhatsApp, etc.) :",
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
  export: { failed: "Impossible d'exporter les données de l'utilisateur." },
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
};

const settingsExtraEs = {
  profile: {
    title: "Perfil de usuario",
    name: "Nombre",
    email: "Email",
    readOnlyHint:
      "Los datos del perfil no pueden editarse aquí. Contacte con el administrador si necesita realizar cambios.",
  },
  cooldown: {
    logoPolicy:
      "Tras guardar, el logo queda fijo durante 15 días. Pasado ese período podrás subirlo o cambiarlo de nuevo.",
    logoBlocked: "El logo solo puede modificarse cada 15 días.",
    clinicInfoPolicy:
      "Tras guardar, los datos de la clínica quedan fijos durante 15 días. Pasado ese período podrás modificarlos de nuevo.",
    clinicInfoBlocked: "Los datos solo pueden modificarse cada 15 días.",
    professionalInfoPolicy:
      "Tras guardar, estos datos quedan fijos durante 15 días. Pasado ese período podrás modificarlos de nuevo.",
    professionalInfoBlocked: "Los datos solo pueden modificarse cada 15 días.",
    profilePolicy:
      "Nombre y correo electrónico solo pueden modificarse por un administrador. Tras cada cambio deben transcurrir 15 días antes de una nueva modificación.",
    clinicReadOnlyPolicy:
      "La información de la clínica la gestiona tu administrador. Tras cada cambio deben transcurrir 15 días antes de una nueva modificación.",
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
    sharedBody:
      "Este texto lo gestiona el administrador de la clínica y se usa en el consentimiento de pacientes.",
    currentVersion: "Versión actual: {version}",
    empty: "Sin texto configurado.",
    editHint: "Puedes editar el texto; cada guardado incrementa la versión.",
    placeholder:
      "Redacta aquí los términos y el consentimiento informado que el paciente debe aceptar.",
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
    sharedBody:
      "Este logo lo ven todos los profesionales de la clínica en documentos e impresión.",
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
    clinicHint:
      "Podólogos de tu clínica a los que puedes dar servicio. Marca o desmarca para gestionar citas y pacientes de cada uno.",
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
    setupBanner:
      "Completa los datos de tu clínica. Mientras el nombre sea provisional o falten contacto y dirección, aparecerán avisos.",
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
};

const settingsExtraEn = {
  profile: {
    title: "User profile",
    name: "Name",
    email: "Email",
    readOnlyHint:
      "Profile details cannot be edited here. Contact an administrator if you need changes.",
  },
  cooldown: {
    logoPolicy:
      "After saving, the logo is locked for 15 days. After that period you can upload or change it again.",
    logoBlocked: "The logo can only be changed every 15 days.",
    clinicInfoPolicy:
      "After saving, clinic details are locked for 15 days. After that period you can edit them again.",
    clinicInfoBlocked: "Details can only be changed every 15 days.",
    professionalInfoPolicy:
      "After saving, these details are locked for 15 days. After that period you can edit them again.",
    professionalInfoBlocked: "Details can only be changed every 15 days.",
    profilePolicy:
      "Name and email can only be changed by an administrator. 15 days must pass between changes.",
    clinicReadOnlyPolicy:
      "Clinic information is managed by your administrator. 15 days must pass between changes.",
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
    sharedBody:
      "This text is managed by the clinic administrator and used for patient consent.",
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
    clinicHint:
      "Clinic podiatrists you can serve. Check or uncheck to manage appointments and patients for each.",
    independentHint: "Podiatrist who assigned you. You can create patients and manage their calendar.",
    emptyClinic: "No podiatrists in your clinic.",
    save: "Save assignment",
    empty: "No podiatrist assigned.",
  },
  receptionist: {
    title: "Receptionist",
    description: "Create and manage the receptionist linked to your account or clinic.",
    status: { blocked: "Blocked", disabled: "Disabled", active: "Active" },
    unblock: "Unblock",
    block: "Block",
    enable: "Enable",
    disable: "Disable",
    delete: "Delete",
    oneOnlyHint: "You can only have one linked receptionist. Delete them to create another.",
    fields: { name: "Name", email: "Email", initialPassword: "Initial password" },
    createdSuccess: "Receptionist created successfully.",
    create: "Create receptionist",
    createError: "Error creating receptionist",
    confirmDelete: "Delete this receptionist? This cannot be undone.",
  },
  clinicInfo: {
    title: "Clinic information",
    subtitle: "Contact and tax details for your clinic.",
    setupBanner:
      "Complete your clinic details. While the name is provisional or contact and address are missing, warnings will appear.",
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
  errors: { connectionSave: "Connection error while saving." },
  supportSenderLabel: "PodoAdmin",
};

const settingsExtraPt = {
  profile: {
    title: "Perfil do usuário",
    name: "Nome",
    email: "Email",
    readOnlyHint:
      "Os dados do perfil não podem ser editados aqui. Contate o administrador se precisar de alterações.",
  },
  cooldown: {
    logoPolicy:
      "Após guardar, o logo fica bloqueado por 15 dias. Depois desse período poderá carregá-lo ou alterá-lo novamente.",
    logoBlocked: "O logo só pode ser alterado a cada 15 dias.",
    clinicInfoPolicy:
      "Após guardar, os dados da clínica ficam bloqueados por 15 dias. Depois desse período poderá modificá-los novamente.",
    clinicInfoBlocked: "Os dados só podem ser alterados a cada 15 dias.",
    professionalInfoPolicy:
      "Após guardar, estes dados ficam bloqueados por 15 dias. Depois desse período poderá modificá-los novamente.",
    professionalInfoBlocked: "Os dados só podem ser alterados a cada 15 dias.",
    profilePolicy:
      "Nome e e-mail só podem ser alterados por um administrador. Devem decorrer 15 dias entre alterações.",
    clinicReadOnlyPolicy:
      "As informações da clínica são geridas pelo administrador. Devem decorrer 15 dias entre alterações.",
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
    sharedBody:
      "Este texto é gerido pelo administrador da clínica e usado no consentimento dos pacientes.",
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
    clinicHint:
      "Podólogos da sua clínica a quem pode prestar serviço. Marque ou desmarque para gerir consultas e pacientes de cada um.",
    independentHint: "Podólogo que o atribuiu. Pode criar pacientes e gerir o calendário deles.",
    emptyClinic: "Não há podólogos na sua clínica.",
    save: "Guardar atribuição",
    empty: "Sem podólogo atribuído.",
  },
  receptionist: {
    title: "Recepcionista",
    description: "Crie e gira a recepcionista vinculada à sua conta ou clínica.",
    status: { blocked: "Bloqueada", disabled: "Desabilitada", active: "Ativa" },
    unblock: "Desbloquear",
    block: "Bloquear",
    enable: "Habilitar",
    disable: "Desabilitar",
    delete: "Eliminar",
    oneOnlyHint: "Só pode ter uma recepcionista vinculada. Elimine-a para criar outra.",
    fields: { name: "Nome", email: "Email", initialPassword: "Senha inicial" },
    createdSuccess: "Recepcionista criada com sucesso.",
    create: "Criar recepcionista",
    createError: "Erro ao criar recepcionista",
    confirmDelete: "Eliminar esta recepcionista? Esta ação não pode ser desfeita.",
  },
  clinicInfo: {
    title: "Informação da clínica",
    subtitle: "Dados de contacto e fiscais da sua clínica.",
    setupBanner:
      "Complete os dados da sua clínica. Enquanto o nome for provisório ou faltarem contacto e morada, aparecerão avisos.",
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
  errors: { connectionSave: "Erro de ligação ao guardar." },
  supportSenderLabel: "PodoAdmin",
};

const settingsExtraFr = {
  profile: {
    title: "Profil utilisateur",
    name: "Nom",
    email: "E-mail",
    readOnlyHint:
      "Les données du profil ne peuvent pas être modifiées ici. Contactez un administrateur si besoin.",
  },
  cooldown: {
    logoPolicy:
      "Après enregistrement, le logo est verrouillé pendant 15 jours. Passé ce délai, vous pourrez le téléverser ou le changer à nouveau.",
    logoBlocked: "Le logo ne peut être modifié que tous les 15 jours.",
    clinicInfoPolicy:
      "Après enregistrement, les données de la clinique sont verrouillées pendant 15 jours. Passé ce délai, vous pourrez les modifier à nouveau.",
    clinicInfoBlocked: "Les données ne peuvent être modifiées que tous les 15 jours.",
    professionalInfoPolicy:
      "Après enregistrement, ces données sont verrouillées pendant 15 jours. Passé ce délai, vous pourrez les modifier à nouveau.",
    professionalInfoBlocked: "Les données ne peuvent être modifiées que tous les 15 jours.",
    profilePolicy:
      "Le nom et l'e-mail ne peuvent être modifiés que par un administrateur. 15 jours doivent s'écouler entre les modifications.",
    clinicReadOnlyPolicy:
      "Les informations de la clinique sont gérées par votre administrateur. 15 jours doivent s'écouler entre les modifications.",
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
    sharedBody:
      "Ce texte est géré par l'administrateur de la clinique et utilisé pour le consentement des patients.",
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
    clinicHint:
      "Podologues de votre clinique que vous pouvez servir. Cochez ou décochez pour gérer rendez-vous et patients de chacun.",
    independentHint: "Podologue qui vous a assigné. Vous pouvez créer des patients et gérer son calendrier.",
    emptyClinic: "Aucun podologue dans votre clinique.",
    save: "Enregistrer l'affectation",
    empty: "Aucun podologue assigné.",
  },
  receptionist: {
    title: "Réceptionniste",
    description: "Créez et gérez la réceptionniste liée à votre compte ou clinique.",
    status: { blocked: "Bloquée", disabled: "Désactivée", active: "Active" },
    unblock: "Débloquer",
    block: "Bloquer",
    enable: "Activer",
    disable: "Désactiver",
    delete: "Supprimer",
    oneOnlyHint: "Vous ne pouvez avoir qu'une réceptionniste liée. Supprimez-la pour en créer une autre.",
    fields: { name: "Nom", email: "E-mail", initialPassword: "Mot de passe initial" },
    createdSuccess: "Réceptionniste créée avec succès.",
    create: "Créer une réceptionniste",
    createError: "Erreur lors de la création de la réceptionniste",
    confirmDelete: "Supprimer cette réceptionniste ? Action irréversible.",
  },
  clinicInfo: {
    title: "Informations de la clinique",
    subtitle: "Coordonnées et données fiscales de votre clinique.",
    setupBanner:
      "Complétez les données de votre clinique. Tant que le nom est provisoire ou que contact et adresse manquent, des alertes apparaîtront.",
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
  errors: { connectionSave: "Erreur de connexion lors de l'enregistrement." },
  supportSenderLabel: "PodoAdmin",
};

// --- 1) checkout.confirmPaidTitle in interface ---
if (!src.includes("confirmPaidTitle:")) {
  src = src.replace(
    `    markPaid: string;\n    confirmPaid: string;`,
    `    markPaid: string;\n    confirmPaid: string;\n    confirmPaidTitle: string;`
  );
}

// --- 2) settings interface extensions ---
const settingsIfaceExtra = toIface(settingsExtraEs, 2);
src = src.replace(
  `    print: {
      title: string;
      hint: string;
      preview: string;
    };
  };`,
  `    print: {
      title: string;
      hint: string;
      preview: string;
    };
${settingsIfaceExtra}
  };`
);

// --- 3) usersPage interface ---
const usersIface = `  // Users admin page
  usersPage: {
${toIface(usersPageEs, 2)}
  };
`;
src = src.replace(
  `    defaultCta: string;
  };
}`,
  `    defaultCta: string;
  };

${usersIface}}`
);

// --- 4) Locale values: confirmPaidTitle ---
const confirmPaidTitles = {
  es: "Confirmar cobro",
  en: "Confirm payment",
  pt: "Confirmar cobrança",
  fr: "Confirmer l'encaissement",
};

for (const [lang, title] of Object.entries(confirmPaidTitles)) {
  // Find confirmPaid in each locale checkout block - replace first occurrence after looking carefully
  // Use unique strings per locale
}

src = src.replace(
  `      markPaid: "Marcar cobrado",
      confirmPaid: "¿Confirmas que {patient} ya pagó?",`,
  `      markPaid: "Marcar cobrado",
      confirmPaid: "¿Confirmas que {patient} ya pagó?",
      confirmPaidTitle: "Confirmar cobro",`
);
src = src.replace(
  `      markPaid: "Mark as paid",
      confirmPaid: "Confirm that {patient} has paid?",`,
  `      markPaid: "Mark as paid",
      confirmPaid: "Confirm that {patient} has paid?",
      confirmPaidTitle: "Confirm payment",`
);
src = src.replace(
  `      markPaid: "Marcar como pago",
      confirmPaid: "Confirma que {patient} já pagou?",`,
  `      markPaid: "Marcar como pago",
      confirmPaid: "Confirma que {patient} já pagou?",
      confirmPaidTitle: "Confirmar cobrança",`
);
src = src.replace(
  `      markPaid: "Marquer encaissé",
      confirmPaid: "Confirmer que {patient} a payé ?",`,
  `      markPaid: "Marquer encaissé",
      confirmPaid: "Confirmer que {patient} a payé ?",
      confirmPaidTitle: "Confirmer l'encaissement",`
);

// --- 5) settings locale values ---
const settingsPrintClosers = [
  {
    needle: `      print: {
        title: "Configuración de impresiones",
        hint: "Ajusta cómo se ven la historia clínica y las recetas al imprimir o guardar como PDF.",
        preview: "Vista previa",
      },
    },
    support: {
      title: "Contactar PodoAdmin",`,
    extra: settingsExtraEs,
  },
  {
    needle: `      print: {
        title: "Print settings",
        hint: "Adjust how clinical history and prescriptions look when printing or saving as PDF.",
        preview: "Preview",
      },
    },
    support: {
      title: "Contact PodoAdmin",`,
    extra: settingsExtraEn,
  },
  {
    needle: `      print: {
        title: "Configuração de impressões",
        hint: "Ajuste como a história clínica e as receitas aparecem ao imprimir ou guardar como PDF.",
        preview: "Prévia",
      },
    },
    support: {
      title: "Contactar PodoAdmin",`,
    extra: settingsExtraPt,
  },
  {
    needle: `      print: {
        title: "Paramètres d'impression",
        hint: "Ajustez l'apparence du dossier clinique et des ordonnances à l'impression ou en PDF.",
        preview: "Aperçu",
      },
    },
    support: {
      title: "Contacter PodoAdmin",`,
    extra: settingsExtraFr,
  },
];

for (const { needle, extra } of settingsPrintClosers) {
  if (!src.includes(needle)) {
    console.error("Settings print needle not found:", needle.slice(0, 120));
    throw new Error("settings locale needle not found");
  }
  const body = Object.entries(extra)
    .map(([k, v]) => {
      if (typeof v === "string") return `      ${k}: ${JSON.stringify(v)},`;
      return `      ${k}: ${toTs(v, 6)},`;
    })
    .join("\n");
  const replacement = needle.replace(
    `      },
    },
    support: {`,
    `      },
${body}
    },
    support: {`
  );
  src = src.replace(needle, replacement);
}

// --- 6) usersPage locale values (insert after each clinicalHistoriesExport close) ---
const clinicalInvalidLines = [
  {
    line: `      invalidResponse: "La respuesta del servidor no incluye datos de pacientes válidos.",`,
    users: usersPageEs,
  },
  {
    line: `      invalidResponse: "Server response did not include valid patient data.",`,
    users: usersPageEn,
  },
  {
    line: `      invalidResponse: "A resposta do servidor não inclui dados de pacientes válidos.",`,
    users: usersPagePt,
  },
  {
    line: `      invalidResponse: "La réponse du serveur ne contient pas de données patients valides.",`,
    users: usersPageFr,
  },
];

for (const { line, users } of clinicalInvalidLines) {
  const idx = src.indexOf(line);
  if (idx < 0) {
    console.error("invalidResponse line not found:", line);
    throw new Error("usersPage insertion point missing");
  }
  const closeIdx = src.indexOf("\n    },", idx);
  if (closeIdx < 0) throw new Error("clinicalHistoriesExport close missing");
  const insertAt = closeIdx + "\n    },".length;
  const block = `\n    usersPage: ${toTs(users, 4)},`;
  src = src.slice(0, insertAt) + block + src.slice(insertAt);
}

fs.writeFileSync(path, src);

const report = {
  ifaceUsersPage: src.includes("\n  usersPage: {"),
  confirmPaidTitleCount: (src.match(/confirmPaidTitle:/g) || []).length,
  usersPageValueCount: (src.match(/\n    usersPage: \{/g) || []).length,
  supportSenderLabelCount: (src.match(/supportSenderLabel:/g) || []).length,
};
console.log(report);
if (!report.ifaceUsersPage || report.confirmPaidTitleCount < 5 || report.usersPageValueCount < 4) {
  console.error("Patch incomplete");
  process.exit(1);
}
console.log("Done patching", path);
