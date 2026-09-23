export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/auth";
import { serverError, ok, badRequest } from "@/lib/response";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Convert to base64 for Cloudinary upload
    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "tokokita",
      transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
    });

    return ok({ url: result.secure_url });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
