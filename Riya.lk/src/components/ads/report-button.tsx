"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/form";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { REPORT_REASONS, type ReportReason } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** "Report this ad" link + modal form. */
export function ReportButton({ adId, isLoggedIn }: { adId: string; isLoggedIn: boolean }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  function openModal() {
    if (!isLoggedIn) {
      toast.info(t.report.loginRequired);
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen(true);
  }

  async function submit() {
    if (!reason) {
      setError(t.errors.required);
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/ads/${adId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(t.report.success);
      setOpen(false);
    } catch (err) {
      toast.error(errorText(err instanceof Error ? err.message : "") ?? t.errors.serverError);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-red-600"
      >
        <Flag className="size-4" />
        {t.ad.report}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.report.title}
        footer={
          <Button variant="danger" className="w-full" size="lg" loading={sending} onClick={submit}>
            {t.report.submit}
          </Button>
        }
      >
        <Field label={t.report.reason} error={error} required>
          <div className="grid gap-2" role="radiogroup">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition",
                  reason === r ? "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/30" : "border-border hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => {
                    setReason(r);
                    setError(undefined);
                  }}
                  className="accent-red-600"
                />
                {t.enums.reportReason[r]}
              </label>
            ))}
          </div>
        </Field>
        <Field label={t.report.details} className="mt-4" optionalLabel={t.common.optional}>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t.report.detailsPlaceholder} rows={3} maxLength={1000} />
        </Field>
      </Modal>
    </>
  );
}
