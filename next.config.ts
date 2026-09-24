import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/pollos",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pollos",
        basePath: false,
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/pollos/admin",
        basePath: false,
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/pollos/admin/:path*",
        basePath: false,
        permanent: false,
      },
      {
        source: "/vale/:path*",
        destination: "/pollos/vale/:path*",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
