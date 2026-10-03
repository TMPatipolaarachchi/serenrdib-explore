import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { bannerSchema } from "@/lib/validations";
import { isAllowedImageUrl } from "@/lib/upload";

/** POST /api/admin/banners — add a homepage banner. */
export const POST = handler(async (req: Request) => {
  await requireAdminApi();
  const data = await parseBody(req, bannerSchema);
  if (!isAllowedImageUrl(data.imageUrl)) throw new ApiError(400, "validationFailed", { imageUrl: "invalidImage" });
  const banner = await prisma.banner.create({ data });
  return NextResponse.json(banner, { status: 201 });
});
