import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
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
      {
        protocol: "https",
        hostname: "s3-media0.fl.yelpcdn.com",
      },
    ],
  },
};

export default nextConfig;
