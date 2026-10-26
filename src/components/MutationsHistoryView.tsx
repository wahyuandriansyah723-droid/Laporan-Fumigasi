import React, { useState } from 'react';
import { Category, StockTransaction, TransactionType, InventoryItem } from '../types/inventory';
import {
  Search,
  Download,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { formatDateTimeIndo, formatNumberID } from '../utils/formatters';

interface MutationsHistoryViewProps {
  transactions: StockTransaction[];
  items: InventoryItem[];
  onPrintSuratJalan: (trx: StockTransaction) => void;
  onExportCSV: () => void;
  onUpdateTransaction?: (trx: StockTransaction) => void;
  onDeleteTransaction?: (trxId: string, revertStock: boolean) => void;
  onDeleteAllTransactions?: (revertStock: boolean) => void;
  onReloadSampleTransactions?: () => void;
  onNavigateToOutflows?: () => void;
}

export const MutationsHistoryView: React.FC<MutationsHistoryViewProps> = ({
  transactions,
  items,
  onPrintSuratJalan,
  onExportCSV,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteAllTransactions,
  onReloadSampleTransactions,
  onNavigateToOutflows,
}) => {
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Transaction State
  const [editingTrx, setEditingTrx] = useState<StockTransaction | null>(null);
  const [editRefNo, setEditRefNo] = useState('');
  const [editOperator, setEditOperator] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Transaction with Revert Stock Confirmation State
  const [deletingTrx, setDeletingTrx] = useState<StockTransaction | null>(null);
  const [revertStockOnDelete, setRevertStockOnDelete] = useState(true);

  // Delete ALL Transactions Confirmation State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [revertAllStock, setRevertAllStock] = useState(false);

  const handleOpenEdit = (trx: StockTransaction) => {
    setEditingTrx(trx);
    setEditRefNo(trx.referenceNo);
    setEditOperator(trx.operator);
    setEditProject(trx.projectOrLocation);
    setEditNotes(trx.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx || !onUpdateTransaction) return;

    const updated: StockTransaction = {
      ...editingTrx,
      referenceNo: editRefNo.trim() || editingTrx.referenceNo,
      operator: editOperator.trim() || editingTrx.operator,
      projectOrLocation: editProject.trim() || editingTrx.projectOrLocation,
      notes: editNotes.trim() || undefined,
    };

    onUpdateTransaction(updated);
    setEditingTrx(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTrx || !onDeleteTransaction) return;
    onDeleteTransaction(deletingTrx.id, revertStockOnDelete);
    setDeletingTrx(null);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = t.referenceNo.toLowerCase().includes(q);
      const matchName = t.itemName.toLowerCase().includes(q);
      const matchSku = t.sku.toLowerCase().includes(q);
      const matchProj = t.projectOrLocation.toLowerCase().includes(q);
      const matchOp = t.operator.toLowerCase().includes(q);
      if (!matchRef && !matchName && !matchSku && !matchProj && !matchOp) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Buku Mutasi & Log Pergerakan Stok Gudang
              <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-slate-800 text-slate-300">
                {transactions.length} Total Riwayat
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit jejak pengeluaran BBM, aplikasi pestisida fumigasi, dan penerimaan logistik
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToOutflows && (
              <button
                type="button"
                onClick={onNavigateToOutflows}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Tabel Rekap Pengeluaran (Hari/Bulan/Tahun)
              </button>
            )}
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Mutasi CSV / Excel
            </button>
            {onDeleteAllTransactions && transactions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRevertAllStock(false);
                  setShowDeleteAllModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-colors"
                title="Hapus seluruh riwayat mutasi dari buku log"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua Mutasi
              </button>
            )}
            {transactions.length === 0 && onReloadSampleTransactions && (
              <button
                type="button"
                onClick={onReloadSampleTransactions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                title="Muat kembali data sampel riwayat mutasi"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Sampel Data
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Type selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Transaksi
              </button>
              <button
                type="button"
                onClick={() => setFilterType('OUT')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'OUT'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Keluar (Pakai)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('IN')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'IN'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Masuk (Terima)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ADJUSTMENT')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === 'ADJUSTMENT'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Opname Fisik
              </button>
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'ALL')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="BBM">BBM & Pelumas</option>
              <option value="FUMIGASI">Obat Fumigasi</option>
              <option value="SPRAYING_FOGGING">Spraying & Fogging</option>
              <option value="PERLENGKAPAN">Perlengkapan & APD</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari no surat jalan, proyek, teknisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu & No. Referensi</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Item Barang & SKU</th>
                <th className="py-3 px-3 text-right">Jumlah Mutasi</th>
                <th className="py-3 px-3 text-center">Stok Awal → Akhir</th>
                <th className="py-3 px-3">Tujuan Proyek / Lokasi Kerja</th>
                <th className="py-3 px-3">Petugas / Operator</th>
                <th className="py-3 px-4 text-center">Aksi Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                        <Trash2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-sm font-bold text-white">
                        Buku Log Mutasi Masih Kosong
                      </div>
                      <p className="text-xs text-slate-400 text-center leading-relaxed">
                        Seluruh riwayat mutasi telah dibersihkan. Catatan transaksi baru akan otomatis masuk ke sini saat Anda melakukan pengeluaran barang (Surat Jalan), barang masuk, atau penyesuaian stock opname.
                      </p>
                      {onReloadSampleTransactions && (
                        <button
                          type="button"
                          onClick={onReloadSampleTransactions}
                          className="mt-2 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Muat Ulang Sampel Data Mutasi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ditemukan data mutasi dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Timestamp & Ref */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-400 text-[11px]">
                        {formatDateTimeIndo(trx.timestamp)}
                      </div>
                      <div className="font-mono font-bold text-amber-400 text-xs mt-0.5">
                        {trx.referenceNo}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          trx.type === 'IN'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : trx.type === 'OUT'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {trx.type === 'IN' ? (
                          <>
                            <ArrowDownRight className="w-3 h-3" /> MASUK
                          </>
                        ) : trx.type === 'OUT' ? (
                          <>
                            <ArrowUpRight className="w-3 h-3" /> KELUAR
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" /> OPNAME
                          </>
                        )}
                      </span>
                    </td>

                    {/* Item */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs">{trx.itemName}</div>
                      <div className="font-mono text-slate-400 text-[11px]">
                        {trx.sku} · {trx.category}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                      <span
                        className={
                          trx.type === 'IN'
                            ? 'text-emerald-400'
                            : trx.type === 'OUT'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }
                      >
                        {trx.type === 'IN' ? '+' : trx.type === 'OUT' ? '-' : ''}
                        {formatNumberID(trx.quantity)}
                      </span>{' '}
                      <span className="text-[11px] font-normal text-slate-400 font-sans">
                        {trx.unit}
                      </span>
                    </td>

                    {/* Stock Before -> After */}
                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      <span className="text-slate-400">{formatNumberID(trx.previousStock)}</span>
                      <span className="text-slate-600 mx-1.5">→</span>
                      <span className="font-bold text-white">{formatNumberID(trx.newStock)}</span>
                    </td>

                    {/* Project / Location */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="font-medium text-slate-200 truncate" title={trx.projectOrLocation}>
                        {trx.projectOrLocation}
                      </div>
                      {trx.notes && (
                        <div className="text-[11px] text-slate-400 italic truncate" title={trx.notes}>
                          {trx.notes}
                        </div>
                      )}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {trx.operator}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPrintSuratJalan(trx)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Cetak Surat Bukti / Surat Jalan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {onUpdateTransaction && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(trx)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Ubah Rincian Mutasi (Edit)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            onClick={() => setDeletingTrx(trx)}
                            className="p-1.5 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Catatan Mutasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: EDIT TRANSACTION ================= */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Ubah Informasi Mutasi ({editingTrx.referenceNo})
              </h3>
              <button
                type="button"
                onClick={() => setEditingTrx(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Barang:</span>
                  <span className="font-bold text-white">{editingTrx.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipe / Jumlah:</span>
                  <span className="font-bold text-amber-400">
                    {editingTrx.type} ({formatNumberID(editingTrx.quantity)} {editingTrx.unit})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Mutasi:</span>
                  <span className="text-slate-300">{formatDateTimeIndo(editingTrx.timestamp)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nomor Referensi / No. Surat Jalan
                </label>
                <input
                  type="text"
                  required
                  value={editRefNo}
                  onChange={(e) => setEditRefNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Petugas / Operator / Fumigator
                </label>
                <input
                  type="text"
                  required
                  value={editOperator}
                  onChange={(e) => setEditOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tujuan Proyek / Lokasi / Fasilitas Pengerjaan
                </label>
                <input
                  type="text"
                  required
                  value={editProject}
                  onChange={(e) => setEditProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Catatan Mutasi / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Keterangan operasional..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTrx(null)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors shadow"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE TRANSACTION CONFIRMATION ================= */}
      {deletingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-900/60 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/40 flex items-center gap-2.5 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              Konfirmasi Hapus Riwayat Mutasi
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300">
                Apakah Anda yakin ingin menghapus catatan mutasi{' '}
                <strong className="text-amber-400 font-mono font-bold">
                  {deletingTrx.referenceNo}
                </strong>{' '}
                untuk barang <strong className="text-white">{deletingTrx.itemName}</strong> (
                {deletingTrx.type}: {formatNumberID(deletingTrx.quantity)} {deletingTrx.unit})?
              </p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={revertStockOnDelete}
                    onChange={(e) => setRevertStockOnDelete(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold block text-slate-100">
                      Kembalikan (Rollback) Stok Barang
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {deletingTrx.type === 'IN'
                        ? `Kurangi stok barang sebanyak ${formatNumberID(deletingTrx.quantity)} ${deletingTrx.unit}`
                        : deletingTrx.type === 'OUT'
                        ? `Tambahkan kembali stok barang sebanyak ${formatNumberID(deletingTrx.quantity)} ${deletingTrx.unit}`
                        : `Kembalikan stok fisik barang ke angka sebelum opname (${formatNumberID(deletingTrx.previousStock)} ${deletingTrx.unit})`}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingTrx(null)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Mutasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE ALL TRANSACTIONS CONFIRMATION ================= */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-900/60 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                Hapus Semua Riwayat Mutasi Gudang
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg text-rose-200">
                <p className="font-semibold text-rose-300 mb-1">
                  Perhatian: Tindakan ini mengosongkan seluruh buku mutasi!
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Anda akan menghapus seluruh data buku log mutasi (
                  <strong className="text-white font-mono">{transactions.length} catatan</strong>{' '}
                  transaksi keluar, masuk, dan penyesuaian opname).
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={revertAllStock}
                    onChange={(e) => setRevertAllStock(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold block text-slate-100">
                      Kembalikan (Rollback) Stok Barang ke Posisi Semula
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 leading-normal">
                      {revertAllStock
                        ? 'Sistem akan menghitung balik seluruh mutasi keluar & masuk, serta mengembalikan jumlah stok inventaris barang ke saldo awal.'
                        : 'Stok barang saat ini TETAP dipertahankan seperti sekarang. Hanya buku log riwayat yang dikosongkan (disarankan jika ingin memulai buku catatan baru).'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteAllTransactions) {
                      onDeleteAllTransactions(revertAllStock);
                    }
                    setShowDeleteAllModal(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow"
                >
                  <Trash2 className="w-4 h-4" />
                  Ya, Hapus Semua ({transactions.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
