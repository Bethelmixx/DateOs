import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

function authFailure(err: unknown): Response {
  const message =
    err instanceof Error ? err.message || err.name : "No se pudo completar la cuenta";
  console.error("[auth] handler failed", err);
  return Response.json({ message }, { status: 500 });
}

async function handleAuth(request: Request): Promise<Response> {
  try {
    return await auth.handler(request);
  } catch (err) {
    return authFailure(err);
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});

