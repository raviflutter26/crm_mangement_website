import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/login',
        destination: '/',
      },
      {
        source: '/setup-password/:path*',
        destination: '/',
      },
      {
        source: '/reset-password/:path*',
        destination: '/',
      },
    ];
  },
};



export default nextConfig;
