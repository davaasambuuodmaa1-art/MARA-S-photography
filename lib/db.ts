import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Bindings {
  DB: D1Database;
  FILES?: R2Bucket;
  NEXT_PUBLIC_SITE_URL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_EMAIL?: string;
  SEED_ADMIN_EMAIL?: string;
  SEED_ADMIN_PASSWORD?: string;
  SEED_DEMO_CONTENT?: string;
}

export async function getEnv(): Promise<Bindings> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as unknown as Bindings;
  } catch {
    // Fallback for `next build` / tooling where the Workers context is absent.
    return process.env as unknown as Bindings;
  }
}

export function envValue(key: keyof Bindings): string | undefined {
  return (process.env[key] as string | undefined) || undefined;
}

let schemaReady: Promise<void> | null = null;

export async function db(): Promise<D1Database> {
  const env = await getEnv();
  const database = env.DB;
  if (!database) {
    throw new Error(
      "The DB binding is missing. In production add a D1 database binding named DB; locally the OpenNext dev context provides it.",
    );
  }
  if (!schemaReady) {
    schemaReady = (async () => {
      const { ensureSchema } = await import("./schema");
      await ensureSchema(database, env);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
  return database;
}

export async function all<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const database = await db();
  const stmt = database.prepare(sql);
  const bound = params.length ? stmt.bind(...params) : stmt;
  const result = await bound.all<T>();
  return (result.results ?? []) as T[];
}

export async function first<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(sql: string, params: unknown[] = []) {
  const database = await db();
  const stmt = database.prepare(sql);
  const bound = params.length ? stmt.bind(...params) : stmt;
  return bound.run();
}

export async function batch(statements: { sql: string; params?: unknown[] }[]) {
  const database = await db();
  return database.batch(
    statements.map((s) => {
      const stmt = database.prepare(s.sql);
      return s.params?.length ? stmt.bind(...s.params) : stmt;
    }),
  );
}
