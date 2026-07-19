import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { requireActiveSubscription } from '../middleware/subscription';
import { database } from '../database';
import { whatsappCampaigns } from '../database/schema';
import { canUseWhatsAppWeb, resolveWhatsAppWorkspaceForUser } from '../utils/whatsapp-integration';
import { sendWhatsAppTemplateMessage } from '../utils/whatsapp-meta-api';
import { normalizePhoneE164 } from '../../lib/phone-country';
import { getCountryForClinic } from '../utils/tenant-country';
import { decryptSecret } from '../utils/field-encryption';
import { userWhatsappIntegrations } from '../database/schema';
import { fetchPatientsForWhatsAppCampaign } from '../utils/campaign-patients';

const campaignsRoutes = new Hono();
campaignsRoutes.use('*', requireAuth, requireActiveSubscription);

campaignsRoutes.get('/', async (c) => {
  const user = c.get('user')!;
  if (!canUseWhatsAppWeb(user.role)) return c.json({ error: 'Acceso denegado' }, 403);
  let rows = await database.select().from(whatsappCampaigns).orderBy(desc(whatsappCampaigns.createdAt));
  if (user.clinicId) rows = rows.filter((r) => !r.clinicId || r.clinicId === user.clinicId);
  return c.json({ success: true, campaigns: rows });
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  messageBody: z.string().min(1).max(4096),
  filterJson: z.string().max(10000),
  scheduledAt: z.string().optional(),
});

campaignsRoutes.post('/', async (c) => {
  const user = c.get('user')!;
  if (!canUseWhatsAppWeb(user.role)) return c.json({ error: 'Acceso denegado' }, 403);
  const parsed = createSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  await database.insert(whatsappCampaigns).values({
    id,
    name: parsed.data.name,
    messageBody: parsed.data.messageBody,
    filterJson: parsed.data.filterJson,
    status: 'draft',
    scheduledAt: parsed.data.scheduledAt ?? null,
    sentAt: null,
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
    createdAt: iso,
    updatedAt: iso,
  });
  return c.json({ success: true, id }, 201);
});

campaignsRoutes.post('/:id/send', async (c) => {
  const user = c.get('user')!;
  if (!canUseWhatsAppWeb(user.role)) return c.json({ error: 'Acceso denegado' }, 403);

  const workspace = await resolveWhatsAppWorkspaceForUser(user);
  if (!workspace.canUseApi || !workspace.integrationOwnerUserId) {
    return c.json(
      { error: 'WhatsApp API no disponible', message: 'No tienes acceso al envío automático por API Meta.' },
      403
    );
  }

  const id = c.req.param('id');
  const campaignRows = await database.select().from(whatsappCampaigns).where(eq(whatsappCampaigns.id, id)).limit(1);
  const campaign = campaignRows[0];
  if (!campaign) return c.json({ error: 'Campaña no encontrada' }, 404);
  if (user.clinicId && campaign.clinicId && campaign.clinicId !== user.clinicId) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }

  const waRow = await database
    .select()
    .from(userWhatsappIntegrations)
    .where(eq(userWhatsappIntegrations.userId, workspace.integrationOwnerUserId))
    .limit(1)
    .then((r) => r[0]);
  if (!waRow?.enabled) return c.json({ error: 'WhatsApp no configurado' }, 400);

  const token = await decryptSecret(waRow.accessTokenEnc);
  let filter: { clinicId?: string; hasPhone?: boolean; clinicOnly?: boolean } = {};
  try {
    filter = JSON.parse(campaign.filterJson);
  } catch {
    filter = { hasPhone: true, clinicOnly: true };
  }

  const patientRows = await fetchPatientsForWhatsAppCampaign(user, filter);

  let sent = 0;
  let failed = 0;
  // Cache del país por clínica: evita una consulta D1 por paciente (N+1) en el bucle de envío.
  const countryByClinic = new Map<string, Awaited<ReturnType<typeof getCountryForClinic>>>();
  for (const p of patientRows) {
    try {
      const clinicKey = p.clinicId ?? '';
      let phoneCountry = countryByClinic.get(clinicKey);
      if (phoneCountry === undefined) {
        phoneCountry = await getCountryForClinic(p.clinicId);
        countryByClinic.set(clinicKey, phoneCountry);
      }
      const phoneE164 = normalizePhoneE164(p.phone, phoneCountry);
      if (!phoneE164) {
        failed++;
        continue;
      }
      await sendWhatsAppTemplateMessage({
        phoneNumberId: waRow.phoneNumberId,
        accessToken: token,
        toPhoneE164: phoneE164,
        templateName: waRow.templateName || 'hello_world',
        templateLanguage: waRow.templateLanguage,
        bodyParams: [p.firstName, campaign.messageBody.slice(0, 200)],
      });
      sent++;
    } catch {
      failed++;
    }
  }

  const iso = new Date().toISOString();
  await database
    .update(whatsappCampaigns)
    .set({ status: 'sent', sentAt: iso, updatedAt: iso })
    .where(eq(whatsappCampaigns.id, id));

  return c.json({ success: true, sent, failed });
});

export default campaignsRoutes;
