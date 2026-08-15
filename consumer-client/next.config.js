/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@spotly/types", "@spotly/ui"],
  experimental: {
    optimizePackageImports: ["@spotly/ui"],
  },
}

module.exports = nextConfig
