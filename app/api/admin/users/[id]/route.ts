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
    if (auth.role !== "ADMIN") return forbidden();

    const id = parseInt(params.id);
    const body = await req.json();
    const { suspended } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return notFound("User not found");

    const updated = await prisma.user.update({
      where: { id },
      data: { suspended: Boolean(suspended) },
      select: { id: true, name: true, email: true, role: true, suspended: true },
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
    if (auth.role !== "ADMIN") return forbidden();

    const id = parseInt(params.id);
    await prisma.user.delete({ where: { id } });
    return ok({ message: "User deleted" });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
