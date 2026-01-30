// Safari private mode fallback storage
// In Safari private browsing, localStorage throws an error
// This provides an in-memory fallback for the session
const memoryStorage: Record<string, string> = {};
let useMemoryFallback = false;

// Test localStorage availability
const testLocalStorage = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Initialize storage type on load
useMemoryFallback = !testLocalStorage();

// Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (useMemoryFallback) {
        return memoryStorage[key] || null;
      }
      return localStorage.getItem(key);
    } catch {
      useMemoryFallback = true;
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (useMemoryFallback) {
        memoryStorage[key] = value;
        return;
      }
      localStorage.setItem(key, value);
    } catch {
      useMemoryFallback = true;
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      if (useMemoryFallback) {
        delete memoryStorage[key];
        return;
      }
      localStorage.removeItem(key);
    } catch {
      useMemoryFallback = true;
      delete memoryStorage[key];
    }
  },
};

// Types for all data structures
export interface Patient {
  id: string;
  folio: string; // Unique medical record number - format: CLINIC_CODE-YEAR-SEQUENCE
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
  monthlyRenewalAmount?: number; // Cantidad de créditos que se renuevan cada mes (gestionado por superadmin)
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

// Appointment (for scheduling - separate from clinical sessions)
export interface Appointment {
  id: string;
  patientId: string | null; // null for "pending patient" appointments
  podiatristId: string;
  clinicId: string;
  date: string; // ISO date
  time: string; // HH:MM format
  duration: number; // in minutes
  notes: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Pending patient info (when patientId is null)
  pendingPatientName?: string;
  pendingPatientPhone?: string;
}

// Storage keys
const KEYS = {
  PATIENTS: "podoadmin_patients",
  SESSIONS: "podoadmin_sessions",
  CREDITS: "podoadmin_credits",
  CREDIT_TRANSACTIONS: "podoadmin_credit_transactions",
  AUDIT_LOG: "podoadmin_audit_log",
  THEME: "podoadmin_theme",
  CREATED_USERS: "podoadmin_created_users",
  CLINIC_CREDITS: "podoadmin_clinic_credits",
  CLINIC_CREDIT_DISTRIBUTIONS: "podoadmin_clinic_credit_distributions",
  APPOINTMENTS: "podoadmin_appointments",
  MOCK_USER_STATES: "podoadmin_mock_user_states", // Estados de usuarios mock
};

// Generic storage helpers - using safeStorage for Safari private mode compatibility
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = safeStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  safeStorage.setItem(key, JSON.stringify(value));
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

// Generate unique folio for patient
// Format: CLINIC_CODE-YEAR-SEQUENCE (e.g., PREM-2026-00001)
// For independent podiatrists: IND-YEAR-SEQUENCE
export const generateFolio = (clinicCode: string | null): string => {
  const year = new Date().getFullYear();
  const prefix = clinicCode || "IND";
  const patients = getPatients();
  
  // Find the highest sequence number for this prefix and year
  const folioPattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let maxSequence = 0;
  
  patients.forEach(p => {
    if (p.folio) {
      const match = p.folio.match(folioPattern);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSequence) maxSequence = seq;
      }
    }
  });
  
  const nextSequence = (maxSequence + 1).toString().padStart(5, "0");
  return `${prefix}-${year}-${nextSequence}`;
};

