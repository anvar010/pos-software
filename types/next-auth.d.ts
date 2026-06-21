import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Augment the Auth.js session/user/jwt with our custom fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
