"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Modal } from "@/components/ui/Modal";

type ImportResult = {
  created: number;
  updated: number;
  total: number;
  errors: { row: number; message: string }[];
};

export function CsvImport({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setFileName(file.name);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        if (res.errors.length) {
          setParseError(res.errors[0].message);
          return;
        }
        setRows(res.data);
      },
      error: (err) => setParseError(err.message),
    });
  }

  async function doImport() {
    setBusy(true);
    const res = await fetch("/api/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setParseError(data.error ?? "Import failed.");
      return;
    }
    setResult(await res.json());
    onImported();
  }

  return (
    <Modal title="Import products from CSV" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Expected columns (header row):</p>
          <code className="mt-1 block break-words">
            name, sku, barcode, price, costPrice, category, stockQuantity,
            lowStockThreshold, taxRate
          </code>
          <p className="mt-1">
            Rows are matched/updated by <strong>sku</strong>. <code>category</code> is the
            category name (created if missing).
          </p>
        </div>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />

        {fileName && !parseError && (
          <p className="text-sm text-slate-600">
            Parsed <strong>{rows.length}</strong> row(s) from{" "}
            <strong>{fileName}</strong>.
          </p>
        )}

        {parseError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {parseError}
          </p>
        )}

        {result && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium text-emerald-700">
              ✓ Imported: {result.created} created, {result.updated} updated (of{" "}
              {result.total})
            </p>
            {result.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-700">
                  {result.errors.length} row(s) skipped
                </summary>
                <ul className="mt-1 max-h-40 overflow-y-auto text-xs text-red-600">
                  {result.errors.map((er) => (
                    <li key={er.row}>
                      Row {er.row}: {er.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            {result ? "Done" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={doImport}
              disabled={busy || rows.length === 0}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 disabled:opacity-60"
            >
              {busy ? "Importing…" : `Import ${rows.length || ""} product(s)`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
