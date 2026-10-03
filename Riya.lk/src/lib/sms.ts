/**
 * SMS sending with pluggable Sri Lankan providers.
 *
 * SMS_PROVIDER:
 *   • "console"  – (default) prints messages to the server log. Development only.
 *   • "notifylk" – https://notify.lk  (NOTIFYLK_USER_ID, NOTIFYLK_API_KEY, NOTIFYLK_SENDER_ID)
 *   • "textlk"   – https://text.lk    (TEXTLK_API_TOKEN, TEXTLK_SENDER_ID)
 */
import "server-only";

type Provider = "console" | "notifylk" | "textlk";

export function smsProvider(): Provider {
  const p = (process.env.SMS_PROVIDER || "console").toLowerCase();
  return p === "notifylk" || p === "textlk" ? p : "console";
}

/** @param to E.164 number, e.g. "+94771234567" */
export async function sendSms(to: string, message: string): Promise<void> {
  const recipient = to.replace(/^\+/, ""); // providers expect 9477XXXXXXX

  switch (smsProvider()) {
    case "notifylk": {
      const params = new URLSearchParams({
        user_id: process.env.NOTIFYLK_USER_ID ?? "",
        api_key: process.env.NOTIFYLK_API_KEY ?? "",
        sender_id: process.env.NOTIFYLK_SENDER_ID || "NotifyDEMO",
        to: recipient,
        message,
      });
      const res = await fetch(`https://app.notify.lk/api/v1/send?${params}`);
      if (!res.ok) throw new Error(`notify.lk error ${res.status}: ${await res.text()}`);
      return;
    }

    case "textlk": {
      const res = await fetch("https://app.text.lk/api/v3/sms/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TEXTLK_API_TOKEN ?? ""}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recipient,
          sender_id: process.env.TEXTLK_SENDER_ID || "TextLKDemo",
          type: "plain",
          message,
        }),
      });
      if (!res.ok) throw new Error(`text.lk error ${res.status}: ${await res.text()}`);
      return;
    }

    default:
      if (process.env.NODE_ENV === "production") {
        console.warn("[sms] SMS_PROVIDER is 'console' in production — messages are NOT being delivered.");
      }
      console.info(`\n[sms] → ${to}\n${message}\n`);
  }
}
