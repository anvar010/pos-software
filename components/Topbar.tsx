import Link from "next/link";
import { auth, signOut } from "@/auth";
import { OnlineStatus } from "@/components/OnlineStatus";

const NAV = [
  { href: "/checkout", label: "Checkout" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

// Server component: shows the signed-in admin and a logout button (server action).
export async function Topbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm">
            🛍️
          </span>
          <span className="hidden sm:inline">Retail POS</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <OnlineStatus />
          {session?.user?.email && (
            <span className="hidden text-sm text-slate-500 sm:inline">
              {session.user.email}
            </span>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
