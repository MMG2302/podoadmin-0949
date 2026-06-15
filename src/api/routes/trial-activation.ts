import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth';
import { getClientIP } from '../utils/ip-tracking';
import { getUserByIdFromDB } from '../utils/user-db';
import { activateTrialForUser, checkIpTrialEligibility } from '../utils/ip-trial-service';
import {
  completeTrialCardSetup,
  getTrialVerificationStatus,
  mockTrialCardVerification,
  startTrialCardSetup,
} from '../utils/trial-card';
import { hasSystemAccess } from '../utils/access-control';

const trialRoutes = new Hono();
trialRoutes.use('*', requireAuth);

trialRoutes.get('/status', async (c) => {
  const user = c.get('user')!;
  const clientIp = getClientIP(c.req.raw.headers);
  const row = await getUserByIdFromDB(user.userId);
  const verification = await getTrialVerificationStatus(user.userId);
  const trialEligibility =
    row && (row.role === 'clinic_admin' || row.role === 'podiatrist')
      ? await checkIpTrialEligibility(clientIp, row.role)
      : null;
  const systemAccess = row ? await hasSystemAccess(user.userId, row.role) : false;

  return c.json({
    success: true,
    verification,
    trialEligibility,
    systemAccess,
    revokeOnIpRepeat: process.env.TRIAL_REVOKE_ON_IP_REPEAT !== '0',
  });
});

trialRoutes.post('/card/setup', async (c) => {
  const user = c.get('user')!;
  const row = await getUserByIdFromDB(user.userId);
  if (!row?.email) {
    return c.json({ error: 'user_not_found' }, 404);
  }
  const result = await startTrialCardSetup(user.userId, row.email);
  if (!result.ok) {
    return c.json({ error: 'card_setup_failed', message: result.message }, 400);
  }
  return c.json({ success: true, url: result.url });
});

const cardCompleteSchema = z.object({
  sessionId: z.string().min(1),
});

trialRoutes.post('/card/complete', async (c) => {
  const user = c.get('user')!;
  const parsed = cardCompleteSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'session_id_required' }, 400);
  }
  const result = await completeTrialCardSetup(user.userId, parsed.data.sessionId);
  if (!result.ok) {
    return c.json({ error: 'card_verify_failed', message: result.message }, 400);
  }
  return c.json({ success: true, verification: await getTrialVerificationStatus(user.userId) });
});

trialRoutes.post('/card/mock', async (c) => {
  const user = c.get('user')!;
  const result = await mockTrialCardVerification(user.userId);
  if (!result.ok) {
    return c.json({ error: 'mock_failed', message: result.message }, 403);
  }
  return c.json({ success: true, verification: await getTrialVerificationStatus(user.userId) });
});

trialRoutes.post('/activate', async (c) => {
  const user = c.get('user')!;
  const row = await getUserByIdFromDB(user.userId);
  if (!row) {
    return c.json({ error: 'user_not_found' }, 404);
  }
  if (row.role !== 'clinic_admin' && row.role !== 'podiatrist') {
    return c.json({ error: 'role_not_eligible' }, 403);
  }

  const clientIp = getClientIP(c.req.raw.headers);
  const result = await activateTrialForUser({
    userId: user.userId,
    role: row.role,
    clinicId: row.clinicId,
    clientIp,
  });

  if (!result.granted) {
    return c.json(
      {
        success: false,
        error: result.eligibility.reason,
        message: result.eligibility.message,
        eligibility: result.eligibility,
      },
      400
    );
  }

  const systemAccess = await hasSystemAccess(user.userId, row.role);
  return c.json({
    success: true,
    message: result.eligibility.message,
    subscription: result.subscription,
    systemAccess,
  });
});

export default trialRoutes;
