export const dynamic = "force-dynamic";
import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
};

export default nextConfig;
