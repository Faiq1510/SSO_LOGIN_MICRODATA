import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createSsoToken(
  email: string,
  subject: string,
  name: string,
  role?: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: "portal-login-microdata",
      user_id_external: email || subject,
      name_external: name,
      role_external: role || "Staff",
      iat: now,
      exp: now + 300,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const secret =
    process.env.SSO_SHARED_SECRET ||
    "saims_sso_secret_key_8899aabbccddeeff112233";
  const signature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { code, code_verifier } = await request.json();

    if (!code || !code_verifier) {
      return NextResponse.json(
        { error: "Parameter code dan code_verifier wajib disertakan." },
        { status: 400 },
      );
    }

    const ISSUER =
      process.env.SSO_ISSUER ||
      "https://procurer-uncouth-animate.ngrok-free.dev";
    const CLIENT_ID = "client-saims";
    const CLIENT_SECRET =
      process.env.SSO_SHARED_SECRET ||
      "saims_sso_secret_key_8899aabbccddeeff112233";
    const REDIRECT_URI = "http://localhost:3002/sso/callback";

    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );

    const tokenResponse = await fetch(`${ISSUER}/oidc/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "ngrok-skip-browser-warning": "true",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          error:
            tokenData.error_description ||
            "Gagal menukar token OIDC dengan SSO",
        },
        { status: tokenResponse.status },
      );
    }

    const idToken = tokenData.id_token;
    if (!idToken) {
      return NextResponse.json(
        { error: "id_token tidak ditemukan dari SSO" },
        { status: 400 },
      );
    }

    // Decode id_token payload
    const base64Url = idToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));

    const email = payload.email || `${payload.sub}@microdata.id`;
    const name = payload.name || payload.sub;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const ssoToken = createSsoToken(email, payload.sub, name, payload.role);
    const nativeResponse = await fetch(`${apiUrl}/auth/sso/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sso_token: ssoToken }),
    });
    const nativeData = await nativeResponse.json();

    if (!nativeResponse.ok) {
      return NextResponse.json(
        { error: nativeData.error || "Gagal membuat sesi SAIMS." },
        { status: nativeResponse.status },
      );
    }

    const token = nativeData.access_token || nativeData.token;
    const user = nativeData.user;
    const response = NextResponse.json({ success: true, token, user });

    // Set cookie access_token for Next.js proxy middleware guard
    response.cookies.set("access_token", token, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });

    response.cookies.set("saims_token", token, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });

    response.cookies.set("saims_user", JSON.stringify(user), {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
