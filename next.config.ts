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
    ];
  },
};

export default nextConfig;
