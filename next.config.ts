import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components は使わず、unstable_cache と revalidate による従来の仕組みでキャッシュする
  // （src/lib/data.ts を参照）
};

export default nextConfig;
