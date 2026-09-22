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
    const role   = searchParams.get("role");
    const search = searchParams.get("search") || "";
    const { page, limit, skip } = getPagination(req, 10);

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name:  { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, suspended: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return ok(pagedResponse(users, total, page, limit));
  } catch (e) { console.error(e); return serverError(); }
}
