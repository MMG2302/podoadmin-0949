import { desc, eq, inArray } from 'drizzle-orm';

import { database } from '../database';
import {
  advertisers,
  announcementDismissals,
  announcementInterests,
  createdUsers,
  locationAnnouncements,
  notifications,
} from '../database/schema';
import { geoRegionsMatch } from './geo-normalize';
import { countUsersByState } from './user-access-events';

function nowMs() {
  return Date.now();
}

function mapAnnouncement(row: typeof locationAnnouncements.$inferSelect, advertiserName?: string) {
  return {
    id: row.id,
    advertiserId: row.advertiserId,
    advertiserName: advertiserName ?? null,
    title: row.title,
    body: row.body,
    targetCountry: row.targetCountry,
    targetState: row.targetState,
    externalUrl: row.externalUrl,
    promoCode: row.promoCode ?? null,
    ctaLabel: row.ctaLabel,
    bannerImageUrl: row.bannerImageUrl ?? null,
    pricePaid: row.pricePaid ?? null,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listAdvertisers() {
  return database.select().from(advertisers).orderBy(desc(advertisers.createdAt));
}

export async function createAdvertiser(data: {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
}) {
  const id = `adv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  await database.insert(advertisers).values({
    id,
    name: data.name,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    website: data.website ?? null,
    notes: data.notes ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await database.select().from(advertisers).where(eq(advertisers.id, id)).limit(1);
  return row!;
}

export async function listAllAnnouncements() {
  const rows = await database
    .select()
    .from(locationAnnouncements)
    .orderBy(desc(locationAnnouncements.createdAt));
  const advIds = [...new Set(rows.map((r) => r.advertiserId))];
  const advRows =
    advIds.length > 0
      ? await database.select().from(advertisers).where(inArray(advertisers.id, advIds))
      : [];
  const advMap = new Map(advRows.map((a) => [a.id, a.name]));
  return rows.map((r) => mapAnnouncement(r, advMap.get(r.advertiserId)));
}

export async function createAnnouncement(data: {
  advertiserId: string;
  title: string;
  body: string;
  targetCountry: string;
  targetState: string;
  externalUrl: string;
  promoCode?: string;
  ctaLabel?: string;
  bannerImageUrl?: string;
  pricePaid?: number;
  startsAt: number;
  endsAt: number;
  createdBy: string;
}) {
  const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  await database.insert(locationAnnouncements).values({
    id,
    advertiserId: data.advertiserId,
    title: data.title,
    body: data.body,
    targetCountry: data.targetCountry.trim().toUpperCase(),
    targetState: data.targetState.trim(),
    externalUrl: data.externalUrl,
    promoCode: data.promoCode ?? null,
    ctaLabel: data.ctaLabel?.trim() || 'Ver más',
    bannerImageUrl: data.bannerImageUrl ?? null,
    pricePaid: data.pricePaid ?? null,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    status: 'draft',
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await database.select().from(locationAnnouncements).where(eq(locationAnnouncements.id, id)).limit(1);
  return mapAnnouncement(row!);
}

export async function updateAnnouncementStatus(id: string, status: 'draft' | 'active' | 'paused' | 'ended') {
  const now = new Date().toISOString();
  await database
    .update(locationAnnouncements)
    .set({ status, updatedAt: now })
    .where(eq(locationAnnouncements.id, id));
  const [row] = await database.select().from(locationAnnouncements).where(eq(locationAnnouncements.id, id)).limit(1);
  return row ? mapAnnouncement(row) : null;
}

export async function estimateAudience(targetCountry: string, targetState: string) {
  return countUsersByState(targetState, targetCountry);
}

async function getUserGeo(userId: string) {
  const [user] = await database
    .select({
      country: createdUsers.lastAccessCountry,
      state: createdUsers.lastAccessState,
      city: createdUsers.lastAccessCity,
      name: createdUsers.name,
      email: createdUsers.email,
    })
    .from(createdUsers)
    .where(eq(createdUsers.userId, userId))
    .limit(1);
  return user ?? null;
}

export async function getActiveAnnouncementsForUser(userId: string) {
  const userGeo = await getUserGeo(userId);
  if (!userGeo?.state || !userGeo.country) return [];

  const dismissed = await database
    .select({ announcementId: announcementDismissals.announcementId })
    .from(announcementDismissals)
    .where(eq(announcementDismissals.userId, userId));
  const dismissedIds = dismissed.map((d) => d.announcementId);

  const now = nowMs();
  let rows = await database
    .select()
    .from(locationAnnouncements)
    .where(eq(locationAnnouncements.status, 'active'));

  if (dismissedIds.length > 0) {
    rows = rows.filter((r) => !dismissedIds.includes(r.id));
  }

  rows = rows.filter(
    (r) =>
      r.startsAt <= now &&
      r.endsAt >= now &&
      (r.targetCountry ?? '').toUpperCase() === (userGeo.country ?? '').toUpperCase() &&
      geoRegionsMatch(r.targetState, userGeo.state)
  );

  const advIds = [...new Set(rows.map((r) => r.advertiserId))];
  const advRows =
    advIds.length > 0
      ? await database.select().from(advertisers).where(inArray(advertisers.id, advIds))
      : [];
  const advMap = new Map(advRows.map((a) => [a.id, a.name]));

  const result = rows.map((r) => mapAnnouncement(r, advMap.get(r.advertiserId)));

  // Notificación in-app (una por anuncio activo nuevo)
  for (const ann of result) {
    await ensureAnnouncementNotification(userId, ann);
  }

  return result;
}

async function ensureAnnouncementNotification(
  userId: string,
  ann: ReturnType<typeof mapAnnouncement>
) {
  const metaKey = `location_announcement:${ann.id}`;
  try {
    const recent = await database
      .select({ metadata: notifications.metadata })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(40);
    if (recent.some((n) => n.metadata?.includes(metaKey))) return;
  } catch {
    return;
  }

  const now = new Date().toISOString();
  await database.insert(notifications).values({
    id: `notif_${crypto.randomUUID().replace(/-/g, '')}`,
    userId,
    type: 'location_announcement',
    title: `📍 ${ann.title}`,
    message: ann.body.slice(0, 280),
    read: false,
    metadata: JSON.stringify({
      kind: metaKey,
      announcementId: ann.id,
      externalUrl: ann.externalUrl,
      promoCode: ann.promoCode,
      targetState: ann.targetState,
    }),
    createdAt: now,
  });
}

export async function recordAnnouncementInterest(announcementId: string, userId: string) {
  const [ann] = await database
    .select()
    .from(locationAnnouncements)
    .where(eq(locationAnnouncements.id, announcementId))
    .limit(1);
  if (!ann) return { success: false as const, message: 'Anuncio no encontrado' };

  const userGeo = await getUserGeo(userId);
  const id = `aint_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  await database.insert(announcementInterests).values({
    id,
    announcementId,
    userId,
    userState: userGeo?.state ?? null,
    userCountry: userGeo?.country ?? null,
    userName: userGeo?.name ?? null,
    userEmail: userGeo?.email ?? null,
    status: 'interested',
    createdAt: now,
  });

  return { success: true as const, id };
}

export async function dismissAnnouncement(announcementId: string, userId: string) {
  const id = `adis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  try {
    await database.insert(announcementDismissals).values({
      id,
      announcementId,
      userId,
      dismissedAt: now,
    });
  } catch {
    // unique constraint — ya descartado
  }
  return { success: true };
}

export async function listAnnouncementInterests(announcementId?: string) {
  if (announcementId) {
    return database
      .select()
      .from(announcementInterests)
      .where(eq(announcementInterests.announcementId, announcementId))
      .orderBy(desc(announcementInterests.createdAt));
  }
  return database
    .select()
    .from(announcementInterests)
    .orderBy(desc(announcementInterests.createdAt))
    .limit(500);
}
