import React, { useState } from 'react';
import { RawMaterialRecommendation, RecommendationStatus } from '../types/recommendations';
import { AuthUser } from '../types/auth';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  Bug,
  Building2,
  Calendar,
  Beaker,
  Fuel,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Trash2,
  Edit3,
  ExternalLink,
  Info,
  Scale,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface RawMaterialRecommendationsViewProps {
  recommendations: RawMaterialRecommendation[];
  currentUser: AuthUser;
  forcedTreatmentType?: 'FUMIGASI' | 'SPRAYING_FOGGING';
  onOpenNewModal: (preselectedType?: 'FUMIGASI' | 'SPRAYING_FOGGING') => void;
  onEditRecommendation?: (rec: RawMaterialRecommendation) => void;
  onDeleteRecommendation?: (id: string) => void;
  onExecuteAsSPK?: (rec: RawMaterialRecommendation) => void; // Operator / Admin can execute into SPK
  onOpenExecutionModal?: (rec: RawMaterialRecommendation) => void; // Perintah sudah dilakukan Fumigasi/Spraying/Fogging
  onUpdateStatus?: (id: string, status: RecommendationStatus, adminNotes?: string) => void;
  onShowToast: (message: string) => void;
}

export const RawMaterialRecommendationsView: React.FC<RawMaterialRecommendationsViewProps> = ({
  recommendations,
  currentUser,
  forcedTreatmentType,
  onOpenNewModal,
  onEditRecommendation,
  onDeleteRecommendation,
  onExecuteAsSPK,
  onOpenExecutionModal,
  onUpdateStatus,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus | 'ALL'>('ALL');
  const [treatmentFilter, setTreatmentFilter] = useState<'ALL' | 'FUMIGASI' | 'SPRAYING_FOGGING'>(
    forcedTreatmentType || 'ALL'
  );

  const isQC = currentUser.role === 'QC';
  const isOperator = currentUser.role === 'OPERATOR';
  const isAdmin = currentUser.role === 'ADMIN';

  // Scope recommendations by forced treatment type or interactive filter
  const scopedByType = recommendations.filter((rec) => {
    const recType = rec.recommendedTreatmentType || 'FUMIGASI';
    if (forcedTreatmentType) {
      if (forcedTreatmentType === 'FUMIGASI') {
        return recType === 'FUMIGASI' || recType === 'KOMBINASI';
      }
      return recType === 'SPRAYING_FOGGING' || recType === 'KOMBINASI';
    }
    if (treatmentFilter !== 'ALL') {
      return recType === treatmentFilter || recType === 'KOMBINASI';
    }
    return true;
  });

  // Metrics
  const totalCount = scopedByType.length;
  const pendingCount = scopedByType.filter((r) => r.status === 'TERKIRIM').length;
  const inProgressCount = scopedByType.filter((r) => r.status === 'DIPROSES').length;
  const completedCount = scopedByType.filter((r) => r.status === 'SELESAI').length;

  // Filter
  const filteredRecommendations = scopedByType.filter((rec) => {
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesSearch =
      rec.commodityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.batchOrLotNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.targetPests.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.recommendationNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: RecommendationStatus) => {
    switch (status) {
      case 'TERKIRIM':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            TERKIRIM (MENUNGGU EKSEKUSI)
          </span>
        );
      case 'DIPROSES':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            SEDANG DIPROSES OPERATOR
          </span>
        );
      case 'SELESAI':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SELESAI DIKERJAKAN
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            DIBATALKAN
          </span>
        );
    }
  };

  const getInfestationBadge = (level: string) => {
    switch (level) {
      case 'BERAT_KRITIS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
            BERAT / KRITIS
          </span>
        );
      case 'SEDANG':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
            SEDANG
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
            RINGAN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-xl border ${
                forcedTreatmentType === 'FUMIGASI'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : forcedTreatmentType === 'SPRAYING_FOGGING'
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {forcedTreatmentType === 'FUMIGASI' ? (
                <Flame className="w-5 h-5 text-amber-400" />
              ) : forcedTreatmentType === 'SPRAYING_FOGGING' ? (
                <Bug className="w-5 h-5 text-sky-400" />
              ) : (
                <FileCheck2 className="w-5 h-5" />
              )}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {forcedTreatmentType === 'FUMIGASI'
                ? 'Rekomendasi Fumigasi Bahan Baku & Komoditas'
                : forcedTreatmentType === 'SPRAYING_FOGGING'
                ? 'Rekomendasi Spraying & Fogging Bahan Baku'
                : 'Rekomendasi Bahan Baku & Komoditas'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase">
              QC &bull; Operator &bull; Admin
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            {forcedTreatmentType === 'FUMIGASI'
              ? 'Laporan rekomendasi resmi dari Inspektur QC untuk komoditas bahan baku (Beras, Jagung, Kopi, Pallet ISPM-15, dll) yang memerlukan fumigasi sungkup gas kedap udara (Phosphine PH3 / CH3Br) tanpa BBM mesin. Terhubung langsung ke Operator untuk eksekusi dan Admin.'
              : forcedTreatmentType === 'SPRAYING_FOGGING'
              ? 'Laporan rekomendasi resmi dari Inspektur QC untuk spraying komoditas dan thermal fogging / ULV ruang gudang menggunakan mesin & BBM pelarut. Terhubung langsung ke Operator dan Admin.'
              : 'Laporan rekomendasi resmi dari Inspektur QC untuk komoditas bahan baku (Fumigasi Gas & Spraying/Fogging Mesin). Terhubung langsung ke Operator dan Admin.'}
          </p>
        </div>

        {/* Action Button */}
        {(isQC || isAdmin) && (
          <button
            type="button"
            onClick={() => onOpenNewModal(forcedTreatmentType)}
            className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
              forcedTreatmentType === 'FUMIGASI'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                : forcedTreatmentType === 'SPRAYING_FOGGING'
                ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {forcedTreatmentType === 'FUMIGASI'
                ? '+ Buat Rekomendasi Fumigasi'
                : forcedTreatmentType === 'SPRAYING_FOGGING'
                ? '+ Buat Rekomendasi Spraying & Fogging'
                : '+ Buat Rekomendasi Bahan Baku'}
            </span>
          </button>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Rekomendasi</span>
          </div>
          <div className="text-xl font-black text-white font-mono">{totalCount} Batch</div>
          <div className="text-[10px] text-slate-400">Seluruh Komoditas</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
            <span>Menunggu Eksekusi</span>
          </div>
          <div className="text-xl font-black text-blue-400 font-mono">{pendingCount} Perlu SPK</div>
          <div className="text-[10px] text-slate-400">Siap Dikerjakan Operator</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Sedang Berjalan</span>
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">{inProgressCount} SPK</div>
          <div className="text-[10px] text-slate-400">Proses Lapangan</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Selesai Fumigasi</span>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">{completedCount} Komoditas</div>
          <div className="text-[10px] text-slate-400">Bebas Hama &amp; Aerasi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komoditas, lot, lokasi, atau hama..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'Semua' },
              { key: 'TERKIRIM', label: `Terkirim (${pendingCount})` },
              { key: 'DIPROSES', label: `Diproses (${inProgressCount})` },
              { key: 'SELESAI', label: `Selesai (${completedCount})` },
            ] as { key: RecommendationStatus | 'ALL'; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === item.key
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role Notice Banner */}
      {isOperator && pendingCount > 0 && (
        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>
              <strong>Perhatian Operator:</strong> Terdapat <strong>{pendingCount} rekomendasi bahan baku</strong> dari QC yang menunggu dieksekusi. Klik tombol <strong>"⚡ Eksekusi Jadi SPK"</strong> untuk memproses dan mengambil obat dari gudang secara otomatis!
            </span>
          </div>
        </div>
      )}

      {/* List of Recommendations */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            Tidak ada rekomendasi bahan baku yang cocok dengan pencarian atau filter status.
          </div>
        ) : (
          filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-5 rounded-2xl border transition-all ${
                rec.status === 'TERKIRIM'
                  ? 'bg-slate-900/95 border-blue-500/40 shadow-lg shadow-blue-500/5'
                  : rec.status === 'DIPROSES'
                  ? 'bg-slate-900/90 border-amber-500/40'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800">
                    {rec.recommendationNo}
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Lot: {rec.batchOrLotNo}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      (rec.recommendedTreatmentType || 'FUMIGASI') === 'FUMIGASI'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {(rec.recommendedTreatmentType || 'FUMIGASI') === 'FUMIGASI' ? (
                      <>
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>FUMIGASI (BEBAS BBM)</span>
                      </>
                    ) : (
                      <>
                        <Bug className="w-3 h-3 text-sky-400" />
                        <span>SPRAYING &amp; FOGGING</span>
                      </>
                    )}
                  </span>
                  {getInfestationBadge(rec.infestationLevel)}
                  {getStatusBadge(rec.status)}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Perintah: Sudah Dilakukan Fumigasi / Spraying / Fogging */}
                  {(isOperator || isAdmin) && onOpenExecutionModal && (
                    <button
                      type="button"
                      onClick={() => onOpenExecutionModal(rec)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                        rec.status === 'SELESAI'
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                      }`}
                      title="Perintah konfirmasi realisasi pengerjaan Fumigasi, Spraying, atau Fogging"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {rec.status === 'SELESAI'
                          ? '✓ Update Realisasi Pengerjaan'
                          : '✓ Sudah Dilakukan Fumigasi / Spraying / Fogging'}
                      </span>
                    </button>
                  )}

                  {/* Operator: Eksekusi Jadi SPK */}
                  {(isOperator || isAdmin) && rec.status === 'TERKIRIM' && onExecuteAsSPK && (
                    <button
                      type="button"
                      onClick={() => onExecuteAsSPK(rec)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                    >
                      <span>⚡ Buat SPK</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Linked SPK badge if in progress or completed */}
                  {rec.linkedSpkNo && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      SPK: <strong>{rec.linkedSpkNo}</strong>
                    </span>
                  )}

                  {/* Admin / QC Edit */}
                  {(isAdmin || isQC) && rec.status !== 'SELESAI' && onEditRecommendation && (
                    <button
                      type="button"
                      onClick={() => onEditRecommendation(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Edit Rekomendasi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Admin Delete */}
                  {isAdmin && onDeleteRecommendation && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus permanen rekomendasi ${rec.recommendationNo}?`)) {
                          onDeleteRecommendation(rec.id);
                          onShowToast(`Rekomendasi ${rec.recommendationNo} dihapus.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Hapus Rekomendasi (Admin)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3 text-xs">
                {/* Column 1: Info Komoditas & Temuan Hama */}
                <div className="md:col-span-5 space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{rec.commodityName}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Jumlah: <strong className="text-white font-mono">{formatNumberID(rec.quantity)} {rec.quantityUnit}</strong>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lokasi: <strong className="text-slate-200">{rec.location}</strong></span>
                    </div>
                    {rec.storageCondition && (
                      <div className="text-[11px] text-slate-400">
                        Kondisi: {rec.storageCondition}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-300">
                      <Bug className="w-3.5 h-3.5 text-rose-400" />
                      <span>Hama Ditemukan QC:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-mono">{rec.targetPests}</p>
                  </div>
                </div>

                {/* Column 2: Rekomendasi Obat & Bahan */}
                <div className="md:col-span-4 space-y-2">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Beaker className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Anjuran Bahan Kimia:</span>
                    </div>
                    <div className="text-white font-semibold">{rec.recommendedMedicineName}</div>
                    <div className="text-slate-300 text-[11px]">
                      Dosis: <span className="font-mono text-amber-300">{rec.recommendedDosage}</span>
                    </div>
                    {rec.estimatedMedicineQty > 0 && (
                      <div className="text-slate-400 text-[11px]">
                        Estimasi Kebutuhan: <strong className="text-white font-mono">{formatNumberID(rec.estimatedMedicineQty)} {rec.medicineUnit}</strong>
                      </div>
                    )}

                    {rec.recommendedTreatmentType !== 'FUMIGASI' && rec.recommendedFuelName && (
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-amber-400" />
                        <span>BBM: {rec.recommendedFuelName} ({rec.estimatedFuelQty} Liter)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                    <span>Min. Aerasi: {rec.minimumAerationHours} Jam</span>
                    <span>Batas Eksekusi: <strong className="text-rose-400">{rec.targetFumigationDeadline}</strong></span>
                  </div>
                </div>

                {/* Column 3: Catatan K3 & Pelaksana */}
                <div className="md:col-span-3 space-y-2 flex flex-col justify-between">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Catatan K3 Barantan:</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed italic">
                      "{rec.safetyNotes}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                    <div>
                      Inspektur QC: <strong className="text-slate-300">{rec.inspectorName}</strong>
                    </div>
                    {rec.processedByOperator && (
                      <div>
                        Dikerjakan oleh: <strong className="text-blue-300">{rec.processedByOperator}</strong>
                      </div>
                    )}
                    <div className="font-mono text-[10px] text-slate-400">
                      Tgl Inspeksi: {rec.inspectionDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* REALISASI PENGERJAAN: SUDAH DILAKUKAN FUMIGASI / SPRAYING / FOGGING */}
              {rec.treatmentExecutionRecord && (
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/30 border border-emerald-500/30 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-300 text-xs tracking-wide">
                          SUDAH DILAKUKAN {rec.treatmentExecutionRecord.treatmentType}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold">
                          SELESAI
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tgl Pengerjaan: <strong className="text-white">{rec.treatmentExecutionRecord.executionDate}</strong></span>
                    </div>
                  </div>

                  {/* 4 Required Input Fields Specified by User */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    {/* 1. Tanggal Pengerjaan */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>Tanggal Pengerjaan</span>
                      </div>
                      <div className="font-bold text-white font-mono text-xs">
                        {rec.treatmentExecutionRecord.executionDate}
                      </div>
                    </div>

                    {/* 2. Obat yang Digunakan */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Beaker className="w-3 h-3 text-amber-400" />
                        <span>Obat Digunakan</span>
                      </div>
                      <div className="font-bold text-amber-300 truncate text-xs" title={rec.treatmentExecutionRecord.usedMedicineName}>
                        {rec.treatmentExecutionRecord.usedMedicineName}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        Jumlah: <strong>{rec.treatmentExecutionRecord.usedMedicineQuantity} {rec.treatmentExecutionRecord.usedMedicineUnit}</strong>
                      </div>
                    </div>

                    {/* 3. Gudang */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-400" />
                        <span>Gudang / Lokasi</span>
                      </div>
                      <div className="font-bold text-blue-200 text-xs truncate" title={rec.treatmentExecutionRecord.warehouseLocation}>
                        {rec.treatmentExecutionRecord.warehouseLocation}
                      </div>
                    </div>

                    {/* 4. Jumlah Tonase Bahan Baku */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-purple-400" />
                        <span>Tonase Bahan Baku</span>
                      </div>
                      <div className="font-bold text-purple-200 font-mono text-sm">
                        {formatNumberID(rec.treatmentExecutionRecord.treatedTonnage)}{' '}
                        <span className="text-[10px] text-slate-400 font-sans">{rec.treatmentExecutionRecord.tonnageUnit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pelaksana & Catatan */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                    <div>
                      Pelaksana: <strong className="text-white font-medium">{rec.treatmentExecutionRecord.executedBy}</strong>
                      {rec.treatmentExecutionRecord.executionNotes && (
                        <span className="text-slate-400 ml-2 italic">
                          &bull; "{rec.treatmentExecutionRecord.executionNotes}"
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 font-mono">
                      Waktu Verifikasi: {new Date(rec.treatmentExecutionRecord.completedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
