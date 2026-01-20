import {
  Patient,
  ClinicalSession,
  CreditTransaction,
  UserCredits,
  AuditLog,
  Clinic,
  ClinicCredits,
  generateId,
} from "./storage";

const STORAGE_KEYS = {
  PATIENTS: "podoadmin_patients",
  SESSIONS: "podoadmin_sessions",
  CREDITS: "podoadmin_credits",
  CREDIT_TRANSACTIONS: "podoadmin_credit_transactions",
  AUDIT_LOG: "podoadmin_audit_log",
  CLINICS: "podoadmin_clinics",
  CLINIC_CREDITS: "podoadmin_clinic_credits",
  SEEDED: "podoadmin_seeded",
};

// Spanish realistic data
const spanishNames = {
  firstNames: [
    "María", "Carmen", "Ana", "Isabel", "Rosa", "Lucía", "Elena", "Pilar",
    "José", "Antonio", "Manuel", "Francisco", "Juan", "Pedro", "Carlos", "Luis",
    "Marta", "Paula", "Sara", "Cristina", "David", "Alejandro", "Javier", "Miguel",
    "Teresa", "Rocío", "Andrea", "Silvia", "Daniel", "Pablo", "Sergio", "Jorge"
  ],
  lastNames: [
    "García", "Rodríguez", "Martínez", "López", "González", "Hernández",
    "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera",
    "Gómez", "Díaz", "Moreno", "Álvarez", "Muñoz", "Romero", "Jiménez", "Ruiz"
  ],
};

const conditions = [
  "Diabetes tipo 2", "Hipertensión", "Artritis reumatoide", "Ninguna",
  "Insuficiencia venosa", "Obesidad", "Artrosis", "Fibromialgia"
];

const medications = [
  "Metformina", "Omeprazol", "Ibuprofeno", "Paracetamol",
  "Enalapril", "Ninguno", "Simvastatina", "Aspirina"
];

const allergies = [
  "Ninguna conocida", "Penicilina", "Látex", "Yodo", "Ninguna", "Sulfamidas"
];

const diagnoses = [
  "Onicocriptosis bilateral en primer dedo de ambos pies",
  "Hallux valgus moderado bilateral con metatarsalgia",
  "Fascitis plantar crónica con espolón calcáneo",
  "Micosis ungueal en uñas de ambos pies",
  "Heloma interdigital en 4º espacio interdigital derecho",
  "Queratosis plantar múltiple en zona metatarsal",
  "Pie diabético con hiperqueratosis y alteración de la sensibilidad",
  "Papiloma plantar en talón izquierdo",
  "Hiperqueratosis difusa plantar bilateral",
  "Onicodistrofia post-traumática en primer dedo",
  "Neuroma de Morton en espacio intermetatarsal",
  "Talalgía plantar de origen mecánico",
  "Uña encarnada con granuloma piógeno",
  "Hiperqueratosis subungueal en ambos pies",
  "Pie plano flexible con valgismo de retropié",
];

const treatments = [
  "Se realiza quiropodia completa. Fresado y reducción de lámina ungueal. Control en 4 semanas.",
  "Ortesis de silicona a medida. Revisión quincenal durante 2 meses. Ejercicios de estiramiento.",
  "Ondas de choque focales, 3 sesiones semanales. Plantillas ortopédicas a medida.",
  "Aplicación de lacas antifúngicas. Tratamiento oral recomendado. Control mensual durante 6 meses.",
  "Exéresis del heloma. Separador interdigital de silicona. Higiene y control en 3 semanas.",
  "Deslaminación y quiropodia. Plantillas con descarga metatarsal. Control cada 6 semanas.",
  "Cuidado preventivo del pie diabético. Educación sobre autoexploración. Control mensual estricto.",
  "Cauterización con ácido nítrico. Segunda sesión en 15 días si persiste.",
  "Aplicación de cremas queratolíticas. Uso de piedra pómez. Control en 4 semanas.",
  "Cuidados de la uña. Evitar traumatismos. Seguimiento hasta regeneración completa.",
  "Infiltración con corticoides. Plantillas a medida con descarga metatarsal.",
  "Vendaje funcional. Reposo relativo. Plantillas con talonera amortiguadora.",
  "Extirpación de espícula y granuloma. Curas diarias con betadine. Control en 7 días.",
  "Fresado ungueal. Antimicótico tópico. Control en 3 semanas.",
  "Plantillas correctoras con cuña supinadora. Ejercicios de fortalecimiento.",
];

