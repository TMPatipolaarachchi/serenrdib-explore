import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handler, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { siteSettingsSchema } from "@/lib/validations";
import { isAllowedImageUrl } from "@/lib/upload";

/** PUT /api/admin/settings — update site name, logo, contact info and ad approval mode. */
export const PUT = handler(async (req: Request) => {
  await requireAdminApi();
  const data = await parseBody(req, siteSettingsSchema);
  if (data.logoUrl && !isAllowedImageUrl(data.logoUrl)) throw new ApiError(400, "validationFailed", { logoUrl: "invalidImage" });

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return NextResponse.json(settings);
});
