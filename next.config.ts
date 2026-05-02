import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR / dev resources when the app is opened from 127.0.0.1 (e.g. Simple Browser)
  // while the dev server is bound to 0.0.0.0 — see Next.js "allowedDevOrigins".
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
