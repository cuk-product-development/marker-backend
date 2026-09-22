export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { created, badRequest, serverError } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return badRequest("name, email, password are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return badRequest("Invalid email format");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");

    const allowed = ["CUSTOMER", "SELLER"];
    const userRole = (role && allowed.includes(role)) ? role : "CUSTOMER";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest("Email already registered");

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: userRole },
      select: { id: true, name: true, email: true, role: true },
    });

    // Auto-create cart for customers
    if (user.role === "CUSTOMER") {
      await prisma.cart.create({ data: { userId: user.id } });
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    return created({ user, token });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
