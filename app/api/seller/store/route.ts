export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, notFound, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({
      where: { sellerId: auth.userId },
      include: { _count: { select: { products: true } } },
    });
    if (!store) return notFound("Store not found");
    return ok(store);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const existing = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (existing) return badRequest("You already have a store");

    const body = await req.json();
    const { name, description } = body;
    if (!name) return badRequest("Store name is required");

    const store = await prisma.store.create({
      data: { sellerId: auth.userId, name, description },
    });
    return created(store);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (!store) return notFound("Store not found");

    const body = await req.json();
    const { name, description } = body;

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { name, description },
    });
    return ok(updated);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
