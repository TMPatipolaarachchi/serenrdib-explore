import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { categorySchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/prisma-errors";

/** POST /api/admin/categories — create a category or subcategory. */
export const POST = handler(async (req: Request) => {
  await requireAdminApi();
  const data = await parseBody(req, categorySchema);

  // Only two levels: a subcategory's parent must be a top-level category.
  if (data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { parentId: true } });
    if (!parent || parent.parentId) throw new ApiError(400, "validationFailed", { parentId: "invalidOption" });
  }

  try {
    const category = await prisma.category.create({ data });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError(409, "slugTaken", { slug: "slugTaken" });
    throw err;
  }
});
