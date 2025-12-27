/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Prevent Turbopack from inferring the wrong workspace root when multiple lockfiles exist.
    // Must be an absolute path.
    root: __dirname,
  },
};

module.exports = nextConfig;


