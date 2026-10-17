import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A self-contained Node server in .next/standalone (server.js + only the traced dependencies):
  // small memory and disk footprint on Node hosting panels and containers.
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: false },
  // The API reads the data folder and CLAUDE.md at runtime; neither (nor any source) belongs in the build.
  outputFileTracingExcludes: { '/*': ['./data/**', './src/**', './scripts/**', './*.md'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The speaking module records the learner's voice on this site only.
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
