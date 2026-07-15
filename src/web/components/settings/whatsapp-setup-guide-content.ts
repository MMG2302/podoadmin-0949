export type SetupGuideLink = { label: string; href: string };

export type SetupGuideStep = {
  text: string;
  links?: SetupGuideLink[];
};

export type SetupGuidePhase = {
  id: string;
  title: string;
  steps: SetupGuideStep[];
  callout?: { variant: "warning" | "info"; text: string };
};

export type WhatsAppSetupGuideContent = {
  title: string;
  intro: string;
  expandAll: string;
  collapseAll: string;
  checklistTitle: string;
  checklistItems: string[];
  troubleshootingTitle: string;
  troubleshootingIntro: string;
  troubleshootingItems: string[];
  phases: SetupGuidePhase[];
  officialLinksTitle: string;
};

const OFFICIAL_LINKS_ES: SetupGuideLink[] = [
  { label: "Meta Business — Usuarios del sistema", href: "https://business.facebook.com/settings/system-users" },
  { label: "Meta for Developers — Apps", href: "https://developers.facebook.com/apps/" },
  { label: "WhatsApp Cloud API — Primeros pasos", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" },
  { label: "Permisos de token del sistema", href: "https://developers.facebook.com/docs/marketing-api/system-users/overview" },
];

export const whatsappSetupGuideContent: Record<"es" | "en" | "pt" | "fr", WhatsAppSetupGuideContent> = {
  es: {
    title: "Guía completa: WhatsApp Cloud API y token permanente",
    intro:
      "Empieza en Meta for Developers: crea la app, añade WhatsApp y vincúlala a tu página y portfolio de Facebook Business. Después verifica permisos en Business Manager y continúa con el usuario del sistema. Si llevas horas atascado en «Usuarios del sistema», lee primero la sección de problemas frecuentes.",
    expandAll: "Expandir todo",
    collapseAll: "Contraer todo",
    checklistTitle: "Requisitos previos (comprueba antes de empezar)",
    checklistItems: [
      "Cuenta personal de Facebook con verificación en dos pasos (2FA) activada.",
      "Un Meta Business Manager (portfolio comercial) creado en business.facebook.com — no basta con una página de Facebook.",
      "Tu usuario personal debe ser Administrador de ese Business Manager (no Empleado ni Analista).",
      "App de tipo «Negocios» en developers.facebook.com con el producto WhatsApp añadido.",
      "Número de teléfono para WhatsApp Business API (Cloud API). No es lo mismo que WhatsApp normal en el móvil.",
    ],
    troubleshootingTitle: "¿No puedes crear un usuario del sistema?",
    troubleshootingIntro:
      "Es el bloqueo más habitual. Meta solo permite crear usuarios del sistema si cumples permisos y portfolio correctos. Revisa cada punto:",
    troubleshootingItems: [
      "Permisos insuficientes: en Business Settings → Usuarios → Personas, tu cuenta debe aparecer como Administrador. Si eres Empleado, pide al dueño del negocio que te suba a Admin o que cree el usuario del sistema por ti.",
      "Portfolio equivocado: arriba a la izquierda en business.facebook.com debe aparecer el nombre de TU negocio. Si ves solo tu nombre personal o otro negocio, abre el selector y cambia de portfolio.",
      "No existe Business Manager: ve a business.facebook.com/overview y pulsa «Crear cuenta» / «Create account». Sin portfolio comercial no hay sección de usuarios del sistema.",
      "Enlace sin sesión correcta: abre https://business.facebook.com/settings/system-users iniciando sesión con la cuenta Facebook que es admin del negocio (no una cuenta secundaria sin permisos).",
      "URL alternativa (nueva interfaz Meta): prueba business.facebook.com/latest/settings/system_users o menú ⚙ Configuración → Usuarios → Usuarios del sistema.",
      "Botón «Añadir» deshabilitado o ausente: casi siempre es falta de rol Admin. En cuentas nuevas, Meta puede pedir verificación del negocio antes de ciertas acciones.",
      "App no vinculada al Business Manager: antes de asignar activos al usuario del sistema, la app debe estar en Configuración → Cuentas → Aplicaciones. Si la app está solo en tu perfil de desarrollador personal, vincúlala al portfolio.",
      "Confundir WhatsApp personal con Business API: necesitas WhatsApp → Configuración de API en tu app de Developers, no la app WhatsApp Business del teléfono.",
      "Bloqueo por región o cuenta nueva: a veces hay que completar el asistente de WhatsApp en la app (número de prueba o producción) antes de que aparezcan activos asignables.",
      "Si nada funciona: pide al administrador principal del Business Manager que cree el usuario del sistema y te pase el token generado (solo se muestra una vez al crearlo).",
    ],
    phases: [
      {
        id: "developer-app",
        title: "Fase 1 — Crear app y conectar WhatsApp a tu negocio",
        steps: [
          {
            text: "Abre Meta for Developers → «Mis apps» → «Crear app» → tipo «Negocios» (Business).",
            links: [{ label: "developers.facebook.com/apps", href: "https://developers.facebook.com/apps/" }],
          },
          {
            text: "Añade el producto WhatsApp a la app (panel izquierdo → Añadir producto → WhatsApp → Configurar).",
          },
          {
            text: "En WhatsApp → Configuración de API (API Setup): selecciona tu portfolio de Business Manager. Si aún no tienes uno, Meta te guiará a business.facebook.com para crear la cuenta del negocio.",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          {
            text: "Vincula tu página de Facebook del negocio cuando el asistente lo pida — conecta la app de WhatsApp con tu presencia comercial en Meta.",
          },
          {
            text: "Añade un número de teléfono (de prueba de Meta para desarrollo, o tu línea Business verificada para producción).",
            links: [{ label: "Documentación Cloud API", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" }],
          },
          {
            text: "Anota el identificador de la app (App ID) — lo usarás al generar el token.",
          },
          {
            text: "Comprueba en Business Settings → Cuentas → Aplicaciones que tu app aparece vinculada al portfolio.",
            links: [{ label: "Cuentas → Apps", href: "https://business.facebook.com/settings/accounts/applications" }],
          },
          {
            text: "En Cuentas → Cuentas de WhatsApp verifica que tu WABA (WhatsApp Business Account) está visible. Si falta, vuelve a API Setup y completa la vinculación.",
            links: [{ label: "Cuentas WhatsApp", href: "https://business.facebook.com/settings/whatsapp-business-accounts" }],
          },
        ],
        callout: {
          variant: "info",
          text: "El número de prueba de Meta sirve para desarrollo; para producción debes registrar tu línea en WhatsApp Manager y completar la verificación del negocio si Meta lo solicita.",
        },
      },
      {
        id: "business-manager",
        title: "Fase 2 — Verificar permisos en Business Manager",
        steps: [
          {
            text: "Entra en business.facebook.com y confirma que el selector superior izquierdo muestra el nombre de TU negocio (no tu perfil personal).",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          {
            text: "Si no tienes portfolio: «Crear cuenta» → nombre del negocio → tus datos. Confirma el correo si Meta lo pide.",
          },
          {
            text: "Ve a Configuración → Usuarios → Personas y confirma que tu Facebook aparece con rol Administrador.",
            links: [{ label: "Usuarios (Personas)", href: "https://business.facebook.com/settings/people" }],
          },
          {
            text: "Activa la verificación en dos pasos en tu Facebook personal (Configuración → Seguridad). Meta la exige para crear usuarios del sistema y generar tokens.",
          },
          {
            text: "Sin rol Admin y activos (app + WABA) en este portfolio, el usuario del sistema no tendrá nada que asignar y el token no funcionará.",
          },
        ],
      },
      {
        id: "system-user",
        title: "Fase 3 — Usuario del sistema y token permanente",
        steps: [
          {
            text: "Ve a Configuración → Usuarios → Usuarios del sistema → Añadir. Nombre sugerido: «PodoAdmin API». Rol: Administrador.",
            links: [{ label: "Usuarios del sistema", href: "https://business.facebook.com/settings/system-users" }],
          },
          {
            text: "Con el usuario creado, pulsa «Añadir activos» → Apps → selecciona tu app → Control total (Full control).",
          },
          {
            text: "Pulsa otra vez «Añadir activos» → Cuentas de WhatsApp → tu WABA → Control total.",
          },
          {
            text: "Pulsa «Generar token» → elige tu app → marca permisos: whatsapp_business_messaging y whatsapp_business_management (mínimo para enviar plantillas y leer números).",
          },
          {
            text: "Copia el token inmediatamente y guárdalo en un lugar seguro. Meta no lo vuelve a mostrar. Ese token no caduca mientras no lo revoques.",
          },
        ],
        callout: {
          variant: "warning",
          text: "No uses el token temporal del Graph API Explorer (caduca en horas). El token del usuario del sistema es el permanente que necesita PodoAdmin.",
        },
      },
      {
        id: "ids",
        title: "Fase 4 — Obtener Phone Number ID y WABA ID",
        steps: [
          {
            text: "En developers.facebook.com → tu app → WhatsApp → Configuración de API (API Setup): copia «Identificador del número de teléfono» → es el Phone Number ID.",
          },
          {
            text: "En el mismo panel copia «Identificador de la cuenta de WhatsApp Business» → WABA ID (opcional en PodoAdmin pero recomendado).",
          },
          {
            text: "Opcional: anota el número en formato E.164 (+34…) que muestra Meta como teléfono del negocio.",
          },
        ],
      },
      {
        id: "template",
        title: "Fase 5 — Plantilla de mensaje aprobada",
        steps: [
          {
            text: "Abre WhatsApp Manager → Plantillas de mensajes → Crear plantilla (categoría Utilidad / Utility para recordatorios).",
            links: [{ label: "WhatsApp Manager", href: "https://business.facebook.com/wa/manage/message-templates/" }],
          },
          {
            text: "Cuerpo con 4 variables: {{1}} nombre del paciente, {{2}} fecha, {{3}} hora, {{4}} notas. Ejemplo: «Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. {{4}}»",
          },
          {
            text: "Envía a revisión y espera estado «Aprobada» (puede tardar desde minutos hasta 48 h). Sin plantilla aprobada Meta rechazará los envíos.",
          },
          {
            text: "Copia el nombre exacto de la plantilla (ej. appointment_reminder) y el código de idioma (ej. es).",
          },
        ],
      },
      {
        id: "podoadmin",
        title: "Fase 6 — Conectar en PodoAdmin",
        steps: [
          { text: "Pega Phone Number ID, WABA ID (opcional) y el token permanente en el formulario de abajo." },
          { text: "Indica el nombre e idioma de la plantilla aprobada y activa recordatorios si los necesitas." },
          { text: "Guarda y pulsa «Probar conexión». Si falla, el mensaje de error suele indicar token revocado, ID incorrecto o permisos faltantes." },
          { text: "Desde «Mensajes WhatsApp» puedes enviar un recordatorio manual de prueba a un paciente con teléfono." },
        ],
      },
    ],
    officialLinksTitle: "Enlaces oficiales de Meta",
  },
  en: {
    title: "Full guide: WhatsApp Cloud API and permanent token",
    intro:
      "Start in Meta for Developers: create the app, add WhatsApp, and link it to your Facebook Page and Business portfolio. Then verify permissions in Business Manager and continue with the system user. If you are stuck on System users, read Troubleshooting first.",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    checklistTitle: "Prerequisites (check before you start)",
    checklistItems: [
      "Personal Facebook account with two-factor authentication (2FA) enabled.",
      "A Meta Business Manager portfolio at business.facebook.com — a Facebook Page alone is not enough.",
      "Your personal user must be an Administrator of that Business Manager (not Employee or Analyst).",
      "A Business-type app on developers.facebook.com with the WhatsApp product added.",
      "A phone number for WhatsApp Business API (Cloud API). Not the same as regular WhatsApp on your phone.",
    ],
    troubleshootingTitle: "Can't create a system user?",
    troubleshootingIntro:
      "This is the most common blocker. Meta only allows system users when you have the right portfolio and Admin role. Check each item:",
    troubleshootingItems: [
      "Insufficient permissions: in Business Settings → Users → People, your account must be Administrator. If you are Employee, ask the business owner to promote you or create the system user for you.",
      "Wrong portfolio: top-left on business.facebook.com must show YOUR business name. Switch portfolio if you see a personal profile or another business.",
      "No Business Manager: go to business.facebook.com/overview and click Create account. Without a business portfolio there is no system users section.",
      "Wrong login: open https://business.facebook.com/settings/system-users logged in as the Facebook account that is business Admin.",
      "Alternate URL (new Meta UI): try business.facebook.com/latest/settings/system_users or Settings → Users → System users.",
      "Add button missing or disabled: usually missing Admin role. New accounts may require business verification first.",
      "App not linked to Business Manager: link it under Settings → Accounts → Apps before assigning assets to the system user.",
      "Confusing personal WhatsApp with Business API: you need WhatsApp → API Setup in your Developers app.",
      "Region or new account limits: complete the WhatsApp setup wizard in the app (test or production number) before assignable assets appear.",
      "Last resort: ask the primary Business Manager admin to create the system user and share the generated token (shown only once).",
    ],
    phases: [
      {
        id: "developer-app",
        title: "Phase 1 — Create app and connect WhatsApp to your business",
        steps: [
          {
            text: "Open Meta for Developers → My Apps → Create App → Business type.",
            links: [{ label: "developers.facebook.com/apps", href: "https://developers.facebook.com/apps/" }],
          },
          { text: "Add the WhatsApp product (left panel → Add product → WhatsApp → Set up)." },
          {
            text: "In WhatsApp → API Setup: select your Business Manager portfolio. If you do not have one yet, Meta will guide you to business.facebook.com to create the business account.",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          {
            text: "Link your business Facebook Page when the wizard asks — this connects your WhatsApp app to your commercial presence on Meta.",
          },
          {
            text: "Add a phone number (Meta test number for development, or your verified business line for production).",
            links: [{ label: "Cloud API docs", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" }],
          },
          { text: "Note your App ID — you will need it when generating the token." },
          {
            text: "In Business Settings → Accounts → Apps, confirm your app is linked to the portfolio.",
            links: [{ label: "Accounts → Apps", href: "https://business.facebook.com/settings/accounts/applications" }],
          },
          {
            text: "Under Accounts → WhatsApp Accounts confirm your WABA is visible. If not, return to API Setup and finish linking.",
            links: [{ label: "WhatsApp Accounts", href: "https://business.facebook.com/settings/whatsapp-business-accounts" }],
          },
        ],
        callout: {
          variant: "info",
          text: "Meta's test number is for development; production requires registering your line in WhatsApp Manager and business verification if requested.",
        },
      },
      {
        id: "business-manager",
        title: "Phase 2 — Verify Business Manager permissions",
        steps: [
          {
            text: "Open business.facebook.com and confirm the top-left selector shows YOUR business name (not your personal profile).",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          { text: "If you have no portfolio: Create account → business name → your details. Confirm email if Meta asks." },
          {
            text: "Go to Settings → Users → People and confirm your Facebook user is Administrator.",
            links: [{ label: "People", href: "https://business.facebook.com/settings/people" }],
          },
          { text: "Enable 2FA on your personal Facebook — Meta requires it to create system users and generate tokens." },
          { text: "Without Admin role and assets (app + WABA) in this portfolio, the system user has nothing to assign and the token will not work." },
        ],
      },
      {
        id: "system-user",
        title: "Phase 3 — System user and permanent token",
        steps: [
          {
            text: "Settings → Users → System users → Add. Suggested name: PodoAdmin API. Role: Administrator.",
            links: [{ label: "System users", href: "https://business.facebook.com/settings/system-users" }],
          },
          { text: "Select the user → Add assets → Apps → your app → Full control." },
          { text: "Add assets again → WhatsApp accounts → your WABA → Full control." },
          { text: "Generate token → select your app → enable whatsapp_business_messaging and whatsapp_business_management." },
          { text: "Copy the token immediately and store it safely. Meta will not show it again. It does not expire unless revoked." },
        ],
        callout: {
          variant: "warning",
          text: "Do not use the temporary Graph API Explorer token (expires in hours). The system user token is the permanent one PodoAdmin needs.",
        },
      },
      {
        id: "ids",
        title: "Phase 4 — Get Phone Number ID and WABA ID",
        steps: [
          { text: "developers.facebook.com → your app → WhatsApp → API Setup: copy Phone number ID." },
          { text: "In the same panel copy WhatsApp Business Account ID (WABA ID)." },
          { text: "Optional: note the business phone in E.164 format (+…)." },
        ],
      },
      {
        id: "template",
        title: "Phase 5 — Approved message template",
        steps: [
          {
            text: "WhatsApp Manager → Message templates → Create (Utility category for reminders).",
            links: [{ label: "WhatsApp Manager", href: "https://business.facebook.com/wa/manage/message-templates/" }],
          },
          { text: "Body with 4 variables: {{1}} patient name, {{2}} date, {{3}} time, {{4}} notes." },
          { text: "Submit for review and wait for Approved status (minutes to 48 hours)." },
          { text: "Copy the exact template name (e.g. appointment_reminder) and language code (e.g. en)." },
        ],
      },
      {
        id: "podoadmin",
        title: "Phase 6 — Connect in PodoAdmin",
        steps: [
          { text: "Paste Phone Number ID, WABA ID (optional), and permanent token in the form below." },
          { text: "Enter approved template name and language; enable reminders if needed." },
          { text: "Save and click Test connection. Errors usually mean revoked token, wrong ID, or missing permissions." },
          { text: "Use WhatsApp Messages to send a manual test reminder to a patient with a phone number." },
        ],
      },
    ],
    officialLinksTitle: "Official Meta links",
  },
  pt: {
    title: "Guia completa: WhatsApp Cloud API e token permanente",
    intro:
      "Comece no Meta for Developers: crie o app, adicione o WhatsApp e vincule-o à sua Página e portfolio do Facebook Business. Depois verifique as permissões no Business Manager e continue com o usuário do sistema. Se estiver bloqueado em Usuários do sistema, leia primeiro a seção de problemas frequentes.",
    expandAll: "Expandir tudo",
    collapseAll: "Recolher tudo",
    checklistTitle: "Pré-requisitos (verifique antes de começar)",
    checklistItems: [
      "Conta pessoal do Facebook com autenticação de dois fatores (2FA) ativada.",
      "Um Meta Business Manager em business.facebook.com — uma Página do Facebook não basta.",
      "Seu usuário pessoal deve ser Administrador desse Business Manager (não Funcionário nem Analista).",
      "App do tipo Negócios em developers.facebook.com com o produto WhatsApp adicionado.",
      "Número de telefone para WhatsApp Business API (Cloud API). Não é o WhatsApp comum do celular.",
    ],
    troubleshootingTitle: "Não consegue criar um usuário do sistema?",
    troubleshootingIntro:
      "É o bloqueio mais comum. A Meta só permite usuários do sistema com o portfolio e permissões corretos. Verifique cada item:",
    troubleshootingItems: [
      "Permissões insuficientes: em Configurações → Usuários → Pessoas, sua conta deve ser Administrador.",
      "Portfolio errado: canto superior esquerdo em business.facebook.com deve mostrar SEU negócio.",
      "Sem Business Manager: crie em business.facebook.com/overview → Criar conta.",
      "Login incorreto: abra https://business.facebook.com/settings/system-users com a conta Admin do negócio.",
      "URL alternativa: business.facebook.com/latest/settings/system_users ou Configurações → Usuários → Usuários do sistema.",
      "Botão Adicionar ausente: geralmente falta papel Admin ou verificação do negócio.",
      "App não vinculada ao Business Manager: vincule em Contas → Aplicativos antes de atribuir ativos.",
      "Confundir WhatsApp pessoal com Business API: use WhatsApp → API Setup na app de Developers.",
      "Conta nova: complete o assistente WhatsApp na app antes dos ativos aparecerem.",
      "Último recurso: peça ao admin principal para criar o usuário do sistema e compartilhar o token (mostrado uma vez).",
    ],
    phases: [
      {
        id: "developer-app",
        title: "Fase 1 — Criar app e conectar WhatsApp ao seu negócio",
        steps: [
          {
            text: "developers.facebook.com → Meus apps → Criar app → tipo Negócios.",
            links: [{ label: "developers.facebook.com/apps", href: "https://developers.facebook.com/apps/" }],
          },
          { text: "Adicione o produto WhatsApp (painel esquerdo → Adicionar produto → WhatsApp → Configurar)." },
          {
            text: "Em WhatsApp → API Setup: selecione seu portfolio do Business Manager. Se ainda não tiver um, a Meta guiará você em business.facebook.com para criar a conta do negócio.",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          { text: "Vincule sua Página do Facebook do negócio quando o assistente solicitar." },
          {
            text: "Adicione um número de telefone (número de teste da Meta ou linha Business verificada).",
            links: [{ label: "Cloud API", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" }],
          },
          { text: "Anote o App ID." },
          {
            text: "Em Configurações → Contas → Aplicativos, confirme que seu app está vinculado ao portfolio.",
            links: [{ label: "Contas → Apps", href: "https://business.facebook.com/settings/accounts/applications" }],
          },
          {
            text: "Em Contas → Contas do WhatsApp, confirme que sua WABA está visível.",
            links: [{ label: "Contas WhatsApp", href: "https://business.facebook.com/settings/whatsapp-business-accounts" }],
          },
        ],
        callout: {
          variant: "info",
          text: "Número de teste da Meta é para desenvolvimento; produção exige registro no WhatsApp Manager.",
        },
      },
      {
        id: "business-manager",
        title: "Fase 2 — Verificar permissões no Business Manager",
        steps: [
          {
            text: "Acesse business.facebook.com e confirme que o seletor superior esquerdo mostra SEU negócio.",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          { text: "Sem portfolio: Criar conta → nome do negócio → seus dados." },
          {
            text: "Configurações → Usuários → Pessoas — confirme que você é Administrador.",
            links: [{ label: "Pessoas", href: "https://business.facebook.com/settings/people" }],
          },
          { text: "Ative 2FA no Facebook pessoal — a Meta exige para criar usuários do sistema." },
          { text: "Sem papel Admin e ativos (app + WABA) neste portfolio, o usuário do sistema não terá o que atribuir." },
        ],
      },
      {
        id: "system-user",
        title: "Fase 3 — Usuário do sistema e token permanente",
        steps: [
          {
            text: "Configurações → Usuários → Usuários do sistema → Adicionar. Nome: PodoAdmin API. Papel: Administrador.",
            links: [{ label: "Usuários do sistema", href: "https://business.facebook.com/settings/system-users" }],
          },
          { text: "Adicionar ativos → Apps → sua app → Controle total." },
          { text: "Adicionar ativos → Contas WhatsApp → WABA → Controle total." },
          { text: "Gerar token → app → permissões whatsapp_business_messaging e whatsapp_business_management." },
          { text: "Copie o token imediatamente. Não expira enquanto não for revogado." },
        ],
        callout: {
          variant: "warning",
          text: "Não use token temporário do Graph API Explorer. Use o token do usuário do sistema.",
        },
      },
      {
        id: "ids",
        title: "Fase 4 — Phone Number ID e WABA ID",
        steps: [
          { text: "App → WhatsApp → API Setup: copie Phone number ID e WABA ID." },
          { text: "Opcional: telefone E.164 do negócio." },
        ],
      },
      {
        id: "template",
        title: "Fase 5 — Modelo de mensagem aprovado",
        steps: [
          {
            text: "WhatsApp Manager → Modelos de mensagem → Criar (Utilidade).",
            links: [{ label: "WhatsApp Manager", href: "https://business.facebook.com/wa/manage/message-templates/" }],
          },
          { text: "Corpo com {{1}} nome, {{2}} data, {{3}} hora, {{4}} notas." },
          { text: "Aguarde status Aprovado." },
          { text: "Copie nome exato e idioma (ex. pt_BR ou es)." },
        ],
      },
      {
        id: "podoadmin",
        title: "Fase 6 — Conectar no PodoAdmin",
        steps: [
          { text: "Cole Phone Number ID, WABA ID e token no formulário abaixo." },
          { text: "Informe modelo aprovado e teste a conexão." },
        ],
      },
    ],
    officialLinksTitle: "Links oficiais da Meta",
  },
  fr: {
    title: "Guide complet : WhatsApp Cloud API et jeton permanent",
    intro:
      "Commencez sur Meta for Developers : créez l'app, ajoutez WhatsApp et liez-la à votre Page et portfolio Facebook Business. Vérifiez ensuite les permissions dans Business Manager, puis continuez avec l'utilisateur système. Si vous êtes bloqué sur « Utilisateurs système », lisez d'abord la section dépannage.",
    expandAll: "Tout développer",
    collapseAll: "Tout réduire",
    checklistTitle: "Prérequis (à vérifier avant de commencer)",
    checklistItems: [
      "Compte Facebook personnel avec authentification à deux facteurs (2FA) activée.",
      "Un Meta Business Manager (portfolio commercial) sur business.facebook.com — une Page Facebook seule ne suffit pas.",
      "Votre compte personnel doit être Administrateur de ce Business Manager (pas Employé ni Analyste).",
      "App de type « Entreprise » sur developers.facebook.com avec le produit WhatsApp ajouté.",
      "Numéro de téléphone pour WhatsApp Business API (Cloud API). Ce n'est pas WhatsApp classique sur le téléphone.",
    ],
    troubleshootingTitle: "Impossible de créer un utilisateur système ?",
    troubleshootingIntro:
      "C'est le blocage le plus courant. Meta n'autorise les utilisateurs système qu'avec le bon portfolio et les bonnes permissions. Vérifiez chaque point :",
    troubleshootingItems: [
      "Permissions insuffisantes : dans Business Settings → Utilisateurs → Personnes, votre compte doit être Administrateur. Si vous êtes Employé, demandez au propriétaire de vous promouvoir ou de créer l'utilisateur système.",
      "Mauvais portfolio : en haut à gauche sur business.facebook.com doit apparaître le nom de VOTRE entreprise. Changez de portfolio si vous voyez un profil personnel ou une autre entreprise.",
      "Pas de Business Manager : allez sur business.facebook.com/overview et cliquez sur Créer un compte. Sans portfolio commercial, il n'y a pas de section utilisateurs système.",
      "Mauvaise session : ouvrez https://business.facebook.com/settings/system-users connecté avec le compte Facebook admin de l'entreprise.",
      "URL alternative (nouvelle interface Meta) : essayez business.facebook.com/latest/settings/system_users ou Paramètres → Utilisateurs → Utilisateurs système.",
      "Bouton Ajouter absent ou désactivé : souvent dû à un rôle Admin manquant. Les comptes nouveaux peuvent exiger une vérification de l'entreprise.",
      "App non liée au Business Manager : liez-la sous Paramètres → Comptes → Applications avant d'attribuer des actifs à l'utilisateur système.",
      "Confusion WhatsApp personnel / Business API : vous avez besoin de WhatsApp → Configuration API dans votre app Developers.",
      "Limites régionales ou compte nouveau : terminez l'assistant WhatsApp dans l'app (numéro test ou production) avant que les actifs n'apparaissent.",
      "Dernier recours : demandez à l'admin principal du Business Manager de créer l'utilisateur système et de partager le jeton (affiché une seule fois).",
    ],
    phases: [
      {
        id: "developer-app",
        title: "Phase 1 — Créer l'app et connecter WhatsApp à votre entreprise",
        steps: [
          {
            text: "Ouvrez Meta for Developers → Mes apps → Créer une app → type Entreprise (Business).",
            links: [{ label: "developers.facebook.com/apps", href: "https://developers.facebook.com/apps/" }],
          },
          { text: "Ajoutez le produit WhatsApp (panneau gauche → Ajouter un produit → WhatsApp → Configurer)." },
          {
            text: "Dans WhatsApp → Configuration API : sélectionnez votre portfolio Business Manager. Si vous n'en avez pas, Meta vous guidera sur business.facebook.com.",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          { text: "Liez votre Page Facebook professionnelle quand l'assistant le demande." },
          {
            text: "Ajoutez un numéro (numéro test Meta pour le développement, ou ligne entreprise vérifiée pour la production).",
            links: [{ label: "Cloud API", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" }],
          },
          { text: "Notez votre App ID — vous en aurez besoin pour générer le jeton." },
          {
            text: "Dans Paramètres → Comptes → Applications, confirmez que l'app est liée au portfolio.",
            links: [{ label: "Comptes → Apps", href: "https://business.facebook.com/settings/accounts/applications" }],
          },
          {
            text: "Sous Comptes → Comptes WhatsApp, confirmez que votre WABA est visible.",
            links: [{ label: "Comptes WhatsApp", href: "https://business.facebook.com/settings/whatsapp-business-accounts" }],
          },
        ],
        callout: {
          variant: "info",
          text: "Le numéro test Meta sert au développement ; la production exige l'enregistrement de la ligne dans WhatsApp Manager.",
        },
      },
      {
        id: "business-manager",
        title: "Phase 2 — Vérifier les permissions Business Manager",
        steps: [
          {
            text: "Ouvrez business.facebook.com et confirmez que le sélecteur en haut à gauche affiche VOTRE entreprise.",
            links: [{ label: "business.facebook.com", href: "https://business.facebook.com/" }],
          },
          { text: "Sans portfolio : Créer un compte → nom de l'entreprise → vos coordonnées." },
          {
            text: "Paramètres → Utilisateurs → Personnes — confirmez que vous êtes Administrateur.",
            links: [{ label: "Personnes", href: "https://business.facebook.com/settings/people" }],
          },
          { text: "Activez la 2FA sur votre Facebook personnel — Meta l'exige pour créer des utilisateurs système." },
          { text: "Sans rôle Admin et actifs (app + WABA) dans ce portfolio, l'utilisateur système n'aura rien à assigner." },
        ],
      },
      {
        id: "system-user",
        title: "Phase 3 — Utilisateur système et jeton permanent",
        steps: [
          {
            text: "Paramètres → Utilisateurs → Utilisateurs système → Ajouter. Nom : PodoAdmin API. Rôle : Administrateur.",
            links: [{ label: "Utilisateurs système", href: "https://business.facebook.com/settings/system-users" }],
          },
          { text: "Ajouter des actifs → Applications → votre app → Contrôle total." },
          { text: "Ajouter des actifs → Comptes WhatsApp → WABA → Contrôle total." },
          { text: "Générer un jeton → app → permissions whatsapp_business_messaging et whatsapp_business_management." },
          { text: "Copiez le jeton immédiatement. Il n'expire pas tant qu'il n'est pas révoqué." },
        ],
        callout: {
          variant: "warning",
          text: "N'utilisez pas le jeton temporaire de Graph API Explorer. Utilisez le jeton de l'utilisateur système.",
        },
      },
      {
        id: "ids",
        title: "Phase 4 — Phone Number ID et WABA ID",
        steps: [
          { text: "App → WhatsApp → Configuration API : copiez Phone number ID et WABA ID." },
          { text: "Optionnel : téléphone E.164 de l'entreprise." },
        ],
      },
      {
        id: "template",
        title: "Phase 5 — Modèle de message approuvé",
        steps: [
          {
            text: "WhatsApp Manager → Modèles de message → Créer (Utilité).",
            links: [{ label: "WhatsApp Manager", href: "https://business.facebook.com/wa/manage/message-templates/" }],
          },
          { text: "Corps avec {{1}} nom, {{2}} date, {{3}} heure, {{4}} notes." },
          { text: "Attendez le statut Approuvé." },
          { text: "Copiez le nom exact et la langue (ex. fr ou es)." },
        ],
      },
      {
        id: "podoadmin",
        title: "Phase 6 — Connecter dans PodoAdmin",
        steps: [
          { text: "Collez Phone Number ID, WABA ID et le jeton dans le formulaire ci-dessous." },
          { text: "Indiquez le modèle approuvé et testez la connexion." },
        ],
      },
    ],
    officialLinksTitle: "Liens officiels Meta",
  },
};

export const officialMetaLinks = OFFICIAL_LINKS_ES;
