import { PrismaClient } from "@prisma/client";
import { withDbRetry } from "./db-retry";

// A PrismaClient extended so every query transparently retries transient
// connection errors (e.g. a Neon cold-start dropping an idle connection).
// Interactive transactions (`$transaction`) are retried as a unit at their
// call sites with `withDbRetry`, since a dropped transaction must re-run whole.
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        return withDbRetry(() => query(args));
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

// Reuse a single instance across hot reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
