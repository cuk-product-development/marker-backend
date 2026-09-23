export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { serverError, ok, badRequest } from "@/lib/response";

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

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return badRequest("Upload not configured");

    // Convert to base64
    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Upload to ImgBB
    const body = new URLSearchParams();
    body.append("key", apiKey);
    body.append("image", base64);
    body.append("name", file.name);

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body,
    });

    const data = await res.json();

    if (!data.success) {
      console.error("ImgBB error:", data);
      return serverError("Upload failed");
    }

    return ok({ url: data.data.url });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
