import { z } from 'zod';
import type { Context } from 'hono';
import { TENANT_COUNTRY_CODES } from '../../lib/phone-country';
import { escapeHtml, sanitizeEmail, containsXssPayload } from './sanitization';

export const tenantCountryCodeSchema = z.enum(TENANT_COUNTRY_CODES);

/**
 * Schemas de validación con Zod para prevenir inyección y validar datos
 */

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .transform((val) => val.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Email es requerido')
        .email('Email inválido')
        .max(255, 'Email demasiado largo')
        .refine((val) => !containsXssPayload(val), {
          message: 'Email contiene caracteres no permitidos',
        })
        .transform((val) => sanitizeEmail(val) || val),
    ),
  password: z
    .string()
    .transform((val) => val.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Contraseña es requerida')
        .max(255, 'Contraseña demasiado larga')
        .refine((val) => !containsXssPayload(val), {
          message: 'Contraseña contiene caracteres no permitidos',
        }),
    ),
});

/**
 * Schema para crear usuario
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .transform((val) => sanitizeEmail(val) || val),
  name: z
    .string()
    .min(1, 'Nombre es requerido')
    .max(255, 'Nombre demasiado largo')
    .transform((val) => escapeHtml(val)), // Escapar HTML
  role: z.enum(['super_admin', 'clinic_admin', 'admin', 'podiatrist', 'receptionist']),
  clinicId: z.string().max(100).optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(255, 'Contraseña demasiado larga'),
});

/**
 * Schema para crear clínica (super_admin)
 * clinicId, clinicName, clinicCode opcionales: si no se envían, la API genera placeholders.
 * El clinic_admin completará todo en Configuración.
 */
export const createClinicSchema = z.object({
  clinicId: z.string().max(64, 'ID demasiado largo').regex(/^[a-zA-Z0-9_-]*$/, 'Solo letras, números, guiones y guiones bajos').optional(),
  clinicName: z.string().max(255, 'Nombre demasiado largo').transform((val) => escapeHtml(val)).optional(),
  clinicCode: z.string().max(20, 'Código demasiado largo').transform((val) => escapeHtml(val)).optional(),
  ownerId: z.string().min(1, 'ID del propietario requerido').max(128, 'ID demasiado largo'),
  phone: z.string().max(50, 'Teléfono demasiado largo').optional(),
  email: z.string().max(255, 'Email demasiado largo').optional(),
  address: z.string().max(500, 'Dirección demasiado larga').optional(),
  city: z.string().max(100, 'Ciudad demasiado larga').optional(),
  postalCode: z.string().max(20, 'Código postal demasiado largo').optional(),
  countryCode: tenantCountryCodeSchema.optional(),
  licenseNumber: z.string().max(100, 'Número de licencia demasiado largo').optional(),
  website: z.string().max(255, 'Web demasiado larga').optional(),
  podiatristLimit: z
    .union([z.number().int().min(0), z.string().transform((v) => (v === '' ? undefined : parseInt(v, 10)))])
    .optional()
    .nullable(),
});

/**
 * Schema para actualizar usuario
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .transform((val) => sanitizeEmail(val) || val)
    .optional(),
  name: z
    .string()
    .min(1, 'Nombre es requerido')
    .max(255, 'Nombre demasiado largo')
    .transform((val) => escapeHtml(val))
    .optional(),
  role: z.enum(['super_admin', 'clinic_admin', 'admin', 'podiatrist', 'receptionist']).optional(),
  clinicId: z.string().max(100).nullable().optional(),
});

/**
 * Schema para crear paciente
 */
