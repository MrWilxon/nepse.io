import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BULK_IPO_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/bulk-ipo/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
