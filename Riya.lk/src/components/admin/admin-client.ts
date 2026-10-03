"use client";

/**
 * Client helpers for the admin panel (English only): API calls with readable
 * error messages, and a hook that runs an action then refreshes the page.
 */
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import en from "@/lib/i18n/dictionaries/en";

const ADMIN_MESSAGES: Record<string, string> = {
  ...en.errors,
  invalidCredentials: "Incorrect username or password.",
  tooManyLoginAttempts: "Too many failed attempts. Please wait a few minutes and try again.",
  passwordChangeRequired: "Please change your password first.",
  adminPasswordMin: "Use at least 10 characters.",
  adminPasswordWeak: "Use upper- and lower-case letters, a number and a symbol — and don't include the username.",
  passwordSameAsOld: "The new password must be different from the current one.",
  slugTaken: "That slug is already in use.",
  invalidSlug: "Use lowercase letters, numbers and hyphens only.",
  categoryInUse: "This category still has ads or subcategories. Move them or deactivate the category instead.",
  brandInUse: "Ads still use this brand. Deactivate it instead of deleting.",
  modelInUse: "Ads still use this model. Deactivate it instead of deleting.",
  modelExists: "This brand already has a model with that name.",
};

export function adminMessage(key: string | undefined | null): string {
  if (!key) return ADMIN_MESSAGES.serverError!;
  return ADMIN_MESSAGES[key] ?? key;
}

export interface AdminResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function adminFetch<T = unknown>(url: string, method: string, body?: unknown): Promise<AdminResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.endsWith("/auth/login")) {
      // Session expired — do a full reload so the proxy sends us to the login page.
      window.location.reload();
      return { ok: false, error: "unauthorized" };
    }
    if (!res.ok) return { ok: false, error: data.error, fieldErrors: data.fieldErrors };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** Runs an admin API call, shows a toast, and refreshes server data on success. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (url: string, method: string, body: unknown, success: string): Promise<AdminResult> => {
      setPending(true);
      const result = await adminFetch(url, method, body);
      setPending(false);
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else {
        const fieldMessage = result.fieldErrors ? Object.values(result.fieldErrors)[0] : undefined;
        toast.error(adminMessage(fieldMessage ?? result.error));
      }
      return result;
    },
    [router],
  );

  return { run, pending };
}

/** Uploads an image for the admin (logo / banners). */
export async function adminUpload(file: File, folder: "banners" | "branding") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(adminMessage(data.error));
  return data as { url: string; publicId: string | null };
}
