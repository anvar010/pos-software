"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/checkout", label: "Checkout" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-slate-700 hover:bg-slate-100"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-14 z-40 border-b border-slate-200 bg-white shadow-lg">
            <nav className="flex flex-col p-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                >
                  {n.label}
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-1 rounded-lg px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50"
              >
                Log out
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
