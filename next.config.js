/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Prevent Turbopack from inferring the wrong workspace root when multiple lockfiles exist.
    // Must be an absolute path.
    root: __dirname,
  },
  // Mark bcryptjs as a server-only external package
  // This tells Next.js/Turbopack not to bundle it, but to resolve it at runtime
  serverExternalPackages: ["bcryptjs"],
};

module.exports = nextConfig;


