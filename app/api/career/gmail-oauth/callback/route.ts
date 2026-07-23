import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Run this helper locally, not in production." }, { status: 403 });
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (!code) return NextResponse.json({ error: "Google did not return an OAuth code." }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local first." }, { status: 400 });
  }

  const redirectUri = `${request.nextUrl.origin}/api/career/gmail-oauth/callback`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  const payload = (await response.json()) as {
    error?: string;
    error_description?: string;
    refresh_token?: string;
  };

  if (!response.ok || !payload.refresh_token) {
    return NextResponse.json({
      error: payload.error ?? "No refresh token returned.",
      detail: payload.error_description ?? "Try the start URL again and make sure Google shows the consent screen.",
    }, { status: 400 });
  }

  return new NextResponse(
    `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Gmail refresh token</title>
        <style>
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f6f7f4; color: #17211d; }
          main { max-width: 760px; margin: 48px auto; padding: 24px; background: white; border: 1px solid rgba(23, 33, 29, 0.12); border-radius: 8px; }
          code { display: block; overflow-wrap: anywhere; padding: 16px; background: #eef1ea; border-radius: 8px; line-height: 1.6; }
          p { color: rgba(23, 33, 29, 0.68); line-height: 1.6; }
        </style>
      </head>
      <body>
        <main>
          <h1>Gmail refresh token created</h1>
          <p>Add this exact line to <strong>.env.local</strong> and to Vercel environment variables. Keep it private.</p>
          <code>GMAIL_REFRESH_TOKEN=${payload.refresh_token}</code>
          <p>After saving it locally, restart the dev server so Owen's Hub can read it.</p>
        </main>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
