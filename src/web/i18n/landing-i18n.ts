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

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingI18n = {
  navSolutions: string;
  navFeatures: string;
  navPricing: string;
  navAudience: string;
  navSteps: string;
  navFaq: string;
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
  /** Guía "qué mirar al elegir un software". Contenido de fondo, sobre todo para búsqueda. */
  guideTitle: string;
  guideSubtitle: string;
  guideItems: LandingStep[];
  comparisonTitle: string;
  comparisonSubtitle: string;
  comparisonRows: { alternative: string; problem: string; podoraa: string }[];
  /** Se publica también como JSON-LD FAQPage (ver `buildJsonLd` en scripts/seo.ts). */
  faqItems: LandingFaqItem[];
  /**
   * Preguntas sobre el uso del producto ya contratado (planes, roles, 2FA, exportación).
   * Solo se muestran en /faq: la landing se queda con las de antes de contratar.
   */
  faqSystemItems: LandingFaqItem[];
  faqPageTitle: string;
  faqPageSubtitle: string;
  faqPageGeneralHeading: string;
  faqPageSystemHeading: string;
  faqPageBack: string;
  /** Bloque de contacto de /faq: abre el correo del visitante con el mensaje ya escrito. */
  contactTitle: string;
  contactSubtitle: string;
  contactEmailLabel: string;
  contactEmailPlaceholder: string;
  contactQuestionLabel: string;
  contactQuestionPlaceholder: string;
  contactSubmit: string;
  contactHint: string;
  contactEmailInvalid: string;
  contactQuestionMissing: string;
  contactDirect: string;
  /** Asunto y encabezado del cuerpo del mailto. */
  contactMailSubject: string;
  contactMailFrom: string;
  footerTerms: string;
  footerPrivacy: string;
  /** Enlace del pie a la sección de contacto de /faq. */
  footerContact: string;
  footerRights: string;
};

