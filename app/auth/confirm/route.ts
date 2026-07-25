import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const destination = new URL("/auth/callback", request.url);
  request.nextUrl.searchParams.forEach((value, key) => destination.searchParams.set(key, value));
  return NextResponse.redirect(destination);
}
