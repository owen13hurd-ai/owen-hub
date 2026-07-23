import { NextRequest, NextResponse } from "next/server";

const gmailReadonlyScope = "https://www.googleapis.com/auth/gmail.readonly";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Run this helper locally, not in production." }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Add GOOGLE_CLIENT_ID to .env.local first." }, { status: 400 });
  }

  const redirectUri = `${request.nextUrl.origin}/api/career/gmail-oauth/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", gmailReadonlyScope);

  return NextResponse.redirect(url);
}
