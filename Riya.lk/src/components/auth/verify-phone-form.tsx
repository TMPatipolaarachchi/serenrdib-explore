"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { useInterval } from "@/lib/hooks";
import { formatPhone, normalizeSriLankanPhone } from "@/lib/utils";

/** Two-step OTP flow: enter phone → enter the 6-digit SMS code. */
export function VerifyPhoneForm({ initialPhone, next }: { initialPhone?: string | null; next: string }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(initialPhone ? formatPhone(initialPhone) : "");
  const [normalized, setNormalized] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [devCode, setDevCode] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000, cooldown > 0);

  async function sendCode() {
    setError(undefined);
    const e164 = normalizeSriLankanPhone(phone);
    if (!e164) {
      setError(t.errors.invalidPhone);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        const retry = Number(res.headers.get("Retry-After"));
        if (res.status === 429 && retry && retry < 120) setCooldown(retry);
        throw new Error(data.fieldErrors?.phone ?? data.error);
      }
      setNormalized(e164);
      setDevCode(data.devCode);
      setStep("code");
      setCooldown(60);
      setCode("");
    } catch (err) {
      setError(errorText(err instanceof Error ? err.message : "") ?? t.errors.serverError);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setError(undefined);
    if (!/^\d{6}$/.test(code)) {
      setError(t.errors.invalidCode);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.fieldErrors?.code ?? data.error);
      toast.success(t.verify.verified);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(errorText(err instanceof Error ? err.message : "") ?? t.errors.serverError);
      setBusy(false);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "phone" ? (
        <motion.form
          key="phone"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
          className="space-y-4"
        >
          <Field label={t.verify.phone} htmlFor="phone" error={error}>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t.verify.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leading={<Smartphone className="size-4" />}
              invalid={!!error}
              autoFocus
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={busy} disabled={cooldown > 0}>
            {cooldown > 0 ? fmt(t.verify.resendIn, { seconds: cooldown }) : t.verify.sendCode}
          </Button>
        </motion.form>
      ) : (
        <motion.form
          key="code"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          onSubmit={verify}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">{fmt(t.verify.codeSentTo, { phone: formatPhone(normalized) })}</p>
          {devCode && (
            <p className="rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {fmt(t.verify.devCode, { code: devCode })}
            </p>
          )}
          <Field label={t.verify.code} htmlFor="code" error={error}>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              leading={<KeyRound className="size-4" />}
              className="text-center font-mono text-xl tracking-[0.5em]"
              invalid={!!error}
              autoFocus
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            {t.verify.verify}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => setStep("phone")} className="font-medium text-muted-foreground hover:text-foreground">
              {t.verify.changeNumber}
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={cooldown > 0 || busy}
              className="font-semibold text-accent-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? fmt(t.verify.resendIn, { seconds: cooldown }) : t.verify.resend}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
