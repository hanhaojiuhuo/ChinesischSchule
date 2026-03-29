import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Needed for GitHub Pages: generate a static site into ./out
  output: "export",

  // Your existing GitHub Pages base path handling
  basePath,
  assetPrefix: basePath,

  // Common requirement for static export on GitHub Pages
  // (next/image optimization needs a server, so disable it)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
