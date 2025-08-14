import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    remotePatterns: [new URL('http://localhost:4000/**'), new URL('https://via.placeholder.com/**')],
  },
}

export default nextConfig;
