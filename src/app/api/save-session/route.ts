import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "ok",
    message: "save-session placeholder",
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "GET not implemented for save-session",
  });
}
