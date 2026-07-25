"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") as EmailOtpType | null;
      const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const errorDescription = url.searchParams.get("error_description") ?? fragment.get("error_description");

      if (errorDescription) throw new Error(errorDescription);

      let error: Error | null = null;
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        error = result.error;
      } else if (tokenHash && type) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        error = result.error;
      } else if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        error = result.error;
      } else {
        const result = await supabase.auth.getSession();
        error = result.error;
        if (!result.data.session) throw new Error("The sign-in link did not contain a usable session.");
      }

      if (error) throw error;
      if (!active) return;
      router.replace("/dashboard/dynasty/rookies/imports");
      router.refresh();
    }

    finishSignIn().catch((error) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "Sign-in could not be completed.");
    });
    return () => { active = false; };
  }, [router]);

  return <main className="flex min-h-screen items-center justify-center bg-mist px-6">
    <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-moss" />
      <h1 className="mt-4 text-2xl font-bold text-ink">Signing you in</h1>
      <p className="mt-3 text-sm leading-6 text-ink/65">{message}</p>
    </section>
  </main>;
}
