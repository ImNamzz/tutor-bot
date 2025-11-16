import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Accept params as Promise per validator expectation and resolve.
  const resolved = await context.params;
  return new Response(
    JSON.stringify({
      status: "ok",
      sessionId: resolved.id,
      message: "get-session placeholder",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
