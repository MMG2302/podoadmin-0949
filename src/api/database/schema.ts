import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Schema de base de datos para migración desde localStorage
 * Todas las tablas usan prepared statements automáticamente con Drizzle
 */

// Tabla de pacientes
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(),
  folio: text('folio').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: text('gender').notNull(), // 'male' | 'female' | 'other'
  idNumber: text('id_number').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  medicalHistory: text('medical_history').notNull(), // JSON string
  consent: text('consent').notNull(), // JSON string
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'), // Código de clínica
});

// Tabla de sesiones clínicas
export const clinicalSessions = sqliteTable('clinical_sessions', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  sessionDate: text('session_date').notNull(),
  sessionType: text('session_type').notNull(),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  notes: text('notes'),
  creditsUsed: integer('credits_used').notNull().default(0),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clinicId: text('clinic_id'),
});

// Tabla de usuarios creados
export const createdUsers = sqliteTable('created_users', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'super_admin' | 'clinic_admin' | 'admin' | 'podiatrist'
  clinicId: text('clinic_id'),
  password: text('password'), // Hash en producción (opcional para OAuth)
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  createdBy: text('created_by'),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).notNull().default(false),
  isBanned: integer('is_banned', { mode: 'boolean' }).notNull().default(false),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  termsAccepted: integer('terms_accepted', { mode: 'boolean' }).notNull().default(false),
  termsAcceptedAt: text('terms_accepted_at'),
  registrationSource: text('registration_source'), // 'admin' | 'public' | 'google' | 'apple'
  // Campos OAuth
  googleId: text('google_id'), // ID único de Google
  appleId: text('apple_id'), // ID único de Apple
  oauthProvider: text('oauth_provider'), // 'google' | 'apple' | null
  avatarUrl: text('avatar_url'), // URL del avatar (desde OAuth)
});

// Tabla de créditos de usuario
export const userCredits = sqliteTable('user_credits', {
  userId: text('user_id').primaryKey(),
  totalCredits: integer('total_credits').notNull().default(0),
  usedCredits: integer('used_credits').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tabla de transacciones de créditos
export const creditTransactions = sqliteTable('credit_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // 'earned' | 'used' | 'transferred' | 'expired'
  description: text('description'),
  sessionId: text('session_id').references(() => clinicalSessions.id),
  createdAt: text('created_at').notNull(),
  clinicId: text('clinic_id'),
});

// Tabla de clínicas
export const clinics = sqliteTable('clinics', {
  clinicId: text('clinic_id').primaryKey(),
  clinicName: text('clinic_name').notNull(),
  clinicCode: text('clinic_code').notNull().unique(),
  ownerId: text('owner_id').notNull(),
  logo: text('logo'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  licenseNumber: text('license_number'),
  website: text('website'),
  createdAt: text('created_at').notNull(),
});

// Tabla de créditos de clínica
export const clinicCredits = sqliteTable('clinic_credits', {
  clinicId: text('clinic_id').primaryKey().references(() => clinics.clinicId),
  totalCredits: integer('total_credits').notNull().default(0),
  distributedToDate: integer('distributed_to_date').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tabla de distribuciones de créditos
export const clinicCreditDistributions = sqliteTable('clinic_credit_distributions', {
  id: text('id').primaryKey(),
  clinicId: text('clinic_id').notNull().references(() => clinics.clinicId),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  amount: integer('amount').notNull(),
  distributedBy: text('distributed_by').notNull(),
  createdAt: text('created_at').notNull(),
});

// Tabla de citas
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').references(() => patients.id),
  sessionDate: text('session_date').notNull(),
  sessionTime: text('session_time').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(), // 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clinicId: text('clinic_id'),
  pendingPatientName: text('pending_patient_name'),
  pendingPatientPhone: text('pending_patient_phone'),
});

// Tabla de log de auditoría
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  details: text('details'), // JSON string
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
  clinicId: text('clinic_id'),
});

// Tabla de rate limiting (para persistencia)
export const rateLimitAttempts = sqliteTable('rate_limit_attempts', {
  identifier: text('identifier').primaryKey(), // email:IP o solo email
  count: integer('count').notNull().default(0),
  firstAttempt: integer('first_attempt').notNull(), // Timestamp
  lastAttempt: integer('last_attempt').notNull(), // Timestamp
  blockedUntil: integer('blocked_until'), // Timestamp opcional
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tabla de blacklist de tokens (para logout completo)
export const tokenBlacklist = sqliteTable('token_blacklist', {
  tokenId: text('token_id').primaryKey(), // Hash del token JWT
  userId: text('user_id').notNull(),
  tokenType: text('token_type').notNull(), // 'access' | 'refresh'
  expiresAt: integer('expires_at').notNull(), // Timestamp de expiración
  createdAt: text('created_at').notNull(),
});

// Tabla de 2FA (TOTP secrets)
export const twoFactorAuth = sqliteTable('two_factor_auth', {
  userId: text('user_id').primaryKey().references(() => createdUsers.id),
  secret: text('secret').notNull(), // TOTP secret encriptado
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  backupCodes: text('backup_codes'), // JSON array de códigos de respaldo
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tabla de métricas de seguridad
export const securityMetrics = sqliteTable('security_metrics', {
  id: text('id').primaryKey(),
  metricType: text('metric_type').notNull(), // 'failed_login' | 'blocked_user' | '2fa_used' | 'captcha_shown' | etc.
  userId: text('user_id'),
  ipAddress: text('ip_address'),
  details: text('details'), // JSON string con detalles adicionales
  createdAt: text('created_at').notNull(),
  clinicId: text('clinic_id'),
});

// Tabla de tokens de verificación de email
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(), // Timestamp en milisegundos
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Tabla de rate limiting para registro
export const registrationRateLimit = sqliteTable('registration_rate_limit', {
  identifier: text('identifier').primaryKey(), // IP address
  count: integer('count').notNull().default(0),
  firstAttempt: integer('first_attempt').notNull(), // Timestamp
  lastAttempt: integer('last_attempt').notNull(), // Timestamp
  blockedUntil: integer('blocked_until'), // Timestamp opcional
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
