/**
 * Smoke test de funcionalidades por rol.
 *
 * Recorre, para cada rol (super_admin, admin, clinic_admin, podiatrist, receptionist),
 * los endpoints que consume su UI y verifica:
 *   - allow : el rol debe poder usarlo   -> se espera 2xx
 *   - deny  : el rol NO debe poder usarlo -> se espera 401/403 (un 2xx es fuga de permisos)
 *   - any   : solo se vigila que no reviente (5xx)
 *
 * SEGURIDAD DE DATOS: solo hace lecturas y escrituras inocuas. Toda comprobación marcada
 * `destructive: true` apunta a ids inexistentes y se ejecuta ÚNICAMENTE con roles que deben
 * ser rechazados (lista `deny`); si el rol en curso sí podría ejecutarla, la comprobación se
 * omite. Así el sweep nunca altera los datos de demo del D1 local.
 *
 * Uso:
 *   node node_modules/wrangler/bin/wrangler.js dev --port 8787 --local
 *   node scripts/e2e-roles-smoke.mjs
 *   node scripts/e2e-roles-smoke.mjs --base http://localhost:5173/api --role podiatrist
 */

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = argValue('--base', 'http://localhost:8787/api').replace(/\/$/, '');
const ONLY_ROLE = argValue('--role', null);
const THROTTLE_MS = Number(argValue('--throttle', '160')); // burst global = 80 req/10s por IP
const VERBOSE = args.includes('--verbose');

