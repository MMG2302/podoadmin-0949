const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface WhatsAppConnectionTestResult {
  ok: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  error?: string;
}

/**
 * Verifica credenciales contra Meta Graph API (Phone Number ID + token).
 */
export async function testWhatsAppConnection(
  phoneNumberId: string,
  accessToken: string
): Promise<WhatsAppConnectionTestResult> {
  try {
    const url = `${GRAPH_BASE}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      display_phone_number?: string;
      verified_name?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: body.error?.message || `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      displayPhoneNumber: body.display_phone_number,
      verifiedName: body.verified_name,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface SendTemplateInput {
  phoneNumberId: string;
  accessToken: string;
  toPhoneE164: string;
  templateName: string;
  templateLanguage: string;
  bodyParams?: string[];
}

export async function sendWhatsAppTemplateMessage(input: SendTemplateInput): Promise<{
  ok: boolean;
  providerMessageId?: string;
  responseBody?: unknown;
  error?: string;
}> {
  try {
    const url = `${GRAPH_BASE}/${encodeURIComponent(input.phoneNumberId)}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: input.toPhoneE164.replace(/\D/g, ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.templateLanguage || 'es' },
        ...(input.bodyParams && input.bodyParams.length > 0
          ? {
              components: [
                {
                  type: 'body',
                  parameters: input.bodyParams.map((p) => ({ type: 'text', text: p })),
                },
              ],
            }
          : {}),
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const parsed = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      messages?: { id?: string }[];
    };
    if (!res.ok) {
      return {
        ok: false,
        error: parsed.error?.message || `HTTP ${res.status}`,
        responseBody: parsed,
      };
    }

    return {
      ok: true,
      providerMessageId: parsed.messages?.[0]?.id,
      responseBody: parsed,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
