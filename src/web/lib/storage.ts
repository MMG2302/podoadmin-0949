// Types for all data structures
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  consent: {
    given: boolean;
    date: string | null;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type AppointmentReason = 
  | "routine_checkup"
  | "treatment_continuation"
  | "post_procedure_review"
  | "new_symptoms"
  | "follow_up"
  | "other";

export interface ClinicalSession {
  id: string;
  patientId: string;
  sessionDate: string;
  status: "draft" | "completed";
  clinicalNotes: string;
  anamnesis: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  images: string[]; // base64 encoded webp images
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy: string;
  creditReservedAt: string | null;
  // Follow-up fields
  nextAppointmentDate: string | null;
  followUpNotes: string | null;
  appointmentReason: AppointmentReason | null;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: "monthly_allocation" | "purchase" | "consumption" | "reservation" | "release";
  amount: number;
  description: string;
  sessionId?: string;
  createdAt: string;
}

export interface UserCredits {
  userId: string;
  monthlyCredits: number;
  extraCredits: number;
  reservedCredits: number;
  lastMonthlyReset: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

// Storage keys
const KEYS = {
  PATIENTS: "podoadmin_patients",
  SESSIONS: "podoadmin_sessions",
  CREDITS: "podoadmin_credits",
  CREDIT_TRANSACTIONS: "podoadmin_credit_transactions",
  AUDIT_LOG: "podoadmin_audit_log",
  THEME: "podoadmin_theme",
};

// Generic storage helpers
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Generate UUID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Patients CRUD
export const getPatients = (): Patient[] => getItem<Patient[]>(KEYS.PATIENTS, []);

export const getPatientById = (id: string): Patient | undefined => {
  return getPatients().find((p) => p.id === id);
};

export const savePatient = (patient: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient => {
  const patients = getPatients();
  const newPatient: Patient = {
    ...patient,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  patients.push(newPatient);
  setItem(KEYS.PATIENTS, patients);
  return newPatient;
};

export const updatePatient = (id: string, updates: Partial<Patient>): Patient | null => {
  const patients = getPatients();
  const index = patients.findIndex((p) => p.id === id);
  if (index === -1) return null;
  
  patients[index] = {
    ...patients[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setItem(KEYS.PATIENTS, patients);
  return patients[index];
};

export const deletePatient = (id: string): boolean => {
  const patients = getPatients();
  const filtered = patients.filter((p) => p.id !== id);
  if (filtered.length === patients.length) return false;
  setItem(KEYS.PATIENTS, filtered);
  return true;
};

// Sessions CRUD
export const getSessions = (): ClinicalSession[] => getItem<ClinicalSession[]>(KEYS.SESSIONS, []);

export const getSessionById = (id: string): ClinicalSession | undefined => {
  return getSessions().find((s) => s.id === id);
};

export const getSessionsByPatient = (patientId: string): ClinicalSession[] => {
  return getSessions().filter((s) => s.patientId === patientId);
};

export const saveSession = (session: Omit<ClinicalSession, "id" | "createdAt" | "updatedAt">): ClinicalSession => {
  const sessions = getSessions();
  const newSession: ClinicalSession = {
    ...session,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.push(newSession);
  setItem(KEYS.SESSIONS, sessions);
  return newSession;
};

export const updateSession = (id: string, updates: Partial<ClinicalSession>): ClinicalSession | null => {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;
  
  // Don't allow editing completed sessions
  if (sessions[index].status === "completed" && updates.status !== "completed") {
    return null;
  }
  
  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setItem(KEYS.SESSIONS, sessions);
  return sessions[index];
};

export const deleteSession = (id: string): boolean => {
  const sessions = getSessions();
  const session = sessions.find((s) => s.id === id);
  if (!session || session.status === "completed") return false;
  
  const filtered = sessions.filter((s) => s.id !== id);
  setItem(KEYS.SESSIONS, filtered);
  return true;
};

// Credits management
export const getUserCredits = (userId: string): UserCredits => {
  const allCredits = getItem<UserCredits[]>(KEYS.CREDITS, []);
  const userCredits = allCredits.find((c) => c.userId === userId);
  
  if (!userCredits) {
    // Default credits based on role (determined by userId pattern)
    const isAdmin = userId.includes("super_admin");
    return {
      userId,
      monthlyCredits: isAdmin ? 1000 : 250,
      extraCredits: isAdmin ? 500 : 50,
      reservedCredits: 0,
      lastMonthlyReset: new Date().toISOString(),
    };
  }
  
  return userCredits;
};

export const updateUserCredits = (credits: UserCredits): void => {
  const allCredits = getItem<UserCredits[]>(KEYS.CREDITS, []);
  const index = allCredits.findIndex((c) => c.userId === credits.userId);
  
  if (index === -1) {
    allCredits.push(credits);
  } else {
    allCredits[index] = credits;
  }
  
  setItem(KEYS.CREDITS, allCredits);
};

export const reserveCredit = (userId: string, sessionId: string): boolean => {
  const credits = getUserCredits(userId);
  const available = credits.monthlyCredits + credits.extraCredits - credits.reservedCredits;
  
  if (available < 1) return false;
  
  credits.reservedCredits += 1;
  updateUserCredits(credits);
  
  addCreditTransaction({
    userId,
    type: "reservation",
    amount: 1,
    description: "Crédito reservado para sesión clínica",
    sessionId,
  });
  
  return true;
};

export const consumeCredit = (userId: string, sessionId: string): boolean => {
  const credits = getUserCredits(userId);
  
  // Release reservation first
  if (credits.reservedCredits > 0) {
    credits.reservedCredits -= 1;
  }
  
  // Consume from monthly first, then extra
  if (credits.monthlyCredits > 0) {
    credits.monthlyCredits -= 1;
  } else if (credits.extraCredits > 0) {
    credits.extraCredits -= 1;
  } else {
    return false;
  }
  
  updateUserCredits(credits);
  
  addCreditTransaction({
    userId,
    type: "consumption",
    amount: 1,
    description: "Crédito consumido por exportación de historia clínica",
    sessionId,
  });
  
  return true;
};

export const releaseCredit = (userId: string, sessionId: string): void => {
  const credits = getUserCredits(userId);
  
  if (credits.reservedCredits > 0) {
    credits.reservedCredits -= 1;
    updateUserCredits(credits);
    
    addCreditTransaction({
      userId,
      type: "release",
      amount: 1,
      description: "Crédito liberado - sesión no completada",
      sessionId,
    });
  }
};

// Credit transactions
export const getCreditTransactions = (userId?: string): CreditTransaction[] => {
  const transactions = getItem<CreditTransaction[]>(KEYS.CREDIT_TRANSACTIONS, []);
  return userId ? transactions.filter((t) => t.userId === userId) : transactions;
};

export const addCreditTransaction = (
  transaction: Omit<CreditTransaction, "id" | "createdAt">
): CreditTransaction => {
  const transactions = getCreditTransactions();
  const newTransaction: CreditTransaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  setItem(KEYS.CREDIT_TRANSACTIONS, transactions);
  return newTransaction;
};

// Audit log
export const getAuditLogs = (): AuditLog[] => getItem<AuditLog[]>(KEYS.AUDIT_LOG, []);

export const addAuditLog = (log: Omit<AuditLog, "id" | "createdAt">): AuditLog => {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog); // Add to beginning
  setItem(KEYS.AUDIT_LOG, logs.slice(0, 500)); // Keep only last 500 entries
  return newLog;
};

// Notifications
export type NotificationType = "reassignment" | "appointment" | "credit" | "system";

export interface Notification {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    fromUserId?: string;
    fromUserName?: string;
    toUserId?: string;
    toUserName?: string;
    patientId?: string;
    patientName?: string;
    reassignedById?: string;
    reassignedByName?: string;
    creditAmount?: number;
    appointmentDate?: string;
    reason?: string;
  };
}

const NOTIFICATIONS_KEY = "podoadmin_notifications";

export const getNotifications = (userId?: string): Notification[] => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  if (!userId) return notifications;
  return notifications.filter(n => n.userId === userId);
};

export const getUnreadNotificationCount = (userId: string): number => {
  return getNotifications(userId).filter(n => !n.read).length;
};

export const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">): Notification => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotification);
  setItem(NOTIFICATIONS_KEY, notifications.slice(0, 500)); // Keep max 500
  return newNotification;
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].read = true;
    setItem(NOTIFICATIONS_KEY, notifications);
  }
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  setItem(NOTIFICATIONS_KEY, notifications);
};

export const deleteNotification = (notificationId: string): void => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  const filtered = notifications.filter(n => n.id !== notificationId);
  setItem(NOTIFICATIONS_KEY, filtered);
};

