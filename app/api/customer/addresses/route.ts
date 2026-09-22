export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (auth.role !== "CUSTOMER") return forbidden();

    const addresses = await prisma.address.findMany({
      where: { userId: auth.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return ok(addresses);
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

    const body = await req.json();
    const { label, street, city, province, postalCode, isDefault } = body;
    if (!label || !street || !city || !province || !postalCode) {
      return badRequest("label, street, city, province, postalCode required");
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { userId: auth.userId, label, street, city, province, postalCode, isDefault: Boolean(isDefault) },
    });
    return created(address);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
