export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { serverError, ok, badRequest } from "@/lib/response";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Next.js 14 App Router: no export config needed, bodyParser disabled by default for FormData

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (!["SELLER", "ADMIN"].includes(auth.role)) return forbidden();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file uploaded");

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return badRequest("Only JPEG, PNG, WEBP, GIF allowed");

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return badRequest("File too large (max 5MB)");

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

    return ok({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
