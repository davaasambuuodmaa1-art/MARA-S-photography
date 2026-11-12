import { importPKCS8, SignJWT } from "jose";
import type { Bindings } from "./db";

export type AdminOAuthProvider = "google" | "apple";

const PROVIDERS: Record<
  AdminOAuthProvider,
  {
    authorizationUrl: string;
    tokenUrl: string;
    issuer: string | string[];
    jwksUrl: string;
    scopes: string;
  }
> = {
  google: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    scopes: "openid email",
  },
  apple: {
    authorizationUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    issuer: "https://appleid.apple.com",
    jwksUrl: "https://appleid.apple.com/auth/keys",
    scopes: "openid email",
  },
};

export function isAdminOAuthProvider(value: string): value is AdminOAuthProvider {
  return value === "google" || value === "apple";
}

export function adminOAuthIsConfigured(provider: AdminOAuthProvider, env: Bindings) {
  if (provider === "google") {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }
  return Boolean(
    env.APPLE_CLIENT_ID &&
      env.APPLE_TEAM_ID &&
      env.APPLE_KEY_ID &&
      env.APPLE_PRIVATE_KEY,
  );
}

export function adminOAuthRedirectUri(provider: AdminOAuthProvider, origin: string) {
  return new URL(`/api/auth/admin/${provider}/callback`, origin).toString();
}

export function adminOAuthAuthorizationUrl(provider: AdminOAuthProvider) {
  return PROVIDERS[provider].authorizationUrl;
}

export function adminOAuthTokenUrl(provider: AdminOAuthProvider) {
  return PROVIDERS[provider].tokenUrl;
}

export function adminOAuthIssuer(provider: AdminOAuthProvider) {
  return PROVIDERS[provider].issuer;
}

export function adminOAuthJwksUrl(provider: AdminOAuthProvider) {
  return PROVIDERS[provider].jwksUrl;
}

export function adminOAuthScopes(provider: AdminOAuthProvider) {
  return PROVIDERS[provider].scopes;
}

export function adminOAuthClientId(provider: AdminOAuthProvider, env: Bindings) {
  return provider === "google" ? env.GOOGLE_CLIENT_ID! : env.APPLE_CLIENT_ID!;
}

export async function adminOAuthClientSecret(provider: AdminOAuthProvider, env: Bindings) {
  if (provider === "google") {
    if (!env.GOOGLE_CLIENT_SECRET) throw new Error("Google sign-in is not configured.");
    return env.GOOGLE_CLIENT_SECRET;
  }
  if (!env.APPLE_CLIENT_ID || !env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) {
    throw new Error("Apple sign-in is not configured.");
  }
  const privateKey = await importPKCS8(env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID })
    .setIssuer(env.APPLE_TEAM_ID)
    .setSubject(env.APPLE_CLIENT_ID)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

export function adminOAuthStateCookie(provider: AdminOAuthProvider) {
  return `mara_admin_oauth_${provider}`;
}

export function newOAuthToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
