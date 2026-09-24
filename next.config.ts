import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy /admin → /pollos/admin
      {
        source: "/admin",
        destination: "/pollos/admin",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/pollos/admin/:path*",
        permanent: false,
      },
      // Legacy /vale → /pollos/vale
      {
        source: "/vale/:path*",
        destination: "/pollos/vale/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