export const savePatient = (patient: Omit<Patient, "id" | "createdAt" | "updatedAt" | "folio">, clinicCode: string | null): Patient => {
  const patients = getPatients();
  const folio = generateFolio(clinicCode);
  const newPatient: Patient = {
    ...patient,
    folio,
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

// Appointments CRUD (separate from clinical sessions - for scheduling only)
export const getAppointments = (): Appointment[] => getItem<Appointment[]>(KEYS.APPOINTMENTS, []);

export const getAppointmentById = (id: string): Appointment | undefined => {
  return getAppointments().find((a) => a.id === id);
};

export const getAppointmentsByClinic = (clinicId: string): Appointment[] => {
  return getAppointments().filter((a) => a.clinicId === clinicId);
};

export const getAppointmentsByPodiatrist = (podiatristId: string): Appointment[] => {
  return getAppointments().filter((a) => a.podiatristId === podiatristId);
};

export const getAppointmentsByDate = (date: string): Appointment[] => {
  return getAppointments().filter((a) => a.date === date);
};

export const saveAppointment = (appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Appointment => {
  const appointments = getAppointments();
  const newAppointment: Appointment = {
    ...appointment,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  appointments.push(newAppointment);
  setItem(KEYS.APPOINTMENTS, appointments);
  return newAppointment;
};

export const updateAppointment = (id: string, updates: Partial<Appointment>): Appointment | null => {
  const appointments = getAppointments();
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) return null;
  
  appointments[index] = {
    ...appointments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setItem(KEYS.APPOINTMENTS, appointments);
  return appointments[index];
};

export const deleteAppointment = (id: string): boolean => {
  const appointments = getAppointments();
  const filtered = appointments.filter((a) => a.id !== id);
  if (filtered.length === appointments.length) return false;
  setItem(KEYS.APPOINTMENTS, filtered);
  return true;
};

// Initialize user credits based on role
export const initializeUserCredits = (
  userId: string, 
  role: "super_admin" | "clinic_admin" | "admin" | "podiatrist" | "receptionist"
): UserCredits => {
  // Define initial credits based on role
  let monthlyCredits: number;
  let extraCredits: number;
  
  switch (role) {
    case "super_admin":
      monthlyCredits = 1000;
      extraCredits = 500;
      break;
    case "clinic_admin":
      monthlyCredits = 500;
      extraCredits = 200;
      break;
    case "admin":
      monthlyCredits = 300;
      extraCredits = 100;
      break;
    case "receptionist":
      monthlyCredits = 0;
      extraCredits = 0;
      break;
    case "podiatrist":
    default:
      monthlyCredits = 250;
      extraCredits = 50;
      break;
  }
  
  const newCredits: UserCredits = {
    userId,
    monthlyCredits,
    extraCredits,
    reservedCredits: 0,
    lastMonthlyReset: new Date().toISOString(),
    monthlyRenewalAmount: monthlyCredits, // Por defecto, se renuevan los mismos créditos mensuales iniciales
  };
  
  // Save to storage
  updateUserCredits(newCredits);
  
  return newCredits;
};

// Helper to determine role from userId for legacy/seed users
const getRoleFromUserId = (userId: string): "super_admin" | "clinic_admin" | "admin" | "podiatrist" => {
  if (userId.includes("super_admin")) return "super_admin";
  if (userId.includes("clinic_admin") || userId.includes("manager")) return "clinic_admin";
  if (userId.includes("admin") || userId.includes("support")) return "admin";
  return "podiatrist";
};

// Credits management
export const getUserCredits = (userId: string): UserCredits => {
  const allCredits = getItem<UserCredits[]>(KEYS.CREDITS, []);
  const userCredits = allCredits.find((c) => c.userId === userId);
  
  if (!userCredits) {
    // Auto-initialize and save credits for this user based on their role
    const role = getRoleFromUserId(userId);
    return initializeUserCredits(userId, role);
  }
  
  // Migrar usuarios existentes que no tengan monthlyRenewalAmount
  if (userCredits.monthlyRenewalAmount === undefined) {
    userCredits.monthlyRenewalAmount = userCredits.monthlyCredits;
    updateUserCredits(userCredits);
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

// Actualizar la cantidad de créditos que se renuevan mensualmente
export const updateMonthlyRenewalAmount = (userId: string, renewalAmount: number): void => {
  const credits = getUserCredits(userId);
  credits.monthlyRenewalAmount = renewalAmount;
  updateUserCredits(credits);
};

// Renovar créditos mensuales usando el monthlyRenewalAmount configurado
export const renewMonthlyCredits = (userId: string): void => {
  const credits = getUserCredits(userId);
  const renewalAmount = credits.monthlyRenewalAmount ?? credits.monthlyCredits;
  
  // Renovar los créditos mensuales
  credits.monthlyCredits = renewalAmount;
  credits.lastMonthlyReset = new Date().toISOString();
  
  // Agregar transacción de renovación
  addCreditTransaction({
    userId,
    type: "monthly_allocation",
    amount: renewalAmount,
    description: `Renovación mensual de créditos (${renewalAmount} créditos)`,
  });
  
  updateUserCredits(credits);
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
export type NotificationType = "reassignment" | "appointment" | "credit" | "system" | "admin_message";

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
    // Clinic admin reassignment metadata
    clinicAdminId?: string;
    clinicAdminName?: string;
    reassignmentDate?: string;
    creditAmount?: number;
    appointmentDate?: string;
    reason?: string;
    // Admin message metadata
    senderId?: string;
    senderName?: string;
    messageId?: string;
    sentAt?: string;
    subject?: string;
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

// Dispatch custom event when notifications change (for real-time updates)
const dispatchNotificationUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notification-update"));
  }
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
  dispatchNotificationUpdate();
  return newNotification;
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].read = true;
    setItem(NOTIFICATIONS_KEY, notifications);
    dispatchNotificationUpdate();
  }
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  setItem(NOTIFICATIONS_KEY, notifications);
  dispatchNotificationUpdate();
};

export const deleteNotification = (notificationId: string): void => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  const filtered = notifications.filter(n => n.id !== notificationId);
  setItem(NOTIFICATIONS_KEY, filtered);
  dispatchNotificationUpdate();
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
    folio: patient.folio,
    exportedAt: new Date().toISOString(),
    patient: {
      folio: patient.folio,
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

// Admin Messages (Sent Messages) - tipo compartido; persistencia vía API /api/messages
export interface SentMessage {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  recipientIds: string[];
  recipientType: "all" | "specific" | "single";
  sentAt: string;
}

// ============================================
// CLINIC MANAGEMENT
// ============================================

export interface Clinic {
  clinicId: string;
  clinicName: string;
  clinicCode: string; // Short code for folio generation (e.g., "PREM", "CPOD", "PINT")
  ownerId: string; // clinic_admin user id
  createdAt: string;
  logo?: string; // base64 logo
  // Contact information
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  licenseNumber?: string;
  website?: string;
}

const CLINICS_KEY = "podoadmin_clinics";

export const getClinics = (): Clinic[] => {
  return getItem<Clinic[]>(CLINICS_KEY, []);
};

export const getClinicById = (clinicId: string): Clinic | undefined => {
  return getClinics().find(c => c.clinicId === clinicId);
};

export const getClinicByOwnerId = (ownerId: string): Clinic | undefined => {
  return getClinics().find(c => c.ownerId === ownerId);
};

export const saveClinic = (clinic: Clinic): void => {
  const clinics = getClinics();
  const index = clinics.findIndex(c => c.clinicId === clinic.clinicId);
  if (index >= 0) {
    clinics[index] = clinic;
  } else {
    clinics.push(clinic);
  }
  setItem(CLINICS_KEY, clinics);
};

export const updateClinic = (clinicId: string, updates: Partial<Clinic>): Clinic | null => {
  const clinics = getClinics();
  const index = clinics.findIndex(c => c.clinicId === clinicId);
  if (index === -1) return null;
  
  clinics[index] = { ...clinics[index], ...updates };
  setItem(CLINICS_KEY, clinics);
  return clinics[index];
};

// ============================================
// CLINIC LOGO MANAGEMENT - SEPARATE STORAGE
// ============================================
// Logos are stored in a separate localStorage key to prevent 
// JSON serialization issues with large base64 images

const CLINIC_LOGOS_KEY = "podoadmin_clinic_logos";

interface ClinicLogos {
  [clinicId: string]: string; // clinicId -> base64 logo data
}

// Get all logos from separate storage
const getClinicLogos = (): ClinicLogos => {
  return getItem<ClinicLogos>(CLINIC_LOGOS_KEY, {});
};

// Save logo to separate storage key
export const setClinicLogo = (clinicId: string, logoData: string): void => {
  const logos = getClinicLogos();
  logos[clinicId] = logoData;
  setItem(CLINIC_LOGOS_KEY, logos);
  console.log(`[Storage] Logo saved to ${CLINIC_LOGOS_KEY} for clinic: ${clinicId}`);
};

// Get logo from separate storage key
export const getClinicLogo = (clinicId: string): string | undefined => {
  const logos = getClinicLogos();
  const logo = logos[clinicId];
  if (logo) {
    console.log(`[Storage] Logo retrieved from ${CLINIC_LOGOS_KEY} for clinic: ${clinicId}`);
  }
  return logo;
};

// Remove logo from separate storage
export const removeClinicLogo = (clinicId: string): void => {
  const logos = getClinicLogos();
  delete logos[clinicId];
  setItem(CLINIC_LOGOS_KEY, logos);
  console.log(`[Storage] Logo removed from ${CLINIC_LOGOS_KEY} for clinic: ${clinicId}`);
};

// Legacy alias for backwards compatibility
export const saveClinicLogo = setClinicLogo;

// Professional logos for independent podiatrists (no clinic affiliation)
const PROFESSIONAL_LOGOS_KEY = "podoadmin_professional_logos";

interface ProfessionalLogos {
  [userId: string]: string; // userId -> base64 logo data
}

// Get all professional logos from storage
const getProfessionalLogos = (): ProfessionalLogos => {
  return getItem<ProfessionalLogos>(PROFESSIONAL_LOGOS_KEY, {});
};

// Save professional logo for independent doctor
export const setProfessionalLogo = (userId: string, logoData: string): void => {
  const logos = getProfessionalLogos();
  logos[userId] = logoData;
  setItem(PROFESSIONAL_LOGOS_KEY, logos);
  console.log(`[Storage] Professional logo saved for user: ${userId}`);
};

// Get professional logo for independent doctor
export const getProfessionalLogo = (userId: string): string | undefined => {
  const logos = getProfessionalLogos();
  const logo = logos[userId];
  if (logo) {
    console.log(`[Storage] Professional logo retrieved for user: ${userId}`);
  }
  return logo;
};

// Remove professional logo
export const removeProfessionalLogo = (userId: string): void => {
  const logos = getProfessionalLogos();
  delete logos[userId];
  setItem(PROFESSIONAL_LOGOS_KEY, logos);
  console.log(`[Storage] Professional logo removed for user: ${userId}`);
};

// Get logo for a user (checks clinic membership first, then professional logo)
export const getLogoForUserById = (userId: string, clinicId?: string): string | undefined => {
  // If user belongs to a clinic, return clinic logo
  if (clinicId) {
    const clinicLogo = getClinicLogo(clinicId);
    if (clinicLogo) return clinicLogo;
  }
  // For independent users, check professional logo
  const professionalLogo = getProfessionalLogo(userId);
  if (professionalLogo) return professionalLogo;
  
  return undefined;
};

// Get clinic info for display
export const getClinicInfo = (clinicId: string): { clinicName: string; ownerId: string } | null => {
  const clinic = getClinicById(clinicId);
  if (!clinic) return null;
  return { clinicName: clinic.clinicName, ownerId: clinic.ownerId };
};

// Get which clinic a user belongs to (for podiatrists)
export const getUserClinic = (_userId: string, userClinicId?: string): Clinic | undefined => {
  // userId is kept for API consistency but not used
  if (!userClinicId) return undefined;
  return getClinicById(userClinicId);
};

// ============================================
// PROFESSIONAL INFO (for independent podiatrists)
// ============================================

export interface ProfessionalInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  licenseNumber: string; // Clinic/practice license
  professionalLicense: string; // Cédula profesional / individual license
}

const PROFESSIONAL_INFO_KEY = "podoadmin_professional_info";

interface ProfessionalInfoStore {
  [userId: string]: ProfessionalInfo;
}

export const getProfessionalInfo = (userId: string): ProfessionalInfo | null => {
  const store = getItem<ProfessionalInfoStore>(PROFESSIONAL_INFO_KEY, {});
  return store[userId] || null;
};

export const saveProfessionalInfo = (userId: string, data: ProfessionalInfo): void => {
  const store = getItem<ProfessionalInfoStore>(PROFESSIONAL_INFO_KEY, {});
  store[userId] = data;
  setItem(PROFESSIONAL_INFO_KEY, store);
};

// ============================================
// PROFESSIONAL LICENSES (for all podiatrists)
// ============================================

const PROFESSIONAL_LICENSES_KEY = "podoadmin_professional_licenses";

interface ProfessionalLicensesStore {
  [userId: string]: string;
}

export const getProfessionalLicense = (userId: string): string | null => {
  const store = getItem<ProfessionalLicensesStore>(PROFESSIONAL_LICENSES_KEY, {});
  return store[userId] || null;
};

export const saveProfessionalLicense = (userId: string, license: string): void => {
  const store = getItem<ProfessionalLicensesStore>(PROFESSIONAL_LICENSES_KEY, {});
  store[userId] = license;
  setItem(PROFESSIONAL_LICENSES_KEY, store);
};

export const getAllProfessionalLicenses = (): ProfessionalLicensesStore => {
  return getItem<ProfessionalLicensesStore>(PROFESSIONAL_LICENSES_KEY, {});
};

// ============================================
// PRESCRIPTIONS / RECIPES
// ============================================

export interface Prescription {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientDni: string;
  podiatristId: string;
  podiatristName: string;
  podiatristLicense: string | null;
  prescriptionDate: string;
  prescriptionText: string;
  medications: string;
  nextVisitDate: string | null;
  notes: string;
  folio: string; // Prescription folio
  createdAt: string;
  createdBy: string;
}

const PRESCRIPTIONS_KEY = "podoadmin_prescriptions";

export const getPrescriptions = (): Prescription[] => {
  return getItem<Prescription[]>(PRESCRIPTIONS_KEY, []);
};

export const getPrescriptionById = (id: string): Prescription | undefined => {
  return getPrescriptions().find(p => p.id === id);
};

export const getPrescriptionsBySession = (sessionId: string): Prescription[] => {
  return getPrescriptions().filter(p => p.sessionId === sessionId);
};

export const getPrescriptionsByPatient = (patientId: string): Prescription[] => {
  return getPrescriptions().filter(p => p.patientId === patientId);
};

export const generatePrescriptionFolio = (): string => {
  const year = new Date().getFullYear();
  const prescriptions = getPrescriptions();
  const thisYearPrescriptions = prescriptions.filter(p => p.folio.includes(`RX-${year}`));
  const nextSeq = (thisYearPrescriptions.length + 1).toString().padStart(5, "0");
  return `RX-${year}-${nextSeq}`;
};

export const savePrescription = (prescription: Omit<Prescription, "id" | "createdAt" | "folio">): Prescription => {
  const prescriptions = getPrescriptions();
  const newPrescription: Prescription = {
    ...prescription,
    id: generateId(),
    folio: generatePrescriptionFolio(),
    createdAt: new Date().toISOString(),
  };
  prescriptions.push(newPrescription);
  setItem(PRESCRIPTIONS_KEY, prescriptions);
  return newPrescription;
};

export const deletePrescription = (id: string): boolean => {
  const prescriptions = getPrescriptions();
  const filtered = prescriptions.filter(p => p.id !== id);
  if (filtered.length === prescriptions.length) return false;
  setItem(PRESCRIPTIONS_KEY, filtered);
  return true;
};

// ============================================
// PROFESSIONAL CREDENTIALS (for clinic subaltern podiatrists)
// ============================================

export interface ProfessionalCredentials {
  cedula: string;  // Cédula Profesional
  registro: string; // Número de Registro
}

const PROFESSIONAL_CREDENTIALS_KEY = "podoadmin_professional_credentials";

interface ProfessionalCredentialsStore {
  [userId: string]: ProfessionalCredentials;
}

export const getProfessionalCredentials = (userId: string): ProfessionalCredentials | null => {
  const store = getItem<ProfessionalCredentialsStore>(PROFESSIONAL_CREDENTIALS_KEY, {});
  return store[userId] || null;
};

export const saveProfessionalCredentials = (userId: string, cedula: string, registro: string): void => {
  const store = getItem<ProfessionalCredentialsStore>(PROFESSIONAL_CREDENTIALS_KEY, {});
  store[userId] = { cedula, registro };
  setItem(PROFESSIONAL_CREDENTIALS_KEY, store);
};

// ============ Created Users Storage ============
// Users created by Super Admin (stored with password for mock authentication)

export interface CreatedUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "clinic_admin" | "admin" | "podiatrist" | "receptionist";
  clinicId?: string;
  assignedPodiatristIds?: string[]; // Solo receptionist: podólogos asignados
  password: string;
  createdAt: string;
  createdBy: string;
  isBlocked?: boolean; // Cuenta bloqueada temporalmente
  isEnabled?: boolean; // Cuenta habilitada (por defecto true)
  isBanned?: boolean; // Cuenta baneada permanentemente
}

export const getCreatedUsers = (): CreatedUser[] => {
  return getItem<CreatedUser[]>(KEYS.CREATED_USERS, []);
};

export const saveCreatedUser = (
  userData: {
    email: string;
    name: string;
    role: "super_admin" | "clinic_admin" | "admin" | "podiatrist" | "receptionist";
    clinicId?: string;
    assignedPodiatristIds?: string[]; // Para receptionist: podólogos asignados
  },
  password: string,
  createdBy: string
): CreatedUser => {
  const users = getCreatedUsers();
  
  // Check if email already exists
  const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existingUser) {
    throw new Error("Ya existe un usuario con este correo electrónico");
  }
  
  const newUser: CreatedUser = {
    id: `user_created_${generateId()}`,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    clinicId: userData.clinicId,
    assignedPodiatristIds: userData.assignedPodiatristIds,
    password: password,
    createdAt: new Date().toISOString(),
    createdBy: createdBy,
  };
  
  users.push(newUser);
  setItem(KEYS.CREATED_USERS, users);
  
  // Initialize credits for the new user based on their role (receptionist = 0)
  initializeUserCredits(newUser.id, userData.role);
  
  return newUser;
};

export const updateCreatedUser = (userId: string, updates: Partial<Omit<CreatedUser, "id" | "createdAt" | "createdBy">>): CreatedUser | null => {
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;
  
  // Check if updating email to an existing one
  if (updates.email) {
    const existingUser = users.find(u => 
      u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== userId
    );
    if (existingUser) {
      throw new Error("Ya existe un usuario con este correo electrónico");
    }
  }
  
  users[index] = {
    ...users[index],
    ...updates,
  };
  setItem(KEYS.CREATED_USERS, users);
  return users[index];
};

export const deleteCreatedUser = (userId: string): boolean => {
  const users = getCreatedUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  setItem(KEYS.CREATED_USERS, filtered);
  return true;
};

/** Para recepcionistas: devuelve los ids de podólogos asignados */
export const getAssignedPodiatristIdsForReceptionist = (receptionistId: string): string[] => {
  const u = getCreatedUsers().find(u => u.id === receptionistId);
  if (!u || u.role !== "receptionist") return [];
  return u.assignedPodiatristIds ?? [];
};

// Funciones para gestionar estados de cuenta
export const blockUser = (userId: string): boolean => {
  // Intentar con usuarios creados primero
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    users[index] = {
      ...users[index],
      isBlocked: true,
      isEnabled: false,
    };
    setItem(KEYS.CREATED_USERS, users);
    return true;
  }
  
  // Si no es usuario creado, es usuario mock - guardar estado
  setMockUserState(userId, {
    isBlocked: true,
    isEnabled: false,
  });
  return true;
};

