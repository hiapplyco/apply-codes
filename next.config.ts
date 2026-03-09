import type { NextConfig } from 'next';
import { resolve } from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Static export for Firebase Hosting
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Transpile specific packages
  transpilePackages: [
    '@daily-co/daily-js',
    '@daily-co/daily-react',
    '@tremor/react',
  ],

  // Set correct workspace root (parent dir has a lockfile)
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
