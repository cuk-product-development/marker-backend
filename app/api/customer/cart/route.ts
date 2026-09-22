export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";

async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const cart = await getOrCreateCart(auth.userId);
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: { store: { select: { id: true, name: true } } },
        },
      },
    });
    return ok({ cartId: cart.id, items });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const { productId, quantity } = await req.json();
    if (!productId || !quantity || quantity < 1) {
      return badRequest("productId and quantity (>=1) required");
    }

    const product = await prisma.product.findFirst({
      where: { id: parseInt(productId), status: "ACTIVE", store: { status: "APPROVED" } },
    });
    if (!product) return badRequest("Product not found or unavailable");
    if (product.stock < quantity) return badRequest("Insufficient stock");  // TC-011

    const cart = await getOrCreateCart(auth.userId);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });

    let item;
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) return badRequest("Insufficient stock");
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: { include: { store: { select: { id: true, name: true } } } } },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity },
        include: { product: { include: { store: { select: { id: true, name: true } } } } },
      });
    }
    return ok(item);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
    if (!cart) return badRequest("No cart found");

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return ok({ message: "Cart cleared" });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