export const unblockUser = (userId: string): boolean => {
  // Intentar con usuarios creados primero
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    users[index] = {
      ...users[index],
      isBlocked: false,
      isEnabled: true,
    };
    setItem(KEYS.CREATED_USERS, users);
    return true;
  }
  
  // Si no es usuario creado, es usuario mock - guardar estado
  setMockUserState(userId, {
    isBlocked: false,
    isEnabled: true,
  });
  return true;
};

export const enableUser = (userId: string): boolean => {
  // Intentar con usuarios creados primero
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    users[index] = {
      ...users[index],
      isEnabled: true,
      isBlocked: false,
    };
    setItem(KEYS.CREATED_USERS, users);
    return true;
  }
  
  // Si no es usuario creado, es usuario mock - guardar estado
  setMockUserState(userId, {
    isEnabled: true,
    isBlocked: false,
  });
  return true;
};

export const disableUser = (userId: string): boolean => {
  // Intentar con usuarios creados primero
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    users[index] = {
      ...users[index],
      isEnabled: false,
    };
    setItem(KEYS.CREATED_USERS, users);
    return true;
  }
  
  // Si no es usuario creado, es usuario mock - guardar estado
  setMockUserState(userId, {
    isEnabled: false,
  });
  return true;
};

export const banUser = (userId: string): boolean => {
  // Intentar con usuarios creados primero
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    users[index] = {
      ...users[index],
      isBanned: true,
      isEnabled: false,
      isBlocked: true,
    };
    setItem(KEYS.CREATED_USERS, users);
    return true;
  }
  
  // Si no es usuario creado, es usuario mock - guardar estado
  setMockUserState(userId, {
    isBanned: true,
    isEnabled: false,
    isBlocked: true,
  });
  return true;
};

