import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "play.pokemonshowdown.com",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
