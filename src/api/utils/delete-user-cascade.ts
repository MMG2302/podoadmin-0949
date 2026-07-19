/**
 * Borrado en cascada de un usuario y todos sus datos asociados.
 * Usado por el cron de retención (tras 8 meses deshabilitado) y por DELETE manual.
 *
 * Orden del flujo (robustez):
 * 1. Lecturas y comprobaciones de protección PRIMERO (fail-fast sin tocar datos).
 * 2. Todas las escrituras DB en un único `database.batch(...)` atómico (D1):
 *    o se borra todo o no se borra nada — sin estados parciales.
 * 3. Purga de media en R2 al final (best-effort): si falla, quedan objetos
 *    huérfanos en storage (inofensivo) en lugar de filas colgantes en DB.
 */
import { database } from '../database';
import {
  createdUsers,
  supportMessages,
  supportConversations,
  passwordResetRequests,
  passwordResetTokens,
  emailVerificationTokens,
  twoFactorAuth,
  professionalLogos,
  professionalCredentials,
  professionalLicenses,
  professionalInfo,
  notifications,
  creditTransactions,
  clinicCreditDistributions,
  userCredits,
  tokenBlacklist,
  appointments,
  clinicalSessions,
  patients,
  auditLog,
  securityMetrics,
  sentMessages,
} from '../database/schema';
import { eq, inArray } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { purgePatientMediaR2, purgeLogoR2 } from './r2-purge';
import { getR2Bucket } from './r2-media';

/** D1 limita ~100 parámetros bound por sentencia: trocear listas para inArray. */
const IN_CHUNK = 90;

export function chunkIds(ids: string[], size: number = IN_CHUNK): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

export async function deleteUserCascade(userId: string, userRecordId: string): Promise<{ deleted: boolean; error?: string }> {
  try {
    // ===== FASE 1: lecturas y validaciones (sin escrituras) =====
    const userRow = await database.select({ role: createdUsers.role, clinicId: createdUsers.clinicId }).from(createdUsers).where(eq(createdUsers.id, userRecordId)).limit(1);

    const convos = await database
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.userId, userRecordId));
    const convoIds = convos.map((c) => c.id);

    const logoRows = await database
      .select({ logo: professionalLogos.logo })
      .from(professionalLogos)
      .where(eq(professionalLogos.userId, userId))
      .limit(1);
    const storedLogo = logoRows[0]?.logo;

    const userPatients = await database
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.createdBy, userId));
    const patientIds = userPatients.map((p) => p.id);

    // Pacientes protegidos (retención clínica): abortar ANTES de borrar nada.
    const sessionIdsByPatient = new Map<string, string[]>();
    if (patientIds.length > 0) {
      const { isPatientProtectedFromDeletion } = await import('./clinical-retention-purge');
      for (const pid of patientIds) {
        const blockReason = await isPatientProtectedFromDeletion(pid);
        if (blockReason) {
          return { deleted: false, error: blockReason };
        }
        const sessionsForPatient = await database
          .select({ id: clinicalSessions.id })
          .from(clinicalSessions)
          .where(eq(clinicalSessions.patientId, pid));
        sessionIdsByPatient.set(pid, sessionsForPatient.map((s) => s.id));
      }
    }

    // ===== FASE 2: todas las escrituras DB en un batch atómico =====
    type Stmt = BatchItem<'sqlite'>;
    const statements: Stmt[] = [];

    // Si es clinic_admin: bloquear cuentas de podólogos y recepcionistas de su clínica
    if (userRow[0]?.role === 'clinic_admin' && userRow[0]?.clinicId) {
      statements.push(
        database.update(createdUsers).set({
          isBlocked: true,
          isEnabled: false,
          disabledAt: Date.now(),
          updatedAt: new Date().toISOString(),
        } as any).where(eq(createdUsers.clinicId, userRow[0].clinicId))
      );
    }

    // Soporte
    if (convoIds.length > 0) {
      for (const chunk of chunkIds(convoIds)) {
        statements.push(database.delete(supportMessages).where(inArray(supportMessages.conversationId, chunk)));
      }
      statements.push(database.delete(supportConversations).where(eq(supportConversations.userId, userRecordId)));
    }

    // Tokens y 2FA
    statements.push(database.delete(passwordResetRequests).where(eq(passwordResetRequests.userId, userRecordId)));
    statements.push(database.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userRecordId)));
    statements.push(database.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userRecordId)));
    statements.push(database.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userRecordId)));

    // Datos profesionales
    statements.push(database.delete(professionalLogos).where(eq(professionalLogos.userId, userId)));
    statements.push(database.delete(professionalCredentials).where(eq(professionalCredentials.userId, userId)));
    statements.push(database.delete(professionalLicenses).where(eq(professionalLicenses.userId, userId)));
    statements.push(database.delete(professionalInfo).where(eq(professionalInfo.userId, userId)));

    // Notificaciones, créditos, transacciones
    statements.push(database.delete(notifications).where(eq(notifications.userId, userId)));
    statements.push(database.delete(creditTransactions).where(eq(creditTransactions.userId, userRecordId)));
    statements.push(database.delete(clinicCreditDistributions).where(eq(clinicCreditDistributions.userId, userRecordId)));
    statements.push(database.delete(userCredits).where(eq(userCredits.userId, userId)));
    statements.push(database.delete(tokenBlacklist).where(eq(tokenBlacklist.userId, userId)));

    // Pacientes del usuario y sus sesiones/citas
    if (patientIds.length > 0) {
      for (const chunk of chunkIds(patientIds)) {
        statements.push(database.delete(appointments).where(inArray(appointments.patientId, chunk)));
        statements.push(database.delete(clinicalSessions).where(inArray(clinicalSessions.patientId, chunk)));
      }
      statements.push(database.delete(patients).where(eq(patients.createdBy, userId)));
    }

    // Citas y sesiones creadas por el usuario (sin paciente o con paciente de otro)
    statements.push(database.delete(appointments).where(eq(appointments.createdBy, userId)));
    statements.push(database.delete(clinicalSessions).where(eq(clinicalSessions.createdBy, userId)));

    // Audit log y métricas
    statements.push(database.delete(auditLog).where(eq(auditLog.userId, userId)));
    statements.push(database.delete(securityMetrics).where(eq(securityMetrics.userId, userId)));

    // Mensajes enviados por el usuario (sender_id)
    statements.push(database.delete(sentMessages).where(eq(sentMessages.senderId, userId)));

    // Usuario
    statements.push(database.delete(createdUsers).where(eq(createdUsers.id, userRecordId)));

    await database.batch(statements as [Stmt, ...Stmt[]]);

    // ===== FASE 3: purga de media en R2 (best-effort, tras confirmar DB) =====
    const bucket = getR2Bucket();
    await purgeLogoR2(storedLogo, bucket);
    for (const [pid, sessionIds] of sessionIdsByPatient) {
      await purgePatientMediaR2(pid, sessionIds, bucket);
    }

    return { deleted: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error en deleteUserCascade:', msg);
    return { deleted: false, error: msg };
  }
}
