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
  curp: text('curp'),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  weightKg: text('weight_kg'),
  heightCm: text('height_cm'),
  clinicalAlertsJson: text('clinical_alerts_json').notNull().default('[]'),
  medicalHistory: text('medical_history').notNull(), // JSON string
  consent: text('consent').notNull(), // JSON string
  retentionCategory: text('retention_category').notNull().default('clinical_record'),
  lastClinicalActAt: integer('last_clinical_act_at'), // timestamp ms del último acto médico
  retainUntil: integer('retain_until'), // timestamp ms de expiración legal
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
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
  retentionCategory: text('retention_category').notNull().default('clinical_record'),
  lastClinicalActAt: integer('last_clinical_act_at'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
  creditsUsed: integer('credits_used').notNull().default(0),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clinicId: text('clinic_id'),
});

/** Imágenes clínicas por sesión (una fila por foto; evita inflar el JSON de notes). */
export const clinicalSessionImages = sqliteTable('clinical_session_images', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => clinicalSessions.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  dataUri: text('data_uri').notNull(),
  createdAt: text('created_at').notNull(),
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
  privacyPolicyAccepted: integer('privacy_policy_accepted', { mode: 'boolean' }).notNull().default(false),
  privacyPolicyAcceptedAt: text('privacy_policy_accepted_at'),
  registrationSource: text('registration_source'), // 'admin' | 'public' | 'google' | 'apple'
  // Campos OAuth
  googleId: text('google_id'), // ID único de Google
  appleId: text('apple_id'), // ID único de Apple
  oauthProvider: text('oauth_provider'), // 'google' | 'apple' | null
  avatarUrl: text('avatar_url'), // URL del avatar (desde OAuth)
  assignedPodiatristIds: text('assigned_podiatrist_ids'), // JSON array para receptionists
  // Ciclo cancelación: 1 mes grace → bloqueo → 7 meses después borrado permanente
  disabledAt: integer('disabled_at'), // Timestamp (ms) cuando se deshabilitó; null = nunca deshabilitado
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(false), // Contraseña temporal: obligar cambio en primer login
  lastAccessCountry: text('last_access_country'),
  lastAccessState: text('last_access_state'),
  lastAccessCity: text('last_access_city'),
  lastAccessAt: text('last_access_at'),
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
  countryCode: text('country_code').default('MX'),
  licenseNumber: text('license_number'),
  website: text('website'),
  consentText: text('consent_text'), // Términos y condiciones / consentimiento informado (texto editable por clinic_admin)
  consentTextVersion: integer('consent_text_version').notNull().default(0),
  infoUpdatedAt: text('info_updated_at'), // Última modificación de datos; bloqueo 15 días
  logoUpdatedAt: text('logo_updated_at'), // Última modificación de logo; bloqueo 15 días
  podiatristLimit: integer('podiatrist_limit'), // null = límite plan estándar (8); super_admin puede ampliar
  legalName: text('legal_name'),
  rfc: text('rfc'),
  clues: text('clues'),
  establishmentType: text('establishment_type').default('private_office'),
  cofeprisRegistration: text('cofepris_registration'),
  clinicalLayoutJson: text('clinical_layout_json'),
  workspaceWatermarkJson: text('workspace_watermark_json'),
  dashboardLogoEnabled: integer('dashboard_logo_enabled', { mode: 'boolean' }).notNull().default(false),
  dashboardLogoJson: text('dashboard_logo_json'),
  checkoutTariffsJson: text('checkout_tariffs_json'),
  checkoutAnalyticsJson: text('checkout_analytics_json'),
  printPreferencesJson: text('print_preferences_json'),
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
  retentionCategory: text('retention_category').notNull().default('clinical_record'),
  lastClinicalActAt: integer('last_clinical_act_at'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clinicId: text('clinic_id'),
  pendingPatientName: text('pending_patient_name'),
  pendingPatientPhone: text('pending_patient_phone'),
  checkInStatus: text('check_in_status').default('none'), // none | waiting | in_room | seen
});

// Tabla de log de auditoría
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  details: text('details'), // JSON string
  retentionCategory: text('retention_category').notNull().default('audit_evidence'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
  clinicId: text('clinic_id'),
});

