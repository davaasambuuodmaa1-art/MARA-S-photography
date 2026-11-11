import { NextResponse } from "next/server";
import { getSlotsForDate } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const result = await getSlotsForDate(date);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