export const createPatientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Nombre es requerido')
    .max(100, 'Nombre demasiado largo')
    .transform((val) => escapeHtml(val)),
  lastName: z
    .string()
    .min(1, 'Apellido es requerido')
    .max(100, 'Apellido demasiado largo')
    .transform((val) => escapeHtml(val)),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  gender: z.enum(['male', 'female', 'other']),
  idNumber: z
    .union([z.string(), z.number()])
    .transform((val) => escapeHtml(val == null ? '' : String(val)))
    .pipe(z.string().max(50, 'Número de identificación demasiado largo')),
  phone: z
    .string()
    .max(20, 'Teléfono demasiado largo')
    .transform((val) => escapeHtml(val)),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .transform((val) => sanitizeEmail(val) || val)
    .optional(),
  address: z
    .string()
    .max(500, 'Dirección demasiado larga')
    .transform((val) => escapeHtml(val))
    .optional(),
  city: z
    .string()
    .max(100, 'Ciudad demasiado larga')
    .transform((val) => escapeHtml(val))
    .optional(),
  postalCode: z
    .string()
    .max(20, 'Código postal demasiado largo')
    .transform((val) => escapeHtml(val))
    .optional(),
  weightKg: z.string().max(16).optional().nullable(),
  heightCm: z.string().max(16).optional().nullable(),
  curp: z
    .union([z.string(), z.literal(''), z.undefined()])
    .transform((val) => {
      const s = typeof val === 'string' ? val.trim().toUpperCase() : '';
      return s ? escapeHtml(s) : undefined;
    })
    .optional(),
  medicalHistory: z.object({
    allergies: z.array(z.string().transform((val) => escapeHtml(val))).optional(),
    medications: z.array(z.string().transform((val) => escapeHtml(val))).optional(),
    conditions: z.array(z.string().transform((val) => escapeHtml(val))).optional(),
    family: z
      .object({
        hypertension: z
          .object({
            present: z.boolean().nullable().optional(),
            condition: z.string().transform((val) => escapeHtml(val)).optional(),
            notes: z.string().transform((val) => escapeHtml(val)).optional(),
          })
          .optional(),
        diabetes: z
          .object({
            present: z.boolean().nullable().optional(),
            condition: z.string().transform((val) => escapeHtml(val)).optional(),
            notes: z.string().transform((val) => escapeHtml(val)).optional(),
          })
          .optional(),
        psoriasis: z
          .object({
            present: z.boolean().nullable().optional(),
            condition: z.string().transform((val) => escapeHtml(val)).optional(),
            notes: z.string().transform((val) => escapeHtml(val)).optional(),
          })
          .optional(),
        other: z
          .object({
            present: z.boolean().nullable().optional(),
            condition: z.string().transform((val) => escapeHtml(val)).optional(),
            notes: z.string().transform((val) => escapeHtml(val)).optional(),
          })
          .optional(),
      })
      .optional(),
  }).optional(),
  consent: z.object({
    given: z.boolean(),
    date: z.string().nullable().optional(),
    consentedToVersion: z.number().optional(),
  }).optional(),
  /** Solo para recepcionistas: id del podólogo al que se asigna el paciente */
  createdBy: z.string().max(128).optional(),
});

/**
 * Schema para actualizar paciente
 */
export const updatePatientSchema = createPatientSchema.partial();

/**
 * Schema para registro público
 * Incluye validación estricta de contraseñas y términos
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .refine((val) => !containsXssPayload(val), {
      message: 'Email contiene caracteres no permitidos',
    })
    .transform((val) => sanitizeEmail(val) || val),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .max(128, 'La contraseña no puede tener más de 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
    .refine((val) => !containsXssPayload(val), {
      message: 'Contraseña contiene caracteres no permitidos',
    }),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .transform((val) => escapeHtml(val)),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
  privacyPolicyAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar la política de privacidad',
    }),
  captchaToken: z.string().optional(), // CAPTCHA token (opcional si no está configurado)
  clinicCode: z.string().max(100).optional(), // Código de clínica (opcional)
});

/**
 * Schema para verificación de email
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Token es requerido')
    .max(255, 'Token inválido')
    .refine((val) => !containsXssPayload(val), {
      message: 'Token contiene caracteres no permitidos',
    }),
});

/**
 * Schema para solicitar recuperación de contraseña (forgot password)
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .refine((val) => !containsXssPayload(val), {
      message: 'Email contiene caracteres no permitidos',
    })
    .transform((val) => sanitizeEmail(val) || val),
});

/**
 * Schema para restablecer contraseña con token
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Token es requerido')
    .max(255, 'Token inválido')
    .refine((val) => !containsXssPayload(val), {
      message: 'Token contiene caracteres no permitidos',
    }),
  newPassword: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .max(128, 'La contraseña no puede tener más de 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
    .refine((val) => !containsXssPayload(val), {
      message: 'Contraseña contiene caracteres no permitidos',
    }),
});

const roleEnum = z.enum(['super_admin', 'clinic_admin', 'admin', 'podiatrist', 'receptionist']);

/** Query: filtro opcional por rol en listados de usuarios */
export const roleFilterQuerySchema = z.object({
  role: roleEnum.optional(),
  q: z.string().max(100).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

/** Paginación en listados clínicos */
export const clinicalListPaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v)),
});