const es: LandingI18n = {
  navSolutions: "Beneficios",
  navFeatures: "Funcionalidades",
  navPricing: "Precios",
  navAudience: "Para quién",
  navSteps: "Cómo empezar",
  navFaq: "Preguntas",
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
  guideTitle: "Qué mirar al elegir un software para podología",
  guideSubtitle:
    "Diez puntos que conviene revisar antes de decidirte, trabajes solo en tu consulta o lleves una clínica podológica con varios profesionales.",
  guideItems: [
    {
      title: "Agenda",
      description:
        "Una agenda para podólogos no es un calendario genérico: necesita duración por tipo de tratamiento, varios profesionales en paralelo y ver de un vistazo los huecos libres de la semana. Si tienes que cuadrar a mano quién atiende a quién, la agenda no está haciendo su trabajo.",
    },
    {
      title: "Historia clínica",
      description:
        "La historia clínica podológica tiene su propia estructura: exploración del pie, lesiones, tratamientos aplicados, imágenes de cada sesión y evolución en el tiempo. Un campo de notas libre no sirve para consultar el histórico de un paciente tres años después.",
    },
    {
      title: "Seguimiento",
      description:
        "Buena parte del trabajo en podología es recurrente: revisiones, curas, controles cada pocas semanas. El sistema debería avisarte de a qué pacientes hace tiempo que no ves, en lugar de que dependas de acordarte.",
    },
    {
      title: "Pagos",
      description:
        "Control financiero podológico: qué se cobró, qué queda pendiente, cuánto entró hoy y qué tratamientos son los que sostienen la consulta. Si los cobros viven en un cuaderno aparte, cerrar el mes se convierte en un trabajo de reconstrucción.",
    },
    {
      title: "WhatsApp",
      description:
        "WhatsApp es por donde se comunican tus pacientes. Que los recordatorios de citas salgan desde el mismo sistema — y que la confirmación vuelva a la agenda sola — es la diferencia entre reducir las ausencias y escribir uno por uno cada tarde.",
    },
    {
      title: "Reservas",
      description:
        "Reservas online con tu enlace y tu marca, para que el paciente agende cuando le va bien sin llamar. Debe respetar tus horarios reales y la disponibilidad de cada profesional, no ofrecer huecos que después tienes que cancelar.",
    },
    {
      title: "Recepción",
      description:
        "Si tienes recepcionista, necesita ver el calendario, los pacientes y los mensajes sin acceder a los datos clínicos. Un software que solo tiene un tipo de usuario te obliga a elegir entre darle todo o no darle nada.",
    },
    {
      title: "Métricas",
      description:
        "Ventas, rentabilidad por tratamiento, ocupación de agenda y pacientes que dejaron de venir. Sin esto sabes cómo fue el mes por sensación; con esto sabes qué cambiar.",
    },
    {
      title: "Seguridad",
      description:
        "Son datos de salud. Pregunta por cifrado, control de acceso por rol, registro de auditoría, política de retención y qué pasa con la información si un día te vas. Guardar historias clínicas en una hoja de cálculo compartida no cumple con nada de esto.",
    },
    {
      title: "Personalización",
      description:
        "Tu logo en los informes que imprimes y en la página donde reservan tus pacientes. La marca que ve el paciente debe ser la tuya, no la del proveedor del software.",
    },
  ],
  comparisonTitle: "Por qué no alcanza con Excel, Word o la agenda del móvil",
  comparisonSubtitle:
    "No es que esas herramientas estén mal hechas: es que no fueron pensadas para una consulta de podología, y el trabajo de sostenerlas lo terminas haciendo tú.",
  comparisonRows: [
    {
      alternative: "Excel o Word",
      problem:
        "La ficha del paciente vive en archivos sueltos que se duplican, se pisan entre versiones y solo abre quien tiene el archivo. Buscar la evolución de una lesión implica abrir documentos uno por uno.",
      podoraa:
        "Historia clínica podológica estructurada, con imágenes por sesión y el histórico completo de cada paciente en una sola ficha.",
    },
    {
      alternative: "Agenda de Google o agenda de papel",
      problem:
        "Guarda la hora, pero no sabe qué tratamiento es, cuánto cuesta, si se pagó ni a quién hay que recordarle que venga. La agenda y la clínica quedan en dos mundos separados.",
      podoraa:
        "Agenda, tratamiento, cobro y recordatorio por WhatsApp son la misma cosa: registras la sesión y todo lo demás queda anotado.",
    },
    {
      alternative: "Software médico general",
      problem:
        "Está construido para medicina general: campos que no usas, y ninguno para la exploración podológica, el mapa del pie o el seguimiento de una onicocriptosis.",
      podoraa:
        "Pensado para podología, podiatría y pedicuría: plantillas clínicas del área, informes listos para imprimir y las métricas de una consulta podológica.",
    },
  ],
  faqItems: [
    {
      question: "¿Qué es un software de gestión podológica?",
      answer:
        "Es el sistema donde una consulta de podología lleva su operación diaria: agenda de citas, historia clínica podológica de cada paciente, reservas online, recordatorios de citas, registro de cobros y las métricas del negocio. Sustituye la combinación de agenda, hoja de cálculo y cuaderno de cobros que suele usarse al principio.",
    },
    {
      question: "¿Sirve para podiatras y pedicuristas, o solo para podólogos?",
      answer:
        "Sirve para las tres. La estructura de la ficha clínica, los tratamientos y los informes son los del cuidado del pie, así que se adapta igual a un podólogo, a un podiatra o a un profesional de pedicuría clínica, trabaje solo o dentro de una clínica podológica.",
    },
    {
      question: "¿Puedo llevar la historia clínica y las imágenes de cada sesión?",
      answer:
        "Sí. Cada paciente tiene su historia clínica podológica con antecedentes, exploración, tratamientos aplicados e imágenes asociadas a la sesión en que se tomaron, de modo que la evolución se lee en orden cronológico. Los informes salen listos para imprimir con tu marca.",
    },
    {
      question: "¿Mis pacientes pueden reservar online?",
      answer:
        "Sí. Compartes tu enlace de reservas y el paciente elige entre los huecos reales de tu agenda, viendo la marca de tu clínica. La cita entra directamente en el calendario del profesional que corresponda.",
    },
    {
      question: "¿Cómo funcionan los recordatorios de citas por WhatsApp?",
      answer:
        "Podoraa envía el recordatorio antes de la cita y el paciente confirma, cancela o pide reagendar desde el mismo mensaje; la respuesta actualiza la agenda sin que tengas que tocar nada. No cobramos por mensaje: el volumen que puedes enviar depende del nivel que Meta asigne a tu cuenta de WhatsApp Business.",
    },
    {
      question: "¿Es seguro guardar datos clínicos de mis pacientes?",
      answer:
        "Los datos viajan cifrados, cada usuario ve solo lo que le corresponde por su rol — una recepcionista no accede a la información clínica — y las acciones sensibles quedan registradas en un log de auditoría. Hay política de retención y los datos de tu consulta son tuyos y exportables.",
    },
  ],
  faqSystemItems: [
    {
      question: "¿Cuánto tardo en tenerlo funcionando?",
      answer:
        "Una tarde. Cargas tus horarios, tus servicios con sus precios y tu logo, y ya puedes agendar; los pacientes los das de alta a medida que atiendes, sin migrar todo de golpe. No hay instalación ni configuración técnica: si sabes usar WhatsApp y una agenda, sabes usar Podoraa.",
    },
    {
      question: "¿Qué planes hay y en qué se diferencian?",
      answer:
        "Cuatro, todos en USD. ESSENTIAL ($25/mes por profesional) trae la operación diaria: agenda, pacientes, historia clínica, pagos y recordatorios. ESSENTIAL PRO ($40) añade analíticas de ventas y rentabilidad, métricas avanzadas y herramientas clínicas avanzadas. CLINIC ($100/mes por clínica) incluye 5 podólogos, recepción compartida y soporte prioritario. CLINIC PRO ($160) incluye 8 podólogos y todo lo de PRO. Puedes cambiar de plan cuando crezcas.",
    },
    {
      question: "¿Cuánto cuesta sumar personas a mi equipo?",
      answer:
        "Las recepcionistas son gratis y sin límite en todos los planes. En los planes de clínica vienen 5 podólogos incluidos (8 en CLINIC PRO) y cada profesional extra cuesta $10/mes; al agregarlo o quitarlo, la suscripción se ajusta sola y lo ves reflejado en la siguiente factura.",
    },
    {
      question: "¿Cuántos pacientes puedo registrar?",
      answer:
        "Los que necesites: no hay tope de pacientes, de citas ni de sesiones clínicas en ningún plan. Lo que cambia de un plan a otro es cuántos profesionales trabajan en la cuenta y qué analíticas ves, no el volumen de tu consulta.",
    },
    {
      question: "¿Sirve si tengo más de un consultorio o sucursal?",
      answer:
        "Una cuenta de clínica gestiona una clínica —con su dirección, su equipo y su marca— y dentro de ella tantos profesionales como necesites, cada uno con su agenda. Si llevas varias sucursales, escríbenos antes de contratar y vemos cómo montarlo en tu caso.",
    },
    {
      question: "¿Qué ve cada rol? ¿La recepcionista entra a la historia clínica?",
      answer:
        "No. La recepcionista trabaja con el calendario, la ficha administrativa del paciente y los mensajes, sin acceso a los datos clínicos. El podólogo ve a sus pacientes y sus sesiones; el administrador de la clínica, la visión del equipo y la facturación. Además, los datos de una clínica no se cruzan con los de otra: cada consulta solo ve lo suyo.",
    },
    {
      question: "¿Qué pasa si un paciente cancela o quiere cambiar su cita?",
      answer:
        "El paciente responde desde el propio recordatorio. Si cancela, el horario queda libre en la agenda al instante y te llega el aviso; si pide reagendar, la solicitud te llega a ti para ofrecerle el hueco nuevo. Y si canceló por error y el horario sigue libre, puede volver a confirmar esa misma cita.",
    },
    {
      question: "¿Puedo controlar los pagos y lo que queda pendiente de cobro?",
      answer:
        "Sí. Al cerrar la sesión, el cobro pasa a recepción con su importe y queda como pendiente hasta que se marca como pagado, así que en todo momento ves qué está cobrado y qué no. Al final del día tienes el cierre con lo que entró, y cada paciente conserva su historial de cobros.",
    },
    {
      question: "¿Puedo ver cuánto vendo al mes y qué tratamientos me rinden más?",
      answer:
        "Sí, en los planes PRO. Tienes las ventas del período comparadas con el anterior, el desglose por servicio y por profesional, la ocupación de la agenda y la rentabilidad, donde fijas tu meta mensual y tus gastos para ver cuánto queda realmente.",
    },
    {
      question: "¿Puedo imprimir o exportar mis informes?",
      answer:
        "Los informes clínicos y los consentimientos salen listos para imprimir con tu marca, y desde la ventana de impresión puedes guardarlos como PDF. La ficha completa de un paciente se exporta en un archivo portable, la agenda en formato .ics y el registro de auditoría en CSV. Las analíticas se consultan dentro de la plataforma; si necesitas un dato concreto en hoja de cálculo, escríbenos.",
    },
    {
      question: "¿Puedo activar la verificación en dos pasos?",
      answer:
        "Sí, desde Ajustes → Seguridad. Se activa con una app de autenticación (Google Authenticator, Authy o similar) que genera un código de seis dígitos, y al activarla recibes códigos de respaldo de un solo uso. Guárdalos fuera del móvil: son la forma de entrar si pierdes el teléfono.",
    },
    {
      question: "Perdí el móvil del segundo factor o la contraseña. ¿Cómo recupero el acceso?",
      answer:
        "Si es la contraseña, el enlace «¿Olvidaste tu contraseña?» del login te envía un correo para restablecerla. Si es el segundo factor, entra con uno de tus códigos de respaldo; si tampoco los tienes, escríbenos a soporte@podoraa.com desde el correo de la cuenta y el equipo de Podoraa reinicia el segundo factor tras verificar tu identidad.",
    },
    {
      question: "¿Qué pasa si pierdo mi computadora o mi celular?",
      answer:
        "Tu información no está en el equipo: vive en tu cuenta, así que entras desde otro dispositivo y está todo ahí. La sesión del equipo perdido caduca sola, porque el acceso se renueva cada 15 minutos y la sesión completa vence a los 7 días. Aun así, cambia la contraseña desde otro dispositivo y ten activada la verificación en dos pasos; si necesitas cortar el acceso de inmediato, escríbenos a soporte@podoraa.com.",
    },
    {
      question: "¿Cómo cambio de plan, actualizo la tarjeta o cancelo?",
      answer:
        "Todo desde Ajustes → Suscripción, que abre el portal de pagos de Stripe. Ahí cambias la tarjeta, descargas tus facturas y cancelas la suscripción cuando quieras; no hay permanencia ni hay que pedirlo por correo.",
    },
    {
      question: "¿Necesito una cuenta de WhatsApp Business para los recordatorios?",
      answer:
        "Puedes empezar con WhatsApp Web, sin dar de alta nada, o conectar la API oficial de Meta cuando quieras que salgan solos y a mayor volumen. Podoraa no cobra por mensaje ni te pone un tope propio: el volumen que puedes enviar lo fija el nivel que Meta asigne a tu cuenta de WhatsApp Business.",
    },
    {
      question: "¿Puedo enviar campañas o promociones por WhatsApp?",
      answer:
        "Sí: armas la campaña y la envías al grupo de pacientes que elijas, por ejemplo a quienes hace meses que no vienen. El envío automático requiere tener conectada la API oficial de Meta. Ten en cuenta que los mensajes promocionales se rigen por las políticas de WhatsApp de Meta y por el consentimiento de cada paciente, así que conviene usarlos con criterio y solo con quien aceptó recibirlos.",
    },
    {
      question: "¿Puedo llevarme mis datos si dejo de usar Podoraa?",
      answer:
        "Sí. Cada paciente se exporta en un archivo portable con su ficha e historial, y la agenda sale en formato .ics para abrirla en otro calendario. Los datos clínicos de tu consulta son tuyos; se conservan según la política de retención y se eliminan cuando esa política lo permite.",
    },
    {
      question: "¿Qué necesito instalar y en qué idiomas está?",
      answer:
        "Nada: funciona en el navegador, también desde el móvil o la tablet, y se actualiza sola. La interfaz está en español, inglés, portugués y francés, y se cambia desde el selector de idioma en cualquier momento.",
    },
  ],
  faqPageTitle: "Preguntas frecuentes",
  faqPageSubtitle:
    "Lo que más nos preguntan antes de empezar y lo que resuelve Podoraa una vez que la consulta ya está funcionando. Si falta la tuya, escríbenos al final de la página.",
  faqPageGeneralHeading: "Antes de empezar",
  faqPageSystemHeading: "Sobre el uso de Podoraa",
  faqPageBack: "Volver al inicio",
  contactTitle: "¿No encontraste tu respuesta?",
  contactSubtitle: "Déjanos tu correo y tu duda: te contestamos a ese mismo correo.",
  contactEmailLabel: "Tu correo",
  contactEmailPlaceholder: "nombre@tuclinica.com",
  contactQuestionLabel: "Tu duda",
  contactQuestionPlaceholder: "Cuéntanos qué necesitas saber…",
  contactSubmit: "Enviar consulta",
  contactHint:
    "Al enviar se abre tu programa de correo con el mensaje ya escrito para soporte@podoraa.com. Nada se envía hasta que tú le des a enviar ahí.",
  contactEmailInvalid: "Escribe un correo válido para que podamos responderte.",
  contactQuestionMissing: "Cuéntanos tu duda antes de enviar.",
  contactDirect: "O escríbenos directamente a",
  contactMailSubject: "Consulta desde las preguntas frecuentes",
  contactMailFrom: "Mi correo",
  footerTerms: "Términos",
  footerPrivacy: "Privacidad",
  footerContact: "Contacto",
  footerRights: "Todos los derechos reservados.",
};

