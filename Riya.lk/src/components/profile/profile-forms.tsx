"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { DISTRICTS, citySlug, getDistrict } from "@/lib/data/locations";
import { changePasswordSchema, profileSchema } from "@/lib/validations";

type ProfileValues = z.input<typeof profileSchema>;
type PasswordValues = z.input<typeof changePasswordSchema>;

/** Sends a JSON request and maps field errors back onto the form. */
async function submitJson(
  url: string,
  method: string,
  body: unknown,
  onFieldError: (field: string, message: string) => void,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => ({}));
  for (const [f, m] of Object.entries((data.fieldErrors ?? {}) as Record<string, string>)) onFieldError(f, m);
  return { ok: false, error: data.fieldErrors ? undefined : data.error };
}

export function ProfileForm({ initial }: { initial: { name: string; district: string | null; city: string | null } }) {
  const { t, locale } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initial.name, district: initial.district ?? "", city: initial.city ?? "" },
  });
  const district = useWatch({ control, name: "district" }) as string;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const result = await submitJson("/api/profile", "PATCH", values, (f, m) => setError(f as keyof ProfileValues, { message: m }));
        if (!result.ok) {
          if (result.error) toast.error(errorText(result.error));
          return;
        }
        toast.success(t.profile.saved);
        reset(values);
        router.refresh();
      })}
    >
      <Field label={t.auth.name} htmlFor="name" error={errorText(errors.name?.message)}>
        <Input id="name" invalid={!!errors.name} {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.postAd.district} htmlFor="district">
          <Select id="district" {...register("district", { onChange: () => setValue("city", "") })}>
            <option value="">{t.postAd.selectDistrict}</option>
            {DISTRICTS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name[locale]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.postAd.city} htmlFor="city" error={errorText(errors.city?.message)}>
          <Select id="city" disabled={!district} {...register("city")}>
            <option value="">{t.postAd.selectCity}</option>
            {getDistrict(district)?.cities.map((c) => (
              <option key={c} value={citySlug(c)}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        {t.common.saveChanges}
      </Button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        const result = await submitJson("/api/profile/password", "POST", values, (f, m) =>
          setError(f as keyof PasswordValues, { message: m }),
        );
        if (!result.ok) {
          if (result.error) toast.error(errorText(result.error));
          return;
        }
        toast.success(t.profile.passwordChanged);
        reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      })}
    >
      {!hasPassword && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{t.profile.googleNote}</p>}
      {hasPassword && (
        <Field label={t.profile.currentPassword} htmlFor="currentPassword" error={errorText(errors.currentPassword?.message)}>
          <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.profile.newPassword} htmlFor="newPassword" error={errorText(errors.newPassword?.message)} hint={t.auth.passwordHint}>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
        </Field>
        <Field label={t.profile.confirmNewPassword} htmlFor="confirmPassword" error={errorText(errors.confirmPassword?.message)}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
        </Field>
      </div>
      <Button type="submit" variant="secondary" loading={isSubmitting}>
        {hasPassword ? t.profile.changePassword : t.profile.setPassword}
      </Button>
    </form>
  );
}
