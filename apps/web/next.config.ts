import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@snt/shared"],
  experimental: {
    // Enable server actions for form handling
  },
};

export default nextConfig;
