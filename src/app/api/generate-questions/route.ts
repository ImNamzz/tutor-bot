// Placeholder route handler to satisfy Next.js module requirements.
// Replace with real implementation later.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "generate-questions endpoint placeholder",
  });
}

export async function POST() {
  return NextResponse.json({
    status: "ok",
    message: "POST not implemented yet",
  });
}
