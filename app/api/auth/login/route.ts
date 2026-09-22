export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) return badRequest("email and password are required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return badRequest("Invalid email or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return badRequest("Invalid email or password");

    if (user.suspended) return badRequest("Account suspended");

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
