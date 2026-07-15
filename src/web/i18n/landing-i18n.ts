import type { Language } from "./translations";

export type LandingPlan = {
  name: string;
  tagline: string;
  price: string;
  period: string;
  cta: string;
  features: string[];
  badge?: string;
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
  pricingBase: LandingPlan;
  pricingPremium: LandingPlan;
  pricingNote: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  ctaLogin: string;
  footerTerms: string;
  footerPrivacy: string;
  footerRights: string;
};

const es: LandingI18n = {
  navSolutions: "Qué resuelve",
  navFeatures: "Funcionalidades",
  navPricing: "Precios",
  navAudience: "Para quién",
  navLogin: "Iniciar sesión",
  navRegister: "Crear cuenta",
  heroTitle: "Deja de perder clientes",
  heroTitleBold: "y de perder tiempo",
  heroSubtitle:
    "Menos ausencias, menos citas sin confirmar y más pacientes que vuelven. PodoAdmin te da la información para fidelizar y saber, con datos, si tu inversión está rindiendo.",
  heroCtaPrimary: "Empezar gratis",
  heroCtaSecondary: "Ya tengo cuenta",
  heroStatDigital: "Digital",
  heroStatAccess: "Acceso 24/7",
  heroStatSecure: "Seguro",
  solutionsTitle: "Lo que resuelves con PodoAdmin",
  solutionsSubtitle: "No es solo software: es dejar de perder pacientes, tiempo y dinero por falta de seguimiento y de datos.",
  solutionAbsences: {
    problem: "Pierdes dinero por ausencias y citas sin confirmar",
    solution: "Recordatorios y confirmación automática de citas por WhatsApp para reducir los no-shows y llenar tu agenda.",
  },
  solutionRetention: {
    problem: "Pierdes clientes por falta de seguimiento",
    solution: "Detecta pacientes inactivos y reactívalos con campañas y seguimiento para que vuelvan a tu consulta.",
  },
  solutionTime: {
    problem: "Pierdes tiempo en tareas manuales",
    solution: "Agenda, historia clínica y cobro en un solo flujo: menos papeleo y menos trabajo repetido.",
  },
  solutionDecisions: {
    problem: "Inviertes a ciegas, sin saber qué rinde",
    solution: "Analíticas de ventas, rentabilidad y ocupación para tomar mejores decisiones e invertir tus recursos donde de verdad rinden.",
  },
  featuresTitle: "Todo lo que necesitas en consulta",
  featuresSubtitle: "Y detrás de cada función, un objetivo: que ganes más pacientes, pierdas menos tiempo y controles tu negocio.",
  featureHoverHint: "Pasa el cursor para ver el detalle",
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
  featureWhatsappDesc: "Mensajes y campañas desde la misma plataforma, conectados a tu flujo de pacientes.",
  featureWhatsappDetails: [
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
  audiencePodiatristDesc: "Agenda, sesiones clínicas, herramientas podológicas e informes listos para imprimir.",
  audienceClinicTitle: "Clínicas",
  audienceClinicDesc: "Equipo, suscripciones, checkout compartido, WhatsApp y visión global del negocio.",
  audienceReceptionTitle: "Recepción",
  audienceReceptionDesc: "Calendario, pacientes y mensajes sin acceder a datos clínicos sensibles.",
  pricingTitle: "Precios simples y transparentes",
  pricingSubtitle: "Empieza con lo esencial y activa las funciones de crecimiento cuando las necesites.",
  pricingBase: {
    name: "Base",
    tagline: "Todo lo necesario para trabajar el día a día.",
    price: "$25",
    period: "/mes por profesional",
    cta: "Empezar gratis",
    features: [
      "Agenda y calendario operativo",
      "Pacientes e historia clínica",
      "Sesiones y plantillas clínicas",
      "Checkout operativo (cobros)",
      "WhatsApp Web básico",
      "Personalización de marca",
    ],
  },
  pricingPremium: {
    name: "Premium",
    tagline: "Para clínicas que quieren crecer y medir.",
    price: "$100",
    period: "/mes por clínica",
    cta: "Elegir Premium",
    badge: "Recomendado",
    features: [
      "Todo lo del plan Base",
      "Hasta 8 podólogos",
      "Campañas de WhatsApp",
      "Analíticas: Ventas, Cobros y Rentabilidad",
      "Métricas avanzadas de agenda y cierres",
      "Soporte prioritario",
    ],
  },
  pricingNote: "Prueba inicial sin tarjeta. Cancela cuando quieras. Precios en USD.",
  ctaTitle: "Empieza a organizar tu consulta hoy",
  ctaSubtitle: "Regístrate en minutos. Sin tarjeta para la prueba inicial.",
  ctaButton: "Crear mi cuenta",
  ctaLogin: "Iniciar sesión",
  footerTerms: "Términos",
  footerPrivacy: "Privacidad",
  footerRights: "Todos los derechos reservados.",
};

const en: LandingI18n = {
  navSolutions: "What it solves",
  navFeatures: "Features",
  navPricing: "Pricing",
  navAudience: "Who it's for",
  navLogin: "Log in",
  navRegister: "Sign up",
  heroTitle: "Stop losing clients",
  heroTitleBold: "and wasting time",
  heroSubtitle:
    "Fewer no-shows, fewer unconfirmed appointments and more patients who come back. PodoAdmin gives you the insight to build loyalty and to know, with data, whether your investment is paying off.",
  heroCtaPrimary: "Start free",
  heroCtaSecondary: "I already have an account",
  heroStatDigital: "Digital",
  heroStatAccess: "24/7 access",
  heroStatSecure: "Secure",
  solutionsTitle: "What you solve with PodoAdmin",
  solutionsSubtitle: "It's not just software—it's no longer losing patients, time and money to poor follow-up and missing data.",
  solutionAbsences: {
    problem: "You lose money to no-shows and unconfirmed appointments",
    solution: "Automatic WhatsApp reminders and appointment confirmations to reduce no-shows and fill your calendar.",
  },
  solutionRetention: {
    problem: "You lose clients to poor follow-up",
    solution: "Detect inactive patients and win them back with campaigns and follow-up so they return to your practice.",
  },
  solutionTime: {
    problem: "You waste time on manual tasks",
    solution: "Scheduling, clinical records and billing in one flow: less paperwork and less repeated work.",
  },
  solutionDecisions: {
    problem: "You invest blindly, without knowing what pays off",
    solution: "Sales, profitability and occupancy analytics to make better decisions and invest your resources where they truly pay off.",
  },
  featuresTitle: "Everything you need in practice",
  featuresSubtitle: "And behind every feature, one goal: win more patients, waste less time and stay in control of your business.",
  featureHoverHint: "Hover to see the detail",
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
  featureWhatsappDesc: "Messages and campaigns from the same platform, tied to your patient workflow.",
  featureWhatsappDetails: [
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
  audiencePodiatristDesc: "Schedule, clinical sessions, podiatry tools and print-ready reports.",
  audienceClinicTitle: "Clinics",
  audienceClinicDesc: "Team, subscriptions, shared checkout, WhatsApp and business-wide visibility.",
  audienceReceptionTitle: "Reception",
  audienceReceptionDesc: "Calendar, patients and messaging without access to sensitive clinical data.",
  pricingTitle: "Simple, transparent pricing",
  pricingSubtitle: "Start with the essentials and turn on growth features when you need them.",
  pricingBase: {
    name: "Base",
    tagline: "Everything you need for daily work.",
    price: "$25",
    period: "/mo per professional",
    cta: "Start free",
    features: [
      "Scheduling and operational calendar",
      "Patients and clinical records",
      "Sessions and clinical templates",
      "Operational checkout (billing)",
      "Basic WhatsApp Web",
      "Brand customization",
    ],
  },
  pricingPremium: {
    name: "Premium",
    tagline: "For clinics that want to grow and measure.",
    price: "$100",
    period: "/mo per clinic",
    cta: "Choose Premium",
    badge: "Recommended",
    features: [
      "Everything in Base",
      "Up to 8 podiatrists",
      "WhatsApp campaigns",
      "Analytics: Sales, Collections and Profitability",
      "Advanced agenda metrics and closes",
      "Priority support",
    ],
  },
  pricingNote: "Initial trial with no card. Cancel anytime. Prices in USD.",
  ctaTitle: "Start organizing your practice today",
  ctaSubtitle: "Sign up in minutes. No card required for the initial trial.",
  ctaButton: "Create my account",
  ctaLogin: "Log in",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerRights: "All rights reserved.",
};

const pt: LandingI18n = {
  navSolutions: "O que resolve",
  navFeatures: "Funcionalidades",
  navPricing: "Preços",
  navAudience: "Para quem",
  navLogin: "Entrar",
  navRegister: "Criar conta",
  heroTitle: "Deixe de perder clientes",
  heroTitleBold: "e de perder tempo",
  heroSubtitle:
    "Menos ausências, menos consultas por confirmar e mais pacientes que voltam. O PodoAdmin dá-lhe a informação para fidelizar e saber, com dados, se o seu investimento está a render.",
  heroCtaPrimary: "Começar grátis",
  heroCtaSecondary: "Já tenho conta",
  heroStatDigital: "Digital",
  heroStatAccess: "Acesso 24/7",
  heroStatSecure: "Seguro",
  solutionsTitle: "O que resolve com o PodoAdmin",
  solutionsSubtitle: "Não é só software: é deixar de perder pacientes, tempo e dinheiro por falta de seguimento e de dados.",
  solutionAbsences: {
    problem: "Perde dinheiro com ausências e consultas por confirmar",
    solution: "Lembretes e confirmação automática de consultas por WhatsApp para reduzir os no-shows e encher a sua agenda.",
  },
  solutionRetention: {
    problem: "Perde clientes por falta de seguimento",
    solution: "Detete pacientes inativos e reative-os com campanhas e seguimento para que voltem à sua consulta.",
  },
  solutionTime: {
    problem: "Perde tempo em tarefas manuais",
    solution: "Agenda, história clínica e cobrança num só fluxo: menos papelada e menos trabalho repetido.",
  },
  solutionDecisions: {
    problem: "Investe às cegas, sem saber o que rende",
    solution: "Analíticas de vendas, rentabilidade e ocupação para tomar melhores decisões e investir os seus recursos onde realmente rendem.",
  },
  featuresTitle: "Tudo o que precisa na consulta",
  featuresSubtitle: "E por trás de cada função, um objetivo: ganhar mais pacientes, perder menos tempo e controlar o seu negócio.",
  featureHoverHint: "Passe o cursor para ver o detalhe",
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
  featureWhatsappDesc: "Mensagens e campanhas na mesma plataforma, ligadas ao fluxo de pacientes.",
  featureWhatsappDetails: [
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
  audiencePodiatristDesc: "Agenda, sessões clínicas, ferramentas podológicas e relatórios prontos para imprimir.",
  audienceClinicTitle: "Clínicas",
  audienceClinicDesc: "Equipa, subscrições, checkout partilhado, WhatsApp e visão global do negócio.",
  audienceReceptionTitle: "Receção",
  audienceReceptionDesc: "Calendário, pacientes e mensagens sem acesso a dados clínicos sensíveis.",
  pricingTitle: "Preços simples e transparentes",
  pricingSubtitle: "Comece com o essencial e ative as funções de crescimento quando precisar.",
  pricingBase: {
    name: "Base",
    tagline: "Tudo o que precisa para o dia a dia.",
    price: "$25",
    period: "/mês por profissional",
    cta: "Começar grátis",
    features: [
      "Agenda e calendário operacional",
      "Pacientes e história clínica",
      "Sessões e modelos clínicos",
      "Checkout operacional (cobranças)",
      "WhatsApp Web básico",
      "Personalização de marca",
    ],
  },
  pricingPremium: {
    name: "Premium",
    tagline: "Para clínicas que querem crescer e medir.",
    price: "$100",
    period: "/mês por clínica",
    cta: "Escolher Premium",
    badge: "Recomendado",
    features: [
      "Tudo do plano Base",
      "Até 8 podólogos",
      "Campanhas de WhatsApp",
      "Analíticas: Vendas, Cobranças e Rentabilidade",
      "Métricas avançadas de agenda e fechos",
      "Suporte prioritário",
    ],
  },
  pricingNote: "Período inicial sem cartão. Cancele quando quiser. Preços em USD.",
  ctaTitle: "Comece a organizar a sua consulta hoje",
  ctaSubtitle: "Registe-se em minutos. Sem cartão para o período inicial.",
  ctaButton: "Criar a minha conta",
  ctaLogin: "Entrar",
  footerTerms: "Termos",
  footerPrivacy: "Privacidade",
  footerRights: "Todos os direitos reservados.",
};

const fr: LandingI18n = {
  navSolutions: "Ce que ça résout",
  navFeatures: "Fonctionnalités",
  navPricing: "Tarifs",
  navAudience: "Pour qui",
  navLogin: "Connexion",
  navRegister: "Créer un compte",
  heroTitle: "Arrêtez de perdre des clients",
  heroTitleBold: "et du temps",
  heroSubtitle:
    "Moins d'absences, moins de rendez-vous non confirmés et plus de patients qui reviennent. PodoAdmin vous donne l'information pour fidéliser et savoir, avec des données, si votre investissement est rentable.",
  heroCtaPrimary: "Commencer gratuitement",
  heroCtaSecondary: "J'ai déjà un compte",
  heroStatDigital: "Numérique",
  heroStatAccess: "Accès 24/7",
  heroStatSecure: "Sécurisé",
  solutionsTitle: "Ce que vous résolvez avec PodoAdmin",
  solutionsSubtitle: "Ce n'est pas qu'un logiciel : c'est ne plus perdre de patients, de temps et d'argent par manque de suivi et de données.",
  solutionAbsences: {
    problem: "Vous perdez de l'argent à cause des absences et des rendez-vous non confirmés",
    solution: "Rappels et confirmation automatique des rendez-vous par WhatsApp pour réduire les no-shows et remplir votre agenda.",
  },
  solutionRetention: {
    problem: "Vous perdez des clients par manque de suivi",
    solution: "Détectez les patients inactifs et reconquérez-les avec des campagnes et un suivi pour qu'ils reviennent.",
  },
  solutionTime: {
    problem: "Vous perdez du temps sur des tâches manuelles",
    solution: "Agenda, dossier clinique et encaissement dans un seul flux : moins de paperasse et de travail répété.",
  },
  solutionDecisions: {
    problem: "Vous investissez à l'aveugle, sans savoir ce qui rapporte",
    solution: "Analytiques de ventes, rentabilité et occupation pour prendre de meilleures décisions et investir vos ressources là où elles rapportent vraiment.",
  },
  featuresTitle: "Tout ce dont vous avez besoin au cabinet",
  featuresSubtitle: "Et derrière chaque fonction, un objectif : gagner plus de patients, perdre moins de temps et garder le contrôle de votre activité.",
  featureHoverHint: "Survolez pour voir le détail",
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
  featureWhatsappDesc: "Messages et campagnes depuis la même plateforme, liés à vos patients.",
  featureWhatsappDetails: [
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
  audiencePodiatristDesc: "Agenda, séances cliniques, outils podologiques et rapports prêts à imprimer.",
  audienceClinicTitle: "Cliniques",
  audienceClinicDesc: "Équipe, abonnements, checkout partagé, WhatsApp et vision globale.",
  audienceReceptionTitle: "Accueil",
  audienceReceptionDesc: "Calendrier, patients et messages sans accès aux données cliniques sensibles.",
  pricingTitle: "Des tarifs simples et transparents",
  pricingSubtitle: "Commencez avec l'essentiel et activez les fonctions de croissance au besoin.",
  pricingBase: {
    name: "Base",
    tagline: "Tout ce qu'il faut pour le quotidien.",
    price: "$25",
    period: "/mois par praticien",
    cta: "Commencer gratuitement",
    features: [
      "Agenda et calendrier opérationnel",
      "Patients et dossier clinique",
      "Séances et modèles cliniques",
      "Checkout opérationnel (encaissements)",
      "WhatsApp Web basique",
      "Personnalisation de marque",
    ],
  },
  pricingPremium: {
    name: "Premium",
    tagline: "Pour les cliniques qui veulent croître et mesurer.",
    price: "$100",
    period: "/mois par clinique",
    cta: "Choisir Premium",
    badge: "Recommandé",
    features: [
      "Tout du plan Base",
      "Jusqu'à 8 podologues",
      "Campagnes WhatsApp",
      "Analytiques : Ventes, Encaissements et Rentabilité",
      "Métriques avancées d'agenda et clôtures",
      "Support prioritaire",
    ],
  },
  pricingNote: "Essai initial sans carte. Annulez à tout moment. Prix en USD.",
  ctaTitle: "Organisez votre cabinet dès aujourd'hui",
  ctaSubtitle: "Inscrivez-vous en quelques minutes. Sans carte pour l'essai initial.",
  ctaButton: "Créer mon compte",
  ctaLogin: "Connexion",
  footerTerms: "Conditions",
  footerPrivacy: "Confidentialité",
  footerRights: "Tous droits réservés.",
};

export const landingByLang: Record<Language, LandingI18n> = { es, en, pt, fr };
