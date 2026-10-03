"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { adminFetch, adminMessage, useAdminAction } from "./admin-client";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";

interface VehicleCategory {
  id: string;
  nameEn: string;
}

export interface BrandFormValues {
  id?: string;
  name: string;
  slug: string;
  categoryIds: string[];
  isActive: boolean;
}

/** Brand fields — used in the "Add brand" modal and on the brand page. */
function BrandFields({
  value,
  onChange,
  categories,
  slugTouched,
  onSlugTouched,
}: {
  value: BrandFormValues;
  onChange: (v: BrandFormValues) => void;
  categories: VehicleCategory[];
  slugTouched: boolean;
  onSlugTouched: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Brand name" required>
        <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
      </Field>
      <Field label="Slug" required>
        <Input
          value={value.slug}
          onChange={(e) => {
            onSlugTouched();
            onChange({ ...value, slug: e.target.value });
          }}
        />
      </Field>
      <Field label="Shown in categories" className="sm:col-span-2" hint="Parts & accessories list every brand automatically.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => (
            <Checkbox
              key={c.id}
              id={`bc-${c.id}`}
              label={c.nameEn}
              checked={value.categoryIds.includes(c.id)}
              onChange={(e) =>
                onChange({
                  ...value,
                  categoryIds: e.target.checked ? [...value.categoryIds, c.id] : value.categoryIds.filter((id) => id !== c.id),
                })
              }
            />
          ))}
        </div>
      </Field>
      <Checkbox id="brand-active" label="Active (selectable in new ads)" checked={value.isActive} onChange={(e) => onChange({ ...value, isActive: e.target.checked })} />
    </div>
  );
}

export function AddBrandButton({ categories }: { categories: VehicleCategory[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<BrandFormValues>({ name: "", slug: "", categoryIds: [], isActive: true });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await adminFetch<{ id: string }>("/api/admin/brands", "POST", value);
    setSaving(false);
    if (!res.ok) {
      toast.error(adminMessage(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error));
      return;
    }
    toast.success("Brand created — now add its models");
    router.push(`/admin/brands/${res.data!.id}`);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add brand
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Add brand"
        footer={
          <Button className="w-full" variant="secondary" loading={saving} onClick={save}>
            Create brand
          </Button>
        }
      >
        <BrandFields value={value} onChange={setValue} categories={categories} slugTouched={slugTouched} onSlugTouched={() => setSlugTouched(true)} />
      </Modal>
    </>
  );
}

export function EditBrandForm({ brand, categories, adCount }: { brand: BrandFormValues; categories: VehicleCategory[]; adCount: number }) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [value, setValue] = useState(brand);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-5">
      <BrandFields value={value} onChange={setValue} categories={categories} slugTouched onSlugTouched={() => {}} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={pending} onClick={() => run(`/api/admin/brands/${brand.id}`, "PATCH", value, "Brand saved")}>
          Save brand
        </Button>
        <Button variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" /> Delete brand
        </Button>
      </div>
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title={`Delete ${brand.name}?`}
        footer={
          <Button
            variant="danger"
            className="w-full"
            loading={pending}
            disabled={adCount > 0}
            onClick={async () => {
              const res = await run(`/api/admin/brands/${brand.id}`, "DELETE", undefined, "Brand deleted");
              if (res.ok) router.push("/admin/brands");
            }}
          >
            Delete brand and its models
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          {adCount > 0
            ? `${adCount} ads use this brand, so it can't be deleted. Untick “Active” to hide it from new ads instead.`
            : "This also deletes all of the brand's models."}
        </p>
      </Modal>
    </div>
  );
}

export interface AdminModel {
  id: string;
  name: string;
  categoryId: string | null;
  isActive: boolean;
  adCount: number;
}

export function ModelManager({ brandId, models, categories }: { brandId: string; models: AdminModel[]; categories: VehicleCategory[] }) {
  const { run, pending } = useAdminAction();
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]?.id ?? "");
  const [editing, setEditing] = useState<AdminModel | null>(null);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.nameEn ?? "Any category";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await run("/api/admin/models", "POST", { name: newName, brandId, categoryId: newCategory || null, isActive: true }, `Added ${newName}`);
    if (res.ok) setNewName("");
  }

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="New model name, e.g. Aqua" value={newName} onChange={(e) => setNewName(e.target.value)} className="sm:flex-1" />
        <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="sm:w-52">
          <option value="">Any category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </Select>
        <Button type="submit" loading={pending} disabled={!newName.trim()}>
          <Plus className="size-4" /> Add model
        </Button>
      </form>

      {models.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No models yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {models.map((m) =>
            editing?.id === m.id ? (
              <li key={m.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="sm:flex-1" />
                <Select value={editing.categoryId ?? ""} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value || null })} className="sm:w-48">
                  <option value="">Any category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </Select>
                <Checkbox id={`m-active-${m.id}`} label="Active" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="success"
                    aria-label="Save"
                    loading={pending}
                    onClick={async () => {
                      const res = await run(
                        `/api/admin/models/${m.id}`,
                        "PATCH",
                        { name: editing.name, brandId, categoryId: editing.categoryId, isActive: editing.isActive },
                        "Model saved",
                      );
                      if (res.ok) setEditing(null);
                    }}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Cancel" onClick={() => setEditing(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </li>
            ) : (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 font-medium">{m.name}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">{catName(m.categoryId)}</span>
                <Badge>{m.adCount} ads</Badge>
                {!m.isActive && <Badge tone="warning">hidden</Badge>}
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-600 dark:text-red-400"
                  aria-label={`Delete ${m.name}`}
                  disabled={m.adCount > 0}
                  title={m.adCount > 0 ? "In use by ads — hide it instead" : "Delete"}
                  onClick={() => run(`/api/admin/models/${m.id}`, "DELETE", undefined, `Deleted ${m.name}`)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
