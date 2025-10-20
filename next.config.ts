import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["philnews.ph", "alchetron.com", "calizamar.com"],
  },
  output: "standalone",
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