const en: LandingI18n = {
  navSolutions: "Benefits",
  navFeatures: "Features",
  navPricing: "Pricing",
  navAudience: "Who it's for",
  navSteps: "How to start",
  navFaq: "FAQ",
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
  guideTitle: "What to look for when choosing podiatry software",
  guideSubtitle:
    "Ten things worth checking before you decide, whether you work solo or run a podiatry clinic with several practitioners.",
  guideItems: [
    {
      title: "Scheduling",
      description:
        "A podiatry scheduler is not a generic calendar: it needs duration per treatment type, several practitioners side by side, and a clear view of the week's open slots. If you are matching practitioners to patients by hand, the calendar is not doing its job.",
    },
    {
      title: "Clinical records",
      description:
        "Podiatric clinical records have their own structure: foot assessment, lesions, treatments applied, images from each session and progress over time. A free-text notes field will not help you read a patient's history three years later.",
    },
    {
      title: "Follow-up",
      description:
        "Much of podiatry work is recurring: reviews, dressings, checks every few weeks. The system should tell you which patients you haven't seen in a while, instead of leaving it to memory.",
    },
    {
      title: "Payments",
      description:
        "Financial control for a podiatry practice: what was charged, what is outstanding, what came in today and which treatments actually sustain the practice. If payments live in a separate notebook, closing the month becomes detective work.",
    },
    {
      title: "WhatsApp",
      description:
        "WhatsApp is where your patients already are. Having appointment reminders go out from the same system — and confirmations come back into the calendar on their own — is the difference between cutting no-shows and messaging everyone by hand each evening.",
    },
    {
      title: "Online booking",
      description:
        "Online booking with your own link and branding, so patients book when it suits them without calling. It has to respect your real opening hours and each practitioner's availability, not offer slots you then have to cancel.",
    },
    {
      title: "Front desk",
      description:
        "If you have a receptionist, they need the calendar, patients and messages without access to clinical data. Software with a single user type forces you to choose between giving them everything or nothing.",
    },
    {
      title: "Metrics",
      description:
        "Revenue, profitability per treatment, schedule occupancy and patients who stopped coming. Without this you know how the month went by feel; with it you know what to change.",
    },
    {
      title: "Security",
      description:
        "This is health data. Ask about encryption, role-based access, audit logging, retention policy and what happens to the information if you ever leave. Keeping clinical records in a shared spreadsheet meets none of it.",
    },
    {
      title: "Branding",
      description:
        "Your logo on the reports you print and on the page where patients book. The brand the patient sees should be yours, not your software vendor's.",
    },
  ],
  comparisonTitle: "Why spreadsheets and a phone calendar aren't enough",
  comparisonSubtitle:
    "It isn't that those tools are badly built — they were never meant for a podiatry practice, and you end up doing the work of holding them together.",
  comparisonRows: [
    {
      alternative: "Excel or Word",
      problem:
        "Patient records live in loose files that get duplicated, overwritten between versions and opened only by whoever has the file. Tracking how a lesion evolved means opening documents one by one.",
      podoraa:
        "Structured podiatric clinical records, with per-session images and each patient's full history in a single record.",
    },
    {
      alternative: "Google Calendar or a paper diary",
      problem:
        "It stores the time, but not which treatment it is, what it costs, whether it was paid, or who needs reminding. Your calendar and your practice end up in two separate worlds.",
      podoraa:
        "Appointment, treatment, payment and WhatsApp reminder are one and the same: you record the session and everything else is logged.",
    },
    {
      alternative: "General medical software",
      problem:
        "Built for general medicine: fields you never use, and none for foot assessment, foot mapping or following an ingrown toenail.",
      podoraa:
        "Built for podiatry and chiropody: clinical templates for the field, print-ready reports and the metrics a foot-care practice actually needs.",
    },
  ],
  faqItems: [
    {
      question: "What is podiatry practice management software?",
      answer:
        "It is the system where a podiatry practice runs its day: appointment scheduling, each patient's podiatric clinical record, online booking, appointment reminders, payment tracking and business metrics. It replaces the mix of diary, spreadsheet and payment notebook most practices start with.",
    },
    {
      question: "Is it for chiropodists and foot-care professionals too, or only podiatrists?",
      answer:
        "All of them. The clinical record structure, treatments and reports are built around foot care, so it fits a podiatrist, a chiropodist or a clinical foot-care professional equally, working solo or inside a clinic.",
    },
    {
      question: "Can I keep clinical records and images from each session?",
      answer:
        "Yes. Each patient has a podiatric clinical record with history, assessment, treatments applied and images attached to the session they were taken in, so progress reads in chronological order. Reports print with your own branding.",
    },
    {
      question: "Can my patients book online?",
      answer:
        "Yes. You share your booking link and the patient picks from the real openings in your schedule, seeing your clinic's branding. The appointment lands directly in the right practitioner's calendar.",
    },
    {
      question: "How do WhatsApp appointment reminders work?",
      answer:
        "Podoraa sends the reminder before the appointment and the patient confirms, cancels or asks to reschedule from that same message; the reply updates your calendar without you touching anything. We don't charge per message: your sending volume depends on the tier Meta assigns to your WhatsApp Business account.",
    },
    {
      question: "Is it safe to store my patients' clinical data?",
      answer:
        "Data travels encrypted, each user sees only what their role allows — a receptionist has no access to clinical information — and sensitive actions are written to an audit log. There is a retention policy, and your practice's data is yours and exportable.",
    },
  ],
  faqSystemItems: [
    {
      question: "How long does it take to have it running?",
      answer:
        "An afternoon. You load your opening hours, your services with their prices and your logo, and you can start booking; patients are added as you see them, with no need to migrate everything at once. There is no install and no technical setup: if you can use WhatsApp and a diary, you can use Podoraa.",
    },
    {
      question: "What plans are there and how do they differ?",
      answer:
        "Four, all in USD. ESSENTIAL ($25/month per practitioner) covers the daily run: scheduling, patients, clinical records, payments and reminders. ESSENTIAL PRO ($40) adds sales and profitability analytics, advanced metrics and advanced clinical tools. CLINIC ($100/month per clinic) includes 5 podiatrists, shared front desk and priority support. CLINIC PRO ($160) includes 8 podiatrists plus everything in PRO. You can move up a plan as you grow.",
    },
    {
      question: "What does it cost to add people to my team?",
      answer:
        "Receptionists are free and unlimited on every plan. Clinic plans include 5 podiatrists (8 on CLINIC PRO) and each extra practitioner costs $10/month; when you add or remove one, the subscription adjusts itself and you see it on the next invoice.",
    },
    {
      question: "How many patients can I register?",
      answer:
        "As many as you need: there is no cap on patients, appointments or clinical sessions on any plan. What changes from one plan to another is how many practitioners work in the account and which analytics you get, not the size of your practice.",
    },
    {
      question: "Does it work if I have more than one office or branch?",
      answer:
        "A clinic account manages one clinic — its address, its team and its branding — and inside it as many practitioners as you need, each with their own calendar. If you run several branches, write to us before subscribing and we will look at how to set it up for your case.",
    },
    {
      question: "What does each role see? Can a receptionist open clinical records?",
      answer:
        "No. A receptionist works with the calendar, the patient's administrative details and messages, with no access to clinical data. A podiatrist sees their patients and sessions; the clinic administrator sees the team view and billing. On top of that, one clinic's data never crosses into another's: each practice only ever sees its own.",
    },
    {
      question: "What happens if a patient cancels or wants to change their appointment?",
      answer:
        "The patient replies from the reminder itself. If they cancel, the slot is freed in the calendar straight away and you get the notice; if they ask to reschedule, the request reaches you so you can offer the new slot. And if they cancelled by mistake and the slot is still free, they can confirm that same appointment again.",
    },
    {
      question: "Can I keep track of payments and what is still outstanding?",
      answer:
        "Yes. When you close the session, the charge passes to the front desk with its amount and stays pending until it is marked as paid, so you always see what has been collected and what has not. At the end of the day you get the close with what came in, and each patient keeps their own payment history.",
    },
    {
      question: "Can I see how much I bill each month and which treatments pay off best?",
      answer:
        "Yes, on the PRO plans. You get the period's sales compared against the previous one, the breakdown by service and by practitioner, schedule occupancy, and profitability, where you set your monthly target and your costs to see what is actually left.",
    },
    {
      question: "Can I print or export my reports?",
      answer:
        "Clinical reports and consent forms come out print-ready with your branding, and from the print dialog you can save them as PDF. A patient's full record exports to a portable file, the schedule to .ics and the audit log to CSV. Analytics are consulted inside the platform; if you need a specific figure in a spreadsheet, write to us.",
    },
    {
      question: "Can I turn on two-step verification?",
      answer:
        "Yes, from Settings → Security. You set it up with an authenticator app (Google Authenticator, Authy or similar) that generates a six-digit code, and when you enable it you get single-use backup codes. Keep them somewhere other than your phone: they are how you get back in if you lose it.",
    },
    {
      question: "I lost the phone with my second factor, or my password. How do I get back in?",
      answer:
        "For a password, the \"Forgot your password?\" link on the login screen emails you a reset link. For the second factor, sign in with one of your backup codes; if you don't have those either, email soporte@podoraa.com from the account's address and the Podoraa team will reset the second factor after verifying your identity.",
    },
    {
      question: "What happens if I lose my computer or my phone?",
      answer:
        "Your information is not on the device: it lives in your account, so you sign in from another one and everything is there. The session on the lost device expires by itself, because access is renewed every 15 minutes and the full session expires after 7 days. Even so, change your password from another device and keep two-step verification on; if you need to cut off access immediately, write to soporte@podoraa.com.",
    },
    {
      question: "How do I change plan, update my card or cancel?",
      answer:
        "All of it from Settings → Billing, which opens the Stripe payment portal. There you change the card, download your invoices and cancel whenever you want; there is no lock-in and no need to email us to do it.",
    },
    {
      question: "Do I need a WhatsApp Business account for reminders?",
      answer:
        "You can start with WhatsApp Web, with nothing to register, or connect Meta's official API when you want reminders to go out on their own and at higher volume. Podoraa doesn't charge per message or impose its own cap: your sending volume is set by the tier Meta assigns to your WhatsApp Business account.",
    },
    {
      question: "Can I send campaigns or promotions over WhatsApp?",
      answer:
        "Yes: you put the campaign together and send it to the group of patients you choose, for example those you have not seen in months. Automatic sending requires Meta's official API to be connected. Bear in mind that promotional messages are governed by Meta's WhatsApp policies and by each patient's consent, so use them with care and only with those who agreed to receive them.",
    },
    {
      question: "Can I take my data with me if I stop using Podoraa?",
      answer:
        "Yes. Each patient exports to a portable file with their record and history, and the schedule exports as .ics to open in another calendar. Your practice's clinical data is yours; it is kept according to the retention policy and deleted when that policy allows.",
    },
    {
      question: "What do I need to install, and which languages is it in?",
      answer:
        "Nothing: it runs in the browser, on phone or tablet too, and updates itself. The interface is in Spanish, English, Portuguese and French, and you can switch at any time from the language selector.",
    },
  ],
  faqPageTitle: "Frequently asked questions",
  faqPageSubtitle:
    "What people ask us most before getting started, and what Podoraa answers once the practice is up and running. If yours isn't here, write to us at the bottom of the page.",
  faqPageGeneralHeading: "Before getting started",
  faqPageSystemHeading: "Using Podoraa",
  faqPageBack: "Back to home",
  contactTitle: "Didn't find your answer?",
  contactSubtitle: "Leave us your email and your question: we reply to that same address.",
  contactEmailLabel: "Your email",
  contactEmailPlaceholder: "name@yourclinic.com",
  contactQuestionLabel: "Your question",
  contactQuestionPlaceholder: "Tell us what you need to know…",
  contactSubmit: "Send question",
  contactHint:
    "Sending opens your email app with the message already written to soporte@podoraa.com. Nothing goes out until you send it there.",
  contactEmailInvalid: "Enter a valid email so we can reply to you.",
  contactQuestionMissing: "Tell us your question before sending.",
  contactDirect: "Or write to us directly at",
  contactMailSubject: "Question from the FAQ page",
  contactMailFrom: "My email",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerRights: "All rights reserved.",
};

