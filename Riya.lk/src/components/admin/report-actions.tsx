"use client";

import { useState } from "react";
import { Check, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/form";
import { useAdminAction } from "./admin-client";

type Action = "resolve" | "dismiss" | "remove_ad";

const COPY: Record<Action, { title: string; button: string; success: string; text: string }> = {
  resolve: {
    title: "Mark report as resolved",
    button: "Resolve",
    success: "Report resolved",
    text: "Use this when you've dealt with the issue another way (e.g. contacted the seller).",
  },
  dismiss: {
    title: "Dismiss report",
    button: "Dismiss",
    success: "Report dismissed",
    text: "The ad stays live. Use this when the report isn't valid.",
  },
  remove_ad: {
    title: "Take the ad down",
    button: "Remove ad",
    success: "Ad removed and reports resolved",
    text: "The ad is rejected (hidden) and every open report on it is resolved. The note is shown to the seller as the rejection reason.",
  },
};

export function AdminReportActions({ reportId }: { reportId: string }) {
  const { run, pending } = useAdminAction();
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button size="sm" variant="danger" onClick={() => setAction("remove_ad")}>
        <EyeOff className="size-4" /> Remove ad
      </Button>
      <Button size="sm" variant="outline" onClick={() => setAction("resolve")}>
        <Check className="size-4" /> Resolve
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setAction("dismiss")}>
        <X className="size-4" /> Dismiss
      </Button>

      <Modal
        open={action !== null}
        onClose={() => setAction(null)}
        title={action ? COPY[action].title : ""}
        footer={
          action && (
            <Button
              variant={action === "remove_ad" ? "danger" : "secondary"}
              className="w-full"
              loading={pending}
              onClick={async () => {
                const res = await run(`/api/admin/reports/${reportId}`, "PATCH", { action, note }, COPY[action].success);
                if (res.ok) {
                  setAction(null);
                  setNote("");
                }
              }}
            >
              {COPY[action].button}
            </Button>
          )
        }
      >
        {action && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{COPY[action].text}</p>
            <Field label="Note" optionalLabel="optional">
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
