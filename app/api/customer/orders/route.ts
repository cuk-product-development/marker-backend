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
    if (auth.role !== "CUSTOMER") return forbidden();

    const orders = await prisma.order.findMany({
      where: { userId: auth.userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
            store: { select: { id: true, name: true } },
          },
        },
        payment: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(orders);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
