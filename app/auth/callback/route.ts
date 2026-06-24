import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const errorDescription = requestUrl.searchParams.get("error_description");
  const loginUrl = new URL("/auth/login", requestUrl.origin);
  const supabase = await createClient();

  if (errorDescription) {
    loginUrl.searchParams.set("message", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      loginUrl.searchParams.set("message", error.message);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      loginUrl.searchParams.set("message", error.message);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  loginUrl.searchParams.set(
    "message",
    "The sign-in link did not include a valid Supabase login code. Try requesting a fresh link.",
  );
  return NextResponse.redirect(loginUrl);
}
