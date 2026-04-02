"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onError?: (error: string) => void;
}

/**
 * Barcode scanner using the native BarcodeDetector API (Chrome/Edge/Android)
 * with a fallback manual entry input.
 *
 * For Safari/Firefox, users can type the barcode manually.
 * On mobile, the camera viewfinder makes scanning easy.
 */
export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasBarcodeAPI, setHasBarcodeAPI] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startScanning = useCallback(async () => {
    // Check for BarcodeDetector support
    if (!("BarcodeDetector" in window)) {
      setHasBarcodeAPI(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // @ts-ignore — BarcodeDetector is not yet in TS types
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });

      scanningRef.current = true;

      const scan = async () => {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              stopCamera();
              onDetected(code);
              return;
            }
          }
        } catch {
          // Detection frame failed — keep going
        }

        if (scanningRef.current) {
          requestAnimationFrame(scan);
        }
      };

      // Start scanning loop
      requestAnimationFrame(scan);
    } catch (err: any) {
      setHasCamera(false);
      onError?.("Camera access denied or unavailable");
    }
  }, [onDetected, onError, stopCamera]);

  useEffect(() => {
    startScanning();
    return () => stopCamera();
  }, [startScanning, stopCamera]);

  function handleManualSubmit() {
    const code = manualCode.trim();
    if (code.length >= 8) {
      onDetected(code);
    }
  }

  return (
    <div className="space-y-3">
      {/* Camera viewfinder */}
      {hasCamera && hasBarcodeAPI && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scanning overlay */}
          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-green-400 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                {/* Animated scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-green-400 animate-pulse top-1/2" />
              </div>
            </div>
          )}
          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Starting camera...
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* No BarcodeDetector API */}
      {!hasBarcodeAPI && (
        <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg">
          Your browser doesn't support barcode scanning natively. Use Chrome or Edge for camera scanning, or enter the barcode number below.
        </div>
      )}

      {/* No camera */}
      {!hasCamera && (
        <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg">
          Camera access denied. You can enter the barcode number manually below.
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
            placeholder="e.g. 5901234123457"
            className="flex-1 px-3 py-2 bg-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
          />
          <button
            onClick={handleManualSubmit}
            disabled={manualCode.trim().length < 8}
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 disabled:opacity-40 transition-colors"
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
