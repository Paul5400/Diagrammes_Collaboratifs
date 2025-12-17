import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
  // Configuration pour Turbopack (Next.js 16+)
  turbopack: {
    // Configuration vide pour permettre l'utilisation de Turbopack
    // avec la config webpack existante
  },
};

export default nextConfig;
