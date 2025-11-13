import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client-side bundling
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Ignore elysia and file-type in client bundle
      const webpack = require("webpack");
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(elysia|file-type)$/,
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