/** Query: listado de pacientes */
export const patientsListQuerySchema = clinicalListPaginationSchema.extend({
  q: z.string().max(100).optional(),
  ids: z.string().max(2000).optional(),
  createdBy: z.string().max(128).optional(),
  segment: z.enum(['new', 'recurrent', 'recovered']).optional(),
  ageMin: z.coerce.number().int().min(0).max(130).optional(),
  ageMax: z.coerce.number().int().min(0).max(130).optional(),
  /** Sin sesión en los últimos 90 (3m) o 180 (6m) días. */
  inactive: z.enum(['3m', '6m']).optional(),
  minVisits: z.coerce.number().int().min(0).max(10_000).optional(),
  maxVisits: z.coerce.number().int().min(0).max(10_000).optional(),
  /** LTV: suma de cobros pagados en día/mes/año o lifetime. */
  ltvPeriod: z.enum(['day', 'week', 'month', 'year', 'lifetime']).optional(),
});

/** Query: listado de sesiones */
export const sessionsListQuerySchema = clinicalListPaginationSchema.extend({
  patient: z.string().max(128).optional(),
  q: z.string().max(100).optional(),
  status: z.enum(['all', 'draft', 'completed']).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')
    .optional(),
});

/** Query: listado de citas */
export const appointmentsListQuerySchema = clinicalListPaginationSchema.extend({
  clinicId: z.string().max(128).optional(),
  podiatristId: z.string().max(128).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')
    .optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)')
    .optional(),
});

/** Query: exportación ICS / vista previa agenda */
export const appointmentsExportQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  podiatristId: z.string().max(128).optional(),
});

/** Query: listas de registro pendientes */
export const registrationListStatusQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
});

export const createRegistrationListSchema = z.object({
  name: z.string().min(1).max(255).transform((val) => escapeHtml(val)).optional(),
});

export const updateRegistrationListSchema = z.object({
  name: z.string().min(1).max(255).transform((val) => escapeHtml(val)).optional(),
});

export const createRegistrationEntrySchema = z.object({
  name: z.string().min(1).max(255).transform((val) => escapeHtml(val)),
  email: z
    .string()
    .min(1)
    .email('Email inválido')
    .max(255)
    .transform((val) => sanitizeEmail(val) || val),
  role: z.enum(['podiatrist', 'clinic_admin']).optional(),
  clinicId: z.string().max(128).optional(),
  clinicMode: z.string().max(64).optional(),
  podiatristLimit: z.union([z.number(), z.string()]).optional(),
  notes: z.string().max(500).optional(),
});

const parseLimit = (value: unknown, fallback: number, max: number): number => {
  if (value == null || value === '') return fallback;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 1), max);
};

/** Query: límite de filas (1–500). */
export const limitQuerySchema = z.object({
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => parseLimit(v, 100, 500)),
});

/** Query: límite ampliado (1–5000) para exportaciones. */
export const limitQuery500Schema = z.object({
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => parseLimit(v, 500, 5000)),
});

/** Query: rango temporal para métricas de seguridad. */
export const timeRangeQuerySchema = z.object({
  startTime: z.union([z.string(), z.number()]).optional(),
  endTime: z.union([z.string(), z.number()]).optional(),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => parseLimit(v, 500, 5000)),
});

/** Path/query: tipo de métrica de seguridad. */
export const securityMetricTypeSchema = z.string().min(1).max(64);

/** Query: exportación de auditoría. */
export const auditLogExportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('json'),
  from: z.string().max(64).optional(),
  to: z.string().max(64).optional(),
  userId: z.string().max(128).optional(),
  clinicId: z.string().max(128).optional(),
  action: z.string().max(128).optional(),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => parseLimit(v, 1000, 5000)),
});

/** Body: mensaje broadcast (super_admin). */
export const createMessageSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  recipientIds: z.array(z.string().max(128)).min(1),
  recipientType: z.enum(['all', 'specific', 'single']),
});

