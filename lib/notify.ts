import { all, envValue, first, run } from "./db";
import { newId } from "./utils";

export async function notifyAdmin(input: {
  type: string;
  title: string;
  body?: string;
  link?: string;
  emailSubject?: string;
  emailBody?: string;
}) {
  await run(
    "INSERT INTO notifications (id, type, title, body, link, read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
    [
      newId("ntf_"),
      input.type,
      input.title,
      input.body ?? "",
      input.link ?? null,
      new Date().toISOString(),
    ],
  );
  if (input.emailSubject) {
    await sendEmail({
      to: envValue("ADMIN_EMAIL") || "studio@marasphotography.com",
      subject: input.emailSubject,
      text: input.emailBody ?? input.body ?? "",
    });
  }
}

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const key = envValue("RESEND_API_KEY");
  const from = envValue("EMAIL_FROM") || "Mara's Photography <studio@marasphotography.com>";
  if (!key) {
    // No provider configured yet: keep a server log trace of what would be sent.
    console.log(`[email:skipped] to=${input.to} subject=${input.subject}`);
    return { sent: false, reason: "no-provider" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text }),
    });
    return { sent: res.ok, reason: res.ok ? "sent" : `http-${res.status}` };
  } catch (error) {
    console.error("email failed", error);
    return { sent: false, reason: "network" };
  }
}

export async function listNotifications(limit = 40) {
  return all<{
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    read: number;
    created_at: string;
  }>("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", [limit]);
}

export async function markAllNotificationsRead() {
  await run("UPDATE notifications SET read = 1");
}

export async function markNotificationRead(id: string) {
  await run("UPDATE notifications SET read = 1 WHERE id = ?", [id]);
}

export async function unreadCount() {
  const row = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM notifications WHERE read = 0",
  );
  return Number(row?.count ?? 0);
}
