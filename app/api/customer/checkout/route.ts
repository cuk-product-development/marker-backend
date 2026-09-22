export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { created, badRequest, serverError } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const { addressId } = await req.json();

    const cart = await prisma.cart.findUnique({
      where: { userId: auth.userId },
      include: {
        items: {
          include: {
            product: { include: { store: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) return badRequest("Cart is empty");

    // Validate all items
    for (const item of cart.items) {
      if (item.product.status !== "ACTIVE") {
        return badRequest(`Product "${item.product.name}" is no longer available`);
      }
      if (item.product.store.status !== "APPROVED") {
        return badRequest(`Store for "${item.product.name}" is not active`);
      }
      if (item.product.stock < item.quantity) {
        return badRequest(`Insufficient stock for "${item.product.name}"`);
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const shippingFee = 10000; // flat simulated shipping
    const total = subtotal + shippingFee;

    // Run in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: auth.userId,
          addressId: addressId ? parseInt(addressId) : null,
          total,
          shippingFee,
          status: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              storeId: item.product.storeId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      // Create pending payment
      await tx.payment.create({
        data: { orderId: newOrder.id, amount: total, status: "PENDING" },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return created(order);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
