import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { listNotifications } from "@/lib/notify";
import { unreadCount } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [notifications, unread] = await Promise.all([listNotifications(30), unreadCount()]);
  return NextResponse.json(
    { notifications, unread },
    { headers: { "Cache-Control": "no-store" } },
  );
}
