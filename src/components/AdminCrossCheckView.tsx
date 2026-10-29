import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types/inventory';
import { FumigationJobReport } from '../types/jobs';
import { AuthUser } from '../types/auth';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Fuel,
  Beaker,
  Trash2,
  Edit3,
  Boxes,
  Clock,
  Printer,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface AdminCrossCheckViewProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  jobReports: FumigationJobReport[];
  currentUser: AuthUser;
  onUpdateJobReport: (updated: FumigationJobReport) => void;
  onDeleteJobReport: (id: string) => void;
  onDeleteTransaction: (id: string, revertStock: boolean) => void;
  onNavigateToStockOpname: () => void;
  onShowToast: (message: string) => void;
}

export const AdminCrossCheckView: React.FC<AdminCrossCheckViewProps> = ({
  items,
  transactions,
  jobReports,
  currentUser,
  onUpdateJobReport,
  onDeleteJobReport,
  onDeleteTransaction,
  onNavigateToStockOpname,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'RECONCILIATION' | 'QC_AUDIT' | 'STOCK_DEVIATIONS'>('RECONCILIATION');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Reconciliation: Compare Job Reports vs Material Outflows in Transactions
  const reconciliationData = jobReports.map((job) => {
    // Look for matching transactions by referenceNo or SPK
    const matchingMedicineTrx = transactions.find(
      (t) =>
        t.type === 'OUT' &&
        (t.referenceNo.includes(job.jobNo) ||
          job.notes?.includes(t.referenceNo) ||
          (t.itemId === job.medicineItemId && Math.abs(t.quantity - job.medicineQuantity) < 0.01))
    );

    const matchingFuelTrx = job.fuelItemId
      ? transactions.find(
          (t) =>
            t.type === 'OUT' &&
            t.itemId === job.fuelItemId &&
            (t.referenceNo.includes(job.jobNo) || Math.abs(t.quantity - (job.fuelQuantity || 0)) < 0.01)
        )
      : null;

    const isFullyMatched = Boolean(matchingMedicineTrx && (!job.fuelItemId || matchingFuelTrx));

    return {
      job,
      matchingMedicineTrx,
      matchingFuelTrx,
      isFullyMatched,
    };
  });

  // Filtered reconciliation
  const filteredReconciliation = reconciliationData.filter(({ job }) => {
    const query = searchQuery.toLowerCase();
    return (
      job.jobNo.toLowerCase().includes(query) ||
      job.clientName.toLowerCase().includes(query) ||
      job.medicineName.toLowerCase().includes(query) ||
      job.operatorName.toLowerCase().includes(query)
    );
  });

  // 2. High Priority QC Items (Belum OK or Fumigasi Ulang)
  const urgentQCJobs = jobReports.filter(
    (j) => j.qcRecommendation === 'BELUM_OK' || j.qcRecommendation === 'FUMIGASI_ULANG'
  );

  // 3. Stock Outflows total
  const totalChemicalOut = transactions
    .filter((t) => t.type === 'OUT' && (t.category === 'FUMIGASI' || t.category === 'SPRAYING_FOGGING'))
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalFuelOut = transactions
    .filter((t) => t.type === 'OUT' && t.category === 'BBM')
    .reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Kroscek &amp; Audit Terpadu (Admin Authority)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Hak Akses Penuh: Edit, Hapus, Simpan &amp; Kroscek
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Rekonsiliasi silang antara SPK pekerjaan lapangan teknisi, mutasi fisik pengeluaran obat &amp; BBM di gudang, serta status verifikasi dan rekomendasi QC.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-slate-400 font-medium flex items-center justify-between">
              <span>Rekonsiliasi SPK vs Mutasi</span>
              <FileCheck2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {reconciliationData.filter((r) => r.isFullyMatched).length} / {jobReports.length} SPK Sinkron
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Bahan kimia &amp; BBM tercatat rapi di buku mutasi</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <div className="text-amber-400 font-medium flex items-center justify-between">
              <span>Perlu Perhatian Kroscek QC</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {urgentQCJobs.length} Pekerjaan Kritis
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {jobReports.filter((j) => j.qcRecommendation === 'FUMIGASI_ULANG').length} wajib fumigasi ulang,{' '}
              {jobReports.filter((j) => j.qcRecommendation === 'BELUM_OK').length} belum OK
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <div className="text-blue-400 font-medium flex items-center justify-between">
              <span>Total Material Keluar</span>
              <Fuel className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              <span className="text-emerald-400">{formatNumberID(totalChemicalOut)} Qty Kimia</span> &bull;{' '}
              <span className="text-amber-400">{formatNumberID(totalFuelOut)} L BBM</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi pengeluaran operasional perlakuan</p>
          </div>
        </div>
      </div>

      {/* Cross Check Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 text-xs font-semibold gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('RECONCILIATION')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'RECONCILIATION'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Kroscek SPK vs Pengeluaran Gudang ({jobReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('QC_AUDIT')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'QC_AUDIT'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kroscek Rekomendasi QC ({urgentQCJobs.length} Perlu Tindakan)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onNavigateToStockOpname}
          className="text-amber-400 hover:text-amber-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Kroscek Stok Fisik (Opname) &rarr;</span>
        </button>
      </div>

      {/* Tab 1: Kroscek SPK vs Mutasi Pengeluaran Gudang */}
      {activeTab === 'RECONCILIATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SPK, Klien, atau Bahan..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Admin dapat menghapus atau mengubah catatan rekonsiliasi yang keliru.
            </div>
          </div>

          <div className="space-y-3">
            {filteredReconciliation.map(({ job, matchingMedicineTrx, matchingFuelTrx, isFullyMatched }) => (
              <div
                key={job.id}
                className={`p-4 rounded-xl border transition-all ${
                  isFullyMatched
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-amber-950/15 border-amber-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                      {job.jobNo}
                    </span>
                    <span className="font-bold text-white text-sm">{job.title}</span>
                    <span className="text-slate-400">&bull; {job.clientName}</span>
                    <span className="text-slate-500">&bull; Teknisi: {job.operatorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFullyMatched ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mutasi Gudang Sinkron</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Perlu Kroscek Mutasi</span>
                      </span>
                    )}

                    {/* Admin Delete Action */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Admin Action: Hapus permanen SPK ${job.jobNo}?`)) {
                          onDeleteJobReport(job.id);
                          onShowToast(`SPK ${job.jobNo} berhasil dihapus.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Hapus SPK (Khusus Admin)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comparison Grid: SPK vs Mutasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  {/* Left: Data SPK yang diinput */}
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Data Utama SPK Fumigasi:</span>
                    </div>
                    <div className="text-slate-200">
                      <strong>Bahan Baku:</strong> <span className="text-white font-medium">{job.rawMaterialName || job.targetObject}</span>
                    </div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      <span>Tutup: <strong className="text-blue-300">{job.closingDate || job.executionDate}</strong></span>
                      <span className="mx-1.5 text-slate-500">&bull;</span>
                      <span>Buka: <strong className="text-amber-300">{job.openingDate || job.aerationDate || '-'}</strong></span>
                    </div>
                    <div className="text-slate-200">
                      <strong>Jumlah Obat:</strong>{' '}
                      <span className="text-rose-400 font-mono font-bold">
                        {formatNumberID(job.medicineQuantity)} {job.medicineUnit}
                      </span>{' '}
                      ({job.medicineName}) {job.medicineBatchNo && <span className="text-slate-500">[{job.medicineBatchNo}]</span>}
                    </div>
                    {job.fuelName && (
                      <div className="text-slate-200">
                        <strong>BBM:</strong> {job.fuelName} &bull;{' '}
                        <span className="text-amber-400 font-mono font-bold">
                          {formatNumberID(job.fuelQuantity || 0)} {job.fuelUnit || 'Liter'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Record Mutasi Keluar di Gudang */}
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pencatatan Buku Mutasi Gudang:</span>
                    </div>
                    {matchingMedicineTrx ? (
                      <div className="text-slate-300">
                        <span className="text-emerald-400 font-mono font-semibold">[TERCATAT]</span> Ref:{' '}
                        {matchingMedicineTrx.referenceNo} &bull; Qty Out:{' '}
                        <span className="font-mono font-bold text-white">
                          {formatNumberID(matchingMedicineTrx.quantity)} {matchingMedicineTrx.unit}
                        </span>
                      </div>
                    ) : (
                      <div className="text-amber-400 italic">
                        Belum ada mutasi keluar yang terhubung otomatis untuk obat ini.
                      </div>
                    )}

                    {job.fuelItemId && (
                      matchingFuelTrx ? (
                        <div className="text-slate-300">
                          <span className="text-emerald-400 font-mono font-semibold">[TERCATAT]</span> Ref:{' '}
                          {matchingFuelTrx.referenceNo} &bull; BBM Out:{' '}
                          <span className="font-mono font-bold text-white">
                            {formatNumberID(matchingFuelTrx.quantity)} {matchingFuelTrx.unit}
                          </span>
                        </div>
                      ) : (
                        <div className="text-amber-400 italic">
                          Belum ada mutasi keluar BBM yang terhubung untuk SPK ini.
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Kroscek Rekomendasi & Hasil QC */}
      {activeTab === 'QC_AUDIT' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <h4 className="font-bold text-white text-sm mb-1">
              Audit Hasil Inspeksi QC &amp; Tindak Lanjut Lapangan
            </h4>
            <p className="text-slate-400">
              Admin bertindak sebagai pengawas tertinggi untuk mengkroscek apakah tim lapangan sudah menindaklanjuti instruksi QC, terutama kasus kebocoran dosis dan perintah fumigasi ulang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentQCJobs.map((job) => (
              <div
                key={job.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  job.qcRecommendation === 'FUMIGASI_ULANG'
                    ? 'bg-rose-950/20 border-rose-500/40 text-slate-200'
                    : 'bg-amber-950/20 border-amber-500/40 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-950 text-amber-400">
                    {job.jobNo}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      job.qcRecommendation === 'FUMIGASI_ULANG'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {job.qcRecommendation === 'FUMIGASI_ULANG' ? 'WAJIB FUMIGASI ULANG' : 'BELUM OK / MONITORING'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{job.title}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Klien: <strong className="text-slate-300">{job.clientName}</strong> &bull; {job.location}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-rose-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Catatan Resmi Inspektur QC ({job.qcInspector || 'Tim QC'}):
                  </div>
                  <p className="text-slate-300 italic">{job.qcRecommendationNotes || 'Menunggu input evaluasi...'}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Teknisi: {job.operatorName}
                  </span>

                  {/* Admin Override Action */}
                  <button
                    type="button"
                    onClick={() => {
                      const newNotes = prompt(
                        'Admin Kroscek: Tambahkan instruksi tindak lanjut untuk SPK ini:',
                        job.qcRecommendationNotes || ''
                      );
                      if (newNotes !== null) {
                        onUpdateJobReport({
                          ...job,
                          qcRecommendationNotes: newNotes,
                        });
                        onShowToast(`Catatan kroscek admin berhasil disimpan.`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition-colors"
                  >
                    Tindak Lanjut Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
