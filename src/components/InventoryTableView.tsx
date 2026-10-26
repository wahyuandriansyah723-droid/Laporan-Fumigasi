import React, { useState } from 'react';
import { Category, InventoryItem } from '../types/inventory';
import { AuthUser } from '../types/auth';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Eye,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  Clock,
  LayoutGrid,
  List,
  ShieldAlert,
  TrendingDown,
  Check,
  Save,
  X,
  QrCode,
  Lock,
} from 'lucide-react';
import { HazardBadge } from './HazardBadge';
import { formatCurrencyIDR, formatNumberID, getExpiryStatus } from '../utils/formatters';
import {
  getMinThreshold,
  isBelowMinimumThreshold,
  isCriticallyBelowThreshold,
  getStockDeficit,
  getSuggestedRestockQty,
  getStockThresholdStatus,
} from '../utils/stockUtils';

interface InventoryTableViewProps {
  items: InventoryItem[];
  selectedCategory: Category | 'ALL';
  onSelectCategory: (cat: Category | 'ALL') => void;
  onOpenTransaction: (item: InventoryItem, type: 'IN' | 'OUT', suggestedQty?: number) => void;
  onViewDetails: (item: InventoryItem) => void;
  onPrintLabel: (item: InventoryItem) => void;
  onAddNewItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveItem?: (item: InventoryItem) => void;
  onExportCSV: () => void;
  currentUser?: AuthUser;
}

interface InlineEditState {
  id: string;
  name: string;
  location: string;
  currentStock: number;
  minimumStockThreshold: number;
  pricePerUnit: number;
}

