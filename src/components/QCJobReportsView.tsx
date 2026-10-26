import React, { useState } from 'react';
import { FumigationJobReport, QCRecommendation, QCApprovalStatus } from '../types/jobs';
import { AuthUser } from '../types/auth';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Search,
  Filter,
  Microscope,
  Fuel,
  Beaker,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  User,
  X,
  Check,
  Ban,
  Trash2,
  Edit,
  Printer,
  ChevronRight,
  Flame,
  Bug,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface QCJobReportsViewProps {
  jobReports: FumigationJobReport[];
  currentUser: AuthUser;
  onUpdateJobReport: (updatedReport: FumigationJobReport) => void;
  onDeleteJobReport?: (id: string) => void;
  onOpenNewJobModal?: () => void;
  onShowToast: (message: string) => void;
}

export const QCJobReportsView: React.FC<QCJobReportsViewProps> = ({
  jobReports,
  currentUser,
  onUpdateJobReport,
  onDeleteJobReport,
  onOpenNewJobModal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal review state
  const [selectedJobForReview, setSelectedJobForReview] = useState<FumigationJobReport | null>(null);
  const [reviewRecommendation, setReviewRecommendation] = useState<QCRecommendation>('OK');
  const [reviewApproval, setReviewApproval] = useState<QCApprovalStatus>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const canEvaluate = currentUser.permissions.canEvaluateQCJobs || currentUser.role === 'ADMIN';
  const canDelete = currentUser.permissions.canDeleteItems || currentUser.role === 'ADMIN';

  // Open evaluation modal
  const handleOpenReview = (job: FumigationJobReport) => {
    setSelectedJobForReview(job);
    setReviewRecommendation(job.qcRecommendation === 'PENDING' ? 'OK' : job.qcRecommendation);
    setReviewApproval(job.qcApprovalStatus === 'PENDING' ? 'APPROVED' : job.qcApprovalStatus);
    setReviewNotes(
      job.qcRecommendationNotes ||
        (job.qcRecommendation === 'OK'
          ? 'Konsentrasi gas dan waktu paparan memenuhi standar karantina. Mortalitas hama 100%. Lolos uji QC.'
          : '')
    );
  };

  const handleSaveReview = () => {
    if (!selectedJobForReview) return;

    const updated: FumigationJobReport = {
      ...selectedJobForReview,
      qcRecommendation: reviewRecommendation,
      qcApprovalStatus: reviewApproval,
      qcInspector: currentUser.name,
      qcVerifiedAt: new Date().toISOString(),
      qcRecommendationNotes: reviewNotes.trim(),
    };

    onUpdateJobReport(updated);
    setSelectedJobForReview(null);

    let statusText = 'Direkomendasikan OK & Disetujui';
    if (reviewRecommendation === 'BELUM_OK') statusText = 'Ditandai Belum OK (Perlu Tindakan)';
    if (reviewRecommendation === 'FUMIGASI_ULANG') statusText = 'Wajib Dilakukan Fumigasi Ulang';
    onShowToast(`Laporan ${updated.jobNo} berhasil diverifikasi: ${statusText}`);
  };

  // Filtered jobs
  const filteredJobs = jobReports.filter((job) => {
    const matchesSearch =
      job.jobNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.medicineName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRecommendation !== 'ALL') {
      if (filterRecommendation === 'PENDING' && job.qcApprovalStatus !== 'PENDING') return false;
      if (filterRecommendation === 'OK' && job.qcRecommendation !== 'OK') return false;
      if (filterRecommendation === 'BELUM_OK' && job.qcRecommendation !== 'BELUM_OK') return false;
      if (filterRecommendation === 'FUMIGASI_ULANG' && job.qcRecommendation !== 'FUMIGASI_ULANG') return false;
    }

    if (filterType !== 'ALL' && job.jobType !== filterType) {
      return false;
    }

    return true;
  });

  // Summary counts
  const totalCount = jobReports.length;
  const pendingCount = jobReports.filter((j) => j.qcApprovalStatus === 'PENDING').length;
  const okCount = jobReports.filter((j) => j.qcRecommendation === 'OK' && j.qcApprovalStatus === 'APPROVED').length;
  const belumOkCount = jobReports.filter((j) => j.qcRecommendation === 'BELUM_OK').length;
  const fumigasiUlangCount = jobReports.filter((j) => j.qcRecommendation === 'FUMIGASI_ULANG').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Role Notice */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Microscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Laporan Pekerjaan Fumigasi &amp; Spraying Fogging
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUser.role === 'QC' ? 'Portal Khusus Tim QC' : 'Inspeksi & Kroscek QC'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {currentUser.role === 'QC'
                  ? 'Verifikasi laporan pekerjaan lapangan dari teknisi/operator. Berikan rekomendasi hasil uji (OK, Belum OK, atau Fumigasi Ulang) dan terbitkan status Approve / Reject resmi.'
                  : 'Monitoring evaluasi mutu pekerjaan perlakuan hama fumigasi dan pest control fogging sesuai standar Barantan ISPM-15.'}
              </p>
            </div>
          </div>

          {onOpenNewJobModal && (currentUser.permissions.canInputJobReports || currentUser.role === 'ADMIN') && (
            <button
              type="button"
              onClick={onOpenNewJobModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Input Pekerjaan Baru</span>
            </button>
          )}
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 font-medium">Total Laporan</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{totalCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
            <div className="text-blue-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Menunggu QC</span>
            </div>
            <div className="text-xl font-bold font-mono text-blue-300 mt-0.5">{pendingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <div className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rekomendasi OK</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{okCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <div className="text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Belum OK</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">{belumOkCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 col-span-2 sm:col-span-1">
            <div className="text-rose-400 font-medium flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fumigasi Ulang</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-300 mt-0.5">{fumigasiUlangCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. SPK, Kapal, Klien, Lokasi, Bahan Kimia, atau Operator..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterRecommendation('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              filterRecommendation === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua ({jobReports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRecommendation('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              filterRecommendation === 'PENDING'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Menunggu Review ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRecommendation('OK')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              filterRecommendation === 'OK'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>OK ({okCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRecommendation('BELUM_OK')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              filterRecommendation === 'BELUM_OK'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Belum OK ({belumOkCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRecommendation('FUMIGASI_ULANG')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              filterRecommendation === 'FUMIGASI_ULANG'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Fumigasi Ulang ({fumigasiUlangCount})</span>
          </button>
        </div>

        {/* Jenis Pekerjaan Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shrink-0"
        >
          <option value="ALL">Semua Jenis Pekerjaan</option>
          <option value="FUMIGASI">Fumigasi Kapal / Gudang / Silo</option>
          <option value="SPRAYING_FOGGING">Spraying &amp; Fogging Pest Control</option>
        </select>
      </div>

      {/* List of Job Reports */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">Tidak ada laporan pekerjaan yang sesuai</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Silakan ubah filter pencarian atau buat input pekerjaan baru dari teknisi lapangan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const isFumigasi = job.jobType === 'FUMIGASI';
            const isApproved = job.qcApprovalStatus === 'APPROVED';
            const isPending = job.qcApprovalStatus === 'PENDING';
            const isRejected = job.qcApprovalStatus === 'REJECTED';

            return (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-lg space-y-4"
              >
                {/* Header row: SPK No, Badges & Quick Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-400">
                      {job.jobNo}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded flex items-center gap-1 ${
                        isFumigasi
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isFumigasi ? <Flame className="w-3 h-3 text-indigo-400" /> : <Bug className="w-3 h-3 text-emerald-400" />}
                      <span>{isFumigasi ? 'FUMIGASI' : 'SPRAYING & FOGGING'}</span>
                    </span>

                    {/* Recommendation Badge */}
                    {job.qcRecommendation === 'OK' && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Rekomendasi: OK (Lolos Standar)</span>
                      </span>
                    )}
                    {job.qcRecommendation === 'BELUM_OK' && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rekomendasi: Belum OK (Perlu Tindakan)</span>
                      </span>
                    )}
                    {job.qcRecommendation === 'FUMIGASI_ULANG' && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span>Rekomendasi: Wajib Fumigasi Ulang</span>
                      </span>
                    )}
                    {job.qcRecommendation === 'PENDING' && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Menunggu Rekomendasi QC</span>
                      </span>
                    )}

                    {/* Approval Status Badge */}
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isApproved
                          ? 'bg-emerald-600 text-white'
                          : isRejected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING APPROVAL'}
                    </span>
                  </div>

                  {/* Actions for QC and Admin */}
                  <div className="flex items-center gap-2">
                    {canEvaluate && (
                      <button
                        type="button"
                        onClick={() => handleOpenReview(job)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Microscope className="w-3.5 h-3.5" />
                        <span>Beri Rekomendasi &amp; Approve</span>
                      </button>
                    )}

                    {canDelete && onDeleteJobReport && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus laporan pekerjaan ${job.jobNo}?`)) {
                            onDeleteJobReport(job.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                        title="Hapus Laporan Pekerjaan (Khusus Admin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Job Title & Client Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <h3 className="text-base font-bold text-white">{job.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        {job.clientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {job.executionDate} {job.aerationDate ? `&bull; Aerasi: ${job.aerationDate}` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-300">Target Komoditas:</span> {job.targetObject}
                      {job.targetPest && (
                        <span> &bull; <span className="font-semibold text-slate-300">Hama:</span> {job.targetPest}</span>
                      )}
                    </div>
                  </div>

                  {/* Material Outflow Summary (Obat & BBM) */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center justify-between">
                      <span>Bahan Digunakan (Keluar Gudang):</span>
                      <span className="text-emerald-400 font-mono">Terkonfirmasi</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Beaker className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-slate-200 font-medium">{job.medicineName}</div>
                        <div className="font-mono text-amber-400 font-bold">
                          {formatNumberID(job.medicineQuantity)} {job.medicineUnit}{' '}
                          {job.medicineBatchNo && <span className="text-slate-500 font-normal">({job.medicineBatchNo})</span>}
                        </div>
                      </div>
                    </div>
                    {job.fuelName && job.fuelQuantity && (
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-800/60">
                        <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-slate-300">{job.fuelName}</div>
                          <div className="font-mono text-emerald-400 font-bold">
                            {formatNumberID(job.fuelQuantity)} {job.fuelUnit || 'Liter'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Parameters & Operator */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/70">
                  <div className="flex items-center gap-4 flex-wrap">
                    {job.gasConcentrationPpm !== undefined && (
                      <span className="font-mono text-slate-300">
                        Konsentrasi Gas: <strong className="text-amber-400">{job.gasConcentrationPpm} ppm</strong>
                      </span>
                    )}
                    {job.exposureHours !== undefined && (
                      <span className="font-mono text-slate-300">
                        Durasi Paparan: <strong className="text-white">{job.exposureHours} Jam</strong>
                      </span>
                    )}
                    {job.tarpCondition && (
                      <span className="text-slate-400 truncate max-w-xs sm:max-w-md">
                        Sungkup: <span className="text-slate-300">{job.tarpCondition}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Teknisi: <strong className="text-slate-300">{job.operatorName}</strong></span>
                  </div>
                </div>

                {/* Official QC Recommendation & Notes Box */}
                {job.qcRecommendationNotes && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      job.qcRecommendation === 'OK'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : job.qcRecommendation === 'BELUM_OK'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Catatan &amp; Evaluasi Resmi Inspektur QC ({job.qcInspector || 'Tim QC'}):
                      </span>
                      {job.qcVerifiedAt && (
                        <span className="font-mono text-[10px] opacity-75">
                          {new Date(job.qcVerifiedAt).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{job.qcRecommendationNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QC Evaluation & Approval Modal */}
      {selectedJobForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Verifikasi Rekomendasi &amp; Approval QC
                  </h3>
                  <p className="text-xs text-slate-400">
                    No. SPK: <span className="text-amber-400 font-mono font-bold">{selectedJobForReview.jobNo}</span> &bull; {selectedJobForReview.clientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForReview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Job summary card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-sm text-white">{selectedJobForReview.title}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500">Komoditas:</span> {selectedJobForReview.targetObject}
                  </div>
                  <div>
                    <span className="text-slate-500">Teknisi:</span> {selectedJobForReview.operatorName}
                  </div>
                  <div>
                    <span className="text-slate-500">Obat Digunakan:</span> {selectedJobForReview.medicineName} ({selectedJobForReview.medicineQuantity} {selectedJobForReview.medicineUnit})
                  </div>
                  <div>
                    <span className="text-slate-500">BBM Digunakan:</span> {selectedJobForReview.fuelName || '-'} ({selectedJobForReview.fuelQuantity || 0} Liter)
                  </div>
                  {selectedJobForReview.gasConcentrationPpm !== undefined && (
                    <div>
                      <span className="text-slate-500">Gas Terukur:</span> {selectedJobForReview.gasConcentrationPpm} ppm
                    </div>
                  )}
                  {selectedJobForReview.exposureHours !== undefined && (
                    <div>
                      <span className="text-slate-500">Waktu Paparan:</span> {selectedJobForReview.exposureHours} Jam
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Pilih Rekomendasi QC */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  1. Pilih Rekomendasi Mutu Hasil Pekerjaan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewRecommendation('OK');
                      setReviewApproval('APPROVED');
                      if (!reviewNotes || reviewNotes.includes('Belum') || reviewNotes.includes('Fumigasi ulang')) {
                        setReviewNotes('Konsentrasi gas dan waktu paparan memenuhi standar karantina. Mortalitas hama 100%. Lolos uji QC & dinyatakan OK.');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      reviewRecommendation === 'OK'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>OK (Selesai / Lolos)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standar konsentrasi gas &amp; lethal dose tercapai. Hama target mati total.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewRecommendation('BELUM_OK');
                      setReviewApproval('PENDING');
                      if (!reviewNotes || reviewNotes.includes('Lolos')) {
                        setReviewNotes('Konsentrasi gas menurun di bawah batas kritis. Diperlukan penambahan waktu paparan 24 jam & perbaikan penutup terpal.');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      reviewRecommendation === 'BELUM_OK'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-400 mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Belum OK (Tindakan)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Konsentrasi gas fluktuatif atau sungkup perlu diperbaiki sebelum aerasi.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewRecommendation('FUMIGASI_ULANG');
                      setReviewApproval('REJECTED');
                      if (!reviewNotes || reviewNotes.includes('Lolos')) {
                        setReviewNotes('Terjadi kebocoran gas masif / terpal sobek. Efikasi perlakuan gagal. Wajib dilakukan fumigasi ulang secara menyeluruh.');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      reviewRecommendation === 'FUMIGASI_ULANG'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-400 mb-1">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Fumigasi Ulang</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Perlakuan gagal total / hama masih aktif. Pekerjaan wajib diulang dari awal.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Status Approval */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  2. Status Approval Dokumen QC:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewApproval('APPROVED')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      reviewApproval === 'APPROVED'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve (Disetujui)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewApproval('PENDING')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      reviewApproval === 'PENDING'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Pending / Tunda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewApproval('REJECTED')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      reviewApproval === 'REJECTED'
                        ? 'bg-rose-600 text-white shadow-lg'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    <span>Reject / Ditolak</span>
                  </button>
                </div>
              </div>

              {/* 3. Catatan Rekomendasi QC */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  3. Catatan Rekomendasi &amp; Berita Acara QC:
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Tuliskan catatan teknis hasil sampling gas, kondisi sungkup, keberadaan hama hidup, dan instruksi penanganan..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Inspector signature info */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Inspektur QC: <strong className="text-emerald-400">{currentUser.name}</strong></span>
                <span>Standar Barantan ISPM-15</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setSelectedJobForReview(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Rekomendasi &amp; Update Status</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
