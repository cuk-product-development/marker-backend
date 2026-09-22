import { NextRequest } from "next/server";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getPagination(req: NextRequest, defaultLimit = 10) {
  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit))));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

export function pageMeta(total: number, page: number, limit: number): PageMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function pagedResponse(data: unknown[], total: number, page: number, limit: number) {
  return { data, meta: pageMeta(total, page, limit) };
}
