import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable the service worker in development to avoid caching headaches.
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Offline fallback page served when a navigation request fails while offline.
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // Don't precache API routes — they should always hit the network.
    navigateFallbackDenylist: [/^\/api\//],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next-pwa injects a webpack config even when the SW is disabled in dev.
  // An empty turbopack config lets `next dev` (Turbopack) tolerate it; the
  // production build forces webpack via `next build --webpack`.
  turbopack: {},
  images: {
    remotePatterns: [
      // Allow product images served from common managed storage hosts.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default withPWA(nextConfig);
