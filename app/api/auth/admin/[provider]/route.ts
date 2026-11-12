import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/db";
import {
  adminOAuthAuthorizationUrl,
  adminOAuthClientId,
  adminOAuthIsConfigured,
  adminOAuthRedirectUri,
  adminOAuthScopes,
  adminOAuthStateCookie,
  isAdminOAuthProvider,
  newOAuthToken,
} from "@/lib/admin-oauth";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;
  if (!isAdminOAuthProvider(rawProvider)) {
    return NextResponse.redirect(new URL("/admin/login?error=social_login_failed", request.url));
  }
  const provider = rawProvider;
  const env = await getEnv();
  if (!adminOAuthIsConfigured(provider, env)) {
    return NextResponse.redirect(new URL("/admin/login?error=social_login_unavailable", request.url));
  }

  const state = newOAuthToken();
  const nonce = newOAuthToken();
  const origin = env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const redirectUri = adminOAuthRedirectUri(provider, origin);
  const authorizationUrl = new URL(adminOAuthAuthorizationUrl(provider));
  authorizationUrl.searchParams.set("client_id", adminOAuthClientId(provider, env));
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("response_mode", provider === "apple" ? "form_post" : "query");
  authorizationUrl.searchParams.set("scope", adminOAuthScopes(provider));
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(
    adminOAuthStateCookie(provider),
    JSON.stringify({ state, nonce }),
    {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: `/api/auth/admin/${provider}`,
      maxAge: 600,
    },
  );
  return response;
}
