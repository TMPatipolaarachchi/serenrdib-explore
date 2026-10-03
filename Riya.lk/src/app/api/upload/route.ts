import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { ApiError, handler, tooManyRequests } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { storeImage } from "@/lib/upload";

/**
 * POST /api/upload (multipart/form-data, field "file")
 * Uploads one ad photo. The browser compresses images before sending them.
 */
export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();

  const limit = rateLimit(`upload:${user.id}`, 60, 60 * 60_000);
  if (!limit.ok) throw tooManyRequests(limit.retryAfterSeconds);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "invalidImage");

  const image = await storeImage(file, "ads");
  return NextResponse.json(image, { status: 201 });
});
