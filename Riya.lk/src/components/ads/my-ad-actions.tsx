"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useErrorText, useI18n } from "@/lib/i18n/client";

/** View / Edit / Mark as sold / Delete buttons on a "My ads" row. */
export function MyAdActions({ id, slug, status }: { id: string; slug: string; status: string }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();
  const [confirm, setConfirm] = useState<"sold" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res =
        confirm === "sold"
          ? await fetch(`/api/ads/${id}/sold`, { method: "POST" })
          : await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
      toast.success(confirm === "sold" ? t.myAds.markedSold : t.myAds.deleted);
      setConfirm(null);
      router.refresh();
    } catch (err) {
      toast.error(errorText(err instanceof Error ? err.message : "") ?? t.errors.serverError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/ads/${slug}`} className={buttonClass({ variant: "outline", size: "sm" })}>
        <Eye className="size-4" /> {t.myAds.view}
      </Link>
      {status !== "SOLD" && (
        <Link href={`/my-ads/${id}/edit`} className={buttonClass({ variant: "outline", size: "sm" })}>
          <Pencil className="size-4" /> {t.common.edit}
        </Link>
      )}
      {status === "ACTIVE" && (
        <Button variant="success" size="sm" onClick={() => setConfirm("sold")}>
          <CircleCheck className="size-4" /> {t.myAds.markSold}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => setConfirm("delete")}
      >
        <Trash2 className="size-4" /> {t.common.delete}
      </Button>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm === "sold" ? t.myAds.markSold : t.common.delete}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>
              {t.common.cancel}
            </Button>
            <Button variant={confirm === "sold" ? "success" : "danger"} className="flex-1" loading={busy} onClick={run}>
              {t.common.confirm}
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground">{confirm === "sold" ? t.myAds.confirmMarkSold : t.myAds.confirmDelete}</p>
      </Modal>
    </div>
  );
}
