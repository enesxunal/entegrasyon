import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./protocol/**/*"],
  },
};

export default nextConfig;
