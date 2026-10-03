import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { handler, parseBody } from "@/lib/api";
import { profileSchema } from "@/lib/validations";

/** PATCH /api/profile — update name and location. */
export const PATCH = handler(async (req: Request) => {
  const user = await requireApiUser();
  const data = await parseBody(req, profileSchema);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name, district: data.district, city: data.district ? data.city : null },
    select: { id: true, name: true, district: true, city: true },
  });
  return NextResponse.json(updated);
});
