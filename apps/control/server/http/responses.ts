import { z } from "zod";

const corsHeaders = {
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-origin": process.env.TALI_CORS_ORIGIN ?? "*",
};

export function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  for (const [name, value] of Object.entries(corsHeaders))
    headers.set(name, value);
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof z.ZodError)
    return jsonResponse(
      { error: error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  return jsonResponse(
    {
      error: error instanceof Error ? error.message : "Unexpected error.",
    },
    { status: 500 },
  );
}

export function noContentResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}
