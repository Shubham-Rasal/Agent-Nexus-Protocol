import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Enable standalone mode for Docker
  nodeMiddleware: true,
};

export default nextConfig;
