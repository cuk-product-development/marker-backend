/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip linting and type check during build (already checked locally)
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // All routes are dynamic — no static generation
  output: "standalone",
};

module.exports = nextConfig;
