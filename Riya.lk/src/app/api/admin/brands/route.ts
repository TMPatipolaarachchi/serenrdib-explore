import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { brandSchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/prisma-errors";

/** POST /api/admin/brands — create a brand linked to one or more categories. */
export const POST = handler(async (req: Request) => {
  await requireAdminApi();
  const { categoryIds, ...data } = await parseBody(req, brandSchema);
  try {
    const brand = await prisma.brand.create({
      data: { ...data, categories: { connect: categoryIds.map((id) => ({ id })) } },
    });
    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError(409, "slugTaken", { slug: "slugTaken" });
    throw err;
  }
});
