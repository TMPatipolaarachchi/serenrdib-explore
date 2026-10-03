"use client";

import { useState } from "react";
import { CornerDownRight, Pencil, Plus, Trash2 } from "lucide-react";
import { CATEGORY_ICON_KEYS, CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { useAdminAction } from "./admin-client";
import { CATEGORY_TYPES, type CategoryType } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

export interface AdminCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  type: CategoryType;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  adCount: number;
  children: Omit<AdminCategory, "children">[];
}

type FormState = Omit<AdminCategory, "id" | "adCount" | "children"> & { id?: string };

const EMPTY: FormState = {
  slug: "",
  nameEn: "",
  nameSi: "",
  nameTa: "",
  type: "VEHICLE",
  icon: "car",
  sortOrder: 0,
  isActive: true,
  parentId: null,
};

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const { run, pending } = useAdminAction();
  const [form, setForm] = useState<FormState | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [toDelete, setToDelete] = useState<Omit<AdminCategory, "children"> | null>(null);

  const open = (state: FormState) => {
    setForm(state);
    setSlugTouched(!!state.id);
  };
  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function save() {
    if (!form) return;
    const { id, ...body } = form;
    const res = id
      ? await run(`/api/admin/categories/${id}`, "PATCH", body, "Category updated")
      : await run("/api/admin/categories", "POST", body, "Category created");
    if (res.ok) setForm(null);
  }

  const row = (c: Omit<AdminCategory, "children">, child = false) => (
    <div key={c.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", child && "bg-muted/30 pl-8")}>
      {child && <CornerDownRight className="size-4 text-muted-foreground" />}
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        <CategoryIcon icon={c.icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {c.nameEn} <span className="text-xs font-normal text-muted-foreground">/{c.slug}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {c.nameSi} · {c.nameTa}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">{c.type.toLowerCase()}</Badge>
        <Badge>{c.adCount} ads</Badge>
        {!c.isActive && <Badge tone="warning">hidden</Badge>}
        <span className="text-xs text-muted-foreground">#{c.sortOrder}</span>
      </div>
      <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label={`Edit ${c.nameEn}`} onClick={() => open({ ...c })}>
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-red-600 dark:text-red-400"
          aria-label={`Delete ${c.nameEn}`}
          onClick={() => setToDelete(c)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open({ ...EMPTY, sortOrder: categories.length })}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {row(c)}
            {c.children.length > 0 && <div className="divide-y divide-border border-t border-border">{c.children.map((ch) => row(ch, true))}</div>}
            <button
              type="button"
              onClick={() => open({ ...EMPTY, parentId: c.id, type: c.type, icon: c.icon, sortOrder: c.children.length })}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 pl-8 text-sm font-medium text-brand-700 hover:bg-muted/50 dark:text-brand-300"
            >
              <Plus className="size-4" /> Add subcategory to {c.nameEn}
            </button>
          </div>
        ))}
      </div>

      {/* Create / edit */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        size="lg"
        title={form?.id ? "Edit category" : form?.parentId ? "Add subcategory" : "Add category"}
        footer={
          <Button className="w-full" variant="secondary" loading={pending} onClick={save}>
            Save category
          </Button>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)" required>
              <Input
                value={form.nameEn}
                onChange={(e) => set({ nameEn: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
              />
            </Field>
            <Field label="Slug (URL)" required hint="lowercase-with-hyphens">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: e.target.value });
                }}
              />
            </Field>
            <Field label="Name (Sinhala)" required>
              <Input value={form.nameSi} onChange={(e) => set({ nameSi: e.target.value })} />
            </Field>
            <Field label="Name (Tamil)" required>
              <Input value={form.nameTa} onChange={(e) => set({ nameTa: e.target.value })} />
            </Field>
            <Field label="Type" hint="Controls which fields the Post-ad form shows.">
              <Select value={form.type} onChange={(e) => set({ type: e.target.value as CategoryType })}>
                {CATEGORY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Parent">
              <Select value={form.parentId ?? ""} onChange={(e) => set({ parentId: e.target.value || null })}>
                <option value="">— None (top level) —</option>
                {categories
                  .filter((c) => c.id !== form.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Icon" className="sm:col-span-2">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_ICON_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    title={key}
                    onClick={() => set({ icon: key })}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border transition",
                      form.icon === key ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-950/40" : "border-border hover:bg-muted",
                    )}
                  >
                    <CategoryIcon icon={key} className="size-5" />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Sort order">
              <Input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox id="cat-active" label="Visible on the site" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title={`Delete “${toDelete?.nameEn}”?`}
        footer={
          <Button
            variant="danger"
            className="w-full"
            loading={pending}
            onClick={async () => {
              const res = await run(`/api/admin/categories/${toDelete!.id}`, "DELETE", undefined, "Category deleted");
              if (res.ok) setToDelete(null);
            }}
          >
            Delete category
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Categories with ads or subcategories can&apos;t be deleted — hide them instead by unticking “Visible on the site”.
        </p>
      </Modal>
    </>
  );
}
