/**
 * Borrado en cascada de un usuario y todos sus datos asociados.
 * Usado por el cron de retención (tras 8 meses deshabilitado) y por DELETE manual.
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

export async function deleteUserCascade(userId: string, userRecordId: string): Promise<{ deleted: boolean; error?: string }> {
  try {
    // 1. Soporte: mensajes de conversaciones del usuario
    const convos = await database
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.userId, userRecordId));
    const convoIds = convos.map((c) => c.id);
    if (convoIds.length > 0) {
      for (const cid of convoIds) {
        await database.delete(supportMessages).where(eq(supportMessages.conversationId, cid));
      }
      await database.delete(supportConversations).where(eq(supportConversations.userId, userRecordId));
    }

    // 2. Tokens y 2FA
    await database.delete(passwordResetRequests).where(eq(passwordResetRequests.userId, userRecordId));
    await database.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userRecordId));
    await database.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userRecordId));
    await database.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userRecordId));

    // 3. Datos profesionales
    await database.delete(professionalLogos).where(eq(professionalLogos.userId, userId));
    await database.delete(professionalCredentials).where(eq(professionalCredentials.userId, userId));
    await database.delete(professionalLicenses).where(eq(professionalLicenses.userId, userId));
    await database.delete(professionalInfo).where(eq(professionalInfo.userId, userId));

    // 4. Notificaciones, créditos, transacciones
    await database.delete(notifications).where(eq(notifications.userId, userId));
    await database.delete(creditTransactions).where(eq(creditTransactions.userId, userRecordId));
    await database.delete(clinicCreditDistributions).where(eq(clinicCreditDistributions.userId, userRecordId));
    await database.delete(userCredits).where(eq(userCredits.userId, userId));
    await database.delete(tokenBlacklist).where(eq(tokenBlacklist.userId, userId));

    // 5. Pacientes del usuario y sus sesiones/citas
    const userPatients = await database
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.createdBy, userId));
    const patientIds = userPatients.map((p) => p.id);

    if (patientIds.length > 0) {
      await database.delete(appointments).where(inArray(appointments.patientId, patientIds));
      await database.delete(clinicalSessions).where(inArray(clinicalSessions.patientId, patientIds));
      await database.delete(patients).where(eq(patients.createdBy, userId));
    }

    // Citas y sesiones creadas por el usuario (sin paciente o con paciente de otro)
    await database.delete(appointments).where(eq(appointments.createdBy, userId));
    await database.delete(clinicalSessions).where(eq(clinicalSessions.createdBy, userId));

    // 6. Audit log y métricas
    await database.delete(auditLog).where(eq(auditLog.userId, userId));
    await database.delete(securityMetrics).where(eq(securityMetrics.userId, userId));

    // 7. Mensajes enviados por el usuario (sender_id)
    await database.delete(sentMessages).where(eq(sentMessages.senderId, userId));

    // 8. Usuario
    await database.delete(createdUsers).where(eq(createdUsers.id, userRecordId));

    return { deleted: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error en deleteUserCascade:', msg);
    return { deleted: false, error: msg };
  }
}
