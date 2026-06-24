import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Owen's Hub",
  description: "A personal dashboard for tools, notes, planning, and future AI assistants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
