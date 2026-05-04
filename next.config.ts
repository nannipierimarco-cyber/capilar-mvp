import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Evita que /_next/image sirva versiones viejas al reemplazar archivos en public durante el desarrollo.
    minimumCacheTTL: 0,
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
