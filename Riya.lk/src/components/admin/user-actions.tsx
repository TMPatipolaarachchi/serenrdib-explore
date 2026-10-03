"use client";

import { useState } from "react";
import { Ban, CirclePause, CirclePlay, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useAdminAction } from "./admin-client";
import { cn } from "@/lib/utils";

type Dialog = "suspend" | "ban" | "delete" | null;

/** Suspend / ban / reactivate / delete a user. */
export function AdminUserActions({ user }: { user: { id: string; name: string; email: string; status: string } }) {
  const { run, pending } = useAdminAction();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const url = `/api/admin/users/${user.id}`;

  const close = () => {
    setDialog(null);
    setReason("");
    setConfirmText("");
  };

  async function submit() {
    const result =
      dialog === "suspend"
        ? await run(url, "PATCH", { action: "suspend", days, reason }, `${user.name} suspended for ${days} days`)
        : dialog === "ban"
          ? await run(url, "PATCH", { action: "ban", reason }, `${user.name} banned`)
          : await run(url, "DELETE", undefined, `${user.name} deleted`);
    if (result.ok) close();
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {user.status === "ACTIVE" ? (
        <>
          <Button size="sm" variant="outline" onClick={() => setDialog("suspend")}>
            <CirclePause className="size-4" /> Suspend
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 dark:text-red-400" onClick={() => setDialog("ban")}>
            <Ban className="size-4" /> Ban
          </Button>
        </>
      ) : (
        <Button size="sm" variant="success" loading={pending} onClick={() => run(url, "PATCH", { action: "activate" }, `${user.name} reactivated`)}>
          <CirclePlay className="size-4" /> Reactivate
        </Button>
      )}
      <Button
        size="icon-sm"
        variant="ghost"
        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => setDialog("delete")}
        aria-label={`Delete ${user.name}`}
        title="Delete user"
      >
        <Trash2 className="size-4" />
      </Button>

      <Modal
        open={dialog !== null}
        onClose={close}
        title={dialog === "suspend" ? `Suspend ${user.name}` : dialog === "ban" ? `Ban ${user.name}` : `Delete ${user.name}?`}
        footer={
          <Button
            variant={dialog === "suspend" ? "secondary" : "danger"}
            className="w-full"
            loading={pending}
            disabled={dialog === "delete" && confirmText !== "DELETE"}
            onClick={submit}
          >
            {dialog === "suspend" ? `Suspend for ${days} days` : dialog === "ban" ? "Ban user" : "Delete permanently"}
          </Button>
        }
      >
        {dialog === "suspend" && (
          <div className="space-y-4">
            <Field label="Duration">
              <div className="flex flex-wrap gap-2">
                {[1, 3, 7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={cn(
                      "rounded-xl border px-3.5 py-2 text-sm font-semibold",
                      days === d ? "border-brand-800 bg-brand-900 text-white dark:bg-brand-600" : "border-border hover:bg-muted",
                    )}
                  >
                    {d} day{d > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Reason (internal note)" optionalLabel="optional">
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            </Field>
          </div>
        )}
        {dialog === "ban" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">The user can no longer log in and all their live or pending ads are taken down.</p>
            <Field label="Reason (internal note)" optionalLabel="optional">
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            </Field>
          </div>
        )}
        {dialog === "delete" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This permanently deletes <strong>{user.email}</strong> with all their ads, photos, chats and favourites. It can&apos;t be undone.
              Consider banning instead.
            </p>
            <Field label='Type "DELETE" to confirm'>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
