import type { NextConfig } from "next";

const nextConfig: NextConfig = {

    webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
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
    ],
  },
};

export default nextConfig;
