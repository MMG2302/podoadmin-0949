import {
  Patient,
  ClinicalSession,
  CreditTransaction,
  UserCredits,
  AuditLog,
  generateId,
} from "./storage";

const STORAGE_KEYS = {
  PATIENTS: "podoadmin_patients",
  SESSIONS: "podoadmin_sessions",
  CREDITS: "podoadmin_credits",
  CREDIT_TRANSACTIONS: "podoadmin_credit_transactions",
  AUDIT_LOG: "podoadmin_audit_log",
  SEEDED: "podoadmin_seeded",
};

const spanishNames = {
  firstNames: [
    "María", "Carmen", "Ana", "Isabel", "Rosa", "Lucía", "Elena", "Pilar",
    "José", "Antonio", "Manuel", "Francisco", "Juan", "Pedro", "Carlos", "Luis"
  ],
  lastNames: [
    "García", "Rodríguez", "Martínez", "López", "González", "Hernández",
    "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera"
  ],
};

const conditions = [
  "Diabetes tipo 2", "Hipertensión", "Artritis reumatoide", "Ninguna",
  "Insuficiencia venosa", "Obesidad"
];

const medications = [
  "Metformina", "Omeprazol", "Ibuprofeno", "Paracetamol",
  "Enalapril", "Ninguno", "Simvastatina"
];

const allergies = [
  "Ninguna conocida", "Penicilina", "Látex", "Yodo", "Ninguna"
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
];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split("T")[0];
};

// Podiatrist user IDs (matching auth context)
const podiatristIds = [
  "user_podiatrist_001",
  "user_podiatrist_002",
  "user_podiatrist_003",
  "user_podiatrist_004",
];

