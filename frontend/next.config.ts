import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
