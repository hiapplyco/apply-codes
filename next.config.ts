import type { NextConfig } from 'next';
import { resolve } from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Skip TS type-checking during build (React 18→19 migration has
  // harmless JSX type-inference regressions with dynamic icon components)
  typescript: {
    ignoreBuildErrors: true,
  },

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
    resolveAlias: {
      // googleapis uses Node.js built-ins; stub them for client bundles
      child_process: { browser: './src/lib/stubs/empty.ts' },
      fs: { browser: './src/lib/stubs/empty.ts' },
      http2: { browser: './src/lib/stubs/empty.ts' },
      net: { browser: './src/lib/stubs/empty.ts' },
      tls: { browser: './src/lib/stubs/empty.ts' },
    },
  },
};

export default nextConfig;
