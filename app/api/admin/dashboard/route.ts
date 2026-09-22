export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden();

    const [totalUsers, totalSellers, totalStores, pendingStores, totalOrders, totalProducts] =
      await Promise.all([
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.store.count(),
        prisma.store.count({ where: { status: "PENDING" } }),
        prisma.order.count(),
        prisma.product.count(),
      ]);

    return ok({ totalUsers, totalSellers, totalStores, pendingStores, totalOrders, totalProducts });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
