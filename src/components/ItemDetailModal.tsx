import React from 'react';
import { InventoryItem, StockTransaction } from '../types/inventory';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  Calendar,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  ShoppingCart,
  Edit2,
  Trash2,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { HazardBadge } from './HazardBadge';
import { formatCurrencyIDR, formatDateTimeIndo, formatNumberID, getExpiryStatus } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import { AuthUser } from '../types/auth';
import {
  getMinThreshold,
  isBelowMinimumThreshold,
  isCriticallyBelowThreshold,
  getStockDeficit,
  getSuggestedRestockQty,
  getStockThresholdStatus,
} from '../utils/stockUtils';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  transactions: StockTransaction[];
  onOpenTransaction: (item: InventoryItem, type: 'IN' | 'OUT', suggestedQty?: number) => void;
  onPrintLabel: (item: InventoryItem) => void;
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem?: (itemId: string) => void;
  currentUser?: AuthUser;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  transactions,
  onOpenTransaction,
  onPrintLabel,
  onEditItem,
  onDeleteItem,
  currentUser,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsConfirmingDelete(false);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const itemTransactions = transactions.filter((t) => t.itemId === item.id);
  const threshold = getMinThreshold(item);
  const isLow = isBelowMinimumThreshold(item);
  const isCritical = isCriticallyBelowThreshold(item);
  const deficit = getStockDeficit(item);
  const suggested = getSuggestedRestockQty(item);
  const status = getStockThresholdStatus(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>{item.sku}</span>
                <span aria-hidden="true">·</span>
                <span>{item.category}</span>
                <span aria-hidden="true">·</span>
                <HazardBadge hazard={item.hazardClass} />
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{item.name}</h2>
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Proactive Threshold Alert Banner if below threshold */}
          {isLow && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCritical
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-black/30 shrink-0">
                  {isCritical ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {isCritical
                      ? 'PERINGATAN KRITIS: STOK &le; 50% AMBANG BATAS!'
                      : 'PERINGATAN RESTOCK PROAKTIF: DI BAWAH AMBANG BATAS!'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Stok saat ini ({formatNumberID(item.currentStock)} {item.unit}) di bawah ambang batas minimum ({formatNumberID(threshold)} {item.unit}). Defisit: <strong className="text-rose-400">-{formatNumberID(deficit)} {item.unit}</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenTransaction(item, 'IN', suggested);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Restock (+{formatNumberID(suggested)} {item.unit})</span>
              </button>
            </div>
          )}

          {/* Main Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block font-mono">STOK FISIK REAL-TIME</span>
              <div className="text-2xl font-bold font-mono mt-1">
                <span className={isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-white'}>
                  {formatNumberID(item.currentStock)}
                </span>{' '}
                <span className="text-xs font-normal text-slate-400 font-sans uppercase">
                  {item.unit}
                </span>
              </div>
              <div className="mt-2 text-xs font-mono">
                {isCritical ? (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" /> Kritis ({status.ratioPercent}% Ambang)
                  </span>
                ) : isLow ? (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Di bawah ambang ({status.ratioPercent}%)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Stok Aman ({status.ratioPercent}%)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block font-mono">AMBANG BATAS MIN (THRESHOLD)</span>
              <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
                {formatNumberID(threshold)}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans uppercase">
                  {item.unit}
                </span>
              </div>
              <div className="mt-2 text-xs font-mono text-slate-400">
                {isLow ? (
                  <span className="text-rose-400 font-semibold">Defisit: -{formatNumberID(deficit)} {item.unit}</span>
                ) : (
                  <span className="text-slate-400">Surplus: +{formatNumberID(item.currentStock - threshold)} {item.unit}</span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 block font-mono">VALUASI ASET</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatCurrencyIDR(item.currentStock * item.pricePerUnit)}
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono">
                @ {formatCurrencyIDR(item.pricePerUnit)} / {item.unit}
              </div>
            </div>
          </div>

          {/* Location & Fuel/Tank info */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px]">LOKASI PENYIMPANAN / RAK:</span>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{item.location}</span>
              </div>
            </div>
            {item.tankCapacity && (
              <div className="sm:text-right">
                <span className="text-slate-400 block text-[11px]">KAPASITAS TANGKI:</span>
                <span className="text-sm font-bold text-amber-400">
                  {formatNumberID(item.tankCapacity)} Liter
                </span>
              </div>
            )}
          </div>

          {/* Chemical / Fuel Technical Details */}
          {(item.activeIngredients || item.isFuel || item.targetPest) && (
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-lg space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Spesifikasi Teknis & K3
              </h4>

              {item.activeIngredients && (
                <div>
                  <span className="text-xs text-slate-400 block">Bahan Aktif (Active Ingredients):</span>
                  <p className="text-xs font-semibold text-slate-100 mt-0.5">
                    {item.activeIngredients}
                  </p>
                </div>
              )}

              {item.targetPest && (
                <div>
                  <span className="text-xs text-slate-400 block">Target Hama & Komoditas:</span>
                  <p className="text-xs text-slate-300 mt-0.5">{item.targetPest}</p>
                </div>
              )}

              {item.dosageRecommendation && (
                <div>
                  <span className="text-xs text-slate-400 block">Rekomendasi Dosis Aplikasi:</span>
                  <p className="text-xs text-slate-300 mt-0.5 font-mono">
                    {item.dosageRecommendation}
                  </p>
                </div>
              )}

              {item.msdsSummary && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-rose-400 font-semibold block">
                    Peringatan Bahaya & MSDS:
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {item.msdsSummary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Barcode & QR Code Label Preview */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* 1D Barcode */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                  BARCODE 1D (LASER SCANNER):
                </span>
                <BarcodeRenderer value={item.sku} width={200} height={55} />
              </div>

              {/* 2D QR Code */}
              <div className="space-y-1 flex flex-col items-center sm:items-start">
                <span className="text-[11px] font-mono text-amber-400 block font-semibold flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  QR CODE 2D (MOBILE SCAN):
                </span>
                <QRCodeRenderer
                  value={item.sku}
                  size={65}
                  showText={false}
                  downloadable={true}
                  className="p-1 border border-slate-700 bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPrintLabel(item)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Tag className="w-4 h-4" />
              <span>Cetak Label (Barcode & QR)</span>
            </button>
          </div>

          {/* Batches & Expiry Dates */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Daftar Batch & Masa Berlaku (Expired Date):
            </h4>
            {item.batches && item.batches.length > 0 ? (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="p-2.5">Nomor Batch</th>
                      <th className="p-2.5">Tgl Masuk</th>
                      <th className="p-2.5">Tgl Kadaluarsa</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                    {item.batches.map((b) => {
                      const exp = getExpiryStatus(b.expiredDate);
                      return (
                        <tr key={b.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold text-white">{b.batchNo}</td>
                          <td className="p-2.5 text-slate-400">{b.receivedDate}</td>
                          <td className="p-2.5">
                            {b.expiredDate ? (
                              <span
                                className={`font-semibold ${
                                  exp.status === 'expired'
                                    ? 'text-rose-400'
                                    : exp.status === 'warning'
                                    ? 'text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              >
                                {b.expiredDate} ({exp.label})
                              </span>
                            ) : (
                              <span className="text-slate-500">Tidak ada</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-bold">
                            {formatNumberID(b.quantity)} {item.unit}
                          </td>
                          <td className="p-2.5 text-slate-400 truncate max-w-[150px]">
                            {b.supplier || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Belum ada data batch spesifik.</p>
            )}
          </div>

          {/* History of Transactions */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Riwayat Mutasi Terakhir ({itemTransactions.length} Transaksi):
            </h4>
            {itemTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Belum ada transaksi mutasi tercatat untuk barang ini.
              </p>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2">Waktu</th>
                      <th className="p-2">Tipe</th>
                      <th className="p-2 text-right">Jumlah</th>
                      <th className="p-2">Lokasi / Proyek</th>
                      <th className="p-2">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-xs">
                    {itemTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="p-2 text-slate-400">
                          {formatDateTimeIndo(tx.timestamp)}
                        </td>
                        <td className="p-2">
                          <span
                            className={`font-bold ${
                              tx.type === 'IN'
                                ? 'text-emerald-400'
                                : tx.type === 'OUT'
                                ? 'text-amber-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-2 text-right font-bold text-white">
                          {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                          {formatNumberID(tx.quantity)} {tx.unit}
                        </td>
                        <td className="p-2 text-slate-200 truncate max-w-[200px]" title={tx.projectOrLocation}>
                          {tx.projectOrLocation}
                        </td>
                        <td className="p-2 text-slate-400">{tx.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons in Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {onEditItem && (!currentUser || currentUser.permissions.canManageInventory) && (
              <button
                type="button"
                onClick={() => {
                  onEditItem(item);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 text-xs font-semibold cursor-pointer transition-colors border border-slate-700"
                title="Ubah Data Barang Ini"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Ubah Data Barang
              </button>
            )}

            {onDeleteItem && (!currentUser || currentUser.permissions.canDeleteItems) && (
              <>
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-950/60 border border-rose-800/80 animate-in fade-in">
                    <span className="text-[11px] text-rose-300 font-semibold px-1.5">
                      Yakin hapus barang ini?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteItem(item.id);
                        onClose();
                      }}
                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors border border-rose-800/40"
                    title="Hapus Barang Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenTransaction(item, 'IN', isLow ? suggested : undefined);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowDownRight className="w-4 h-4" />
              {isLow ? `Restock (+${suggested} ${item.unit})` : 'Penerimaan / Masuk'}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenTransaction(item, 'OUT');
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md"
            >
              <ArrowUpRight className="w-4 h-4" />
              Pengeluaran / Pakai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
