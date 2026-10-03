"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { GoogleButton } from "./google-button";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { registerSchema } from "@/lib/validations";

type Values = z.input<typeof registerSchema>;

export function RegisterForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: Values) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors as Record<string, string>)) {
          setError(field as keyof Values, { message });
        }
      } else {
        toast.error(errorText(data.error) ?? t.errors.serverError);
      }
      return;
    }

    toast.success(t.auth.registered);
    const login = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    router.push(login?.error ? "/login" : callbackUrl);
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
        <Field label={t.auth.name} htmlFor="name" error={errorText(errors.name?.message)}>
          <Input id="name" autoComplete="name" leading={<UserRound className="size-4" />} invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label={t.auth.email} htmlFor="email" error={errorText(errors.email?.message)}>
          <Input id="email" type="email" autoComplete="email" leading={<Mail className="size-4" />} invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label={t.auth.password} htmlFor="password" error={errorText(errors.password?.message)} hint={t.auth.passwordHint}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            leading={<Lock className="size-4" />}
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Field label={t.auth.confirmPassword} htmlFor="confirmPassword" error={errorText(errors.confirmPassword?.message)}>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            leading={<Lock className="size-4" />}
            invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {t.auth.signUp}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.haveAccount}{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-accent-600 hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
