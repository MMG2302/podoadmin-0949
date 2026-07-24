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

export type LandingI18n = {
  navSolutions: string;
  navFeatures: string;
  navPricing: string;
  navAudience: string;
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
  navLogin: "Iniciar sesión",
  navRegister: "Crear cuenta",
  heroTitle: "Enfócate en lo que importa",
  heroTitleBold: "y atiende más pacientes",
  heroSubtitle:
    "Agenda organizada, citas confirmadas y pacientes que vuelven. PodoAdmin reúne tu consulta en un solo lugar y te da los datos para crecer con confianza.",
  heroCtaPrimary: "Empezar gratis",
  heroCtaSecondary: "Ya tengo cuenta",
  heroStatDigital: "Digital",
  heroStatAccess: "Acceso 24/7",
  heroStatSecure: "Seguro",
  solutionsTitle: "Todo listo para que tu consulta crezca",
  solutionsSubtitle: "PodoAdmin trabaja por ti en segundo plano: agenda llena, pacientes fieles y decisiones respaldadas por datos.",
  solutionAbsences: {
    problem: "Agenda llena y citas confirmadas",
    solution: "Recordatorios y confirmación automática por WhatsApp, sin límite de mensajes, para que cada hueco de tu agenda se aproveche.",
  },
  solutionRetention: {
    problem: "Pacientes que vuelven una y otra vez",
    solution: "Identifica a quién hace tiempo que no ves y reconecta con campañas y seguimiento para que tu comunidad de pacientes siga creciendo.",
  },
  solutionTime: {
    problem: "Más tiempo para atender",
    solution: "Agenda, historia clínica y cobro en un solo flujo, con recepcionistas ilimitadas que absorben el papeleo, para que tu energía vaya a los pacientes.",
  },
  solutionDecisions: {
    problem: "Decisiones con datos, crecimiento con rumbo",
    solution: "Analíticas de ventas, rentabilidad y ocupación para invertir con confianza donde más rinde.",
  },
  featuresTitle: "Todo lo que necesitas en consulta",
  featuresSubtitle: "Y detrás de cada función, un objetivo: que atiendas más pacientes, disfrutes de más tiempo y tengas el control de tu negocio.",
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
  featureCheckoutTitle: "Cobros y analíticas",
  featureCheckoutDesc: "Checkout, handoffs, ventas por servicio y cierres diarios para controlar la facturación.",
  featureCheckoutDetails: [
    "Cobro y traspaso a recepción (handoff)",
    "Ventas por servicio y por profesional",
    "Cierres diarios y cuentas por cobrar",
  ],
  featureWhatsappTitle: "WhatsApp integrado",
  featureWhatsappDesc: "Mensajes y campañas desde la misma plataforma, con recordatorios ilimitados para tus pacientes.",
  featureWhatsappDetails: [
    "Recordatorios de cita sin límites",
    "Mensajes directos desde la ficha del paciente",
    "Campañas segmentadas de recordatorio",
    "WhatsApp Web y API de Meta",
  ],
  featureSettingsTitle: "Tu marca, tu consulta",
  featureSettingsDesc: "Logo, impresión, paleta de colores, layout clínico y watermark del workspace.",
  featureSettingsDetails: [
    "Logo y marca de agua propios",
    "Paleta de colores personalizable",
    "Impresión y layout clínico a medida",
  ],
  audienceTitle: "Diseñado para tu rol",
  audienceSubtitle: "Cada perfil ve lo que necesita: desde el podólogo en consulta hasta la recepción y la dirección de clínica.",
  audiencePodiatristTitle: "Podólogos",
  audiencePodiatristDesc: "Agenda, sesiones clínicas, herramientas podológicas e informes listos para imprimir. Suma a tu recepcionista sin costo adicional.",
  audienceClinicTitle: "Clínicas",
  audienceClinicDesc: "Suma podólogos (5 incluidos, 8 en Premium) y recepcionistas ilimitadas, gestiona suscripciones, checkout compartido, WhatsApp y la visión global del negocio.",
  audienceReceptionTitle: "Recepción",
  audienceReceptionDesc: "Calendario, pacientes y mensajes sin acceder a datos clínicos sensibles.",
  pricingTitle: "Precios simples y transparentes",
  pricingSubtitle: "Empieza con lo esencial y activa las funciones de crecimiento cuando las necesites.",
  pricingPlans: [
    {
      name: "Independiente Base",
      tagline: "Para el podólogo que trabaja solo: todo lo necesario día a día.",
      price: "$25",
      period: "/mes por profesional",
      cta: "Empezar gratis",
      features: [
        "Agenda y calendario operativo",
        "Pacientes e historia clínica",
        "Sesiones y plantillas clínicas",
        "Checkout operativo (cobros)",
        "WhatsApp Web con recordatorios ilimitados",
        "Recepcionista sin costo adicional",
        "Personalización de marca",
        "Sube a Premium o a Clínica cuando crezcas",
      ],
    },
    {
      name: "Independiente Premium",
      tagline: "Para el podólogo que quiere crecer con datos.",
      price: "$40",
      period: "/mes por profesional",
      cta: "Elegir Premium",
      features: [
        "Todo lo de Independiente Base",
        "Analíticas: Ventas, Cobros y Rentabilidad",
        "Métricas avanzadas de agenda y cierres",
        "Herramientas clínicas avanzadas",
        "Campañas de WhatsApp",
        "Pasa a plan Clínica cuando sumes equipo",
      ],
    },
    {
      name: "Clínica Base",
      tagline: "Para equipos: la operación diaria de toda la clínica.",
      price: "$100",
      period: "/mes por clínica",
      cta: "Elegir Clínica",
      features: [
        "Todo lo de Independiente Base",
        "5 podólogos incluidos",
        "Podólogo adicional: $10/mes",
        "Recepcionistas ilimitadas",
        "Recepción y checkout compartido",
        "Soporte prioritario",
      ],
    },
    {
      name: "Clínica Premium",
      tagline: "Para clínicas que quieren crecer y medir el negocio.",
      price: "$160",
      period: "/mes por clínica",
      cta: "Elegir Clínica Premium",
      badge: "Recomendado",
      highlighted: true,
      features: [
        "Todo lo de Clínica Base",
        "8 podólogos incluidos",
        "Podólogo adicional: $10/mes",
        "Analíticas: Ventas, Cobros y Rentabilidad",
        "Métricas avanzadas de agenda y cierres",
        "Herramientas clínicas avanzadas",
        "Campañas de WhatsApp",
      ],
    },
  ],
  pricingNote: "Recordatorios de WhatsApp sin límites en todos los planes. Precios en USD.",
  rolesCardTitle: "¿Cuánto cuesta agregar usuarios?",
  rolesCardSubtitle: "Aplica a los planes de Clínica (Base y Premium)",
  rolesCardRows: [
    { role: "Podólogo incluido", cost: "Gratis", note: "5 en Base · 8 en Premium" },
    { role: "Podólogo adicional", cost: "$10/mes", note: "Por cada profesional extra" },
    { role: "Recepcionista", cost: "Gratis", note: "Sin límite de recepcionistas" },
    { role: "Admin de clínica", cost: "Incluido", note: "1 por clínica (el titular)" },
  ],
  ctaTitle: "Empieza hoy y enfócate en tus pacientes",
  ctaSubtitle: "Regístrate en minutos y descubre lo fácil que es llevar tu consulta.",
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
  navLogin: "Log in",
  navRegister: "Sign up",
  heroTitle: "Focus on what matters",
  heroTitleBold: "and care for more patients",
  heroSubtitle:
    "An organized schedule, confirmed appointments and patients who come back. PodoAdmin brings your whole practice into one place and gives you the data to grow with confidence.",
  heroCtaPrimary: "Start free",
  heroCtaSecondary: "I already have an account",
  heroStatDigital: "Digital",
  heroStatAccess: "24/7 access",
  heroStatSecure: "Secure",
  solutionsTitle: "Everything ready for your practice to grow",
  solutionsSubtitle: "PodoAdmin works for you in the background: a full calendar, loyal patients and decisions backed by data.",
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
  featureCheckoutTitle: "Billing & analytics",
  featureCheckoutDesc: "Checkout, handoffs, sales by service and daily closes to control revenue.",
  featureCheckoutDetails: [
    "Checkout and handoff to reception",
    "Sales by service and by professional",
    "Daily closes and accounts receivable",
  ],
  featureWhatsappTitle: "Integrated WhatsApp",
  featureWhatsappDesc: "Messages and campaigns from the same platform, with unlimited reminders for your patients.",
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
  audienceTitle: "Built for your role",
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
      name: "Independent Base",
      tagline: "For the solo podiatrist: everything you need day to day.",
      price: "$25",
      period: "/mo per professional",
      cta: "Start free",
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
      name: "Independent Premium",
      tagline: "For the podiatrist who wants to grow with data.",
      price: "$40",
      period: "/mo per professional",
      cta: "Choose Premium",
      features: [
        "Everything in Independent Base",
        "Analytics: Sales, Collections and Profitability",
        "Advanced agenda metrics and closes",
        "Advanced clinical tools",
        "WhatsApp campaigns",
        "Move to a Clinic plan when you add a team",
      ],
    },
    {
      name: "Clinic Base",
      tagline: "For teams: the daily operation of the whole clinic.",
      price: "$100",
      period: "/mo per clinic",
      cta: "Choose Clinic",
      features: [
        "Everything in Independent Base",
        "5 podiatrists included",
        "Extra podiatrist: $10/mo",
        "Unlimited receptionists",
        "Reception and shared checkout",
        "Priority support",
      ],
    },
    {
      name: "Clinic Premium",
      tagline: "For clinics that want to grow and measure the business.",
      price: "$160",
      period: "/mo per clinic",
      cta: "Choose Clinic Premium",
      badge: "Recommended",
      highlighted: true,
      features: [
        "Everything in Clinic Base",
        "8 podiatrists included",
        "Extra podiatrist: $10/mo",
        "Analytics: Sales, Collections and Profitability",
        "Advanced agenda metrics and closes",
        "Advanced clinical tools",
        "WhatsApp campaigns",
      ],
    },
  ],
  pricingNote: "Unlimited WhatsApp reminders on every plan. Prices in USD.",
  rolesCardTitle: "How much does it cost to add users?",
  rolesCardSubtitle: "Applies to Clinic plans (Base and Premium)",
  rolesCardRows: [
    { role: "Included podiatrist", cost: "Free", note: "5 in Base · 8 in Premium" },
    { role: "Additional podiatrist", cost: "$10/mo", note: "Per extra professional" },
    { role: "Receptionist", cost: "Free", note: "Unlimited receptionists" },
    { role: "Clinic admin", cost: "Included", note: "1 per clinic (the owner)" },
  ],
  ctaTitle: "Start today and focus on your patients",
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
  navLogin: "Entrar",
  navRegister: "Criar conta",
  heroTitle: "Concentre-se no que importa",
  heroTitleBold: "e atenda mais pacientes",
  heroSubtitle:
    "Agenda organizada, consultas confirmadas e pacientes que voltam. O PodoAdmin reúne a sua consulta num só lugar e dá-lhe os dados para crescer com confiança.",
  heroCtaPrimary: "Começar grátis",
  heroCtaSecondary: "Já tenho conta",
  heroStatDigital: "Digital",
  heroStatAccess: "Acesso 24/7",
  heroStatSecure: "Seguro",
  solutionsTitle: "Tudo pronto para a sua consulta crescer",
  solutionsSubtitle: "O PodoAdmin trabalha por si em segundo plano: agenda cheia, pacientes fiéis e decisões apoiadas em dados.",
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
  featureCheckoutTitle: "Cobranças e analíticas",
  featureCheckoutDesc: "Checkout, handoffs, vendas por serviço e fechos diários para controlar a faturação.",
  featureCheckoutDetails: [
    "Cobrança e passagem para a receção",
    "Vendas por serviço e por profissional",
    "Fechos diários e contas a receber",
  ],
  featureWhatsappTitle: "WhatsApp integrado",
  featureWhatsappDesc: "Mensagens e campanhas na mesma plataforma, com lembretes ilimitados para os seus pacientes.",
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
  audienceTitle: "Feito para o seu papel",
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
      name: "Independente Base",
      tagline: "Para o podólogo que trabalha sozinho: tudo o que precisa no dia a dia.",
      price: "$25",
      period: "/mês por profissional",
      cta: "Começar grátis",
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
      name: "Independente Premium",
      tagline: "Para o podólogo que quer crescer com dados.",
      price: "$40",
      period: "/mês por profissional",
      cta: "Escolher Premium",
      features: [
        "Tudo do Independente Base",
        "Analíticas: Vendas, Cobranças e Rentabilidade",
        "Métricas avançadas de agenda e fechos",
        "Ferramentas clínicas avançadas",
        "Campanhas de WhatsApp",
        "Mude para o plano Clínica quando somar equipa",
      ],
    },
    {
      name: "Clínica Base",
      tagline: "Para equipas: a operação diária de toda a clínica.",
      price: "$100",
      period: "/mês por clínica",
      cta: "Escolher Clínica",
      features: [
        "Tudo do Independente Base",
        "5 podólogos incluídos",
        "Podólogo adicional: $10/mês",
        "Rececionistas ilimitadas",
        "Receção e checkout partilhado",
        "Suporte prioritário",
      ],
    },
    {
      name: "Clínica Premium",
      tagline: "Para clínicas que querem crescer e medir o negócio.",
      price: "$160",
      period: "/mês por clínica",
      cta: "Escolher Clínica Premium",
      badge: "Recomendado",
      highlighted: true,
      features: [
        "Tudo da Clínica Base",
        "8 podólogos incluídos",
        "Podólogo adicional: $10/mês",
        "Analíticas: Vendas, Cobranças e Rentabilidade",
        "Métricas avançadas de agenda e fechos",
        "Ferramentas clínicas avançadas",
        "Campanhas de WhatsApp",
      ],
    },
  ],
  pricingNote: "Lembretes de WhatsApp sem limites em todos os planos. Preços em USD.",
  rolesCardTitle: "Quanto custa adicionar utilizadores?",
  rolesCardSubtitle: "Aplica-se aos planos de Clínica (Base e Premium)",
  rolesCardRows: [
    { role: "Podólogo incluído", cost: "Grátis", note: "5 no Base · 8 no Premium" },
    { role: "Podólogo adicional", cost: "$10/mês", note: "Por cada profissional extra" },
    { role: "Recepcionista", cost: "Grátis", note: "Recepcionistas ilimitadas" },
    { role: "Admin de clínica", cost: "Incluído", note: "1 por clínica (o titular)" },
  ],
  ctaTitle: "Comece hoje e concentre-se nos seus pacientes",
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
  navLogin: "Connexion",
  navRegister: "Créer un compte",
  heroTitle: "Concentrez-vous sur l'essentiel",
  heroTitleBold: "et soignez plus de patients",
  heroSubtitle:
    "Un agenda organisé, des rendez-vous confirmés et des patients qui reviennent. PodoAdmin réunit votre cabinet en un seul endroit et vous donne les données pour grandir en confiance.",
  heroCtaPrimary: "Commencer gratuitement",
  heroCtaSecondary: "J'ai déjà un compte",
  heroStatDigital: "Numérique",
  heroStatAccess: "Accès 24/7",
  heroStatSecure: "Sécurisé",
  solutionsTitle: "Tout est prêt pour faire grandir votre cabinet",
  solutionsSubtitle: "PodoAdmin travaille pour vous en arrière-plan : agenda rempli, patients fidèles et décisions appuyées sur des données.",
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
  featureCheckoutTitle: "Encaissements et analytiques",
  featureCheckoutDesc: "Checkout, handoffs, ventes par service et clôtures quotidiennes.",
  featureCheckoutDetails: [
    "Encaissement et transfert à l'accueil",
    "Ventes par service et par praticien",
    "Clôtures quotidiennes et créances",
  ],
  featureWhatsappTitle: "WhatsApp intégré",
  featureWhatsappDesc: "Messages et campagnes depuis la même plateforme, avec des rappels illimités pour vos patients.",
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
  audienceTitle: "Conçu pour votre rôle",
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
      name: "Indépendant Base",
      tagline: "Pour le podologue en solo : tout le nécessaire au quotidien.",
      price: "$25",
      period: "/mois par praticien",
      cta: "Commencer gratuitement",
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
      name: "Indépendant Premium",
      tagline: "Pour le podologue qui veut croître avec des données.",
      price: "$40",
      period: "/mois par praticien",
      cta: "Choisir Premium",
      features: [
        "Tout de l'Indépendant Base",
        "Analytiques : Ventes, Encaissements et Rentabilité",
        "Métriques avancées d'agenda et clôtures",
        "Outils cliniques avancés",
        "Campagnes WhatsApp",
        "Passez au forfait Clinique quand votre équipe s'agrandit",
      ],
    },
    {
      name: "Clinique Base",
      tagline: "Pour les équipes : l'opération quotidienne de toute la clinique.",
      price: "$100",
      period: "/mois par clinique",
      cta: "Choisir Clinique",
      features: [
        "Tout de l'Indépendant Base",
        "5 podologues inclus",
        "Podologue supplémentaire : $10/mois",
        "Réceptionnistes illimitées",
        "Réception et checkout partagé",
        "Support prioritaire",
      ],
    },
    {
      name: "Clinique Premium",
      tagline: "Pour les cliniques qui veulent croître et mesurer l'activité.",
      price: "$160",
      period: "/mois par clinique",
      cta: "Choisir Clinique Premium",
      badge: "Recommandé",
      highlighted: true,
      features: [
        "Tout de la Clinique Base",
        "8 podologues inclus",
        "Podologue supplémentaire : $10/mois",
        "Analytiques : Ventes, Encaissements et Rentabilité",
        "Métriques avancées d'agenda et clôtures",
        "Outils cliniques avancés",
        "Campagnes WhatsApp",
      ],
    },
  ],
  pricingNote: "Rappels WhatsApp illimités sur tous les plans. Prix en USD.",
  rolesCardTitle: "Combien coûte l'ajout d'utilisateurs ?",
  rolesCardSubtitle: "S'applique aux plans Clinique (Base et Premium)",
  rolesCardRows: [
    { role: "Podologue inclus", cost: "Gratuit", note: "5 en Base · 8 en Premium" },
    { role: "Podologue supplémentaire", cost: "10 $/mois", note: "Par professionnel en plus" },
    { role: "Réceptionniste", cost: "Gratuit", note: "Réceptionnistes illimitées" },
    { role: "Admin de clinique", cost: "Inclus", note: "1 par clinique (le titulaire)" },
  ],
  ctaTitle: "Commencez aujourd'hui et concentrez-vous sur vos patients",
  ctaSubtitle: "Inscrivez-vous en quelques minutes et découvrez à quel point gérer votre cabinet peut être simple.",
  ctaButton: "Créer mon compte",
  ctaLogin: "Connexion",
  footerTerms: "Conditions",
  footerPrivacy: "Confidentialité",
  footerRights: "Tous droits réservés.",
};

export const landingByLang: Record<Language, LandingI18n> = { es, en, pt, fr };
