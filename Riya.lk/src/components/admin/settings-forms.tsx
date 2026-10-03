"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { adminUpload, useAdminAction } from "./admin-client";

export interface SettingsValues {
  siteName: string;
  tagline: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  autoApproveAds: boolean;
}

/** Picks an image file and uploads it, reporting the stored URL. */
function ImagePicker({ folder, onUploaded, children }: { folder: "banners" | "branding"; onUploaded: (url: string, publicId: string | null) => void; children: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" loading={busy} onClick={() => input.current?.click()}>
        {!busy && <ImagePlus className="size-4" />} {children}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const { url, publicId } = await adminUpload(file, folder);
            onUploaded(url, publicId);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const { run, pending } = useAdminAction();
  const [v, setV] = useState(initial);
  const set = (patch: Partial<SettingsValues>) => setV((s) => ({ ...s, ...patch }));
  const text = (key: keyof SettingsValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label}>
      <Input value={v[key] as string} onChange={(e) => set({ [key]: e.target.value } as Partial<SettingsValues>)} {...props} />
    </Field>
  );

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        run("/api/admin/settings", "PUT", v, "Settings saved");
      }}
    >
      <section className="space-y-4">
        <h3 className="font-semibold">Branding</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("siteName", "Site name", { required: true })}
          {text("tagline", "Tagline")}
        </div>
        <Field label="Logo" hint="Shown in the header and footer. A wide PNG/WebP with a transparent background works best.">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex h-14 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
              {v.logoUrl ? (
                <Image src={v.logoUrl} alt="Logo" fill sizes="160px" className="object-contain p-2" />
              ) : (
                <span className="text-xs text-muted-foreground">Default logo</span>
              )}
            </div>
            <ImagePicker folder="branding" onUploaded={(url) => set({ logoUrl: url })}>
              Upload logo
            </ImagePicker>
            {v.logoUrl && (
              <Button variant="ghost" size="sm" onClick={() => set({ logoUrl: "" })}>
                Use default
              </Button>
            )}
          </div>
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Contact information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("contactEmail", "Email", { type: "email" })}
          {text("contactPhone", "Phone")}
          {text("whatsappNumber", "WhatsApp number")}
          {text("address", "Address")}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Social links</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("facebookUrl", "Facebook URL", { type: "url", placeholder: "https://facebook.com/…" })}
          {text("instagramUrl", "Instagram URL", { type: "url", placeholder: "https://instagram.com/…" })}
          {text("youtubeUrl", "YouTube URL", { type: "url", placeholder: "https://youtube.com/…" })}
          {text("tiktokUrl", "TikTok URL", { type: "url", placeholder: "https://tiktok.com/@…" })}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Moderation</h3>
        <Checkbox
          id="auto-approve"
          label="Publish new and edited ads immediately (skip admin approval)"
          checked={v.autoApproveAds}
          onChange={(e) => set({ autoApproveAds: e.target.checked })}
        />
        <p className="text-xs text-muted-foreground">Recommended: leave off so every ad is reviewed before it goes live.</p>
      </section>

      <Button type="submit" variant="secondary" loading={pending}>
        Save settings
      </Button>
    </form>
  );
}

export interface AdminBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  publicId: string | null;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

type BannerDraft = Omit<AdminBanner, "id"> & { id?: string };

export function BannerManager({ banners }: { banners: AdminBanner[] }) {
  const { run, pending } = useAdminAction();
  const [draft, setDraft] = useState<BannerDraft | null>(null);
  const set = (patch: Partial<BannerDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  async function save() {
    if (!draft) return;
    const { id, ...body } = draft;
    const res = id
      ? await run(`/api/admin/banners/${id}`, "PATCH", body, "Banner saved")
      : await run("/api/admin/banners", "POST", body, "Banner added");
    if (res.ok) setDraft(null);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          onClick={() =>
            setDraft({ title: "", subtitle: "", imageUrl: "", publicId: null, linkUrl: "", isActive: true, sortOrder: banners.length })
          }
        >
          <Plus className="size-4" /> Add banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No banners yet. Banners appear on the homepage below the categories.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {banners.map((b) => (
            <li key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[16/5] bg-muted">
                <Image src={b.imageUrl} alt={b.title ?? ""} fill sizes="400px" className="object-cover" />
              </div>
              <div className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.title || "Untitled banner"}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.linkUrl || "No link"}</p>
                </div>
                {b.isActive ? <Badge tone="success">live</Badge> : <Badge tone="warning">hidden</Badge>}
                <Button size="icon-sm" variant="ghost" aria-label="Edit banner" onClick={() => setDraft({ ...b })}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-600 dark:text-red-400"
                  aria-label="Delete banner"
                  onClick={() => run(`/api/admin/banners/${b.id}`, "DELETE", undefined, "Banner deleted")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id ? "Edit banner" : "Add banner"}
        footer={
          <Button className="w-full" variant="secondary" loading={pending} disabled={!draft?.imageUrl} onClick={save}>
            Save banner
          </Button>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="relative flex aspect-[16/5] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
              {draft.imageUrl ? (
                <Image src={draft.imageUrl} alt="" fill sizes="600px" className="object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">Recommended size 1600 × 500</span>
              )}
            </div>
            <ImagePicker folder="banners" onUploaded={(url, publicId) => set({ imageUrl: url, publicId })}>
              {draft.imageUrl ? "Replace image" : "Upload image"}
            </ImagePicker>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" optionalLabel="optional">
                <Input value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
              </Field>
              <Field label="Link" optionalLabel="optional">
                <Input value={draft.linkUrl ?? ""} onChange={(e) => set({ linkUrl: e.target.value })} placeholder="/category/cars or https://…" />
              </Field>
              <Field label="Subtitle" optionalLabel="optional" className="sm:col-span-2">
                <Input value={draft.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} />
              </Field>
              <Field label="Order">
                <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })} />
              </Field>
              <div className="flex items-end pb-2">
                <Checkbox id="banner-active" label="Show on homepage" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
