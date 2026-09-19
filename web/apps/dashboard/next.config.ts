import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bloodheroes/api-client", "@bloodheroes/ui", "@bloodheroes/geo"],
};

export default nextConfig;
