import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  StockTransaction,
  TransactionType,
  MasterOperator,
  MasterProjectDestination,
  SystemSettings,
} from '../types/inventory';
import { AuthUser } from '../types/auth';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatNumberID } from '../utils/formatters';
import { getMinThreshold } from '../utils/stockUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  defaultItem?: InventoryItem | null;
  defaultType?: TransactionType;
  defaultQuantity?: number;
  operators?: MasterOperator[];
  destinations?: MasterProjectDestination[];
  settings?: SystemSettings;
  currentUserName?: string;
  currentUser?: AuthUser | null;
  onSaveTransaction: (trxData: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultItem,
  defaultType = 'OUT',
  defaultQuantity,
  operators = [],
  destinations = [],
  settings,
  currentUserName,
  currentUser,
  onSaveTransaction,
}) => {
  const isOperator = currentUser?.role === 'OPERATOR';
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [trxType, setTrxType] = useState<TransactionType>(isOperator ? 'OUT' : defaultType);
  const [quantity, setQuantity] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [projectOrLocation, setProjectOrLocation] = useState<string>('');
  const [operator, setOperator] = useState<string>(currentUserName || '');
  const [batchNo, setBatchNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    if (defaultItem) {
      setSelectedItemId(defaultItem.id);
      if (defaultItem.batches && defaultItem.batches.length > 0) {
        setBatchNo(defaultItem.batches[0].batchNo);
      }
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [defaultItem, items]);

  useEffect(() => {
    if (defaultType) {
      setTrxType(defaultType);
    }
  }, [defaultType]);

  useEffect(() => {
    if (defaultQuantity && defaultQuantity > 0) {
      setQuantity(defaultQuantity.toString());
    }
  }, [defaultQuantity]);

  // Auto-generate reference number if empty
  useEffect(() => {
    if (isOpen && !referenceNo) {
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomDigit = Math.floor(100 + Math.random() * 900);
      const defaultPrefixIn = settings?.prefixSuratJalanIn || 'SJ-IN';
      const defaultPrefixOut = settings?.prefixSuratJalanOut || 'SJ-OUT';
      const defaultPrefixSO = settings?.prefixStockOpname || 'SO-ADJ';
      const prefix = trxType === 'IN' ? defaultPrefixIn : trxType === 'OUT' ? defaultPrefixOut : defaultPrefixSO;
      setReferenceNo(`${prefix}-${dateCode}-${randomDigit}`);
    }
    if (isOpen && !operator && currentUserName) {
      setOperator(currentUserName);
    }
  }, [isOpen, trxType, referenceNo, settings, currentUserName, operator]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId);
  const qtyNumber = parseFloat(quantity) || 0;
  const currentStock = currentItem ? currentItem.currentStock : 0;

  let calculatedNewStock = currentStock;
  if (trxType === 'IN') {
    calculatedNewStock = currentStock + qtyNumber;
  } else if (trxType === 'OUT') {
    calculatedNewStock = currentStock - qtyNumber;
  } else if (trxType === 'ADJUSTMENT') {
    calculatedNewStock = qtyNumber;
  }

  const isOutOfStock = trxType === 'OUT' && qtyNumber > currentStock;
  const isInvalidQty = qtyNumber <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || isOutOfStock || isInvalidQty) return;

    onSaveTransaction({
      type: trxType,
      itemId: currentItem.id,
      sku: currentItem.sku,
      itemName: currentItem.name,
      category: currentItem.category,
      quantity: qtyNumber,
      unit: currentItem.unit,
      previousStock: currentStock,
      newStock: calculatedNewStock,
      referenceNo: referenceNo.trim() || `TRX-${Date.now()}`,
      projectOrLocation: projectOrLocation.trim() || (trxType === 'IN' ? 'Gudang Pusat' : 'Operasional Umum'),
      operator: operator.trim() || 'Petugas Gudang',
      batchNo: batchNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const filteredItems = items.filter((it) => {
    if (isOperator && it.category === 'PERLENGKAPAN') return false;
    return (
      it.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      it.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
      it.category.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              {isOperator ? 'Input Pengeluaran Obat & BBM' : 'Input Transaksi Mutasi Stok'}
              <span className="text-xs font-mono font-normal text-slate-400">
                (Real-time Inventory)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isOperator
                ? 'Khusus pencatatan pengeluaran obat kimia fumigasi, spraying fogging, dan bahan bakar minyak'
                : 'Catat pergerakan keluar masuk BBM, obat fumigasi, spraying, dan perlengkapan'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {/* Transaction Type Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Jenis Transaksi Mutasi
            </label>
            {isOperator ? (
              <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  <span>Pengeluaran Obat Kimia &amp; BBM (Role Operator)</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BARANG KELUAR (OUT)
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTrxType('OUT')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    trxType === 'OUT'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Barang Keluar (Pakai/Proyek)
                </button>

                <button
                  type="button"
                  onClick={() => setTrxType('IN')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    trxType === 'IN'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Barang Masuk (Restock/Supplier)
                </button>

                <button
                  type="button"
                  onClick={() => setTrxType('ADJUSTMENT')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    trxType === 'ADJUSTMENT'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Penyesuaian Fisik (Opname)
                </button>
              </div>
            )}
          </div>

          {/* Select Item */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Pilih Barang / Komoditas
              </label>
              <input
                type="text"
                placeholder="Cari SKU atau nama..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-44"
              />
            </div>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const it = items.find((x) => x.id === e.target.value);
                if (it && it.batches && it.batches.length > 0) {
                  setBatchNo(it.batches[0].batchNo);
                } else {
                  setBatchNo('');
                }
              }}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
            >
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.sku}] {item.name} — Stok: {formatNumberID(item.currentStock)} {item.unit} ({item.category})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Impact Visual Indicator */}
          {currentItem && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Stok Saat Ini:</span>{' '}
                <span className="font-mono font-bold text-white">
                  {formatNumberID(currentItem.currentStock)} {currentItem.unit}
                </span>
                <span className="text-slate-500 ml-2">({currentItem.location})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Prediksi Stok Baru:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    calculatedNewStock < 0
                      ? 'text-rose-400'
                      : calculatedNewStock <= getMinThreshold(currentItem)
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {formatNumberID(calculatedNewStock)} {currentItem.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Jumlah Mutasi ({currentItem?.unit || 'Unit'})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                  {currentItem?.unit}
                </span>
              </div>
              {isOutOfStock && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Stok tidak mencukupi! Maksimal pengeluaran: {currentItem?.currentStock} {currentItem?.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                No. Referensi / No. Surat Jalan / SPK
              </label>
              <input
                type="text"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Contoh: SJ-OUT-2026/09/23-01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Project / Purpose & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tujuan / Proyek / Lokasi Kerja
              </label>
              <input
                type="text"
                required
                list="destination-list"
                value={projectOrLocation}
                onChange={(e) => setProjectOrLocation(e.target.value)}
                placeholder={
                  trxType === 'IN'
                    ? 'Penerimaan Tangki Pertamina / Supplier'
                    : 'Fumigasi Palka Kapal / Fogging Wilayah A'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <datalist id="destination-list">
                {destinations.map((d) => (
                  <option key={d.id} value={`${d.name} (${d.clientName})`} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Petugas Lapangan / Operator / Penerima
              </label>
              <input
                type="text"
                required
                list="operator-list"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama Teknisi / Fumigator PIC"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <datalist id="operator-list">
                {operators.map((op) => (
                  <option key={op.id} value={`${op.name} (${op.role})`} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Batch Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                No. Lot / Batch Produksi (Opsional)
              </label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="Contoh: PTX-IND-2026-03"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Catatan Khusus (Dosis / Target Hama / K3)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan tambahan..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isOutOfStock || isInvalidQty}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                isOutOfStock || isInvalidQty
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : trxType === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : trxType === 'OUT'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Mutasi Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
