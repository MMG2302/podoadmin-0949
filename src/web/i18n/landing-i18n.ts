import type { Language } from "./translations";

export type LandingPlan = {
  name: string;
  tagline: string;
  price: string;
  period: string;
  cta: string;
  features: string[];
  badge?: string;
  /** Tarjeta destacada (fondo oscuro). */
  highlighted?: boolean;
};

export type LandingSolution = {
  problem: string;
  solution: string;
};

/** Un paso de la sección "cómo se pone en marcha" (numerada 01/04). */
export type LandingStep = {
  title: string;
  description: string;
};

export type LandingI18n = {
  navSolutions: string;
  navFeatures: string;
  navPricing: string;
  navAudience: string;
  navSteps: string;
  navLogin: string;
  navRegister: string;
  heroTitle: string;
  heroTitleBold: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroStatDigital: string;
  heroStatAccess: string;
  heroStatSecure: string;
  solutionsTitle: string;
  solutionsSubtitle: string;
  solutionAbsences: LandingSolution;
  solutionRetention: LandingSolution;
  solutionTime: LandingSolution;
  solutionDecisions: LandingSolution;
  featuresTitle: string;
  featuresSubtitle: string;
  featureHoverHint: string;
  featureCalendarTitle: string;
  featureCalendarDesc: string;
  featureCalendarDetails: string[];
  featurePatientsTitle: string;
  featurePatientsDesc: string;
  featurePatientsDetails: string[];
  featureSessionsTitle: string;
  featureSessionsDesc: string;
  featureSessionsDetails: string[];
  featureCheckoutTitle: string;
  featureCheckoutDesc: string;
  featureCheckoutDetails: string[];
  featureWhatsappTitle: string;
  featureWhatsappDesc: string;
  featureWhatsappDetails: string[];
  featureSettingsTitle: string;
  featureSettingsDesc: string;
  featureSettingsDetails: string[];
  stepsTitle: string;
  stepsBadge: string;
  steps: LandingStep[];
  audienceTitle: string;
  audienceSubtitle: string;
  audiencePodiatristTitle: string;
  audiencePodiatristDesc: string;
  audienceClinicTitle: string;
  audienceClinicDesc: string;
  audienceReceptionTitle: string;
  audienceReceptionDesc: string;
  pricingTitle: string;
  pricingSubtitle: string;
  /** Cuatro planes: Independiente/Clínica × Base/Premium. */
  pricingPlans: LandingPlan[];
  pricingNote: string;
  /** Aclaración del asterisco de pricingNote: el tope real lo fija Meta, no el plan. */
  pricingNoteDisclaimer: string;
  rolesCardTitle: string;
  rolesCardSubtitle: string;
  rolesCardRows: { role: string; cost: string; note: string }[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  ctaLogin: string;
  footerTerms: string;
  footerPrivacy: string;
  footerRights: string;
};

const es: LandingI18n = {
  navSolutions: "Beneficios",
  navFeatures: "Funcionalidades",
  navPricing: "Precios",
  navAudience: "Para quién",
  navSteps: "Cómo empezar",
  navLogin: "Iniciar sesión",
  navRegister: "Crear cuenta",
  heroTitle: "Organiza tu consulta",
  heroTitleBold: "sin cambiar tu forma de trabajar",
  heroSubtitle:
    "Podoraa reúne tu agenda, la historia clínica y los pagos en un solo lugar. Tú sigues atendiendo como siempre: la plataforma se encarga de lo repetitivo.",
  heroCtaPrimary: "Empezar gratis",
  heroCtaSecondary: "Ya tengo cuenta",
  heroStatDigital: "Digital",
  heroStatAccess: "Acceso 24/7",
  heroStatSecure: "Seguro",
  solutionsTitle: "Menos tiempo organizando. Más tiempo con tus pacientes.",
  solutionsSubtitle: "Podoraa convierte la administración de tu consulta en algo simple y ordenado: recuerda las citas, mantiene el seguimiento al día y deja cada cosa registrada. Sin que cambies tu manera de atender.",
  solutionAbsences: {
    problem: "Agenda llena y citas confirmadas",
    solution: "Recordatorios y confirmación automática por WhatsApp, sin límite de mensajes, para que cada hueco de tu agenda se aproveche.",
  },
  solutionRetention: {
    problem: "Pacientes que vuelven una y otra vez",
    solution: "Te avisa a quién hace tiempo que no ves, para que retomes el contacto y el seguimiento del tratamiento cuando corresponde.",
  },
  solutionTime: {
    problem: "Más tiempo para atender",
    solution: "Agenda, historia clínica y registro de pagos en un solo flujo, con recepcionistas ilimitadas que absorben el papeleo, para que tu energía vaya a los pacientes.",
  },
  solutionDecisions: {
    problem: "Decisiones con datos, crecimiento con rumbo",
    solution: "Analíticas de ventas, rentabilidad y ocupación para invertir con confianza donde más rinde.",
  },
  featuresTitle: "Todo lo que necesitas en consulta",
  featuresSubtitle: "Y detrás de cada función, un objetivo: menos tareas administrativas, más tiempo con tus pacientes y el control de tu consulta siempre en tus manos.",
  featureHoverHint: "Toca o pasa el cursor para ver el detalle",
  featureCalendarTitle: "Agenda inteligente",
  featureCalendarDesc: "Calendario por profesional, citas, ocupación y métricas de agenda en tiempo real.",
  featureCalendarDetails: [
    "Vista por profesional y por día/semana",
    "Recordatorios automáticos de cita",
    "Ocupación y huecos libres de un vistazo",
  ],
  featurePatientsTitle: "Pacientes",
  featurePatientsDesc: "Ficha completa, antecedentes, demografía y seguimiento del vínculo con tu consulta.",
  featurePatientsDetails: [
    "Antecedentes médicos y podológicos",
    "Historial de visitas y evolución",
    "Búsqueda rápida y demografía",
  ],
  featureSessionsTitle: "Historia clínica podológica",
  featureSessionsDesc: "Sesiones estructuradas, plantillas personalizables, exploración y documentos clínicos.",
  featureSessionsDetails: [
    "Plantillas de sesión configurables",
    "Exploración podológica y diagramas del pie",
    "Consentimientos e informes listos para imprimir",
  ],
  featureCheckoutTitle: "Pagos y control financiero",
  featureCheckoutDesc: "Registro automático de tratamientos y pagos, estado de cuenta del paciente y cierres diarios de la consulta.",
  featureCheckoutDetails: [
    "Registro de pago y traspaso a recepción",
    "Ventas por servicio y por profesional",
    "Cierres diarios y estado de cuenta por paciente",
  ],
  featureWhatsappTitle: "WhatsApp integrado",
  featureWhatsappDesc: "Recordatorios y seguimiento de pacientes desde la misma plataforma, sin límite de mensajes.",
  featureWhatsappDetails: [
    "Recordatorios de cita sin límites",
    "Mensajes directos desde la ficha del paciente",
    "Seguimiento por grupos de pacientes",
    "WhatsApp Web y API de Meta",
  ],
  featureSettingsTitle: "Tu marca, tu consulta",
  featureSettingsDesc: "Logo, impresión, paleta de colores, layout clínico y watermark del workspace.",
  featureSettingsDetails: [
    "Logo y marca de agua propios",
    "Paleta de colores personalizable",
    "Impresión y layout clínico a medida",
  ],
  stepsTitle: "Cuatro pasos para tener todo en orden",
  stepsBadge: "Sin instalar nada y sin migrar de golpe: empiezas con lo que ya tienes, a tu ritmo.",
  steps: [
    {
      title: "Carga tu consulta como ya la tienes",
      description:
        "Tu logo, tus colores y los horarios que ya manejas. Sumas a tu recepcionista sin costo adicional y la agenda queda igual a como la llevas hoy.",
    },
    {
      title: "Las citas se confirman solas",
      description:
        "Recordatorios automáticos por WhatsApp, sin límite de mensajes. Compartes tu enlace de reservas y tus pacientes agendan viendo la marca de tu clínica, no la nuestra.",
    },
    {
      title: "Atiendes como siempre",
      description:
        "Registras la sesión con tus plantillas, la exploración podológica y los informes listos para imprimir. El pago queda anotado en el mismo flujo, sin cambiar de pantalla.",
    },
    {
      title: "Visualizas tu crecimiento",
      description:
        "Ventas, rentabilidad, ocupación de agenda y a qué pacientes hace tiempo que no ves. Los datos ya están ahí el día que los necesites.",
    },
  ],
  audienceTitle: "Diseñado para adaptarse a tu consulta",
  audienceSubtitle: "Cada perfil ve lo que necesita: desde el podólogo en consulta hasta la recepción y la dirección de clínica.",
  audiencePodiatristTitle: "Podólogos",
  audiencePodiatristDesc: "Agenda, sesiones clínicas, herramientas podológicas e informes listos para imprimir. Suma a tu recepcionista sin costo adicional.",
  audienceClinicTitle: "Clínicas",
  audienceClinicDesc: "Suma podólogos (5 incluidos, 8 en Premium) y recepcionistas ilimitadas, gestiona suscripciones, registro de pagos compartido, WhatsApp y la visión global del negocio.",
  audienceReceptionTitle: "Recepción",
  audienceReceptionDesc: "Calendario, pacientes y mensajes sin acceder a datos clínicos sensibles.",
  pricingTitle: "Precios simples y transparentes",
  pricingSubtitle: "Empieza con lo esencial y activa las funciones de crecimiento cuando las necesites.",
  pricingPlans: [
    {
      name: "ESSENTIAL",
      tagline: "Para el podólogo que trabaja solo: todo lo necesario día a día.",
      price: "$25",
      period: "/mes por profesional",
      cta: "Elegir",
      features: [
        "Agenda y calendario operativo",
        "Pacientes e historia clínica",
        "Sesiones y plantillas clínicas",
        "Registro de pagos y cierres diarios",
        "WhatsApp Web con recordatorios ilimitados",
        "Recepcionista sin costo adicional",
        "Personalización de marca",
        "Sube a Premium o a Clínica cuando crezcas",
      ],
    },
    {
      name: "ESSENTIAL PRO",
      tagline: "Para el podólogo que quiere crecer con datos.",
      price: "$40",
      period: "/mes por profesional",
      cta: "Elegir",
      features: [
        "Todo lo de ESSENTIAL",
        "Analíticas: ventas, pagos y rentabilidad",
        "Métricas avanzadas de agenda y cierres",
        "Herramientas clínicas avanzadas",
        "Seguimiento de pacientes por WhatsApp",
        "Pasa a plan Clínica cuando sumes equipo",
      ],
    },
    {
      name: "CLINIC",
      tagline: "Para equipos: la operación diaria de toda la clínica.",
      price: "$100",
      period: "/mes por clínica",
      cta: "Elegir",
      features: [
        "Todo lo de ESSENTIAL",
        "5 podólogos incluidos",
        "Podólogo adicional: $10/mes",
        "Recepcionistas ilimitadas",
        "Recepción y registro de pagos compartido",
        "Soporte prioritario",
      ],
    },
    {
      name: "CLINIC PRO",
      tagline: "Para clínicas que quieren crecer y medir el negocio.",
      price: "$160",
      period: "/mes por clínica",
      cta: "Elegir",
      badge: "Recomendado",
      highlighted: true,
      features: [
        "Todo lo de CLINIC",
        "8 podólogos incluidos",
        "Podólogo adicional: $10/mes",
        "Analíticas: ventas, pagos y rentabilidad",
        "Métricas avanzadas de agenda y cierres",
        "Herramientas clínicas avanzadas",
        "Seguimiento de pacientes por WhatsApp",
      ],
    },
  ],
  pricingNote: "Recordatorios de WhatsApp sin límites* en todos los planes. Precios en USD.",
  pricingNoteDisclaimer:
    "* Podoraa no cobra por mensaje ni te impone un tope propio. El volumen que puedes enviar depende del nivel que Meta asigne a tu cuenta de WhatsApp Business y de sus políticas vigentes.",
  rolesCardTitle: "¿Cuánto cuesta agregar usuarios?",
  rolesCardSubtitle: "Aplica a los planes de Clínica (Base y Premium)",
  rolesCardRows: [
    { role: "Podólogo incluido", cost: "Gratis", note: "5 en Base · 8 en Premium" },
    { role: "Podólogo adicional", cost: "$10/mes", note: "Por cada profesional extra" },
    { role: "Recepcionista", cost: "Gratis", note: "Sin límite de recepcionistas" },
    { role: "Admin de clínica", cost: "Incluido", note: "1 por clínica (el titular)" },
  ],
  ctaTitle: "Trabaja como siempre, con menos esfuerzo",
  ctaSubtitle: "Regístrate en minutos. Tu consulta sigue siendo tuya: Podoraa solo se encarga de lo repetitivo.",
  ctaButton: "Crear mi cuenta",
  ctaLogin: "Iniciar sesión",
  footerTerms: "Términos",
  footerPrivacy: "Privacidad",
  footerRights: "Todos los derechos reservados.",
};

const en: LandingI18n = {
  navSolutions: "Benefits",
  navFeatures: "Features",
  navPricing: "Pricing",
  navAudience: "Who it's for",
  navSteps: "How to start",
  navLogin: "Log in",
  navRegister: "Sign up",
  heroTitle: "Organize your practice",
  heroTitleBold: "without changing how you work",
  heroSubtitle:
    "Podoraa brings your schedule, clinical records and payments into one place. You keep working the way you always have — the platform takes care of the repetitive part.",
  heroCtaPrimary: "Start free",
  heroCtaSecondary: "I already have an account",
  heroStatDigital: "Digital",
  heroStatAccess: "24/7 access",
  heroStatSecure: "Secure",
  solutionsTitle: "Less time on admin. More time with your patients.",
  solutionsSubtitle: "Podoraa turns running your practice into something simple and organised: it remembers appointments, keeps follow-up on track and records every step. Without changing how you care for patients.",
  solutionAbsences: {
    problem: "A full calendar with confirmed appointments",
    solution: "Automatic WhatsApp reminders and confirmations, with no message limits, so every slot in your schedule counts.",
  },
  solutionRetention: {
    problem: "Patients who keep coming back",
    solution: "Spot who you haven't seen in a while and reconnect with campaigns and follow-up so your patient community keeps growing.",
  },
  solutionTime: {
    problem: "More time for patient care",
    solution: "Scheduling, clinical records and billing in one flow, with unlimited receptionists absorbing the paperwork, so your energy goes to your patients.",
  },
  solutionDecisions: {
    problem: "Data-backed decisions, growth with direction",
    solution: "Sales, profitability and occupancy analytics to invest with confidence where it pays off most.",
  },
  featuresTitle: "Everything you need in practice",
  featuresSubtitle: "And behind every feature, one goal: care for more patients, enjoy more time and stay in control of your business.",
  featureHoverHint: "Tap or hover to see the detail",
  featureCalendarTitle: "Smart scheduling",
  featureCalendarDesc: "Per-professional calendar, appointments, occupancy and real-time agenda metrics.",
  featureCalendarDetails: [
    "Per-professional and day/week views",
    "Automatic appointment reminders",
    "Occupancy and free slots at a glance",
  ],
  featurePatientsTitle: "Patients",
  featurePatientsDesc: "Full chart, history, demographics and engagement tracking with your practice.",
  featurePatientsDetails: [
    "Medical and podiatric history",
    "Visit history and progress notes",
    "Fast search and demographics",
  ],
  featureSessionsTitle: "Podiatry clinical records",
  featureSessionsDesc: "Structured sessions, customizable templates, examination and clinical documents.",
  featureSessionsDetails: [
    "Configurable session templates",
    "Podiatric exam and foot diagrams",
    "Consents and print-ready reports",
  ],
  featureCheckoutTitle: "Payments & financial overview",
  featureCheckoutDesc: "Checkout, handoffs, sales by service and daily closes to control revenue.",
  featureCheckoutDetails: [
    "Checkout and handoff to reception",
    "Sales by service and by professional",
    "Daily closes and accounts receivable",
  ],
  featureWhatsappTitle: "Integrated WhatsApp",
  featureWhatsappDesc: "Reminders and patient follow-up from the same platform, with no message limits.",
  featureWhatsappDetails: [
    "Unlimited appointment reminders",
    "Direct messages from the patient chart",
    "Segmented reminder campaigns",
    "WhatsApp Web and Meta API",
  ],
  featureSettingsTitle: "Your brand, your practice",
  featureSettingsDesc: "Logo, printing, color palette, clinical layout and workspace watermark.",
  featureSettingsDetails: [
    "Your own logo and watermark",
    "Customizable color palette",
    "Tailored printing and clinical layout",
  ],
  stepsTitle: "Four steps to have everything in order",
  stepsBadge: "Nothing to install, no forced migration: you start with what you already have, at your own pace.",
  steps: [
    {
      title: "Set up your practice as it already is",
      description:
        "Your logo, your colours and the hours you already work. Add your receptionist at no extra cost and keep the same schedule you run today.",
    },
    {
      title: "Appointments confirm themselves",
      description:
        "Automatic WhatsApp reminders with no message limits. Share your booking link and patients book seeing your clinic's brand, not ours.",
    },
    {
      title: "You treat patients as always",
      description:
        "Record the session with your own templates, the podiatric assessment and print-ready reports. Payment is logged in the same flow, without switching screens.",
    },
    {
      title: "You watch your practice grow",
      description:
        "Revenue, profitability, schedule occupancy and which patients you haven't seen in a while. The data is already there the day you need it.",
    },
  ],
  audienceTitle: "Built to fit your practice",
  audienceSubtitle: "Each profile sees what they need—from the consulting podiatrist to reception and clinic management.",
  audiencePodiatristTitle: "Podiatrists",
  audiencePodiatristDesc: "Schedule, clinical sessions, podiatry tools and print-ready reports. Add your receptionist at no extra cost.",
  audienceClinicTitle: "Clinics",
  audienceClinicDesc: "Add podiatrists (5 included, 8 on Premium) and unlimited receptionists, manage subscriptions, shared checkout, WhatsApp and business-wide visibility.",
  audienceReceptionTitle: "Reception",
  audienceReceptionDesc: "Calendar, patients and messaging without access to sensitive clinical data.",
  pricingTitle: "Simple, transparent pricing",
  pricingSubtitle: "Start with the essentials and turn on growth features when you need them.",
  pricingPlans: [
    {
      name: "ESSENTIAL",
      tagline: "For the solo podiatrist: everything you need day to day.",
      price: "$25",
      period: "/mo per professional",
      cta: "Choose",
      features: [
        "Scheduling and operational calendar",
        "Patients and clinical records",
        "Sessions and clinical templates",
        "Operational checkout (billing)",
        "WhatsApp Web with unlimited reminders",
        "Receptionist at no extra cost",
        "Brand customization",
        "Upgrade to Premium or Clinic as you grow",
      ],
    },
    {
      name: "ESSENTIAL PRO",
      tagline: "For the podiatrist who wants to grow with data.",
      price: "$40",
      period: "/mo per professional",
      cta: "Choose",
      features: [
        "Everything in ESSENTIAL",
        "Analytics: Sales, Collections and Profitability",
        "Advanced agenda metrics and closes",
        "Advanced clinical tools",
        "WhatsApp campaigns",
        "Move to a Clinic plan when you add a team",
      ],
    },
    {
      name: "CLINIC",
      tagline: "For teams: the daily operation of the whole clinic.",
      price: "$100",
      period: "/mo per clinic",
      cta: "Choose",
      features: [
        "Everything in ESSENTIAL",
        "5 podiatrists included",
        "Extra podiatrist: $10/mo",
        "Unlimited receptionists",
        "Reception and shared checkout",
        "Priority support",
      ],
    },
    {
      name: "CLINIC PRO",
      tagline: "For clinics that want to grow and measure the business.",
      price: "$160",
      period: "/mo per clinic",
      cta: "Choose",
      badge: "Recommended",
      highlighted: true,
      features: [
        "Everything in CLINIC",
        "8 podiatrists included",
        "Extra podiatrist: $10/mo",
        "Analytics: Sales, Collections and Profitability",
        "Advanced agenda metrics and closes",
        "Advanced clinical tools",
        "WhatsApp campaigns",
      ],
    },
  ],
  pricingNote: "Unlimited* WhatsApp reminders on every plan. Prices in USD.",
  pricingNoteDisclaimer:
    "* Podoraa charges nothing per message and sets no cap of its own. How much you can send depends on the tier Meta assigns to your WhatsApp Business account and on its current policies.",
  rolesCardTitle: "How much does it cost to add users?",
  rolesCardSubtitle: "Applies to Clinic plans (Base and Premium)",
  rolesCardRows: [
    { role: "Included podiatrist", cost: "Free", note: "5 in Base · 8 in Premium" },
    { role: "Additional podiatrist", cost: "$10/mo", note: "Per extra professional" },
    { role: "Receptionist", cost: "Free", note: "Unlimited receptionists" },
    { role: "Clinic admin", cost: "Included", note: "1 per clinic (the owner)" },
  ],
  ctaTitle: "Work as you always have, with less effort",
  ctaSubtitle: "Sign up in minutes and see how easy running your practice can be.",
  ctaButton: "Create my account",
  ctaLogin: "Log in",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerRights: "All rights reserved.",
};

const pt: LandingI18n = {
  navSolutions: "Benefícios",
  navFeatures: "Funcionalidades",
  navPricing: "Preços",
  navAudience: "Para quem",
  navSteps: "Como começar",
  navLogin: "Entrar",
  navRegister: "Criar conta",
  heroTitle: "Organize a sua consulta",
  heroTitleBold: "sem mudar a sua forma de trabalhar",
  heroSubtitle:
    "Podoraa reúne a sua agenda, o historial clínico e os pagamentos num só lugar. Continua a atender como sempre: a plataforma trata do que é repetitivo.",
  heroCtaPrimary: "Começar grátis",
  heroCtaSecondary: "Já tenho conta",
  heroStatDigital: "Digital",
  heroStatAccess: "Acesso 24/7",
  heroStatSecure: "Seguro",
  solutionsTitle: "Menos tempo a organizar. Mais tempo com os seus pacientes.",
  solutionsSubtitle: "A Podoraa transforma a gestão da sua consulta em algo simples e organizado: lembra as consultas, mantém o seguimento em dia e regista cada passo. Sem mudar a sua forma de atender.",
  solutionAbsences: {
    problem: "Agenda cheia e consultas confirmadas",
    solution: "Lembretes e confirmação automática por WhatsApp, sem limite de mensagens, para aproveitar cada espaço da sua agenda.",
  },
  solutionRetention: {
    problem: "Pacientes que voltam sempre",
    solution: "Identifique quem não vê há algum tempo e reconecte com campanhas e seguimento para que a sua comunidade de pacientes continue a crescer.",
  },
  solutionTime: {
    problem: "Mais tempo para atender",
    solution: "Agenda, história clínica e cobrança num só fluxo, com rececionistas ilimitadas a absorver a papelada, para que a sua energia vá para os pacientes.",
  },
  solutionDecisions: {
    problem: "Decisões com dados, crescimento com rumo",
    solution: "Analíticas de vendas, rentabilidade e ocupação para investir com confiança onde mais rende.",
  },
  featuresTitle: "Tudo o que precisa na consulta",
  featuresSubtitle: "E por trás de cada função, um objetivo: atender mais pacientes, ter mais tempo livre e manter o controlo do seu negócio.",
  featureHoverHint: "Toque ou passe o cursor para ver o detalhe",
  featureCalendarTitle: "Agenda inteligente",
  featureCalendarDesc: "Calendário por profissional, consultas, ocupação e métricas em tempo real.",
  featureCalendarDetails: [
    "Vista por profissional e por dia/semana",
    "Lembretes automáticos de consulta",
    "Ocupação e horários livres num relance",
  ],
  featurePatientsTitle: "Pacientes",
  featurePatientsDesc: "Ficha completa, antecedentes, demografia e acompanhamento do vínculo com a consulta.",
  featurePatientsDetails: [
    "Antecedentes médicos e podológicos",
    "Histórico de visitas e evolução",
    "Pesquisa rápida e demografia",
  ],
  featureSessionsTitle: "História clínica podológica",
  featureSessionsDesc: "Sessões estruturadas, modelos personalizáveis, exame e documentos clínicos.",
  featureSessionsDetails: [
    "Modelos de sessão configuráveis",
    "Exame podológico e diagramas do pé",
    "Consentimentos e relatórios para imprimir",
  ],
  featureCheckoutTitle: "Pagamentos e controlo financeiro",
  featureCheckoutDesc: "Checkout, handoffs, vendas por serviço e fechos diários para controlar a faturação.",
  featureCheckoutDetails: [
    "Cobrança e passagem para a receção",
    "Vendas por serviço e por profissional",
    "Fechos diários e contas a receber",
  ],
  featureWhatsappTitle: "WhatsApp integrado",
  featureWhatsappDesc: "Lembretes e seguimento de pacientes na mesma plataforma, sem limite de mensagens.",
  featureWhatsappDetails: [
    "Lembretes de consulta sem limites",
    "Mensagens diretas a partir da ficha",
    "Campanhas segmentadas de lembrete",
    "WhatsApp Web e API da Meta",
  ],
  featureSettingsTitle: "A sua marca, a sua consulta",
  featureSettingsDesc: "Logo, impressão, paleta de cores, layout clínico e watermark do workspace.",
  featureSettingsDetails: [
    "Logo e marca de água próprios",
    "Paleta de cores personalizável",
    "Impressão e layout clínico à medida",
  ],
  stepsTitle: "Quatro passos para ter tudo em ordem",
  stepsBadge: "Sem instalar nada e sem migrar de repente: começa com o que já tem, ao seu ritmo.",
  steps: [
    {
      title: "Configure a sua consulta tal como já é",
      description:
        "O seu logótipo, as suas cores e os horários que já pratica. Junta a sua rececionista sem custo adicional e a agenda fica igual à de hoje.",
    },
    {
      title: "As consultas confirmam-se sozinhas",
      description:
        "Lembretes automáticos por WhatsApp, sem limite de mensagens. Partilha o seu link de marcações e os pacientes agendam vendo a marca da sua clínica, não a nossa.",
    },
    {
      title: "Atende como sempre",
      description:
        "Regista a sessão com os seus modelos, a exploração podológica e os relatórios prontos a imprimir. O pagamento fica anotado no mesmo fluxo, sem mudar de ecrã.",
    },
    {
      title: "Vê a sua consulta a crescer",
      description:
        "Vendas, rentabilidade, ocupação da agenda e que pacientes há muito não vê. Os dados já lá estão no dia em que precisar deles.",
    },
  ],
  audienceTitle: "Feito para se adaptar à sua consulta",
  audienceSubtitle: "Cada perfil vê o que precisa: do podólogo em consulta à receção e direção da clínica.",
  audiencePodiatristTitle: "Podólogos",
  audiencePodiatristDesc: "Agenda, sessões clínicas, ferramentas podológicas e relatórios prontos para imprimir. Adicione a sua rececionista sem custo adicional.",
  audienceClinicTitle: "Clínicas",
  audienceClinicDesc: "Adicione podólogos (5 incluídos, 8 no Premium) e rececionistas ilimitadas, gira subscrições, checkout partilhado, WhatsApp e a visão global do negócio.",
  audienceReceptionTitle: "Receção",
  audienceReceptionDesc: "Calendário, pacientes e mensagens sem acesso a dados clínicos sensíveis.",
  pricingTitle: "Preços simples e transparentes",
  pricingSubtitle: "Comece com o essencial e ative as funções de crescimento quando precisar.",
  pricingPlans: [
    {
      name: "ESSENTIAL",
      tagline: "Para o podólogo que trabalha sozinho: tudo o que precisa no dia a dia.",
      price: "$25",
      period: "/mês por profissional",
      cta: "Escolher",
      features: [
        "Agenda e calendário operacional",
        "Pacientes e história clínica",
        "Sessões e modelos clínicos",
        "Checkout operacional (cobranças)",
        "WhatsApp Web com lembretes ilimitados",
        "Rececionista sem custo adicional",
        "Personalização de marca",
        "Suba para Premium ou Clínica quando crescer",
      ],
    },
    {
      name: "ESSENTIAL PRO",
      tagline: "Para o podólogo que quer crescer com dados.",
      price: "$40",
      period: "/mês por profissional",
      cta: "Escolher",
      features: [
        "Tudo do ESSENTIAL",
        "Analíticas: Vendas, Cobranças e Rentabilidade",
        "Métricas avançadas de agenda e fechos",
        "Ferramentas clínicas avançadas",
        "Campanhas de WhatsApp",
        "Mude para o plano Clínica quando somar equipa",
      ],
    },
    {
      name: "CLINIC",
      tagline: "Para equipas: a operação diária de toda a clínica.",
      price: "$100",
      period: "/mês por clínica",
      cta: "Escolher",
      features: [
        "Tudo do ESSENTIAL",
        "5 podólogos incluídos",
        "Podólogo adicional: $10/mês",
        "Rececionistas ilimitadas",
        "Receção e checkout partilhado",
        "Suporte prioritário",
      ],
    },
    {
      name: "CLINIC PRO",
      tagline: "Para clínicas que querem crescer e medir o negócio.",
      price: "$160",
      period: "/mês por clínica",
      cta: "Escolher",
      badge: "Recomendado",
      highlighted: true,
      features: [
        "Tudo do CLINIC",
        "8 podólogos incluídos",
        "Podólogo adicional: $10/mês",
        "Analíticas: Vendas, Cobranças e Rentabilidade",
        "Métricas avançadas de agenda e fechos",
        "Ferramentas clínicas avançadas",
        "Campanhas de WhatsApp",
      ],
    },
  ],
  pricingNote: "Lembretes de WhatsApp sem limites* em todos os planos. Preços em USD.",
  pricingNoteDisclaimer:
    "* Podoraa não cobra por mensagem nem impõe um limite próprio. O volume que pode enviar depende do nível que a Meta atribui à sua conta de WhatsApp Business e das suas políticas em vigor.",
  rolesCardTitle: "Quanto custa adicionar utilizadores?",
  rolesCardSubtitle: "Aplica-se aos planos de Clínica (Base e Premium)",
  rolesCardRows: [
    { role: "Podólogo incluído", cost: "Grátis", note: "5 no Base · 8 no Premium" },
    { role: "Podólogo adicional", cost: "$10/mês", note: "Por cada profissional extra" },
    { role: "Recepcionista", cost: "Grátis", note: "Recepcionistas ilimitadas" },
    { role: "Admin de clínica", cost: "Incluído", note: "1 por clínica (o titular)" },
  ],
  ctaTitle: "Trabalhe como sempre, com menos esforço",
  ctaSubtitle: "Registe-se em minutos e veja como é fácil gerir a sua consulta.",
  ctaButton: "Criar a minha conta",
  ctaLogin: "Entrar",
  footerTerms: "Termos",
  footerPrivacy: "Privacidade",
  footerRights: "Todos os direitos reservados.",
};

const fr: LandingI18n = {
  navSolutions: "Bénéfices",
  navFeatures: "Fonctionnalités",
  navPricing: "Tarifs",
  navAudience: "Pour qui",
  navSteps: "Comment démarrer",
  navLogin: "Connexion",
  navRegister: "Créer un compte",
  heroTitle: "Organisez votre cabinet",
  heroTitleBold: "sans changer votre façon de travailler",
  heroSubtitle:
    "Podoraa réunit votre agenda, le dossier clinique et les paiements en un seul endroit. Vous continuez à travailler comme toujours : la plateforme s'occupe du répétitif.",
  heroCtaPrimary: "Commencer gratuitement",
  heroCtaSecondary: "J'ai déjà un compte",
  heroStatDigital: "Numérique",
  heroStatAccess: "Accès 24/7",
  heroStatSecure: "Sécurisé",
  solutionsTitle: "Moins de temps à organiser. Plus de temps avec vos patients.",
  solutionsSubtitle: "Podoraa transforme la gestion de votre cabinet en quelque chose de simple et d'organisé : il rappelle les rendez-vous, garde le suivi à jour et enregistre chaque étape. Sans changer votre façon de soigner.",
  solutionAbsences: {
    problem: "Un agenda rempli et des rendez-vous confirmés",
    solution: "Rappels et confirmation automatique par WhatsApp, sans limite de messages, pour valoriser chaque créneau de votre agenda.",
  },
  solutionRetention: {
    problem: "Des patients qui reviennent",
    solution: "Identifiez qui vous n'avez pas vu depuis un moment et renouez avec des campagnes et un suivi pour faire grandir votre communauté de patients.",
  },
  solutionTime: {
    problem: "Plus de temps pour soigner",
    solution: "Agenda, dossier clinique et encaissement dans un seul flux, avec des réceptionnistes illimitées qui absorbent la paperasse : votre énergie va aux patients.",
  },
  solutionDecisions: {
    problem: "Des décisions appuyées sur des données",
    solution: "Analytiques de ventes, rentabilité et occupation pour investir en confiance là où ça rapporte le plus.",
  },
  featuresTitle: "Tout ce dont vous avez besoin au cabinet",
  featuresSubtitle: "Et derrière chaque fonction, un objectif : soigner plus de patients, gagner du temps libre et garder le contrôle de votre activité.",
  featureHoverHint: "Touchez ou survolez pour voir le détail",
  featureCalendarTitle: "Agenda intelligent",
  featureCalendarDesc: "Calendrier par praticien, rendez-vous, occupation et métriques en temps réel.",
  featureCalendarDetails: [
    "Vue par praticien et par jour/semaine",
    "Rappels de rendez-vous automatiques",
    "Occupation et créneaux libres en un coup d'œil",
  ],
  featurePatientsTitle: "Patients",
  featurePatientsDesc: "Dossier complet, antécédents, démographie et suivi du lien avec votre cabinet.",
  featurePatientsDetails: [
    "Antécédents médicaux et podologiques",
    "Historique des visites et évolution",
    "Recherche rapide et démographie",
  ],
  featureSessionsTitle: "Dossier clinique podologique",
  featureSessionsDesc: "Séances structurées, modèles personnalisables, examen et documents cliniques.",
  featureSessionsDetails: [
    "Modèles de séance configurables",
    "Examen podologique et schémas du pied",
    "Consentements et rapports prêts à imprimer",
  ],
  featureCheckoutTitle: "Paiements et suivi financier",
  featureCheckoutDesc: "Checkout, handoffs, ventes par service et clôtures quotidiennes.",
  featureCheckoutDetails: [
    "Encaissement et transfert à l'accueil",
    "Ventes par service et par praticien",
    "Clôtures quotidiennes et créances",
  ],
  featureWhatsappTitle: "WhatsApp intégré",
  featureWhatsappDesc: "Rappels et suivi des patients depuis la même plateforme, sans limite de messages.",
  featureWhatsappDetails: [
    "Rappels de rendez-vous illimités",
    "Messages directs depuis le dossier patient",
    "Campagnes de rappel segmentées",
    "WhatsApp Web et API Meta",
  ],
  featureSettingsTitle: "Votre marque, votre cabinet",
  featureSettingsDesc: "Logo, impression, palette de couleurs, layout clinique et filigrane.",
  featureSettingsDetails: [
    "Votre propre logo et filigrane",
    "Palette de couleurs personnalisable",
    "Impression et layout clinique sur mesure",
  ],
  stepsTitle: "Quatre étapes pour que tout soit en ordre",
  stepsBadge: "Rien à installer et pas de migration brutale : vous commencez avec ce que vous avez déjà, à votre rythme.",
  steps: [
    {
      title: "Configurez votre cabinet tel qu'il est déjà",
      description:
        "Votre logo, vos couleurs et les horaires que vous pratiquez déjà. Vous ajoutez votre secrétaire sans coût supplémentaire et l'agenda reste comme aujourd'hui.",
    },
    {
      title: "Les rendez-vous se confirment tout seuls",
      description:
        "Rappels automatiques par WhatsApp, sans limite de messages. Vous partagez votre lien de réservation et vos patients réservent en voyant la marque de votre cabinet, pas la nôtre.",
    },
    {
      title: "Vous soignez comme toujours",
      description:
        "Vous enregistrez la séance avec vos modèles, l'examen podologique et les rapports prêts à imprimer. Le paiement est noté dans le même flux, sans changer d'écran.",
    },
    {
      title: "Vous voyez votre cabinet grandir",
      description:
        "Ventes, rentabilité, taux de remplissage et patients que vous n'avez pas vus depuis longtemps. Les données sont déjà là le jour où vous en avez besoin.",
    },
  ],
  audienceTitle: "Conçu pour s'adapter à votre cabinet",
  audienceSubtitle: "Chaque profil voit ce dont il a besoin : du podologue en consultation à l'accueil et la direction.",
  audiencePodiatristTitle: "Podologues",
  audiencePodiatristDesc: "Agenda, séances cliniques, outils podologiques et rapports prêts à imprimer. Ajoutez votre réceptionniste sans coût supplémentaire.",
  audienceClinicTitle: "Cliniques",
  audienceClinicDesc: "Ajoutez des podologues (5 inclus, 8 en Premium) et des réceptionnistes illimitées, gérez abonnements, checkout partagé, WhatsApp et la vision globale de l'activité.",
  audienceReceptionTitle: "Accueil",
  audienceReceptionDesc: "Calendrier, patients et messages sans accès aux données cliniques sensibles.",
  pricingTitle: "Des tarifs simples et transparents",
  pricingSubtitle: "Commencez avec l'essentiel et activez les fonctions de croissance au besoin.",
  pricingPlans: [
    {
      name: "ESSENTIAL",
      tagline: "Pour le podologue en solo : tout le nécessaire au quotidien.",
      price: "$25",
      period: "/mois par praticien",
      cta: "Choisir",
      features: [
        "Agenda et calendrier opérationnel",
        "Patients et dossier clinique",
        "Séances et modèles cliniques",
        "Checkout opérationnel (encaissements)",
        "WhatsApp Web avec rappels illimités",
        "Réceptionniste sans coût supplémentaire",
        "Personnalisation de marque",
        "Passez à Premium ou Clinique quand vous grandissez",
      ],
    },
    {
      name: "ESSENTIAL PRO",
      tagline: "Pour le podologue qui veut croître avec des données.",
      price: "$40",
      period: "/mois par praticien",
      cta: "Choisir",
      features: [
        "Tout d'ESSENTIAL",
        "Analytiques : Ventes, Encaissements et Rentabilité",
        "Métriques avancées d'agenda et clôtures",
        "Outils cliniques avancés",
        "Campagnes WhatsApp",
        "Passez au forfait Clinique quand votre équipe s'agrandit",
      ],
    },
    {
      name: "CLINIC",
      tagline: "Pour les équipes : l'opération quotidienne de toute la clinique.",
      price: "$100",
      period: "/mois par clinique",
      cta: "Choisir",
      features: [
        "Tout d'ESSENTIAL",
        "5 podologues inclus",
        "Podologue supplémentaire : $10/mois",
        "Réceptionnistes illimitées",
        "Réception et checkout partagé",
        "Support prioritaire",
      ],
    },
    {
      name: "CLINIC PRO",
      tagline: "Pour les cliniques qui veulent croître et mesurer l'activité.",
      price: "$160",
      period: "/mois par clinique",
      cta: "Choisir",
      badge: "Recommandé",
      highlighted: true,
      features: [
        "Tout de CLINIC",
        "8 podologues inclus",
        "Podologue supplémentaire : $10/mois",
        "Analytiques : Ventes, Encaissements et Rentabilité",
        "Métriques avancées d'agenda et clôtures",
        "Outils cliniques avancés",
        "Campagnes WhatsApp",
      ],
    },
  ],
  pricingNote: "Rappels WhatsApp illimités* sur tous les plans. Prix en USD.",
  pricingNoteDisclaimer:
    "* Podoraa ne facture pas au message et n'impose aucun plafond propre. Le volume que vous pouvez envoyer dépend du niveau attribué par Meta à votre compte WhatsApp Business et de ses politiques en vigueur.",
  rolesCardTitle: "Combien coûte l'ajout d'utilisateurs ?",
  rolesCardSubtitle: "S'applique aux plans Clinique (Base et Premium)",
  rolesCardRows: [
    { role: "Podologue inclus", cost: "Gratuit", note: "5 en Base · 8 en Premium" },
    { role: "Podologue supplémentaire", cost: "10 $/mois", note: "Par professionnel en plus" },
    { role: "Réceptionniste", cost: "Gratuit", note: "Réceptionnistes illimitées" },
    { role: "Admin de clinique", cost: "Inclus", note: "1 par clinique (le titulaire)" },
  ],
  ctaTitle: "Travaillez comme toujours, avec moins d'effort",
  ctaSubtitle: "Inscrivez-vous en quelques minutes et découvrez à quel point gérer votre cabinet peut être simple.",
  ctaButton: "Créer mon compte",
  ctaLogin: "Connexion",
  footerTerms: "Conditions",
  footerPrivacy: "Confidentialité",
  footerRights: "Tous droits réservés.",
};

export const landingByLang: Record<Language, LandingI18n> = { es, en, pt, fr };