const anamnesisList = [
  "Paciente acude por dolor en primer dedo del pie derecho. Refiere molestias desde hace 3 semanas. Antecedentes de onicocriptosis previa.",
  "Consulta por deformidad progresiva en ambos pies. Dolor al caminar. Dificultad para encontrar calzado adecuado.",
  "Dolor intenso en talón, peor por las mañanas al dar los primeros pasos. Mejora con el movimiento.",
  "Cambio de coloración en uñas de los pies desde hace varios meses. No dolor pero preocupación estética.",
  "Dolor punzante entre los dedos. Empeora con calzado cerrado. Ha probado varios remedios caseros sin éxito.",
  "Callosidades dolorosas en planta del pie. Dificultan la marcha prolongada.",
  "Paciente diabético de 15 años de evolución. Control glucémico irregular. Acude para revisión preventiva.",
  "Lesión verrugosa en talón. Dolorosa a la presión directa. Presente desde hace 2 meses.",
  "Piel gruesa y agrietada en plantas. Sequedad extrema. No responde a hidratantes comerciales.",
  "Uña engrosada y deformada tras golpe hace 6 meses. Molestia al usar calzado.",
  "Dolor en antepié que irradia a dedos. Sensación de descarga eléctrica al caminar.",
  "Dolor en talón de larga evolución. Empeora con bipedestación prolongada.",
  "Enrojecimiento e inflamación en borde ungueal. Supuración leve. Dolor intenso.",
  "Engrosamiento de uñas con cambio de coloración. Dificultad para cortarlas.",
  "Pies planos desde la infancia. Dolor en arco interno tras ejercicio.",
];

const examinations = [
  "A la exploración se observa eritema y edema periungular en primer dedo. Lámina ungueal enclavada en canal lateral. Signo de Kocher positivo.",
  "Desviación lateral del primer dedo > 20°. Prominencia de cabeza metatarsal. Movilidad limitada en articulación metatarsofalángica.",
  "Punto doloroso a la palpación en inserción de fascia plantar. Test de Windlass positivo. Marcha antiálgica.",
  "Onicolisis parcial. Cambio de coloración amarillenta-verdosa. Hiperqueratosis subungueal. Sin dolor a la palpación.",
  "Heloma duro localizado en espacio interdigital. Eritema circundante. Dolor a la presión.",
  "Hiperqueratosis en cabezas metatarsales II, III y IV. Piel seca. Apoyo metatarsal aumentado.",
  "Piel seca y fina. Alteración de sensibilidad con monofilamento. Pulsos pedios presentes. Sin lesiones activas.",
  "Lesión hiperqueratósica con centro oscuro. Dolor a la presión lateral. Signo del timbre positivo.",
  "Hiperqueratosis difusa. Fisuras en talones. Piel deshidratada. Sin signos de infección.",
  "Uña engrosada y opaca. Deformidad en pico. Onicolisis parcial. Sin signos de infección.",
  "Dolor a la compresión lateral del antepié. Test de Mulder positivo. Piel normal.",
  "Dolor a la palpación en cara medial del calcáneo. Prueba de tensión en fascia positiva.",
  "Eritema periungular intenso. Granuloma piógeno en canal lateral. Dolor exquisito a la palpación.",
  "Uñas engrosadas en todos los dedos. Coloración amarillenta. Hiperqueratosis subungueal.",
  "Pie plano grado II. Valgo de retropié de 8°. Huella plantar patológica.",
];

