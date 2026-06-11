import { NextResponse } from "next/server";

// PATCH /api/admin/matches/[id]
// This file handles the dynamic [id] route — see [id]/route.ts
export async function GET() {
  return NextResponse.json({ error: "Use PATCH /api/admin/matches/[id]" }, { status: 405 });
}
