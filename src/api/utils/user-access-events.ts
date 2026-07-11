import { desc, eq } from 'drizzle-orm';

import { database } from '../database';
import { createdUsers, userAccessEvents } from '../database/schema';
import type { IpQueryInfo } from './ipquery-client';
import { queryIpWithIpQuery } from './ipquery-client';
import { resolveClientIpForTrial } from './ip-trial-service';

export type UserAccessEventType = 'login_success' | 'login_failed' | 'session_refresh';

export interface RecordUserAccessParams {
  eventType: UserAccessEventType;
  ipAddress: string | null | undefined;
  userAgent?: string | null;
  userId?: string | null;
  role?: string | null;
  /** Si ya se consultó ipquery en el mismo request, reutilizar. */
  ipInfo?: IpQueryInfo | null;
}

function mapIpInfo(ip: string, ipInfo: IpQueryInfo | null) {
  if (ip === 'dev-local' || !ipInfo) {
    return {
      countryCode: ip === 'dev-local' ? 'DEV' : null,
      state: ip === 'dev-local' ? 'Local' : null,
      city: ip === 'dev-local' ? 'Desarrollo' : null,
      isp: null,
      riskScore: null,
      isVpn: false,
      ipqueryJson: ipInfo ? JSON.stringify(ipInfo) : null,
    };
  }
  return {
    countryCode: ipInfo.location?.country_code ?? null,
    state: ipInfo.location?.state ?? null,
    city: ipInfo.location?.city ?? null,
    isp: ipInfo.isp?.isp ?? ipInfo.isp?.org ?? null,
    riskScore: ipInfo.risk?.risk_score ?? null,
    isVpn: !!(ipInfo.risk?.is_vpn || ipInfo.risk?.is_proxy || ipInfo.risk?.is_tor),
    ipqueryJson: JSON.stringify(ipInfo),
  };
}

export async function resolveIpGeo(ipAddress: string | null | undefined): Promise<{
  ip: string | null;
  ipInfo: IpQueryInfo | null;
}> {
  const ip = resolveClientIpForTrial(ipAddress);
  if (!ip) return { ip: null, ipInfo: null };
  if (ip === 'dev-local') return { ip, ipInfo: null };
  const ipInfo = await queryIpWithIpQuery(ip);
  return { ip, ipInfo };
}

/** Registra acceso con geolocalización y actualiza última ubicación del usuario. */
export async function recordUserAccessEvent(params: RecordUserAccessParams): Promise<void> {
  try {
    const resolved = params.ipInfo !== undefined
      ? { ip: resolveClientIpForTrial(params.ipAddress), ipInfo: params.ipInfo }
      : await resolveIpGeo(params.ipAddress);

    const ip = resolved.ip;
    const geo = mapIpInfo(ip ?? '', resolved.ipInfo);
    const now = new Date().toISOString();
    const id = `access_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await database.insert(userAccessEvents).values({
      id,
      userId: params.userId ?? null,
      role: params.role ?? null,
      eventType: params.eventType,
      ipAddress: ip,
      countryCode: geo.countryCode,
      state: geo.state,
      city: geo.city,
      isp: geo.isp,
      riskScore: geo.riskScore,
      isVpn: geo.isVpn,
      ipqueryJson: geo.ipqueryJson,
      userAgent: params.userAgent ?? null,
      createdAt: now,
    });

    if (params.userId && params.eventType === 'login_success') {
      await database
        .update(createdUsers)
        .set({
          lastAccessCountry: geo.countryCode,
          lastAccessState: geo.state,
          lastAccessCity: geo.city,
          lastAccessAt: now,
          updatedAt: now,
        })
        .where(eq(createdUsers.userId, params.userId));
    }
  } catch (err) {
    console.error('[user-access] Error registrando evento:', err);
  }
}

export async function listRecentAccessEvents(limit = 50) {
  const rows = await database
    .select()
    .from(userAccessEvents)
    .orderBy(desc(userAccessEvents.createdAt))
    .limit(Math.min(limit, 200));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    role: r.role,
    eventType: r.eventType,
    ipAddress: r.ipAddress,
    countryCode: r.countryCode,
    state: r.state,
    city: r.city,
    isp: r.isp,
    riskScore: r.riskScore,
    isVpn: r.isVpn,
    userAgent: r.userAgent,
    createdAt: r.createdAt,
    locationLabel: [r.city, r.state, r.countryCode].filter(Boolean).join(', ') || '—',
  }));
}

export async function countUsersByState(state: string, countryCode: string): Promise<number> {
  const { normalizeGeoRegion } = await import('./geo-normalize');
  const target = normalizeGeoRegion(state);
  const country = countryCode.trim().toUpperCase();
  if (!target) return 0;

  const rows = await database
    .select({
      state: createdUsers.lastAccessState,
      country: createdUsers.lastAccessCountry,
    })
    .from(createdUsers);

  return rows.filter(
    (r) =>
      (r.country ?? '').toUpperCase() === country &&
      normalizeGeoRegion(r.state) === target
  ).length;
}