const sessionTypes = ["consultation", "treatment", "follow_up"];
const cities = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Bilbao", "Murcia"];
const streets = ["Mayor", "Gran Vía", "Alcalá", "Serrano", "Goya", "Princesa", "Diagonal", "Ramblas"];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split("T")[0];
};

// Clinic codes for folio generation
const clinicCodes: Record<string, string> = {
  clinic_001: "PREM",
  clinic_002: "CPOD",
  clinic_003: "PINT",
};

// All podiatrist user IDs (clinic and independent)
const clinicPodiatrists: Record<string, string[]> = {
  clinic_001: ["user_podiatrist_001", "user_podiatrist_002", "user_podiatrist_003"],
  clinic_002: ["user_podiatrist_004", "user_podiatrist_005", "user_podiatrist_006"],
  clinic_003: ["user_podiatrist_007", "user_podiatrist_008", "user_podiatrist_009"],
};

const independentPodiatrists = [
  "user_podiatrist_010",
  "user_podiatrist_011",
  "user_podiatrist_012",
  "user_podiatrist_013",
];

const allPodiatrists = [
  ...clinicPodiatrists.clinic_001,
  ...clinicPodiatrists.clinic_002,
  ...clinicPodiatrists.clinic_003,
  ...independentPodiatrists,
];

// Get clinic code for a podiatrist
const getClinicCodeForPodiatrist = (podiatristId: string): string | null => {
  for (const [clinicId, podiatrists] of Object.entries(clinicPodiatrists)) {
    if (podiatrists.includes(podiatristId)) {
      return clinicCodes[clinicId];
    }
  }
  return null; // Independent podiatrist
};

// Get clinic ID for a podiatrist
const getClinicIdForPodiatrist = (podiatristId: string): string | null => {
  for (const [clinicId, podiatrists] of Object.entries(clinicPodiatrists)) {
    if (podiatrists.includes(podiatristId)) {
      return clinicId;
    }
  }
  return null;
};

const podiatristNames: Record<string, string> = {
  user_podiatrist_001: "Dra. Ana Belén Ruiz",
  user_podiatrist_002: "Dr. Carlos Moreno",
  user_podiatrist_003: "Dra. Laura Vidal",
  user_podiatrist_004: "Dr. Miguel Ángel Torres",
  user_podiatrist_005: "Dra. Patricia Navarro",
  user_podiatrist_006: "Dr. Fernando Ramos",
  user_podiatrist_007: "Dra. Carmen Delgado",
  user_podiatrist_008: "Dr. Alberto Serrano",
  user_podiatrist_009: "Dra. Isabel Castro",
  user_podiatrist_010: "Dr. Pablo Hernández",
  user_podiatrist_011: "Dra. Lucía Santos",
  user_podiatrist_012: "Dr. Andrés Molina",
  user_podiatrist_013: "Dra. Beatriz Ortiz",
};

// Generate distinct SVG logos for each clinic
const generateClinicLogo = (clinicId: string): string => {
  const logos: Record<string, string> = {
    // Clinic 1 - Professional Blue Logo
    clinic_001: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="#f8fafc"/>
      <circle cx="30" cy="30" r="20" fill="#1e40af"/>
      <path d="M30 15 L30 45 M20 25 L40 35 M40 25 L20 35" stroke="white" stroke-width="2" fill="none"/>
      <text x="60" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#1e3a8a">Clínica Podológica</text>
      <text x="60" y="44" font-family="Arial" font-size="12" fill="#3b82f6">PREMIUM</text>
    </svg>`)}`,
    
    // Clinic 2 - Green Health Logo
    clinic_002: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="#f0fdf4"/>
      <rect x="10" y="15" width="40" height="30" rx="5" fill="#15803d"/>
      <path d="M30 22 L30 38 M22 30 L38 30" stroke="white" stroke-width="3" fill="none"/>
      <text x="60" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#166534">Centro Médico</text>
      <text x="60" y="44" font-family="Arial" font-size="12" fill="#22c55e">PODOLÓGICO</text>
    </svg>`)}`,
    
    // Clinic 3 - Red/Burgundy Clinical Logo
    clinic_003: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="#fef2f2"/>
      <polygon points="30,10 50,30 30,50 10,30" fill="#991b1b"/>
      <circle cx="30" cy="30" r="8" fill="white"/>
      <circle cx="30" cy="30" r="4" fill="#991b1b"/>
      <text x="60" y="28" font-family="Arial" font-size="14" font-weight="bold" fill="#7f1d1d">Podología Integral</text>
      <text x="60" y="44" font-family="Arial" font-size="12" fill="#dc2626">PLUS</text>
    </svg>`)}`,
  };
  
  return logos[clinicId] || logos.clinic_001;
};

