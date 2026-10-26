import React, { useState } from 'react';
import { InventoryItem, StockTransaction, Category } from '../types/inventory';
import { FuelTankMonitor } from './FuelTankMonitor';
import {
  Fuel,
  Skull,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Scan,
  RefreshCw,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  AlertTriangle,
  Clock,
  ShoppingCart,
  TrendingDown,
  BellRing,
  CheckCircle2,
  Info,
  FileSpreadsheet,
  ShieldCheck,
  Layers,
  Boxes,
} from 'lucide-react';
import {
  formatCurrencyIDR,
  formatDateTimeIndo,
  formatNumberID,
  getExpiryStatus,
} from '../utils/formatters';
import {
  getMinThreshold,
  isBelowMinimumThreshold,
  isCriticallyBelowThreshold,
  getStockDeficit,
  getSuggestedRestockQty,
  getStockThresholdStatus,
} from '../utils/stockUtils';
import { HazardBadge } from './HazardBadge';

interface DashboardOverviewProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onOpenQuickTransaction: (type: 'IN' | 'OUT', item?: InventoryItem, suggestedQty?: number) => void;
  onOpenScanner: () => void;
  onOpenStockOpname: () => void;
  onOpenMSDS: () => void;
  onNavigateToTab: (tab: 'inventory' | 'mutations' | 'outflows') => void;
  onViewItemDetails: (item: InventoryItem) => void;
  onPrintSuratJalan: (trx: StockTransaction) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  items,
  transactions,
  onOpenQuickTransaction,
  onOpenScanner,
  onOpenStockOpname,
  onOpenMSDS,
  onNavigateToTab,
  onViewItemDetails,
  onPrintSuratJalan,
}) => {
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'EXPIRING'>('ALL');
  const [alertCategoryFilter, setAlertCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [alertUrgencyFilter, setAlertUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [isAlertCollapsed, setIsAlertCollapsed] = useState(false);

  // Total valuation
  const totalValuation = items.reduce(
    (sum, item) => sum + item.currentStock * item.pricePerUnit,
    0
  );

  // Fuel liters in warehouse
  const fuelLiters = items
    .filter((i) => i.category === 'BBM' && i.unit === 'Liter')
    .reduce((sum, item) => sum + item.currentStock, 0);

  const toxicCount = items.filter((i) => i.hazardClass === 'TOXIC').length;

  // Items below minimum stock threshold
  const belowThresholdItems = items
    .filter(isBelowMinimumThreshold)
    .sort((a, b) => {
      // Sort by urgency ratio (lowest % first)
      const ratioA = a.currentStock / (getMinThreshold(a) || 1);
      const ratioB = b.currentStock / (getMinThreshold(b) || 1);
      return ratioA - ratioB;
    });

  const criticalItems = items.filter(isCriticallyBelowThreshold);
  const warningOnlyItems = belowThresholdItems.filter((i) => !isCriticallyBelowThreshold(i));

  // Category counts for below-threshold items
  const fuelBelowCount = belowThresholdItems.filter((i) => i.category === 'BBM').length;
  const fumiBelowCount = belowThresholdItems.filter((i) => i.category === 'FUMIGASI').length;
  const sprayBelowCount = belowThresholdItems.filter((i) => i.category === 'SPRAYING_FOGGING').length;
  const gearBelowCount = belowThresholdItems.filter((i) => i.category === 'PERLENGKAPAN').length;

  // Filtered below-threshold items based on user selection in banner
  const displayBelowItems = belowThresholdItems.filter((item) => {
    if (alertCategoryFilter !== 'ALL' && item.category !== alertCategoryFilter) return false;
    if (alertUrgencyFilter === 'CRITICAL' && !isCriticallyBelowThreshold(item)) return false;
    if (alertUrgencyFilter === 'WARNING' && isCriticallyBelowThreshold(item)) return false;
    return true;
  });

  // Export restock sheet to CSV
  const handleExportRestockCSV = () => {
    if (belowThresholdItems.length === 0) return;
    const headers = [
      'SKU',
      'Nama Barang',
      'Kategori',
      'Sub-Kategori',
      'Stok Fisik Saat Ini',
      'Ambang Batas Minimum',
      'Defisit Kekurangan',
      'Rekomendasi Restock (+Buffer 50%)',
      'Satuan',
      'Harga Satuan (IDR)',
      'Estimasi Biaya Restock (IDR)',
      'Lokasi Rak / Tangki',
      'Tingkat Urgensi',
    ];

    const rows = belowThresholdItems.map((item) => {
      const threshold = getMinThreshold(item);
      const deficit = getStockDeficit(item);
      const suggested = getSuggestedRestockQty(item);
      const isCritical = isCriticallyBelowThreshold(item);
      const subtotal = suggested * item.pricePerUnit;

      return [
        item.sku,
        item.name,
        item.category,
        item.subCategory || '-',
        item.currentStock.toString(),
        threshold.toString(),
        deficit.toString(),
        suggested.toString(),
        item.unit,
        item.pricePerUnit.toString(),
        subtotal.toString(),
        item.location,
        isCritical ? 'KRITIS (<=50%)' : 'MENIPIS (<=100%)',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `daftar-kebutuhan-restock-ambang-batas-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Total restock cost estimate to bring items back up to threshold
  const totalRestockCostEstimate = belowThresholdItems.reduce((sum, item) => {
    const suggested = getSuggestedRestockQty(item);
    return sum + suggested * item.pricePerUnit;
  }, 0);

  // Expiring items
  const expiringBatches: {
    item: InventoryItem;
    batchNo: string;
    expDate: string;
    days: number;
    status: 'warning' | 'expired';
  }[] = [];

  items.forEach((item) => {
    item.batches?.forEach((b) => {
      if (b.expiredDate) {
        const exp = getExpiryStatus(b.expiredDate);
        if (exp.status === 'warning' || exp.status === 'expired') {
          expiringBatches.push({
            item,
            batchNo: b.batchNo,
            expDate: b.expiredDate,
            days: exp.daysRemaining || 0,
            status: exp.status,
          });
        }
      }
    });
  });

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 🚨 PROACTIVE RESTOCK ALERT BANNER (Visual Warning & Badges Hub) */}
      {/* ======================================================== */}
      {belowThresholdItems.length > 0 ? (
        <div id="low-stock-alert-hub" className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/60 border-2 border-amber-500/60 rounded-xl p-5 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
          {/* Subtle warning backdrop line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />

          {/* Banner Header: Badges & Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 relative">
                <span className="relative flex h-3 w-3 absolute -top-1 -right-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                    PERINGATAN STOK DI BAWAH AMBANG BATAS (MINIMUM THRESHOLD)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{belowThresholdItems.length} Barang Perlu Pengadaan</span>
                  </span>
                  {criticalItems.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>{criticalItems.length} Kritis (&le;50% Ambang)</span>
                    </span>
                  )}
                  {warningOnlyItems.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {warningOnlyItems.length} Menipis
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Stok fisik barang telah jatuh di bawah ambang batas (<em>minimumStockThreshold</em>). Notifikasi visual ini memandu pengadaan proaktif sebelum stok habis saat operasional lapangan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-amber-500/30 text-right">
                <span className="text-[10px] font-mono text-slate-400 block">ESTIMASI BIAYA RESTOCK</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {formatCurrencyIDR(totalRestockCostEstimate)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleExportRestockCSV}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                title="Unduh daftar rekomendasi pengadaan stok ke format Excel/CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh PO (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('inventory')}
                className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
              >
                <span>Lihat di Tabel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsAlertCollapsed(!isAlertCollapsed)}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title={isAlertCollapsed ? 'Tampilkan Rincian Kartu' : 'Sembunyikan Rincian Kartu'}
              >
                {isAlertCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isAlertCollapsed && (
            <>
              {/* Category & Urgency Filter Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 pb-1 text-xs">
                {/* Urgency Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400 mr-1">Tingkat Bahaya:</span>
                  <button
                    type="button"
                    onClick={() => setAlertUrgencyFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                      alertUrgencyFilter === 'ALL'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    Semua ({belowThresholdItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertUrgencyFilter('CRITICAL')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                      alertUrgencyFilter === 'CRITICAL'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-900/80 text-rose-300 hover:text-rose-200 border border-rose-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>🚨 Kritis ({criticalItems.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertUrgencyFilter('WARNING')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                      alertUrgencyFilter === 'WARNING'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-900/80 text-amber-300 hover:text-amber-200 border border-amber-500/30'
                    }`}
                  >
                    ⚠️ Menipis ({warningOnlyItems.length})
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400 mr-1">Kategori:</span>
                  <button
                    type="button"
                    onClick={() => setAlertCategoryFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      alertCategoryFilter === 'ALL'
                        ? 'bg-slate-800 text-white font-bold border border-slate-600'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {fuelBelowCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAlertCategoryFilter('BBM')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertCategoryFilter === 'BBM'
                          ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <span>⛽ BBM</span>
                      <span className="px-1 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                        {fuelBelowCount}
                      </span>
                    </button>
                  )}
                  {fumiBelowCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAlertCategoryFilter('FUMIGASI')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertCategoryFilter === 'FUMIGASI'
                          ? 'bg-purple-500/30 text-purple-300 font-bold border border-purple-500/50'
                          : 'text-slate-400 hover:text-purple-300'
                      }`}
                    >
                      <span>☠️ Fumigasi</span>
                      <span className="px-1 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">
                        {fumiBelowCount}
                      </span>
                    </button>
                  )}
                  {sprayBelowCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAlertCategoryFilter('SPRAYING_FOGGING')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertCategoryFilter === 'SPRAYING_FOGGING'
                          ? 'bg-blue-500/30 text-blue-300 font-bold border border-blue-500/50'
                          : 'text-slate-400 hover:text-blue-300'
                      }`}
                    >
                      <span>💨 Spraying</span>
                      <span className="px-1 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
                        {sprayBelowCount}
                      </span>
                    </button>
                  )}
                  {gearBelowCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAlertCategoryFilter('PERLENGKAPAN')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertCategoryFilter === 'PERLENGKAPAN'
                          ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      <span>🦺 Inventaris</span>
                      <span className="px-1 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                        {gearBelowCount}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Highlighted Items Below Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-3">
                {displayBelowItems.map((item) => {
                  const threshold = getMinThreshold(item);
                  const deficit = getStockDeficit(item);
                  const suggested = getSuggestedRestockQty(item);
                  const status = getStockThresholdStatus(item);
                  const isCritical = status.level === 'CRITICAL';
                  const estimatedCost = suggested * item.pricePerUnit;

                  return (
                    <div
                      key={`alert-item-${item.id}`}
                      className={`rounded-xl p-3.5 flex flex-col justify-between transition-all border shadow-lg ${
                        isCritical
                          ? 'bg-rose-950/40 border-rose-500/60 hover:border-rose-400'
                          : 'bg-slate-950/75 border-amber-500/40 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        {/* Top row: SKU, Hazard & Urgency Badge */}
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                              {item.sku}
                            </span>
                            <HazardBadge hazard={item.hazardClass} />
                          </div>

                          {/* Visual Pulsing Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1.5 shadow-sm ${
                              isCritical
                                ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 animate-pulse'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCritical ? 'bg-rose-400' : 'bg-amber-400'
                              }`}
                            ></span>
                            <span>{isCritical ? '🚨 KRITIS' : '⚠️ MENIPIS'} ({status.ratioPercent}%)</span>
                          </span>
                        </div>

                        {/* Name & Details */}
                        <h3
                          className="font-bold text-white text-sm hover:text-amber-400 cursor-pointer line-clamp-1 transition-colors"
                          onClick={() => onViewItemDetails(item)}
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.location} · {item.subCategory}
                        </p>

                        {/* Gauge & Numbers */}
                        <div className="my-2.5 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-slate-400 text-[11px]">Stok Fisik Gudang:</span>
                            <span className="font-bold text-white">
                              <span
                                className={isCritical ? 'text-rose-400 text-sm font-extrabold' : 'text-amber-400 text-sm font-bold'}
                              >
                                {formatNumberID(item.currentStock)}
                              </span>{' '}
                              <span className="text-[11px] font-normal text-slate-400">{item.unit}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-slate-400 text-[11px]">Ambang Batas Min:</span>
                            <span className="font-semibold text-slate-300">
                              {formatNumberID(threshold)} {item.unit}
                            </span>
                          </div>

                          {/* Visual progress bar of threshold fulfilment */}
                          <div>
                            <div className="flex justify-between text-[10px] font-mono mb-1">
                              <span className="text-slate-400">Pemenuhan Ambang Batas:</span>
                              <span className={isCritical ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                                {status.ratioPercent}%
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
                              <div
                                className={`h-full transition-all rounded-full ${
                                  isCritical
                                    ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                                    : 'bg-gradient-to-r from-amber-600 to-amber-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, status.ratioPercent))}%` }}
                              />
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-rose-400 flex items-center gap-1 font-semibold">
                              <TrendingDown className="w-3 h-3" /> Defisit: -{formatNumberID(deficit)} {item.unit}
                            </span>
                            <span className="text-slate-400">
                              Order Rec: <strong className="text-emerald-400">+{formatNumberID(suggested)}</strong>
                            </span>
                          </div>

                          {estimatedCost > 0 && (
                            <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>Est. Biaya Restock:</span>
                              <span className="text-amber-300 font-semibold">{formatCurrencyIDR(estimatedCost)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Proactive Restock CTA */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => onOpenQuickTransaction('IN', item, suggested)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow ${
                            isCritical
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/30'
                          }`}
                          title={`Buat transaksi penerimaan stok masuk sebanyak rekomendasi ${suggested} ${item.unit}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Restock (+{formatNumberID(suggested)} {item.unit})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewItemDetails(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                          title="Detail Riwayat & Batch"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Optimal Stock Condition Banner when all items are above threshold */
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">STATUS INVENTARIS: SELURUH STOK AMAN</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  OPTIMAL
                </span>
              </div>
              <p className="text-slate-400 mt-0.5">
                Semua {items.length} komoditas barang di gudang berada di atas batas ambang minimum (<em>minimumStockThreshold</em>).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('inventory')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1"
          >
            <span>Buka Tabel Inventaris</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Valuation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL VALUASI GUDANG</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {formatCurrencyIDR(totalValuation)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {items.length} Total SKU Terdata
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span>Audit Terakhir: Hari ini</span>
          </div>
        </div>

        {/* KPI 2: Total BBM / Fuel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL VOLUME BBM</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {formatNumberID(fuelLiters)}{' '}
              <span className="text-sm font-sans font-normal text-slate-400">Liter</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Solar B35, Pertamax 92 & White Oil
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-amber-400 flex items-center gap-1">
            <span>Level Tangki Terpantau Sensor</span>
          </div>
        </div>

        {/* KPI 3: Chemical Toxic / HazMat */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>KIMIA FUMIGASI & HAZMAT</span>
            <Skull className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {toxicCount}{' '}
              <span className="text-sm font-sans font-normal text-slate-400">Komoditas Toxic</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Phosphine, Methyl Bromide & Malathion
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-rose-400 flex items-center justify-between">
            <span>Standar K3 Barantan ISPM-15</span>
            <button
              type="button"
              onClick={onOpenMSDS}
              className="underline hover:text-white cursor-pointer"
            >
              Panduan K3
            </button>
          </div>
        </div>

        {/* KPI 4: Alert Low Stock Threshold & Expiry */}
        <div
          className={`border rounded-xl p-4 shadow flex flex-col justify-between transition-all ${
            belowThresholdItems.length > 0
              ? 'bg-gradient-to-br from-rose-950/40 via-amber-950/30 to-slate-900 border-rose-500/60 shadow-rose-950/30 shadow-lg'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AMBANG BATAS (THRESHOLD)</span>
            <div className="flex items-center gap-1">
              {criticalItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                  {criticalItems.length} Kritis
                </span>
              )}
              <ShieldAlert
                className={`w-4 h-4 ${
                  belowThresholdItems.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                }`}
              />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className={`text-2xl font-bold font-mono ${
                  criticalItems.length > 0
                    ? 'text-rose-400'
                    : belowThresholdItems.length > 0
                    ? 'text-amber-400'
                    : 'text-slate-100'
                }`}
              >
                {belowThresholdItems.length}
              </span>
              <span className="text-xs text-slate-300 font-sans font-medium">Di Bawah Ambang</span>
              <span className="text-slate-600 font-mono">/</span>
              <span
                className={`text-2xl font-bold font-mono ${
                  expiringBatches.length > 0 ? 'text-yellow-400' : 'text-slate-100'
                }`}
              >
                {expiringBatches.length}
              </span>
              <span className="text-xs text-slate-400 font-sans">Mendekati ED</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {belowThresholdItems.length > 0
                ? `${criticalItems.length} kritis (<=50%), ${warningOnlyItems.length} menipis`
                : 'Semua stok berada di atas batas minimum'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span
              className={
                belowThresholdItems.length > 0
                  ? 'text-amber-400 font-semibold flex items-center gap-1'
                  : 'text-emerald-400'
              }
            >
              {belowThresholdItems.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              )}
              {belowThresholdItems.length > 0 ? 'Perlu Restock Segera' : 'Stok Aman'}
            </span>
            {belowThresholdItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('low-stock-alert-hub');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  setIsAlertCollapsed(false);
                }}
                className="text-amber-300 hover:text-white underline cursor-pointer text-[10px]"
              >
                Cek Rincian
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Fuel Tank Gauges (Solar & Pertamax) */}
      <FuelTankMonitor
        items={items}
        onQuickAction={(item, action) => onOpenQuickTransaction(action, item)}
      />

      {/* Quick Action Dock */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
        <span className="text-xs font-mono text-slate-400 block mb-3 uppercase tracking-wider">
          Aksi Operasional Cepat Gudang:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => onOpenQuickTransaction('OUT')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer group"
          >
            <ArrowUpRight className="w-5 h-5 mb-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold">Pengeluaran Barang</span>
            <span className="text-[10px] text-amber-400/70">Pakai Proyek / Lapangan</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickTransaction('IN')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer group"
          >
            <ArrowDownRight className="w-5 h-5 mb-1 group-hover:translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold">Penerimaan Barang</span>
            <span className="text-[10px] text-emerald-400/70">Restock Supplier / BBM</span>
          </button>

          <button
            type="button"
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all cursor-pointer group"
          >
            <Scan className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Scan Barcode / SKU</span>
            <span className="text-[10px] text-blue-400/70">Cari Label Drum & Rak</span>
          </button>

          <button
            type="button"
            onClick={onOpenStockOpname}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer group"
          >
            <RefreshCw className="w-5 h-5 mb-1 group-hover:rotate-45 transition-transform" />
            <span className="text-xs font-bold">Stock Opname Fisik</span>
            <span className="text-[10px] text-purple-400/70">Audit Selisih Stok</span>
          </button>

          <button
            type="button"
            onClick={onOpenMSDS}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer col-span-2 sm:col-span-1 group"
          >
            <ShieldAlert className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Panduan K3 & MSDS</span>
            <span className="text-[10px] text-rose-400/70">Prosedur Tanggap Gas/BBM</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Critical Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Critical Alerts (Low stock & Expiry) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Pusat Notifikasi Stok Kritis & Kadaluarsa
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setAlertFilter('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  alertFilter === 'ALL'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({belowThresholdItems.length + expiringBatches.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('CRITICAL')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  alertFilter === 'CRITICAL'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Defisit ({belowThresholdItems.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('EXPIRING')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  alertFilter === 'EXPIRING'
                    ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30'
                    : 'text-slate-400 hover:text-yellow-300'
                }`}
              >
                ED ({expiringBatches.length})
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {belowThresholdItems.length === 0 && expiringBatches.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                <span>Semua stok berada di atas ambang batas minimum dan tidak ada barang kadaluarsa.</span>
              </div>
            ) : (
              <>
                {/* Low Stock Items Below Minimum Stock Threshold */}
                {(alertFilter === 'ALL' || alertFilter === 'CRITICAL') &&
                  belowThresholdItems.map((item) => {
                    const threshold = getMinThreshold(item);
                    const deficit = getStockDeficit(item);
                    const suggested = getSuggestedRestockQty(item);
                    const isCritical = isCriticallyBelowThreshold(item);

                    return (
                      <div
                        key={`low-${item.id}`}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                          isCritical
                            ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                            : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-[10px] font-bold ${
                                isCritical ? 'text-rose-400' : 'text-amber-400'
                              }`}
                            >
                              {isCritical ? '⚠️ KRITIS: &le;50% AMBANG' : 'DI BAWAH AMBANG BATAS'}
                            </span>
                            <span className="text-slate-500 text-[10px] font-mono">· SKU: {item.sku}</span>
                          </div>
                          <div
                            className="font-bold text-white hover:text-amber-300 cursor-pointer text-xs"
                            onClick={() => onViewItemDetails(item)}
                          >
                            {item.name}
                          </div>
                          <div className="font-mono text-slate-400 text-[11px]">
                            Stok:{' '}
                            <strong className={isCritical ? 'text-rose-400' : 'text-amber-400'}>
                              {formatNumberID(item.currentStock)} {item.unit}
                            </strong>{' '}
                            (Ambang Min: <strong>{formatNumberID(threshold)} {item.unit}</strong>) · Defisit: <span className="text-rose-400 font-bold">-{formatNumberID(deficit)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenQuickTransaction('IN', item, suggested)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                            title={`Restock rekomendasi ${suggested} ${item.unit}`}
                          >
                            + Restock
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {/* Expiring Batches */}
                {(alertFilter === 'ALL' || alertFilter === 'EXPIRING') &&
                  expiringBatches.map((exp, idx) => (
                    <div
                      key={`exp-${exp.item.id}-${idx}`}
                      className="p-3 rounded-lg bg-yellow-950/20 border border-yellow-500/30 flex items-center justify-between text-xs hover:border-yellow-400 transition-colors"
                    >
                      <div>
                        <div className="font-mono text-[10px] text-yellow-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exp.days <= 0 ? 'KADALUARSA / EXPIRED' : `MENDEKATI KADALUARSA (${exp.days} HARI)`}
                        </div>
                        <div
                          className="font-bold text-white hover:text-yellow-300 cursor-pointer"
                          onClick={() => onViewItemDetails(exp.item)}
                        >
                          {exp.item.name}
                        </div>
                        <div className="font-mono text-slate-400 text-[11px]">
                          Batch: <span className="text-slate-200">{exp.batchNo}</span> · Tgl ED: {exp.expDate}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onViewItemDetails(exp.item)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
                      >
                        Periksa
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Right: Recent Transactions Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Mutasi Keluar & Masuk Terakhir
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('outflows')}
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                title="Lihat Tabel Rekap Pengeluaran Per Hari, Per Bulan, dan Per Tahun"
              >
                Rekap Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab('mutations')}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua ({transactions.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {recentTransactions.map((trx) => (
              <div
                key={trx.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`font-bold ${
                        trx.type === 'IN'
                          ? 'text-emerald-400'
                          : trx.type === 'OUT'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`}
                    >
                      [{trx.type}]
                    </span>
                    <span className="text-slate-400">{trx.referenceNo}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">{formatDateTimeIndo(trx.timestamp)}</span>
                  </div>

                  <div className="font-semibold text-white">{trx.itemName}</div>
                  <div className="text-slate-400 text-[11px] truncate max-w-[280px]">
                    Ke: {trx.projectOrLocation} ({trx.operator})
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 ml-2">
                  <div className="font-mono font-bold text-sm text-white">
                    {trx.type === 'IN' ? '+' : trx.type === 'OUT' ? '-' : ''}
                    {formatNumberID(trx.quantity)}{' '}
                    <span className="text-[10px] font-normal text-slate-400 font-sans">
                      {trx.unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPrintSuratJalan(trx)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Cetak Surat Jalan"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
