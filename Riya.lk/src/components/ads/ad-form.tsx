"use client";

/**
 * Create / edit ad form.
 *
 * Step 1 — pick a category (and subcategory). The rest of the form adapts to
 * the category type:
 *   VEHICLE   → brand, model, year, mileage, fuel, transmission, engine
 *   PART      → compatible vehicle brand/model, part number, compatibility
 *   ACCESSORY → like parts
 *   SERVICE   → no condition/brand; price is optional ("price on request")
 *
 * Validation uses the same Zod schema as the API (src/lib/validations.ts).
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CircleCheck, Info, Pencil } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { ImageUploader } from "./image-uploader";
import { Button, buttonClass } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { useErrorText, useI18n } from "@/lib/i18n/client";
import { categoryName, fmt } from "@/lib/i18n/config";
import { useCatalog } from "@/lib/use-catalog";
import { DISTRICTS, citySlug, getDistrict } from "@/lib/data/locations";
import { CONDITIONS, FUEL_TYPES, MAX_AD_IMAGES, TRANSMISSIONS, currentYear, type CategoryType } from "@/lib/constants";
import { adSchema, type AdFormData, type AdFormInput } from "@/lib/validations";
import { cn, formatPhone } from "@/lib/utils";

export interface FormCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  type: CategoryType;
  icon: string;
  children: Omit<FormCategory, "children">[];
}

const OTHER = "__other__";

export function AdForm({
  mode,
  adId,
  categories,
  initial,
  user,
}: {
  mode: "create" | "edit";
  adId?: string;
  categories: FormCategory[];
  initial?: Partial<AdFormInput>;
  user: { name: string; phone: string; district: string | null; city: string | null };
}) {
  const { t, locale } = useI18n();
  const errorText = useErrorText();
  const router = useRouter();
  const [done, setDone] = useState<{ slug: string; status: string } | null>(null);

  const allCategories = categories.flatMap((c) => [c, ...c.children]);
  const initialCategory = allCategories.find((c) => c.id === initial?.categoryId);
  const [parentId, setParentId] = useState<string | null>(
    initialCategory ? (categories.find((c) => c.id === initialCategory.id || c.children.some((ch) => ch.id === initialCategory.id))?.id ?? null) : null,
  );
  const [modelOther, setModelOther] = useState(Boolean(initial?.modelText && !initial?.modelId));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<AdFormInput, unknown, AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      categoryId: "",
      categoryType: "VEHICLE",
      title: "",
      description: "",
      price: "",
      negotiable: false,
      condition: "",
      brandId: "",
      modelId: "",
      modelText: "",
      year: "",
      mileage: "",
      fuelType: "",
      transmission: "",
      engineCapacity: "",
      partNumber: "",
      compatibility: "",
      district: user.district ?? "",
      city: user.district ? (user.city ?? "") : "",
      contactName: user.name,
      images: [],
      ...initial,
      contactPhone: user.phone,
    },
  });

  const [categoryId, brandId, district, condition, modelId] = useWatch({
    control,
    name: ["categoryId", "brandId", "district", "condition", "modelId"],
  }) as string[];
  const category = allCategories.find((c) => c.id === categoryId);
  const type = category?.type;
  const parent = categories.find((c) => c.id === parentId);

  const brands = useCatalog(category && type !== "SERVICE" ? `/api/catalog/brands?categoryId=${category.id}` : null);
  const models = useCatalog(brandId && category ? `/api/catalog/models?brandId=${brandId}&categoryId=${category.id}` : null);
  const cities = getDistrict(district)?.cities ?? [];

  const err = (name: keyof AdFormInput) => errorText(errors[name]?.message as string | undefined);

  function chooseCategory(c: Omit<FormCategory, "children">) {
    setValue("categoryId", c.id, { shouldValidate: isSubmitted });
    setValue("categoryType", c.type);
    setValue("brandId", "");
    setValue("modelId", "");
    setValue("modelText", "");
    setModelOther(false);
  }

  async function onSubmit(values: AdFormData) {
    const res = await fetch(mode === "create" ? "/api/ads" : `/api/ads/${adId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors as Record<string, string>)) {
          setError(field as keyof AdFormInput, { message });
        }
        toast.error(t.postAd.fixErrors);
      } else {
        toast.error(errorText(data.error) ?? t.errors.serverError);
      }
      return;
    }

    if (mode === "edit") {
      toast.success(t.common.saveChanges);
      router.push("/my-ads");
      router.refresh();
    } else {
      setDone({ slug: data.slug, status: data.status });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ------------------------------------------------------------------ success
  if (done) {
    const live = done.status === "ACTIVE";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="mx-auto max-w-lg p-8 text-center sm:p-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
            className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          >
            <CircleCheck className="size-10" />
          </motion.div>
          <h2 className="mt-6 text-2xl font-bold">{live ? t.postAd.successLive : t.postAd.successTitle}</h2>
          {!live && <p className="mt-2 text-muted-foreground">{t.postAd.successText}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {live && (
              <Link href={`/ads/${done.slug}`} className={buttonClass()}>
                {t.postAd.viewAd}
              </Link>
            )}
            <Link href="/my-ads" className={buttonClass({ variant: live ? "outline" : "primary" })}>
              {t.postAd.viewMyAds}
            </Link>
            <button type="button" onClick={() => window.location.reload()} className={buttonClass({ variant: "outline" })}>
              {t.postAd.postAnother}
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ------------------------------------------------------------------ form
  const sectionTitle = (n: number, text: string) => (
    <h2 className="mb-5 flex items-center gap-3 text-lg font-bold">
      <span className="flex size-8 items-center justify-center rounded-full bg-brand-900 text-sm text-white dark:bg-brand-600">{n}</span>
      {text}
    </h2>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error(t.postAd.fixErrors))} className="space-y-6" noValidate>
      {/* 1. Category ------------------------------------------------------ */}
      <Card className="p-5 sm:p-7">
        {sectionTitle(1, t.postAd.sectionCategory)}

        {category ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/50">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-brand-900 dark:text-brand-200">
                <CategoryIcon icon={category.icon} className="size-6" />
              </span>
              <div>
                {parent && parent.id !== category.id && <p className="text-xs text-muted-foreground">{categoryName(parent, locale)}</p>}
                <p className="font-semibold">{categoryName(category, locale)}</p>
              </div>
            </div>
            {mode === "create" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue("categoryId", "");
                  setParentId(null);
                }}
              >
                <Pencil className="size-3.5" /> {t.postAd.change}
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={parentId ?? "root"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{parent ? t.postAd.chooseSubcategory : t.postAd.chooseCategory}</p>
                {parent && (
                  <button type="button" onClick={() => setParentId(null)} className="text-sm font-semibold text-accent-600 hover:underline">
                    {t.common.back}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                {(parent ? parent.children : categories).map((c) => {
                  const hasChildren = !parent && (c as FormCategory).children?.length > 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => (hasChildren ? setParentId(c.id) : (setParentId(parent?.id ?? c.id), chooseCategory(c)))}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-center text-xs font-semibold transition hover:-translate-y-0.5 hover:border-accent-400 hover:shadow-md sm:text-sm"
                    >
                      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        <CategoryIcon icon={c.icon} className="size-6" strokeWidth={1.8} />
                      </span>
                      <span className="line-clamp-2">{categoryName(c, locale)}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        {errors.categoryId && <p className="mt-3 text-sm text-red-600">{err("categoryId")}</p>}
      </Card>

      {category && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* 2. Details ----------------------------------------------------- */}
          <Card className="space-y-5 p-5 sm:p-7">
            {sectionTitle(2, t.postAd.sectionDetails)}

            {type !== "SERVICE" && (
              <Field label={t.postAd.condition} error={err("condition")} required>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("condition", c, { shouldValidate: isSubmitted })}
                      className={cn(
                        "rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                        condition === c
                          ? "border-brand-800 bg-brand-900 text-white dark:border-brand-500 dark:bg-brand-600"
                          : "border-border bg-card hover:border-brand-300",
                      )}
                    >
                      {t.enums.condition[c]}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {type !== "SERVICE" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={type === "VEHICLE" ? t.postAd.brand : t.postAd.compatibleBrand} htmlFor="brandId" error={err("brandId")}>
                  <Select
                    id="brandId"
                    {...register("brandId", {
                      onChange: () => {
                        setValue("modelId", "");
                        setModelOther(false);
                      },
                    })}
                    disabled={!brands}
                  >
                    <option value="">{brands ? t.postAd.otherBrand : t.common.loading}</option>
                    {brands?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label={type === "VEHICLE" ? t.postAd.model : t.postAd.compatibleModel} htmlFor="modelSelect" error={err("modelId")}>
                  {brandId ? (
                    <Select
                      id="modelSelect"
                      value={modelOther ? OTHER : (modelId ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        setModelOther(v === OTHER);
                        setValue("modelId", v === OTHER ? "" : v);
                        if (v !== OTHER) setValue("modelText", "");
                      }}
                      disabled={!models}
                    >
                      <option value="">{models ? t.postAd.selectModel : t.common.loading}</option>
                      {models?.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                      <option value={OTHER}>{t.postAd.otherModel}</option>
                    </Select>
                  ) : (
                    <Input id="modelSelect" placeholder={t.postAd.modelTextPlaceholder} {...register("modelText")} />
                  )}
                </Field>

                {brandId && modelOther && (
                  <Field label={t.postAd.modelText} htmlFor="modelText" error={err("modelText")} className="sm:col-span-2">
                    <Input id="modelText" placeholder={t.postAd.modelTextPlaceholder} {...register("modelText")} autoFocus />
                  </Field>
                )}
              </div>
            )}

            <Field label={t.postAd.adTitle} htmlFor="title" error={err("title")} required>
              <Input id="title" placeholder={t.postAd.adTitlePlaceholder} maxLength={100} invalid={!!errors.title} {...register("title")} />
            </Field>

            {type === "VEHICLE" && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label={t.postAd.year} htmlFor="year" error={err("year")} required>
                  <Input id="year" inputMode="numeric" placeholder={String(currentYear() - 5)} invalid={!!errors.year} {...register("year")} />
                </Field>
                <Field label={t.postAd.mileage} htmlFor="mileage" error={err("mileage")}>
                  <Input id="mileage" inputMode="numeric" placeholder="45000" {...register("mileage")} />
                </Field>
                <Field label={t.postAd.engineCapacity} htmlFor="engineCapacity" error={err("engineCapacity")}>
                  <Input id="engineCapacity" inputMode="numeric" placeholder="1500" {...register("engineCapacity")} />
                </Field>
                <Field label={t.postAd.fuelType} htmlFor="fuelType" error={err("fuelType")}>
                  <Select id="fuelType" {...register("fuelType")}>
                    <option value="">{t.postAd.select}</option>
                    {FUEL_TYPES.map((f) => (
                      <option key={f} value={f}>
                        {t.enums.fuelType[f]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.postAd.transmission} htmlFor="transmission" error={err("transmission")}>
                  <Select id="transmission" {...register("transmission")}>
                    <option value="">{t.postAd.select}</option>
                    {TRANSMISSIONS.map((tr) => (
                      <option key={tr} value={tr}>
                        {t.enums.transmission[tr]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            {(type === "PART" || type === "ACCESSORY") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.postAd.partNumber} htmlFor="partNumber" error={err("partNumber")} optionalLabel={t.common.optional}>
                  <Input id="partNumber" {...register("partNumber")} />
                </Field>
                <Field label={t.postAd.compatibility} htmlFor="compatibility" error={err("compatibility")} optionalLabel={t.common.optional}>
                  <Input id="compatibility" placeholder={t.postAd.compatibilityPlaceholder} {...register("compatibility")} />
                </Field>
              </div>
            )}

            <Field label={t.postAd.description} htmlFor="description" error={err("description")} required>
              <Textarea
                id="description"
                rows={6}
                maxLength={5000}
                placeholder={t.postAd.descriptionPlaceholder}
                invalid={!!errors.description}
                {...register("description")}
              />
            </Field>

            <div className="grid items-end gap-4 sm:grid-cols-2">
              <Field
                label={t.postAd.price}
                htmlFor="price"
                error={err("price")}
                required={type !== "SERVICE"}
                hint={type === "SERVICE" ? t.postAd.priceServiceHint : undefined}
              >
                <Input
                  id="price"
                  inputMode="numeric"
                  placeholder={t.postAd.pricePlaceholder}
                  leading={<span className="text-sm font-semibold">Rs</span>}
                  invalid={!!errors.price}
                  {...register("price")}
                />
              </Field>
              <Checkbox id="negotiable" label={t.postAd.negotiable} className="h-11" {...register("negotiable")} />
            </div>
          </Card>

          {/* 3. Photos ------------------------------------------------------ */}
          <Card className="p-5 sm:p-7">
            {sectionTitle(3, t.postAd.sectionPhotos)}
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">{fmt(t.postAd.photosHint, { max: MAX_AD_IMAGES })}</p>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ?? []}
                  onChange={(imgs) => setValue("images", imgs, { shouldValidate: isSubmitted })}
                  invalid={!!errors.images}
                />
              )}
            />
            {errors.images && <p className="mt-3 text-sm text-red-600">{errorText(errors.images.message ?? errors.images.root?.message)}</p>}
          </Card>

          {/* 4. Location & contact ------------------------------------------ */}
          <Card className="space-y-5 p-5 sm:p-7">
            {sectionTitle(4, t.postAd.sectionLocation)}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.postAd.district} htmlFor="district" error={err("district")} required>
                <Select id="district" invalid={!!errors.district} {...register("district", { onChange: () => setValue("city", "") })}>
                  <option value="">{t.postAd.selectDistrict}</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name[locale]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.postAd.city} htmlFor="city" error={err("city")} required>
                <Select id="city" invalid={!!errors.city} disabled={!district} {...register("city")}>
                  <option value="">{t.postAd.selectCity}</option>
                  {cities.map((c) => (
                    <option key={c} value={citySlug(c)}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.postAd.contactName} htmlFor="contactName" error={err("contactName")}>
                <Input id="contactName" {...register("contactName")} />
              </Field>
              <Field
                label={t.postAd.contactPhone}
                htmlFor="contactPhone"
                hint={
                  <span className="flex items-center justify-between gap-2">
                    {t.postAd.contactPhoneHint}
                    <Link href="/verify-phone?next=/post-ad" className="shrink-0 font-semibold text-accent-600 hover:underline">
                      {t.profile.changePhone}
                    </Link>
                  </span>
                }
              >
                <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-muted px-3.5 text-[15px]">
                  <BadgeCheck className="size-4 text-emerald-600" />
                  {formatPhone(user.phone)}
                </div>
              </Field>
            </div>
          </Card>

          {mode === "edit" && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <Info className="mt-0.5 size-4 shrink-0" />
              {t.postAd.reviewNotice}
            </p>
          )}

          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 lg:bottom-0">
            <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-56" loading={isSubmitting}>
              {isSubmitting ? t.postAd.submitting : mode === "create" ? t.postAd.submit : t.postAd.update}
            </Button>
          </div>
        </motion.div>
      )}
    </form>
  );
}
