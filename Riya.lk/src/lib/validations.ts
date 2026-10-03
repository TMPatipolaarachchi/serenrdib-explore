/**
 * Zod schemas shared by the browser (react-hook-form) and the API routes.
 *
 * Error messages are *translation keys* (see `errors` in src/lib/i18n/dictionaries),
 * so the UI can show them in Sinhala, English or Tamil.
 */
import { z } from "zod";
import {
  CATEGORY_TYPES,
  CONDITIONS,
  FUEL_TYPES,
  MAX_AD_IMAGES,
  MAX_PRICE,
  MIN_YEAR,
  REPORT_REASONS,
  TRANSMISSIONS,
  currentYear,
} from "./constants";
import { isValidLocation } from "./data/locations";
import { normalizeSriLankanPhone } from "./utils";

// -----------------------------------------------------------------------------
// Small building blocks
// -----------------------------------------------------------------------------

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

/** Optional integer that accepts form strings ("1,500,000") and empty values. */
const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return null;
      if (typeof v === "string") return Number(v.replace(/[,\s]/g, ""));
      return v;
    },
    z.number({ error: "invalidNumber" }).int("invalidNumber").min(min, message).max(max, message).nullable(),
  );

/** Optional trimmed string; empty strings become null. */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : (v ?? null)),
    z.string().trim().max(max, "tooLong").nullable(),
  );

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToNull, z.enum(values, { error: "invalidOption" }).nullable());

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("invalidEmail"));

export const passwordSchema = z
  .string()
  .min(8, "passwordMin")
  .max(100, "tooLong")
  .regex(/[A-Za-z]/, "passwordWeak")
  .regex(/\d/, "passwordWeak");

/** Sri Lankan mobile number, normalised to +947XXXXXXXX. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "required")
  .transform((v, ctx) => {
    const normalized = normalizeSriLankanPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "invalidPhone" });
      return z.NEVER;
    }
    return normalized;
  });

// -----------------------------------------------------------------------------
// Auth & profile
// -----------------------------------------------------------------------------

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "nameMin").max(60, "tooLong"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "required"),
});

export const sendOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "invalidCode"),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "nameMin").max(60, "tooLong"),
    district: optionalText(40),
    city: optionalText(60),
  })
  .refine((d) => !d.district || !d.city || isValidLocation(d.district, d.city), {
    path: ["city"],
    message: "selectCity",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  });

// -----------------------------------------------------------------------------
// Ads
// -----------------------------------------------------------------------------

export const adImageSchema = z.object({
  url: z.string().min(1).max(500),
  publicId: z.string().max(300).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export type AdImageInput = z.infer<typeof adImageSchema>;

/**
 * Ad create/edit schema. `categoryType` is supplied by the form for instant
 * feedback, but the API always overwrites it with the value from the database.
 */
export const adSchema = z
  .object({
    categoryId: z.string().min(1, "selectCategory"),
    categoryType: z.enum(CATEGORY_TYPES),
    title: z.string().trim().min(5, "titleMin").max(100, "titleMax"),
    description: z.string().trim().min(20, "descriptionMin").max(5000, "descriptionMax"),
    price: optionalInt(0, MAX_PRICE, "invalidPrice"),
    negotiable: z.boolean().default(false),
    condition: optionalEnum(CONDITIONS),
    brandId: z.preprocess(emptyToNull, z.string().nullable()),
    modelId: z.preprocess(emptyToNull, z.string().nullable()),
    modelText: optionalText(60),
    year: optionalInt(MIN_YEAR, currentYear() + 1, "invalidYear"),
    mileage: optionalInt(0, 3_000_000, "invalidMileage"),
    fuelType: optionalEnum(FUEL_TYPES),
    transmission: optionalEnum(TRANSMISSIONS),
    engineCapacity: optionalInt(0, 50_000, "invalidNumber"),
    partNumber: optionalText(60),
    compatibility: optionalText(300),
    district: z.string().min(1, "selectDistrict"),
    city: z.string().min(1, "selectCity"),
    contactName: optionalText(60),
    contactPhone: phoneSchema,
    images: z.array(adImageSchema).max(MAX_AD_IMAGES, "maxPhotos"),
  })
  .superRefine((d, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    if (d.district && d.city && !isValidLocation(d.district, d.city)) issue("city", "selectCity");

    // Services may be "price on request"; everything else needs a price.
    if (d.categoryType !== "SERVICE" && d.price == null) issue("price", "required");
    if (d.categoryType !== "SERVICE" && !d.condition) issue("condition", "required");
    if (d.categoryType === "VEHICLE" && !d.year) issue("year", "required");
    if (d.categoryType !== "SERVICE" && d.images.length === 0) issue("images", "atLeastOnePhoto");
  });

