export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const order = await prisma.order.findFirst({
      where: { id: parseInt(params.id), userId: auth.userId },
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
    });
    if (!order) return notFound("Order not found");
    return ok(order);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
