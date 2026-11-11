"use server";

import { revalidatePath } from "next/cache";
import {
  createSession,
  currentUser,
  destroySession,
  registerUser,
  verifyPassword,
} from "@/lib/auth";
import { first, run } from "@/lib/db";
import { notifyAdmin } from "@/lib/notify";
import type { User } from "@/lib/types";

export type ActionResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export async function loginAction(input: {
  email: string;
  password: string;
  admin?: boolean;
}): Promise<ActionResult<{ role: string; name: string }>> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return { ok: false, error: "Enter your email and password." };
  const user = await first<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    return { ok: false, error: "Those credentials do not match our records." };
  }
  if (input.admin && user.role !== "admin") {
    return { ok: false, error: "This account does not have studio access." };
  }
  await createSession(user);
  revalidatePath("/account");
  return { ok: true, role: user.role, name: user.name };
}

export async function registerAction(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<ActionResult<{ name: string }>> {
  if (input.password.length < 8) return { ok: false, error: "Use at least 8 characters for your password." };
  if (input.name.trim().length < 2) return { ok: false, error: "Please enter your name." };
  try {
    const user = await registerUser(input);
    await createSession(user);
    await notifyAdmin({
      type: "customer",
      title: `New client account — ${user.name}`,
      body: user.email,
      link: "/admin/customers",
    });
    revalidatePath("/account");
    return { ok: true, name: user.name };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create the account." };
  }
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateProfileAction(input: {
  name: string;
  phone: string;
  notes?: string;
}): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  await run("UPDATE users SET name = ?, phone = ?, notes = COALESCE(?, notes) WHERE id = ?", [
    input.name.trim(),
    input.phone.trim(),
    input.notes ?? null,
    user.id,
  ]);
  revalidatePath("/account");
  return { ok: true };
}

export async function changePasswordAction(input: {
  current: string;
  next: string;
}): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  if (!(await verifyPassword(input.current, user.password_hash))) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  if (input.next.length < 8) return { ok: false, error: "Use at least 8 characters." };
  const { hashPassword } = await import("@/lib/auth");
  await run("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(input.next), user.id]);
  return { ok: true };
}
