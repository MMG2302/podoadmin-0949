import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { requireActiveSubscription } from '../middleware/subscription';
import { database } from '../database';
import {
  sessionTemplates,
  patientReferrals,
  inventoryItems,
  sessionInventoryUsage,
  appointmentWaitlist,
  appointments,
  patients,
  clinicalSessions,
  sessionChecklists,
  clinicalEvolutionNotes,
  clinics,
} from '../database/schema';
import { DEFAULT_SESSION_CHECKLIST, type ChecklistItem } from '../utils/session-checklist-defaults';
import { sanitizePathParam } from '../utils/sanitization';
import { mapDbSession } from '../utils/clinical-maps';

const clinicalRoutes = new Hono();
clinicalRoutes.use('*', requireAuth, requireActiveSubscription);

// --- Plantillas ---
clinicalRoutes.get('/templates', requirePermission('manage_sessions', 'view_sessions'), async (c) => {
  const user = c.get('user')!;
  let rows = await database.select().from(sessionTemplates).orderBy(desc(sessionTemplates.updatedAt));
  if (user.role === 'podiatrist') {
    rows = rows.filter((r) => r.createdBy === user.userId || r.isShared);
  } else if (user.clinicId) {
    rows = rows.filter((r) => !r.clinicId || r.clinicId === user.clinicId);
  }
  return c.json({
    success: true,
    templates: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      fields: JSON.parse(r.fieldsJson),
      isShared: r.isShared,
      createdBy: r.createdBy,
    })),
  });
});

clinicalRoutes.post('/templates', requirePermission('manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const schema = z.object({
    name: z.string().min(1).max(120),
    category: z.string().max(64).optional(),
    fields: z.record(z.string(), z.unknown()),
    isShared: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  await database.insert(sessionTemplates).values({
    id,
    name: parsed.data.name,
    category: parsed.data.category ?? 'general',
    fieldsJson: JSON.stringify(parsed.data.fields),
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
    isShared: parsed.data.isShared ?? false,
    createdAt: iso,
    updatedAt: iso,
  });
  return c.json({ success: true, id }, 201);
});

clinicalRoutes.delete('/templates/:id', requirePermission('manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const id = sanitizePathParam(c.req.param('id'));
  const rows = await database.select().from(sessionTemplates).where(eq(sessionTemplates.id, id)).limit(1);
  const template = rows[0];
  if (!template) return c.json({ error: 'Plantilla no encontrada' }, 404);

  if (!canModifySessionTemplate(user, template)) {
    return c.json(
      { error: 'forbidden', message: 'No puedes eliminar esta plantilla.' },
      403
    );
  }

  await database.delete(sessionTemplates).where(eq(sessionTemplates.id, id));
  return c.json({ success: true });
});

function canModifySessionTemplate(
  user: { userId: string; role: string; clinicId?: string | null },
  template: typeof sessionTemplates.$inferSelect
): boolean {
  return (
    user.role === 'super_admin' ||
    template.createdBy === user.userId ||
    (user.role === 'clinic_admin' && !!user.clinicId && template.clinicId === user.clinicId)
  );
}

const templateFieldsSchema = z.object({
  anamnesis: z.string().max(10000).optional(),
  physicalExamination: z.string().max(10000).optional(),
  diagnosis: z.string().max(5000).optional(),
  treatmentPlan: z.string().max(10000).optional(),
});