export const unbanUser = (userId: string): boolean => {
  // Intentar con usuarios creados primero
  const users = getCreatedUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    users[index] = {
      ...users[index],
      isBanned: false,
      isEnabled: true,
      isBlocked: false,
    };
    setItem(KEYS.CREATED_USERS, users);
    return true;
  }
  
  // Si no es usuario creado, es usuario mock - guardar estado
  setMockUserState(userId, {
    isBanned: false,
    isEnabled: true,
    isBlocked: false,
  });
  return true;
};

// Interface para estados de usuarios mock
interface MockUserState {
  isBlocked: boolean;
  isEnabled: boolean;
  isBanned: boolean;
}

// Obtener estados de usuarios mock
const getMockUserStates = (): Record<string, MockUserState> => {
  try {
    return getItem<Record<string, MockUserState>>(KEYS.MOCK_USER_STATES, {});
  } catch (error) {
    console.error("Error obteniendo estados de usuarios mock:", error);
    return {};
  }
};

// Guardar estado de usuario mock
const setMockUserState = (userId: string, state: Partial<MockUserState>): void => {
  const states = getMockUserStates();
  const currentState = states[userId] || {
    isBlocked: false,
    isEnabled: true,
    isBanned: false,
  };
  
  states[userId] = {
    ...currentState,
    ...state,
  };
  setItem(KEYS.MOCK_USER_STATES, states);
};

