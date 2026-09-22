export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden();

    const id = parseInt(params.id);
    const body = await req.json();
    const { status } = body;

    const allowed = ["APPROVED", "REJECTED", "SUSPENDED", "PENDING"];
    if (!allowed.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return notFound("Store not found");

    const updated = await prisma.store.update({
      where: { id },
      data: { status },
    });

    // If SUSPENDED, also mark seller as suspended
    if (status === "SUSPENDED") {
      await prisma.user.update({
        where: { id: store.sellerId },
        data: { suspended: true },
      });
    }

    return ok(updated);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
