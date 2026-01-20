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
  CREATED_USERS: "podoadmin_created_users",
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

// Initialize user credits based on role
export const initializeUserCredits = (
  userId: string, 
  role: "super_admin" | "clinic_admin" | "admin" | "podiatrist"
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

// Admin Messages (Sent Messages tracking)
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

const SENT_MESSAGES_KEY = "podoadmin_sent_messages";

export const getSentMessages = (): SentMessage[] => {
  return getItem<SentMessage[]>(SENT_MESSAGES_KEY, []);
};

export const addSentMessage = (message: Omit<SentMessage, "id" | "sentAt">): SentMessage => {
  const messages = getSentMessages();
  const newMessage: SentMessage = {
    ...message,
    id: generateId(),
    sentAt: new Date().toISOString(),
  };
  messages.unshift(newMessage);
  setItem(SENT_MESSAGES_KEY, messages.slice(0, 200)); // Keep max 200
  return newMessage;
};

// Get read status count for a sent message
export const getSentMessageReadStatus = (messageId: string): { total: number; read: number; unread: number } => {
  const notifications = getItem<Notification[]>(NOTIFICATIONS_KEY, []);
  const messageNotifications = notifications.filter(
    n => n.type === "admin_message" && n.metadata?.messageId === messageId
  );
  const read = messageNotifications.filter(n => n.read).length;
  return {
    total: messageNotifications.length,
    read,
    unread: messageNotifications.length - read,
  };
};

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
export const getUserClinic = (userId: string, userClinicId?: string): Clinic | undefined => {
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
  role: "super_admin" | "clinic_admin" | "admin" | "podiatrist";
  clinicId?: string;
  password: string;
  createdAt: string;
  createdBy: string;
}

export const getCreatedUsers = (): CreatedUser[] => {
  return getItem<CreatedUser[]>(KEYS.CREATED_USERS, []);
};

export const saveCreatedUser = (
  userData: {
    email: string;
    name: string;
    role: "super_admin" | "clinic_admin" | "admin" | "podiatrist";
    clinicId?: string;
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
    password: password,
    createdAt: new Date().toISOString(),
    createdBy: createdBy,
  };
  
  users.push(newUser);
  setItem(KEYS.CREATED_USERS, users);
  
  // Initialize credits for the new user based on their role
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
