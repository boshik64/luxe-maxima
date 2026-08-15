import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    proxyClientMaxBodySize: "10mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.karofilm.ru",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/banners/:file",
        destination: "/api/media/banners/:file",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
