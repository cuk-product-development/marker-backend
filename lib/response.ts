const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

function withCors(res: Response): Response {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export function ok(data: unknown, status = 200) {
  return withCors(Response.json({ success: true, data }, { status }));
}

export function created(data: unknown) {
  return withCors(Response.json({ success: true, data }, { status: 201 }));
}

export function badRequest(message: string) {
  return withCors(Response.json({ success: false, error: message }, { status: 400 }));
}

export function notFound(message = "Not found") {
  return withCors(Response.json({ success: false, error: message }, { status: 404 }));
}

export function serverError(message = "Internal server error") {
  return withCors(Response.json({ success: false, error: message }, { status: 500 }));
}

// OPTIONS preflight handler — export and use in any route that needs it
export function handleOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
