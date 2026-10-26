import React, { useState } from 'react';
import { InventoryItem } from '../types/inventory';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import {
  Printer,
  X,
  Tag,
  QrCode,
  Barcode,
  Layers,
  Download,
  Smartphone,
  Check,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { HazardBadge } from './HazardBadge';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export type LabelLayoutMode = 'COMBO' | 'QR_ONLY' | 'BARCODE_ONLY';

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [layoutMode, setLayoutMode] = useState<LabelLayoutMode>('COMBO');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [includeBatchInfo, setIncludeBatchInfo] = useState<boolean>(true);
  const [qrSize, setQrSize] = useState<number>(110);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const primaryBatch = item.batches && item.batches.length > 0 ? item.batches[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold">Cetak Label Fisik Rak, Drum & Kemasan</span>
              <span className="text-[11px] font-normal text-slate-400">
                Dilengkapi Barcode 1D & QR Code 2D untuk Pemindaian Cepat Ponsel
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak ({printCopies} Lembar)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout Mode Selector & Controls */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">Format Label:</span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode('COMBO')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  layoutMode === 'COMBO'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kombinasi (Barcode + QR)</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('QR_ONLY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  layoutMode === 'QR_ONLY'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code Fokus (Mobile)</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('BARCODE_ONLY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  layoutMode === 'BARCODE_ONLY'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Barcode 1D Saja</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="copies-select" className="text-slate-400 font-mono text-[11px]">
                Jumlah:
              </label>
              <select
                id="copies-select"
                value={printCopies}
                onChange={(e) => setPrintCopies(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
              >
                <option value={1}>1 Stiker</option>
                <option value={2}>2 Stiker</option>
                <option value={4}>4 Stiker</option>
                <option value={8}>8 Stiker</option>
                <option value={12}>12 Stiker</option>
              </select>
            </div>

            {item.batches && item.batches.length > 0 && (
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBatchInfo}
                  onChange={(e) => setIncludeBatchInfo(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-[11px]">Sertakan Batch/ED</span>
              </label>
            )}
          </div>
        </div>

        {/* Informative Mobile Hint */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300 no-print">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Pindai Cepat dengan Ponsel:</strong> QR Code dapat langsung dipindai dengan kamera ponsel/tablet kamera bawaan atau aplikasi scanner untuk membuka data barang.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            SKU: <strong className="text-white">{item.sku}</strong>
          </span>
        </div>

        {/* Label Layout Live Preview */}
        <div className="p-6 bg-slate-800/40 flex flex-col items-center justify-center min-h-[380px]">
          {/* We render multiple copies if requested, inside printable container */}
          <div className="space-y-4 print-container">
            {Array.from({ length: printCopies }).map((_, copyIndex) => (
              <div
                key={`label-copy-${copyIndex}`}
                className="w-[380px] bg-white text-slate-900 border-2 border-slate-900 p-4 rounded-lg shadow-xl print-card print:border-black print:shadow-none print:m-0"
              >
                {/* Label Header */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-2.5">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-800 uppercase block">
                      LOGIX WAREHOUSE HAZMAT
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-950 flex items-center gap-1">
                      <span>{item.category}</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span className="text-slate-700 text-[10px]">{item.subCategory}</span>
                    </span>
                  </div>
                  <div>
                    <HazardBadge hazard={item.hazardClass} />
                  </div>
                </div>

                {/* Item Name */}
                <div className="mb-2.5">
                  <h2 className="text-sm font-black leading-tight text-slate-900 line-clamp-2">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-600 font-mono">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-700 inline" />
                      {item.location}
                    </span>
                    <span>·</span>
                    <span>Satuan: {item.unit}</span>
                  </div>
                </div>

                {/* Barcode & QR Code Rendering based on layout mode */}
                {layoutMode === 'COMBO' && (
                  <div className="my-2.5 p-2 bg-slate-50 border border-slate-300 rounded flex items-center justify-between gap-2">
                    {/* Left: 1D Barcode */}
                    <div className="flex-1 flex flex-col items-center justify-center pr-2 border-r border-slate-200">
                      <BarcodeRenderer value={item.sku} width={200} height={48} showText={true} />
                      <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                        SCANNER LASER 1D
                      </span>
                    </div>

                    {/* Right: 2D QR Code */}
                    <div className="flex flex-col items-center justify-center pl-1 shrink-0">
                      <QRCodeRenderer
                        value={item.sku}
                        size={92}
                        showText={false}
                        downloadable={false}
                        className="p-1 border-0 shadow-none bg-transparent"
                      />
                      <span className="text-[9px] font-mono text-slate-700 font-bold mt-0.5 flex items-center gap-0.5">
                        <Smartphone className="w-2.5 h-2.5" />
                        MOBILE QR
                      </span>
                    </div>
                  </div>
                )}

                {layoutMode === 'QR_ONLY' && (
                  <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4">
                      <QRCodeRenderer
                        value={item.sku}
                        size={140}
                        showText={true}
                        downloadable={false}
                        className="p-1.5 border-0 shadow-none bg-transparent"
                      />
                      <div className="text-left space-y-1.5 font-mono text-[11px] text-slate-700">
                        <div className="bg-slate-200/70 p-1.5 rounded">
                          <span className="text-[9px] text-slate-500 block">KODE IDENTIFIKASI:</span>
                          <strong className="text-slate-900 text-xs block">{item.sku}</strong>
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Arahkan kamera smartphone ke QR Code untuk memuat detail inventaris langsung.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {layoutMode === 'BARCODE_ONLY' && (
                  <div className="my-3 p-2 bg-slate-50 border border-slate-300 rounded flex flex-col items-center justify-center">
                    <BarcodeRenderer value={item.sku} width={280} height={60} showText={true} />
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      KODE BARCODE STANDAR CODE128
                    </span>
                  </div>
                )}

                {/* Metadata Details on Sticker */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-300 pt-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[9px]">LOKASI PENYIMPANAN:</span>
                    <span className="font-bold text-slate-900">{item.location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px]">STATUS BAHAYA:</span>
                    <span className="font-bold text-slate-900">{item.hazardClass || 'GENERAL'}</span>
                  </div>
                </div>

                {includeBatchInfo && primaryBatch && primaryBatch.expiredDate && (
                  <div className="mt-2 pt-1 border-t border-dashed border-slate-300 text-[10px] flex justify-between font-mono text-slate-700">
                    <span>Lot/Batch: {primaryBatch.batchNo}</span>
                    <span className="font-bold text-slate-950">
                      ED: {primaryBatch.expiredDate}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Standar Label: 100mm x 75mm (Kompatibel printer label thermal Zebra, Xprinter & Direct Thermal).</span>
          </div>

          <div className="flex items-center gap-2">
            <QRCodeRenderer
              value={item.sku}
              size={20}
              showText={false}
              downloadable={true}
              className="p-0 border-0 bg-transparent shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
