/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    // Stamped into the bundle at build time so any page can say exactly which
    // build it is. A hand-maintained version number can be bumped without a
    // deploy actually happening — the commit the host built from can't lie,
    // which is the whole point when the question is "did this deploy land?".
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
    NEXT_PUBLIC_BUILD_SHA: (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT_SHA ||
      'local'
    ).slice(0, 7),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  async headers() {
    return [
      {
        // Allow ecosystem apps (Veta Wallet, My Token Pay, etc.) to embed the
        // KYC flow in an <iframe> via the genesis-kyc-sdk widget.
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
