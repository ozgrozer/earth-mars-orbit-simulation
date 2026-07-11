import type { NextConfig } from "next";

/**
 * GitHub Pages serves this repo at:
 *   https://ozgrozer.github.io/earth-mars-orbit-simulation/
 * so production builds need basePath. Local `pnpm dev` / plain `pnpm build`
 * leave BASE_PATH unset and serve from `/`.
 */
const basePath = process.env.BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