// Folio tracking per clinic/year for sequential numbering
const folioCounters: Record<string, number> = {};

const generateFolioForSeed = (clinicCode: string | null, createdAt: string): string => {
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const prefix = clinicCode || "IND";
  const key = `${prefix}-${year}`;
  
  if (!folioCounters[key]) {
    folioCounters[key] = 0;
  }
  folioCounters[key]++;
  
  const sequence = folioCounters[key].toString().padStart(5, "0");
  return `${prefix}-${year}-${sequence}`;
};

export const seedDatabase = () => {
  // Check if already seeded
  if (localStorage.getItem(STORAGE_KEYS.SEEDED)) {
    console.log("Database already seeded");
    return false;
  }

  // Generate patients - 8-10 per podiatrist
  const patients: Patient[] = [];
  
  allPodiatrists.forEach((podiatristId) => {
    const patientCount = 8 + Math.floor(Math.random() * 3); // 8-10 patients
    const clinicCode = getClinicCodeForPodiatrist(podiatristId);
    
    for (let i = 0; i < patientCount; i++) {
      const firstName = randomElement(spanishNames.firstNames);
      const lastName = `${randomElement(spanishNames.lastNames)} ${randomElement(spanishNames.lastNames)}`;
      const gender = Math.random() > 0.5 ? "female" : "male";
      const city = randomElement(cities);
      
      // Generate creation date (for retroactive folio generation)
      const createdAt = randomDate(new Date(2024, 0, 1), new Date()).concat("T10:00:00.000Z");
      const folio = generateFolioForSeed(clinicCode, createdAt);
      
      patients.push({
        id: generateId(),
        folio,
        firstName,
        lastName,
        dateOfBirth: randomDate(new Date(1945, 0, 1), new Date(2005, 0, 1)),
        gender,
        idNumber: `${Math.floor(10000000 + Math.random() * 90000000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        phone: `6${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `${firstName.toLowerCase().replace(/[áéíóú]/g, (m) => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[m] || m))}.${lastName.split(" ")[0].toLowerCase().replace(/[áéíóú]/g, (m) => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[m] || m))}${Math.floor(Math.random() * 100)}@email.com`,
        address: `Calle ${randomElement(streets)} ${Math.floor(1 + Math.random() * 100)}, ${Math.floor(1 + Math.random() * 5)}º ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
        city,
        postalCode: `${Math.floor(10000 + Math.random() * 40000)}`,
        medicalHistory: {
          allergies: [randomElement(allergies)],
          medications: [randomElement(medications)],
          conditions: [randomElement(conditions)],
        },
        consent: {
          given: Math.random() > 0.05,
          date: Math.random() > 0.05 ? new Date().toISOString() : null,
        },
        createdAt,
        updatedAt: new Date().toISOString(),
        createdBy: podiatristId,
      });
    }
  });

  // Sort patients by createdAt to maintain folio order consistency
  patients.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Generate sessions - 15-20 per podiatrist
  const sessions: ClinicalSession[] = [];
  const today = new Date();
  const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  allPodiatrists.forEach((podiatristId) => {
    const podiatristPatients = patients.filter(p => p.createdBy === podiatristId);
    const sessionCount = 15 + Math.floor(Math.random() * 6); // 15-20 sessions
    
    for (let i = 0; i < sessionCount; i++) {
      const patient = randomElement(podiatristPatients);
      const sessionIndex = Math.floor(Math.random() * 15);
      const dateRandom = Math.random();
      
      // 70% past, 10% today, 20% future
      let sessionDate: string;
      if (dateRandom < 0.7) {
        sessionDate = randomDate(new Date(2024, 0, 1), today);
      } else if (dateRandom < 0.8) {
        sessionDate = today.toISOString().split("T")[0];
      } else {
        sessionDate = randomDate(today, futureDate);
      }
      
      const isPast = new Date(sessionDate) < today;
      const isCompleted = isPast && Math.random() > 0.15; // 85% of past sessions completed
      
      sessions.push({
        id: generateId(),
        patientId: patient.id,
        sessionDate,
        status: isCompleted ? "completed" : "draft",
        clinicalNotes: "Paciente colaborador. Se programa siguiente revisión según evolución.",
        anamnesis: anamnesisList[sessionIndex],
        physicalExamination: examinations[sessionIndex],
        diagnosis: diagnoses[sessionIndex],
        treatmentPlan: treatments[sessionIndex],
        images: [],
        nextAppointmentDate: Math.random() > 0.3 ? randomDate(today, futureDate) : null,
        followUpNotes: null,
        appointmentReason: null,
        createdAt: new Date(sessionDate + "T09:00:00.000Z").toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: isCompleted ? new Date(sessionDate + "T10:30:00.000Z").toISOString() : null,
        createdBy: podiatristId,
        creditReservedAt: null,
      });
    }
  });

  // Generate credits for all users
  const credits: UserCredits[] = [
    // Super Admin doesn't need clinical credits
    {
      userId: "user_super_admin_001",
      monthlyCredits: 0,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    // Admin (Support) doesn't need credits
    {
      userId: "user_admin_001",
      monthlyCredits: 0,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    // Clinic Admins don't need credits
    {
      userId: "user_clinic_admin_001",
      monthlyCredits: 0,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    {
      userId: "user_clinic_admin_002",
      monthlyCredits: 0,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    {
      userId: "user_clinic_admin_003",
      monthlyCredits: 0,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
  ];
  
  // Add credits for all podiatrists
  allPodiatrists.forEach((userId) => {
    credits.push({
      userId,
      monthlyCredits: 200 + Math.floor(Math.random() * 100),
      extraCredits: Math.floor(Math.random() * 75),
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    });
  });

  // Generate credit transactions for podiatrists
  const transactions: CreditTransaction[] = [];
  
  allPodiatrists.forEach((userId) => {
    const userCredit = credits.find(c => c.userId === userId);
    
    transactions.push({
      id: generateId(),
      userId,
      type: "monthly_allocation",
      amount: userCredit?.monthlyCredits || 200,
      description: "Asignación mensual de créditos - Enero 2025",
      createdAt: new Date(2025, 0, 1).toISOString(),
    });
    
    if (userCredit && userCredit.extraCredits > 0) {
      transactions.push({
        id: generateId(),
        userId,
        type: "purchase",
        amount: userCredit.extraCredits,
        description: "Compra de créditos extra",
        createdAt: new Date(2025, 0, 5 + Math.floor(Math.random() * 10)).toISOString(),
      });
    }
  });

  // Add consumption transactions for completed sessions
  sessions.filter(s => s.status === "completed").slice(0, 40).forEach((session) => {
    transactions.push({
      id: generateId(),
      userId: session.createdBy,
      type: "consumption",
      amount: 1,
      description: "Crédito consumido - Exportación de historia clínica",
      sessionId: session.id,
      createdAt: session.completedAt || new Date().toISOString(),
    });
  });

  // Generate audit logs
  const auditLogs: AuditLog[] = [];
  
  patients.slice(0, 30).forEach((patient) => {
    const userName = podiatristNames[patient.createdBy] || "Podólogo";
    
    auditLogs.push({
      id: generateId(),
      userId: patient.createdBy,
      userName,
      action: "CREATE",
      entityType: "PATIENT",
      entityId: patient.id,
      details: `Nuevo paciente registrado: ${patient.firstName} ${patient.lastName} (Folio: ${patient.folio})`,
      createdAt: patient.createdAt,
    });
  });

  sessions.filter(s => s.status === "completed").slice(0, 20).forEach((session) => {
    const patient = patients.find(p => p.id === session.patientId);
    const userName = podiatristNames[session.createdBy] || "Podólogo";
    
    auditLogs.push({
      id: generateId(),
      userId: session.createdBy,
      userName,
      action: "COMPLETE",
      entityType: "SESSION",
      entityId: session.id,
      details: `Sesión completada para ${patient?.firstName} ${patient?.lastName}`,
      createdAt: session.completedAt || new Date().toISOString(),
    });
  });

  // Generate clinics with complete contact information and distinct logos
  const clinics: Clinic[] = [
    {
      clinicId: "clinic_001",
      clinicName: "Clínica Podológica Premium",
      clinicCode: "PREM",
      ownerId: "user_clinic_admin_001",
      logo: generateClinicLogo("clinic_001"),
      createdAt: new Date(2024, 0, 15).toISOString(),
      // Contact information
      phone: "+34 912 345 678",
      email: "info@clinicapremium.es",
      address: "Calle Gran Vía, 45, 2º Izquierda",
      city: "Madrid",
      postalCode: "28013",
      licenseNumber: "CS-28/2024-POD-001",
      website: "https://www.clinicapodologicapremium.es",
    },
    {
      clinicId: "clinic_002",
      clinicName: "Centro Médico Podológico",
      clinicCode: "CPOD",
      ownerId: "user_clinic_admin_002",
      logo: generateClinicLogo("clinic_002"),
      createdAt: new Date(2024, 2, 1).toISOString(),
      // Contact information
      phone: "+34 933 456 789",
      email: "contacto@centropodologico.com",
      address: "Avenida Diagonal, 234, 1º",
      city: "Barcelona",
      postalCode: "08018",
      licenseNumber: "CS-08/2024-POD-042",
      website: "https://www.centromedicopodologico.com",
    },
    {
      clinicId: "clinic_003",
      clinicName: "Podología Integral Plus",
      clinicCode: "PINT",
      ownerId: "user_clinic_admin_003",
      logo: generateClinicLogo("clinic_003"),
      createdAt: new Date(2024, 4, 10).toISOString(),
      // Contact information
      phone: "+34 963 567 890",
      email: "citas@podologiaintegral.es",
      address: "Plaza del Ayuntamiento, 12, Bajo",
      city: "Valencia",
      postalCode: "46002",
      licenseNumber: "CS-46/2024-POD-018",
      website: "https://www.podologiaintegralplus.es",
    },
  ];

  // Initialize clinic credits pool for each clinic
  const clinicCredits: ClinicCredits[] = [
    {
      clinicId: "clinic_001",
      totalCredits: 750,
      distributedToDate: 150,
      createdAt: new Date(2024, 0, 15).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      clinicId: "clinic_002",
      totalCredits: 500,
      distributedToDate: 100,
      createdAt: new Date(2024, 2, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      clinicId: "clinic_003",
      totalCredits: 600,
      distributedToDate: 75,
      createdAt: new Date(2024, 4, 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
  localStorage.setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLogs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )));
  localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(clinics));
  localStorage.setItem(STORAGE_KEYS.CLINIC_CREDITS, JSON.stringify(clinicCredits));
  localStorage.setItem(STORAGE_KEYS.SEEDED, "true");

  console.log(`Database seeded successfully:
    - ${clinics.length} clinics with complete contact info
    - ${clinicCredits.length} clinic credit pools
    - ${patients.length} patients with folios
    - ${sessions.length} clinical sessions
    - ${credits.length} credit records
    - ${transactions.length} credit transactions
    - ${auditLogs.length} audit logs`);

  return true;
};

export const resetDatabase = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  console.log("Database reset completed");
};
