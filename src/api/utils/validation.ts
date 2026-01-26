import { z } from 'zod';
import { escapeHtml, sanitizeEmail, containsXssPayload } from './sanitization';

/**
 * Schemas de validación con Zod para prevenir inyección y validar datos
 */

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .refine((val) => !containsXssPayload(val), {
      message: 'Email contiene caracteres no permitidos',
    })
    .transform((val) => sanitizeEmail(val) || val), // Sanitizar email
  password: z
    .string()
    .min(1, 'Contraseña es requerida')
    .max(255, 'Contraseña demasiado larga')
    .refine((val) => !containsXssPayload(val), {
      message: 'Contraseña contiene caracteres no permitidos',
    }),
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
  role: z.enum(['super_admin', 'clinic_admin', 'admin', 'podiatrist']),
  clinicId: z.string().max(100).optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(255, 'Contraseña demasiado larga'),
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
  role: z.enum(['super_admin', 'clinic_admin', 'admin', 'podiatrist']).optional(),
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
    .string()
    .max(50, 'Número de identificación demasiado largo')
    .transform((val) => escapeHtml(val)),
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
  medicalHistory: z.object({
    allergies: z.array(z.string().transform((val) => escapeHtml(val))).optional(),
    medications: z.array(z.string().transform((val) => escapeHtml(val))).optional(),
    conditions: z.array(z.string().transform((val) => escapeHtml(val))).optional(),
  }).optional(),
  consent: z.object({
    given: z.boolean(),
    date: z.string().nullable().optional(),
  }).optional(),
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
      return {
        success: false,
        error: error.errors[0]?.message || 'Error de validación',
        issues: error.errors,
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
  return async (c: any, next: () => Promise<void>) => {
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
      c.req.validated = result.data;
      return next();
    } catch (error) {
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
