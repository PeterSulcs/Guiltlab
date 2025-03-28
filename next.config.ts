import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivityPosition: 'bottom-right'
  },
  output: 'standalone',
};

export default nextConfig;

