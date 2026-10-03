import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, notFound, parseBody } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-auth";
import { adminReportActionSchema } from "@/lib/validations";

/**
 * PATCH /api/admin/reports/:id
 *   { action: "resolve" | "dismiss", note? }
 *   { action: "remove_ad", note? } → takes the ad down and resolves every open report on it
 */
export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdminApi();
  const { id } = await ctx.params;
  const { action, note } = await parseBody(req, adminReportActionSchema);

  const report = await prisma.report.findUnique({ where: { id }, select: { adId: true, reason: true } });
  if (!report) throw notFound();
  const now = new Date();

  if (action === "remove_ad") {
    await prisma.$transaction([
      prisma.ad.update({
        where: { id: report.adId },
        data: {
          status: "REJECTED",
          rejectionReason: note ?? `Removed after a report (${report.reason.toLowerCase().replace("_", " ")})`,
          isFeatured: false,
          isTopAd: false,
        },
      }),
      prisma.report.updateMany({
        where: { adId: report.adId, status: "OPEN" },
        data: { status: "RESOLVED", adminNote: note, resolvedAt: now },
      }),
    ]);
  } else {
    await prisma.report.update({
      where: { id },
      data: { status: action === "resolve" ? "RESOLVED" : "DISMISSED", adminNote: note, resolvedAt: now },
    });
  }

  return NextResponse.json({ ok: true });
});
