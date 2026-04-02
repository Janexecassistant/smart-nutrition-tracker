import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@snt/shared"],
  typescript: {
    // Skip type checking during build for faster deployments
    // Type errors will still be caught in development and CI
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for faster deployments
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable server actions for form handling
  },
};

export default nextConfig;
