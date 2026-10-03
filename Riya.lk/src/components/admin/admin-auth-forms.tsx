"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { adminFetch, adminMessage } from "./admin-client";
import { adminChangePasswordSchema, adminLoginSchema } from "@/lib/validations";

type LoginValues = z.input<typeof adminLoginSchema>;
type ChangeValues = z.input<typeof adminChangePasswordSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(adminLoginSchema) });

  async function onSubmit(values: LoginValues) {
    setError(null);
    const res = await adminFetch<{ mustChangePassword: boolean }>("/api/admin/auth/login", "POST", values);
    if (!res.ok) {
      setError(adminMessage(res.error));
      return;
    }
    router.replace(res.data?.mustChangePassword ? "/admin/change-password" : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      <Field label="Username" htmlFor="username" error={errors.username && adminMessage(errors.username.message)}>
        <Input id="username" autoComplete="username" autoCapitalize="none" leading={<UserRound className="size-4" />} {...register("username")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password && adminMessage(errors.password.message)}>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            leading={<Lock className="size-4" />}
            className="pr-11"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Button type="submit" variant="secondary" size="lg" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

export function AdminChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangeValues>({ resolver: zodResolver(adminChangePasswordSchema) });

  async function onSubmit(values: ChangeValues) {
    const res = await adminFetch("/api/admin/auth/change-password", "POST", values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [f, m] of Object.entries(res.fieldErrors)) setError(f as keyof ChangeValues, { message: m });
      } else toast.error(adminMessage(res.error));
      return;
    }
    toast.success("Password updated");
    router.replace("/admin");
    router.refresh();
  }

  const msg = (m?: string) => (m ? adminMessage(m) : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {forced && (
        <p className="flex gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          For security, you must replace the default password before using the admin panel.
        </p>
      )}
      <Field label="Current password" htmlFor="currentPassword" error={msg(errors.currentPassword?.message)}>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
      </Field>
      <Field
        label="New password"
        htmlFor="newPassword"
        error={msg(errors.newPassword?.message)}
        hint="At least 10 characters with upper- and lower-case letters, a number and a symbol."
      >
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={msg(errors.confirmPassword?.message)}>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </Field>
      <Button type="submit" variant="secondary" size="lg" className="w-full" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
