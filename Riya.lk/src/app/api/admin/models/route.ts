import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { vehicleModelSchema } from "@/lib/validations";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { slugify } from "@/lib/slug";

/** POST /api/admin/models — add a model to a brand. */
export const POST = handler(async (req: Request) => {
  await requireAdminApi();
  const data = await parseBody(req, vehicleModelSchema);
  const slug = slugify(data.name);
  if (!slug) throw new ApiError(400, "validationFailed", { name: "invalidSlug" });
  try {
    const model = await prisma.vehicleModel.create({ data: { ...data, slug } });
    return NextResponse.json(model, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError(409, "modelExists", { name: "modelExists" });
    throw err;
  }
});
