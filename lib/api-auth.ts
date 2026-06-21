import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Session } from "next-auth";

// Guards an API route. Returns either the session or a 401 response.
export async function requireApiSession(): Promise<
  { session: Session; error: null } | { session: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
