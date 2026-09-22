export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
    if (!cart) return notFound("Cart not found");

    const item = await prisma.cartItem.findFirst({
      where: { id: parseInt(params.id), cartId: cart.id },
      include: { product: true },
    });
    if (!item) return notFound("Cart item not found");

    const { quantity } = await req.json();
    if (!quantity || quantity < 1) return badRequest("quantity must be >= 1");
    if (item.product.stock < quantity) return badRequest("Insufficient stock");

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
    return ok(updated);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
    if (!cart) return notFound("Cart not found");

    const item = await prisma.cartItem.findFirst({
      where: { id: parseInt(params.id), cartId: cart.id },
    });
    if (!item) return notFound("Cart item not found");

    await prisma.cartItem.delete({ where: { id: item.id } });
    return ok({ message: "Item removed" });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
