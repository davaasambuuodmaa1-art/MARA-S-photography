import { NextResponse } from "next/server";
import { first } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await first<{ count: number }>("SELECT COUNT(*) AS count FROM categories");
    return NextResponse.json({
      status: "ok",
      database: "connected",
      categories: Number(row?.count ?? 0),
      time: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
