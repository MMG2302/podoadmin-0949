/**
 * Envío de SMS OTP (Twilio). En dev sin credenciales: mock en logs.
 */

function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

export function isSmsConfigured(): boolean {
  if (isTwilioConfigured()) return true;
  return process.env.NODE_ENV !== 'production' && process.env.SMS_MOCK_IN_DEV !== '0';
}

export async function sendSms(toE164: string, body: string): Promise<boolean> {
  if (isTwilioConfigured()) {
    const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const token = process.env.TWILIO_AUTH_TOKEN!.trim();
    const from = process.env.TWILIO_FROM_NUMBER!.trim();
    const auth = btoa(`${sid}:${token}`);
    const params = new URLSearchParams({ To: toE164, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      console.error('[sms] Twilio error', res.status, await res.text());
      return false;
    }
    return true;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[sms:mock] To ${toE164}: ${body}`);
    return true;
  }

  console.error('[sms] Twilio no configurado en producción');
  return false;
}