export const InventoryTableView: React.FC<InventoryTableViewProps> = ({
  items,
  selectedCategory,
  onSelectCategory,
  onOpenTransaction,
  onViewDetails,
  onPrintLabel,
  onAddNewItem,
  onEditItem,
  onDeleteItem,
  onSaveItem,
  onExportCSV,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'EXPIRING' | 'TOXIC'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Inline Quick Edit state (allows Edit -> Simpan directly in the stock list)
  const [inlineEditItem, setInlineEditItem] = useState<InlineEditState | null>(null);

  // In-app Delete Confirmation state (replaces browser confirm)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const handleStartInlineEdit = (item: InventoryItem) => {
    setInlineEditItem({
      id: item.id,
      name: item.name,
      location: item.location,
      currentStock: item.currentStock,
      minimumStockThreshold: getMinThreshold(item),
      pricePerUnit: item.pricePerUnit,
    });
  };

  const handleCancelInlineEdit = () => {
    setInlineEditItem(null);
  };

  const handleSaveInlineEdit = () => {
    if (!inlineEditItem) return;
    const original = items.find((i) => i.id === inlineEditItem.id);
    if (!original) return;

    const updated: InventoryItem = {
      ...original,
      name: inlineEditItem.name.trim() || original.name,
      location: inlineEditItem.location.trim() || original.location,
      currentStock: Math.max(0, Number(inlineEditItem.currentStock) || 0),
      minimumStockThreshold: Math.max(0, Number(inlineEditItem.minimumStockThreshold) || 0),
      minStockAlert: Math.max(0, Number(inlineEditItem.minimumStockThreshold) || 0),
      pricePerUnit: Math.max(0, Number(inlineEditItem.pricePerUnit) || 0),
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    if (onSaveItem) {
      onSaveItem(updated);
    } else {
      onEditItem(updated);
    }
    setInlineEditItem(null);
  };

  const filteredItems = items.filter((item) => {
    // Category match
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    // Status match
    if (statusFilter === 'LOW' && !isBelowMinimumThreshold(item)) {
      return false;
    }
    if (statusFilter === 'TOXIC' && item.hazardClass !== 'TOXIC') {
      return false;
    }
    if (statusFilter === 'EXPIRING') {
      const hasExpiringBatch = item.batches?.some((b) => {
        const exp = getExpiryStatus(b.expiredDate);
        return exp.status === 'warning' || exp.status === 'expired';
      });
      if (!hasExpiringBatch) return false;
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchLocation = item.location.toLowerCase().includes(q);
      const matchSub = item.subCategory.toLowerCase().includes(q);
      const matchIngr = item.activeIngredients?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchLocation && !matchSub && !matchIngr) {
        return false;
      }
    }

    return true;
  });

  const belowThresholdCount = items.filter(isBelowMinimumThreshold).length;

  return (
    <div className="space-y-4">
      {/* Category Tabs & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
        {/* Top row: Category Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onSelectCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Inventaris ({items.length})
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('BBM')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'BBM'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⛽ BBM & Pelumas ({items.filter((i) => i.category === 'BBM').length})
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('FUMIGASI')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'FUMIGASI'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ☠️ Obat Fumigasi ({items.filter((i) => i.category === 'FUMIGASI').length})
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('SPRAYING_FOGGING')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'SPRAYING_FOGGING'
                  ? 'bg-yellow-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💨 Spraying & Fogging ({items.filter((i) => i.category === 'SPRAYING_FOGGING').length})
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('PERLENGKAPAN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'PERLENGKAPAN'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Alat & APD ({items.filter((i) => i.category === 'PERLENGKAPAN').length})
            </button>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
              title="Unduh Data CSV untuk Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            {currentUser && !currentUser.permissions.canManageInventory ? (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-500 text-xs font-semibold border border-slate-700/60 cursor-not-allowed"
                title="Hanya Admin yang dapat menambah item inventaris baru"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Tambah Barang (Admin)
              </span>
            ) : (
              <button
                type="button"
                onClick={onAddNewItem}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                Tambah Barang Baru
              </button>
            )}
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, SKU, bahan aktif, lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('LOW')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'LOW'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
                title="Barang yang stoknya berada di bawah atau sama dengan ambang batas minimum"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Di Bawah Ambang Min ({belowThresholdCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('EXPIRING')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'EXPIRING'
                    ? 'bg-yellow-500/20 text-yellow-400 font-semibold border border-yellow-500/30'
                    : 'text-slate-400 hover:text-yellow-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                Mendekati ED
              </button>
            </div>

            {/* Density / View toggle */}
            <div className="flex items-center border border-slate-800 rounded p-0.5 bg-slate-950">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Tampilan Tabel Lengkap"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded ${
                  viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Barang & SKU</th>
                  <th className="py-3 px-3">Kategori & HazMat</th>
                  <th className="py-3 px-3">Lokasi Gudang</th>
                  <th className="py-3 px-3 text-right">Stok Riil / Ambang Min</th>
                  <th className="py-3 px-3 text-center">Status Ambang</th>
                  <th className="py-3 px-3">Batch & Expired</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada barang yang cocok dengan kriteria pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const threshold = getMinThreshold(item);
                    const isLow = isBelowMinimumThreshold(item);
                    const isCritical = isCriticallyBelowThreshold(item);
                    const deficit = getStockDeficit(item);
                    const suggested = getSuggestedRestockQty(item);
                    const status = getStockThresholdStatus(item);

                    const primaryBatch = item.batches && item.batches.length > 0 ? item.batches[0] : null;
                    const expStatus = getExpiryStatus(primaryBatch?.expiredDate);

                    const isEditingThis = inlineEditItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors group ${
                          isEditingThis
                            ? 'bg-amber-950/30 border-l-4 border-l-amber-400'
                            : isCritical
                            ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-4 border-l-rose-500'
                            : isLow
                            ? 'bg-amber-950/15 hover:bg-amber-950/25 border-l-4 border-l-amber-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* SKU & Name */}
                        <td className="py-3 px-4">
                          {isEditingThis ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                                Nama Barang
                              </label>
                              <input
                                type="text"
                                value={inlineEditItem.name}
                                onChange={(e) =>
                                  setInlineEditItem({ ...inlineEditItem, name: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-amber-500 rounded px-2 py-1 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
                                placeholder="Nama barang..."
                                autoFocus
                              />
                              <div className="font-mono text-slate-400 text-[10px] flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-slate-300">{item.sku}</span>
                                <span>·</span>
                                <span>{item.subCategory}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="font-bold text-white text-sm hover:text-amber-400 cursor-pointer flex items-center gap-1.5"
                                onClick={() => onViewDetails(item)}
                              >
                                <span>{item.name}</span>
                                {isCritical && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" title="Stok Kritis" />
                                )}
                              </div>
                              <div className="font-mono text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                                <span className="font-semibold text-slate-300">{item.sku}</span>
                                <span aria-hidden="true">·</span>
                                <span>{item.subCategory}</span>
                              </div>
                              {item.activeIngredients && (
                                <div className="text-[10px] text-slate-400 italic truncate max-w-xs mt-0.5">
                                  {item.activeIngredients}
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        {/* Category & Hazard */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-[11px] text-slate-300 font-medium">
                            {item.category}
                          </div>
                          <div className="mt-1">
                            <HazardBadge hazard={item.hazardClass} />
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {isEditingThis ? (
                            <div className="space-y-1">
                              <label className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                                Lokasi Rak/Tangki
                              </label>
                              <input
                                type="text"
                                value={inlineEditItem.location}
                                onChange={(e) =>
                                  setInlineEditItem({ ...inlineEditItem, location: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-amber-400 focus:outline-none"
                                placeholder="Lokasi..."
                              />
                            </div>
                          ) : (
                            item.location
                          )}
                        </td>

                        {/* Real-time Stock vs Minimum Threshold */}
                        <td className="py-3 px-3 text-right font-mono">
                          {isEditingThis ? (
                            <div className="space-y-1.5 font-mono">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[10px] text-slate-400">Stok:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={inlineEditItem.currentStock}
                                  onChange={(e) =>
                                    setInlineEditItem({
                                      ...inlineEditItem,
                                      currentStock: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-right text-white font-bold text-xs focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 font-sans">{item.unit}</span>
                              </div>
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[10px] text-slate-400">Min:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={inlineEditItem.minimumStockThreshold}
                                  onChange={(e) =>
                                    setInlineEditItem({
                                      ...inlineEditItem,
                                      minimumStockThreshold: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right text-amber-400 font-bold text-xs focus:border-amber-400 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 font-sans">{item.unit}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm font-bold">
                                <span className={isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-white'}>
                                  {formatNumberID(item.currentStock)}
                                </span>{' '}
                                <span className="text-[10px] font-normal text-slate-400 font-sans">
                                  {item.unit}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Ambang Min: <strong className="text-slate-300">{formatNumberID(threshold)} {item.unit}</strong>
                              </div>
                              {isLow && (
                                <div className="text-[10px] font-bold text-rose-400 flex items-center justify-end gap-1 mt-0.5">
                                  <TrendingDown className="w-3 h-3" /> Defisit: -{formatNumberID(deficit)}
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        {/* Minimum Stock Threshold Status */}
                        <td className="py-3 px-3 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <ShieldAlert className="w-3 h-3 text-rose-400" /> KRITIS ({status.ratioPercent}%)
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3 text-amber-400" /> DI BAWAH AMBANG ({status.ratioPercent}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              AMAN ({status.ratioPercent}%)
                            </span>
                          )}
                        </td>

                        {/* Batch & Expiry */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {primaryBatch?.expiredDate ? (
                            <div>
                              <span className="text-slate-300 font-semibold block">
                                {primaryBatch.expiredDate}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  expStatus.status === 'expired'
                                    ? 'text-rose-400'
                                    : expStatus.status === 'warning'
                                    ? 'text-yellow-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {expStatus.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">No ED</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          {isEditingThis ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Save Button */}
                              <button
                                type="button"
                                onClick={handleSaveInlineEdit}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                                title="Simpan Perubahan Stok & Data Barang"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>

                              {/* Cancel Button */}
                              <button
                                type="button"
                                onClick={handleCancelInlineEdit}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700"
                                title="Batalkan Edit"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>

                              {/* Full Edit Modal */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleCancelInlineEdit();
                                  onEditItem(item);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer border border-slate-700"
                                title="Buka Form Edit Lengkap"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Fast Out Button */}
                              <button
                                type="button"
                                onClick={() => onOpenTransaction(item, 'OUT')}
                                className="p-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
                                title="Pengeluaran Barang (Pakai Lapangan)"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Fast In / Restock Button */}
                              <button
                                type="button"
                                onClick={() => onOpenTransaction(item, 'IN', isLow ? suggested : undefined)}
                                className={`p-1.5 rounded border transition-colors cursor-pointer ${
                                  isCritical
                                    ? 'bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border-rose-500/40'
                                    : isLow
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                                }`}
                                title={
                                  isLow
                                    ? `Penerimaan Barang / Restock Proaktif (+${suggested} ${item.unit})`
                                    : 'Penerimaan Barang (Masuk Stok)'
                                }
                              >
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Label */}
                              <button
                                type="button"
                                onClick={() => onPrintLabel(item)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/60"
                                title="Cetak Label Barcode & QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                              </button>

                              {/* Detail */}
                              <button
                                type="button"
                                onClick={() => onViewDetails(item)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/60"
                                title="Lihat Detail & Riwayat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Action Button */}
                              <button
                                type="button"
                                onClick={() => handleStartInlineEdit(item)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                                title="Ubah Data Stok (Edit & Simpan)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* Delete Action Button */}
                              {currentUser && !currentUser.permissions.canDeleteItems ? (
                                <span
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/40 text-slate-600 border border-slate-800 text-xs font-semibold cursor-not-allowed"
                                  title="Hanya Admin yang dapat menghapus barang"
                                >
                                  <Lock className="w-3 h-3" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingItem(item)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/50 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                                  title="Hapus Barang Inventaris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const threshold = getMinThreshold(item);
            const isLow = isBelowMinimumThreshold(item);
            const isCritical = isCriticallyBelowThreshold(item);
            const deficit = getStockDeficit(item);
            const suggested = getSuggestedRestockQty(item);
            const status = getStockThresholdStatus(item);

            const primaryBatch = item.batches && item.batches.length > 0 ? item.batches[0] : null;
            const expStatus = getExpiryStatus(primaryBatch?.expiredDate);

            const isEditingThis = inlineEditItem?.id === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-xl p-4 flex flex-col justify-between transition-colors border ${
                  isEditingThis
                    ? 'bg-amber-950/30 border-amber-400 shadow-lg'
                    : isCritical
                    ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400'
                    : isLow
                    ? 'bg-amber-950/15 border-amber-500/50 hover:border-amber-400'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>{item.sku}</span>
                    <HazardBadge hazard={item.hazardClass} />
                  </div>

                  {isEditingThis ? (
                    <div className="space-y-2 mb-3">
                      <div>
                        <label className="text-[10px] text-amber-400 font-bold block uppercase">
                          Nama Barang
                        </label>
                        <input
                          type="text"
                          value={inlineEditItem.name}
                          onChange={(e) =>
                            setInlineEditItem({ ...inlineEditItem, name: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-amber-500 rounded p-1.5 text-white text-xs font-semibold focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-400 font-bold block uppercase">
                          Lokasi Rak / Tangki
                        </label>
                        <input
                          type="text"
                          value={inlineEditItem.location}
                          onChange={(e) =>
                            setInlineEditItem({ ...inlineEditItem, location: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs font-mono focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <label className="text-[10px] text-slate-400 block uppercase">
                            Stok Riil ({item.unit})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={inlineEditItem.currentStock}
                            onChange={(e) =>
                              setInlineEditItem({
                                ...inlineEditItem,
                                currentStock: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-slate-950 border border-amber-500 rounded p-1.5 text-white font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block uppercase">
                            Ambang Min ({item.unit})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={inlineEditItem.minimumStockThreshold}
                            onChange={(e) =>
                              setInlineEditItem({
                                ...inlineEditItem,
                                minimumStockThreshold: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-amber-400 font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3
                        className="font-bold text-white text-sm hover:text-amber-400 cursor-pointer"
                        onClick={() => onViewDetails(item)}
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.subCategory}</p>

                      <div className="my-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">STOK FISIK</span>
                            <span className="text-lg font-bold font-mono text-white">
                              <span className={isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-white'}>
                                {formatNumberID(item.currentStock)}
                              </span>{' '}
                              <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                            </span>
                          </div>
                          <div>
                            {isCritical ? (
                              <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" /> Kritis ({status.ratioPercent}%)
                              </span>
                            ) : isLow ? (
                              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Di Bawah Ambang
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-emerald-400 font-semibold">
                                Stok Aman
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                          <span>Ambang Batas Min:</span>
                          <span className="font-semibold text-slate-200">
                            {formatNumberID(threshold)} {item.unit}
                          </span>
                        </div>

                        {isLow && (
                          <div className="text-[11px] font-mono text-rose-400 font-semibold flex items-center justify-between">
                            <span>Defisit Restock:</span>
                            <span>-{formatNumberID(deficit)} {item.unit}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-[11px] font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>Lokasi:</span>
                          <span className="text-slate-200">{item.location}</span>
                        </div>
                        {primaryBatch?.expiredDate && (
                          <div className="flex justify-between">
                            <span>Kadaluarsa (ED):</span>
                            <span
                              className={`font-semibold ${
                                expStatus.status === 'expired'
                                  ? 'text-rose-400'
                                  : expStatus.status === 'warning'
                                  ? 'text-yellow-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {primaryBatch.expiredDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-800">
                  {isEditingThis ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveInlineEdit}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                        title="Simpan Perubahan Stok & Data Barang"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelInlineEdit}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
                        title="Batalkan Edit"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Batal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCancelInlineEdit();
                          onEditItem(item);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer border border-slate-700"
                        title="Buka Form Edit Lengkap"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenTransaction(item, 'OUT')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow"
                        title="Pengeluaran Barang (Pakai)"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Pakai
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenTransaction(item, 'IN', isLow ? suggested : undefined)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors border ${
                          isCritical
                            ? 'bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border-rose-500/40'
                            : isLow
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={isLow ? `Restock (+${suggested})` : 'Penerimaan / Masuk'}
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {isLow ? `Restock` : 'Terima'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintLabel(item)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors border border-slate-700/60"
                        title="Cetak Label Barcode & QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                        title="Detail Barang"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartInlineEdit(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                        title="Ubah Data Barang (Edit & Simpan)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {currentUser && !currentUser.permissions.canDeleteItems ? (
                        <span
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/40 text-slate-600 border border-slate-800 text-xs font-semibold cursor-not-allowed"
                          title="Hanya Admin yang dapat menghapus barang"
                        >
                          <Lock className="w-3 h-3" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/50 text-xs font-semibold cursor-pointer transition-colors"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: IN-APP DELETE CONFIRMATION ================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-900/60 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/40 flex items-center gap-2.5 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              Konfirmasi Hapus Barang Inventaris
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus barang inventaris berikut dari gudang?
              </p>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                <div className="text-sm font-bold text-white font-sans">{deletingItem.name}</div>
                <div className="text-[11px] text-amber-400 flex items-center justify-between">
                  <span>SKU: {deletingItem.sku}</span>
                  <span>Kategori: {deletingItem.category}</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Lokasi: {deletingItem.location}</span>
                  <span className="font-bold text-white">
                    Stok: {formatNumberID(deletingItem.currentStock)} {deletingItem.unit}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-rose-400/90 leading-relaxed">
                Peringatan: Barang ini akan dihapus secara permanen dari daftar inventaris aktif gudang.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteItem(deletingItem.id);
                    setDeletingItem(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Ya, Hapus Barang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
