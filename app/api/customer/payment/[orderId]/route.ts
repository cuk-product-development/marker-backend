export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const orderId = parseInt(params.orderId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: auth.userId },
      include: { payment: true },
    });
    if (!order) return notFound("Order not found");
    if (order.status !== "PENDING") return badRequest("Order cannot be paid at this stage");
    if (!order.payment) return badRequest("No payment record for this order");
    if (order.payment.status === "PAID") return badRequest("Already paid");

    const { simulate } = await req.json(); // "success" | "failure"
    const paymentStatus = simulate === "failure" ? "FAILED" : "PAID";

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: order.payment!.id },
        data: { status: paymentStatus },
      });

      if (paymentStatus === "PAID") {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PROCESSING" },
        });
      } else {
        // Restore stock on failed payment
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });
      }

      return p;
    });

    return ok(payment);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
