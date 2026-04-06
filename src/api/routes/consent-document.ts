import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import {
  clinics as clinicsTable,
  professionalInfo as professionalInfoTable,
  createdUsers as createdUsersTable,
} from '../database/schema';
import { getAssignedPodiatristUserIds, getCreatedUserByIdOrUserId } from '../utils/tenant-isolation';

const consentDocumentRoutes = new Hono();

/**
 * GET /api/consent-document
 * Obtiene el texto de términos y condiciones / consentimiento informado para el contexto actual.
 * Query: ?podiatristId=xxx (opcional, para recepcionistas)
 * - Podólogo con clínica: usa el texto de la clínica
 * - Podólogo independiente: usa su texto profesional
 */
consentDocumentRoutes.get('/', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ error: 'No autenticado' }, 401);

    const podiatristIdParam = c.req.query('podiatristId')?.trim();

    let targetUserId: string;

    if (user.role === 'receptionist' && podiatristIdParam) {
      const targetPod = await getCreatedUserByIdOrUserId(podiatristIdParam);
      if (!targetPod || targetPod.role !== 'podiatrist') {
        return c.json({ error: 'Podólogo no encontrado' }, 404);
      }
      const assigned = await getAssignedPodiatristUserIds(user.userId);
      if (!assigned.includes(targetPod.userId)) {
        return c.json({ error: 'No tienes permiso para ver el consentimiento de ese podólogo' }, 403);
      }
      targetUserId = targetPod.userId;
    } else if (user.role === 'podiatrist') {
      targetUserId = user.userId;
    } else {
      return c.json({ success: true, consentText: null, consentTextVersion: 0 });
    }

    const podRows = await database
      .select({ clinicId: createdUsersTable.clinicId })
      .from(createdUsersTable)
      .where(eq(createdUsersTable.userId, targetUserId))
      .limit(1);
    const clinicId = podRows[0]?.clinicId ?? null;

    if (clinicId) {
      const clinicRows = await database
        .select({ consentText: clinicsTable.consentText, consentTextVersion: clinicsTable.consentTextVersion })
        .from(clinicsTable)
        .where(eq(clinicsTable.clinicId, clinicId))
        .limit(1);
      const row = clinicRows[0];
      return c.json({
        success: true,
        consentText: row?.consentText ?? null,
        consentTextVersion: row?.consentTextVersion ?? 0,
      });
    }

    const infoRows = await database
      .select({ consentText: professionalInfoTable.consentText, consentTextVersion: professionalInfoTable.consentTextVersion })
      .from(professionalInfoTable)
      .where(eq(professionalInfoTable.userId, targetUserId))
      .limit(1);
    const row = infoRows[0];
    return c.json({
      success: true,
      consentText: row?.consentText ?? null,
      consentTextVersion: row?.consentTextVersion ?? 0,
    });
  } catch (err) {
    console.error('[consent-document] Error:', err);
    return c.json({ success: true, consentText: null, consentTextVersion: 0 });
  }
});

export default consentDocumentRoutes;
