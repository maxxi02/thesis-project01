import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "philnews.ph",
      },
      {
        protocol: "https",
        hostname: "alchetron.com",
      },
      {
        protocol: "https",
        hostname: "calizamar.com",
      },
    ],
  },
};

export default nextConfig;
