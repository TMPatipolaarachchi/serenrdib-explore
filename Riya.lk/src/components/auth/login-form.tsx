"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { GoogleButton } from "./google-button";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { loginSchema } from "@/lib/validations";

type Values = z.input<typeof loginSchema>;

/** Maps NextAuth error codes to translated messages. */
export function useAuthErrorMessage() {
  const { t } = useI18n();
  return (code: string | null | undefined): string | null => {
    if (!code) return null;
    switch (code) {
      case "CredentialsSignin":
        return t.auth.invalidCredentials;
      case "AccountBanned":
        return t.auth.accountBanned;
      case "AccountSuspended":
        return t.auth.accountSuspended;
      case "TooManyAttempts":
        return t.auth.tooManyAttempts;
      case "GoogleEmailNotVerified":
        return t.auth.googleEmailNotVerified;
      default:
        return t.auth.genericError;
    }
  };
}

export function LoginForm({ callbackUrl, googleEnabled, initialError }: { callbackUrl: string; googleEnabled: boolean; initialError?: string }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const authError = useAuthErrorMessage();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(authError(initialError));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (!res || res.error) {
      setFormError(authError(res?.error ?? "Default"));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            {t.common.or}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </p>
        )}
        <Field label={t.auth.email} htmlFor="email" error={errorText(errors.email?.message)}>
          <Input id="email" type="email" autoComplete="email" leading={<Mail className="size-4" />} invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label={t.auth.password} htmlFor="password" error={errorText(errors.password?.message)}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            leading={<Lock className="size-4" />}
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {t.auth.signIn}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-accent-600 hover:underline">
          {t.auth.signUp}
        </Link>
      </p>
    </div>
  );
}
