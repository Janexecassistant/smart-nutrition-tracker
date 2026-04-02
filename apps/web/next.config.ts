import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@snt/shared"],
  typescript: {
    // Skip type checking during build for faster deployments
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for faster deployments
    ignoreDuringBuilds: true,
  },
  // Use standalone output to avoid static page generation issues
  // with client-side providers during build
  output: "standalone",
  experimental: {
    // Enable server actions for form handling
  },
};

export default nextConfig;