const ACCOUNTS = [
  { role: 'super_admin', label: 'Super Admin', email: 'admin@podoadmin.com', password: 'admin123' },
  { role: 'admin', label: 'Admin soporte', email: 'support@podoadmin.com', password: 'support123' },
  { role: 'clinic_admin', label: 'Admin clínica (Premium)', email: 'maria.fernandez@premium.com', password: 'manager123' },
  { role: 'podiatrist', label: 'Podólogo clínica (Premium)', email: 'doctor1@premium.com', password: 'doctor123' },
  { role: 'podiatrist_base', label: 'Podólogo independiente (Base)', email: 'pablo.hernandez@gmail.com', password: 'doctor123' },
  { role: 'receptionist', label: 'Recepcionista', email: 'recepcion@premium.com', password: 'podo123' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
  constructor(account) {
    this.account = account;
    this.jar = new Map();
    this.csrf = null;
    this.user = null;
  }

  cookieHeader() {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  store(res) {
    const cookies = res.headers.getSetCookie?.() ?? [];
    for (const c of cookies) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) this.jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
    }
  }

  async call(method, path, body) {
    const headers = { Cookie: this.cookieHeader() };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.csrf) headers['X-CSRF-Token'] = this.csrf;

    let res, text;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
      });
      text = await res.text();
      if (res.status !== 429) break;
      const retry = Number(res.headers.get('Retry-After') || 3);
      await sleep(Math.min(retry, 10) * 1000);
    }
    this.store(res);
    await sleep(THROTTLE_MS);
    return { status: res.status, text, json: safeJson(text) };
  }

  async bootstrap() {
    const tokenRes = await this.call('GET', '/csrf/token');
    this.csrf = tokenRes.json?.token ?? this.jar.get('csrf-token') ?? null;

    const login = await this.call('POST', '/auth/login', {
      email: this.account.email,
      password: this.account.password,
    });
    if (login.status !== 200) {
      throw new Error(`login ${this.account.email} -> ${login.status} ${login.text.slice(0, 200)}`);
    }
    // El login rota la cookie CSRF: releer del jar.
    this.csrf = this.jar.get('csrf-token') ?? this.csrf;

    const verify = await this.call('GET', '/auth/verify');
    this.user = verify.json?.user ?? verify.json?.data?.user ?? verify.json;
    return this.user;
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Ids reales del tenant del usuario, para ejercitar rutas /:id sin inventar datos. */
async function collectContext(session) {
  const ctx = {
    userId: session.user?.id ?? session.user?.userId ?? null,
    clinicId: session.user?.clinicId ?? null,
    patientId: null,
    sessionId: null,
    appointmentId: null,
    handoffId: null,
    campaignId: null,
    podiatristId: null,
    otherUserId: null,
    notificationId: null,
  };

  const patients = await session.call('GET', '/patients?limit=5&offset=0');
  const plist = patients.json?.patients ?? patients.json?.data?.patients ?? patients.json?.data ?? [];
  if (Array.isArray(plist) && plist[0]) ctx.patientId = plist[0].id;

  const sessions = await session.call('GET', '/sessions?limit=5');
  const slist = sessions.json?.sessions ?? sessions.json?.data?.sessions ?? sessions.json?.data ?? [];
  if (Array.isArray(slist) && slist[0]) ctx.sessionId = slist[0].id;

  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const appts = await session.call('GET', `/appointments?from=${from}&to=${today}&limit=20`);
  const alist = appts.json?.appointments ?? appts.json?.data?.appointments ?? appts.json?.data ?? [];
  if (Array.isArray(alist) && alist[0]) ctx.appointmentId = alist[0].id;

  const notifs = await session.call('GET', '/notifications?limit=5');
  const nlist = notifs.json?.notifications ?? notifs.json?.data?.notifications ?? notifs.json?.data ?? [];
  if (Array.isArray(nlist) && nlist[0]) ctx.notificationId = nlist[0].id;

  // Podólogo objetivo para rutas que exigen podiatristId (tarifas, agenda de otro).
  if (session.user?.role === 'podiatrist') {
    ctx.podiatristId = ctx.userId;
  } else {
    const visible = await session.call('GET', '/users/visible?role=podiatrist&limit=5');
    const vlist = visible.json?.users ?? [];
    if (Array.isArray(vlist) && vlist[0]) ctx.podiatristId = vlist[0].id;
  }

  return ctx;
}

/**
 * Catálogo de comprobaciones. `expect` por rol; los roles no listados en `allow`/`deny`
 * se evalúan como 'any' (solo se marca 5xx).
 */
function buildChecks(role, ctx) {
  const R = role === 'podiatrist_base' ? 'podiatrist' : role;
  const isBase = role === 'podiatrist_base';
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';

  /** allow: roles que deben poder; deny: roles que no deben poder. */
  const catalog = [
    // ---- Comunes a toda cuenta autenticada ----
    { area: 'auth', m: 'GET', p: '/auth/verify', allow: ['*'] },
    { area: 'notificaciones', m: 'GET', p: '/notifications?limit=50', allow: ['*'] },
    { area: 'notificaciones', m: 'GET', p: '/notifications/unread-count', allow: ['*'] },
    { area: 'ajustes', m: 'GET', p: '/subscriptions/me', allow: ['*'] },
    // /pricing solo aplica a quien es sujeto de facturación (independiente o clinic_admin);
    // el resto recibe 403 billing_not_allowed por diseño.
    { area: 'ajustes', m: 'GET', p: '/subscriptions/pricing', allow: ['clinic_admin', 'podiatrist_base'] },
    { area: 'ajustes', m: 'GET', p: '/subscriptions/stripe/config', allow: ['*'] },
    { area: 'ajustes', m: 'GET', p: '/trial/status', allow: ['*'] },
    { area: 'ajustes', m: 'GET', p: '/2fa/status', allow: ['*'] },
    { area: 'ajustes', m: 'GET', p: '/users/me/avatar', allow: ['*'] },
    { area: 'ajustes', m: 'GET', p: '/consent-document', allow: ['*'] },
    { area: 'ajustes', m: 'GET', p: '/compliance/retention-policy', allow: ['*'] },
    { area: 'anuncios', m: 'GET', p: '/location-announcements/active', allow: ['*'] },

    // ---- Panel super_admin ----
    { area: 'usuarios', m: 'GET', p: '/users', allow: ['super_admin', 'admin'], deny: ['podiatrist', 'receptionist'] },
    // /users/visible tiene rama propia para recepcionista (solo sus podólogos asignados): permitido.
    { area: 'usuarios', m: 'GET', p: '/users/visible', allow: ['super_admin', 'admin', 'clinic_admin', 'receptionist'] },
    { area: 'usuarios', m: 'GET', p: '/users/clinical-stats', allow: ['super_admin'], deny: ['receptionist'] },
    { area: 'usuarios', m: 'GET', p: `/users/${ctx.userId}`, allow: ['super_admin', 'admin'] },
    { area: 'usuarios', m: 'GET', p: `/users/${ctx.userId}/status`, allow: ['super_admin'] },
    { area: 'mensajes', m: 'GET', p: '/messages', allow: ['super_admin'], deny: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'soporte', m: 'GET', p: '/support/conversations', allow: ['*'] },
    { area: 'auditoría', m: 'GET', p: '/audit-logs/all?limit=20', allow: ['super_admin'], deny: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'auditoría', m: 'GET', p: `/audit-logs/user/${ctx.userId}?limit=10`, allow: ['super_admin'] },
    {
      area: 'seguridad', m: 'GET',
      p: `/security-metrics/stats?startTime=${encodeURIComponent(new Date(Date.now() - 7 * 86400000).toISOString())}&endTime=${encodeURIComponent(new Date().toISOString())}`,
      allow: ['super_admin'], deny: ['clinic_admin', 'podiatrist', 'receptionist'],
    },
    { area: 'anuncios', m: 'GET', p: '/location-announcements/admin/campaigns', allow: ['super_admin'], deny: ['admin', 'clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'anuncios', m: 'GET', p: '/location-announcements/admin/advertisers', allow: ['super_admin'], deny: ['podiatrist'] },
    { area: 'anuncios', m: 'GET', p: '/location-announcements/admin/interests', allow: ['super_admin'], deny: ['podiatrist'] },
    { area: 'anuncios', m: 'GET', p: '/location-announcements/admin/audience-estimate?country=MX&state=Jalisco', allow: ['super_admin'], deny: ['podiatrist'] },
    { area: 'anuncios', m: 'GET', p: '/access-events/recent?limit=30', allow: ['super_admin'], deny: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'listas', m: 'GET', p: '/registration-lists?status=pending', allow: ['super_admin', 'admin'], deny: ['podiatrist', 'receptionist'] },
    { area: 'contraseñas', m: 'GET', p: '/auth/password-reset-requests', allow: ['super_admin'], deny: ['podiatrist', 'receptionist'] },
    { area: 'clínicas', m: 'GET', p: '/clinics', allow: ['super_admin', 'admin'], deny: ['podiatrist', 'receptionist'] },
    // Sin ?ids devuelve {} para cualquiera; con ids ajenos debe denegar (canAccessProfessional).
    { area: 'profesionales', m: 'GET', p: '/professionals/licenses?ids=user_podiatrist_007', allow: ['super_admin'], deny: ['podiatrist', 'receptionist'] },
    { area: 'fuga', m: 'GET', p: '/professionals/info/user_podiatrist_007', allow: ['super_admin'], deny: ['podiatrist_base', 'receptionist'] },
    { area: 'fuga', m: 'GET', p: '/clinics/clinic_003', deny: ['podiatrist', 'podiatrist_base', 'receptionist'] },

    // ---- Clínica / profesional ----
    { area: 'clínica', m: 'GET', p: ctx.clinicId ? `/clinics/${ctx.clinicId}` : null, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'clínica', m: 'GET', p: ctx.clinicId ? `/clinics/${ctx.clinicId}/logo` : null, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'perfil', m: 'GET', p: `/professionals/info/${ctx.userId}`, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'perfil', m: 'GET', p: `/professionals/credentials/${ctx.userId}`, allow: ['clinic_admin', 'podiatrist'] },
    { area: 'perfil', m: 'GET', p: `/professionals/logo/${ctx.userId}`, allow: ['clinic_admin', 'podiatrist'] },
    { area: 'recepción', m: 'GET', p: '/receptionists', allow: ['clinic_admin', 'podiatrist'] },
    { area: 'recepción', m: 'GET', p: '/receptionists/limits', allow: ['clinic_admin', 'podiatrist'] },
    { area: 'recepción', m: 'GET', p: `/receptionists/assigned-podiatrists/${ctx.userId}`, allow: ['receptionist'] },

    // ---- Pacientes ----
    { area: 'pacientes', m: 'GET', p: '/patients?limit=20&offset=0', allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'pacientes', m: 'GET', p: '/patients/demographics-summary', allow: ['clinic_admin', 'podiatrist'] },
    { area: 'pacientes', m: 'GET', p: ctx.patientId ? `/patients?id=${ctx.patientId}` : null, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },

    // ---- Sesiones clínicas ----
    { area: 'sesiones', m: 'GET', p: '/sessions?limit=20', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'sesiones', m: 'GET', p: '/sessions/upcoming-followups', allow: ['podiatrist'] },
    { area: 'sesiones', m: 'GET', p: ctx.patientId ? `/sessions?patient=${ctx.patientId}&limit=50` : null, allow: ['podiatrist'] },
    { area: 'recetas', m: 'GET', p: ctx.sessionId ? `/prescriptions/session/${ctx.sessionId}` : null, allow: ['podiatrist'] },

    // ---- Agenda / citas ----
    { area: 'agenda', m: 'GET', p: `/appointments?from=${from}&to=${today}&includeCancelled=1&limit=200`, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    // La recepcionista atiende a varios podólogos: la exportación exige elegir uno.
    { area: 'agenda', m: 'GET', p: ctx.podiatristId ? `/appointments/export/preview?date=${today}&podiatristId=${ctx.podiatristId}` : null, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'agenda', m: 'GET', p: ctx.appointmentId ? `/appointments/${ctx.appointmentId}` : null, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'agenda', m: 'GET', p: '/clinical-dashboard/agenda-settings', allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'agenda', m: 'GET', p: '/clinical-dashboard/reschedule-message', allow: ['clinic_admin', 'podiatrist'] },
    // El enlace de reserva es propiedad del podólogo; el resto recibe 403 por diseño.
    { area: 'agenda', m: 'GET', p: '/clinical-dashboard/booking-link', allow: ['podiatrist', 'podiatrist_base'], deny: ['clinic_admin', 'receptionist'] },
    { area: 'agenda', m: 'GET', p: `/clinical-dashboard/satisfaction?from=${from}&to=${today}`, allow: ['clinic_admin', 'podiatrist'] },
    { area: 'agenda', m: 'GET', p: `/clinical-dashboard/appointment-metrics?from=${from}&to=${today}`, allow: ['clinic_admin', 'podiatrist'], premium: true },
    { area: 'agenda', m: 'GET', p: '/clinical/appointments/metrics', allow: ['clinic_admin', 'podiatrist'] },

    // ---- Dashboard ----
    { area: 'dashboard', m: 'GET', p: '/clinical-dashboard/overview', allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'dashboard', m: 'GET', p: '/clinical-dashboard/clinic-stats', allow: ['clinic_admin'] },

    // ---- Cobros ----
    { area: 'cobros', m: 'GET', p: `/checkout-handoffs?from=${from}&to=${today}&limit=100`, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'cobros', m: 'GET', p: '/checkout-handoffs/pending-count', allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'cobros', m: 'GET', p: ctx.podiatristId ? `/checkout-handoffs/tariffs?podiatristId=${ctx.podiatristId}` : null, allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'cobros', m: 'GET', p: '/checkout-handoffs/analytics-preferences', allow: ['clinic_admin', 'podiatrist'], premium: true },
    { area: 'cobros', m: 'GET', p: `/checkout-handoffs/analytics?from=${monthStart}&to=${today}`, allow: ['clinic_admin', 'podiatrist'], premium: true },
    { area: 'cobros', m: 'GET', p: '/checkout-handoffs/daily-closes/today', allow: ['clinic_admin', 'podiatrist', 'receptionist'], premium: true },
    { area: 'cobros', m: 'GET', p: '/checkout-handoffs/daily-closes?limit=14', allow: ['clinic_admin', 'podiatrist', 'receptionist'], premium: true },

    // ---- Herramientas clínicas ----
    // Solo inventario y derivaciones son exclusivos de la página Premium; plantillas (editor de
    // sesiones), lista de espera (calendario), notas de evolución y checklist viven en páginas
    // no-Premium, por eso su GET no lleva requireFeature. Las escrituras de plantillas sí.
    { area: 'herramientas', m: 'GET', p: '/clinical/templates', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'herramientas', m: 'GET', p: '/clinical/inventory', allow: ['podiatrist', 'clinic_admin'], premium: true },
    { area: 'herramientas', m: 'GET', p: '/clinical/waitlist', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'herramientas', m: 'GET', p: '/clinical/referrals', allow: ['podiatrist', 'clinic_admin'], premium: true },
    { area: 'herramientas', m: 'GET', p: '/clinical/layout', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'herramientas', m: 'GET', p: '/clinical/print-preferences', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'herramientas', m: 'GET', p: '/clinical/workspace-watermark', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'herramientas', m: 'GET', p: '/clinical/dashboard-logo', allow: ['podiatrist', 'clinic_admin'] },
    { area: 'herramientas', m: 'GET', p: ctx.patientId ? `/clinical/patients/${ctx.patientId}/evolution-notes` : null, allow: ['podiatrist'] },
    { area: 'herramientas', m: 'GET', p: ctx.sessionId ? `/clinical/sessions/${ctx.sessionId}/checklist` : null, allow: ['podiatrist'] },

    // ---- WhatsApp ----
    { area: 'whatsapp', m: 'GET', p: '/integrations/whatsapp/me', allow: ['clinic_admin', 'podiatrist'] },
    { area: 'whatsapp', m: 'GET', p: '/integrations/whatsapp/workspace', allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'whatsapp', m: 'GET', p: '/whatsapp-messages?limit=200', allow: ['clinic_admin', 'podiatrist', 'receptionist'] },
    { area: 'whatsapp', m: 'GET', p: '/whatsapp-campaigns', allow: ['clinic_admin', 'podiatrist'], premium: true },

    // ---- Cumplimiento ----
    { area: 'cumplimiento', m: 'GET', p: '/compliance/legal-holds', allow: ['super_admin', 'admin'], deny: ['podiatrist', 'receptionist'] },
    { area: 'cumplimiento', m: 'GET', p: '/compliance/record-access?limit=20', allow: ['super_admin', 'admin', 'clinic_admin'] },
    { area: 'cumplimiento', m: 'GET', p: '/compliance/evidence/summary', allow: ['super_admin', 'admin'] },

    // ---- Fugas de permisos: escrituras que ciertos roles NO deben poder hacer ----
    // REGLA: toda comprobación destructiva apunta SIEMPRE a ids inexistentes y se ejecuta
    // solo para roles listados en `deny`. Si el rol pudiera ejecutarla de verdad, se omite
    // (`destructive: true`) para no tocar datos reales.
    { area: 'fuga', m: 'POST', p: '/subscriptions/set-tier', body: { subjectType: 'user', subjectId: 'user_inexistente_zzz', tier: 'premium' }, deny: ['clinic_admin', 'podiatrist', 'receptionist', 'admin'], destructive: true },
    { area: 'fuga', m: 'POST', p: '/users', body: { email: 'no-op@example.invalid', name: 'x', role: 'podiatrist' }, deny: ['receptionist'], destructive: true },
    { area: 'fuga', m: 'DELETE', p: '/users/user_inexistente_zzz', deny: ['clinic_admin', 'podiatrist', 'receptionist', 'admin'], destructive: true },
    { area: 'fuga', m: 'POST', p: '/location-announcements/admin/campaigns', body: {}, deny: ['clinic_admin', 'podiatrist', 'receptionist', 'admin'], destructive: true },
    { area: 'fuga', m: 'POST', p: '/messages', body: { subject: 'x', body: 'x', target: 'all' }, deny: ['clinic_admin', 'podiatrist', 'receptionist'], destructive: true },
    { area: 'fuga', m: 'POST', p: '/clinics', body: { name: 'no-op' }, deny: ['clinic_admin', 'podiatrist', 'receptionist'], destructive: true },
    { area: 'fuga', m: 'DELETE', p: '/clinics/clinic_001/logo', deny: ['podiatrist', 'receptionist'], destructive: true },
    { area: 'fuga', m: 'POST', p: `/patients/${ctx.patientId ?? 'x'}/reassign`, body: { newPodiatristId: 'user_inexistente_zzz' }, deny: ['podiatrist', 'receptionist'], destructive: true },

    // ---- Robustez: rutas de escritura con ids inexistentes (no deben dar 5xx) ----
    { area: 'robustez', m: 'GET', p: '/patients?id=id_inexistente_zzz', expectAny: true },
    { area: 'robustez', m: 'GET', p: '/sessions?id=id_inexistente_zzz', expectAny: true },
    { area: 'robustez', m: 'GET', p: '/appointments/id_inexistente_zzz', expectAny: true },
    { area: 'robustez', m: 'POST', p: '/appointments/id_inexistente_zzz/confirmation-link', body: {}, expectAny: true },
    { area: 'robustez', m: 'PATCH', p: '/checkout-handoffs/id_inexistente_zzz', body: { status: 'paid' }, expectAny: true },
    { area: 'robustez', m: 'GET', p: '/clinics/clinic_inexistente_zzz', expectAny: true },
    { area: 'robustez', m: 'GET', p: '/patients?limit=abc&offset=-5', expectAny: true },
    { area: 'robustez', m: 'GET', p: `/appointments?from=no-es-fecha&to=${today}`, expectAny: true },
  ];

  return catalog
    .filter((c) => c.p)
    // Salvaguarda: una comprobación destructiva nunca se lanza con un rol que sí podría
    // ejecutarla (solo se usa para verificar que los roles denegados reciben 401/403).
    .filter((c) => !c.destructive || (c.deny ?? []).includes(R) || (c.deny ?? []).includes(role))
    .map((c) => {
      let expect = 'any';
      if (!c.expectAny) {
        const allow = c.allow ?? [];
        const deny = c.deny ?? [];
        if (allow.includes('*') || allow.includes(R) || allow.includes(role)) {
          // En plan Base, las features Premium deben responder 402 (candado), no 200.
          expect = isBase && c.premium ? 'locked' : 'allow';
        } else if (deny.includes(R) || deny.includes(role)) {
          expect = 'deny';
        }
      }
      return { ...c, expect };
    });
}

function verdict(check, status) {
  if (status >= 500) return 'ERROR_5XX';
  if (status === 429) return 'RATE_LIMITED';
  if (check.expect === 'allow') return status >= 200 && status < 300 ? 'OK' : 'FALLA_ACCESO';
  if (check.expect === 'deny') {
    if (status === 401 || status === 403) return 'OK';
    if (status >= 200 && status < 300) return 'FUGA_PERMISOS';
    return 'OK_OTRO'; // 400/404/422: rechazado por otra vía, aceptable
  }
  if (check.expect === 'locked') {
    if (status === 402 || status === 403) return 'OK';
    if (status >= 200 && status < 300) return 'FUGA_PREMIUM';
    return 'OK_OTRO';
  }
  return 'OK';
}

async function runRole(account) {
  const session = new Session(account);
  const started = Date.now();
  process.stdout.write(`\n### ${account.label} (${account.email})\n`);

  let user;
  try {
    user = await session.bootstrap();
  } catch (e) {
    console.log(`  LOGIN FALLIDO: ${e.message}`);
    return { account, loginFailed: true, results: [] };
  }
  console.log(`  login OK  role=${user?.role ?? '?'}  clinicId=${user?.clinicId ?? '-'}`);

  const ctx = await collectContext(session);
  if (VERBOSE) console.log('  ctx:', JSON.stringify(ctx));

  const checks = buildChecks(account.role, ctx);
  const results = [];
  for (const check of checks) {
    const res = await session.call(check.m, check.p, check.body);
    const v = verdict(check, res.status);
    results.push({
      area: check.area,
      method: check.m,
      path: check.p,
      expect: check.expect,
      status: res.status,
      verdict: v,
      body: res.text.slice(0, 300),
    });
    if (VERBOSE || (v !== 'OK' && v !== 'OK_OTRO')) {
      console.log(`  [${v}] ${check.m} ${check.p} -> ${res.status} (esperado: ${check.expect})`);
      if (v === 'ERROR_5XX') console.log(`         ${res.text.slice(0, 200)}`);
    }
  }

  await session.call('POST', '/auth/logout', {});
  const bad = results.filter((r) => r.verdict !== 'OK' && r.verdict !== 'OK_OTRO');
  console.log(`  -> ${results.length} comprobaciones, ${bad.length} con hallazgo (${Math.round((Date.now() - started) / 1000)}s)`);
  return { account, ctx, results };
}

async function main() {
  const ping = await fetch(`${BASE}/ping`).catch(() => null);
  if (!ping || !ping.ok) {
    console.error(`No responde ${BASE}/ping — ¿está levantado el worker?`);
    process.exit(1);
  }
  console.log(`Smoke por rol contra ${BASE}`);

  const accounts = ONLY_ROLE ? ACCOUNTS.filter((a) => a.role === ONLY_ROLE) : ACCOUNTS;
  const all = [];
  for (const account of accounts) {
    all.push(await runRole(account));
  }

  console.log('\n================ RESUMEN ================');
  const findings = [];
  for (const r of all) {
    for (const res of r.results) {
      if (res.verdict !== 'OK' && res.verdict !== 'OK_OTRO') {
        findings.push({ role: r.account.role, email: r.account.email, ...res });
      }
    }
  }

  const byVerdict = findings.reduce((acc, f) => {
    (acc[f.verdict] ??= []).push(f);
    return acc;
  }, {});
  for (const [v, list] of Object.entries(byVerdict)) {
    console.log(`\n--- ${v} (${list.length}) ---`);
    for (const f of list) {
      console.log(`  ${f.role.padEnd(15)} ${f.method} ${f.path} -> ${f.status}`);
      if (v === 'ERROR_5XX' || v === 'FUGA_PERMISOS' || v === 'FUGA_PREMIUM') console.log(`      ${f.body.replace(/\s+/g, ' ').slice(0, 180)}`);
    }
  }
  if (findings.length === 0) console.log('Sin hallazgos.');

  const out = process.env.E2E_OUT;
  if (out) {
    const fs = await import('node:fs');
    fs.writeFileSync(out, JSON.stringify(all, null, 2));
    console.log(`\nDetalle completo en ${out}`);
  }

  process.exit(findings.some((f) => f.verdict === 'ERROR_5XX' || f.verdict === 'FUGA_PERMISOS' || f.verdict === 'FUGA_PREMIUM') ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
