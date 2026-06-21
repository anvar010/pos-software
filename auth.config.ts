import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge-safe Auth.js config (no Prisma / bcrypt here). Shared by middleware and
// the full config in `auth.ts`. The Credentials provider is added in `auth.ts`
// because it needs Node APIs.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    // Runs in middleware for every matched request to gate access.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        // Already signed in? Bounce away from the login page.
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Everything else requires a session.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
