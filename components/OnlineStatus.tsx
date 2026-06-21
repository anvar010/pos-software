"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useOnline } from "@/lib/use-online";
import { getDB } from "@/lib/offline-db";
import { syncAll } from "@/lib/offline-sync";

export function OnlineStatus() {
  const online = useOnline();
  const [syncing, setSyncing] = useState(false);
  const wasOffline = useRef(false);

  const pending =
    useLiveQuery(
      () => getDB().pendingSales.where("status").equals("pending").count(),
      [],
      0
    ) ?? 0;
  const errored =
    useLiveQuery(
      () => getDB().pendingSales.where("status").equals("error").count(),
      [],
      0
    ) ?? 0;

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      await syncAll();
      window.dispatchEvent(new CustomEvent("pos-synced"));
    } finally {
      setSyncing(false);
    }
  }, []);

  // Auto-sync when connectivity returns or when there are queued sales online.
  useEffect(() => {
    if (online && (wasOffline.current || pending > 0)) {
      void runSync();
    }
    wasOffline.current = !online;
  }, [online, pending, runSync]);

  let dot = "bg-emerald-500";
  let label = "Online";
  if (!online) {
    dot = "bg-red-500";
    label = pending > 0 ? `Offline · ${pending} pending` : "Offline";
  } else if (syncing || pending > 0) {
    dot = "bg-amber-500";
    label = `Syncing ${pending}…`;
  }

  return (
    <button
      onClick={() => runSync()}
      disabled={!online || syncing}
      title={online ? "Sync now" : "Sales are saved locally and will sync when online"}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 disabled:cursor-default"
    >
      <span className={`h-2 w-2 rounded-full ${dot} ${!online || syncing ? "animate-pulse" : ""}`} />
      <span className="hidden sm:inline">{label}</span>
      {errored > 0 && (
        <span className="rounded-full bg-red-100 px-1.5 text-red-700" title="Sales needing review">
          ⚠ {errored}
        </span>
      )}
    </button>
  );
}
