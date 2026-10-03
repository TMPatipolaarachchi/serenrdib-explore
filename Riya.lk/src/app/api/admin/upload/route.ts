import { NextResponse } from "next/server";
import { ApiError, handler } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { storeImage } from "@/lib/upload";

/** POST /api/admin/upload (multipart: file, folder=banners|branding) — logo & banner images. */
export const POST = handler(async (req: Request) => {
  await requireAdminApi();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = form?.get("folder") === "branding" ? "branding" : "banners";
  if (!(file instanceof File)) throw new ApiError(400, "invalidImage");
  return NextResponse.json(await storeImage(file, folder), { status: 201 });
});
