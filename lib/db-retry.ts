import { Prisma } from "@prisma/client";

// Prisma error codes that indicate a transient connection/availability problem
// (as opposed to a real application/validation error). Safe to retry.
const TRANSIENT_CODES = new Set([
  "P1001", // can't reach database server
  "P1002", // database server reached but timed out
  "P1008", // operations timed out
  "P1017", // server has closed the connection
  "P2024", // timed out fetching a connection from the pool
  "P2028", // transaction API error (e.g. connection dropped mid-transaction)
]);

// Substrings seen on transient driver/connection failures — notably Neon
// terminating an idle connection when its compute auto-suspends.
const TRANSIENT_MESSAGES = [
  "terminating connection due to administrator command", // Neon autosuspend (57P01)
  "Connection terminated",
  "connection closed",
  "Closed connection",
  "server has closed the connection",
  "ECONNRESET",
  "ETIMEDOUT",
  "Can't reach database server",
];

export function isTransientDbError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (TRANSIENT_CODES.has(e.code)) return true;
  }
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientRustPanicError) return true;

  const message =
    e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return TRANSIENT_MESSAGES.some((s) => message.includes(s));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `fn`, retrying only on transient database errors (e.g. a Neon
 * cold-start connection drop). Real errors propagate immediately.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelayMs = 150 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === retries || !isTransientDbError(e)) throw e;
      await sleep(baseDelayMs * 2 ** attempt); // 150ms, 300ms, 600ms…
    }
  }
  throw lastError;
}
