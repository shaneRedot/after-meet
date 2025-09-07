import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds (for faster deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript strict checking during builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
