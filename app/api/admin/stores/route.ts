export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";
import { getPagination, pagedResponse } from "@/lib/paginate";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const { page, limit, skip } = getPagination(req, 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { seller: { name: { contains: search } } },
      ];
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, email: true, suspended: true } },
          _count:  { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.store.count({ where }),
    ]);

    return ok(pagedResponse(stores, total, page, limit));
  } catch (e) { console.error(e); return serverError(); }
}
