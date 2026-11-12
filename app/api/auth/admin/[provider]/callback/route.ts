import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { createSession, isAdminLoginAllowed } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import {
  adminOAuthClientId,
  adminOAuthClientSecret,
  adminOAuthIsConfigured,
  adminOAuthIssuer,
  adminOAuthJwksUrl,
  adminOAuthRedirectUri,
  adminOAuthStateCookie,
  adminOAuthTokenUrl,
  isAdminOAuthProvider,
} from "@/lib/admin-oauth";
import { getEnv, first } from "@/lib/db";
import type { User } from "@/lib/types";

export const runtime = "edge";

type OAuthCallbackValues = {
  code: string;
  state: string;
  error?: string;
};

async function callbackValues(request: NextRequest): Promise<OAuthCallbackValues> {
  if (request.method === "POST") {
    const form = await request.formData();
    return {
      code: String(form.get("code") || ""),
      state: String(form.get("state") || ""),
      error: String(form.get("error") || ""),
    };
  }
  return {
    code: request.nextUrl.searchParams.get("code") || "",
    state: request.nextUrl.searchParams.get("state") || "",
    error: request.nextUrl.searchParams.get("error") || "",
  };
}

async function handleCallback(
  request: NextRequest,
  providerName: string,
): Promise<NextResponse> {
  const loginUrl = new URL("/admin/login", request.url);
  const failure = (reason = "social_login_failed") => {
    loginUrl.searchParams.set("error", reason);
    return NextResponse.redirect(loginUrl, { status: request.method === "POST" ? 303 : 307 });
  };
  if (!isAdminOAuthProvider(providerName)) return failure();

  const provider = providerName;
  const stateCookieName = adminOAuthStateCookie(provider);
  const response = await callbackValues(request).catch(() => null);
  if (!response || response.error || !response.code) return failure();

  const savedState = request.cookies.get(stateCookieName)?.value;
  if (!savedState) return failure();
  let stateData: { state: string; nonce: string };
  try {
    stateData = JSON.parse(savedState) as { state: string; nonce: string };
  } catch {
    return failure();
  }
  if (!stateData.state || !stateData.nonce || stateData.state !== response.state) {
    return failure();
  }

  const env = await getEnv();
  if (!adminOAuthIsConfigured(provider, env)) return failure("social_login_unavailable");
  const origin = env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const clientId = adminOAuthClientId(provider, env);
  let tokenResult: Response;
  try {
    tokenResult = await fetch(adminOAuthTokenUrl(provider), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: response.code,
        redirect_uri: adminOAuthRedirectUri(provider, origin),
        client_id: clientId,
        client_secret: await adminOAuthClientSecret(provider, env),
      }),
    });
  } catch {
    return failure();
  }
  if (!tokenResult.ok) return failure();
  const tokens = (await tokenResult.json()) as { id_token?: string };
  if (!tokens.id_token) return failure();

  let claims: JWTPayload & {
    email?: string;
    email_verified?: boolean | string;
    nonce?: string;
  };
  try {
    const jwks = createRemoteJWKSet(new URL(adminOAuthJwksUrl(provider)));
    const verified = await jwtVerify(tokens.id_token, jwks, {
      issuer: adminOAuthIssuer(provider),
      audience: clientId,
    });
    claims = verified.payload;
  } catch {
    return failure();
  }

  if (claims.nonce !== stateData.nonce) return failure();
  const email = claims.email?.trim().toLowerCase();
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  if (!email || !emailVerified || !isAllowedAdminEmail(email)) return failure();

  const user = await first<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || user.role !== "admin" || !(await isAdminLoginAllowed(email))) return failure();

  await createSession(user);
  const success = NextResponse.redirect(new URL("/admin", request.url), {
    status: request.method === "POST" ? 303 : 307,
  });
  success.cookies.set(stateCookieName, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: `/api/auth/admin/${provider}`,
    maxAge: 0,
  });
  return success;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  return handleCallback(request, provider);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  return handleCallback(request, provider);
}
