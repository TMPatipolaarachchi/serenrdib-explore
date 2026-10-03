/**
 * Validation & normalisation for creating/updating ads (used by the API routes).
 */
import "server-only";
import { prisma } from "./prisma";
import { ApiError, badRequest, zodFieldErrors } from "./api";
import { adSchema, type AdFormData } from "./validations";
import { isAllowedImageUrl } from "./upload";
import type { User } from "@/generated/prisma/client";

export interface PreparedAd {
  data: Omit<AdFormData, "images" | "categoryType">;
  images: AdFormData["images"];
}

/**
 * Validates the raw request body against the ad schema *using the category's
 * real type from the database*, checks brand/model/image references, and clears
 * fields that don't apply to the category type.
 */
export async function prepareAdInput(body: unknown, user: User): Promise<PreparedAd> {
  if (!body || typeof body !== "object") throw badRequest("invalidJson");
  const raw = body as Record<string, unknown>;

  const category = await prisma.category.findFirst({
    where: { id: String(raw.categoryId ?? ""), isActive: true },
    select: { id: true, type: true, _count: { select: { children: { where: { isActive: true } } } } },
  });
  if (!category) throw badRequest("validationFailed", { categoryId: "selectCategory" });
  // Ads must be posted in the most specific category (e.g. "Engine Parts", not "Vehicle Parts").
  if (category._count.children > 0) throw badRequest("validationFailed", { categoryId: "selectCategory" });

  // The contact number is always the seller's verified phone.
  const parsed = adSchema.safeParse({ ...raw, categoryType: category.type, contactPhone: user.phone ?? "" });
  if (!parsed.success) throw badRequest("validationFailed", zodFieldErrors(parsed.error));
  const { images, categoryType: type, ...data } = parsed.data;

  // Brand / model must exist and belong together.
  if (data.brandId) {
    const brand = await prisma.brand.findFirst({ where: { id: data.brandId, isActive: true }, select: { id: true } });
    if (!brand) throw badRequest("validationFailed", { brandId: "invalidOption" });
  }
  if (data.modelId) {
    const model = await prisma.vehicleModel.findFirst({
      where: { id: data.modelId, brandId: data.brandId ?? "__none__" },
      select: { id: true },
    });
    if (!model) throw badRequest("validationFailed", { modelId: "invalidOption" });
    data.modelText = null;
  }

  for (const image of images) {
    if (!isAllowedImageUrl(image.url)) throw badRequest("validationFailed", { images: "invalidImage" });
  }

  // Clear fields that don't apply to this kind of ad.
  if (type === "VEHICLE") {
    data.partNumber = null;
    data.compatibility = null;
  }
  if (type === "PART" || type === "ACCESSORY") {
    data.year = null;
    data.mileage = null;
    data.fuelType = null;
    data.transmission = null;
    data.engineCapacity = null;
  }
  if (type === "SERVICE") {
    Object.assign(data, {
      condition: null,
      brandId: null,
      modelId: null,
      modelText: null,
      year: null,
      mileage: null,
      fuelType: null,
      transmission: null,
      engineCapacity: null,
      partNumber: null,
      compatibility: null,
    });
  }

  return { data, images };
}

/** Sellers must verify their phone number (OTP) before posting. */
export function assertCanPost(user: User) {
  if (!user.phone || !user.phoneVerifiedAt) throw new ApiError(403, "phoneNotVerified");
}
