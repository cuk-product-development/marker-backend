export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";
import { getPagination, pagedResponse } from "@/lib/paginate";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (!store) return badRequest("Create a store first");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const { page, limit, skip } = getPagination(req, 10);

    const where: Record<string, unknown> = {
      items: { some: { storeId: store.id } },
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:  { select: { id: true, name: true, email: true } },
          items: {
            where:   { storeId: store.id },
            include: { product: { select: { id: true, name: true, imageUrl: true } } },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return ok(pagedResponse(orders, total, page, limit));
  } catch (e) { console.error(e); return serverError(); }
}
