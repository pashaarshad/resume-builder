import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for pdfjs-dist compatibility with Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
    }

    // Handle pdfjs-dist worker and canvas issues
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist/build/pdf.worker.min.js": false,
      canvas: false,
    };

    // Ignore canvas module in browser builds
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        canvas: "canvas",
      });
    }

    return config;
  },
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
