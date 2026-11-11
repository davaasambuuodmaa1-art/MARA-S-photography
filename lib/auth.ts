import { cookies } from "next/headers";
import { first, run } from "./db";
import type { Role, User } from "./types";
import { newId } from "./utils";

const SESSION_COOKIE = "mara_session";
const VISITOR_COOKIE = "mara_visitor";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function secret() {
  return process.env.AUTH_SECRET || "mara-studio-signing-key-change-me-2026";
}

function b64url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return b64url(new Uint8Array(sig));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$${iterations}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const [, iterString, saltPart, hashPart] = parts;
  const salt = Uint8Array.from(atob(saltPart.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: Number(iterString), hash: "SHA-256" },
    key,
    256,
  );
  return b64url(new Uint8Array(bits)) === hashPart;
}

interface SessionPayload {
  id: string;
  role: Role;
  exp: number;
}

async function signSession(payload: SessionPayload) {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  if ((await hmac(body)) !== sig) return null;
  try {
    const json = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(decodeURIComponent(escape(json))) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const token = await signSession({
    id: user.id,
    role: user.role,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const payload = await readSession();
  if (!payload) return null;
  return first<User>("SELECT * FROM users WHERE id = ?", [payload.id]);
}

export async function currentAdmin(): Promise<User | null> {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new AuthError("Administrator access required", 401);
  return admin;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AuthError("Please sign in", 401);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function visitorId() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;
  const id = newId("v_");
  try {
    jar.set(VISITOR_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // Read-only cookie context (RSC render) — caller still gets a stable id.
  }
  return id;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await first<{ id: string }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) throw new AuthError("An account with this email already exists", 409);
  const id = newId("u_");
  await run(
    "INSERT INTO users (id, email, password_hash, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, 'customer', ?)",
    [id, email, await hashPassword(input.password), input.name.trim(), input.phone ?? null, new Date().toISOString()],
  );
  return (await first<User>("SELECT * FROM users WHERE id = ?", [id]))!;
}