export type AdFormInput = z.input<typeof adSchema>;
export type AdFormData = z.output<typeof adSchema>;

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS, { error: "required" }),
  details: optionalText(1000),
});

// -----------------------------------------------------------------------------
// Chat
// -----------------------------------------------------------------------------

export const messageSchema = z.object({
  body: z.string().trim().min(1, "required").max(2000, "tooLong"),
});

export const startConversationSchema = z.object({
  adId: z.string().min(1),
  body: z.string().trim().min(1, "required").max(2000, "tooLong"),
});

// -----------------------------------------------------------------------------
// Admin
// -----------------------------------------------------------------------------

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "required").max(50),
  password: z.string().min(1, "required").max(200),
});

/** Admin passwords are stricter than user passwords. */
export const adminPasswordSchema = z
  .string()
  .min(10, "adminPasswordMin")
  .max(200, "tooLong")
  .regex(/[a-z]/, "adminPasswordWeak")
  .regex(/[A-Z]/, "adminPasswordWeak")
  .regex(/\d/, "adminPasswordWeak")
  .regex(/[^A-Za-z0-9]/, "adminPasswordWeak");

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "required"),
    newPassword: adminPasswordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "passwordSameAsOld",
  });

export const adminAdActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3, "required").max(500) }),
  z.object({ action: z.literal("feature"), value: z.boolean() }),
  z.object({ action: z.literal("top"), value: z.boolean() }),
]);

export const adminUserActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    days: z.number().int().min(1).max(365),
    reason: optionalText(300),
  }),
  z.object({ action: z.literal("ban"), reason: optionalText(300) }),
  z.object({ action: z.literal("activate") }),
]);

export const adminReportActionSchema = z.object({
  action: z.enum(["resolve", "dismiss", "remove_ad"]),
  note: optionalText(500),
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalidSlug");

export const categorySchema = z.object({
  nameEn: z.string().trim().min(2, "required").max(60),
  nameSi: z.string().trim().min(1, "required").max(60),
  nameTa: z.string().trim().min(1, "required").max(60),
  slug: slugSchema,
  type: z.enum(CATEGORY_TYPES),
  icon: z.string().trim().min(1).max(30),
  parentId: z.preprocess(emptyToNull, z.string().nullable()),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, "required").max(60),
  slug: slugSchema,
  categoryIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const vehicleModelSchema = z.object({
  name: z.string().trim().min(1, "required").max(60),
  brandId: z.string().min(1),
  categoryId: z.preprocess(emptyToNull, z.string().nullable()),
  isActive: z.boolean().default(true),
});

const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : (v ?? null)),
  z.string().trim().max(500).nullable(),
);

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "required").max(60),
  tagline: optionalText(120),
  logoUrl: optionalUrl,
  contactEmail: z.preprocess(emptyToNull, z.email("invalidEmail").nullable()),
  contactPhone: optionalText(30),
  whatsappNumber: optionalText(30),
  address: optionalText(200),
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  autoApproveAds: z.boolean(),
});

export const bannerSchema = z.object({
  title: optionalText(80),
  subtitle: optionalText(160),
  imageUrl: z.string().min(1, "required").max(500),
  publicId: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  linkUrl: optionalUrl,
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
