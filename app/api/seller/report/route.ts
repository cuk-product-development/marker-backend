export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (!store) return badRequest("No store found");

    const items = await prisma.orderItem.findMany({
      where: { storeId: store.id, order: { status: { not: "CANCELLED" } } },
      include: {
        product: { select: { id: true, name: true } },
        order: { select: { id: true, status: true, createdAt: true } },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    const totalRevenue = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const totalOrders = new Set(items.map((i) => i.orderId)).size;

    return ok({ totalRevenue, totalOrders, items });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
