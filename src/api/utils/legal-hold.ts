import { and, eq } from 'drizzle-orm';
import { database } from '../database';
import { legalHolds, patients } from '../database/schema';
import { logAuditEvent } from './audit-log';

export async function hasActiveLegalHold(resourceType: string, resourceId: string): Promise<boolean> {
  const holds = await database
    .select({ id: legalHolds.id })
    .from(legalHolds)
    .where(
      and(
        eq(legalHolds.resourceType, resourceType),
        eq(legalHolds.resourceId, resourceId),
        eq(legalHolds.active, true)
      )
    )
    .limit(1);
  if (holds.length > 0) return true;

  if (resourceType === 'patient') {
    const rows = await database
      .select({ legalHold: patients.legalHold })
      .from(patients)
      .where(eq(patients.id, resourceId))
      .limit(1);
    return rows[0]?.legalHold === true;
  }

  return false;
}

export async function applyLegalHoldToPatient(patientId: string, active: boolean): Promise<void> {
  await database
    .update(patients)
    .set({ legalHold: active, updatedAt: new Date().toISOString() })
    .where(eq(patients.id, patientId));
}

export async function releaseLegalHold(holdId: string, releasedBy: string): Promise<boolean> {
  const rows = await database
    .select()
    .from(legalHolds)
    .where(eq(legalHolds.id, holdId))
    .limit(1);
  const hold = rows[0];
  if (!hold || !hold.active) return false;

  await database
    .update(legalHolds)
    .set({ active: false })
    .where(eq(legalHolds.id, holdId));

  if (hold.resourceType === 'patient') {
    const stillHeld = await hasActiveLegalHold('patient', hold.resourceId);
    if (!stillHeld) {
      await applyLegalHoldToPatient(hold.resourceId, false);
    }
  }

  await logAuditEvent({
    userId: releasedBy,
    action: 'LEGAL_HOLD_RELEASED',
    resourceType: hold.resourceType,
    resourceId: hold.resourceId,
    details: { holdId, reason: hold.reason },
  });

  return true;
}
