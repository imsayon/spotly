/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@spotly/types', '@spotly/ui'],
  experimental: {
    optimizePackageImports: ['@spotly/ui'],
  },
};
module.exports = nextConfig;
