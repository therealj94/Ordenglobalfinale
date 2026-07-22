/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_WALLET_API_URL: process.env.NEXT_PUBLIC_WALLET_API_URL || 'http://localhost:4000/api',
    NEXT_PUBLIC_GENESIS_APP_URL: process.env.NEXT_PUBLIC_GENESIS_APP_URL || 'http://localhost:3001'
  }
};

module.exports = nextConfig;
