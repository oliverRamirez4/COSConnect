import type { NextConfig } from "next";
import { assetPrefix, basePath } from "./src/lib/paths";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix,
};

export default nextConfig;
