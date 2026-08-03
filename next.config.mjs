/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Defaults to .next, so production and Docker are unaffected. `pnpm
  // build:check` overrides it, which lets a verification build run without
  // clobbering the .next a running `pnpm dev` is serving from — that collision
  // leaves dev returning 404s for every chunk and makes the browser suites
  // fail in ways that look like real bugs.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
