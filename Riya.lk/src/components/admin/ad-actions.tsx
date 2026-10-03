"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Star, Trash2, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/form";
import { useAdminAction } from "./admin-client";
import { cn } from "@/lib/utils";

const QUICK_REASONS = [
  "Photos are unclear or not of the actual item",
  "Price looks unrealistic",
  "Wrong category",
  "Duplicate ad",
  "Prohibited item or content",
  "Contact details in the description",
];

/** Approve / reject / feature / top-ad / delete controls for one ad. */
export function AdminAdActions({
  ad,
  compact = false,
  afterDelete,
}: {
  ad: { id: string; status: string; isFeatured: boolean; isTopAd: boolean };
  compact?: boolean;
  /** Where to go after deleting (detail page); list pages just refresh. */
  afterDelete?: string;
}) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

  const url = `/api/admin/ads/${ad.id}`;
  const size = compact ? "sm" : "md";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ad.status !== "ACTIVE" && ad.status !== "SOLD" && (
        <Button size={size} variant="success" loading={pending} onClick={() => run(url, "PATCH", { action: "approve" }, "Ad approved")}>
          <Check className="size-4" /> Approve
        </Button>
      )}
      {ad.status !== "REJECTED" && (
        <Button size={size} variant="outline" onClick={() => setRejectOpen(true)}>
          <X className="size-4" /> Reject
        </Button>
      )}
      {ad.status === "ACTIVE" && (
        <>
          <Button
            size={size}
            variant="outline"
            aria-pressed={ad.isFeatured}
            className={cn(ad.isFeatured && "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200")}
            onClick={() => run(url, "PATCH", { action: "feature", value: !ad.isFeatured }, ad.isFeatured ? "Removed from featured" : "Marked as featured")}
          >
            <Star className={cn("size-4", ad.isFeatured && "fill-current")} /> {ad.isFeatured ? "Featured" : "Feature"}
          </Button>
          <Button
            size={size}
            variant="outline"
            aria-pressed={ad.isTopAd}
            className={cn(ad.isTopAd && "border-accent-300 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-950/40 dark:text-accent-200")}
            onClick={() => run(url, "PATCH", { action: "top", value: !ad.isTopAd }, ad.isTopAd ? "Removed Top ad" : "Marked as Top ad")}
          >
            <TrendingUp className="size-4" /> {ad.isTopAd ? "Top ad" : "Make top ad"}
          </Button>
        </>
      )}
      <Button
        size={compact ? "icon-sm" : "icon"}
        variant="ghost"
        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => setDeleteOpen(true)}
        aria-label="Delete ad"
        title="Delete ad"
      >
        <Trash2 className="size-4" />
      </Button>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject ad"
        footer={
          <Button
            variant="danger"
            className="w-full"
            loading={pending}
            disabled={reason.trim().length < 3}
            onClick={async () => {
              const res = await run(url, "PATCH", { action: "reject", reason }, "Ad rejected");
              if (res.ok) setRejectOpen(false);
            }}
          >
            Reject ad
          </Button>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">The seller will see this reason and can edit the ad to resubmit it.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
              {r}
            </button>
          ))}
        </div>
        <Field label="Reason" htmlFor="reject-reason">
          <Textarea id="reject-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </Field>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        size="sm"
        title="Delete ad permanently?"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={pending}
              onClick={async () => {
                const res = await run(url, "DELETE", undefined, "Ad deleted");
                if (res.ok) {
                  setDeleteOpen(false);
                  if (afterDelete) router.push(afterDelete);
                }
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">The ad, its photos, chats and reports will be removed. This can&apos;t be undone.</p>
      </Modal>
    </div>
  );
}
