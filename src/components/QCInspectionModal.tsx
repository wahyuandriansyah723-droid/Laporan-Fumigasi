import React, { useState } from 'react';
import { InventoryItem, BatchItem } from '../types/inventory';
import { AuthUser } from '../types/auth';
import {
  Microscope,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  Calendar,
  X,
  Search,
  Filter,
  Check,
  Ban,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { HazardBadge } from './HazardBadge';
import { getExpiryStatus } from '../utils/formatters';

interface QCInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currentUser: AuthUser;
  onUpdateItemBatches: (itemId: string, updatedBatches: BatchItem[]) => void;
  onShowToast: (message: string) => void;
}

export const QCInspectionModal: React.FC<QCInspectionModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  onUpdateItemBatches,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEAR_EXP' | 'QUARANTINE' | 'RELEASED'>('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  if (!isOpen) return null;

  // Filter items with batches or chemical/BBM
  const relevantItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'NEAR_EXP') {
      return item.batches?.some((b) => {
        if (!b.expiredDate) return false;
        const status = getExpiryStatus(b.expiredDate);
        return status.status === 'expired' || status.status === 'warning';
      });
    }

    if (filterStatus === 'QUARANTINE') {
      return item.batches?.some((b) => b.qcStatus === 'QUARANTINE');
    }

    if (filterStatus === 'RELEASED') {
      return item.batches?.some((b) => b.qcStatus === 'RELEASED');
    }

    return true;
  });

  const handleUpdateBatchQC = (
    item: InventoryItem,
    batchId: string,
    newStatus: 'RELEASED' | 'QUARANTINE' | 'REJECTED',
    coaNo?: string
  ) => {
    const updated = (item.batches || []).map((b) => {
      if (b.id === batchId) {
        return {
          ...b,
          qcStatus: newStatus,
          coaNumber: coaNo !== undefined ? coaNo : b.coaNumber || `COA-QC-${Date.now().toString().slice(-4)}`,
        };
      }
      return b;
    });

    onUpdateItemBatches(item.id, updated);
    onShowToast(`Status QC Batch diperbarui ke: ${newStatus}`);
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem({
        ...selectedItem,
        batches: updated,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Hub Inspeksi Quality Control (QC) &amp; K3
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUser.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verifikasi kelayakan batch obat fumigan, insektisida, CoA, &amp; monitoring tanggal kedaluwarsa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama bahan kimia, SKU, atau kategori..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('NEAR_EXP')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                filterStatus === 'NEAR_EXP'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Mendekati Expired</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('QUARANTINE')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                filterStatus === 'QUARANTINE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Karantina
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('RELEASED')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                filterStatus === 'RELEASED'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Lolos Uji (Released)
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {relevantItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="font-semibold text-sm">Tidak ada barang yang cocok dengan filter QC</p>
              <p className="text-xs text-slate-500 mt-1">
                Semua batch saat ini dalam kondisi terpantau aman.
              </p>
            </div>
          ) : (
            relevantItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{item.sku}</span>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <HazardBadge hazard={item.hazardClass} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kategori: <span className="text-slate-300">{item.category}</span> &bull; Stok Aktif:{' '}
                      <span className="font-bold text-white font-mono">{item.currentStock} {item.unit}</span>
                      {item.activeIngredients && (
                        <span> &bull; Bahan Aktif: <span className="text-emerald-400">{item.activeIngredients}</span></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Batches Table for this item */}
                <div className="space-y-2 mt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daftar Batch &amp; Sertifikat Analisis (CoA):</span>
                  </p>

                  {(!item.batches || item.batches.length === 0) ? (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-500 italic">
                      Belum ada rincian batch terdaftar untuk item ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {item.batches.map((batch) => {
                        const expStatus = batch.expiredDate ? getExpiryStatus(batch.expiredDate) : null;
                        const isQuarantine = batch.qcStatus === 'QUARANTINE';
                        const isReleased = batch.qcStatus === 'RELEASED';

                        return (
                          <div
                            key={batch.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-slate-200">
                                    Batch #{batch.batchNo}
                                  </span>
                                  {isReleased && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      Lolos QC
                                    </span>
                                  )}
                                  {isQuarantine && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      Karantina
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                  Qty: <span className="font-mono font-bold text-white">{batch.quantity}</span> {item.unit}
                                  {batch.supplier && <span> &bull; Pemasok: {batch.supplier}</span>}
                                </p>
                              </div>

                              {expStatus && (
                                <div
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                    expStatus.status === 'expired'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : expStatus.status === 'warning'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  Exp: {batch.expiredDate} ({expStatus.label})
                                </div>
                              )}
                            </div>

                            {/* QC Action Bar */}
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-slate-400 font-mono">
                                CoA: {batch.coaNumber || 'Belum diisi'}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBatchQC(item, batch.id, 'RELEASED')}
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                                  title="Verifikasi Mutu & Terbitkan (Release)"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Release</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBatchQC(item, batch.id, 'QUARANTINE')}
                                  className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                                  title="Tahan untuk Pengujian Ulang (Hold / Karantina)"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Karantina</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Standar Inspeksi Farmasi Kimia &amp; Karantina Pertanian (Badan Karantina Indonesia)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-colors"
          >
            Tutup Inspeksi
          </button>
        </div>
      </div>
    </div>
  );
};
