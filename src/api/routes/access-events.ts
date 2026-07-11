import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { listRecentAccessEvents } from '../utils/user-access-events';
import {
  createAdvertiser,
  createAnnouncement,
  dismissAnnouncement,
  estimateAudience,
  getActiveAnnouncementsForUser,
  listAdvertisers,
  listAllAnnouncements,
  listAnnouncementInterests,
  recordAnnouncementInterest,
  updateAnnouncementStatus,
} from '../utils/location-announcements-service';
import { sanitizePathParam } from '../utils/sanitization';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const accessEventsRoutes = new Hono();
accessEventsRoutes.use('*', requireAuth, requireRole('super_admin'));

accessEventsRoutes.get('/recent', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10) || 50, 200);
  const events = await listRecentAccessEvents(limit);
  return c.json({ success: true, events });
});

export default accessEventsRoutes;

const announcementsRoutes = new Hono();
announcementsRoutes.use('*', requireAuth);

const advertiserSchema = z.object({
  name: z.string().min(1).max(255),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
});

const announcementSchema = z.object({
  advertiserId: z.string().min(1),
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(5000),
  targetCountry: z.string().min(2).max(3),
  targetState: z.string().min(1).max(120),
  externalUrl: z.string().url(),
  promoCode: z.string().max(64).optional(),
  ctaLabel: z.string().max(80).optional(),
  bannerImageUrl: z.string().url().optional().or(z.literal('')),
  pricePaid: z.number().optional(),
  startsAt: z.number().int(),
  endsAt: z.number().int(),
});

/** Anuncios activos para el usuario actual (todos los roles). */
announcementsRoutes.get('/active', async (c) => {
  const user = c.get('user');
  const announcements = await getActiveAnnouncementsForUser(user.userId);
  return c.json({ success: true, announcements });
});

announcementsRoutes.post('/:id/interest', async (c) => {
  const user = c.get('user');
  const id = sanitizePathParam(c.req.param('id'), 128);
  if (!id) return c.json({ error: 'ID inválido' }, 400);
  const result = await recordAnnouncementInterest(id, user.userId);
  if (!result.success) return c.json({ error: result.message }, 404);
  return c.json({ success: true, id: result.id });
});

announcementsRoutes.post('/:id/dismiss', async (c) => {
  const user = c.get('user');
  const id = sanitizePathParam(c.req.param('id'), 128);
  if (!id) return c.json({ error: 'ID inválido' }, 400);
  await dismissAnnouncement(id, user.userId);
  return c.json({ success: true });
});

// Admin (super_admin)
announcementsRoutes.use('/admin/*', requireRole('super_admin'));

announcementsRoutes.get('/admin/advertisers', async (c) => {
  const rows = await listAdvertisers();
  return c.json({ success: true, advertisers: rows });
});

announcementsRoutes.post('/admin/advertisers', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = advertiserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos', issues: parsed.error.issues }, 400);
  const row = await createAdvertiser({
    name: parsed.data.name,
    contactEmail: parsed.data.contactEmail || undefined,
    contactPhone: parsed.data.contactPhone,
    website: parsed.data.website || undefined,
    notes: parsed.data.notes,
  });
  return c.json({ success: true, advertiser: row }, 201);
});

announcementsRoutes.get('/admin/campaigns', async (c) => {
  const campaigns = await listAllAnnouncements();
  return c.json({ success: true, campaigns });
});

announcementsRoutes.post('/admin/campaigns', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos', issues: parsed.error.issues }, 400);
  const campaign = await createAnnouncement({ ...parsed.data, createdBy: user.userId });
  await logAuditEvent({
    userId: user.userId,
    action: 'CREATE_LOCATION_ANNOUNCEMENT',
    resourceType: 'announcement',
    resourceId: campaign.id,
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    details: { title: campaign.title, targetState: campaign.targetState },
  });
  return c.json({ success: true, campaign }, 201);
});

announcementsRoutes.post('/admin/campaigns/:id/status', async (c) => {
  const user = c.get('user');
  const id = sanitizePathParam(c.req.param('id'), 128);
  if (!id) return c.json({ error: 'ID inválido' }, 400);
  const body = await c.req.json().catch(() => ({}));
  const status = z.enum(['draft', 'active', 'paused', 'ended']).safeParse(body.status);
  if (!status.success) return c.json({ error: 'Estado inválido' }, 400);
  const campaign = await updateAnnouncementStatus(id, status.data);
  if (!campaign) return c.json({ error: 'Campaña no encontrada' }, 404);
  return c.json({ success: true, campaign });
});

announcementsRoutes.get('/admin/audience-estimate', async (c) => {
  const country = c.req.query('country') || 'MX';
  const state = c.req.query('state') || '';
  if (!state) return c.json({ error: 'state requerido' }, 400);
  const count = await estimateAudience(country, state);
  return c.json({ success: true, count, country, state });
});

announcementsRoutes.get('/admin/interests', async (c) => {
  const announcementId = c.req.query('announcementId');
  const interests = await listAnnouncementInterests(announcementId || undefined);
  return c.json({ success: true, interests });
});

export { announcementsRoutes };
