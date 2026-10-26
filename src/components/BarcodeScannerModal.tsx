import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types/inventory';
import {
  Scan,
  X,
  Search,
  Check,
  AlertCircle,
  ArrowUpRight,
  Camera,
  CameraOff,
  QrCode,
  Smartphone,
  Tag,
  Boxes,
} from 'lucide-react';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import { formatNumberID } from '../utils/formatters';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem, action?: 'VIEW' | 'TRANSACT') => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
}) => {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedCode('');
      setMatchedItem(null);
      setNotFound(false);
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung oleh browser ini.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      setCameraError(
        'Akses kamera ditolak atau tidak tersedia. Gunakan pencarian manual atau ketik kode di bawah.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleScanInput = (code: string) => {
    setScannedCode(code);
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setMatchedItem(null);
      setNotFound(false);
      return;
    }

    const found = items.find(
      (it) =>
        it.sku.toUpperCase() === cleaned ||
        it.id.toUpperCase() === cleaned ||
        it.name.toLowerCase().includes(cleaned.toLowerCase())
    );

    if (found) {
      setMatchedItem(found);
      setNotFound(false);
    } else {
      setMatchedItem(null);
      setNotFound(true);
    }
  };

  const handleSampleClick = (sku: string) => {
    handleScanInput(sku);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold">Scanner Barcode 1D & QR Code 2D</span>
              <span className="text-[11px] font-normal text-slate-400">
                Pindai label fisik gudang via kamera HP / input kode SKU
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Simulation / Live Camera */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col items-center">
          <div className="relative w-72 h-44 border-2 border-dashed border-amber-500/60 rounded-xl flex items-center justify-center bg-slate-900 overflow-hidden shadow-inner">
            {/* Live Video Feed */}
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Scan className="w-7 h-7 text-amber-400/70 animate-pulse" />
                  <QrCode className="w-7 h-7 text-amber-400/70" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase block font-semibold">
                  Arahkan Barcode atau QR Code
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Kompatibel dengan pemindai fisik laser & smartphone
                </span>
              </div>
            )}

            {/* Viewfinder corner brackets */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-400 z-20 pointer-events-none"></div>
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-400 z-20 pointer-events-none"></div>
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-400 z-20 pointer-events-none"></div>
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-400 z-20 pointer-events-none"></div>

            {/* Laser scanning line */}
            <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse z-20 pointer-events-none"></div>
          </div>

          {/* Camera Controls */}
          <div className="flex items-center gap-2 mt-3">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Nyalakan Kamera HP / Webcam</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800 transition-colors cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Matikan Kamera</span>
              </button>
            )}
          </div>

          {cameraError && (
            <p className="text-[11px] text-amber-400/90 mt-2 text-center max-w-xs">
              {cameraError}
            </p>
          )}
        </div>

        {/* Input & Search */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Hasil Pindaian Barcode / QR Code / SKU:</span>
              <span className="text-[10px] text-slate-400 font-mono">Tekan Enter atau klik contoh</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Pindai atau ketik SKU (Contoh: BBM-SLR-35)..."
                value={scannedCode}
                onChange={(e) => handleScanInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Quick Click Samples */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
              Contoh Cepat Barcode / QR Code Terdaftar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 5).map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleSampleClick(it.sku)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <QrCode className="w-3 h-3 text-amber-400" />
                  <span>{it.sku}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Result Card with QR Code and Barcode Preview */}
          {matchedItem && (
            <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/40 text-xs space-y-3 animate-in fade-in duration-200 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Item Berhasil Teridentifikasi
                </span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {matchedItem.sku}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {matchedItem.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {matchedItem.category} · {matchedItem.subCategory}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono mt-2 pt-2 border-t border-emerald-500/20">
                    <div>
                      Stok Fisik:{' '}
                      <strong className="text-white">
                        {formatNumberID(matchedItem.currentStock)} {matchedItem.unit}
                      </strong>
                    </div>
                    <div>
                      Lokasi:{' '}
                      <span className="text-slate-200">{matchedItem.location}</span>
                    </div>
                  </div>
                </div>

                {/* Micro QR Code preview of matched item */}
                <div className="shrink-0 bg-white p-1 rounded border border-slate-200 shadow">
                  <QRCodeRenderer
                    value={matchedItem.sku}
                    size={64}
                    showText={false}
                    className="p-0 border-0 shadow-none bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => {
                    onSelectItem(matchedItem, 'TRANSACT');
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Langsung Buat Transaksi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectItem(matchedItem, 'VIEW');
                    onClose();
                  }}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
                >
                  <span>Detail Barang</span>
                </button>
              </div>
            </div>
          )}

          {notFound && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Kode &quot;<strong>{scannedCode}</strong>&quot; tidak terdaftar di database gudang. Pastikan kode barcode atau QR Code valid.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