export const seedDatabase = () => {
  // Check if already seeded
  if (localStorage.getItem(STORAGE_KEYS.SEEDED)) {
    console.log("Database already seeded");
    return false;
  }

  // Generate patients - distributed among podiatrists
  const patients: Patient[] = [];
  for (let i = 0; i < 15; i++) {
    const firstName = randomElement(spanishNames.firstNames);
    const lastName = `${randomElement(spanishNames.lastNames)} ${randomElement(spanishNames.lastNames)}`;
    const gender = Math.random() > 0.5 ? "female" : "male";
    const createdBy = randomElement(podiatristIds);
    
    patients.push({
      id: generateId(),
      firstName,
      lastName,
      dateOfBirth: randomDate(new Date(1950, 0, 1), new Date(2000, 0, 1)),
      gender,
      idNumber: `${Math.floor(10000000 + Math.random() * 90000000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      phone: `6${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `${firstName.toLowerCase()}.${lastName.split(" ")[0].toLowerCase()}@email.com`,
      address: `Calle ${randomElement(["Mayor", "Gran Vía", "Alcalá", "Serrano", "Goya", "Princesa"])} ${Math.floor(1 + Math.random() * 100)}`,
      city: randomElement(["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza"]),
      postalCode: `${Math.floor(10000 + Math.random() * 40000)}`,
      medicalHistory: {
        allergies: [randomElement(allergies)],
        medications: [randomElement(medications)],
        conditions: [randomElement(conditions)],
      },
      consent: {
        given: Math.random() > 0.1,
        date: Math.random() > 0.1 ? new Date().toISOString() : null,
      },
      createdAt: randomDate(new Date(2024, 0, 1), new Date()).concat("T10:00:00.000Z"),
      updatedAt: new Date().toISOString(),
      createdBy,
    });
  }

  // Generate sessions - created by podiatrists only
  const sessions: ClinicalSession[] = [];
  const today = new Date();
  
  patients.forEach((patient) => {
    const numSessions = Math.floor(1 + Math.random() * 4);
    
    for (let i = 0; i < numSessions; i++) {
      const sessionIndex = Math.floor(Math.random() * 10);
      const isCompleted = Math.random() > 0.2;
      
      sessions.push({
        id: generateId(),
        patientId: patient.id,
        sessionDate: randomDate(new Date(2024, 0, 1), today),
        status: isCompleted ? "completed" : "draft",
        clinicalNotes: "Paciente colaborador. Se programa siguiente revisión.",
        anamnesis: anamnesisList[sessionIndex],
        physicalExamination: examinations[sessionIndex],
        diagnosis: diagnoses[sessionIndex],
        treatmentPlan: treatments[sessionIndex],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: isCompleted ? new Date().toISOString() : null,
        createdBy: patient.createdBy, // Session created by the same podiatrist who owns the patient
        creditReservedAt: null,
      });
    }
  });

  // Generate credits for all user types
  const credits: UserCredits[] = [
    // Super Admin doesn't need clinical credits (manages platform, not patients)
    {
      userId: "user_super_admin_001",
      monthlyCredits: 0,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    // Clinic Admin manages clinic, doesn't need credits for sessions
    {
      userId: "user_clinic_admin_001",
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
    // Podiatrists get credits
    {
      userId: "user_podiatrist_001",
      monthlyCredits: 250,
      extraCredits: 50,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    {
      userId: "user_podiatrist_002",
      monthlyCredits: 250,
      extraCredits: 30,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    {
      userId: "user_podiatrist_003",
      monthlyCredits: 200,
      extraCredits: 0,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
    {
      userId: "user_podiatrist_004",
      monthlyCredits: 150,
      extraCredits: 25,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    },
  ];

  // Generate credit transactions for podiatrists
  const transactions: CreditTransaction[] = [];
  
  podiatristIds.forEach((userId, index) => {
    transactions.push({
      id: generateId(),
      userId,
      type: "monthly_allocation",
      amount: [250, 250, 200, 150][index],
      description: "Asignación mensual de créditos - Enero 2025",
      createdAt: new Date(2025, 0, 1).toISOString(),
    });
    
    if (index < 3) {
      transactions.push({
        id: generateId(),
        userId,
        type: "purchase",
        amount: [50, 30, 0, 25][index],
        description: "Compra de créditos extra",
        createdAt: new Date(2025, 0, 5 + index * 3).toISOString(),
      });
    }
  });

  // Add consumption transactions for some sessions
  sessions.filter(s => s.status === "completed").slice(0, 10).forEach((session) => {
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
  
  patients.slice(0, 8).forEach((patient) => {
    const userName = {
      user_podiatrist_001: "Dra. María García",
      user_podiatrist_002: "Dr. Antonio López",
      user_podiatrist_003: "Dra. Elena Martínez",
      user_podiatrist_004: "Dr. Pedro Sánchez",
    }[patient.createdBy] || "Podólogo";
    
    auditLogs.push({
      id: generateId(),
      userId: patient.createdBy,
      userName,
      action: "CREATE",
      entityType: "PATIENT",
      entityId: patient.id,
      details: `Nuevo paciente registrado: ${patient.firstName} ${patient.lastName}`,
      createdAt: patient.createdAt,
    });
  });

  sessions.filter(s => s.status === "completed").slice(0, 8).forEach((session) => {
    const patient = patients.find(p => p.id === session.patientId);
    const userName = {
      user_podiatrist_001: "Dra. María García",
      user_podiatrist_002: "Dr. Antonio López",
      user_podiatrist_003: "Dra. Elena Martínez",
      user_podiatrist_004: "Dr. Pedro Sánchez",
    }[session.createdBy] || "Podólogo";
    
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

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
  localStorage.setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLogs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )));
  localStorage.setItem(STORAGE_KEYS.SEEDED, "true");

  console.log("Database seeded successfully!");
  console.log(`- ${patients.length} patients`);
  console.log(`- ${sessions.length} sessions`);
  console.log(`- ${transactions.length} transactions`);
  console.log(`- ${auditLogs.length} audit logs`);

  return true;
};

export const clearSeedData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  console.log("Seed data cleared");
};