const sessionFieldsSchema = {
  patientId: z.string().min(1).max(128),
  sessionDate: z.string().min(1).max(32),
  status: z.enum(['draft', 'completed']).optional(),
  clinicalNotes: z.string().max(50000).optional(),
  anamnesis: z.string().max(50000).optional(),
  physicalExamination: z.string().max(50000).optional(),
  diagnosis: z.string().max(10000).optional(),
  treatmentPlan: z.string().max(10000).optional(),
  images: z.array(z.string()).max(20).optional(),
  completedAt: z.string().max(64).optional().nullable(),
  nextAppointmentDate: z.string().max(32).optional().nullable(),
  followUpNotes: z.string().max(5000).optional().nullable(),
  appointmentReason: z.string().max(2000).optional().nullable(),
  patientWeightKg: z.string().max(16).optional().nullable(),
  patientHeightCm: z.string().max(16).optional().nullable(),
  footType: z.enum(['egyptian', 'roman', 'greek', 'germanic', 'celtic']).optional().nullable(),
  archType: z.enum(['flat', 'normal', 'cavus']).optional().nullable(),
  sweatDisorders: z
    .array(
      z.object({
        id: z.enum(['bromhidrosis', 'hiperhidrosis', 'anhidrosis']),
        present: z.boolean().nullable().optional(),
        notes: z.string().max(200).optional(),
      })
    )
    .max(10)
    .optional(),
  limbAssessment: z
    .array(
      z.object({
        id: z.enum(['edema', 'xerosis', 'varices', 'dermatomycosis']),
        left: z.boolean().nullable().optional(),
        right: z.boolean().nullable().optional(),
        notes: z.string().max(200).optional(),
      })
    )
    .max(10)
    .optional(),
  helomas: z
    .array(
      z.object({
        id: z.enum(['interphalangeal', 'interdigital', 'dorsal_fifth']),
        present: z.boolean().nullable().optional(),
        locationLeft: z.string().max(50).optional(),
        locationRight: z.string().max(50).optional(),
        notes: z.string().max(200).optional(),
      })
    )
    .max(10)
    .optional(),
  digitalAlterations: z
    .array(
      z.object({
        id: z.enum(['hallux_valgus', 'fifth_varus', 'claw_toes']),
        present: z.boolean().nullable().optional(),
        locationLeft: z.string().max(50).optional(),
        locationRight: z.string().max(50).optional(),
      })
    )
    .max(10)
    .optional(),
  onychopathies: z
    .array(
      z.object({
        id: z.enum([
          'anoniquia',
          'microniquia',
          'onicolisis',
          'onicauxis',
          'onicocriptosis',
          'onicogriptosis',
          'onicofosis',
          'paquioniquia',
          'onicomicosis',
        ]),
        present: z.boolean().nullable().optional(),
        toesLeft: z.string().max(30).optional(),
        toesRight: z.string().max(30).optional(),
      })
    )
    .max(20)
    .optional(),
  customSections: z
    .record(
      z.string().max(64),
      z.object({
        text: z.string().max(10000).optional(),
        shortText: z.string().max(200).optional(),
        checks: z.record(z.string().max(120), z.boolean()).optional(),
        triState: z.record(z.string().max(120), z.enum(['yes', 'no', 'na']).nullable()).optional(),
        triStateNotes: z.record(z.string().max(120), z.string().max(500)).optional(),
        selected: z.string().max(120).nullable().optional(),
        number: z.number().finite().nullable().optional(),
        conditionalYes: z.boolean().nullable().optional(),
        tableRows: z.array(z.array(z.string().max(200)).max(6)).max(10).optional(),
      })
    )
    .optional(),
};

export const createSessionSchema = z.object(sessionFieldsSchema);

export const updateSessionSchema = z
  .object({
    ...sessionFieldsSchema,
    patientId: sessionFieldsSchema.patientId.optional(),
    sessionDate: sessionFieldsSchema.sessionDate.optional(),
  })
  .partial();

export const createAppointmentSchema = z.object({
  patientId: z.string().max(128).nullable().optional(),
  podiatristId: z.string().max(128).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .optional(),
  time: z.string().max(16).optional(),
  duration: z.coerce.number().int().min(5).max(480).optional(),
  notes: z.string().max(5000).optional(),
  clinicId: z.string().max(128).optional(),
  pendingPatientName: z.string().max(255).optional(),
  pendingPatientPhone: z.string().max(50).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema
  .extend({
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  })
  .partial();

/**
 * Valida parámetros de query string (Hono c.req.query()).
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  query: Record<string, string>
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  return validateData(schema, query);
}

/**
 * Valida datos usando un schema de Zod
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = Array.isArray(error.errors) ? error.errors : [];
      const firstIssue = issues[0];
      const firstMessage =
        firstIssue?.message && firstIssue.path?.length
          ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
          : firstIssue?.message || 'Error de validación';
      return {
        success: false,
        error: firstMessage,
        issues,
      };
    }
    return {
      success: false,
      error: 'Error de validación desconocido',
      issues: [],
    };
  }
}

/**
 * Middleware helper para validar requests
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = validateData(schema, body);

      if (!result.success) {
        return c.json(
          {
            error: 'Datos inválidos',
            message: result.error,
            issues: result.issues,
          },
          400
        );
      }

      // Reemplazar body con datos validados y sanitizados
      (c as Context & { req: Context['req'] & { validated: T } }).req.validated = result.data;
      return next();
    } catch {
      return c.json(
        {
          error: 'Error procesando solicitud',
          message: 'No se pudo validar los datos',
        },
        400
      );
    }
  };
}