// Función para obtener el estado de un usuario (incluyendo usuarios mock)
export const getUserStatus = (userId: string): { isBlocked: boolean; isEnabled: boolean; isBanned: boolean } => {
  const createdUsers = getCreatedUsers();
  const createdUser = createdUsers.find(u => u.id === userId);
  
  if (createdUser) {
    return {
      isBlocked: createdUser.isBlocked ?? false,
      isEnabled: createdUser.isEnabled ?? true,
      isBanned: createdUser.isBanned ?? false,
    };
  }
  
  // Para usuarios mock, obtener estado desde storage
  const mockStates = getMockUserStates();
  const mockState = mockStates[userId];
  
  if (mockState) {
    return mockState;
  }
  
  // Por defecto, usuarios mock están habilitados
  return {
    isBlocked: false,
    isEnabled: true,
    isBanned: false,
  };
};

// Mock users para autenticación (deben coincidir con auth-context.tsx)
const MOCK_USERS = [
  {
    email: "admin@podoadmin.com",
    password: "admin123",
    user: {
      id: "user_super_admin",
      email: "admin@podoadmin.com",
      name: "Super Admin",
      role: "super_admin" as const,
      clinicId: undefined,
    },
  },
  {
    email: "support@podoadmin.com",
    password: "support123",
    user: {
      id: "user_admin",
      email: "support@podoadmin.com",
      name: "Admin Support",
      role: "admin" as const,
      clinicId: undefined,
    },
  },
  {
    email: "maria.fernandez@premium.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_001",
      email: "maria.fernandez@premium.com",
      name: "María Fernández",
      role: "clinic_admin" as const,
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor1@premium.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_001",
      email: "doctor1@premium.com",
      name: "Dr. Juan Pérez",
      role: "podiatrist" as const,
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor2@premium.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_002",
      email: "doctor2@premium.com",
      name: "Dra. Ana Martínez",
      role: "podiatrist" as const,
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor3@premium.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_003",
      email: "doctor3@premium.com",
      name: "Dr. Carlos López",
      role: "podiatrist" as const,
      clinicId: "clinic_001",
    },
  },
  {
    email: "juan.garcia@centromedico.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_002",
      email: "juan.garcia@centromedico.com",
      name: "Juan García",
      role: "clinic_admin" as const,
      clinicId: "clinic_002",
    },
  },
  {
    email: "doctor1@centromedico.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_004",
      email: "doctor1@centromedico.com",
      name: "Dra. Laura Sánchez",
      role: "podiatrist" as const,
      clinicId: "clinic_002",
    },
  },
  {
    email: "doctor2@centromedico.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_005",
      email: "doctor2@centromedico.com",
      name: "Dr. Miguel Torres",
      role: "podiatrist" as const,
      clinicId: "clinic_002",
    },
  },
  {
    email: "doctor3@centromedico.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_006",
      email: "doctor3@centromedico.com",
      name: "Dra. Elena Ruiz",
      role: "podiatrist" as const,
      clinicId: "clinic_002",
    },
  },
  {
    email: "sofia.rodriguez@integralplus.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_003",
      email: "sofia.rodriguez@integralplus.com",
      name: "Sofía Rodríguez",
      role: "clinic_admin" as const,
      clinicId: "clinic_003",
    },
  },
  {
    email: "doctor1@integralplus.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_007",
      email: "doctor1@integralplus.com",
      name: "Dr. Roberto Díaz",
      role: "podiatrist" as const,
      clinicId: "clinic_003",
    },
  },
  {
    email: "doctor2@integralplus.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_008",
      email: "doctor2@integralplus.com",
      name: "Dra. Carmen Vega",
      role: "podiatrist" as const,
      clinicId: "clinic_003",
    },
  },
  {
    email: "doctor3@integralplus.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_009",
      email: "doctor3@integralplus.com",
      name: "Dr. Fernando Morales",
      role: "podiatrist" as const,
      clinicId: "clinic_003",
    },
  },
  {
    email: "pablo.hernandez@gmail.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_010",
      email: "pablo.hernandez@gmail.com",
      name: "Dr. Pablo Hernández",
      role: "podiatrist" as const,
      clinicId: undefined,
    },
  },
  {
    email: "lucia.santos@outlook.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_011",
      email: "lucia.santos@outlook.com",
      name: "Dra. Lucía Santos",
      role: "podiatrist" as const,
      clinicId: undefined,
    },
  },
  {
    email: "andres.molina@yahoo.es",
    password: "doctor123",
    user: {
      id: "user_podiatrist_012",
      email: "andres.molina@yahoo.es",
      name: "Dr. Andrés Molina",
      role: "podiatrist" as const,
      clinicId: undefined,
    },
  },
  {
    email: "beatriz.ortiz@hotmail.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_013",
      email: "beatriz.ortiz@hotmail.com",
      name: "Dra. Beatriz Ortiz",
      role: "podiatrist" as const,
      clinicId: undefined,
    },
  },
];

