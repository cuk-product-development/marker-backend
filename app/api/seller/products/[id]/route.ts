export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

async function getSellerStore(userId: number) {
  return prisma.store.findUnique({ where: { sellerId: userId } });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await getSellerStore(auth.userId);
    if (!store) return notFound("Store not found");

    const product = await prisma.product.findFirst({
      where: { id: parseInt(params.id), storeId: store.id },
    });
    if (!product) return notFound("Product not found");
    return ok(product);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "SELLER") return forbidden();

    const store = await getSellerStore(auth.userId);
    if (!store) return notFound("Store not found");

    const product = await prisma.product.findUnique({ where: { id: parseInt(params.id) } });
    if (!product) return notFound("Product not found");

    // Ownership check — TC-007
    if (product.storeId !== store.id) return forbidden();

    const body = await req.json();
    const { name, description, price, stock, imageUrl, status } = body;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status !== undefined && { status }),
      },
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
    if (auth.role !== "SELLER") return forbidden();

    const store = await getSellerStore(auth.userId);
    if (!store) return notFound("Store not found");

    const product = await prisma.product.findUnique({ where: { id: parseInt(params.id) } });
    if (!product) return notFound("Product not found");
    if (product.storeId !== store.id) return forbidden();

    await prisma.product.delete({ where: { id: product.id } });
    return ok({ message: "Product deleted" });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
