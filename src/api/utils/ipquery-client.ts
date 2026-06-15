/**
 * Cliente para ipquery.io — geolocalización y evaluación de riesgo de IP.
 * @see https://ipquery.io
 */

export interface IpQueryIspInfo {
  asn?: string;
  org?: string;
  isp?: string;
}

export interface IpQueryLocationInfo {
  country?: string;
  country_code?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  localtime?: string;
}

export interface IpQueryRiskInfo {
  is_mobile?: boolean;
  is_vpn?: boolean;
  is_tor?: boolean;
  is_proxy?: boolean;
  is_datacenter?: boolean;
  risk_score?: number;
}

export interface IpQueryInfo {
  ip: string;
  isp?: IpQueryIspInfo;
  location?: IpQueryLocationInfo;
  risk?: IpQueryRiskInfo;
}

const IPQUERY_BASE = process.env.IPQUERY_API_BASE || 'https://api.ipquery.io';
const IPQUERY_TIMEOUT_MS = parseInt(process.env.IPQUERY_TIMEOUT_MS || '5000', 10);

function buildIpQueryUrl(ip: string): string {
  const encoded = encodeURIComponent(ip);
  const base = IPQUERY_BASE.replace(/\/$/, '');
  const url = new URL(`${base}/${encoded}`);
  url.searchParams.set('format', 'json');
  const apiKey = process.env.IPQUERY_API_KEY?.trim();
  if (apiKey) url.searchParams.set('key', apiKey);
  return url.toString();
}

/**
 * Consulta ipquery.io para una IP concreta.
 * Devuelve null si la IP no es válida o la API no responde.
 */
export async function queryIpWithIpQuery(ip: string): Promise<IpQueryInfo | null> {
  const normalized = ip.trim();
  if (!normalized || normalized === 'unknown') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IPQUERY_TIMEOUT_MS);

  try {
    const res = await fetch(buildIpQueryUrl(normalized), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn('[ipquery] HTTP', res.status, 'for', normalized);
      return null;
    }
    const data = (await res.json()) as IpQueryInfo;
    if (!data?.ip) return null;
    return data;
  } catch (err) {
    console.warn('[ipquery] Error consultando IP:', normalized, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type IpTrialRiskBlockReason = 'vpn' | 'proxy' | 'tor' | 'datacenter' | 'high_risk_score';

export interface IpTrialRiskEvaluation {
  allowed: boolean;
  reason?: IpTrialRiskBlockReason;
  riskScore?: number;
}

/**
 * Evalúa si la IP es apta para trial según datos de ipquery.
 */
export function evaluateIpTrialRisk(info: IpQueryInfo): IpTrialRiskEvaluation {
  const risk = info.risk;
  if (!risk) {
    return { allowed: true, riskScore: 0 };
  }

  if (risk.is_tor) return { allowed: false, reason: 'tor', riskScore: risk.risk_score };
  if (risk.is_vpn) return { allowed: false, reason: 'vpn', riskScore: risk.risk_score };
  if (risk.is_proxy) return { allowed: false, reason: 'proxy', riskScore: risk.risk_score };

  if (process.env.IPQUERY_BLOCK_DATACENTER === '1' && risk.is_datacenter) {
    return { allowed: false, reason: 'datacenter', riskScore: risk.risk_score };
  }

  const maxScore = parseInt(process.env.IPQUERY_TRIAL_MAX_RISK_SCORE || '75', 10);
  const score = risk.risk_score ?? 0;
  if (score >= maxScore) {
    return { allowed: false, reason: 'high_risk_score', riskScore: score };
  }

  return { allowed: true, riskScore: score };
}
