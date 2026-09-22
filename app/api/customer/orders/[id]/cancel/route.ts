export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const orderId = parseInt(params.id);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: auth.userId },
      include: { items: true },
    });
    if (!order) return notFound("Order not found");

    const cancellable = ["PENDING", "PROCESSING"];
    if (!cancellable.includes(order.status)) {
      return badRequest(`Order cannot be cancelled at status: ${order.status}`);
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    });

    return ok({ message: "Order cancelled" });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
