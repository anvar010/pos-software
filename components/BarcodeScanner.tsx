"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";

const REGION_ID = "barcode-scanner-region";

export function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  // Holds the Html5Qrcode instance so cleanup can stop the camera.
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        const scanner = new Html5Qrcode(REGION_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText) => {
            if (!active) return;
            active = false;
            onScan(decodedText);
          },
          () => {
            /* ignore per-frame decode errors */
          }
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? `Camera error: ${e.message}`
            : "Unable to access the camera."
        );
      }
    })();

    return () => {
      active = false;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <Modal title="Scan barcode" onClose={onClose} size="sm">
      <div className="space-y-3">
        <div
          id={REGION_ID}
          className="overflow-hidden rounded-xl bg-black"
          style={{ minHeight: 240 }}
        />
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Point the camera at a barcode or QR code.
          </p>
        )}
      </div>
    </Modal>
  );
}
