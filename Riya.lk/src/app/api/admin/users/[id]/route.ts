import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { adminUserActionSchema } from "@/lib/validations";
import { deleteImage } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/:id
 *   { action: "suspend", days, reason? } → can't log in until the date
 *   { action: "ban", reason? }           → permanent; their live ads are taken down
 *   { action: "activate" }               → lifts a suspension/ban
 */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const body = await parseBody(req, adminUserActionSchema);

  if (!(await prisma.user.findUnique({ where: { id }, select: { id: true } }))) throw notFound();

  if (body.action === "suspend") {
    await prisma.user.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        suspendedUntil: new Date(Date.now() + body.days * 86_400_000),
        statusReason: body.reason,
      },
    });
  } else if (body.action === "ban") {
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { status: "BANNED", suspendedUntil: null, statusReason: body.reason } }),
      prisma.ad.updateMany({
        where: { userId: id, status: { in: ["ACTIVE", "PENDING"] } },
        data: { status: "REJECTED", rejectionReason: "Seller account banned", isFeatured: false, isTopAd: false },
      }),
    ]);
  } else {
    await prisma.user.update({ where: { id }, data: { status: "ACTIVE", suspendedUntil: null, statusReason: null } });
  }

  return NextResponse.json({ ok: true });
});

/** DELETE /api/admin/users/:id — delete the account and everything it owns. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const images = await prisma.adImage.findMany({ where: { ad: { userId: id } }, select: { url: true, publicId: true } });

  const deleted = await prisma.user.deleteMany({ where: { id } });
  if (!deleted.count) throw notFound();

  await Promise.all(images.map(deleteImage));
  return NextResponse.json({ ok: true });
});
