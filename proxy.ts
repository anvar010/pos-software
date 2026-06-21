import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Next.js 16 renamed the "middleware" convention to "proxy". This runs at the
// edge using the edge-safe config (no Prisma/bcrypt) to gate access to routes.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on all routes EXCEPT: API routes (protected per-handler), Next internals,
  // static assets, the offline fallback page, and the generated PWA files.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|offline|icons/|sw.js|workbox-|swe-worker-|fallback-).*)",
  ],
};
