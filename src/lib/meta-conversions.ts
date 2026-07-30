import { createHash } from "crypto";
import { META_PIXEL_ID } from "@/lib/meta-pixel-id";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Normalize + hash phone for Meta (digits only, with country code). */
export function hashPhone(rawPhone: string, countryCode = "216"): string | null {
  let digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `${countryCode}${digits}`;
  if (digits.startsWith("0") && digits.length === 9) {
    digits = `${countryCode}${digits.slice(1)}`;
  }

  return sha256(digits);
}

function hashOptional(value: string | null | undefined): string | null {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return null;
  return sha256(trimmed);
}

function splitName(fullName: string): { fn: string | null; ln: string | null } {
  const parts = String(fullName || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { fn: null, ln: null };
  if (parts.length === 1) return { fn: sha256(parts[0]), ln: null };
  return {
    fn: sha256(parts[0]),
    ln: sha256(parts.slice(1).join(" ")),
  };
}

export type MetaPurchasePayload = {
  eventId: string;
  value: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  numItems?: number;
  phone?: string;
  name?: string;
  email?: string;
  eventSourceUrl?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string | null;
  fbc?: string | null;
};

/**
 * Send Purchase via Meta Conversions API (server-side).
 * Requires META_ACCESS_TOKEN in env.
 */
export async function sendMetaPurchaseEvent(
  payload: MetaPurchasePayload
): Promise<void> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn(
      "[Meta CAPI] META_ACCESS_TOKEN missing — Purchase not sent server-side."
    );
    return;
  }

  const { fn, ln } = splitName(payload.name || "");
  const ph = payload.phone ? hashPhone(payload.phone) : null;
  const em = payload.email ? hashOptional(payload.email) : null;

  const user_data: Record<string, unknown> = {
    client_ip_address: payload.clientIpAddress || undefined,
    client_user_agent: payload.clientUserAgent || undefined,
  };

  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (fn) user_data.fn = [fn];
  if (ln) user_data.ln = [ln];
  if (payload.fbp) user_data.fbp = payload.fbp;
  if (payload.fbc) user_data.fbc = payload.fbc;
  // Tunisia
  user_data.country = [sha256("tn")];

  const custom_data: Record<string, unknown> = {
    currency: payload.currency || "TND",
    value: Number(payload.value),
  };

  if (payload.contentIds?.length) custom_data.content_ids = payload.contentIds;
  if (payload.contentName) custom_data.content_name = payload.contentName;
  if (payload.numItems != null) custom_data.num_items = payload.numItems;
  custom_data.content_type = "product";

  const event: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: payload.eventId,
    action_source: "website",
    user_data,
    custom_data,
  };

  if (payload.eventSourceUrl) {
    event.event_source_url = payload.eventSourceUrl;
  }

  const body: Record<string, unknown> = {
    data: [event],
  };

  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) {
    body.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${accessToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("[Meta CAPI] Purchase failed", res.status, json);
      return;
    }
    console.info("[Meta CAPI] Purchase sent", json);
  } catch (err) {
    console.error("[Meta CAPI] Purchase error", err);
  }
}
