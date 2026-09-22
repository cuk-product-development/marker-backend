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

    const { productId, rating, comment } = await req.json();
    if (!productId || !rating) return badRequest("productId and rating required");
    if (rating < 1 || rating > 5) return badRequest("Rating must be 1-5");

    // Verify customer has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: parseInt(productId),
        order: { userId: auth.userId, status: "DELIVERED" },
      },
    });
    if (!hasPurchased) return badRequest("You can only review products you have received");

    // Check duplicate
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: auth.userId, productId: parseInt(productId) } },
    });
    if (existing) return badRequest("You already reviewed this product");

    const review = await prisma.review.create({
      data: { userId: auth.userId, productId: parseInt(productId), rating, comment },
      include: { user: { select: { id: true, name: true } } },
    });
    return created(review);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