const pt: LandingI18n = {
  navSolutions: "Benefícios",
  navFeatures: "Funcionalidades",
  navPricing: "Preços",
  navAudience: "Para quem",
  navSteps: "Como começar",
  navFaq: "Perguntas",
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
  guideTitle: "O que ver ao escolher um software de podologia",
  guideSubtitle:
    "Dez pontos que vale a pena rever antes de decidir, trabalhe sozinho na sua consulta ou dirija uma clínica de podologia com vários profissionais.",
  guideItems: [
    {
      title: "Agenda",
      description:
        "Uma agenda para podologistas não é um calendário genérico: precisa de duração por tipo de tratamento, vários profissionais em paralelo e uma visão clara dos espaços livres da semana. Se tem de cruzar à mão quem atende quem, a agenda não está a fazer o seu trabalho.",
    },
    {
      title: "Histórico clínico",
      description:
        "O histórico clínico podológico tem estrutura própria: exame do pé, lesões, tratamentos aplicados, imagens de cada sessão e evolução ao longo do tempo. Um campo de notas livre não serve para consultar o histórico de um paciente três anos depois.",
    },
    {
      title: "Seguimento",
      description:
        "Boa parte do trabalho em podologia é recorrente: revisões, pensos, controlos a cada poucas semanas. O sistema deve avisá-lo de que pacientes há muito não vê, em vez de depender da sua memória.",
    },
    {
      title: "Pagamentos",
      description:
        "Controlo financeiro da consulta de podologia: o que foi cobrado, o que está pendente, quanto entrou hoje e que tratamentos sustentam realmente a consulta. Se os pagamentos vivem num caderno à parte, fechar o mês torna-se um trabalho de reconstrução.",
    },
    {
      title: "WhatsApp",
      description:
        "É por WhatsApp que os seus pacientes comunicam. Que os lembretes de consulta saiam do mesmo sistema — e que a confirmação volte sozinha para a agenda — é a diferença entre reduzir as faltas e escrever a cada um todas as tardes.",
    },
    {
      title: "Marcações online",
      description:
        "Marcações online com o seu link e a sua marca, para o paciente marcar quando lhe der jeito sem telefonar. Tem de respeitar os seus horários reais e a disponibilidade de cada profissional, não oferecer espaços que depois tem de cancelar.",
    },
    {
      title: "Receção",
      description:
        "Se tem rececionista, precisa do calendário, dos pacientes e das mensagens sem aceder aos dados clínicos. Um software com um só tipo de utilizador obriga-o a escolher entre dar tudo ou não dar nada.",
    },
    {
      title: "Métricas",
      description:
        "Vendas, rentabilidade por tratamento, ocupação da agenda e pacientes que deixaram de vir. Sem isto sabe como correu o mês por intuição; com isto sabe o que mudar.",
    },
    {
      title: "Segurança",
      description:
        "São dados de saúde. Pergunte por cifragem, controlo de acesso por perfil, registo de auditoria, política de retenção e o que acontece à informação se um dia sair. Guardar históricos clínicos numa folha de cálculo partilhada não cumpre nada disto.",
    },
    {
      title: "Personalização",
      description:
        "O seu logótipo nos relatórios que imprime e na página onde os pacientes marcam. A marca que o paciente vê deve ser a sua, não a do fornecedor do software.",
    },
  ],
  comparisonTitle: "Porque não chega o Excel, o Word ou a agenda do telemóvel",
  comparisonSubtitle:
    "Não é que essas ferramentas sejam más: é que não foram pensadas para uma consulta de podologia, e o trabalho de as manter de pé acaba por ser seu.",
  comparisonRows: [
    {
      alternative: "Excel ou Word",
      problem:
        "A ficha do paciente vive em ficheiros soltos que se duplicam, se sobrepõem entre versões e só abre quem tem o ficheiro. Ver a evolução de uma lesão implica abrir documentos um a um.",
      podoraa:
        "Histórico clínico podológico estruturado, com imagens por sessão e o histórico completo de cada paciente numa só ficha.",
    },
    {
      alternative: "Agenda do Google ou agenda de papel",
      problem:
        "Guarda a hora, mas não sabe que tratamento é, quanto custa, se foi pago nem a quem é preciso lembrar. A agenda e a clínica ficam em dois mundos separados.",
      podoraa:
        "Marcação, tratamento, cobrança e lembrete por WhatsApp são a mesma coisa: regista a sessão e o resto fica anotado.",
    },
    {
      alternative: "Software médico genérico",
      problem:
        "Foi construído para medicina geral: campos que não usa, e nenhum para o exame podológico, o mapa do pé ou o seguimento de uma unha encravada.",
      podoraa:
        "Pensado para podologia e pedicura clínica: modelos clínicos da área, relatórios prontos a imprimir e as métricas de uma consulta de podologia.",
    },
  ],
  faqItems: [
    {
      question: "O que é um software de gestão podológica?",
      answer:
        "É o sistema onde uma consulta de podologia gere o seu dia a dia: agenda de consultas, histórico clínico podológico de cada paciente, marcações online, lembretes de consulta, registo de pagamentos e as métricas do negócio. Substitui a combinação de agenda, folha de cálculo e caderno de pagamentos com que quase todas começam.",
    },
    {
      question: "Serve para pedicuristas clínicos ou só para podologistas?",
      answer:
        "Serve para ambos. A estrutura da ficha clínica, os tratamentos e os relatórios são os do cuidado do pé, por isso adapta-se tanto a um podologista como a um profissional de pedicura clínica, sozinho ou dentro de uma clínica.",
    },
    {
      question: "Posso manter o histórico clínico e as imagens de cada sessão?",
      answer:
        "Sim. Cada paciente tem o seu histórico clínico podológico com antecedentes, exame, tratamentos aplicados e imagens associadas à sessão em que foram tiradas, de modo que a evolução se lê por ordem cronológica. Os relatórios saem prontos a imprimir com a sua marca.",
    },
    {
      question: "Os meus pacientes podem marcar online?",
      answer:
        "Sim. Partilha o seu link de marcações e o paciente escolhe entre os espaços reais da sua agenda, vendo a marca da sua clínica. A consulta entra diretamente no calendário do profissional certo.",
    },
    {
      question: "Como funcionam os lembretes de consulta por WhatsApp?",
      answer:
        "A Podoraa envia o lembrete antes da consulta e o paciente confirma, cancela ou pede para remarcar a partir da mesma mensagem; a resposta atualiza a agenda sem que tenha de fazer nada. Não cobramos por mensagem: o volume que pode enviar depende do nível que a Meta atribuir à sua conta de WhatsApp Business.",
    },
    {
      question: "É seguro guardar dados clínicos dos meus pacientes?",
      answer:
        "Os dados viajam cifrados, cada utilizador vê apenas o que lhe compete pelo seu perfil — uma rececionista não acede à informação clínica — e as ações sensíveis ficam registadas num log de auditoria. Há política de retenção e os dados da sua consulta são seus e exportáveis.",
    },
  ],
  faqSystemItems: [
    {
      question: "Quanto tempo demoro a tê-la a funcionar?",
      answer:
        "Uma tarde. Carrega os seus horários, os seus serviços com os preços e o seu logótipo, e já pode marcar; os pacientes vai criando à medida que atende, sem migrar tudo de uma vez. Não há instalação nem configuração técnica: se sabe usar o WhatsApp e uma agenda, sabe usar a Podoraa.",
    },
    {
      question: "Que planos existem e em que se distinguem?",
      answer:
        "Quatro, todos em USD. ESSENTIAL (25 $/mês por profissional) cobre o dia a dia: agenda, pacientes, histórico clínico, pagamentos e lembretes. ESSENTIAL PRO (40 $) acrescenta analíticas de vendas e rentabilidade, métricas avançadas e ferramentas clínicas avançadas. CLINIC (100 $/mês por clínica) inclui 5 podologistas, receção partilhada e apoio prioritário. CLINIC PRO (160 $) inclui 8 podologistas e tudo o do PRO. Pode mudar de plano à medida que cresce.",
    },
    {
      question: "Quanto custa juntar pessoas à minha equipa?",
      answer:
        "As rececionistas são gratuitas e sem limite em todos os planos. Os planos de clínica incluem 5 podologistas (8 no CLINIC PRO) e cada profissional extra custa 10 $/mês; ao adicionar ou retirar um, a subscrição ajusta-se sozinha e vê-o refletido na fatura seguinte.",
    },
    {
      question: "Quantos pacientes posso registar?",
      answer:
        "Os que precisar: não há limite de pacientes, de marcações nem de sessões clínicas em nenhum plano. O que muda de um plano para outro é quantos profissionais trabalham na conta e que analíticas vê, não o volume da sua consulta.",
    },
    {
      question: "Serve se tiver mais do que um consultório ou filial?",
      answer:
        "Uma conta de clínica gere uma clínica —com a sua morada, a sua equipa e a sua marca— e dentro dela tantos profissionais quantos precisar, cada um com a sua agenda. Se tem várias filiais, escreva-nos antes de subscrever e vemos como montar isso no seu caso.",
    },
    {
      question: "O que vê cada perfil? A rececionista entra no histórico clínico?",
      answer:
        "Não. A rececionista trabalha com o calendário, os dados administrativos do paciente e as mensagens, sem acesso aos dados clínicos. O podologista vê os seus pacientes e sessões; o administrador da clínica vê a visão da equipa e a faturação. Além disso, os dados de uma clínica nunca se cruzam com os de outra: cada consulta vê apenas o que é seu.",
    },
    {
      question: "O que acontece se um paciente cancelar ou quiser mudar a marcação?",
      answer:
        "O paciente responde a partir do próprio lembrete. Se cancelar, o horário fica livre na agenda de imediato e recebe o aviso; se pedir para remarcar, o pedido chega-lhe a si para oferecer o novo horário. E se cancelou por engano e o horário continua livre, pode voltar a confirmar essa mesma marcação.",
    },
    {
      question: "Posso controlar os pagamentos e o que fica por cobrar?",
      answer:
        "Sim. Ao fechar a sessão, a cobrança passa para a receção com o respetivo valor e fica pendente até ser marcada como paga, por isso vê sempre o que está cobrado e o que não está. No fim do dia tem o fecho com o que entrou, e cada paciente mantém o seu histórico de cobranças.",
    },
    {
      question: "Posso ver quanto vendo por mês e que tratamentos rendem mais?",
      answer:
        "Sim, nos planos PRO. Tem as vendas do período comparadas com o anterior, a distribuição por serviço e por profissional, a ocupação da agenda e a rentabilidade, onde define a sua meta mensal e as suas despesas para ver quanto sobra realmente.",
    },
    {
      question: "Posso imprimir ou exportar os meus relatórios?",
      answer:
        "Os relatórios clínicos e os consentimentos saem prontos a imprimir com a sua marca e, na janela de impressão, pode guardá-los como PDF. A ficha completa de um paciente exporta-se num ficheiro portátil, a agenda em formato .ics e o registo de auditoria em CSV. As analíticas consultam-se dentro da plataforma; se precisar de um dado concreto em folha de cálculo, escreva-nos.",
    },
    {
      question: "Posso ativar a verificação em dois passos?",
      answer:
        "Sim, em Definições → Segurança. Ativa-se com uma app de autenticação (Google Authenticator, Authy ou semelhante) que gera um código de seis dígitos e, ao ativá-la, recebe códigos de recuperação de utilização única. Guarde-os fora do telemóvel: são a forma de entrar se o perder.",
    },
    {
      question: "Perdi o telemóvel do segundo fator, ou a palavra-passe. Como recupero o acesso?",
      answer:
        "Se for a palavra-passe, a ligação «Esqueceu-se da palavra-passe?» no login envia-lhe um email para a redefinir. Se for o segundo fator, entre com um dos seus códigos de recuperação; se também não os tiver, escreva para soporte@podoraa.com a partir do email da conta e a equipa da Podoraa reinicia o segundo fator depois de verificar a sua identidade.",
    },
    {
      question: "O que acontece se perder o computador ou o telemóvel?",
      answer:
        "A sua informação não está no equipamento: vive na sua conta, por isso entra a partir de outro dispositivo e está lá tudo. A sessão do equipamento perdido caduca sozinha, porque o acesso é renovado a cada 15 minutos e a sessão completa expira ao fim de 7 dias. Ainda assim, mude a palavra-passe a partir de outro dispositivo e mantenha a verificação em dois passos ativa; se precisar de cortar o acesso de imediato, escreva para soporte@podoraa.com.",
    },
    {
      question: "Como mudo de plano, atualizo o cartão ou cancelo?",
      answer:
        "Tudo em Definições → Faturação, que abre o portal de pagamentos da Stripe. Aí muda o cartão, descarrega as suas faturas e cancela a subscrição quando quiser; não há fidelização nem é preciso pedi-lo por email.",
    },
    {
      question: "Preciso de uma conta WhatsApp Business para os lembretes?",
      answer:
        "Pode começar com o WhatsApp Web, sem registar nada, ou ligar a API oficial da Meta quando quiser que saiam sozinhos e com mais volume. A Podoraa não cobra por mensagem nem impõe um limite próprio: o volume que pode enviar é definido pelo nível que a Meta atribui à sua conta WhatsApp Business.",
    },
    {
      question: "Posso enviar campanhas ou promoções por WhatsApp?",
      answer:
        "Sim: monta a campanha e envia-a ao grupo de pacientes que escolher, por exemplo a quem não aparece há meses. O envio automático exige ter ligada a API oficial da Meta. Tenha em conta que as mensagens promocionais regem-se pelas políticas de WhatsApp da Meta e pelo consentimento de cada paciente, por isso convém usá-las com critério e só com quem aceitou recebê-las.",
    },
    {
      question: "Posso levar os meus dados se deixar de usar a Podoraa?",
      answer:
        "Sim. Cada paciente é exportado num ficheiro portátil com a ficha e o histórico, e a agenda sai em formato .ics para abrir noutro calendário. Os dados clínicos da sua consulta são seus; são conservados segundo a política de retenção e eliminados quando essa política o permite.",
    },
    {
      question: "O que preciso de instalar e em que idiomas está?",
      answer:
        "Nada: funciona no navegador, também no telemóvel ou tablet, e atualiza-se sozinha. A interface está em espanhol, inglês, português e francês, e muda-se a qualquer momento no seletor de idioma.",
    },
  ],
  faqPageTitle: "Perguntas frequentes",
  faqPageSubtitle:
    "O que mais nos perguntam antes de começar e o que a Podoraa resolve quando a consulta já está a funcionar. Se faltar a sua, escreva-nos no fim da página.",
  faqPageGeneralHeading: "Antes de começar",
  faqPageSystemHeading: "Sobre o uso da Podoraa",
  faqPageBack: "Voltar ao início",
  contactTitle: "Não encontrou a sua resposta?",
  contactSubtitle: "Deixe-nos o seu email e a sua dúvida: respondemos para esse mesmo email.",
  contactEmailLabel: "O seu email",
  contactEmailPlaceholder: "nome@suaclinica.com",
  contactQuestionLabel: "A sua dúvida",
  contactQuestionPlaceholder: "Diga-nos o que precisa de saber…",
  contactSubmit: "Enviar dúvida",
  contactHint:
    "Ao enviar abre-se o seu programa de email com a mensagem já escrita para soporte@podoraa.com. Nada é enviado até que carregue em enviar aí.",
  contactEmailInvalid: "Escreva um email válido para podermos responder-lhe.",
  contactQuestionMissing: "Diga-nos a sua dúvida antes de enviar.",
  contactDirect: "Ou escreva-nos diretamente para",
  contactMailSubject: "Dúvida a partir das perguntas frequentes",
  contactMailFrom: "O meu email",
  footerTerms: "Termos",
  footerPrivacy: "Privacidade",
  footerContact: "Contacto",
  footerRights: "Todos os direitos reservados.",
};