// Theme settings
export interface ThemeSettings {
  mode: "light" | "dark";
  accentColor: string;
}

export const getThemeSettings = (): ThemeSettings => {
  return getItem<ThemeSettings>(KEYS.THEME, {
    mode: "light",
    accentColor: "#1a1a1a",
  });
};

export const saveThemeSettings = (settings: ThemeSettings): void => {
  setItem(KEYS.THEME, settings);
};

// Export patient data as JSON
export const exportPatientData = (patientId: string, tenantId: string = "tenant_001") => {
  const patient = getPatientById(patientId);
  if (!patient) return null;
  
  const sessions = getSessionsByPatient(patientId);
  
  return {
    tenantId,
    patientId: patient.id,
    exportedAt: new Date().toISOString(),
    patient: {
      demographics: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        idNumber: patient.idNumber,
        contact: {
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          city: patient.city,
          postalCode: patient.postalCode,
        },
      },
      medicalHistory: patient.medicalHistory,
      consent: patient.consent,
      audit: {
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        createdBy: patient.createdBy,
      },
    },
    clinicalSessions: sessions.map((s) => ({
      id: s.id,
      date: s.sessionDate,
      status: s.status,
      clinicalNotes: s.clinicalNotes,
      anamnesis: s.anamnesis,
      physicalExamination: s.physicalExamination,
      diagnosis: s.diagnosis,
      treatmentPlan: s.treatmentPlan,
      images: s.images.map((img, idx) => ({
        index: idx + 1,
        format: "webp",
        data: img,
      })),
      audit: {
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        completedAt: s.completedAt,
        createdBy: s.createdBy,
      },
    })),
  };
};