/**
 * Obtiene todos los usuarios con credenciales (mock + creados)
 * Esta función es usada por el servidor para autenticación
 */
export const getAllUsersWithCredentials = (): Array<{
  email: string;
  password: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "clinic_admin" | "admin" | "podiatrist";
    clinicId?: string;
    isBlocked?: boolean;
    isEnabled?: boolean;
    isBanned?: boolean;
  };
}> => {
  const createdUsers = getCreatedUsers();
  const createdUsersFormatted = createdUsers.map((cu) => ({
    email: cu.email,
    password: cu.password,
    user: {
      id: cu.id,
      email: cu.email,
      name: cu.name,
      role: cu.role,
      clinicId: cu.clinicId,
      isBlocked: cu.isBlocked,
      isEnabled: cu.isEnabled,
      isBanned: cu.isBanned,
    },
  }));
  
  return [...MOCK_USERS, ...createdUsersFormatted];
};

// ============================================
// CLINIC CREDITS (Hybrid credit system)
// ============================================

export interface ClinicCredits {
  clinicId: string;
  totalCredits: number;
  distributedToDate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditDistribution {
  id: string;
  clinicId: string;
  fromClinicAdmin: string; // userId of clinic admin
  toPodiatrist: string; // userId of podiatrist
  amount: number;
  reason: string;
  createdAt: string;
}

export const getClinicCredits = (clinicId: string): ClinicCredits | null => {
  const allClinicCredits = getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
  return allClinicCredits.find(c => c.clinicId === clinicId) || null;
};

export const initializeClinicCredits = (clinicId: string, initialCredits: number = 500): ClinicCredits => {
  const existingCredits = getClinicCredits(clinicId);
  if (existingCredits) return existingCredits;
  
  const newClinicCredits: ClinicCredits = {
    clinicId,
    totalCredits: initialCredits,
    distributedToDate: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const allClinicCredits = getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
  allClinicCredits.push(newClinicCredits);
  setItem(KEYS.CLINIC_CREDITS, allClinicCredits);
  
  return newClinicCredits;
};

export const updateClinicCredits = (clinicId: string, amount: number): ClinicCredits | null => {
  const allClinicCredits = getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
  const index = allClinicCredits.findIndex(c => c.clinicId === clinicId);
  
  if (index === -1) {
    // Initialize if not exists
    const initialized = initializeClinicCredits(clinicId, amount);
    return initialized;
  }
  
  allClinicCredits[index].totalCredits = amount;
  allClinicCredits[index].updatedAt = new Date().toISOString();
  setItem(KEYS.CLINIC_CREDITS, allClinicCredits);
  
  return allClinicCredits[index];
};

export const addClinicCredits = (clinicId: string, amount: number): ClinicCredits | null => {
  const existing = getClinicCredits(clinicId);
  if (!existing) {
    return initializeClinicCredits(clinicId, amount);
  }
  
  const allClinicCredits = getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
  const index = allClinicCredits.findIndex(c => c.clinicId === clinicId);
  
  allClinicCredits[index].totalCredits += amount;
  allClinicCredits[index].updatedAt = new Date().toISOString();
  setItem(KEYS.CLINIC_CREDITS, allClinicCredits);
  
  return allClinicCredits[index];
};

export const getClinicAvailableCredits = (clinicId: string): number => {
  const clinicCredits = getClinicCredits(clinicId);
  if (!clinicCredits) return 0;
  return clinicCredits.totalCredits - clinicCredits.distributedToDate;
};

export const distributeCreditsToDoctor = (
  clinicId: string,
  doctorId: string,
  amount: number,
  distributedBy: string,
  reason: string = "Distribución de créditos"
): { success: boolean; error?: string; distribution?: CreditDistribution } => {
  const availableCredits = getClinicAvailableCredits(clinicId);
  
  if (amount <= 0) {
    return { success: false, error: "La cantidad debe ser mayor a 0" };
  }
  
  if (amount > availableCredits) {
    return { success: false, error: `No hay suficientes créditos disponibles. Disponibles: ${availableCredits}` };
  }
  
  // Update clinic credits - add to distributed amount
  const allClinicCredits = getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
  const clinicIndex = allClinicCredits.findIndex(c => c.clinicId === clinicId);
  
  if (clinicIndex === -1) {
    return { success: false, error: "Clínica no encontrada" };
  }
  
  allClinicCredits[clinicIndex].distributedToDate += amount;
  allClinicCredits[clinicIndex].updatedAt = new Date().toISOString();
  setItem(KEYS.CLINIC_CREDITS, allClinicCredits);
  
  // Add credits to podiatrist
  const doctorCredits = getUserCredits(doctorId);
  doctorCredits.extraCredits += amount;
  updateUserCredits(doctorCredits);
  
  // Record the distribution
  const distribution: CreditDistribution = {
    id: generateId(),
    clinicId,
    fromClinicAdmin: distributedBy,
    toPodiatrist: doctorId,
    amount,
    reason,
    createdAt: new Date().toISOString(),
  };
  
  const distributions = getItem<CreditDistribution[]>(KEYS.CLINIC_CREDIT_DISTRIBUTIONS, []);
  distributions.push(distribution);
  setItem(KEYS.CLINIC_CREDIT_DISTRIBUTIONS, distributions);
  
  // Add credit transaction for the podiatrist
  addCreditTransaction({
    userId: doctorId,
    type: "purchase", // Using purchase type for distributed credits
    amount,
    description: `Créditos distribuidos por administrador de clínica: ${reason}`,
  });
  
  return { success: true, distribution };
};

export const getCreditDistributions = (clinicId?: string): CreditDistribution[] => {
  const distributions = getItem<CreditDistribution[]>(KEYS.CLINIC_CREDIT_DISTRIBUTIONS, []);
  if (!clinicId) return distributions;
  return distributions.filter(d => d.clinicId === clinicId);
};

export const getAllClinicCredits = (): ClinicCredits[] => {
  return getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
};

export const subtractCreditsFromDoctor = (
  clinicId: string,
  doctorId: string,
  amount: number,
  subtractedBy: string,
  reason: string = "Retiro de créditos"
): { success: boolean; error?: string; distribution?: CreditDistribution } => {
  if (amount <= 0) {
    return { success: false, error: "La cantidad debe ser mayor a 0" };
  }
  
  // Get doctor's current credits
  const doctorCredits = getUserCredits(doctorId);
  const availableDoctorCredits = doctorCredits.monthlyCredits + doctorCredits.extraCredits - doctorCredits.reservedCredits;
  
  // Validate doctor has enough credits
  if (amount > availableDoctorCredits) {
    return { success: false, error: `El podólogo no tiene suficientes créditos. Disponibles: ${availableDoctorCredits}` };
  }
  
  // Get clinic credits
  const allClinicCredits = getItem<ClinicCredits[]>(KEYS.CLINIC_CREDITS, []);
  const clinicIndex = allClinicCredits.findIndex(c => c.clinicId === clinicId);
  
  if (clinicIndex === -1) {
    return { success: false, error: "Clínica no encontrada" };
  }
  
  // Subtract from doctor's credits (from extra first, then monthly)
  if (doctorCredits.extraCredits >= amount) {
    doctorCredits.extraCredits -= amount;
  } else {
    const remainingToSubtract = amount - doctorCredits.extraCredits;
    doctorCredits.extraCredits = 0;
    doctorCredits.monthlyCredits -= remainingToSubtract;
  }
  updateUserCredits(doctorCredits);
  
  // Add back to clinic pool (reduce distributedToDate)
  allClinicCredits[clinicIndex].distributedToDate -= amount;
  allClinicCredits[clinicIndex].updatedAt = new Date().toISOString();
  setItem(KEYS.CLINIC_CREDITS, allClinicCredits);
  
  // Record the distribution with negative amount for history tracking
  const distribution: CreditDistribution = {
    id: generateId(),
    clinicId,
    fromClinicAdmin: subtractedBy,
    toPodiatrist: doctorId,
    amount: -amount, // Negative amount indicates subtraction
    reason,
    createdAt: new Date().toISOString(),
  };
  
  const distributions = getItem<CreditDistribution[]>(KEYS.CLINIC_CREDIT_DISTRIBUTIONS, []);
  distributions.push(distribution);
  setItem(KEYS.CLINIC_CREDIT_DISTRIBUTIONS, distributions);
  
  // Add credit transaction for the podiatrist
  addCreditTransaction({
    userId: doctorId,
    type: "consumption", // Using consumption type for subtracted credits
    amount: -amount,
    description: `Créditos retirados por administrador de clínica: ${reason}`,
  });
  
  return { success: true, distribution };
};
