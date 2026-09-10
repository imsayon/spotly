/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@spotly/types", "@spotly/ui"],
  experimental: {
    optimizePackageImports: ["@spotly/ui"],
  },
}

module.exports = nextConfig