clinicalRoutes.patch('/templates/:id', requirePermission('manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const id = sanitizePathParam(c.req.param('id'));
  const rows = await database.select().from(sessionTemplates).where(eq(sessionTemplates.id, id)).limit(1);
  const template = rows[0];
  if (!template) return c.json({ error: 'Plantilla no encontrada' }, 404);
  if (!canModifySessionTemplate(user, template)) {
    return c.json({ error: 'forbidden', message: 'No puedes editar esta plantilla.' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const schema = z.object({
    name: z.string().min(1).max(120).optional(),
    category: z.string().max(64).optional(),
    fields: templateFieldsSchema.optional(),
    isShared: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);

  const iso = new Date().toISOString();
  const updates: Partial<typeof sessionTemplates.$inferInsert> = { updatedAt: iso };
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.category != null) updates.category = parsed.data.category;
  if (parsed.data.isShared != null) updates.isShared = parsed.data.isShared;
  if (parsed.data.fields != null) {
    const current = JSON.parse(template.fieldsJson) as Record<string, unknown>;
    updates.fieldsJson = JSON.stringify({ ...current, ...parsed.data.fields });
  }

  await database.update(sessionTemplates).set(updates).where(eq(sessionTemplates.id, id));
  return c.json({ success: true });
});

// --- Derivaciones ---
clinicalRoutes.get('/referrals', requirePermission('view_patients'), async (c) => {
  const patientId = c.req.query('patientId');
  let rows = await database.select().from(patientReferrals).orderBy(desc(patientReferrals.createdAt));
  if (patientId) rows = rows.filter((r) => r.patientId === sanitizePathParam(patientId));
  return c.json({ success: true, referrals: rows });
});

clinicalRoutes.post('/referrals', requirePermission('manage_patients', 'manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const schema = z.object({
    patientId: z.string().uuid(),
    referredTo: z.string().min(1).max(200),
    reason: z.string().min(1).max(2000),
    notes: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  await database.insert(patientReferrals).values({
    id,
    ...parsed.data,
    status: 'pending',
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
    createdAt: iso,
    updatedAt: iso,
  });
  return c.json({ success: true, id }, 201);
});

// --- Alertas clínicas en paciente ---
clinicalRoutes.patch('/patients/:patientId/alerts', requirePermission('manage_patients'), async (c) => {
  const patientId = sanitizePathParam(c.req.param('patientId'));
  const schema = z.object({ alerts: z.array(z.object({ type: z.string(), message: z.string(), severity: z.enum(['low', 'medium', 'high']) })) });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  await database.update(patients).set({ clinicalAlertsJson: JSON.stringify(parsed.data.alerts) }).where(eq(patients.id, patientId));
  return c.json({ success: true });
});

// --- Inventario ---
clinicalRoutes.get('/inventory', requirePermission('manage_sessions', 'view_sessions'), async (c) => {
  const user = c.get('user')!;
  let rows = await database.select().from(inventoryItems);
  if (user.clinicId) rows = rows.filter((r) => !r.clinicId || r.clinicId === user.clinicId);
  return c.json({ success: true, items: rows });
});

clinicalRoutes.post('/inventory', requirePermission('manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const schema = z.object({ name: z.string().min(1).max(120), unit: z.string().max(32).optional() });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  await database.insert(inventoryItems).values({
    id,
    name: parsed.data.name,
    unit: parsed.data.unit ?? 'unidad',
    clinicId: user.clinicId ?? null,
    createdBy: user.userId,
    createdAt: new Date().toISOString(),
  });
  return c.json({ success: true, id }, 201);
});

clinicalRoutes.post('/sessions/:sessionId/inventory-usage', requirePermission('manage_sessions'), async (c) => {
  const sessionId = sanitizePathParam(c.req.param('sessionId'));
  const schema = z.object({ itemId: z.string().uuid(), quantity: z.number().positive().max(9999) });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  await database.insert(sessionInventoryUsage).values({
    id,
    sessionId,
    itemId: parsed.data.itemId,
    quantity: parsed.data.quantity,
    createdAt: new Date().toISOString(),
  });
  return c.json({ success: true, id }, 201);
});

// --- Lista de espera ---
clinicalRoutes.get('/waitlist', requirePermission('manage_appointments'), async (c) => {
  const rows = await database.select().from(appointmentWaitlist).orderBy(desc(appointmentWaitlist.createdAt));
  return c.json({ success: true, waitlist: rows });
});

clinicalRoutes.post('/waitlist', requirePermission('manage_appointments'), async (c) => {
  const user = c.get('user')!;
  const schema = z.object({
    patientId: z.string().uuid().optional(),
    pendingPatientName: z.string().max(200).optional(),
    pendingPatientPhone: z.string().max(32).optional(),
    podiatristId: z.string().min(1),
    preferredDate: z.string().optional(),
    reason: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  await database.insert(appointmentWaitlist).values({
    id,
    patientId: parsed.data.patientId ?? null,
    pendingPatientName: parsed.data.pendingPatientName ?? null,
    pendingPatientPhone: parsed.data.pendingPatientPhone ?? null,
    podiatristId: parsed.data.podiatristId,
    preferredDate: parsed.data.preferredDate ?? null,
    reason: parsed.data.reason ?? null,
    status: 'waiting',
    clinicId: user.clinicId ?? null,
    createdBy: user.userId,
    createdAt: iso,
    updatedAt: iso,
  });
  return c.json({ success: true, id }, 201);
});

// --- Check-in cita ---
clinicalRoutes.patch('/appointments/:id/check-in', requirePermission('manage_appointments'), async (c) => {
  const id = sanitizePathParam(c.req.param('id'));
  const schema = z.object({ checkInStatus: z.enum(['none', 'waiting', 'in_room', 'seen']) });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  await database.update(appointments).set({ checkInStatus: parsed.data.checkInStatus, updatedAt: new Date().toISOString() }).where(eq(appointments.id, id));
  return c.json({ success: true });
});

// --- Métricas agenda ---
clinicalRoutes.get('/appointments/metrics', requirePermission('manage_appointments', 'view_clinic_stats'), async (c) => {
  const rows = await database.select().from(appointments);
  const scheduled = rows.filter((a) => a.status === 'scheduled').length;
  const noShow = rows.filter((a) => a.status === 'no_show').length;
  const completed = rows.filter((a) => a.status === 'completed').length;
  const cancelled = rows.filter((a) => a.status === 'cancelled').length;
  const total = rows.length || 1;
  return c.json({
    success: true,
    metrics: {
      scheduled,
      noShow,
      completed,
      cancelled,
      noShowRate: Math.round((noShow / total) * 100),
      completionRate: Math.round((completed / total) * 100),
    },
  });
});

// --- Checklist sesión ---
clinicalRoutes.get('/sessions/:sessionId/checklist', requirePermission('manage_sessions', 'view_sessions'), async (c) => {
  const sessionId = sanitizePathParam(c.req.param('sessionId'));
  const rows = await database
    .select()
    .from(sessionChecklists)
    .where(eq(sessionChecklists.sessionId, sessionId))
    .limit(1);
  if (!rows[0]) {
    return c.json({ success: true, items: DEFAULT_SESSION_CHECKLIST, completedAt: null });
  }
  return c.json({
    success: true,
    items: JSON.parse(rows[0].itemsJson) as ChecklistItem[],
    completedAt: rows[0].completedAt,
  });
});

clinicalRoutes.put('/sessions/:sessionId/checklist', requirePermission('manage_sessions'), async (c) => {
  const sessionId = sanitizePathParam(c.req.param('sessionId'));
  const schema = z.object({
    items: z.array(
      z.object({
        id: z.string().min(1).max(64),
        label: z.string().min(1).max(200),
        done: z.boolean(),
      })
    ),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const allDone = parsed.data.items.length > 0 && parsed.data.items.every((i) => i.done);
  const iso = new Date().toISOString();
  const existing = await database
    .select()
    .from(sessionChecklists)
    .where(eq(sessionChecklists.sessionId, sessionId))
    .limit(1);
  if (!existing[0]) {
    await database.insert(sessionChecklists).values({
      sessionId,
      itemsJson: JSON.stringify(parsed.data.items),
      completedAt: allDone ? iso : null,
      updatedAt: iso,
    });
  } else {
    await database
      .update(sessionChecklists)
      .set({
        itemsJson: JSON.stringify(parsed.data.items),
        completedAt: allDone ? iso : null,
        updatedAt: iso,
      })
      .where(eq(sessionChecklists.sessionId, sessionId));
  }
  return c.json({ success: true, completedAt: allDone ? iso : null });
});

// --- Notas de evolución (NOM-004) ---
clinicalRoutes.get('/patients/:patientId/evolution-notes', requirePermission('view_sessions', 'view_patients'), async (c) => {
  const patientId = sanitizePathParam(c.req.param('patientId'));
  const rows = await database
    .select()
    .from(clinicalEvolutionNotes)
    .where(eq(clinicalEvolutionNotes.patientId, patientId))
    .orderBy(desc(clinicalEvolutionNotes.entryDate));
  return c.json({ success: true, notes: rows });
});

clinicalRoutes.post('/patients/:patientId/evolution-notes', requirePermission('manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const patientId = sanitizePathParam(c.req.param('patientId'));
  const schema = z.object({
    entryDate: z.string().min(1),
    note: z.string().min(1).max(10000),
    sessionId: z.string().uuid().optional(),
    professionalName: z.string().min(1).max(200),
    professionalLicense: z.string().max(100).optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);

  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  await database.insert(clinicalEvolutionNotes).values({
    id,
    patientId,
    sessionId: parsed.data.sessionId ?? null,
    entryDate: parsed.data.entryDate,
    note: parsed.data.note,
    professionalName: parsed.data.professionalName,
    professionalLicense: parsed.data.professionalLicense ?? null,
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
    createdAt: iso,
  });
  return c.json({ success: true, id }, 201);
});

// --- Informe evolución (HTML imprimible) ---
clinicalRoutes.get('/patients/:patientId/evolution-report', requirePermission('view_sessions', 'view_patients'), async (c) => {
  const patientId = sanitizePathParam(c.req.param('patientId'));
  const patientRows = await database.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  const patient = patientRows[0];
  if (!patient) return c.json({ error: 'Paciente no encontrado' }, 404);

  const sessionRows = await database
    .select()
    .from(clinicalSessions)
    .where(eq(clinicalSessions.patientId, patientId))
    .orderBy(desc(clinicalSessions.sessionDate));
  const sessions = sessionRows.map(mapDbSession);

  const evolutionRows = await database
    .select()
    .from(clinicalEvolutionNotes)
    .where(eq(clinicalEvolutionNotes.patientId, patientId))
    .orderBy(desc(clinicalEvolutionNotes.entryDate));

  let clinicHeader = '';
  if (patient.clinicId) {
    const clinicRows = await database.select().from(clinics).where(eq(clinics.clinicId, patient.clinicId)).limit(1);
    const clinic = clinicRows[0];
    if (clinic) {
      clinicHeader = `<p><strong>Establecimiento:</strong> ${clinic.legalName || clinic.clinicName}</p>
        ${clinic.rfc ? `<p><strong>RFC:</strong> ${clinic.rfc}</p>` : ''}
        ${clinic.clues ? `<p><strong>CLUES:</strong> ${clinic.clues}</p>` : ''}
        ${clinic.licenseNumber ? `<p><strong>Reg. Sanitario:</strong> ${clinic.licenseNumber}</p>` : ''}`;
    }
  }

  const sessionLines = sessions.map((s) => {
    const parts = [
      s.diagnosis ? `Dx: ${s.diagnosis}` : '',
      s.treatmentPlan ? `Plan: ${s.treatmentPlan}` : '',
      s.clinicalNotes ? `Notas: ${s.clinicalNotes}` : '',
      s.followUpNotes ? `Evolución: ${s.followUpNotes}` : '',
    ].filter(Boolean);
    return `<tr><td>${s.sessionDate}</td><td>${s.status}</td><td>${parts.join('<br/>') || '—'}</td></tr>`;
  });

  const evolutionLines = evolutionRows.map(
    (n) =>
      `<tr><td>${n.entryDate}</td><td>${n.professionalName}${n.professionalLicense ? ` (${n.professionalLicense})` : ''}</td><td>${n.note}</td></tr>`
  );

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Evolución — ${patient.firstName} ${patient.lastName}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:1.25rem}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}</style></head>
<body><h1>Informe de evolución clínica (NOM-004)</h1>
<p><strong>Paciente:</strong> ${patient.firstName} ${patient.lastName} · Folio: ${patient.folio}</p>
${patient.curp ? `<p><strong>CURP:</strong> ${patient.curp}</p>` : ''}
<p><strong>ID:</strong> ${patient.idNumber}</p>
${clinicHeader}
<p><strong>Generado:</strong> ${new Date().toISOString()}</p>
<h2>Sesiones clínicas</h2>
<table><thead><tr><th>Fecha</th><th>Estado</th><th>Resumen</th></tr></thead><tbody>${sessionLines.join('')}</tbody></table>
<h2>Notas de evolución firmadas</h2>
<table><thead><tr><th>Fecha</th><th>Profesional</th><th>Nota</th></tr></thead><tbody>${evolutionLines.join('') || '<tr><td colspan="3">—</td></tr>'}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;

  return c.json({
    success: true,
    patientName: `${patient.firstName} ${patient.lastName}`,
    sessionCount: sessions.length,
    evolutionNoteCount: evolutionRows.length,
    html,
  });
});

export default clinicalRoutes;