// Tabla de notificaciones (recipient = userId)
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // destinatario
  type: text('type').notNull(), // reassignment | appointment | credit | system | admin_message
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata'), // JSON
  retentionCategory: text('retention_category').notNull().default('operational_short_term'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Tabla de mensajes enviados (admin/super_admin)
export const sentMessages = sqliteTable('sent_messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  recipientIds: text('recipient_ids').notNull(), // JSON array
  recipientType: text('recipient_type').notNull(), // all | specific | single
  sentAt: text('sent_at').notNull(),
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
  retentionCategory: text('retention_category').notNull().default('security_event'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
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

// Tabla de tokens de recuperación de contraseña
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(), // Timestamp en milisegundos
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Información profesional (podólogos independientes)
export const professionalInfo = sqliteTable('professional_info', {
  userId: text('user_id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  address: text('address').notNull().default(''),
  city: text('city').notNull().default(''),
  postalCode: text('postal_code').notNull().default(''),
  countryCode: text('country_code').notNull().default('MX'),
  licenseNumber: text('license_number').notNull().default(''),
  professionalLicense: text('professional_license').notNull().default(''),
  consentText: text('consent_text'), // Términos y condiciones / consentimiento informado (texto editable por podólogo)
  consentTextVersion: integer('consent_text_version').notNull().default(0),
  clinicalLayoutJson: text('clinical_layout_json'),
  workspaceWatermarkJson: text('workspace_watermark_json'),
  dashboardLogoEnabled: integer('dashboard_logo_enabled', { mode: 'boolean' }).notNull().default(false),
  dashboardLogoJson: text('dashboard_logo_json'),
  checkoutTariffsJson: text('checkout_tariffs_json'),
  checkoutAnalyticsJson: text('checkout_analytics_json'),
  printPreferencesJson: text('print_preferences_json'),
  infoUpdatedAt: text('info_updated_at'),
});

// Licencia profesional (todos los podólogos)
export const professionalLicenses = sqliteTable('professional_licenses', {
  userId: text('user_id').primaryKey(),
  license: text('license').notNull().default(''),
});

// Credenciales profesionales (podólogos de clínica)
export const professionalCredentials = sqliteTable('professional_credentials', {
  userId: text('user_id').primaryKey(),
  cedula: text('cedula').notNull().default(''),
  registro: text('registro').notNull().default(''),
});

// Logos profesionales (podólogos independientes)
export const professionalLogos = sqliteTable('professional_logos', {
  userId: text('user_id').primaryKey(),
  logo: text('logo').notNull(), // base64 o r2://
  updatedAt: text('updated_at'),
});

// Solicitudes de recuperación de contraseña (requieren revisión por admin/soporte)
export const passwordResetRequests = sqliteTable('password_reset_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  requestedAt: text('requested_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
  rejectionReason: text('rejection_reason'),
});

// Conversaciones de soporte (usuario -> PodoAdmin)
export const supportConversations = sqliteTable('support_conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  subject: text('subject').notNull(),
  status: text('status').notNull().default('open'), // open | closed
  retentionCategory: text('retention_category').notNull().default('support_record'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Mensajes dentro de cada conversación de soporte
export const supportMessages = sqliteTable('support_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => supportConversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull(),
  body: text('body').notNull(),
  retentionCategory: text('retention_category').notNull().default('support_record'),
  retainUntil: integer('retain_until'),
  legalHold: integer('legal_hold', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  readAt: text('read_at'),
});

// Excepciones de conservación por litigio/auditoría (bloqueo legal de borrado)
export const clinicalEvolutionNotes = sqliteTable('clinical_evolution_notes', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  sessionId: text('session_id').references(() => clinicalSessions.id),
  entryDate: text('entry_date').notNull(),
  note: text('note').notNull(),
  professionalName: text('professional_name').notNull(),
  professionalLicense: text('professional_license'),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
  createdAt: text('created_at').notNull(),
});

export const legalHolds = sqliteTable('legal_holds', {
  id: text('id').primaryKey(),
  resourceType: text('resource_type').notNull(), // patient | clinical_session | appointment | audit_log | support_conversation
  resourceId: text('resource_id').notNull(),
  reason: text('reason').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: integer('expires_at'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

// Listas de registro pendientes (vendedores/soporte -> super_admin para aprobación)
export const pendingRegistrationLists = sqliteTable('pending_registration_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdBy: text('created_by').notNull(), // userId del vendedor/admin que la creó
  status: text('status').notNull().default('draft'), // draft | pending | approved | rejected
  submittedAt: text('submitted_at'), // cuando se envió para aprobación
  reviewedBy: text('reviewed_by'), // userId del super_admin que aprobó/rechazó
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Entradas de cada lista (registros pendientes)
export const pendingRegistrationEntries = sqliteTable('pending_registration_entries', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => pendingRegistrationLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('podiatrist'), // podiatrist | clinic_admin | receptionist
  clinicId: text('clinic_id'),
  clinicMode: text('clinic_mode'), // existing | new | none
  podiatristLimit: integer('podiatrist_limit'), // solo clinic_admin: límite de podólogos de la clínica
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// Tabla de rate limiting para registro
export const registrationRateLimit = sqliteTable('registration_rate_limit', {
  identifier: text('identifier').primaryKey(), // IP address
  count: integer('count').notNull().default(0), // Contador de registros exitosos
  failedCount: integer('failed_count').notNull().default(0), // Contador de intentos fallidos (separado)
  firstAttempt: integer('first_attempt').notNull(), // Timestamp
  lastAttempt: integer('last_attempt').notNull(), // Timestamp
  blockedUntil: integer('blocked_until'), // Timestamp opcional
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** WhatsApp Business API — configuración por usuario (podólogo / clinic_admin) */
export const userWhatsappIntegrations = sqliteTable('user_whatsapp_integrations', {
  userId: text('user_id').primaryKey().references(() => createdUsers.id, { onDelete: 'cascade' }),
  clinicId: text('clinic_id'),
  phoneNumberId: text('phone_number_id').notNull(),
  wabaId: text('waba_id'),
  businessPhoneE164: text('business_phone_e164'),
  accessTokenEnc: text('access_token_enc').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  remindersEnabled: integer('reminders_enabled', { mode: 'boolean' }).notNull().default(true),
  reminderHoursBefore: text('reminder_hours_before').notNull().default('[24,48]'),
  reminderSchedule: text('reminder_schedule').notNull().default('{"daysBefore":[5,2,1],"hoursBefore":[24,12,2]}'),
  templateName: text('template_name'),
  templateLanguage: text('template_language').notNull().default('es'),
  defaultExtraNote: text('default_extra_note'),
  receptionistApiEnabled: integer('receptionist_api_enabled', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('pending'), // pending | connected | error
  lastError: text('last_error'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Eventos de mensajería WhatsApp (auditoría operativa de envíos por citas)
export const whatsappMessageEvents = sqliteTable('whatsapp_message_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => createdUsers.id),
  clinicId: text('clinic_id'),
  appointmentId: text('appointment_id').references(() => appointments.id),
  patientId: text('patient_id').references(() => patients.id),
  patientPhone: text('patient_phone'),
  patientName: text('patient_name'),
  messageType: text('message_type').notNull().default('appointment_reminder'), // reminder | manual | other
  direction: text('direction').notNull().default('outbound'), // outbound | inbound
  status: text('status').notNull().default('pending'), // pending | sent | delivered | read | failed
  providerMessageId: text('provider_message_id'),
  providerPayload: text('provider_payload'),
  providerResponse: text('provider_response'),
  errorMessage: text('error_message'),
  extraNote: text('extra_note'),
  createdAt: text('created_at').notNull(),
});

// Recetas médicas (backend)
export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => clinicalSessions.id),
  patientId: text('patient_id').notNull().references(() => patients.id),
  patientName: text('patient_name').notNull(),
  patientDob: text('patient_dob').notNull(),
  patientDni: text('patient_dni').notNull(),
  podiatristId: text('podiatrist_id').notNull(),
  podiatristName: text('podiatrist_name').notNull(),
  podiatristLicense: text('podiatrist_license'),
  prescriptionDate: text('prescription_date').notNull(),
  prescriptionText: text('prescription_text').notNull(),
  medications: text('medications').notNull().default(''),
  nextVisitDate: text('next_visit_date'),
  notes: text('notes').notNull().default(''),
  folio: text('folio').notNull(),
  patientAgeYears: integer('patient_age_years'),
  patientWeightKg: text('patient_weight_kg'),
  patientHeightCm: text('patient_height_cm'),
  podiatristCedula: text('podiatrist_cedula'),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
});

// Suscripción mensual por clínica o podólogo independiente
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  subjectType: text('subject_type').notNull(), // clinic | user
  subjectId: text('subject_id').notNull(),
  status: text('status').notNull().default('active'), // active | past_due | cancelled | trial
  planId: text('plan_id').notNull().default('monthly_standard'),
  currentPeriodStart: integer('current_period_start').notNull(),
  currentPeriodEnd: integer('current_period_end').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  billingInterval: text('billing_interval'), // month | year
  podiatristTier: text('podiatrist_tier'), // standard | expanded (clínica)
  podiatristCountBilled: integer('podiatrist_count_billed'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessionChecklists = sqliteTable('session_checklists', {
  sessionId: text('session_id').primaryKey(),
  itemsJson: text('items_json').notNull(),
  completedAt: text('completed_at'),
  updatedAt: text('updated_at').notNull(),
});

// Plantillas de sesión clínica
export const sessionTemplates = sqliteTable('session_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('general'),
  fieldsJson: text('fields_json').notNull(),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
  isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const patientReferrals = sqliteTable('patient_referrals', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  referredTo: text('referred_to').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  quantity: real('quantity').notNull().default(0),
  unit: text('unit').notNull().default('unidad'),
  clinicId: text('clinic_id'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
});

export const sessionInventoryUsage = sqliteTable('session_inventory_usage', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => clinicalSessions.id),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  quantity: real('quantity').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

export const appointmentWaitlist = sqliteTable('appointment_waitlist', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').references(() => patients.id),
  pendingPatientName: text('pending_patient_name'),
  pendingPatientPhone: text('pending_patient_phone'),
  podiatristId: text('podiatrist_id').notNull(),
  preferredDate: text('preferred_date'),
  reason: text('reason'),
  status: text('status').notNull().default('waiting'),
  clinicId: text('clinic_id'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Handoff podólogo → recepción: importe a cobrar al paciente al salir de consulta. */
export const checkoutHandoffs = sqliteTable('checkout_handoffs', {
  id: text('id').primaryKey(),
  clinicId: text('clinic_id'),
  podiatristId: text('podiatrist_id').notNull(),
  patientId: text('patient_id').notNull(),
  sessionId: text('session_id'),
  appointmentId: text('appointment_id'),
  amountCents: integer('amount_cents'),
  currency: text('currency').notNull().default('MXN'),
  notes: text('notes'),
  status: text('status').notNull().default('awaiting_amount'),
  createdBy: text('created_by').notNull(),
  paidAt: text('paid_at'),
  paidBy: text('paid_by'),
  paymentMethod: text('payment_method'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const patientConsentSignatures = sqliteTable('patient_consent_signatures', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  sessionId: text('session_id').references(() => clinicalSessions.id),
  consentVersion: integer('consent_version').notNull(),
  signatureData: text('signature_data').notNull(),
  signedAt: text('signed_at').notNull(),
  signedByName: text('signed_by_name'),
  deviceInfo: text('device_info'),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
});

export const labAttachments = sqliteTable('lab_attachments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  sessionId: text('session_id').references(() => clinicalSessions.id),
  title: text('title').notNull(),
  fileKey: text('file_key').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull().default(0),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
  createdAt: text('created_at').notNull(),
});

export const whatsappCampaigns = sqliteTable('whatsapp_campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  messageBody: text('message_body').notNull(),
  filterJson: text('filter_json').notNull(),
  status: text('status').notNull().default('draft'),
  scheduledAt: text('scheduled_at'),
  sentAt: text('sent_at'),
  createdBy: text('created_by').notNull(),
  clinicId: text('clinic_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const recordAccessLog = sqliteTable('record_access_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  patientId: text('patient_id').notNull(),
  action: text('action').notNull().default('view'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  clinicId: text('clinic_id'),
  createdAt: text('created_at').notNull(),
});

export const userMobileSync = sqliteTable('user_mobile_sync', {
  userId: text('user_id').primaryKey().references(() => createdUsers.id, { onDelete: 'cascade' }),
  lastSyncAt: integer('last_sync_at').notNull(),
  deviceId: text('device_id'),
  updatedAt: text('updated_at').notNull(),
});

export const appointmentReminderSent = sqliteTable('appointment_reminder_sent', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  reminderKind: text('reminder_kind').notNull(),
  sentAt: text('sent_at').notNull(),
});

/** Trial de 1 mes por IP (una vez por dirección, validada con ipquery.io). */
export const ipTrialGrants = sqliteTable('ip_trial_grants', {
  id: text('id').primaryKey(),
  ipAddress: text('ip_address').notNull(),
  userId: text('user_id').notNull(),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id').notNull(),
  subscriptionId: text('subscription_id'),
  countryCode: text('country_code'),
  riskScore: integer('risk_score'),
  ipqueryJson: text('ipquery_json'),
  grantedAt: integer('granted_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status').notNull().default('active'),
  revokedAt: integer('revoked_at'),
  revokeReason: text('revoke_reason'),
  phoneHash: text('phone_hash'),
  cardFingerprint: text('card_fingerprint'),
});

/** Verificación SMS + tarjeta antes de activar trial. */
export const trialUserVerifications = sqliteTable('trial_user_verifications', {
  userId: text('user_id').primaryKey(),
  phoneE164Hash: text('phone_e164_hash'),
  phoneVerifiedAt: integer('phone_verified_at'),
  cardFingerprint: text('card_fingerprint'),
  cardVerifiedAt: integer('card_verified_at'),
  stripePaymentMethodId: text('stripe_payment_method_id'),
  stripeCustomerId: text('stripe_customer_id'),
  activationIp: text('activation_ip'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const trialSmsOtp = sqliteTable('trial_sms_otp', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  phoneE164Hash: text('phone_e164_hash').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: integer('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

/** Eventos de acceso con geolocalización (login, etc.). */
export const userAccessEvents = sqliteTable('user_access_events', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  role: text('role'),
  eventType: text('event_type').notNull(),
  ipAddress: text('ip_address'),
  countryCode: text('country_code'),
  state: text('state'),
  city: text('city'),
  isp: text('isp'),
  riskScore: integer('risk_score'),
  isVpn: integer('is_vpn', { mode: 'boolean' }).notNull().default(false),
  ipqueryJson: text('ipquery_json'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
});

/** Proveedores que pagan por anuncios geolocalizados. */
export const advertisers = sqliteTable('advertisers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  website: text('website'),
  notes: text('notes'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Campañas de anuncios por estado/provincia. */
export const locationAnnouncements = sqliteTable('location_announcements', {
  id: text('id').primaryKey(),
  advertiserId: text('advertiser_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  targetCountry: text('target_country').notNull(),
  targetState: text('target_state').notNull(),
  externalUrl: text('external_url').notNull(),
  promoCode: text('promo_code'),
  ctaLabel: text('cta_label').notNull().default('Ver más'),
  bannerImageUrl: text('banner_image_url'),
  pricePaid: real('price_paid'),
  startsAt: integer('starts_at').notNull(),
  endsAt: integer('ends_at').notNull(),
  status: text('status').notNull().default('draft'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** Leads "Me interesa" para el anunciante. */
export const announcementInterests = sqliteTable('announcement_interests', {
  id: text('id').primaryKey(),
  announcementId: text('announcement_id').notNull(),
  userId: text('user_id').notNull(),
  userState: text('user_state'),
  userCountry: text('user_country'),
  userName: text('user_name'),
  userEmail: text('user_email'),
  status: text('status').notNull().default('interested'),
  createdAt: text('created_at').notNull(),
});

/** Usuario cerró el banner de un anuncio. */
export const announcementDismissals = sqliteTable('announcement_dismissals', {
  id: text('id').primaryKey(),
  announcementId: text('announcement_id').notNull(),
  userId: text('user_id').notNull(),
  dismissedAt: text('dismissed_at').notNull(),
});
