import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
        >
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="max-w-sm text-slate-600">
        No internet connection. Don&apos;t worry — sales you make while offline are
        saved on this device and will sync automatically once you&apos;re back online.
      </p>
      <a
        href="/checkout"
        className="mt-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm active:scale-95"
      >
        Continue to Checkout
      </a>
    </main>
  );
}
