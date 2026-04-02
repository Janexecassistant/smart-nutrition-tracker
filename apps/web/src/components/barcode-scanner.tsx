"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onError?: (error: string) => void;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

/**
 * Cross-browser barcode scanner using html5-qrcode.
 * Works on Chrome, Safari, Firefox, Edge — including iOS Safari.
 * Falls back to manual entry if camera is unavailable.
 */
export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [starting, setStarting] = useState(true);
  const detectedRef = useRef(false);

  const READER_ID = "snt-barcode-reader";

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        // State 2 = scanning, 3 = paused
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // Ignore cleanup errors
    }
    setCameraActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    // Avoid double-start
    if (scannerRef.current) return;
    if (detectedRef.current) return;

    setStarting(true);

    try {
      const scanner = new Html5Qrcode(READER_ID, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.333,
          disableFlip: false,
        },
        (decodedText) => {
          // Successful scan
          if (!detectedRef.current) {
            detectedRef.current = true;
            // Stop scanner before calling back to avoid state issues
            scanner.stop().then(() => {
              scanner.clear();
              scannerRef.current = null;
              setCameraActive(false);
              onDetected(decodedText);
            }).catch(() => {
              onDetected(decodedText);
            });
          }
        },
        () => {
          // Scan frame with no result — this is normal, just keep scanning
        }
      );

      setCameraActive(true);
      setStarting(false);
    } catch (err: any) {
      setStarting(false);
      setHasCamera(false);
      const msg = err?.message || String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        onError?.("Camera access denied. Please allow camera access and try again.");
      } else if (msg.includes("NotFound") || msg.includes("no camera")) {
        onError?.("No camera found on this device.");
      } else {
        onError?.("Could not start camera. You can enter the barcode manually below.");
      }
    }
  }, [onDetected, onError]);

  useEffect(() => {
    detectedRef.current = false;
    startScanner();

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  function handleManualSubmit() {
    const code = manualCode.trim();
    if (code.length >= 8) {
      detectedRef.current = true;
      stopScanner();
      onDetected(code);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleManualSubmit();
    }
  }

  return (
    <div className="space-y-3">
      {/* Camera viewfinder */}
      {hasCamera && (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <div id={READER_ID} ref={containerRef} />

          {/* Starting overlay */}
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Scanning indicator */}
          {cameraActive && !starting && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white text-xs">Scanning...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No camera fallback */}
      {!hasCamera && (
        <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg">
          Camera not available. Enter the barcode number manually below.
        </div>
      )}

      {/* Manual barcode entry — always available */}
      <div>
        <label className="text-xs text-neutral-500 block mb-1">
          Or enter barcode number
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 5901234123457"
            className="flex-1 px-3 py-2 bg-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <button
            onClick={handleManualSubmit}
            disabled={manualCode.trim().length < 8}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            Look up
          </button>
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-neutral-400 text-center">
        Point your camera at a barcode on any food package
      </p>
    </div>
  );
}
