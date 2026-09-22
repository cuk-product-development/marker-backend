export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await prisma.store.findUnique({ where: { sellerId: auth.userId } });
    if (!store) return notFound("Store not found");

    const orderId = parseInt(params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { where: { storeId: store.id } } },
    });
    if (!order) return notFound("Order not found");
    if (order.items.length === 0) return forbidden();

    const { status } = await req.json();
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return badRequest(`Cannot transition from ${order.status} to ${status}`);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    return ok(updated);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
