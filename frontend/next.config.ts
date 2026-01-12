import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    remotePatterns: [],
    domains: [],
  },
  
  // Add specific headers for camera access
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
  
  // Add other experimental features
  experimental: {
    // Enable shared state between client and server
    optimisticClientCache: true,
  },
  
  // Prevent minification of camera-related code
  webpack: (config, { dev, isServer }) => {
    // Ensure path aliases are resolved correctly
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, './src'),
      };
    }
    
    if (!dev && !isServer) {
      // Preserve camera-related modules from excessive optimization
      config.optimization.minimize = true;
      if (!config.optimization.minimizer) {
        config.optimization.minimizer = [];
      }
    }
    return config;
  },
};

export default nextConfig;
