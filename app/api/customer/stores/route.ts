export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const stores = await prisma.store.findMany({
      where: { status: "APPROVED" },
      include: {
        seller: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
    return ok(stores);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
