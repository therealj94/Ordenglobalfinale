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
    NEXT_PUBLIC_VERIFF_URL: process.env.NEXT_PUBLIC_VERIFF_URL || 'https://station.veriff.com',
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