const fr: LandingI18n = {
  navSolutions: "Bénéfices",
  navFeatures: "Fonctionnalités",
  navPricing: "Tarifs",
  navAudience: "Pour qui",
  navSteps: "Comment démarrer",
  navFaq: "Questions",
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
  guideTitle: "Que regarder pour choisir un logiciel de podologie",
  guideSubtitle:
    "Dix points à vérifier avant de vous décider, que vous exerciez seul ou que vous dirigiez un cabinet de podologie avec plusieurs praticiens.",
  guideItems: [
    {
      title: "Agenda",
      description:
        "Un agenda pour podologues n'est pas un calendrier générique : il lui faut une durée par type de soin, plusieurs praticiens en parallèle et une vue claire des créneaux libres de la semaine. Si vous devez croiser à la main qui reçoit qui, l'agenda ne fait pas son travail.",
    },
    {
      title: "Dossier clinique",
      description:
        "Le dossier clinique podologique a sa propre structure : examen du pied, lésions, soins réalisés, images de chaque séance et évolution dans le temps. Un champ de notes libre ne permet pas de relire l'historique d'un patient trois ans plus tard.",
    },
    {
      title: "Suivi",
      description:
        "Une grande partie du travail en podologie est récurrente : contrôles, pansements, revues toutes les quelques semaines. Le système devrait vous signaler les patients que vous n'avez pas vus depuis longtemps, plutôt que de compter sur votre mémoire.",
    },
    {
      title: "Encaissements",
      description:
        "Le suivi financier du cabinet : ce qui a été encaissé, ce qui reste dû, ce qui est rentré aujourd'hui et quels soins font vraiment vivre le cabinet. Si les paiements vivent dans un carnet à part, clôturer le mois devient un travail de reconstitution.",
    },
    {
      title: "WhatsApp",
      description:
        "C'est par WhatsApp que vos patients communiquent. Que les rappels de rendez-vous partent du même système — et que la confirmation revienne seule dans l'agenda — fait la différence entre réduire les absences et écrire à chacun tous les soirs.",
    },
    {
      title: "Prise de rendez-vous en ligne",
      description:
        "Une prise de rendez-vous en ligne à votre lien et à votre marque, pour que le patient réserve quand cela l'arrange sans appeler. Elle doit respecter vos horaires réels et la disponibilité de chaque praticien, pas proposer des créneaux qu'il faudra annuler.",
    },
    {
      title: "Accueil",
      description:
        "Si vous avez une secrétaire, elle a besoin de l'agenda, des patients et des messages sans accéder aux données cliniques. Un logiciel à un seul type d'utilisateur vous oblige à choisir entre tout donner ou ne rien donner.",
    },
    {
      title: "Indicateurs",
      description:
        "Chiffre d'affaires, rentabilité par soin, taux de remplissage et patients qui ne reviennent plus. Sans cela vous jugez le mois au ressenti ; avec cela vous savez quoi changer.",
    },
    {
      title: "Sécurité",
      description:
        "Ce sont des données de santé. Renseignez-vous sur le chiffrement, les accès par rôle, la journalisation, la politique de conservation et ce qu'il advient des données si vous partez un jour. Conserver des dossiers cliniques dans un tableur partagé ne répond à aucun de ces points.",
    },
    {
      title: "Personnalisation",
      description:
        "Votre logo sur les comptes rendus que vous imprimez et sur la page où vos patients réservent. La marque que voit le patient doit être la vôtre, pas celle de l'éditeur du logiciel.",
    },
  ],
  comparisonTitle: "Pourquoi Excel, Word ou l'agenda du téléphone ne suffisent pas",
  comparisonSubtitle:
    "Ce n'est pas que ces outils soient mauvais : ils n'ont pas été pensés pour un cabinet de podologie, et c'est vous qui finissez par faire le travail de les tenir ensemble.",
  comparisonRows: [
    {
      alternative: "Excel ou Word",
      problem:
        "Le dossier patient vit dans des fichiers épars qui se dupliquent, s'écrasent entre versions et ne s'ouvrent que chez celui qui les détient. Suivre l'évolution d'une lésion oblige à ouvrir les documents un par un.",
      podoraa:
        "Un dossier clinique podologique structuré, avec les images par séance et l'historique complet de chaque patient au même endroit.",
    },
    {
      alternative: "Agenda Google ou agenda papier",
      problem:
        "Il retient l'heure, mais ignore de quel soin il s'agit, ce qu'il coûte, s'il a été réglé et qui il faut relancer. L'agenda et le cabinet vivent dans deux mondes séparés.",
      podoraa:
        "Rendez-vous, soin, encaissement et rappel WhatsApp ne font qu'un : vous enregistrez la séance et le reste est consigné.",
    },
    {
      alternative: "Logiciel médical généraliste",
      problem:
        "Conçu pour la médecine générale : des champs que vous n'utilisez pas, et aucun pour l'examen podologique, la cartographie du pied ou le suivi d'un ongle incarné.",
      podoraa:
        "Pensé pour la podologie et les soins du pied : modèles cliniques du métier, comptes rendus prêts à imprimer et les indicateurs d'un cabinet de podologie.",
    },
  ],
  faqItems: [
    {
      question: "Qu'est-ce qu'un logiciel de gestion pour la podologie ?",
      answer:
        "C'est le système où un cabinet de podologie gère son quotidien : agenda des rendez-vous, dossier clinique podologique de chaque patient, prise de rendez-vous en ligne, rappels, suivi des encaissements et indicateurs de l'activité. Il remplace la combinaison agenda, tableur et carnet de recettes avec laquelle on démarre souvent.",
    },
    {
      question: "Est-ce que cela convient aussi aux pédicures-podologues ?",
      answer:
        "Oui. La structure du dossier clinique, les soins et les comptes rendus sont ceux du soin du pied : cela convient aussi bien à un podologue qu'à un pédicure-podologue, seul ou au sein d'un cabinet.",
    },
    {
      question: "Puis-je tenir le dossier clinique et les images de chaque séance ?",
      answer:
        "Oui. Chaque patient a son dossier clinique podologique avec antécédents, examen, soins réalisés et images rattachées à la séance où elles ont été prises, de sorte que l'évolution se lit dans l'ordre chronologique. Les comptes rendus s'impriment à votre marque.",
    },
    {
      question: "Mes patients peuvent-ils réserver en ligne ?",
      answer:
        "Oui. Vous partagez votre lien de réservation et le patient choisit parmi les créneaux réellement libres de votre agenda, en voyant la marque de votre cabinet. Le rendez-vous arrive directement dans l'agenda du bon praticien.",
    },
    {
      question: "Comment fonctionnent les rappels de rendez-vous par WhatsApp ?",
      answer:
        "Podoraa envoie le rappel avant le rendez-vous et le patient confirme, annule ou demande à décaler depuis ce même message ; la réponse met l'agenda à jour sans que vous interveniez. Nous ne facturons pas au message : le volume dépend du palier que Meta attribue à votre compte WhatsApp Business.",
    },
    {
      question: "Est-ce sûr de conserver les données cliniques de mes patients ?",
      answer:
        "Les données circulent chiffrées, chaque utilisateur ne voit que ce que son rôle autorise — une secrétaire n'accède pas aux informations cliniques — et les actions sensibles sont inscrites dans un journal d'audit. Il existe une politique de conservation, et les données de votre cabinet vous appartiennent et sont exportables.",
    },
  ],
  faqSystemItems: [
    {
      question: "Combien de temps faut-il pour que ce soit opérationnel ?",
      answer:
        "Une après-midi. Vous saisissez vos horaires, vos prestations avec leurs tarifs et votre logo, et vous pouvez déjà planifier ; les patients se créent au fil des consultations, sans tout migrer d'un coup. Aucune installation ni configuration technique : si vous savez utiliser WhatsApp et un agenda, vous savez utiliser Podoraa.",
    },
    {
      question: "Quelles offres existent et en quoi diffèrent-elles ?",
      answer:
        "Quatre, toutes en USD. ESSENTIAL (25 $/mois par praticien) couvre le quotidien : agenda, patients, dossier clinique, encaissements et rappels. ESSENTIAL PRO (40 $) ajoute les analyses de ventes et de rentabilité, les métriques avancées et les outils cliniques avancés. CLINIC (100 $/mois par cabinet) comprend 5 podologues, un accueil partagé et un support prioritaire. CLINIC PRO (160 $) comprend 8 podologues et tout ce que contient PRO. Vous pouvez changer d'offre en grandissant.",
    },
    {
      question: "Combien coûte l'ajout de personnes à mon équipe ?",
      answer:
        "Les secrétaires sont gratuites et illimitées sur toutes les offres. Les offres cabinet comprennent 5 podologues (8 sur CLINIC PRO) et chaque praticien supplémentaire coûte 10 $/mois ; quand vous en ajoutez ou en retirez un, l'abonnement s'ajuste seul et vous le voyez sur la facture suivante.",
    },
    {
      question: "Combien de patients puis-je enregistrer ?",
      answer:
        "Autant que nécessaire : aucune limite de patients, de rendez-vous ni de séances cliniques, quelle que soit l'offre. Ce qui change d'une offre à l'autre, c'est le nombre de praticiens dans le compte et les analyses auxquelles vous avez accès, pas le volume de votre cabinet.",
    },
    {
      question: "Est-ce adapté si j'ai plusieurs cabinets ou antennes ?",
      answer:
        "Un compte cabinet gère un cabinet —avec son adresse, son équipe et sa marque— et, à l'intérieur, autant de praticiens que nécessaire, chacun avec son agenda. Si vous gérez plusieurs antennes, écrivez-nous avant de souscrire et nous verrons comment l'organiser dans votre cas.",
    },
    {
      question: "Que voit chaque rôle ? Une secrétaire accède-t-elle au dossier clinique ?",
      answer:
        "Non. La secrétaire travaille avec l'agenda, les informations administratives du patient et les messages, sans accès aux données cliniques. Le podologue voit ses patients et ses séances ; l'administrateur du cabinet voit la vue d'équipe et la facturation. En plus, les données d'un cabinet ne se croisent jamais avec celles d'un autre : chaque cabinet ne voit que les siennes.",
    },
    {
      question: "Que se passe-t-il si un patient annule ou veut déplacer son rendez-vous ?",
      answer:
        "Le patient répond depuis le rappel lui-même. S'il annule, le créneau se libère aussitôt dans l'agenda et vous recevez l'avis ; s'il demande à être déplacé, la demande vous parvient pour lui proposer le nouveau créneau. Et s'il a annulé par erreur et que le créneau est toujours libre, il peut reconfirmer ce même rendez-vous.",
    },
    {
      question: "Puis-je suivre les encaissements et ce qui reste à encaisser ?",
      answer:
        "Oui. À la clôture de la séance, l'encaissement passe à l'accueil avec son montant et reste en attente jusqu'à ce qu'il soit marqué comme payé : vous voyez donc à tout moment ce qui est encaissé et ce qui ne l'est pas. En fin de journée vous avez la clôture avec les entrées, et chaque patient conserve son historique d'encaissements.",
    },
    {
      question: "Puis-je voir mon chiffre d'affaires mensuel et les soins les plus rentables ?",
      answer:
        "Oui, sur les offres PRO. Vous avez les ventes de la période comparées à la précédente, la répartition par prestation et par praticien, le taux d'occupation de l'agenda et la rentabilité, où vous fixez votre objectif mensuel et vos charges pour voir ce qu'il reste réellement.",
    },
    {
      question: "Puis-je imprimer ou exporter mes rapports ?",
      answer:
        "Les comptes rendus cliniques et les consentements sortent prêts à imprimer à votre marque, et depuis la fenêtre d'impression vous pouvez les enregistrer en PDF. La fiche complète d'un patient s'exporte dans un fichier portable, l'agenda au format .ics et le journal d'audit en CSV. Les analyses se consultent dans la plateforme ; s'il vous faut une donnée précise en tableur, écrivez-nous.",
    },
    {
      question: "Puis-je activer la vérification en deux étapes ?",
      answer:
        "Oui, depuis Paramètres → Sécurité. Elle s'active avec une application d'authentification (Google Authenticator, Authy ou équivalent) qui génère un code à six chiffres, et à l'activation vous recevez des codes de secours à usage unique. Gardez-les ailleurs que sur le téléphone : c'est ainsi que vous entrez si vous le perdez.",
    },
    {
      question: "J'ai perdu le téléphone du deuxième facteur, ou mon mot de passe. Comment récupérer l'accès ?",
      answer:
        "Pour le mot de passe, le lien « Mot de passe oublié ? » de la page de connexion vous envoie un e-mail de réinitialisation. Pour le deuxième facteur, connectez-vous avec l'un de vos codes de secours ; si vous ne les avez pas non plus, écrivez à soporte@podoraa.com depuis l'adresse du compte et l'équipe Podoraa réinitialise le deuxième facteur après avoir vérifié votre identité.",
    },
    {
      question: "Que se passe-t-il si je perds mon ordinateur ou mon téléphone ?",
      answer:
        "Vos informations ne sont pas sur l'appareil : elles vivent dans votre compte, vous vous connectez donc depuis un autre et tout y est. La session de l'appareil perdu expire d'elle-même, car l'accès se renouvelle toutes les 15 minutes et la session complète expire au bout de 7 jours. Malgré tout, changez le mot de passe depuis un autre appareil et gardez la vérification en deux étapes activée ; s'il faut couper l'accès immédiatement, écrivez à soporte@podoraa.com.",
    },
    {
      question: "Comment changer d'offre, mettre à jour ma carte ou résilier ?",
      answer:
        "Tout depuis Paramètres → Facturation, qui ouvre le portail de paiement Stripe. Vous y changez la carte, téléchargez vos factures et résiliez quand vous voulez ; sans engagement et sans avoir à le demander par e-mail.",
    },
    {
      question: "Ai-je besoin d'un compte WhatsApp Business pour les rappels ?",
      answer:
        "Vous pouvez commencer avec WhatsApp Web, sans rien déclarer, ou connecter l'API officielle de Meta quand vous voudrez que les rappels partent seuls et en plus grand volume. Podoraa ne facture pas au message et n'impose pas sa propre limite : le volume que vous pouvez envoyer est fixé par le palier que Meta attribue à votre compte WhatsApp Business.",
    },
    {
      question: "Puis-je envoyer des campagnes ou des promotions par WhatsApp ?",
      answer:
        "Oui : vous montez la campagne et l'envoyez au groupe de patients de votre choix, par exemple ceux que vous n'avez pas vus depuis des mois. L'envoi automatique suppose que l'API officielle de Meta soit connectée. Gardez à l'esprit que les messages promotionnels relèvent des politiques WhatsApp de Meta et du consentement de chaque patient : à utiliser avec discernement, et seulement avec ceux qui ont accepté de les recevoir.",
    },
    {
      question: "Puis-je récupérer mes données si j'arrête d'utiliser Podoraa ?",
      answer:
        "Oui. Chaque patient s'exporte dans un fichier portable avec sa fiche et son historique, et l'agenda s'exporte au format .ics pour l'ouvrir dans un autre calendrier. Les données cliniques de votre cabinet vous appartiennent ; elles sont conservées selon la politique de conservation et supprimées lorsque cette politique le permet.",
    },
    {
      question: "Que dois-je installer, et dans quelles langues est-ce disponible ?",
      answer:
        "Rien : cela fonctionne dans le navigateur, aussi depuis le téléphone ou la tablette, et se met à jour tout seul. L'interface est en espagnol, anglais, portugais et français, et se change à tout moment depuis le sélecteur de langue.",
    },
  ],
  faqPageTitle: "Questions fréquentes",
  faqPageSubtitle:
    "Ce qu'on nous demande le plus avant de commencer, et ce que Podoraa résout une fois le cabinet en route. Si la vôtre manque, écrivez-nous en bas de page.",
  faqPageGeneralHeading: "Avant de commencer",
  faqPageSystemHeading: "L'usage de Podoraa",
  faqPageBack: "Retour à l'accueil",
  contactTitle: "Vous n'avez pas trouvé votre réponse ?",
  contactSubtitle: "Laissez-nous votre e-mail et votre question : nous répondons à cette même adresse.",
  contactEmailLabel: "Votre e-mail",
  contactEmailPlaceholder: "nom@votrecabinet.com",
  contactQuestionLabel: "Votre question",
  contactQuestionPlaceholder: "Dites-nous ce que vous avez besoin de savoir…",
  contactSubmit: "Envoyer la question",
  contactHint:
    "L'envoi ouvre votre logiciel de messagerie avec le message déjà rédigé pour soporte@podoraa.com. Rien ne part tant que vous ne l'envoyez pas depuis là.",
  contactEmailInvalid: "Saisissez un e-mail valide pour que nous puissions vous répondre.",
  contactQuestionMissing: "Dites-nous votre question avant d'envoyer.",
  contactDirect: "Ou écrivez-nous directement à",
  contactMailSubject: "Question depuis la page des questions fréquentes",
  contactMailFrom: "Mon e-mail",
  footerTerms: "Conditions",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerRights: "Tous droits réservés.",
};

export const landingByLang: Record<Language, LandingI18n> = { es, en, pt, fr };
