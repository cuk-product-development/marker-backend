export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const store = await prisma.store.findFirst({
      where: { id: parseInt(params.id), status: "APPROVED" },
      include: {
        seller: { select: { id: true, name: true } },
        products: {
          where: { status: "ACTIVE", stock: { gt: 0 } },
          include: { _count: { select: { reviews: true } } },
        },
      },
    });
    if (!store) return notFound("Store not found");
    return ok(store);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
