import { z } from 'zod';

/**
 * Acciones de auditoría que el cliente puede registrar explícitamente.
 * Cualquier acción crítica (login, CRUD, etc.) debe registrarse solo en el servidor.
 */
export const CLIENT_AUDIT_ACTIONS = ['PRINT_VIOLATION_FORM'] as const;

export type ClientAuditAction = (typeof CLIENT_AUDIT_ACTIONS)[number];

const CLIENT_AUDIT_RESOURCE_TYPES: Record<ClientAuditAction, readonly string[]> = {
  PRINT_VIOLATION_FORM: ['session'],
};

const printViolationDetailsSchema = z
  .object({
    sessionId: z.string().max(128).optional(),
    patientId: z.string().max(128).nullable().optional(),
    podiatristId: z.string().max(128).optional(),
    podiatristName: z.string().max(255).optional(),
    timestamp: z.string().max(64).optional(),
    message: z.string().max(2000).optional(),
    violationType: z.string().max(64).optional(),
  })
  .strict();

export const clientAuditBodySchema = z.object({
  action: z.enum(CLIENT_AUDIT_ACTIONS),
  resourceType: z.string().min(1).max(64),
  resourceId: z.string().max(128).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  clinicId: z.string().max(64).optional(),
});

export type ClientAuditBody = z.infer<typeof clientAuditBodySchema>;

export function validateClientAuditBody(
  raw: unknown
): { success: true; data: ClientAuditBody } | { success: false; message: string; issues?: unknown } {
  const parsed = clientAuditBodySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Cuerpo de auditoría inválido',
      issues: parsed.error.flatten(),
    };
  }

  const { action, resourceType, details } = parsed.data;
  const allowedTypes = CLIENT_AUDIT_RESOURCE_TYPES[action];
  if (!allowedTypes.includes(resourceType)) {
    return {
      success: false,
      message: `resourceType "${resourceType}" no permitido para la acción ${action}`,
    };
  }

  if (action === 'PRINT_VIOLATION_FORM') {
    const detailCheck = printViolationDetailsSchema.safeParse(details ?? {});
    if (!detailCheck.success) {
      return {
        success: false,
        message: 'Detalles de violación de impresión inválidos',
        issues: detailCheck.error.flatten(),
      };
    }
    parsed.data.details = detailCheck.data;
  }

  return { success: true, data: parsed.data };
}

/** El userId del log siempre es el del JWT; ignora suplantación en details */
export function sanitizeClientAuditForUser(
  data: ClientAuditBody,
  authenticatedUserId: string,
  authenticatedClinicId?: string | null
): {
  action: ClientAuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  clinicId?: string;
} {
  const details = { ...(data.details ?? {}) };
  details.reportedByUserId = authenticatedUserId;

  return {
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    details,
    clinicId: authenticatedClinicId ?? undefined,
  };
}
