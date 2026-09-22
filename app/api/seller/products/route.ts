export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";
import { getPagination, pagedResponse } from "@/lib/paginate";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (!store) return badRequest("Create a store first");

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const { page, limit, skip } = getPagination(req, 10);

    const where: Record<string, unknown> = { storeId: store.id };
    if (status) where.status = status;
    if (search) where.name = { contains: search };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return ok(pagedResponse(products, total, page, limit));
  } catch (e) { console.error(e); return serverError(); }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (!store) return badRequest("Create a store first");
    if (store.status !== "APPROVED") return badRequest("Store must be approved before adding products");

    const body = await req.json();
    const { name, description, price, stock, imageUrl } = body;
    if (!name || price === undefined) return badRequest("name and price are required");
    if (Number(price) < 0)  return badRequest("Price must be non-negative");
    if (Number(stock) < 0)  return badRequest("Stock must be non-negative");

    const product = await prisma.product.create({
      data: { storeId: store.id, name, description, price: Number(price), stock: Number(stock) || 0, imageUrl },
    });
    return created(product);
  } catch (e) { console.error(e); return serverError(); }
}
