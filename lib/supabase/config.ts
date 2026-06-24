export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-supabase"),
  );
}

export function shouldRequireAuth() {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
}
