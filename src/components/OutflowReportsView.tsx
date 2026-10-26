import React, { useState, useMemo } from 'react';
import { Category, StockTransaction, InventoryItem } from '../types/inventory';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Receipt,
  Boxes,
  Fuel,
  ArrowUpRight,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
  DollarSign,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  formatCurrencyIDR,
  formatNumberID,
  formatDateIndo,
  formatFullDateIndo,
  formatMonthYearIndo,
} from '../utils/formatters';
import { HazardBadge } from './HazardBadge';

interface OutflowReportsViewProps {
  transactions: StockTransaction[];
  items: InventoryItem[];
  onPrintSuratJalan?: (trx: StockTransaction) => void;
  onOpenNewOutflow?: () => void;
  onDeleteOutflow?: (trxId: string, revertStock: boolean) => void;
  onNavigateToMutations?: (searchQuery?: string) => void;
  onNavigateToInventory?: (sku?: string) => void;
  onSyncAll?: () => void;
}

type PeriodMode = 'all' | 'daily' | 'monthly' | 'yearly';

export const OutflowReportsView: React.FC<OutflowReportsViewProps> = ({
  transactions,
  items,
  onPrintSuratJalan,
  onOpenNewOutflow,
  onDeleteOutflow,
  onNavigateToMutations,
  onNavigateToInventory,
  onSyncAll,
}) => {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // In-app modal confirmation for deleting an outflow
  const [deletingOutflow, setDeletingOutflow] = useState<StockTransaction | null>(null);
  const [revertStockOnDelete, setRevertStockOnDelete] = useState<boolean>(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Helper map for item prices & data
  const itemMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    items.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [items]);

  const getItemPrice = (itemId: string, fallbackPrice = 0) => {
    const it = itemMap.get(itemId);
    return it?.pricePerUnit ?? fallbackPrice;
  };

  // Only consider 'OUT' transactions (pengeluaran barang)
  const outflowTransactions = useMemo(() => {
    return transactions.filter((trx) => trx.type === 'OUT');
  }, [transactions]);

  // Available unique years and months from data
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    outflowTransactions.forEach((t) => {
      const year = new Date(t.timestamp).getFullYear().toString();
      if (!isNaN(Number(year))) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [outflowTransactions]);

  // Filtered outflows based on category, search, and date dropdowns
  const filteredOutflows = useMemo(() => {
    return outflowTransactions.filter((trx) => {
      // Category filter
      if (categoryFilter !== 'ALL' && trx.category !== categoryFilter) {
        return false;
      }

      // Year filter
      const trxDate = new Date(trx.timestamp);
      const trxYear = trxDate.getFullYear().toString();
      if (selectedYear !== 'ALL' && trxYear !== selectedYear) {
        return false;
      }

      // Month filter (only for daily view if set)
      if (periodMode === 'daily' && selectedMonth !== 'ALL') {
        const monthNum = String(trxDate.getMonth() + 1).padStart(2, '0');
        if (monthNum !== selectedMonth) {
          return false;
        }
      }

      // Search query (Item name, SKU, Ref No, Project, Operator)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = trx.itemName.toLowerCase().includes(q);
        const matchSku = trx.sku.toLowerCase().includes(q);
        const matchRef = trx.referenceNo.toLowerCase().includes(q);
        const matchProject = trx.projectOrLocation.toLowerCase().includes(q);
        const matchOperator = trx.operator.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchRef && !matchProject && !matchOperator) {
          return false;
        }
      }

      return true;
    });
  }, [outflowTransactions, categoryFilter, selectedYear, selectedMonth, periodMode, searchQuery]);

  // ================= 1. DAILY AGGREGATION =================
  const dailyData = useMemo(() => {
    const map = new Map<
      string,
      {
        dateStr: string; // YYYY-MM-DD
        trxCount: number;
        totalQty: number;
        totalValue: number;
        fuelQty: number;
        fumigasiQty: number;
        sprayingQty: number;
        gearQty: number;
        transactions: StockTransaction[];
      }
    >();

    filteredOutflows.forEach((trx) => {
      const d = new Date(trx.timestamp);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const price = getItemPrice(trx.itemId);
      const subtotal = trx.quantity * price;

      const existing = map.get(dateStr) || {
        dateStr,
        trxCount: 0,
        totalQty: 0,
        totalValue: 0,
        fuelQty: 0,
        fumigasiQty: 0,
        sprayingQty: 0,
        gearQty: 0,
        transactions: [],
      };

      existing.trxCount += 1;
      existing.totalQty += trx.quantity;
      existing.totalValue += subtotal;
      existing.transactions.push(trx);

      if (trx.category === 'BBM') existing.fuelQty += trx.quantity;
      else if (trx.category === 'FUMIGASI') existing.fumigasiQty += trx.quantity;
      else if (trx.category === 'SPRAYING_FOGGING') existing.sprayingQty += trx.quantity;
      else if (trx.category === 'PERLENGKAPAN') existing.gearQty += trx.quantity;

      map.set(dateStr, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredOutflows, itemMap]);

  // ================= 2. MONTHLY AGGREGATION =================
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        monthStr: string; // YYYY-MM
        year: string;
        monthName: string;
        trxCount: number;
        totalQty: number;
        totalValue: number;
        fuelQty: number;
        fumigasiQty: number;
        sprayingQty: number;
        gearQty: number;
        activeDates: Set<string>;
        transactions: StockTransaction[];
      }
    >();

    filteredOutflows.forEach((trx) => {
      const d = new Date(trx.timestamp);
      const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
      const dateStr = d.toISOString().slice(0, 10);
      const price = getItemPrice(trx.itemId);
      const subtotal = trx.quantity * price;

      const existing = map.get(monthStr) || {
        monthStr,
        year: monthStr.slice(0, 4),
        monthName: formatMonthYearIndo(monthStr),
        trxCount: 0,
        totalQty: 0,
        totalValue: 0,
        fuelQty: 0,
        fumigasiQty: 0,
        sprayingQty: 0,
        gearQty: 0,
        activeDates: new Set<string>(),
        transactions: [],
      };

      existing.trxCount += 1;
      existing.totalQty += trx.quantity;
      existing.totalValue += subtotal;
      existing.activeDates.add(dateStr);
      existing.transactions.push(trx);

      if (trx.category === 'BBM') existing.fuelQty += trx.quantity;
      else if (trx.category === 'FUMIGASI') existing.fumigasiQty += trx.quantity;
      else if (trx.category === 'SPRAYING_FOGGING') existing.sprayingQty += trx.quantity;
      else if (trx.category === 'PERLENGKAPAN') existing.gearQty += trx.quantity;

      map.set(monthStr, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.monthStr.localeCompare(a.monthStr));
  }, [filteredOutflows, itemMap]);

  // ================= 3. YEARLY AGGREGATION =================
  const yearlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        year: string; // YYYY
        trxCount: number;
        totalQty: number;
        totalValue: number;
        fuelQty: number;
        fumigasiQty: number;
        sprayingQty: number;
        gearQty: number;
        activeMonths: Set<string>;
        activeDays: Set<string>;
        monthlyMap: Map<string, number>;
        transactions: StockTransaction[];
      }
    >();

    filteredOutflows.forEach((trx) => {
      const d = new Date(trx.timestamp);
      const year = d.getFullYear().toString();
      const monthStr = d.toISOString().slice(0, 7);
      const dateStr = d.toISOString().slice(0, 10);
      const price = getItemPrice(trx.itemId);
      const subtotal = trx.quantity * price;

      const existing = map.get(year) || {
        year,
        trxCount: 0,
        totalQty: 0,
        totalValue: 0,
        fuelQty: 0,
        fumigasiQty: 0,
        sprayingQty: 0,
        gearQty: 0,
        activeMonths: new Set<string>(),
        activeDays: new Set<string>(),
        monthlyMap: new Map<string, number>(),
        transactions: [],
      };

      existing.trxCount += 1;
      existing.totalQty += trx.quantity;
      existing.totalValue += subtotal;
      existing.activeMonths.add(monthStr);
      existing.activeDays.add(dateStr);
      existing.monthlyMap.set(
        monthStr,
        (existing.monthlyMap.get(monthStr) || 0) + subtotal
      );
      existing.transactions.push(trx);

      if (trx.category === 'BBM') existing.fuelQty += trx.quantity;
      else if (trx.category === 'FUMIGASI') existing.fumigasiQty += trx.quantity;
      else if (trx.category === 'SPRAYING_FOGGING') existing.sprayingQty += trx.quantity;
      else if (trx.category === 'PERLENGKAPAN') existing.gearQty += trx.quantity;

      map.set(year, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year));
  }, [filteredOutflows, itemMap]);

  // Overall KPI Summary Statistics
  const summaryKPI = useMemo(() => {
    const todayStr = '2026-09-24'; // simulated current date
    const thisMonthStr = '2026-09';
    const thisYearStr = '2026';

    let todayValue = 0;
    let todayQty = 0;
    let todayTrx = 0;

    let monthValue = 0;
    let monthQty = 0;
    let monthTrx = 0;

    let yearValue = 0;
    let yearQty = 0;
    let yearTrx = 0;

    let totalLifetimeValue = 0;

    outflowTransactions.forEach((trx) => {
      const d = new Date(trx.timestamp);
      const dateStr = d.toISOString().slice(0, 10);
      const monthStr = d.toISOString().slice(0, 7);
      const yearStr = d.getFullYear().toString();
      const price = getItemPrice(trx.itemId);
      const subtotal = trx.quantity * price;

      totalLifetimeValue += subtotal;

      if (dateStr === todayStr) {
        todayValue += subtotal;
        todayQty += trx.quantity;
        todayTrx += 1;
      }
      if (monthStr === thisMonthStr) {
        monthValue += subtotal;
        monthQty += trx.quantity;
        monthTrx += 1;
      }
      if (yearStr === thisYearStr) {
        yearValue += subtotal;
        yearQty += trx.quantity;
        yearTrx += 1;
      }
    });

    return {
      todayValue,
      todayQty,
      todayTrx,
      monthValue,
      monthQty,
      monthTrx,
      yearValue,
      yearQty,
      yearTrx,
      totalLifetimeValue,
    };
  }, [outflowTransactions, itemMap]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Export CSV handler for active view
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `laporan-pengeluaran-${periodMode}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (periodMode === 'all') {
      headers = [
        'No. Surat Jalan',
        'Tanggal & Waktu',
        'SKU',
        'Nama Barang',
        'Kategori',
        'Jumlah Keluar',
        'Satuan',
        'Harga Satuan (IDR)',
        'Total Nilai (IDR)',
        'Tujuan Proyek / Lokasi',
        'Petugas / Operator',
        'No. Batch',
        'Sisa Stok Tercatat',
        'Catatan',
      ];
      rows = filteredOutflows.map((trx) => {
        const unitPrice = getItemPrice(trx.itemId);
        const subtotal = trx.quantity * unitPrice;
        return [
          trx.referenceNo,
          trx.timestamp,
          trx.sku,
          trx.itemName,
          trx.category,
          trx.quantity.toString(),
          trx.unit,
          unitPrice.toString(),
          subtotal.toString(),
          trx.projectOrLocation,
          trx.operator,
          trx.batchNo || '-',
          trx.newStock.toString(),
          trx.notes || '-',
        ];
      });
    } else if (periodMode === 'daily') {
      headers = [
        'Tanggal',
        'Jumlah Transaksi Keluar',
        'BBM (Liter)',
        'Fumigasi (Qty)',
        'Spraying & Fogging (Qty)',
        'Perlengkapan (Qty)',
        'Total Volume',
        'Estimasi Total Nilai (IDR)',
      ];
      rows = dailyData.map((d) => [
        d.dateStr,
        d.trxCount.toString(),
        d.fuelQty.toString(),
        d.fumigasiQty.toString(),
        d.sprayingQty.toString(),
        d.gearQty.toString(),
        d.totalQty.toString(),
        d.totalValue.toString(),
      ]);
    } else if (periodMode === 'monthly') {
      headers = [
        'Bulan',
        'Tahun',
        'Hari Aktif',
        'Frekuensi Transaksi',
        'BBM (Liter)',
        'Fumigasi (Qty)',
        'Spraying & Fogging (Qty)',
        'Perlengkapan (Qty)',
        'Total Volume',
        'Rata-rata Harian (IDR)',
        'Total Nilai Bulanan (IDR)',
      ];
      rows = monthlyData.map((m) => {
        const avgDaily = m.activeDates.size > 0 ? Math.round(m.totalValue / m.activeDates.size) : 0;
        return [
          m.monthName,
          m.year,
          m.activeDates.size.toString(),
          m.trxCount.toString(),
          m.fuelQty.toString(),
          m.fumigasiQty.toString(),
          m.sprayingQty.toString(),
          m.gearQty.toString(),
          m.totalQty.toString(),
          avgDaily.toString(),
          m.totalValue.toString(),
        ];
      });
    } else {
      headers = [
        'Tahun',
        'Bulan Aktif',
        'Hari Operasional',
        'Total Transaksi Keluar',
        'BBM (Liter)',
        'Fumigasi (Qty)',
        'Spraying & Fogging (Qty)',
        'Perlengkapan (Qty)',
        'Total Volume Tahunan',
        'Total Pengeluaran Tahunan (IDR)',
      ];
      rows = yearlyData.map((y) => [
        y.year,
        y.activeMonths.size.toString(),
        y.activeDays.size.toString(),
        y.trxCount.toString(),
        y.fuelQty.toString(),
        y.fumigasiQty.toString(),
        y.sprayingQty.toString(),
        y.gearQty.toString(),
        y.totalQty.toString(),
        y.totalValue.toString(),
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Laporan & Tabel Pengeluaran Barang
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Pemantauan konsumsi inventaris gudang dan operasional lapangan terintegrasi per{' '}
              <strong className="text-amber-400">Hari</strong>,{' '}
              <strong className="text-amber-400">Bulan</strong>, dan{' '}
              <strong className="text-amber-400">Tahun</strong> lengkap dengan volume komoditas dan estimasi nilai finansial rupiah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSyncAll && (
              <button
                type="button"
                onClick={() => {
                  onSyncAll();
                  setSyncNotice('Seluruh data mutasi, inventaris, dan pengeluaran berhasil diverifikasi dan disinkronkan!');
                  setTimeout(() => setSyncNotice(null), 4000);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Verifikasi sinkronisasi antara mutasi, daftar stok, dan tabel pengeluaran"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sinkronkan Data</span>
              </button>
            )}
            {onOpenNewOutflow && (
              <button
                type="button"
                onClick={onOpenNewOutflow}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                Catat Pengeluaran Baru
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Unduh Data Format CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Cetak Laporan / PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sync confirmation notification */}
      {syncNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards: Ringkasan Pengeluaran Hari Ini, Bulan Ini, dan Tahun Ini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hari Ini */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              PENGELUARAN HARI INI
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {summaryKPI.todayTrx} Transaksi
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrencyIDR(summaryKPI.todayValue)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Total Volume Fisik:</span>
            <span className="font-semibold text-amber-300">
              {formatNumberID(summaryKPI.todayQty)} Unit/Liter
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80">
            Tanggal simulasi: 24 September 2026
          </div>
        </div>

        {/* Bulan Ini */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
              PENGELUARAN BULAN INI
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {summaryKPI.monthTrx} Transaksi
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrencyIDR(summaryKPI.monthValue)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Total Volume Fisik:</span>
            <span className="font-semibold text-emerald-300">
              {formatNumberID(summaryKPI.monthQty)} Unit/Liter
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80">
            Periode: September 2026
          </div>
        </div>

        {/* Tahun Ini */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <CalendarRange className="w-3.5 h-3.5 text-sky-400" />
              PENGELUARAN TAHUN INI
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {summaryKPI.yearTrx} Transaksi
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrencyIDR(summaryKPI.yearValue)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Total Volume Fisik:</span>
            <span className="font-semibold text-sky-300">
              {formatNumberID(summaryKPI.yearQty)} Unit/Liter
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80">
            Tahun Berjalan: 2026
          </div>
        </div>

        {/* Total Akumulatif Tercatat */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              TOTAL HISTORIS KELUAR
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {outflowTransactions.length} Total SJ
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrencyIDR(summaryKPI.totalLifetimeValue)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Frekuensi Operasional:</span>
            <span className="font-semibold text-purple-300">Semua Catatan Gudang</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80">
            Termasuk tahun 2025 & 2026
          </div>
        </div>
      </div>

      {/* Main Navigation Tab Buttons: PER HARI / PER BULAN / PER TAHUN */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Period Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setPeriodMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tabel Semua Pengeluaran</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                periodMode === 'all'
                  ? 'bg-slate-900/20 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {filteredOutflows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tabel Per Hari</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                periodMode === 'daily'
                  ? 'bg-slate-900/20 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {dailyData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Tabel Per Bulan</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                periodMode === 'monthly'
                  ? 'bg-slate-900/20 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {monthlyData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode('yearly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              periodMode === 'yearly'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Tabel Per Tahun</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                periodMode === 'yearly'
                  ? 'bg-slate-900/20 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {yearlyData.length}
            </span>
          </button>
        </div>

        {/* Filter Controls (Year, Month, Category, Search) */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>

          {/* Month selector (if Daily mode) */}
          {periodMode === 'daily' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          )}

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'ALL')}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="BBM">BBM (Bahan Bakar)</option>
            <option value="FUMIGASI">Fumigasi (Gas & Tablet)</option>
            <option value="SPRAYING_FOGGING">Spraying & Fogging</option>
            <option value="PERLENGKAPAN">Perlengkapan & APD</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang, SJ, proyek..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* ================= SECTION 0: TABEL RINCIAN SEMUA PENGELUARAN (SINKRON DENGAN MUTASI & STOK) ================= */}
      {periodMode === 'all' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-150">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">
                Tabel Rincian Lengkap Pengeluaran Barang
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({filteredOutflows.length} Pengeluaran Tercatat)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tersinkronisasi Real-Time dengan Mutasi & Stok Gudang</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">No. Surat Jalan</th>
                  <th className="py-3 px-3">Waktu Keluar</th>
                  <th className="py-3 px-3">Nama Barang & SKU</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Jumlah Keluar</th>
                  <th className="py-3 px-3 text-right">Sisa Stok Terkini</th>
                  <th className="py-3 px-3 text-right">Subtotal (Rp)</th>
                  <th className="py-3 px-3">Tujuan / Proyek</th>
                  <th className="py-3 px-3">Petugas</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredOutflows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada data transaksi pengeluaran barang yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredOutflows.map((trx) => {
                    const linkedItem = itemMap.get(trx.itemId);
                    const unitPrice = getItemPrice(trx.itemId);
                    const subtotal = trx.quantity * unitPrice;
                    const dateObj = new Date(trx.timestamp);
                    const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={trx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400 text-xs">
                          {trx.referenceNo}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                          <div>{dateFormatted}</div>
                          <div className="text-slate-500 text-[10px]">{timeFormatted} WIB</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{trx.itemName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{trx.sku}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              trx.category === 'BBM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : trx.category === 'FUMIGASI'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : trx.category === 'SPRAYING_FOGGING'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {trx.category === 'PERLENGKAPAN' ? 'INVENTARIS/APD' : trx.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                          -{formatNumberID(trx.quantity)} {trx.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          {linkedItem ? (
                            <span
                              className={`font-semibold ${
                                linkedItem.currentStock <= linkedItem.minimumStockThreshold
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                              title={`Sisa stok terkini di gudang: ${linkedItem.currentStock} ${linkedItem.unit}`}
                            >
                              {formatNumberID(linkedItem.currentStock)} {linkedItem.unit}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">
                              {formatNumberID(trx.newStock)} {trx.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                          {formatCurrencyIDR(subtotal)}
                        </td>
                        <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs truncate" title={trx.projectOrLocation}>
                          {trx.projectOrLocation}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {trx.operator}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onPrintSuratJalan && (
                              <button
                                type="button"
                                onClick={() => onPrintSuratJalan(trx)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                                title="Cetak Surat Jalan Pengeluaran"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onNavigateToMutations && (
                              <button
                                type="button"
                                onClick={() => onNavigateToMutations(trx.referenceNo)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
                                title="Buka Riwayat Mutasi"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteOutflow && (
                              <button
                                type="button"
                                onClick={() => setDeletingOutflow(trx)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Batalkan / Hapus Pengeluaran & Kembalikan Stok"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SECTION 1: TABEL PENGELUARAN PER HARI ================= */}
      {periodMode === 'daily' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-150">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">
                Tabel Rincian Pengeluaran Harian
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({dailyData.length} Tanggal Tercatat)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Klik pada baris tanggal untuk melihat daftar Surat Jalan & transaksi rinci
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Detail</th>
                  <th className="py-3 px-4">Tanggal Pengeluaran</th>
                  <th className="py-3 px-3 text-center">Jumlah Transaksi</th>
                  <th className="py-3 px-3 text-right">BBM (Liter)</th>
                  <th className="py-3 px-3 text-right">Fumigan (Qty)</th>
                  <th className="py-3 px-3 text-right">Spraying/Fogging</th>
                  <th className="py-3 px-3 text-right">Perlengkapan</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">
                    Total Nilai Keluar (Rp)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {dailyData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada riwayat pengeluaran barang harian yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  dailyData.map((day) => {
                    const isExpanded = !!expandedKeys[day.dateStr];
                    return (
                      <React.Fragment key={day.dateStr}>
                        <tr
                          onClick={() => toggleExpand(day.dateStr)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-amber-500/10 border-l-4 border-l-amber-400'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">
                              {formatFullDateIndo(day.dateStr)}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {day.dateStr}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {day.trxCount} SJ
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {day.fuelQty > 0 ? (
                              <span className="font-semibold text-amber-300">
                                {formatNumberID(day.fuelQty)} L
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {day.fumigasiQty > 0 ? (
                              <span className="font-semibold text-rose-300">
                                {formatNumberID(day.fumigasiQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {day.sprayingQty > 0 ? (
                              <span className="font-semibold text-emerald-300">
                                {formatNumberID(day.sprayingQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {day.gearQty > 0 ? (
                              <span className="font-semibold text-sky-300">
                                {formatNumberID(day.gearQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sm text-white">
                            {formatCurrencyIDR(day.totalValue)}
                          </td>
                        </tr>

                        {/* Expandable Drilldown for this Date */}
                        {isExpanded && (
                          <tr className="bg-slate-950 border-b border-slate-800">
                            <td colSpan={8} className="p-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
                                  <span>
                                    Rincian Transaksi Keluar pada {formatFullDateIndo(day.dateStr)}
                                  </span>
                                  <span className="text-amber-400 font-mono">
                                    {day.transactions.length} Item Dikeluarkan
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs font-sans">
                                    <thead className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                                      <tr>
                                        <th className="py-2 px-3">Waktu</th>
                                        <th className="py-2 px-3">No. Surat Jalan</th>
                                        <th className="py-2 px-3">Barang & SKU</th>
                                        <th className="py-2 px-3">Kategori</th>
                                        <th className="py-2 px-3 text-right">Jumlah</th>
                                        <th className="py-2 px-3 text-right">Harga Satuan</th>
                                        <th className="py-2 px-3 text-right">Subtotal (Rp)</th>
                                        <th className="py-2 px-3">Tujuan / Proyek</th>
                                        <th className="py-2 px-3">Petugas</th>
                                        <th className="py-2 px-2 text-center">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                      {day.transactions.map((trx) => {
                                        const unitPrice = getItemPrice(trx.itemId);
                                        const subtotal = trx.quantity * unitPrice;
                                        const timeStr = new Date(trx.timestamp).toLocaleTimeString(
                                          'id-ID',
                                          { hour: '2-digit', minute: '2-digit' }
                                        );

                                        return (
                                          <tr key={trx.id} className="hover:bg-slate-800/50">
                                            <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                                              {timeStr} WIB
                                            </td>
                                            <td className="py-2 px-3 font-mono font-semibold text-amber-400">
                                              {trx.referenceNo}
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="font-semibold text-white">
                                                {trx.itemName}
                                              </div>
                                              <div className="text-[10px] font-mono text-slate-400">
                                                {trx.sku}
                                              </div>
                                            </td>
                                            <td className="py-2 px-3">
                                              <span className="text-[10px] font-mono text-slate-300">
                                                {trx.category}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-white">
                                              {formatNumberID(trx.quantity)} {trx.unit}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-400">
                                              {formatCurrencyIDR(unitPrice)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                              {formatCurrencyIDR(subtotal)}
                                            </td>
                                            <td className="py-2 px-3 text-[11px] text-slate-300 max-w-xs truncate">
                                              {trx.projectOrLocation}
                                            </td>
                                            <td className="py-2 px-3 text-[11px] text-slate-400">
                                              {trx.operator}
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                {onPrintSuratJalan && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onPrintSuratJalan(trx);
                                                    }}
                                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                                                    title="Cetak Surat Jalan"
                                                  >
                                                    <Printer className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                                {onNavigateToMutations && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onNavigateToMutations(trx.referenceNo);
                                                    }}
                                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
                                                    title="Buka di Mutasi"
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                                {onDeleteOutflow && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setDeletingOutflow(trx);
                                                    }}
                                                    className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                                    title="Batalkan / Hapus Pengeluaran & Kembalikan Stok"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: TABEL PENGELUARAN PER BULAN ================= */}
      {periodMode === 'monthly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-150">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                Tabel Rincian Pengeluaran Bulanan
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({monthlyData.length} Bulan Rekapitulasi)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Rekapitulasi total komoditas dan rata-rata pengeluaran harian
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Detail</th>
                  <th className="py-3 px-4">Periode Bulan</th>
                  <th className="py-3 px-3 text-center">Hari Operasional</th>
                  <th className="py-3 px-3 text-center">Frekuensi SJ</th>
                  <th className="py-3 px-3 text-right">BBM (Liter)</th>
                  <th className="py-3 px-3 text-right">Fumigan (Qty)</th>
                  <th className="py-3 px-3 text-right">Spraying/Fogging</th>
                  <th className="py-3 px-3 text-right">Perlengkapan</th>
                  <th className="py-3 px-3 text-right text-slate-300">Rata-rata/Hari</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-400">
                    Total Nilai Bulanan (Rp)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada data pengeluaran bulanan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((mon) => {
                    const isExpanded = !!expandedKeys[mon.monthStr];
                    const avgDaily =
                      mon.activeDates.size > 0 ? Math.round(mon.totalValue / mon.activeDates.size) : 0;

                    return (
                      <React.Fragment key={mon.monthStr}>
                        <tr
                          onClick={() => toggleExpand(mon.monthStr)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-emerald-500/10 border-l-4 border-l-emerald-400'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{mon.monthName}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Tahun {mon.year}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="font-semibold text-slate-300">
                              {mon.activeDates.size} Hari
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-amber-400 border border-slate-700">
                              {mon.trxCount} SJ
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {mon.fuelQty > 0 ? (
                              <span className="font-semibold text-amber-300">
                                {formatNumberID(mon.fuelQty)} L
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {mon.fumigasiQty > 0 ? (
                              <span className="font-semibold text-rose-300">
                                {formatNumberID(mon.fumigasiQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {mon.sprayingQty > 0 ? (
                              <span className="font-semibold text-emerald-300">
                                {formatNumberID(mon.sprayingQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {mon.gearQty > 0 ? (
                              <span className="font-semibold text-sky-300">
                                {formatNumberID(mon.gearQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {formatCurrencyIDR(avgDaily)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sm text-white">
                            {formatCurrencyIDR(mon.totalValue)}
                          </td>
                        </tr>

                        {/* Expandable Drilldown for this Month */}
                        {isExpanded && (
                          <tr className="bg-slate-950 border-b border-slate-800">
                            <td colSpan={10} className="p-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
                                  <span>
                                    Daftar Transaksi Pengeluaran pada {mon.monthName}
                                  </span>
                                  <span className="text-emerald-400 font-mono">
                                    Total: {formatCurrencyIDR(mon.totalValue)} ({mon.transactions.length} SJ)
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs font-sans">
                                    <thead className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                                      <tr>
                                        <th className="py-2 px-3">Tanggal</th>
                                        <th className="py-2 px-3">No. SJ</th>
                                        <th className="py-2 px-3">Nama Barang</th>
                                        <th className="py-2 px-3">Kategori</th>
                                        <th className="py-2 px-3 text-right">Kuantitas</th>
                                        <th className="py-2 px-3 text-right">Subtotal</th>
                                        <th className="py-2 px-3">Proyek & Lokasi</th>
                                        <th className="py-2 px-3">Petugas</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                      {mon.transactions.map((trx) => {
                                        const subtotal = trx.quantity * getItemPrice(trx.itemId);
                                        return (
                                          <tr key={trx.id} className="hover:bg-slate-800/50">
                                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                                              {formatDateIndo(trx.timestamp)}
                                            </td>
                                            <td className="py-2 px-3 font-mono font-semibold text-amber-400">
                                              {trx.referenceNo}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-white">
                                              {trx.itemName}
                                            </td>
                                            <td className="py-2 px-3 text-[10px] font-mono text-slate-300">
                                              {trx.category}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-white">
                                              {formatNumberID(trx.quantity)} {trx.unit}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                              {formatCurrencyIDR(subtotal)}
                                            </td>
                                            <td className="py-2 px-3 text-[11px] text-slate-300 max-w-xs truncate">
                                              {trx.projectOrLocation}
                                            </td>
                                            <td className="py-2 px-3 text-[11px] text-slate-400">
                                              {trx.operator}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: TABEL PENGELUARAN PER TAHUN ================= */}
      {periodMode === 'yearly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-150">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">
                Tabel Rincian Pengeluaran Tahunan
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ({yearlyData.length} Tahun Anggaran)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Evaluasi perbandingan konsumsi barang tahun ke tahun (Year-over-Year)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Detail</th>
                  <th className="py-3 px-4">Tahun Anggaran</th>
                  <th className="py-3 px-3 text-center">Bulan Aktif</th>
                  <th className="py-3 px-3 text-center">Hari Operasional</th>
                  <th className="py-3 px-3 text-center">Total Transaksi Keluar</th>
                  <th className="py-3 px-3 text-right">BBM (Liter)</th>
                  <th className="py-3 px-3 text-right">Fumigan (Qty)</th>
                  <th className="py-3 px-3 text-right">Spraying/Fogging</th>
                  <th className="py-3 px-3 text-right">Perlengkapan</th>
                  <th className="py-3 px-4 text-right font-bold text-sky-400">
                    Total Pengeluaran Tahunan (Rp)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {yearlyData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada data pengeluaran tahunan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  yearlyData.map((yr) => {
                    const isExpanded = !!expandedKeys[yr.year];

                    return (
                      <React.Fragment key={yr.year}>
                        <tr
                          onClick={() => toggleExpand(yr.year)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-sky-500/10 border-l-4 border-l-sky-400'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-sky-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-white text-base font-mono">
                              Tahun {yr.year}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Tahun Kalender Operasional
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="font-semibold text-slate-300">
                              {yr.activeMonths.size} Bulan
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="font-semibold text-slate-300">
                              {yr.activeDays.size} Hari
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {yr.trxCount} Transaksi
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {yr.fuelQty > 0 ? (
                              <span className="font-semibold text-amber-300">
                                {formatNumberID(yr.fuelQty)} L
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {yr.fumigasiQty > 0 ? (
                              <span className="font-semibold text-rose-300">
                                {formatNumberID(yr.fumigasiQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {yr.sprayingQty > 0 ? (
                              <span className="font-semibold text-emerald-300">
                                {formatNumberID(yr.sprayingQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {yr.gearQty > 0 ? (
                              <span className="font-semibold text-sky-300">
                                {formatNumberID(yr.gearQty)} unit
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-base text-white">
                            {formatCurrencyIDR(yr.totalValue)}
                          </td>
                        </tr>

                        {/* Expandable Drilldown for this Year (Monthly Breakdown) */}
                        {isExpanded && (
                          <tr className="bg-slate-950 border-b border-slate-800">
                            <td colSpan={10} className="p-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
                                  <span>Rincian Bulanan pada Tahun {yr.year}</span>
                                  <span className="text-sky-400 font-mono">
                                    Total: {formatCurrencyIDR(yr.totalValue)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {Array.from(yr.monthlyMap.entries())
                                    .sort((a, b) => b[0].localeCompare(a[0]))
                                    .map(([mStr, val]) => (
                                      <div
                                        key={mStr}
                                        className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between font-mono"
                                      >
                                        <div>
                                          <div className="text-xs font-bold text-white">
                                            {formatMonthYearIndo(mStr)}
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            Periode {mStr}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-xs font-bold text-sky-400">
                                            {formatCurrencyIDR(val)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ================= MODAL KONFIRMASI HAPUS / BATALKAN PENGELUARAN ================= */}
      {deletingOutflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus / Batalkan Pengeluaran</h3>
                <p className="text-xs text-slate-400 font-mono">{deletingOutflow.referenceNo}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Barang:</span>
                <span className="font-bold text-white">{deletingOutflow.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Keluar:</span>
                <span className="font-bold text-rose-400 font-mono">
                  {formatNumberID(deletingOutflow.quantity)} {deletingOutflow.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan / Proyek:</span>
                <span className="text-slate-300">{deletingOutflow.projectOrLocation}</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer bg-slate-950/60 p-3 rounded-lg border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={revertStockOnDelete}
                onChange={(e) => setRevertStockOnDelete(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
              />
              <span>
                <strong className="text-amber-400 block font-semibold">
                  Kembalikan Stok ke Gudang (Sinkronisasi Otomatis)
                </strong>
                Tambah kembali {formatNumberID(deletingOutflow.quantity)} {deletingOutflow.unit} ke daftar stok fisik & inventaris barang ini secara otomatis.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingOutflow(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOutflow) {
                    onDeleteOutflow(deletingOutflow.id, revertStockOnDelete);
                  }
                  setDeletingOutflow(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Konfirmasi Hapus Pengeluaran</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
